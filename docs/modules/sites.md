# Module: Sites

STATUS: STABLE
SOURCE_VERSION: 2026-09-16

## Purpose

Sites моделирует физические объекты эксплуатации и их внутреннюю location hierarchy.

## Owns

- Site
- SiteType
- SiteCriticalityClass
- Location
- LocationType
- future operating/service windows

## Database

Schema:

```text
sites
```

Core tables:

```text
site_types
site_criticality_classes
sites
location_types
locations
```

## Business rules

- BR-SIT-001 … BR-SIT-005.
- SiteType и criticality независимы.
- Location tree acyclic.
- Location принадлежит одному Site.
- Site timezone — часть operational context.

## Hierarchy

```text
Territorial Zone
→ Region
→ Site
→ Building/Floor/Room/Rack/Area
```

Zone/Region могут принадлежать Organization domain, но Site хранит reference и физическую структуру.

## Permissions

- sites.read
- sites.create
- sites.change
- sites.manage_locations
- sites.change_criticality

## Public contracts

- SiteReference
- LocationReference
- SiteOperationalContext
- ValidateLocation(siteId, locationId)

## Events

- SiteCreated
- SiteCriticalityChanged
- LocationMoved

## Consumers

- Assets
- Maintenance
- Inventory
- Incidents
- Changes
- Contractors

## API examples

```text
GET /api/v1/sites
POST /api/v1/sites
GET /api/v1/sites/{id}
GET /api/v1/sites/{id}/locations
POST /api/v1/sites/{id}/locations
```

## History

Criticality/location structural changes auditируются. Исторические Asset placements не теряются.

## Tests

- cross-site parent location;
- cyclic location move;
- inactive site;
- KVO criticality permission;
- region scope;
- timezone boundaries.

## Forbidden

- mixing SiteType and criticality;
- deleting a Site with operational history;
- location references across Sites;
- hardcoding KVO behavior in UI.
