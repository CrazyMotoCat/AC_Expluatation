# Module: Documents

STATUS: STABLE
SOURCE_VERSION: 2026-09-17

## Purpose

Documents управляет логическими документами, версиями, attachments и безопасным S3-compatible хранением.

## Owns

- DocumentType
- Document
- DocumentVersion
- StorageObject
- DocumentLink
- Attachment
- Upload process

## Storage

```text
PostgreSQL → metadata
S3-compatible object storage → binary object
```

Bucket private.

## Database

Schema:

```text
documents
```

Tables:

```text
document_types
documents
document_versions
storage_objects
document_links
attachments
```

## Rules

- BR-DOC-001 … BR-DOC-006.
- approved version immutable;
- entity scope enforced;
- restricted download authorized;
- user filename not storage key.

## Classification

- PUBLIC
- INTERNAL
- RESTRICTED
- CRITICAL

## Attachment types

- GENERAL
- BEFORE
- AFTER
- NAMEPLATE
- DEFECT
- MEASUREMENT
- DOCUMENT

## Permissions

- documents.read
- documents.upload
- documents.create
- documents.add_version
- documents.verify
- documents.download_restricted
- documents.manage_types

## Public contracts

- DocumentReference
- AttachmentReference
- GetDocuments
- CreateAttachment
- AuthorizeDownload

## Events

- DocumentCreated
- DocumentVersionAdded
- DocumentVersionVerified
- AttachmentAdded

## Upload pipeline

```text
create session
→ upload
→ complete
→ validate
→ scan adapter
→ create StorageObject
→ create version/attachment
→ link entity
```

## Security

- size limit;
- MIME/extension validation;
- SHA-256;
- private bucket;
- signed URL;
- classification check;
- optional restricted download audit.

## API examples

```text
POST /api/v1/uploads
POST /api/v1/uploads/{id}/complete
POST /api/v1/documents
POST /api/v1/documents/{id}/versions
GET /api/v1/documents/{id}/download
```

## Tests

- wrong MIME;
- oversized;
- wrong scope;
- restricted contractor;
- signed URL without auth;
- current version consistency;
- orphan cleanup safety.

## Forbidden

- public bucket;
- mass binary `bytea`;
- physical overwrite approved version;
- permanent public URL;
- access by ID only.
