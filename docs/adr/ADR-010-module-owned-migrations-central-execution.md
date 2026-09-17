# ADR-010 — Module-owned migrations with central technical execution

- **Статус:** Accepted
- **Дата:** 2026-09-17
- **Связь:** уточняет ADR-001 и ADR-002

## Контекст

Модульный монолит использует одну PostgreSQL database и отдельные schemas для business modules. Требуется единый воспроизводимый migration execution path для CI и эксплуатации, не размывающий владение persistence model между модулями.

На момент принятия решения business `DbContext` и migrations ещё отсутствуют. Migration smoke обязан работать в этом состоянии без fake tables или преждевременной business persistence.

## Решение

Каждый business module с persistence владеет:

- `<Module>DbContext` внутри `<Module>.Infrastructure`;
- своей PostgreSQL schema;
- своими EF Core migrations;
- отдельной migrations history table в своей schema;
- `IDesignTimeDbContextFactory<TModuleDbContext>`, если она требуется tooling.

Design-time factory и runtime registration используют единый configuration contract:

```text
ConnectionStrings:Database
ConnectionStrings__Database
```

Технический console host `Exploitation.DatabaseMigrator` является composition root для migration execution. Он регистрирует Infrastructure modules, обнаруживает зарегистрированные `DbContext`, сортирует их детерминированно и последовательно вызывает EF Core migration execution.

`Exploitation.DatabaseMigrator` не владеет business schema, entity, migration или собственным `DbContext`. Global/shared application `DbContext` не создаётся.

Нулевое число зарегистрированных module contexts является валидным результатом. После появления module persistence соответствующий context регистрируется обычным module composition extension и автоматически попадает в execution path migrator host.

## Последствия

### Положительные

- migration ownership совпадает с module data ownership;
- CI и operational execution используют один host;
- порядок применения contexts детерминирован;
- zero-migration repository state не требует искусственной schema;
- connection configuration остаётся единой для API, design-time tooling и CI.

### Отрицательные

- composition root migrator host должен подключать каждый новый persistence module;
- каждый module обязан корректно настроить provider и migrations history table;
- cross-module migration по-прежнему требует отдельного review.

## Не входит в решение

- создание первой business schema или migration;
- global repository или Unit of Work;
- автоматический запуск migrations при старте API;
- deployment/CD pipeline;
- migration предыдущей release schema, которая остаётся желательным последующим test case.
