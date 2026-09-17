# Contractors Context Capsule

SOURCE_VERSION: 2026-09-16
MODULE: Contractors
MATURITY: STABLE

## PURPOSE

Contractors управляет внешними организациями, договорами, областями действия договоров, участием пользователей в подрядных организациях и назначением внешних пользователей на конкретные договоры.

Модуль является ключевым элементом security boundary.

## OWNS

- ContractorOrganization
- Contract
- ContractScope
- ContractorUserMembership
- UserContractAssignment

## DB

Основные таблицы:

- `contractors.organizations`
- `contractors.contracts`
- `contractors.contract_scopes`
- `contractors.user_memberships`
- `contractors.user_contract_assignments`

## CORE ACCESS MODEL

```text
User
→ Contractor Organization
→ Contract
→ User Contract Assignment
→ Contract Scope
→ Validity
→ Working Context
```

Ни одно звено нельзя пропускать при operational access.

## INVARIANTS

- Contractor account может существовать дольше конкретного договора.
- Operational rights прекращаются по expiry договора/assignment.
- Один external person может состоять в нескольких подрядных организациях.
- Один user account используется в нескольких contracts через разные contexts.
- Contractor organization membership само по себе не даёт право на объект.
- Contract должен быть active и находиться в valid period.
- UserContractAssignment должен быть active.
- ContractScope должен разрешать target site/region/direction/asset type/action.
- Customer side управляет критичными подтверждениями доступа.
- Contractor может создавать subordinate account, но новый account не получает operational access до customer verification.
- Cross-contract leakage недопустим.
- Contractor не должен видеть внутренние данные вне contract scope.
- Scope validity/history сохраняются.
- Contractor access всегда учитывается в audit working context.

## CONTRACT CORE

Минимум:

- contractor organization;
- contract number;
- name;
- valid_from;
- valid_to;
- status;
- responsible customer user.

## CONTRACT SCOPE

Может ограничивать:

- region;
- site;
- functional direction;
- asset type;
- work type;
- permission/action.

Scope должен быть explicit.

## USER MEMBERSHIP

Описывает:

```text
user belongs to contractor organization
```

Но не даёт operational rights автоматически.

## USER CONTRACT ASSIGNMENT

Описывает:

```text
user authorized to work under contract
```

Хранит:

- valid_from;
- valid_to;
- status;
- verified_by;
- verified_at.

## ACCOUNT CREATION FLOW

```text
contractor creates subordinate user
→ PENDING_VERIFICATION
→ customer verifies
→ membership/assignment activated
→ user gets working context
```

## WORKING CONTEXT

Для contractor request active context должен однозначно указывать:

- contractor organization;
- contract;
- assignment.

Backend проверяет ownership context пользователем.

## PERMISSIONS

Типовые:

- `contractors.read`
- `contractors.manage_organizations`
- `contractors.manage_contracts`
- `contractors.manage_scopes`
- `contractors.manage_users`
- `contractors.verify_user`
- `contractors.manage_assignments`

Operational business permissions (`workorders.execute` и т.п.) остаются в соответствующих модулях и пересекаются с contract scope.

## PUBLIC CONTRACTS

Полезные:

- `ContractReference`
- `ContractorOrganizationReference`
- `ContractAccessContext`
- `IContractorsModule.ValidateOperationalAccess(...)`
- `IContractorsModule.GetActiveContractContext(userId, contextId)`

## EVENTS

Основные:

- `ContractCreated`
- `ContractActivated`
- `ContractExpired`
- `ContractScopeChanged`
- `ContractorUserSubmitted`
- `ContractorUserVerified`
- `UserAssignedToContract`
- `ContractAssignmentExpired`

## DEPENDS_ON

Допустимо:

- Identity contracts/abstractions;
- Organization/Sites contracts;
- shared audit/clock/outbox.

Contractors не должен зависеть от WorkOrders/Assets Infrastructure.

## SECURITY RULE

Любой contractor-facing business endpoint должен проверять:

```text
membership
+
contract
+
assignment
+
scope
+
validity
+
working context
```

## EXPIRY

Access query:

```text
valid_from <= now
AND
(valid_to IS NULL OR valid_to > now)
```

Для contract/assignment.

Scheduler может выдавать warnings о скором expiry, но отсутствие scheduler не должно делать expired access валидным.

## AUDIT

Обязательно для:

- contract scope change;
- verification user;
- assignment activation/revocation;
- manual extension;
- emergency exception if introduced.

## FORBIDDEN

- `user_type == CONTRACTOR` как достаточная authorization;
- broad organization-wide access без contract scope;
- продолжение доступа после expiry;
- один global contractor role на все объекты;
- contractor self-verification;
- reuse чужого working context;
- удаление истории scope/assignment;
- хранить contract restrictions только в UI.

## TOP_TEST_RISKS

- correct role but wrong contract;
- correct contract but expired assignment;
- same user in two contractor organizations;
- context spoofing;
- cross-region leakage;
- scope excludes asset type;
- subordinate user not yet verified;
- revoked assignment still cached;
- contract end date boundary.
