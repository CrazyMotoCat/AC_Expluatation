# ADR-004 — S3-compatible object storage для файлов и фото

- **Статус:** Accepted
- **Дата:** 2026-09-16
- **Связь:** ADR-009 частично заменяет это решение только в части выбора local DEV provider

## Контекст

АС должна хранить:

- паспорта;
- инструкции;
- схемы;
- акты;
- протоколы ПНР;
- гарантийные документы;
- фото до/после;
- фото дефектов;
- шильдики;
- отчёты;
- импортные файлы.

Количество фото потенциально исчисляется миллионами.

Хранение бинарных файлов внутри основной PostgreSQL увеличивает:

- размер backups;
- нагрузку на DB;
- стоимость replication;
- сложность lifecycle management.

## Решение

Файлы хранятся в:

```text
S3-compatible object storage
```

В DEV:

```text
MinIO
```

Это исходный выбор на дату принятия ADR-004. Последующее решение ADR-009 заменяет его на SeaweedFS только для local DEV environment из-за изменения distribution/support model MinIO Community Edition.

В PROD:

- корпоративное S3;
- managed S3;
- MinIO cluster;
- другой S3-compatible provider.

Production provider этим ADR и ADR-009 не выбран.

## PostgreSQL хранит

```text
storage_key
content_type
size
sha256
original_filename
uploader
created_at
classification
document metadata
```

## Object storage хранит

Фактические binary objects.

## Security

Buckets:

```text
private
```

Скачивание:

```text
backend authorization
→ short-lived signed URL
```

## Storage key

Не использовать пользовательский filename как key.

Пример логики:

```text
documents/{documentId}/versions/{versionId}
```

или полностью opaque key.

## Последствия

### Положительные

- DB остаётся компактнее;
- проще масштабировать медиа;
- lifecycle policies;
- signed URLs;
- дешёвое хранение больших объёмов.

### Отрицательные

- появляется дополнительная инфраструктура;
- нужно следить за согласованностью metadata ↔ object;
- нужен orphan cleanup.

## Обязательные механизмы

- upload session;
- checksum;
- content validation;
- malware scanner adapter;
- orphan cleanup;
- versioning where appropriate.
