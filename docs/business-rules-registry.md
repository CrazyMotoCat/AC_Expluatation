# Business Rules Registry — АС «Эксплуатация»

STATUS: WORKING SOURCE OF TRUTH
SOURCE_VERSION: 2026-09-26 (TASK-02.03.03 Phase A contract freeze)

## 1. Назначение

Этот реестр присваивает устойчивым бизнес-правилам идентификаторы.

Формат:

```text
BR-<MODULE>-NNN
```

Эти ID можно использовать:

- в backlog;
- в тестах;
- в комментариях к сложным правилам;
- в документации;
- в acceptance criteria.

ID не переиспользуются.

---

# 2. Identity / Access

### BR-IDN-001
Backend authorization является authoritative; frontend не является security boundary.

### BR-IDN-002
Permission проверяется вместе со scope, working context и validity.

### BR-IDN-003
Знание entity ID не даёт право на доступ.

### BR-IDN-004
Expired access assignment не даёт доступ независимо от роли.

### BR-IDN-005
Contractor access требует membership + contract + assignment + scope + validity + owned working context.

### BR-IDN-006
Contractor account может существовать после окончания договора, но operational rights прекращаются.

### BR-IDN-007
Один external user может иметь несколько organization/contract contexts в одной учётной записи.

### BR-IDN-008
Делегирование ограничено scope и сроком.

---

# 3. Sites

### BR-SIT-001
SiteType и SiteCriticality являются независимыми характеристиками.

### BR-SIT-002
Location принадлежит ровно одному Site.

### BR-SIT-003
Parent Location должен принадлежать тому же Site.

### BR-SIT-004
Location hierarchy не допускает циклов.

### BR-SIT-005
Timezone объекта является частью operational context.

### BR-SIT-006
Territorial Zone code is trimmed, invariant-uppercase, unique and immutable.

### BR-SIT-007
Territorial Zone name is trimmed, non-empty and mutable; lifecycle removal is deactivation, not hard delete.

### BR-SIT-008
Territorial Zone mutations require optimistic concurrency and preserve a durable Audit obligation in the same Sites transaction.

### BR-SIT-009
Region belongs to exactly one Territorial Zone. A Region can be created only under an ACTIVE parent; parent reassignment and hard delete are forbidden.

### BR-SIT-010
Region code is trimmed, invariant-uppercase, immutable, matches `^[A-Z0-9][A-Z0-9_-]{0,49}$`, and is unique within its parent Territorial Zone. Region name is trimmed, non-empty, maximum 200 and mutable.

### BR-SIT-011
Region stores a canonical IANA timezone identifier string, validated by a deterministic approved local provider/list; UTC offsets are not authoritative.

### BR-SIT-012
Inactive Regions remain queryable and valid for existing references, but cannot be selected for creation of new child objects; reactivation restores eligibility.

### BR-SIT-013
Region mutations require optimistic concurrency and create one matching durable Audit obligation atomically in the Sites transaction.

### BR-SIT-014
SiteType is a Sites-owned configurable reference, separate from SiteCriticality.
Its initial seed is not an exhaustive enum. A SiteType starts ACTIVE; hard
delete is forbidden, and inactive types remain readable and valid for existing
historical references. `TASK-02.03.03` Phase A now requires an ACTIVE type
for a new or changed Site assignment; existing Sites may retain an INACTIVE
type.

### BR-SIT-015

SiteCriticalityClass is an extensible Sites reference independent of SiteType.
Higher persisted rank means higher criticality; rank is non-negative and
unique in the catalog. Code ordering and enum ordinals do not define
criticality. Inactive classes remain readable and valid for existing Sites;
future Site CRUD rejects them for new assignments. Hard delete is forbidden.

### BR-SIT-016
Site code is required, trimmed, invariant-uppercase, immutable, globally
unique and matches `^[A-Z0-9][A-Z0-9_-]{0,49}$`. Each Site has exactly one
immutable Region parent; reparenting and hard delete are outside the first
Site CRUD slice.

### BR-SIT-017
Site creation starts ACTIVE and requires an ACTIVE Region, SiteType and
SiteCriticalityClass. Existing Site references remain valid when parent or
reference rows later become INACTIVE. Site creation serializes against Region
deactivation by locking the parent Region row.

### BR-SIT-018
Site lifecycle is ACTIVE ↔ INACTIVE. All mutable Site commands require
expectedRowVersion. Ordinary update may change only name, SiteType,
address_text and explicit IANA timezone. Criticality changes through a
separate action with `sites.change_criticality` and an ACTIVE new class.

### BR-SIT-019
Site list and direct-ID operations require effective target-aware permission,
valid INTERNAL working context and scope covering the Site. Zone scope covers
descendant Sites, Region scope covers Sites in that Region, and Site scope
covers that exact Site. Creation uses coverage of the existing parent Region;
contractor grants remain closed. See ADR-014.

### BR-SIT-020
Each successful Site mutation commits exactly one Site audit obligation in
the same Sites transaction. SiteCreated, SiteUpdated, SiteActivated,
SiteDeactivated and SiteCriticalityChanged are the canonical Audit actions
for the first Site CRUD slice; domain/integration events remain separate.

