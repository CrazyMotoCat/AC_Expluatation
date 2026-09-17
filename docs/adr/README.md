# Architecture Decision Records — АС «Эксплуатация»

Эта директория содержит архитектурные решения, которые считаются принятыми и должны учитываться при разработке.

## Статусы ADR

```text
Proposed
Accepted
Superseded
Deprecated
Rejected
```

## Текущие ADR

| ADR | Решение | Статус |
|---|---|---|
| ADR-001 | Модульный монолит | Accepted |
| ADR-002 | PostgreSQL как основная СУБД | Accepted |
| ADR-003 | UUIDv7 | Accepted |
| ADR-004 | S3-compatible object storage | Accepted; local DEV provider частично заменён ADR-009 |
| ADR-005 | Transactional Outbox + RabbitMQ | Accepted |
| ADR-006 | OIDC/OAuth2 + внешний IdP | Accepted |
| ADR-007 | RBAC + Scope/ABAC + Working Context | Accepted |
| ADR-008 | Разделение Business History и Audit | Accepted |
| ADR-009 | SeaweedFS как local development S3 provider | Accepted |
| ADR-010 | Module-owned migrations с central technical execution | Accepted |

## Правило для Codex и разработчиков

Перед изменением решения, закреплённого ADR:

1. Не изменять его молча.
2. Создать новый ADR.
3. Указать, какой предыдущий ADR он заменяет.
4. Обосновать причину.
5. Обновить связанные документы.

## Когда создавать новый ADR

ADR нужен, если решение:

- затрагивает несколько модулей;
- трудно откатить;
- меняет storage;
- меняет authentication/authorization;
- добавляет инфраструктурный компонент;
- меняет способ messaging;
- меняет deployment architecture;
- меняет основную модель идентификаторов;
- меняет фундаментальный integration pattern.

## Именование

```text
ADR-NNN-short-decision-name.md
```

Номера не переиспользуются.
