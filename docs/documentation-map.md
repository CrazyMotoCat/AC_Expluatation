# Documentation Map — АС «Эксплуатация»

SOURCE_VERSION: 2026-09-16

| Документ | Source of truth для |
|---|---|
| `concept.md` | фундаментальные продуктовые/бизнес-принципы |
| `architecture.md` | архитектура и module boundaries |
| `database.md` | полная логическая модель PostgreSQL |
| `permissions-registry.md` | canonical permission codes |
| `lifecycle-registry.md` | canonical lifecycle/status transitions |
| `events-registry.md` | canonical domain/integration events |
| `business-rules-registry.md` | business rules с BR IDs |
| `reference-data-registry.md` | enums/reference/master-data классификация |
| `modules/<module>.md` | подробная текущая модель модуля |
| `context/<module>.context.md` | производный компактный AI-контекст |
| `adr/*.md` | история архитектурных решений |
| `backlog.md` | engineering execution plan |

## Приоритет при конфликте

```text
Explicit current owner decision
> Accepted ADR
> global source docs / registries
> module docs
> context capsules
> backlog implementation hints
```

## Documentation sync

После significant change:

```text
docs-impact
→ documentation-sync
```

Registry должен обновляться в том же change set, если изменение затрагивает его область ответственности.
