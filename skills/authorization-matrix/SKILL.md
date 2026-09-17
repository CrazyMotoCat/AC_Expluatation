---
name: authorization-matrix
version: 1.0
purpose: Сформировать минимальную матрицу permissions/scope/working-context и обязательные negative authorization tests для use case.
recommended_max_context_tokens: 1800
---

# authorization-matrix

## Назначение

АС «Эксплуатация» имеет сложную модель:

```text
RBAC
+
Scope
+
Working Context
+
Validity
+
Contractor constraints
```

Этот skill предотвращает типичную ошибку AI:

> Проверить только Role и забыть scope/contract/context.

---

# Когда использовать

Использовать для:

- любого write endpoint;
- чтения чувствительных данных;
- contractor-facing use case;
- документов;
- KVO;
- approvals;
- user/qualification management;
- exports.

Можно пропустить для полностью публичной технической health endpoint.

---

# Вход

```text
Use case
Primary module
Permission candidate
Target entity
Working context type
```

Если permission неизвестен — предложить один candidate, но не создавать permanent permission без проверки project conventions.

---

# Базовая модель проверки

Проверить по порядку:

```text
1. Authenticated?
2. Permission?
3. Active working context?
4. Context belongs to user?
5. Scope includes target?
6. Validity active?
7. Contractor-specific restrictions?
8. Separation-of-duties?
9. Sensitive/KVO extra policy?
```

---

# Scope dimensions

Рассматривать только релевантные:

```text
territorial zone
region
site
functional direction
asset type
contract
team
```

Не добавлять все dimensions механически.

---

# Типовые actors

Использовать минимум:

```text
INTERNAL_ALLOWED
INTERNAL_WRONG_SCOPE
CONTRACTOR_ALLOWED
CONTRACTOR_WRONG_CONTRACT
CONTRACTOR_EXPIRED
NO_PERMISSION
WRONG_CONTEXT
```

Добавлять:

```text
MANAGER
APPROVER
AUDITOR
```

только если use case требует.

---

# Output format

```text
USE_CASE:
CreateAsset

PERMISSION:
assets.create

TARGET:
Asset / Site

REQUIRED_SCOPE:
- site
- asset type

WORKING_CONTEXT:
- INTERNAL
- CONTRACT (only if contract grants create)

EXTRA_RULES:
- location must belong to permitted site
- contractor contract must be active

MATRIX:

| Actor | Permission | Scope | Context | Validity | Expected |
|---|---|---|---|---|---|
| Internal engineer | yes | correct | internal | active | ALLOW |
| Internal engineer | yes | wrong site | internal | active | DENY |
| User | no | correct | internal | active | DENY |
| Contractor | yes | correct | contract A | active | ALLOW if contract scope allows |
| Contractor | yes | correct | contract B | active | DENY |
| Contractor | yes | correct | contract A | expired | DENY |
| User | yes | correct | чужой context | active | DENY |

REQUIRED_TESTS:
- allows_correct_internal_scope
- denies_missing_permission
- denies_wrong_site_scope
- denies_wrong_work_context
- denies_expired_contract
- denies_wrong_contract

AUDIT_CONTEXT_REQUIRED:
YES
```

---

# Contractor rule

Если подрядчик участвует в use case:

обязательно проверить:

```text
membership
contract
assignment
scope
valid_from
valid_to
```

Нельзя ограничиться:

```text
user_type == CONTRACTOR
```

---

# Document rule

Для документов добавить:

```text
classification
entity scope
download permission
```

Для RESTRICTED/CRITICAL:

```text
download audit may be required
```

---

# KVO rule

Если target site:

```text
KVO1 / KVO2 / KVO3
```

проверить, есть ли дополнительный approver/security policy.

Не придумывать её, если она ещё не зафиксирована.

Формат:

```text
KVO_EXTRA_POLICY: CHECK_REQUIRED
```

---

# Separation of duties

Если use case:

- approval;
- review;
- risk acceptance;
- customer verification;

проверить, допустим ли self-approval.

Если правило не определено:

```text
SOD_RULE: UNRESOLVED
```

не делать предположение.

---

# Negative-first rule

Если budget ограничен, приоритет тестов:

```text
1. wrong scope
2. wrong contract/context
3. expired validity
4. missing permission
5. happy path
```

Потому что access leakage критичнее косметического позитивного сценария.

---

# Token economy

Не перечитывать весь `security.md`.

Использовать:

- module capsule;
- relevant permission conventions;
- contractor section при необходимости.

---

# Stop conditions

Skill не пишет authorization framework.

Он создаёт:

- requirement;
- matrix;
- test checklist.

Реализация выполняется vertical slice/use case агентом.
