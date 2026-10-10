TASK:
TASK-03.01.01

PHASE:
ASSET-TYPE-01F1 — SEC-01 TRUST BOUNDARY REMEDIATION

MODE:
BOUNDED SECURITY REMEDIATION DIRECTLY ON MAIN

MODEL:
gpt-6-sol

EFFORT:
high

==================================================
GOAL
==================================================

Fix exactly one independently confirmed security finding:

SEC-01
SEVERITY: MEDIUM
PRIORITY: P2

LOCATION:
src/backend/Modules/Assets/
Exploitation.Modules.Assets.Application/
AssetTypes/AssetTypeAuthorizationService.cs

Reported lines:
45-46

FINDING:
Public CanManageAsync trusts FunctionalDirection information
from caller-supplied target DTO.

INDEPENDENT EVIDENCE:
Against real Identity/PostgreSQL state, a forged target DTO
received ALLOW for a FunctionalDirection outside the
caller's actual authority.

Current production command/API path denied the mutation.

REQUIRED:
Harden the authorization application contract itself.
Do not rely solely on the currently protected HTTP path.

Create ONE separate remediation commit.

Do NOT amend the original source commit.

Do NOT push.

Independent re-review will follow.

==================================================
BASELINE
==================================================

Published origin/main:

faa09a7b77d8d9bfb5f416a1d00ce6070bbd61f6

Original implementation candidate:

c618c1af837326aada23ed7a64b762089223ca5e

Expected:

branch:
main

HEAD:
c618c1af837326aada23ed7a64b762089223ca5e

origin/main:
faa09a7b77d8d9bfb5f416a1d00ce6070bbd61f6

ahead:
1

Existing independent review:

.agent/tasks/TASK-03.01.01/asset-type-review.md

SEC-01:
OPEN MEDIUM

Do not discard, overwrite or stage unrelated operational notes.

==================================================
STEP 1 — REPOSITORY GUARD
==================================================

Run:

git fetch origin
git status --short
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
git worktree list

Verify expected hashes and branch.

Identify all dirty/untracked paths.

If origin/main has advanced:
STOP.

If unrelated implementation changes exist:
STOP.

No branch/worktree/reset/rebase/stash.

==================================================
STEP 2 — READ ORIGINAL REVIEW
==================================================

Read:

.agent/tasks/TASK-03.01.01/asset-type-review.md

Read exact SEC-01 evidence.

Inspect:

AssetTypeAuthorizationService
CanManageAsync
all CanManageAsync call sites
all application interfaces exposing the method
authorization tests
AssetType commands
AssetType repositories
taxonomy advisory lock implementation.

Determine exactly how untrusted target DTO facts can reach
the public authorization method.

Record:

VULNERABLE_METHOD_SIGNATURE:
UNTRUSTED_TARGET_FIELDS:
FORGED_DIRECTION_PATH:
EXISTING_API_PROTECTION:
OTHER_CALLERS:

Do not assume the reported two lines are the only affected path.

==================================================
STEP 3 — REPRODUCE BEFORE FIX
==================================================

Preserve a focused reproduction of the original finding.

Scenario:

Persist AssetType T:

Id = T
FunctionalDirectionId = D_REAL

Persist valid Identity permission scope:

assets.manage_types
FunctionalDirectionId = D_ALLOWED

where:

D_ALLOWED != D_REAL

Construct forged authorization input:

AssetTypeId = T
FunctionalDirectionId = D_ALLOWED

Previously:

CanManageAsync => ALLOW.

Required corrected result:

DENY.

Use production authorization composition with real
Identity/Assets PostgreSQL state.

Do not replace the finding with a mock-only test.

If the vulnerable public method is removed, adapt the test
to the replacement public authorization contract.

The test must demonstrate that a caller cannot gain authority
by supplying false domain facts.

==================================================
STEP 4 — AUTHORITATIVE TARGET FACTS
==================================================

For EXISTING AssetType authorization:

derive from Assets-owned trusted persistence:

AssetType.Id
AssetType.FunctionalDirectionId
AssetType.ParentAssetTypeId
authoritative ancestry / subtree coverage.

Do not trust:

DTO.FunctionalDirectionId
DTO.ParentAssetTypeId
DTO.AncestorIds
DTO.ScopeRootId

as evidence about an EXISTING target.

