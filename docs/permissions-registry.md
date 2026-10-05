# Permissions Registry — АС «Эксплуатация»

STATUS: WORKING SOURCE OF TRUTH
SOURCE_VERSION: 2026-09-26 (TASK-02.03.03 Phase A scope clarification)

## 1. Назначение

Этот файл является единым реестром permission codes системы.

Он определяет:

- canonical permission code;
- модуль-владельца;
- смысл действия;
- требуемые scope dimensions;
- допустимые working contexts;
- чувствительность операции;
- дополнительные ограничения.

С `TASK-01.02.01` все строки секции **Canonical permissions** seed-ятся module-owned Identity migration в `identity.permissions` со stable UUIDv7 IDs. Unique database constraint защищает `code`; строки секции **Provisional permissions** в seed не входят.

Нельзя создавать новый permission с похожим смыслом, не проверив этот реестр.

## 2. Naming convention

```text
<module>.<action>
```

Примеры:

```text
assets.read
assets.create
workorders.execute
inventory.approve
```

Не использовать одновременно:

```text
assets.edit
assets.modify
assets.update
```

если они означают одно и то же.

## 3. Scope dimensions

Возможные измерения:

- `territorial_zone`
- `region`
- `site`
- `functional_direction`
- `asset_type`
- `contract`
- `team`

Permission сам по себе не даёт broad access. Backend дополнительно проверяет scope, working context и validity.

`identity.contexts.read` сохраняется для будущего permission-controlled доступа к contexts. `GET /api/v1/me/contexts` и `POST /api/v1/me/context` в `TASK-01.03.02` являются отдельным own-context self-service bootstrap (validated principal + ACTIVE local user + ownership/availability), не operational grant и не обходом других Identity permissions.

## 4. Sensitivity

- `NORMAL` — обычная рабочая операция.
- `SENSITIVE` — изменение мастер-данных/операционных состояний.
- `CRITICAL` — approval, security-sensitive, destructive lifecycle transition, KVO-impacting action.

## 5. Canonical permissions