---

# 3.1. Organization

### BR-ORG-001
Every OrganizationalUnit belongs to one Company. Roots use `parent_id = null`; multiple roots per Company are allowed, and parent/child must share Company.

### BR-ORG-002
Cross-company parenting/reparenting and Company transfer are forbidden. Reparenting within a Company preserves the unit ID and history.

### BR-ORG-003
Reparenting requires an ACTIVE source and an ACTIVE parent; self-parent and descendant-as-parent are forbidden. Moving to root is allowed.

### BR-ORG-004
OrganizationalUnit lifecycle is `ACTIVE`/`INACTIVE`; creation starts ACTIVE, hard delete and descendant cascade are forbidden, and inactive units remain queryable but cannot receive new children or become new parents.

### BR-ORG-005
OrganizationalUnit code is trimmed, invariant-uppercase, immutable, matches `^[A-Z0-9][A-Z0-9_-]{0,49}$`, max 50 and unique within Company. Name is trimmed, non-empty, max 200 and mutable.

### BR-ORG-006
OrganizationalUnitType is Organization-owned configurable reference data with UUIDv7 ID, immutable canonical code, mutable name, `ACTIVE`/`INACTIVE` lifecycle, no hard delete, and inactive values forbidden for new units.

### BR-ORG-007
Structural mutations include create-with-parent, reparent/root move and OrganizationalUnit deactivation. They use the per-Company transaction-scoped advisory lock and recursive CTE validation from ADR-012; ordinary name/type update and activation do not require that lock.

### BR-ORG-008
Every OrganizationalUnit master-data mutation creates exactly one Organization-owned durable Audit obligation atomically with the business mutation. Audit materialization is at-least-once and idempotent by stable EventId.

### BR-ORG-009
OrganizationalUnit business history is append-only, survives reparent/lifecycle changes and is separate from technical Audit under ADR-008.

---

# 4. Assets

### BR-AST-001
Asset принадлежит одному Site.

### BR-AST-002
Location Asset должна принадлежать тому же Site.

### BR-AST-003
AssetModel должен соответствовать AssetType.

### BR-AST-004
Значимый обслуживаемый компонент имеет самостоятельный lifecycle.

### BR-AST-005
Parent/child asset graph не допускает циклов.

### BR-AST-006
У Asset может быть несколько параллельных responsibility roles.

### BR-AST-007
Вывод Asset из эксплуатации не удаляет его историю.

### BR-AST-008
Replacement сохраняет старый и новый Asset и явную связь между ними.

### BR-AST-009
Like-for-like replacement может использовать упрощённый процесс, если функция/архитектура сохраняются.

### BR-AST-010
Whole-system equivalent replacement не обязательно является полной configuration change, если функция и архитектура сохраняются.

### BR-AST-011
QR identity не должна зависеть от mutable location.

### BR-AST-012
Business timeline и technical Audit являются разными механизмами.

---

# 5. Documents

### BR-DOC-001
Binary files хранятся в S3-compatible object storage, metadata — в PostgreSQL.

### BR-DOC-002
Approved/current document version не перезаписывается молча.

### BR-DOC-003
Model document и Asset-specific document имеют разные scopes.

### BR-DOC-004
Скачивание restricted document требует backend authorization.

### BR-DOC-005
User filename не является physical storage key.

### BR-DOC-006
Upload проходит size/MIME/extension/hash validation.

---

# 6. Maintenance

### BR-MNT-001
Maintenance frequency зависит минимум от Asset/AssetType, MaintenanceLevel и SiteCriticality.

### BR-MNT-002
Approved MaintenanceTemplateVersion immutable.

### BR-MNT-003
Изменение утверждённого регламента создаёт новую version.

### BR-MNT-004
WorkOrder получает snapshot регламента; последующее изменение Template не меняет существующий WorkOrder.

### BR-MNT-005
Higher maintenance level может включать lower level через явные inclusion links.

### BR-MNT-006
Inclusion graph не допускает циклов.

### BR-MNT-007
Higher maintenance закрывает lower cycle только при выполнении полного обязательного scope.

### BR-MNT-008
Внеплановая работа сбрасывает planned cycle только при подтверждении полного обязательного scope.

### BR-MNT-009
Partial unplanned work не сбрасывает maintenance cycle.

### BR-MNT-010
Изменение due date сохраняется с old/new values и reason.

### BR-MNT-011
Scheduler должен быть idempotent и не создавать duplicate WorkOrders.

### BR-MNT-012
Состав регламента может зависеть от фактической конфигурации составного Asset/System.

### BR-MNT-013
Operation имеет requirement type: REQUIRED/CONDITIONAL/RECOMMENDED/CONTROL.

### BR-MNT-014
Operation имеет criticality: MINOR/IMPORTANT/CRITICAL.

---

# 7. WorkOrders

### BR-WO-001
WorkOrder является исторически фиксированным экземпляром работы.