Transport input identifies the requested target/operation.

Assets persistence establishes actual target facts.

==================================================
STEP 5 — HARDEN PUBLIC CONTRACT
==================================================

Prefer redesigning the public authorization API so that
authorization-relevant existing-target facts cannot be forged
through a caller-created DTO.

Preferred conceptual contract:

CanManageExistingAsync(
    trusted current user/context,
    AssetTypeId,
    operation,
    cancellationToken)

Exact signature must follow repository conventions.

The service must resolve authoritative target facts itself,
or through a tightly controlled Assets-owned trusted resolver.

Do not expose a second public overload accepting arbitrary
direction/ancestry facts.

If internal policy evaluation uses a facts object:

- keep it private/internal to the trusted composition;
- construct it from authoritative persistence;
- do not expose it as a general authorization input;
- do not allow an arbitrary caller to label a DTO "trusted".

Do not merely rename the vulnerable method.

==================================================
STEP 6 — CREATE OPERATIONS
==================================================

Distinguish existing-target authorization from CREATE.

CREATE ROOT has no persisted AssetType target yet.

For CREATE ROOT:

- requested FunctionalDirectionId is desired business input;
- validate its existence/selectability through published
  Organization FunctionalDirection reference provider;
- compare it with trusted Identity direction scope;
- never treat requested direction ID as proof of authorization.

For CREATE CHILD:

- load actual persisted parent;
- use parent's authoritative FunctionalDirectionId;
- verify ACTIVE parent;
- enforce direction homogeneity;
- evaluate authorization using persisted parent ancestry.

Do not make create behavior accidentally require an
already-existing new AssetType.

==================================================
STEP 7 — UPDATE / LIFECYCLE
==================================================

For:

UPDATE
ACTIVATE
DEACTIVATE

resolve existing target from trusted Assets persistence.

Authorization must compare exact trusted Identity scopes
against authoritative target direction and subtree.

Caller-provided direction must never substitute for
stored direction.

No permission widening.

==================================================
STEP 8 — REPARENT
==================================================

Reparent must use authoritative:

source AssetType
source direction
source ancestry
destination parent
destination ancestry.

Never authorize using supplied DTO hierarchy facts.

For type-scoped management:

source and destination must remain covered by the SAME
complete qualifying assignment tuple.

Do not use one assignment for source and another for
destination to synthesize a reparent grant.

Move-to-root under type-only scope:
DENY.

Moving the scope root outside its subtree:
DENY.

Preserve existing accepted global/direction rules.

==================================================
STEP 9 — TRANSACTION / LOCK
==================================================

Publication-critical.

For hierarchy-dependent mutations:

BEGIN TRANSACTION

acquire existing PostgreSQL transaction-scoped
taxonomy advisory lock

load fresh authoritative target/hierarchy facts

evaluate authorization

validate business invariants

mutate

persist durable Audit obligation

COMMIT.

Use the SAME lock identity and existing transaction model.

Do not allocate a second taxonomy lock.

Do not authorize on a pre-lock DTO and rely on it after lock.

Do not open an unrelated database transaction/connection
for the authoritative read that can break consistency.

If repository abstraction cannot support trusted post-lock
reads within the existing transaction:

STATUS:
SEC_01_TRANSACTION_CONTRACT_GAP

STOP.

Do not weaken transaction guarantees.

==================================================
STEP 10 — IDENTITY TRUST BOUNDARY
==================================================

Continue using published:

IGlobalGrantProvider

IEffectiveScopeProvider.GetCurrentAssignmentScopesAsync

Do not query Identity DbContext directly.

Do not modify Identity provider semantics.

Keep:

GLOBAL explicit

geographic tuple management denied

direction exact match

type-subtree coverage

same-assignment intersection

composite scope correlation

permission-specific matching.

No caller-provided authorization evidence.

==================================================
STEP 11 — FAIL CLOSED
==================================================

For existing target:

missing target:
canonical not-found/denial result.

missing authoritative direction:
DENY / canonical data-integrity handling.

missing scope root:
DENY affected assignment.

inconsistent hierarchy:
DENY / integrity failure.

authoritative persistence failure:
FAIL CLOSED.

Identity provider failure:
FAIL CLOSED.

Do not retry with caller-supplied DTO values.

Do not fall back to requested direction as authoritative.

