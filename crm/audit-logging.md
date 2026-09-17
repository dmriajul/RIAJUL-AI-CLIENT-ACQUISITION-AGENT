# CRM Audit Logging — Immutable Change Trail

> Phase 6A — Persistent CRM Implementation
> Every CRM mutation is logged for debugging and accountability

---

## Purpose

The Audit Log provides a complete, immutable trail of every change made to the CRM. This enables:

1. **Debugging** — Trace exactly what happened and when
2. **Accountability** — Know who changed what and why
3. **Compliance** — Prove DO_NOT_CONTACT was respected
4. **Recovery** — Reconstruct previous states if needed
5. **Reporting** — Track activity patterns and system usage

---

## Audit Log Entry Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Log ID | string | ✅ | Unique ID (LOG-{NNN}) |
| Timestamp | datetime | ✅ | ISO 8601 (YYYY-MM-DDTHH:MM:SS) |
| Actor | string | ✅ | Who made the change (Agent/Riajul/System) |
| Action | string | ✅ | What was done |
| Entity Type | string | ✅ | Which entity was changed |
| Entity ID | string | ✅ | ID of changed record |
| Field | string | ❌ | Which field changed |
| Previous Value | string | ❌ | Value before change |
| New Value | string | ❌ | Value after change |
| Reason | string | ❌ | Why change was made |
| Context | string | ❌ | Additional context (JSON) |

---

## Valid Actions

| Action | When Used |
|--------|-----------|
| CREATE | New record created |
| READ | Record read (optional — may skip for performance) |
| UPDATE | Existing record updated |
| ARCHIVE | Record archived (status change) |
| MERGE | Record merged into another |
| STAGE_CHANGE | Pipeline stage changed |
| STATUS_CHANGE | Record status changed (e.g. DO_NOT_CONTACT) |
| BLOCK | Operation blocked (e.g. DO_NOT_CONTACT violation) |
| UNBLOCK | Block removed |
| APPROVE | Human approved an action |
| REJECT | Human rejected an action |
| SEND | Outbound message sent |
| RECEIVE | Inbound message received |
| SCHEDULE | Follow-up/meeting scheduled |
| COMPLETE | Task completed |
| SKIP | Task skipped |
| CANCEL | Task/meeting cancelled |

---

## Valid Entity Types

```
Company, Contact, Prospect, Conversation,
ReplyAnalysis, Followup, Meeting, Proposal
```

---

## When to Log

### Every CREATE Operation
```
Action: CREATE
Entity Type: [entity]
Entity ID: [new ID]
New Value: [key identifying info]
Reason: [why created]
```

### Every UPDATE Operation (per field)
```
Action: UPDATE
Entity Type: [entity]
Entity ID: [record ID]
Field: [field name]
Previous Value: [old value]
New Value: [new value]
Reason: [why changed]
```

### Every STAGE_CHANGE
```
Action: STAGE_CHANGE
Entity Type: Prospect
Entity ID: [prospect ID]
Field: Pipeline Stage
Previous Value: [old stage]
New Value: [new stage]
Reason: [why moved]
```

### Every STATUS_CHANGE
```
Action: STATUS_CHANGE
Entity Type: [entity]
Entity ID: [record ID]
Field: Status
Previous Value: [old status]
New Value: [new status]
Reason: [why changed]
```

### Every BLOCK (compliance)
```
Action: BLOCK
Entity Type: [entity]
Entity ID: [record ID or null]
Reason: [why blocked — e.g. "DO_NOT_CONTACT"]
Context: { attempted_operation: "...", details: "..." }
```

### Every SEND
```
Action: SEND
Entity Type: Conversation
Entity ID: [conversation ID]
New Value: "Outbound via [channel] to [prospect]"
Reason: [type of outreach]
```

### Every MERGE
```
Action: MERGE
Entity Type: [entity]
Entity ID: [primary ID]
Reason: "Merged from [duplicate ID]"
```
```
Action: ARCHIVE
Entity Type: [entity]
Entity ID: [duplicate ID]
Reason: "Merged into [primary ID]"
```

---

## Audit Log Examples

### Example 1: New Company Created
```
Log ID:      LOG-001
Timestamp:   2026-09-17T10:30:00
Actor:       Agent
Action:      CREATE
Entity Type: Company
Entity ID:   COMP-001
Field:       (all)
New Value:   Aesthetica Cosmetic Clinic
Reason:      New prospect identified during research
```

### Example 2: Pipeline Stage Changed
```
Log ID:      LOG-005
Timestamp:   2026-09-17T14:15:00
Actor:       Agent
Action:      STAGE_CHANGE
Entity Type: Prospect
Entity ID:   PRO-001
Field:       Pipeline Stage
Previous:    QUALIFIED
New Value:   OUTREACH_READY
Reason:      Outreach drafted and ready for approval
```

