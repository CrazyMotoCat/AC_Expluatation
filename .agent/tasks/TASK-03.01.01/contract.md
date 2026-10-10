TASK:
TASK-03.01.01

PHASE:
ASSET-TYPE-01 — BACKEND ASSET TYPE HIERARCHY

MODE:
IMPLEMENT DIRECTLY ON MAIN

MODEL:
gpt-6-sol

EFFORT:
high

==================================================
GOAL
==================================================

Implement complete backend foundation for:

TASK-03.01.01 — Asset type hierarchy

Scope:

- Assets-owned AssetType domain model;
- parent/child hierarchy;
- FunctionalDirection association;
- system/component classification flags;
- lifecycle and selectability;
- Organization reference validation;
- trusted Identity scope authorization;
- transactionally serialized hierarchy mutations;
- persistence and migration;
- read and management API;
- durable atomic Audit;
- tests, security review and documentation.

One bounded vertical slice.

After implementation:
one atomic local commit on main.

DO NOT PUSH.

Independent publication review is a separate phase.

==================================================
PUBLISHED BASELINE
==================================================

Expected:

main ==
origin/main ==
faa09a7b77d8d9bfb5f416a1d00ce6070bbd61f6

Published:

AUTH-GLOBAL-01
TASK-02.02.02 FunctionalDirection
AUTH-ASSET-SCOPE-01

Hosted CI for baseline:
PASS, run 37908860897.

==================================================
EXPECTED LOCAL STATE
==================================================

Existing operational checkpoints may be dirty:

.agent/tasks/TASK-02.02.02/state.md

.agent/tasks/AUTH-SCOPE-01/asset-type-scope-state.md

.agent/tasks/TASK-03.01.01/state.md

Preserve all existing work.

Do not discard or overwrite checkpoints.

Do not stage unrelated prior-task changes.

No branch.
No worktree.
No push.

==================================================
AUTHORITATIVE CONTRACTS
==================================================

Read:

TASK-03.01.01 checkpoint
AUTH-SCOPE-01 asset-type-scope-state.md
FunctionalDirection published contracts
Assets module documentation
Identity module contracts
ADR-015/016/018 and new scope-handoff ADR
current backlog
database/reference/permission registries.

Treat accepted:

OD-ASSET-TYPE-01..08
OD-ASSET-TYPE-08A..08E

as frozen.

Do not reopen them without a genuine contract conflict.

==================================================
STEP 1 — REPOSITORY GUARD
==================================================

Run:

git fetch origin
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
git status --short
git worktree list

Verify exact published baseline.

If remote advanced unexpectedly:
STOP.

If unrelated implementation changes exist:
STOP.

Do not automatically reset, rebase, merge or stash.

==================================================
STEP 2 — PREREQUISITE CONTRACT GATE
==================================================

Before writing Assets code, verify actual published contracts:

1. Organization-owned FunctionalDirection provider.

2. ACTIVE/INACTIVE reference selectability.

3. Identity IGlobalGrantProvider.

4. Identity GetCurrentAssignmentScopesAsync.

5. Per-assignment correlation is retained.

6. Canonical current local user/context composition.

7. Assets module ownership and DbContext pattern.

8. Atomic durable Audit obligation pattern.

9. Canonical permission registry.

If a required interface is missing or inconsistent:

STATUS:
ASSET_TYPE_PREREQUISITE_CONTRACT_GAP

Report exact missing contract and STOP.

Do not invent unsafe alternatives.

==================================================
STEP 3 — PERMISSION SEED PREFLIGHT
==================================================

Required exact permissions:

assets.read
assets.manage_types

Inspect canonical Identity registry and actual HasData seeds.

If both exist:
reuse without changes.

If either is missing:
create the minimum canonical permission seed and exactly one
data-only Identity migration for missing permission rows.

This conditional exception is authorized for this task only.

Migration MUST NOT:

- change Identity schema;
- change access_assignments;
- change GLOBAL semantics;
- create/change roles;
- create role_permissions;
- create assignments;
- create GLOBAL grants;
- grant permissions to users.

Permission row existence grants nothing.

Follow stable seed IDs and safe rollback convention.

If seed materialization cannot be accomplished without broader mutation:

STATUS:
ASSET_TYPE_PERMISSION_SEED_CONTRACT_GAP

STOP.

==================================================
STEP 4 — ASSETTYPE MODEL
==================================================

Assets-owned entity:

AssetType

Fields:

