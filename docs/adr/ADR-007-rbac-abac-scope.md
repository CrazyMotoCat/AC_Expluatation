# ADR-007 — RBAC + Scope/ABAC вместо простой ролевой модели

- **Статус:** Accepted
- **Дата:** 2026-09-16

## Контекст

Организация является матричной.

Один пользователь может одновременно иметь:

- роль инженера;
- определённый регион;
- определённые объекты;
- функциональное направление;
- доступ только к конкретным типам оборудования;
- временную делегацию;
- contractor context;
- несколько договоров.

Простой RBAC:

```text
User → Role
```

не способен корректно описать эту модель.

## Решение

Использовать комбинированную модель:

```text
RBAC
+
Scope / ABAC
+
Working Context
+
Validity
```

Пример:

```text
User: Ivanov
Role: Engineer
Permission: workorders.execute
Region: 03
Direction: Exploitation
AssetType: UPS
Context: Contract 1001
Valid until: 2027-12-31
```

## Основные элементы

### Role

Группа permissions.

### Permission

Конкретное действие:

```text
assets.read
assets.create
workorders.execute
workorders.approve
```

### Scope

Ограничение:

- territorial zone;
- region;
- site;
- functional direction;
- asset type.

### Working Context

Контекст:

- INTERNAL;
- CONTRACT;
- PROJECT;
- DELEGATION;
- TEAM.

### Validity

```text
valid_from
valid_to
```

## Contractor model

Подрядчик получает доступ только через:

```text
User
→ Contractor organization
→ Contract
→ Assignment
→ Scope
→ Validity
```

Учётная запись может существовать бессрочно, права — нет.

## Enforcement

Backend всегда проверяет:

1. authenticated user;
2. permission;
3. active context;
4. scope;
5. validity;
6. contractor/contract constraints.

Frontend check — только UX.

## Причины

- отражает реальную структуру компании;
- поддерживает подрядчиков;
- поддерживает временные полномочия;
- предотвращает broad access.

## Последствия

### Положительные

- точный least privilege;
- поддержка матричной организации;
- один аккаунт может иметь несколько контекстов.

### Отрицательные

- authorization сложнее;
- требуется большой набор authorization tests;
- запросы должны учитывать scope.

## Правило

> Знание ID сущности никогда не даёт право на доступ к ней.
