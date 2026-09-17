# Documents Context Capsule

SOURCE_VERSION: 2026-09-17
MODULE: Documents
MATURITY: STABLE

## PURPOSE

Documents управляет логическими документами, версиями, файлами, фотографиями, attachments, классификацией и безопасным хранением бинарных объектов в S3-compatible storage.

## OWNS

- DocumentType
- Document
- DocumentVersion
- StorageObject
- DocumentLink
- Attachment
- upload session/process
- secure download authorization
- media metadata

## DB

Основные таблицы:

- `documents.document_types`
- `documents.documents`
- `documents.document_versions`
- `documents.storage_objects`
- `documents.document_links`
- `documents.attachments`

Фактические binary objects находятся в S3-compatible storage.

## STORAGE DECISION

```text
PostgreSQL = metadata
S3-compatible object storage = binary content
```

Bucket private.

Download:

```text
backend authorization
→ short-lived signed URL
```

## INVARIANTS

- Binary files не являются primary data inside PostgreSQL.
- User filename не используется как physical storage key.
- Каждый file upload проходит validation pipeline.
- Approved/current document version не должна перезаписываться молча.
- Версионируемый документ хранит все версии.
- Model-level document и Asset-specific document имеют разные scopes.
- Document access определяется classification + linked entity scope + role/context.
- Sensitive download может требовать audit.
- Attachment/photo должен иметь typed purpose.
- Orphan object не должен оставаться навсегда после незавершённого upload.
- File metadata и business link создаются только после успешной фиксации object.
- SHA-256 сохраняется для integrity/dedup hints.
- S3 bucket не public.
- Direct URL без authorization не является permanent API contract.

## DOCUMENT TYPES

Примеры:

- PASSPORT
- MANUAL
- SCHEME
- COMMISSIONING_ACT
- TECHNICAL_ACT
- WARRANTY
- REPORT
- OTHER

Справочник расширяемый.

## DOCUMENT VERSIONING

Логика:

```text
Document
→ Version 1
→ Version 2
→ Version 3 current
```

Версия хранит:

- version_number;
- storage_object_id;
- valid_from/valid_to;
- is_current;
- change_summary;
- uploaded_by/at;
- verified_by/at optional.

## ATTACHMENT TYPES

Минимум:

- GENERAL
- BEFORE
- AFTER
- NAMEPLATE
- DEFECT
- MEASUREMENT
- DOCUMENT

## CLASSIFICATION

Рекомендуемые уровни:

- PUBLIC
- INTERNAL
- RESTRICTED
- CRITICAL

Точная security policy определяется `security.md`.

## UPLOAD FLOW

```text
1. create upload session
2. obtain upload URL or accept binary
3. upload
4. complete
5. validate mime/size/extension/hash
6. malware scan adapter
7. create StorageObject
8. create DocumentVersion/Attachment
9. link to entity
```

## DOWNLOAD FLOW

```text
request file
→ authenticate
→ permission/scope/classification check
→ optional download audit
→ signed URL
```

## PERMISSIONS

Типовые:

- `documents.read`
- `documents.upload`
- `documents.create`
- `documents.add_version`
- `documents.make_current`
- `documents.verify`
- `documents.download_restricted`
- `documents.manage_types`

## PUBLIC CONTRACTS

Полезные:

- `DocumentReference`
- `AttachmentReference`
- `IDocumentsModule.GetDocuments(entityType, entityId)`
- `IDocumentsModule.CreateAttachment(...)`
- `IDocumentsModule.AuthorizeDownload(...)`

## EVENTS

Основные:

- `DocumentCreated`
- `DocumentVersionAdded`
- `DocumentVersionVerified`
- `AttachmentAdded`
- `FileRejected`
- `DocumentClassificationChanged`

## DEPENDS_ON

Допустимо:

- Identity authorization;
- generic ObjectStorage abstraction;
- Audit;
- shared correlation/clock.

Documents может связываться с любым business entity через controlled link mechanism, но не должен владеть их business lifecycle.

## MEDIA

Для photo можно позже добавить worker:

- thumbnails;
- previews;
- EXIF cleanup;
- malware scan.

Original должен сохраняться согласно policy.

## SECURITY

Обязательно:

- size limit;
- MIME validation;
- extension validation;
- hash;
- private bucket;
- short-lived signed URL;
- no secrets in filename/path;
- sensitive classification check.

## EXIF

По умолчанию ненужные EXIF/GPS metadata желательно удалять из производных изображений. Политика хранения original metadata должна быть явной.

## ORPHAN CLEANUP

Background job очищает:

- expired upload sessions;
- unlinked temporary objects;
- temporary exports.

Никогда не удаляет approved business documents общей cleanup-задачей.

## FORBIDDEN

- public bucket;
- `bytea` для массового хранения фото/документов;
- user filename как storage key;
- upload без validation;
- permanent unsigned public URL;
- перезапись approved version;
- access только по знанию documentId;
- unrestricted contractor access к asset docs;
- смешивать document version и attachment photo semantics.

## TOP_TEST_RISKS

- upload invalid MIME;
- oversized upload;
- wrong scope download;
- contractor sees restricted doc;
- signed URL issued before auth;
- duplicate version number;
- current version consistency;
- orphan cleanup deletes valid file;
- malicious filename/path traversal;
- restricted download audit.