### Example 3: DO_NOT_CONTACT Set
```
Log ID:      LOG-012
Timestamp:   2026-09-18T09:00:00
Actor:       Riajul
Action:      STATUS_CHANGE
Entity Type: Contact
Entity ID:   CONT-003
Field:       Status
Previous:    Active
New Value:   DO_NOT_CONTACT
Reason:      Prospect explicitly requested no further contact
```

### Example 4: Outreach Blocked (DO_NOT_CONTACT)
```
Log ID:      LOG-013
Timestamp:   2026-09-18T11:30:00
Actor:       System
Action:      BLOCK
Entity Type: Followup
Entity ID:   FU-005
Field:       Status
Previous:    Scheduled
New Value:   Blocked
Reason:      DO_NOT_CONTACT — follow-up blocked
Context:     {"prospect_id": "PRO-003", "contact_id": "CONT-003"}
```

### Example 5: Duplicate Company Detected
```
Log ID:      LOG-020
Timestamp:   2026-09-19T08:45:00
Actor:       Agent
Action:      BLOCK
Entity Type: Company
Entity ID:   (none — operation blocked)
Reason:      Duplicate company detected: "Aesthetica Cosmetic Clinic" already exists as COMP-001
Context:     {"attempted_name": "aesthetica cosmetic clinic", "existing_id": "COMP-001"}
```

### Example 6: Record Merged
```
Log ID:      LOG-025
Timestamp:   2026-09-20T16:00:00
Actor:       Agent
Action:      MERGE
Entity Type: Company
Entity ID:   COMP-001
Reason:      Merged duplicate COMP-015 into COMP-001
Context:     {"duplicate_id": "COMP-015", "fields_updated": 3}

Log ID:      LOG-026
Timestamp:   2026-09-20T16:00:00
Actor:       Agent
Action:      ARCHIVE
Entity Type: Company
Entity ID:   COMP-015
Reason:      Merged into COMP-001
```

---

## Audit Log Rules

### Immutable
- ✅ APPEND only — never modify existing entries
- ❌ Cannot UPDATE audit entries
- ❌ Cannot DELETE audit entries
- ❌ Cannot reorder entries

### Required for Every Mutation
- ✅ Every CREATE generates at least 1 audit entry
- ✅ Every UPDATE generates 1 audit entry per field changed
- ✅ Every STAGE_CHANGE generates 1 audit entry
- ✅ Every STATUS_CHANGE generates 1 audit entry
- ✅ Every BLOCK generates 1 audit entry
- ✅ Every MERGE generates 2 audit entries (primary + duplicate)

### READ Operations
- Optional — may skip for performance
- Enable for compliance-critical records (DO_NOT_CONTACT)
- Configurable per entity type

### Retention
- Audit log is NEVER deleted
- Retain for lifetime of CRM
- Archive old entries to separate sheet if performance degrades

---

## Audit Query Patterns

### Get All Changes for a Prospect
```
Filter: Entity ID = [prospect ID] OR Context contains [prospect ID]
Sort: Timestamp DESC
```

### Get All DO_NOT_CONTACT Events
```
Filter: Action = STATUS_CHANGE AND New Value = DO_NOT_CONTACT
Sort: Timestamp DESC
```

### Get All Blocked Operations
```
Filter: Action = BLOCK
Sort: Timestamp DESC
```

### Get All Changes by Actor
```
Filter: Actor = [Agent/Riajul/System]
Sort: Timestamp DESC
```

### Get Changes in Date Range
```
Filter: Timestamp BETWEEN [start] AND [end]
Sort: Timestamp ASC
```

### Get Stage Transition History
```
Filter: Action = STAGE_CHANGE AND Entity ID = [prospect ID]
Sort: Timestamp ASC
```

---

## Daily Audit Summary (Automatic)

At end of each day, generate summary:
```
AUDIT SUMMARY — [Date]
━━━━━━━━━━━━━━━━━━━━━━
Total Changes: [N]
  Creates: [N]
  Updates: [N]
  Stage Changes: [N]
  Status Changes: [N]
  Blocks: [N]
  Sends: [N]
  Merges: [N]

By Actor:
  Agent: [N]
  Riajul: [N]
  System: [N]

Compliance:
  DO_NOT_CONTACT blocks: [N]
  Touchpoint limit blocks: [N]
  Duplicate blocks: [N]

Anomalies:
  Failed validations: [N]
  Unusual patterns: [N]
━━━━━━━━━━━━━━━━━━━━━━
```
