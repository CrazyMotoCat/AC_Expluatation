# ADR-013 — Target-aware production authorization for geographic data

- **Статус:** Accepted
- **Дата:** 2026-09-26
- **Связь:** уточняет ADR-007 для `AUTH-SCOPE-01`; не заменяет его

## Контекст

Bearer JWT, локальный профиль, роли, `role_permissions`, `access_assignments` и
собственные working contexts уже существуют. Production `IPermissionGrantSource`
зарегистрирован как `NoAccessAssignmentPermissionGrantSource`, а
`HasGrantAsync(userId, permissionId)` не получает context или target. Поэтому
permission-protected business routes сейчас остаются закрытыми. Простой переход
на проверку role-permission открыл бы данные за пределами scope и нарушил бы
ADR-007.

## Решение владельца

1. `sites.read` для списков Territorial Zones и Regions возвращает только
   записи внутри эффективного scope действующего назначения в валидном
   собственном рабочем контексте. Permission code без такого назначения не
   разрешает ни список, ни отдельную запись. Нельзя сначала получать полный
   список и затем полагаться на фильтрацию в браузере.
2. Для каждого кандидата обязательны authenticated principal, ACTIVE local
   profile с `INTERNAL` user type, доступный собственный `INTERNAL` context,
   ACTIVE role, соответствующий `role_permissions`, ACTIVE assignment того же
   пользователя и context type/ID, интервал `[valid_from, valid_to)` и scope,
   покрывающий authoritative target. Отсутствующий `X-Work-Context-Id` на
   business route не выбирает контекст по умолчанию и не даёт grant.
3. Sites получает фактические атрибуты цели из своих данных. Для Zone target
   содержит `territorial_zone_id`; для Region — `territorial_zone_id` и
   `region_id`. Заполненное измерение assignment требует точного совпадения;
   отсутствующее измерение target не удовлетворяет ограничению. Region/Site
   assignment не даёт неявный доступ к родительской Zone. Несколько подходящих
   назначений объединяются только как множество отдельно разрешённых целей;
   измерения из разных назначений не складываются в новый grant.
4. `GET /api/v1/territorial-zones` и `GET /api/v1/regions` применяют scope
   внутри backend query. Дополнительный `territorialZoneId` фильтр Regions
   сужает результат, но не расширяет доступ. Нет действующего `sites.read`
   в контексте — 403; grant есть, но доступных записей нет — 200 с `[]`.
   Direct GET проверяет authoritative target перед возвратом DTO; недоступная
   цель не раскрывается как доступная только по знанию UUID.
5. `POST /api/v1/regions` требует действующий `sites.create` в выбранном
   контексте и assignment, покрывающий указанную существующую родительскую
   Zone. Состояние родителя и бизнес-валидация остаются в Sites. Назначение,
   ограниченное ещё не существующим Region, не разрешает создание под Zone.
   `POST /api/v1/territorial-zones` остаётся закрытым: у новой корневой Zone
   нет parent/target scope в текущей схеме. Его открытие требует отдельного
   решения и явного полномочия.
6. Target-aware authorization получает отдельный application-level contract.
   Identity отвечает за пользователя, context, role-permission, validity и
   assignment eligibility; Sites отвечает за authoritative geographic target,
   фильтрацию query и вызов contract. `HasGrantAsync(userId, permissionId)`
   не является достаточной проверкой для business endpoint. API policy может
   выполнять общий deny gate, но положительный ответ без target-aware
   use-case check не даёт доступ. Sites не читает таблицы Identity напрямую;
   Identity не зависит от Sites.Infrastructure.
7. Capability evaluation — отдельный backend endpoint для UX, не часть
   `/api/v1/me`. Он вычисляется заново для текущего context и только явно
   указанных целей, не возвращает глобальный список permissions и не заменяет
   проверку business endpoint. Контракт указан ниже.
8. Первая production версия выдаёт grants только `INTERNAL` пользователю в
   `INTERNAL` context. Для `CONTRACTOR` и других context types результат
   fail-closed до отдельной реализации цепочки User → Contractor organization
   → Contract → User contract assignment → Contract scope → Validity.

## Capabilities API

`POST /api/v1/capabilities/evaluate` — read-only evaluation с обязательным
валидированным `X-Work-Context-Id`, bearer token и ACTIVE local profile.

```json
{
  "targets": [
    { "resourceType": "territorialZone", "id": "<uuid>" },
    { "resourceType": "region", "id": "<uuid>" }
  ]
}
```

```json
{
  "contextId": "<uuid>",
  "targets": [
    { "resourceType": "territorialZone", "id": "<uuid>", "actions": ["read", "change", "createRegion"] },
    { "resourceType": "region", "id": "<uuid>", "actions": ["read", "change"] }
  ]
}
```

Запрос ограничен 100 target, типы и UUID валидируются. Ответ содержит только
видимые через `sites.read` цели; неизвестные и недоступные ID одинаково
отсутствуют. `read` соответствует `sites.read`, `change` — `sites.change` над
той же целью, `createRegion` — `sites.create` под данной Zone. Действия не
являются новыми permission codes. Порядок ответа соответствует порядку
уникальных видимых target из запроса. Отсутствующий/недоступный context — 403,
невалидный запрос — 400; отсутствие read grants даёт пустой `targets`. Ответ
не содержит полных assignment, role, contractor или token claims. Клиент не
кэширует его между контекстами; backend повторно проверяет каждое действие.

## Границы и последствия

- Existing `identity.access_assignments` содержит нужные поля для этого
  внутреннего географического среза. Схема БД не меняется; связь assignment
  с owned `user_contexts` проверяется evaluator, несмотря на отсутствие FK.
- Development fixture создаёт реального пользователя локального OIDC с
  доверенным `user_type=INTERNAL`, local profile, ACTIVE role, нужные
  `role_permissions`, собственный INTERNAL context и ограниченный assignment
  по существующей Zone. Fixture запускается явно, повторяемо и только в
  Development. `UserType`, имя роли, environment и token claims сами не grants.
- `organization.*`, справочники без определённого target и другие business
  routes остаются deny-by-default до отдельного scope contract. Включение
  evaluator для Sites не должно расширить их доступ.
- Нужны негативные проверки missing/wrong/expired context, inactive user/role,
  missing permission, future/expired/revoked assignment, wrong scope, direct
  ID, отсутствие parent coverage, contractor и cross-context leakage.
- ADR-007 продолжает определять общую модель и contractor chain. Этот ADR
  фиксирует первый production slice и не изменяет уже реализованное поведение
  до соответствующих implementation phases.