id
parent_asset_type_id
functional_direction_id
code
name
is_system_type
is_component_type
status
created_at
updated_at
row_version

No description.

No separate inheritance flags.

No business-history subsystem in this task.

ID:
UUIDv7 for runtime entities.

==================================================
STEP 5 — HIERARCHY
==================================================

Adjacency list:

parent_asset_type_id NULLABLE.

Multiple roots:
YES.

Arbitrary depth:
YES.

No synthetic root.

Every AssetType belongs to exactly one FunctionalDirection.

Hierarchy invariant:

parent and child must have identical
functional_direction_id.

FunctionalDirection is stored explicitly on every node.

No inherited implicit direction.

No cross-direction reparent.

==================================================
STEP 6 — CODE / NAME
==================================================

Code:

required
trim
uppercase
max 50

Regex:

^[A-Z0-9][A-Z0-9_-]{0,49}$

Global uniqueness across all AssetTypes.

Immutable after create.

Name:

required
trim
max 200
mutable
not unique.

Database unique constraint authoritative.

Concurrent duplicate code:
stable business/API conflict.

Never leak raw PostgreSQL errors.

==================================================
STEP 7 — CLASSIFICATION FLAGS
==================================================

Two independent booleans:

is_system_type
is_component_type

All four combinations valid:

false / false
true / false
false / true
true / true

Flags are classification metadata.

They do NOT introduce:

- composite Asset relations;
- parent/child restrictions;
- automatic component generation;
- Asset topology.

Both flags mutable via ordinary update.

==================================================
STEP 8 — LIFECYCLE
==================================================

Status:

ACTIVE
INACTIVE

Create:
ACTIVE.

No hard delete.

Inactive types:

remain readable;
remain resolvable for historical references;
cannot be selected for new Assets.

Any ACTIVE AssetType may be selected,
including non-leaf types.

Deactivation:
reject if ANY ACTIVE descendant exists,
at ANY depth.

Reactivation:

root:
allowed subject to normal validation;

child:
direct parent must be ACTIVE.

Create child:
parent must be ACTIVE.

Reparent to parent:
destination parent must be ACTIVE.

Maintain:

ACTIVE child => all ancestors ACTIVE.

No lifecycle cascade.

==================================================
STEP 9 — FUNCTIONAL DIRECTION
==================================================

Use published Organization-owned reference provider.

For new AssetType:

FunctionalDirection must exist AND be selectable.

INACTIVE direction:
cannot be selected for a new AssetType.

For existing AssetType:

inactive FunctionalDirection reference remains resolvable.

FunctionalDirection cannot be changed through ordinary update,
lifecycle command or reparent.

Do not directly query Organization DbContext.

Do not use direction code/name for authorization.

Use authoritative stable ID.

If a direction later becomes INACTIVE, do not silently cascade
AssetType lifecycle changes.

Apply published selectability when creating a new reference.

==================================================
STEP 10 — REFERENCE SELECTABILITY
==================================================

Future Asset creation may reference:

ANY ACTIVE AssetType.

Leaf-only restriction:
NO.

INACTIVE AssetType:
resolvable for existing references,
not selectable for new references.

Provide an Assets-owned reference contract for future consumers
if it is consistent with current module architecture.

Do not implement Asset entity in this task.

==================================================
STEP 11 — TAXONOMY LOCK
==================================================

Hierarchy-dependent management requires:

PostgreSQL transaction-scoped advisory lock.

Use ONE stable global taxonomy lock identity for this AssetType tree.

Before implementation:

inspect existing advisory-lock conventions and namespace allocation.

Choose and document an exact stable lock key.

Avoid collision with other module locks.

Do not use:

process-local lock
in-memory mutex
Redis lock as sole correctness mechanism.

For hierarchy-dependent mutation:

begin transaction
acquire taxonomy advisory lock
read fresh authoritative hierarchy
read/evaluate authorization
validate domain invariants
mutate
persist durable Audit obligation
commit transaction.

Lock retained through business/Audit commit.

==================================================
STEP 12 — CONCURRENCY
==================================================

All hierarchy-dependent management operations must follow
the same structural serialization protocol.

At minimum:

create child
reparent
activate
deactivate
update when authorization depends on ancestry.

Do not authorize against stale pre-lock ancestry.

All existing-row mutations additionally require:

expectedRowVersion.

Stale write:
409 OPTIMISTIC_CONCURRENCY_CONFLICT.

No automatic last-write-wins retry.