==================================================
STEP 12 — NO PRIVILEGE REGRESSION
==================================================

Valid requests must retain accepted semantics.

Test:

GLOBAL management:
ALLOW subject to business rules.

Direction-scoped management:
ALLOW only for real matching direction.

Type-scoped management:
ALLOW inside real subtree.

Direction + Type:
ALLOW only for real intersection.

Geographic-containing tuple:
DENY management.

GLOBAL assets.read:
read only, no management.

Unrelated GLOBAL permission:
DENY management.

==================================================
STEP 13 — ADVERSARIAL TESTS
==================================================

Add real PostgreSQL/Identity tests for:

A. Original SEC-01 forged direction DTO
   -> DENY.

B. Correct target direction under matching trusted scope
   -> ALLOW.

C. Existing target in different real direction
   -> DENY even if DTO claims otherwise.

D. Forged parent ID
   -> no authority widening.

E. Forged ancestry
   -> no authority widening.

F. Forged scope root
   -> no authority widening.

G. Cross-assignment Direction/Type dimensions
   -> no synthetic grant.

H. Type subtree root escape
   -> DENY.

I. Missing authoritative target
   -> no ALLOW.

J. Stale/missing scope root
   -> no ALLOW.

K. Provider/database failure
   -> no ALLOW.

L. GLOBAL permission isolation
   -> preserved.

Tests must exercise the real public application
authorization contract, not just current HTTP commands.

==================================================
STEP 14 — CALL-SITE AUDIT
==================================================

Enumerate EVERY production caller of the vulnerable API.

Verify each now uses the safe contract.

Search for other public authorization helpers accepting:

AssetType DTO
FunctionalDirectionId
ParentId
AncestorIds
scope facts

as if caller-provided values were authoritative.

Fix only equivalent instances of the SAME SEC-01 flaw.

Do not expand into unrelated authorization redesign.

==================================================
STEP 15 — HTTP REGRESSION
==================================================

Re-run all AssetType routes:

list/get
create root
create child
update
reparent
activate/deactivate.

Verify legitimate authorized requests still work.

Verify denied requests remain denied.

Unauthorized direct target paths must not disclose
protected target existence.

No API schema change unless required to remove an unsafe
authorization-evidence parameter.

==================================================
STEP 16 — CONCURRENCY REGRESSION
==================================================

Real PostgreSQL.

Repeat:

T1 authorized scoped mutation

T2 concurrent reparent outside scope.

Verify post-lock authorization uses actual hierarchy.

Repeat lifecycle races:

deactivate ancestor vs activate/create child

concurrent competing reparent

scope-root reparent escape.

No mutation may commit using stale authorization facts.

==================================================
STEP 17 — AUDIT REGRESSION
==================================================

All successful mutations continue to persist:

business state
+
durable Assets Audit obligation

atomically.

Authorization denial must not persist a successful
business mutation or successful Audit obligation.

Audit failure must roll back business mutation.

No new Audit delivery mechanism.

==================================================
STEP 18 — SCOPE RESTRICTIONS
==================================================

Expected remediation scope:

AssetType authorization service
related application interface/call sites
narrow supporting Assets repository abstraction if needed
focused security regression tests
task-owned docs/checkpoint.

Forbidden unless a proven necessity directly arises:

Identity schema/migration
Assets schema/migration
permission seeds
Organization implementation
Sites/Location implementation
GLOBAL provider changes
Assets business model redesign
frontend functionality
unrelated refactoring.

If a wider architectural change is required:
STOP and report.

==================================================
STEP 19 — FULL LOCAL VALIDATION
==================================================

Run:

focused SEC-01 reproduction

AssetType authorization tests

real PostgreSQL scope tests

real PostgreSQL hierarchy/concurrency tests

AssetType lifecycle tests

AssetType HTTP tests

AssetType Audit atomicity/delivery tests

FunctionalDirection reference regressions

Identity global scope regressions

Identity correlated assignment regressions

Organization regressions

Sites regressions

Location regressions

architecture checks

migration smoke

model drift

Release build

all 14 backend harnesses

dotnet test

frontend lint/build/tests

git diff --check

formatting

documentation consistency

secret hygiene.

Do not weaken existing assertions.

==================================================
STEP 20 — REMEDIATION REVIEW
==================================================

