# Module: Contractors

STATUS: STABLE
SOURCE_VERSION: 2026-09-16

## Purpose

Contractors является бизнес- и security-контуром внешних организаций, договоров, scopes и назначений external users.

## Owns

- ContractorOrganization
- Contract
- ContractScope
- ContractorUserMembership
- UserContractAssignment

## Database

Schema:

```text
contractors
```

Tables:

```text
organizations
contracts
contract_scopes
user_memberships
user_contract_assignments
```

## Rules

- BR-CON-001 … BR-CON-008.
- membership alone insufficient;
- contract/assignment/scope/validity mandatory;
- one account may have multiple contexts;
- cross-contract leakage forbidden.

## Access chain

```text
User
→ Organization
→ Contract
→ Assignment
→ Scope
→ Validity
→ Working Context
```

## Contract lifecycle

См. `lifecycle-registry.md`.

## Scope dimensions

Can include:

- region;
- site;
- direction;
- asset type;
- work/action.

## Permissions

- contractors.read
- contractors.manage_organizations
- contractors.manage_contracts
- contractors.manage_scopes
- contractors.manage_users
- contractors.verify_user
- contractors.manage_assignments

## Public contracts

- ContractReference
- ContractorOrganizationReference
- ContractAccessContext
- ValidateOperationalAccess
- GetActiveContractContext

## Events

- ContractCreated
- ContractActivated
- ContractExpired
- ContractScopeChanged
- ContractorUserVerified
- UserAssignedToContract
- ContractAssignmentExpired

## Dependencies

- Identity
- Organization/Sites
- Audit/Clock/Outbox

## API examples

```text
GET /api/v1/contractors
POST /api/v1/contracts
POST /api/v1/contracts/{id}/scopes
POST /api/v1/contractor-users/{id}/verify
POST /api/v1/contracts/{id}/assignments
```

## Tests

- expired contract;
- expired assignment;
- wrong contract;
- same user two organizations;
- context spoof;
- scope excludes asset type;
- pending user access denied.

## Forbidden

- `user_type == CONTRACTOR` authorization;
- contractor self-verification;
- broad org access without contract scope;
- UI-only contract restrictions.
