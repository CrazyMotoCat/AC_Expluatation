AGENT: infra_owner
ROLE: INFRASTRUCTURE
STATUS: COMPLETE
WRITE_SCOPE: docker-compose.yml, .env.example, ignored .env
SAFE_COMMIT: NONE

OUTPUT:
- Added stable RabbitMQ `hostname: rabbitmq` and `RABBITMQ_NODENAME: rabbit@rabbitmq` after a real durable-queue persistence failure.

VERIFIED:
- Compose config/pull/up/health.
- PostgreSQL, Redis, RabbitMQ, Keycloak and SeaweedFS protocol checks.
- Standard S3 CRUD/hash through pinned `amazon/aws-cli:2.31.16`.
- Persistence restart and cleanup for PostgreSQL, RabbitMQ, Keycloak and SeaweedFS.
- Restore/build/test regression.

HANDOFF:
- RabbitMQ stable node identity is required for Mnesia persistence.
- Runtime probe data was cleaned; stack was left healthy.

OPEN_ISSUES: NONE