Inspect changed diff independently from feature implementation.

Required:

ORIGINAL_EXPLOIT:
DENIED

PUBLIC_AUTH_CONTRACT:
HARDENED

EXISTING_TARGET_FACTS:
AUTHORITATIVE

POST_LOCK_AUTHORIZATION:
PRESERVED

GLOBAL_SEMANTICS:
PRESERVED

DIRECTION_SCOPE:
PRESERVED

TYPE_SUBTREE_SCOPE:
PRESERVED

ASSIGNMENT_CORRELATION:
PRESERVED

AUDIT_ATOMICITY:
PASS

OPEN_CRITICAL:
0

OPEN_HIGH:
0

OPEN_MEDIUM:
0

Do not declare the independent ASSET-TYPE-01R review complete
inside this implementation phase.

The follow-up reviewer must independently verify SEC-01 closure.

==================================================
STEP 21 — REMEDIATION COMMIT
==================================================

After focused and full validation PASS:

verify:

branch main

HEAD before commit:
c618c1af837326aada23ed7a64b762089223ca5e

origin/main:
faa09a7b77d8d9bfb5f416a1d00ce6070bbd61f6

Stage only remediation-owned files.

Do not stage:

existing unrelated checkpoint changes

original unstaged independent review evidence

downstream task notes.

Review:

git diff --cached --check
git diff --cached --stat
git diff --cached

Create ONE separate commit:

fix(assets): validate AssetType authorization against persisted facts

Do NOT amend:

c618c1af837326aada23ed7a64b762089223ca5e

Do NOT push.

==================================================
STEP 22 — REPORT
==================================================

TASK:
TASK-03.01.01

PHASE:
ASSET-TYPE-01F1

STATUS:

BASELINE_SHA:
SOURCE_COMMIT:
REMEDIATION_COMMIT:
REMEDIATION_PARENT:

SEC_01_ORIGINAL_SEVERITY:
MEDIUM

ROOT_CAUSE:
VULNERABLE_METHOD:
NEW_PUBLIC_CONTRACT:
PRODUCTION_CALL_SITES_UPDATED:

FORGED_DTO_ORIGINAL_REPRODUCED:
FORGED_DTO_AFTER_FIX:
AUTHORITATIVE_TARGET_SOURCE:
AUTHORIZATION_FACTS_SOURCE:

CREATE_ROOT_AUTH:
CREATE_CHILD_AUTH:
UPDATE_AUTH:
LIFECYCLE_AUTH:
REPARENT_AUTH:

TAXONOMY_LOCK:
POST_LOCK_AUTHORITATIVE_READ:
POST_LOCK_AUTHORIZATION:
TRANSACTION_CONSISTENCY:

GLOBAL_AUTH_REGRESSION:
DIRECTION_AUTH_REGRESSION:
TYPE_SUBTREE_AUTH_REGRESSION:
ASSIGNMENT_CORRELATION:
GEOGRAPHIC_MANAGEMENT:
FAIL_CLOSED:

SEC_01_REAL_POSTGRESQL_TEST:
ADVERSARIAL_TESTS:
CONCURRENCY_TESTS:
HTTP_TESTS:
AUDIT_ATOMICITY_TESTS:

BACKEND_HARNESSES:
FRONTEND_TESTS:
RELEASE_BUILD:
DOTNET_TEST:
ARCHITECTURE_CHECKS:
MODEL_DRIFT:
MIGRATION_SMOKE:

IDENTITY_SCHEMA_CHANGED:
NO

ASSETS_SCHEMA_CHANGED:
NO

MIGRATION_CREATED:
NO

PERMISSION_SEEDS_CHANGED:
NO

OPEN_CRITICAL:
OPEN_HIGH:
OPEN_MEDIUM:
OPEN_LOW:

CURRENT_BRANCH:
main

LOCAL_MAIN_SHA:
ORIGIN_MAIN_SHA:
LOCAL_MAIN_AHEAD_BY:

SOURCE_COMMIT_AMENDED:
NO

PUSH:
NONE

NEXT_ACTION:
Run independent ASSET-TYPE-01R2 review of the exact two-commit
range from faa09a7 through the remediation commit.

Explicitly verify SEC-01 exploit closure.

Publish only after independent review PASS,
followed by normal push and exact-SHA hosted CI.

STOP.