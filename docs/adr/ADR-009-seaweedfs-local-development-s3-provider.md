# ADR-009 — SeaweedFS as local development S3 provider

- **Статус:** Accepted
- **Дата:** 2026-09-17
- **Связь:** частично заменяет ADR-004 только в части выбора local DEV provider

## Контекст

ADR-004 закрепил архитектурный контракт S3-compatible object storage и первоначально выбрал MinIO для DEV. Distribution/support model MinIO Community Edition изменилась: прежний рекомендуемый официальный container больше не является подходящей поддерживаемой базой для новой локальной конфигурации.

Нужен воспроизводимый local DEV provider, который:

- предоставляет S3-compatible endpoint;
- запускается в минимальном одноконтейнерном режиме;
- хранит данные в named volume;
- не проникает vendor-specific API в application/domain code.

## Решение

Для local DEV environment использовать SeaweedFS в режиме `weed mini` как S3-compatible provider.

Архитектурный контракт остаётся неизменным:

```text
S3-compatible object storage
```

Application и business code используют стандартный S3-compatible client/contract и generic configuration:

```text
S3_ENDPOINT
S3_ACCESS_KEY
S3_SECRET_KEY
S3_REGION
S3_BUCKET
S3_FORCE_PATH_STYLE
```

SeaweedFS-specific API и configuration запрещены в application/domain layer. Vendor-specific параметры допустимы только внутри local infrastructure configuration.

SeaweedFS является только DEV provider. Production object-storage provider выбирается отдельно и этим ADR не определяется.

MinIO больше не является рекомендуемым DEV provider. ADR-009 частично заменяет ADR-004 только в этой части; основное решение ADR-004 об S3-compatible object storage, private buckets, metadata в PostgreSQL и signed URL остаётся действующим.

## Local configuration

- image использует pinned stable version, без `latest` или development/nightly tag;
- наружу публикуется только S3 endpoint;
- данные хранятся в named volume;
- credentials и bucket поступают из локального `.env`;
- default bucket создаётся при запуске DEV provider;
- path-style addressing включается в generic client configuration.

## Последствия

### Положительные

- сохраняется vendor-neutral S3 contract;
- DEV storage запускается вместе с остальной локальной инфраструктурой;
- application code не зависит от выбранного DEV продукта;
- production provider можно выбрать отдельно без изменения domain/application layers.

### Отрицательные

- совместимость конкретных S3 operations нужно подтверждать smoke/integration tests;
- поведение SeaweedFS не следует считать полным эквивалентом будущего production provider;
- появляется отдельный DEV infrastructure component, который нужно обновлять и проверять.

## Проверки

Перед завершением `TASK-00.02.01` обязательны runtime-проверки:

- readiness контейнера;
- доступность S3 endpoint;
- создание bucket;
- PUT, GET и DELETE object через стандартный S3 client;
- сохранность данных после `docker compose down` и повторного `docker compose up -d` без удаления volumes.

## Не входит в решение

- выбор production object-storage provider;
- application S3 client implementation;
- production storage topology;
- SeaweedFS-specific features вне S3-compatible contract.