| Code | Module | Purpose | Typical scope | Contexts | Sensitivity |
|---|---|---|---|---|---|
| `identity.users.read` | Identity | Просмотр пользователей | org/region as applicable | INTERNAL | SENSITIVE |
| `identity.users.manage` | Identity | Изменение локального профиля/статуса | org | INTERNAL | CRITICAL |
| `identity.roles.read` | Identity | Просмотр ролей | org | INTERNAL | SENSITIVE |
| `identity.roles.manage` | Identity | Управление ролями | org | INTERNAL | CRITICAL |
| `identity.permissions.read` | Identity | Просмотр permission catalog | org | INTERNAL | SENSITIVE |
| `identity.access.manage` | Identity | Управление access assignments | region/site/direction | INTERNAL | CRITICAL |
| `identity.contexts.read` | Identity | Просмотр собственных contexts | own | INTERNAL/CONTRACT | NORMAL |
| `identity.delegations.manage` | Identity | Управление делегированием | assigned scope | INTERNAL | CRITICAL |
| `sites.read` | Sites | Просмотр объектов | zone/region/site | INTERNAL/CONTRACT | NORMAL |
| `sites.create` | Sites | Создание объекта | zone/region | INTERNAL | CRITICAL |
| `sites.change` | Sites | Изменение карточки объекта | site | INTERNAL | SENSITIVE |
| `sites.manage_locations` | Sites | Управление location tree | site | INTERNAL | SENSITIVE |
| `sites.change_criticality` | Sites | Изменение класса критичности | site | INTERNAL | CRITICAL |
| `assets.read` | Assets | Просмотр активов | region/site/asset_type | INTERNAL/CONTRACT | NORMAL |
| `assets.create` | Assets | Создание актива | site/asset_type | INTERNAL/CONTRACT* | SENSITIVE |
| `assets.change` | Assets | Изменение master data актива | site/asset_type | INTERNAL/CONTRACT* | SENSITIVE |
| `assets.move` | Assets | Перемещение актива | site | INTERNAL/CONTRACT* | SENSITIVE |
| `assets.decommission` | Assets | Вывод из эксплуатации | site/asset_type | INTERNAL | CRITICAL |
| `assets.replace` | Assets | Замена актива | site/asset_type | INTERNAL/CONTRACT* | CRITICAL |
| `assets.manage_responsibility` | Assets | Назначение ответственности | site/direction | INTERNAL | CRITICAL |
| `assets.manage_types` | Assets | Управление типами оборудования | global/direction | INTERNAL | CRITICAL |
| `assets.manage_models` | Assets | Управление моделями | global/asset_type | INTERNAL | SENSITIVE |
| `documents.read` | Documents | Просмотр документов | inherited entity scope | INTERNAL/CONTRACT | NORMAL |
| `documents.upload` | Documents | Загрузка файла/фото | inherited entity scope | INTERNAL/CONTRACT | SENSITIVE |
| `documents.create` | Documents | Создание logical document | inherited entity scope | INTERNAL/CONTRACT* | SENSITIVE |
| `documents.add_version` | Documents | Добавление версии | inherited entity scope | INTERNAL/CONTRACT* | SENSITIVE |
| `documents.verify` | Documents | Верификация документа | entity scope/direction | INTERNAL | CRITICAL |
| `documents.download_restricted` | Documents | Скачивание restricted/critical | inherited + classification | INTERNAL/CONTRACT* | CRITICAL |
| `documents.manage_types` | Documents | Управление типами документов | global | INTERNAL | CRITICAL |
| `maintenance.read` | Maintenance | Просмотр регламентов/планов | direction/site/asset_type | INTERNAL/CONTRACT | NORMAL |
| `maintenance.manage_templates` | Maintenance | Создание/изменение draft templates | direction/asset_type | INTERNAL | SENSITIVE |
| `maintenance.approve_template` | Maintenance | Утверждение версии регламента | direction/asset_type | INTERNAL | CRITICAL |
| `maintenance.manage_plans` | Maintenance | Управление asset plans | site/asset_type | INTERNAL | SENSITIVE |
| `maintenance.recalculate` | Maintenance | Принудительный пересчёт | site/asset_type | INTERNAL | SENSITIVE |
| `maintenance.schedule` | Maintenance | Управление планированием | region/site | INTERNAL | SENSITIVE |
| `workorders.read` | WorkOrders | Просмотр работ | site/direction/contract | INTERNAL/CONTRACT | NORMAL |
| `workorders.create` | WorkOrders | Ручное создание допустимой работы | site/direction | INTERNAL | SENSITIVE |
| `workorders.assign` | WorkOrders | Назначение исполнителей | site/direction/contract | INTERNAL | CRITICAL |
| `workorders.execute` | WorkOrders | Выполнение checklist | site/contract/asset_type | INTERNAL/CONTRACT | SENSITIVE |
| `workorders.complete` | WorkOrders | Передача работы на проверку | assigned work | INTERNAL/CONTRACT | SENSITIVE |
| `workorders.review` | WorkOrders | Проверка результата заказчиком | site/direction | INTERNAL | CRITICAL |
| `workorders.approve` | WorkOrders | Финальная приёмка, если выделена | site/direction | INTERNAL | CRITICAL |
| `workorders.cancel` | WorkOrders | Отмена работы | site/direction | INTERNAL | CRITICAL |
| `measurements.read` | Measurements | Просмотр измерений | site/asset_type | INTERNAL/CONTRACT | NORMAL |
| `measurements.create` | Measurements | Запись измерения | assigned work/site | INTERNAL/CONTRACT | SENSITIVE |
| `measurements.correct` | Measurements | Контролируемая коррекция | site/direction | INTERNAL | CRITICAL |
| `measurements.export` | Measurements | Экспорт измерений | scope + export policy | INTERNAL | SENSITIVE |
| `defects.read` | Defects | Просмотр дефектов | site/direction/contract | INTERNAL/CONTRACT | NORMAL |
| `defects.create` | Defects | Создание дефекта | site/asset_type | INTERNAL/CONTRACT | SENSITIVE |
| `defects.assign` | Defects | Назначение ответственного | site/direction/contract | INTERNAL | CRITICAL |
| `defects.update` | Defects | Добавление observations/данных | assigned scope | INTERNAL/CONTRACT | SENSITIVE |
| `defects.resolve` | Defects | Пометка устранения | assigned scope | INTERNAL/CONTRACT* | SENSITIVE |
| `defects.close` | Defects | Финальное закрытие | site/direction | INTERNAL | CRITICAL |
| `defects.review_recurrence` | Defects | Оценка повторного проявления | site/direction | INTERNAL | CRITICAL |
| `inventory.read` | Inventory | Просмотр сессий/результатов | site | INTERNAL/CONTRACT* | NORMAL |
| `inventory.create` | Inventory | Создание сессии | site | INTERNAL | CRITICAL |
| `inventory.execute` | Inventory | Сканирование | assigned session/site | INTERNAL/CONTRACT* | SENSITIVE |
| `inventory.manage_scope` | Inventory | Изменение состава проверки | site | INTERNAL | CRITICAL |
| `inventory.finish_scan` | Inventory | Завершение сканирования | session | INTERNAL | CRITICAL |
| `inventory.generate_report` | Inventory | Генерация отчёта | session | INTERNAL | SENSITIVE |
| `inventory.approve` | Inventory | Утверждение отчёта | site | INTERNAL | CRITICAL |
| `inventory.review_draft_asset` | Inventory | Верификация неизвестного актива | site/asset_type | INTERNAL | CRITICAL |
| `contractors.read` | Contractors | Просмотр подрядчиков/договоров | org/region | INTERNAL | SENSITIVE |
| `contractors.manage_organizations` | Contractors | Управление организациями | org | INTERNAL | CRITICAL |
| `contractors.manage_contracts` | Contractors | Управление договорами | org/region | INTERNAL | CRITICAL |
| `contractors.manage_scopes` | Contractors | Управление contract scope | region/site/direction | INTERNAL | CRITICAL |
| `contractors.manage_users` | Contractors | Управление memberships | org/contract | INTERNAL/CONTRACT* | SENSITIVE |
| `contractors.verify_user` | Contractors | Верификация external user | org/contract | INTERNAL | CRITICAL |
| `contractors.manage_assignments` | Contractors | Назначение на договор | contract | INTERNAL | CRITICAL |
| `qualifications.read` | Qualifications | Просмотр допусков | org/team | INTERNAL/CONTRACT | NORMAL |
| `qualifications.manage` | Qualifications | Управление квалификациями | org/team | INTERNAL | CRITICAL |
| `qualifications.verify` | Qualifications | Верификация сертификата | org/team | INTERNAL | CRITICAL |
| `reports.read` | Reports | Просмотр доступных отчётов | inherited | INTERNAL/CONTRACT* | NORMAL |
| `reports.export` | Reports | Экспорт | inherited + export policy | INTERNAL/CONTRACT* | SENSITIVE |
| `organization.read` | Organization | Просмотр организационных подразделений | company/organizational-unit (deferred) | INTERNAL | NORMAL |
| `organization.create` | Organization | Создание организационного подразделения | company/organizational-unit (deferred) | INTERNAL | CRITICAL |
| `organization.change` | Organization | Изменение, reparent и lifecycle подразделения | company/organizational-unit (deferred) | INTERNAL | SENSITIVE |

