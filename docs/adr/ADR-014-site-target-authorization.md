# ADR-014 — Site target authorization

- **Статус:** Accepted
- **Дата:** 2026-09-26
- **Связь:** уточняет ADR-013 для `TASK-02.03.03`; не заменяет ADR-007 или ADR-013

## Контекст

ADR-013 закрепил target-aware authorization для Territorial Zone и Region.
Site — следующий уровень той же физической иерархии, со своим scope и
отдельным разрешением на изменение criticality. `AUTH-SCOPE-01` Phase A
пока не реализован: production grant source остаётся deny-by-default.

## Решение владельца

1. Site является target resource. Sites получает authoritative
   `territorial_zone_id`, `region_id` и `site_id` из своей иерархии
   Site → Region → Territorial Zone. Caller-supplied ID лишь указывает цель.
   Заполненное измерение assignment должно совпадать с соответствующим
   измерением target; измерения разных assignments не объединяются.
2. Zone scope покрывает Sites в дочерних Regions; Region scope покрывает
   Sites этого Region; Site scope покрывает только тот же Site. Доступ к
   Site не даёт доступ к его предкам. Backend фильтрует список Sites до
   выдачи и пересекает фильтры клиента с разрешёнными целями. Direct GET и
   каждая mutation проверяют authoritative target, включая попытки по
   известному UUID. Permission code без действующего назначения не даёт
   доступа.
3. Create проверяет `sites.create` и эффективное покрытие существующего
   родительского Region в валидном INTERNAL working context до появления
   Site. Zone или Region scope может покрыть parent Region; Site-only scope
   не разрешает создание новой Site. Sites отдельно проверяет состояние
   ACTIVE parent Region и справочников.
4. Read требует `sites.read`, ordinary update и lifecycle — `sites.change`,
   а отдельная criticality command — `sites.change_criticality`. Для
   criticality не требуется дополнительное `sites.change`. В каждом случае
   scope должен покрывать target Site.
5. Применяются условия ADR-013 для INTERNAL пользователя и собственного
   валидного INTERNAL context: ACTIVE local profile/role, соответствующий
   role-permission, ACTIVE assignment, подходящий context и validity interval.
   Role, UserType, JWT claims, context и frontend state сами по себе не grant.
   CONTRACTOR и другие context types остаются fail-closed до реализации
   полной contract chain.
6. Identity отвечает за effective grant, Sites — за hierarchy projection,
   scoped query и вызов application-level contract. Если Site dimension ещё
   отсутствует в canonical assignment/evaluator model, его добавляют в
   AUTH-SCOPE Site extension. Sites не читает Identity tables напрямую,
   а Identity не зависит от Sites.Infrastructure.

## Внедрение и проверка

Положительные production Site CRUD paths закрыты до `AUTH-SCOPE-01` B1
effective-grant evaluator и Site target/scope projection, эквивалентного B2,
с негативными проверками permission/context/scope/validity, IDOR, parent
coverage, смешивания assignments и contractor fail-closed. API policy может
выполнять общий deny gate, но положительный ответ без use-case target check
не разрешает операцию. Контракт Phase A не меняет runtime behavior.

ADR-013 capability endpoint для Zone/Region не расширяется автоматически
на Site; UX capability contract требует отдельной явной спецификации.