### BR-WO-002
Lifecycle transition выполняется use case, а не прямым PATCH status.

### BR-WO-003
CRITICAL required step не может молча считаться выполненным.

### BR-WO-004
Operation result должен соответствовать operation type.

### BR-WO-005
Executor предлагает final technical condition, customer reviewer подтверждает/корректирует при соответствующей policy.

### BR-WO-006
Work status и Asset technical condition независимы.

### BR-WO-007
Contractor не подтверждает собственную работу вместо customer reviewer, если customer verification требуется.

### BR-WO-008
Contractor labor требует customer verification при соответствующем процессе.

### BR-WO-009
Material usage является фактом расхода, а не складским остатком.

### BR-WO-010
`used_at` обязателен для material usage.

### BR-WO-011
Completion/Acceptance должны быть idempotent при retry.

### BR-WO-012
Критичные конкурентные изменения защищаются optimistic concurrency.

### BR-WO-013
Before/After Asset state snapshots сохраняются отдельно.

---

# 8. Measurements

### BR-MEA-001
Measurement является отдельным историческим фактом.

### BR-MEA-002
Важное измерение не хранится только внутри JSON WorkOrder.

### BR-MEA-003
Raw measured value сохраняется независимо от evaluation.

### BR-MEA-004
Normative range должен быть исторически воспроизводим; WorkOrder сохраняет snapshot норм.

### BR-MEA-005
Out-of-range measurement не обязан автоматически создавать Defect без rule.

### BR-MEA-006
High-frequency telemetry является отдельным будущим контуром.

---

# 9. Defects

### BR-DEF-001
Повторное обнаружение того же открытого defect создаёт Observation, а не новый Defect.

### BR-DEF-002
Одинаковый symptom на разных components может означать разные Defects.

### BR-DEF-003
Закрытый Defect при повторном проявлении не reopen автоматически.

### BR-DEF-004
Повтор после CLOSED создаёт новый Defect + recurrence link.

### BR-DEF-005
Recurrence/systemic evaluation выполняет ответственный инженер.

### BR-DEF-006
Defect, сохраняющийся более одного maintenance cycle, должен поддерживать escalation и reason.

### BR-DEF-007
Closing Defect не удаляет observations/history.

---

# 10. Inventory

### BR-INV-001
Inventory Session фиксирует immutable expected snapshot.

### BR-INV-002
Несколько участников могут параллельно выполнять одну Inventory Session.

### BR-INV-003
Scan operation должна быть idempotent.

### BR-INV-004
Unknown asset создаётся как DraftAsset, а не сразу как официальный Asset.

### BR-INV-005
DraftAsset становится официальным Asset только после инженерной проверки.

### BR-INV-006
Missing Asset не получает LOST/DECOMMISSIONED автоматически.

### BR-INV-007
Missing создаёт discrepancy/процесс расследования.

### BR-INV-008
Если Missing найден позже, resolution сохраняет доказательство и историю.

### BR-INV-009
Inventory verification является историческим фактом.

### BR-INV-010
Approved Inventory Report immutable/versioned.

---

# 11. Contractors

### BR-CON-001
Membership в contractor organization не даёт operational access без contract assignment.

### BR-CON-002
Contract должен быть active и valid.

### BR-CON-003
UserContractAssignment должен быть active и valid.

### BR-CON-004
ContractScope ограничивает region/site/direction/asset type/action.

### BR-CON-005
Customer side верифицирует contractor user перед operational activation.

### BR-CON-006
Один user может иметь несколько contractor memberships/contract contexts.

### BR-CON-007
Cross-contract data leakage недопустима.

### BR-CON-008
Expired contract блокирует access даже если scheduler ещё не отработал.

---

# 12. Incident — устойчивые правила, lifecycle provisional

### BR-INC-001
Incident является отдельной сущностью от Defect.

### BR-INC-002
Severity levels: P1/P2/P3/P4.

### BR-INC-003
Actual start, detection, service restoration, technical resolution и closure — разные timestamps.

### BR-INC-004
P1/P2 требуют post-incident review перед final close.

### BR-INC-005
Service restoration не означает устранение root cause.

---

# 13. Change — устойчивые правила, lifecycle provisional

### BR-CHG-001
Один parent Change может включать departmental tasks.

### BR-CHG-002
У Change один coordinator от initiating direction.

### BR-CHG-003
Affected directions оценивают risk независимо.

### BR-CHG-004
Automatic risk и expert risk хранятся отдельно.

### BR-CHG-005
Coordinator может снизить final risk только с обязательным reason + audit.

### BR-CHG-006
Residual risk acceptance хранится отдельно.

### BR-CHG-007
Rollback plan обязателен по risk/policy, а не для любой работы.

### BR-CHG-008
Material change после approval может требовать reapproval.

---

# 14. Правила ведения registry

- ID не переиспользовать.
- Изменение смысла существующего правила — review.
- Удалённое правило помечать `DEPRECATED`, а не перенумеровывать остальные.
- Tests могут ссылаться на Rule ID в display name/comment, если это улучшает трассируемость.