For `TASK-02.03.03`, the Sites rows above are existing codes, not new grants.
Published Site list/get require `sites.read` plus target coverage; create uses
`sites.create` plus coverage of the existing parent Region. Ordinary Site
update and lifecycle use `sites.change` on the Site target. The separate
criticality command uses `sites.change_criticality` on that target without an
additional `sites.change` requirement. Published target-aware operations cover
TerritorialZone, Region and Site; contractor-positive Site authorization stays
fail-closed.

For `TASK-02.04.01`, an existing `sites.manage_locations` assignment with a
current supported Zone/Region/Site scope is one of two fixed eligibility paths
for reading the global LocationType catalog. This adds no management route,
new permission, Site visibility or implication between permissions. Runtime
LocationType management requires a separate future contract.

TASK-02.04.02 / OD-LOCATION-06: Location list/get require fixed `sites.read`;
create/update/move/activate/deactivate require fixed `sites.manage_locations`.
Both use authoritative Site → Region → Zone coverage; supported exact
assignment kinds remain TerritorialZone, Region and Site. The registry's
Site target includes downward Zone/Region coverage through Sites composition.
No exact Location scope or permission implication is added. Management alone
does not permit reads; read alone does not permit management. This backend
slice permits INTERNAL user/context only; contractor access fails closed.

`CONTRACT*` означает: разрешение возможно только при явном contract scope.

## 5.1. Organization scope boundary for TASK-02.02.01

The three accepted Organization permissions are active catalog entries in
section 5 and are seeded by the additive Identity migration for C1.

`access_assignments` does not yet carry Company/OrganizationalUnit dimensions.
Production grant evaluation remains deny-by-default until the dedicated
authorization-scope task. The Identity permission schema does not persist
scope metadata; the deferred Company/OrganizationalUnit scope description above
is documentation only and grants no access.
UserType, role name, JWT claims, working context and entity ID are not grants.

## 6. Provisional permissions

Следующие permissions предварительные до стабилизации модулей:

```text
incidents.*
changes.*
```

Они не считаются canonical до утверждения module docs.

## 7. Правила добавления permission

Новый permission допустим, если:

1. Нет существующего permission с тем же смыслом.
2. У permission есть module owner.
3. Определены scope dimensions.
4. Определены допустимые contexts.
5. Есть authorization tests.
6. Реестр обновлён в том же change set.

## 8. Запрещено

- permission без module prefix;
- permission только во frontend;
- broad `admin.all` как обычный рабочий механизм;
- contractor access без contract scope;
- создание синонимов существующих permissions;
- использование role name вместо permission в business endpoint.