==================================================
STEP 13 — REPARENT
==================================================

Separate command.

Input:

newParentAssetTypeId nullable
reason
expectedRowVersion.

Reason:

required
trim
max 500.

Rules:

same node as parent:
DENY

descendant as parent:
DENY

cross-direction parent:
DENY

INACTIVE target parent:
DENY

cycle:
DENY

move to root:
allowed if authorization permits.

Entire subtree follows source automatically.

Cycle detection must use authoritative PostgreSQL hierarchy facts,
for example recursive CTE.

Do not trust caller-supplied ancestry.

==================================================
STEP 14 — IDENTITY CONTRACTS
==================================================

Use published:

IGlobalGrantProvider

and:

IEffectiveScopeProvider.GetCurrentAssignmentScopesAsync

GLOBAL:
evaluated separately.

Non-global:
immutable complete assignment tuples.

Do not flatten scope dimensions.

Do not combine different assignment tuples into synthetic grants.

Identity owns assignment facts.

Assets owns hierarchy, direction facts, coverage and mutation policy.

No direct Identity DbContext access.

==================================================
STEP 15 — MANAGEMENT AUTHORIZATION
==================================================

Exact permission:

assets.manage_types

Caller must be:

authenticated
ACTIVE INTERNAL local user
valid owned INTERNAL working context.

GLOBAL branch:

explicit effective GLOBAL assets.manage_types
authorizes taxonomy management subject to business rules.

Non-global branch:

evaluate each complete assignment tuple independently.

Any geographic field present:

territorial_zone_id
region_id
site_id

makes THAT tuple ineligible for taxonomy management.

Direction scope:

exact authoritative FunctionalDirection match.

AssetType scope:

scope root + its authoritative descendants.

Direction + AssetType:

intersection within SAME assignment tuple.

Assignments do not lend dimensions to each other.

Unknown/stale scope root:
fail closed for that assignment.

Provider failure:
fail closed.

==================================================
STEP 16 — CREATE AUTHORIZATION
==================================================

Create root:

GLOBAL:
ALLOW.

Direction-only:
ALLOW for exact requested selectable direction.

Type-only:
DENY.

Direction + Type:
DENY.

Geographic-containing:
DENY management.

Create child:

parent is authoritative existing AssetType.

GLOBAL:
ALLOW.

Direction-only:
parent direction must match.

Type-only:
parent must lie within assigned subtree.

Direction + Type:
both requirements must hold.

Geographic-containing:
DENY.

Parent ACTIVE and homogeneous direction required separately.

==================================================
STEP 17 — TARGET AUTHORIZATION
==================================================

For:

update
activate
deactivate

authorize using fresh target/hierarchy facts after structural lock.

GLOBAL:
ALLOW.

Direction:
exact target direction.

Type:
target lies in scoped subtree.

Direction + Type:
intersection.

Geographic-containing tuple:
DENY.

Business validation still applies.

==================================================
STEP 18 — REPARENT AUTHORIZATION
==================================================

Reparent changes future authorization coverage.

Require source and destination to be covered appropriately.

GLOBAL:
may move subject to business rules.

Direction-only:
source and destination must remain within same authorized direction.
Move to root allowed.

Type-only:
source and destination must both remain inside the SAME authorized
scope-root subtree.

Move to root:
DENY.

Reparent scope root itself outside its subtree:
DENY.

Direction + Type:
both direction and SAME-subtree restrictions apply.

Geographic-containing:
DENY.

Do not combine source coverage from one assignment with destination
coverage from another assignment to bypass the same-subtree rule.

Re-evaluate after taxonomy lock acquisition.

==================================================
STEP 19 — CATALOG READ AUTHORIZATION
==================================================

Exact permissions:

assets.read
OR
assets.manage_types

User/context:

ACTIVE INTERNAL
owned current INTERNAL context.

Eligible if at least one current assignment for either exact permission:

explicit GLOBAL

OR

valid recognized non-global concrete/composite assignment.

Use published trusted providers.

After eligibility:

catalog is GLOBAL master data.

No geographic filtering.
No direction filtering.
No subtree filtering.

A geographic assignment may authorize catalog READ,
but not taxonomy MANAGEMENT.

Unauthorized:
403, not empty 200.

Unauthenticated:
401.

==================================================
STEP 20 — READ API
==================================================

Use current API conventions.

Required conceptual operations:

GET /api/v1/asset-types

GET /api/v1/asset-types/{id}

