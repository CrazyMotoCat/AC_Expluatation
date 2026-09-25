# ADR-012 — Transaction-safe concurrency for organizational hierarchy

- **Статус:** Accepted
- **Дата:** 2026-09-25
- **Связь:** уточняет ADR-002, ADR-007 и ADR-011 для `TASK-02.02.01`

## Контекст

`OrganizationalUnit` образует произвольное дерево внутри Company. Проверка
цикла только в application/domain коде небезопасна: два concurrent reparent
запроса могут проверить разные устаревшие ancestry snapshots и совместно
создать цикл. Та же проблема возникает, если reparent проверяет `ACTIVE`
parent, пока другая транзакция его деактивирует.

## Решение

Все операции, которые изменяют структуру или structural eligibility дерева,
используют одну PostgreSQL-транзакцию и transaction-scoped advisory lock,
выделенный для Company:

- создание с parent;
- reparent;
- перенос в root;
- deactivation `OrganizationalUnit`.

Lock не является глобальным. Ключ вычисляется стабильным алгоритмом:

```text
input = UTF-8("organization-hierarchy:v1:" + lowercase company_id in UUID D format)
digest = SHA-256(input)
key = first 8 digest bytes interpreted as signed 64-bit big-endian integer
```

Application передаёт `key` параметром в `pg_advisory_xact_lock(bigint)`.
Префикс с версией образует отдельный logical namespace Organization
hierarchy; алгоритм и префикс нельзя менять без миграционного решения, пока
разные версии приложения могут выполнять hierarchy mutations. Коллизия
64-bit ключей между разными Company или advisory-lock consumers допускает
только дополнительную сериализацию и не меняет корректность результата.
Все writers Organization hierarchy обязаны использовать один и тот же
алгоритм; другой advisory-lock consumer не должен придавать совпавшему ключу
семантику изменения дерева.

Транзакция использует PostgreSQL `READ COMMITTED`; до lock допустимо читать
только immutable `company_id`, необходимый для вычисления ключа. После
получения lock команда перечитывает актуальное состояние и выполняет внутри
той же транзакции:

1. проверку существования Company, unit и parent;
2. проверку одинакового `company_id`;
3. проверку `ACTIVE` parent;
4. проверку `ACTIVE` source для reparent;
5. запрет self-parent;
6. recursive CTE ancestry check, запрещающий parent из descendant subtree;
7. business mutation;
8. запись Organization-owned durable audit obligation;
9. commit.

Activation не создаёт запрещённого структурного состояния и может выполняться
без structural lock. Обычный update `name`/`unit_type` также не берёт этот
lock. `row_version` остаётся отдельным optimistic-concurrency механизмом для
`PUT`, reparent и lifecycle commands.

## Гарантии

- concurrent hierarchy mutations в одной Company не валидируются на
  взаимно устаревшей ancestry state;
- concurrent reparent/create и deactivation parent/source дают только
  корректный сериализованный исход;
- операции разных Company не используют общий global lock;
- cycle prevention не зависит от простого row CHECK;
- mutation и durable audit obligation остаются атомарными по ADR-011.

## Обязательная проверка

Phase B/C должны проверить PostgreSQL-сценарии в обоих порядках:

- reparent/create → deactivate parent;
- deactivate parent → reparent/create;
- reparent → deactivate source;
- deactivate source → reparent;
- concurrent direct and deep descendant cycle attempts;
- structural mutations in different Companies.

## Последствия

Положительные:

- deterministic correctness proof for arbitrary-depth hierarchy;
- no application-global mutex and no cross-module transaction;
- lifecycle eligibility and hierarchy structure serialized together.

Отрицательные:

- hierarchy mutations in one Company are serialized;
- Phase B requires parameterized PostgreSQL advisory-lock SQL and recursive
  CTE integration tests;
- delivery and lock diagnostics must not expose raw SQL or connection data.
