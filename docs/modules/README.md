# Module Documentation

STATUS: INDEX
SOURCE_VERSION: 2026-09-26 (TASK-02.02.01 Phase C4 traceability)

Эта директория содержит подробные паспорта доменных модулей.

## Stable module docs

- `identity.md`
- `sites.md`
- `assets.md`
- `maintenance.md`
- `workorders.md`
- `measurements.md`
- `defects.md`
- `inventory.md`
- `contractors.md`
- `documents.md`
- `organization.md` (OrganizationalUnit vertical slice implemented; C3 review passed)

## Пока только context capsule

- Incidents — `PROVISIONAL`
- Changes — `PROVISIONAL`

## Source relationship

```text
Accepted ADR / global source docs
        ↓
docs/modules/<module>.md
        ↓
docs/context/<module>.context.md
```

Module doc — подробная текущая модель модуля.

Context capsule — короткий производный AI-cache.

## Обязательные разделы module doc

- Purpose
- Owns / Does not own
- Database
- Business rules
- Lifecycle
- Permissions
- Public contracts
- Events
- Dependencies
- API surface
- Tests
- Forbidden

## Update triggers

Обновлять module doc при изменении:

- core entity;
- lifecycle;
- business invariant;
- permission;
- public contract;
- event;
- owned DB model;
- cross-module dependency.