List supports:

parentAssetTypeId nullable
status filter if supported by current reference pattern
pagination.

Lazy hierarchy reading:

null parent => roots;
specific parent => direct children.

Default page:
1.

Default size:
50.

Maximum size:
200.

Ordering:

code ASC
id ASC.

Read both ACTIVE and INACTIVE.

Management mutations must not depend on client list filtering.

==================================================
STEP 21 — MANAGEMENT API
==================================================

Implement routes consistent with current backend conventions.

Preferred:

POST /api/v1/asset-types

PUT /api/v1/asset-types/{id}

POST /api/v1/asset-types/{id}/reparent

POST /api/v1/asset-types/{id}/activate

POST /api/v1/asset-types/{id}/deactivate

No DELETE.

Create:

parentAssetTypeId nullable
functionalDirectionId
code
name
isSystemType
isComponentType.

Update:

name
isSystemType
isComponentType
expectedRowVersion.

Reparent:

newParentAssetTypeId nullable
reason
expectedRowVersion.

Lifecycle:

expectedRowVersion.

No caller-controlled:

authorization permission
effective scope
ancestry
rowVersion override
audit actor
timestamps.

Management direct target detail must provide current rowVersion
through a legitimate authorized read route.

==================================================
STEP 22 — TARGET CONCEALMENT
==================================================

For direct management routes:

evaluate caller eligibility before leaking target facts.

Do not allow unauthorized callers to distinguish existing/missing
AssetType IDs through target-specific results.

Follow published 401/403/404 conventions.

==================================================
STEP 23 — PERSISTENCE
==================================================

Use Assets DbContext and Assets-owned schema.

Expected table:

assets.asset_types

or exact repository convention.

Columns:

id
parent_asset_type_id
functional_direction_id
code
name
is_system_type
is_component_type
status
created_at
updated_at
row_version.

Constraints:

PK
global unique code
self-referencing parent FK
required direction ID
status validation
length validation
row version.

No database FK from Assets to Organization-owned FunctionalDirection table.

Cross-module validation through application contract.

==================================================
STEP 24 — MIGRATION
==================================================

One narrow Assets migration.

No unrelated tables.

No Asset records.

No Manufacturer/Model.

No attributes.

No composites.

No AssetType seeds.

Verify EF snapshot/model drift.

If canonical Assets permission seeds are missing, include only the
conditional data-only Identity migration authorized above.

==================================================
STEP 25 — AUDIT
==================================================

Every successful mutation creates a durable Assets-owned Audit obligation
atomically with business mutation.

Actions according to canonical naming conventions:

AssetTypeCreated
AssetTypeUpdated
AssetTypeReparented
AssetTypeActivated
AssetTypeDeactivated.

Audit must contain server-derived actor/context and changed facts.

Reparent Audit includes reason and authoritative old/new parent facts.

No Audit event for read.

No successful mutation Audit for:

authorization denial
validation failure
duplicate code
stale version
cycle rejection
invalid lifecycle transition.

No direct write to Audit DbContext.

Reuse canonical durable delivery pattern.

==================================================
STEP 26 — SECURITY TEST MATRIX
==================================================

Test independently:

1. GLOBAL assets.manage_types allows management.

2. GLOBAL assets.read permits catalog read only.

3. Site-scoped assets.manage_types denies management.

4. Region-scoped assets.manage_types denies management.

5. Zone-scoped assets.manage_types denies management.

6. Site + Direction denies management.

7. Region + AssetType denies management.

8. Direction-only covers exact direction.

9. Type-only covers exact subtree.

10. Direction + Type requires same-tuple intersection.

11. Direction from tuple A + Type from tuple B cannot synthesize
    one combined authorization.

12. Scoped root cannot escape via reparent.

13. Destination outside same subtree denies scoped move.

14. Caller permission/scope injection denies.

15. Caller ancestry injection has no effect.

16. Wrong/foreign context denies.

17. Future/expired assignment denies.

18. Contractor/external denies.

19. Missing/stale scope IDs fail closed.

20. Provider failure fails closed.

21. Permission seed alone grants nothing.

==================================================
STEP 27 — DOMAIN TESTS
==================================================

Cover:

UUIDv7
code normalization
code regex
code immutability
duplicate name allowed
flags all four combinations
flags mutation
multiple roots
arbitrary depth
same-direction hierarchy
cross-direction move denial
create ACTIVE
inactive remains readable
inactive not selectable
active non-leaf selectable
activate with inactive parent denied
deactivate with any active descendant denied
move to root
self-parent denial
descendant-cycle denial
reason validation
rowVersion progression.

==================================================
STEP 28 — REAL POSTGRESQL TESTS
==================================================

Publication-critical.

Use real PostgreSQL for:

migration
unique code
duplicate create race
self-FK
recursive ancestry
cycle prevention
concurrent reparent
concurrent scoped authorization versus reparent
transaction advisory lock
stale rowVersion
Audit atomicity
rollback on obligation failure
migration idempotency
model drift.

Include adversarial two-transaction test:

T1 reads target under scoped subtree.
T2 tries to move target outside that subtree.
T1 mutation must never commit using stale authorization.

Do not substitute mock-only evidence for transaction safety.

==================================================
STEP 29 — REFERENCE CONTRACT TESTS
==================================================

Verify integration with published FunctionalDirection provider.

ACTIVE direction:
new AssetType allowed.

INACTIVE direction:
new AssetType denied.

Missing direction:
denied.

Existing references to inactive direction:
remain resolvable.

No Organization DbContext access from Assets.

For future Asset consumers verify:

ACTIVE AssetType selectable.
INACTIVE AssetType not selectable.
Non-leaf ACTIVE AssetType selectable.

==================================================
STEP 30 — HTTP TESTS
==================================================

Cover:

root list
children list
direct get
create root
create child
update
activate
deactivate
reparent
pagination
stable ordering
401
403
404
409 duplicate
409 stale version
cross-direction denial
cycle denial
no DELETE.

Run production-style authorization composition where practical.

==================================================
STEP 31 — REGRESSION
==================================================

Run existing:

Identity global-grant tests
Identity correlated-scope tests
FunctionalDirection tests
Organization authorization
Sites authorization
Location authorization
Audit delivery
architecture checks.

AssetType implementation must not change published authorization
semantics of other modules.

==================================================
STEP 32 — ARCHITECTURE
==================================================

Required:

Assets Domain:
no EF/HTTP/Rabbit/Redis dependency.

Assets → Organization:
published reference application contract only.

Assets → Identity:
published authorization application contracts only.

Assets → Audit:
canonical Audit obligation contract only.

No direct cross-module DbContext access.

No mutable EF entities leaked by reference APIs.

No premature generic authorization engine.

No new workflow engine.

==================================================
STEP 33 — DOCUMENTATION
==================================================

Synchronize applicable:

docs/backlog.md
docs/modules/assets.md
Assets context capsule
docs/database.md
docs/reference-data-registry.md
docs/permissions-registry.md
docs/security.md
authorization/ADR links
TASK-03.01.01 checkpoint.

Document:

taxonomy hierarchy
FunctionalDirection homogeneity
flags semantics
lifecycle
assignability
scope model
same-assignment intersection
reparent safeguards
advisory lock exact key
transaction ordering
API
Audit
migration.

Do not modify Accepted ADR contents destructively.

Do not claim Asset entity or UI implemented.

==================================================
STEP 34 — FULL LOCAL VALIDATION
==================================================

Run:

Release build

AssetType domain tests
AssetType PostgreSQL tests
AssetType API tests
AssetType authorization tests
AssetType hierarchy/concurrency tests
AssetType Audit atomicity/delivery tests
FunctionalDirection integration tests
Identity scope regressions
Identity GLOBAL regressions
Organization regressions
Sites regressions
Location regressions
architecture tests
migration smoke
model drift
infrastructure checks
all executable backend harnesses
dotnet test
frontend lint/build/tests
git diff --check
formatting
docs consistency
secret hygiene.

Frontend production code:
UNCHANGED.

Expected existing frontend tests:
71/71 PASS.

Do not weaken tests to achieve green results.

==================================================
STEP 35 — INDEPENDENT LOCAL SECURITY CHECK
==================================================

Attack at minimum:

- geographic to taxonomy escalation;
- direction/type scope widening;
- cross-assignment correlation loss;
- stale ancestry authorization;
- type-scoped root escape;
- concurrent reparent bypass;
- cross-direction hierarchy;
- inactive ancestry bypass;
- duplicate code race;
- stale writes;
- caller-controlled permissions/scopes;
- provider fail-open;
- unaudited mutation;
- non-atomic Audit;
- raw DB error leakage;
- hard delete;
- cross-module persistence access.

Publication candidate requires:

OPEN_CRITICAL = 0
OPEN_HIGH = 0
OPEN_MEDIUM = 0.

If owner-level contract change required:
STOP.

==================================================
STEP 36 — LOCAL COMMIT
==================================================

After all gates PASS:

verify branch main.

Verify origin/main still equals:

faa09a7b77d8d9bfb5f416a1d00ce6070bbd61f6

Stage deliberately:

Assets implementation
relevant migration(s)
tests
docs
TASK-03.01.01 checkpoint.

Do not stage unrelated AUTH-SCOPE/FunctionalDirection operational notes.

Inspect:

git diff --cached --check
git diff --cached --stat
git diff --cached

Create ONE atomic commit.

Suggested:

feat(assets): add AssetType hierarchy foundation

Do NOT push.

==================================================
FINAL OUTPUT
==================================================

TASK: TASK-03.01.01
PHASE: ASSET-TYPE-01
STATUS:

BASELINE_SHA:
LOCAL_MAIN_SHA:
COMMIT:
COMMIT_PARENT:

FUNCTIONAL_DIRECTION_PROVIDER:
IDENTITY_SCOPE_PROVIDER:
GLOBAL_PROVIDER:

ASSET_TYPE_ENTITY:
FIELDS:
CODE_RULE:
CODE_UNIQUE:
CODE_IMMUTABLE:
NAME_RULE:
FLAGS:
STATUS_MODEL:
NON_LEAF_ASSIGNABLE:
INACTIVE_SELECTABLE:
HARD_DELETE:

HIERARCHY:
MULTIPLE_ROOTS:
ARBITRARY_DEPTH:
FUNCTIONAL_DIRECTION_IMMUTABLE:
PARENT_CHILD_DIRECTION_MATCH:

TAXONOMY_LOCK:
EXACT_LOCK_KEY:
LOCK_ACQUISITION_ORDER:
POST_LOCK_AUTHORIZATION:
CONCURRENT_REPARENT_SAFETY:

GLOBAL_MANAGEMENT:
DIRECTION_MANAGEMENT:
TYPE_SUBTREE_MANAGEMENT:
DIRECTION_TYPE_INTERSECTION:
GEOGRAPHIC_MANAGEMENT:
CROSS_ASSIGNMENT_COMBINATION:

CREATE_ROOT_RULE:
CREATE_CHILD_RULE:
UPDATE_RULE:
REPARENT_RULE:
TYPE_SCOPE_ROOT_ESCAPE:
MOVE_TO_ROOT_TYPE_SCOPE:

CATALOG_READ_RULE:
CATALOG_FILTERING:
READ_ROUTE:
DETAIL_ROUTE:
CREATE_ROUTE:
UPDATE_ROUTE:
REPARENT_ROUTE:
ACTIVATE_ROUTE:
DEACTIVATE_ROUTE:
DELETE_ROUTE:

PERMISSIONS:
IDENTITY_PERMISSION_MIGRATION:
IDENTITY_SCHEMA_CHANGED:
GLOBAL_GRANTS_CREATED:

AUDIT_MODEL:
AUDIT_ACTIONS:
AUDIT_ATOMICITY:

ASSETS_MIGRATION:
MODEL_DRIFT:
MIGRATION_SMOKE:

POSTGRESQL_TESTS:
CONCURRENCY_TESTS:
DOMAIN_TESTS:
REFERENCE_TESTS:
AUTH_TESTS:
API_TESTS:
AUDIT_TESTS:
IDENTITY_REGRESSION:
ORGANIZATION_REGRESSION:
SITES_REGRESSION:
LOCATION_REGRESSION:
ARCHITECTURE_CHECKS:
RELEASE_BUILD:
DOTNET_TEST:
FRONTEND_TESTS:
EXPLICIT_HARNESSES:

SECURITY_FINDINGS:
OPEN_CRITICAL:
OPEN_HIGH:
OPEN_MEDIUM:
OPEN_LOW:

FRONTEND_PRODUCTION_CODE_CHANGED:
NO

ASSET_ENTITY_IMPLEMENTED:
NO

CHECKPOINT_UPDATED:
DOCUMENTATION_SYNC:

CURRENT_BRANCH:
main

ORIGIN_MAIN_SHA:
LOCAL_MAIN_AHEAD_BY:
WORKTREE:
PUSH:
NONE

NEXT_ACTION:
Independent security/contract review of ASSET-TYPE-01 local commit,
then separate publication with exact-SHA hosted CI.

STOP.
