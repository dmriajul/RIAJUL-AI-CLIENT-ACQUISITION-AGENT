# CRM Stage Transitions — Deterministic Pipeline Rules

> Phase 6A — Persistent CRM Implementation
> Defines exactly which stage transitions are valid

---

## Pipeline Stages

```
NEW → RESEARCHED → QUALIFIED → OUTREACH_READY → CONTACTED →
FOLLOW-UP 1 → FOLLOW-UP 2 → REPLIED → CONVERSATION →
MEETING → PROPOSAL → NEGOTIATION → WON

Alternative exits:
  Any stage → DISQUALIFIED (removed from pipeline)
  CONTACTED+ → NURTURE (paused, not dead)
  REPLIED+ → LOST (actively declined)
  LOST → NURTURE (re-engage later)
  NURTURE → RESEARCHED/QUALIFIED/OUTREACH_READY (re-engage)
```

---

## Stage Transition Map

| From Stage | Valid Next Stages | Trigger |
|-----------|-------------------|---------|
| **NEW** | RESEARCHED, DISQUALIFIED | Research complete or disqualify |
| **RESEARCHED** | QUALIFIED, DISQUALIFIED | Priority assigned or disqualify |
| **QUALIFIED** | OUTREACH_READY, DISQUALIFIED | Outreach drafted or disqualify |
| **OUTREACH_READY** | CONTACTED, DISQUALIFIED | Message sent or disqualify |
| **CONTACTED** | FOLLOW-UP 1, REPLIED, NURTURE, DISQUALIFIED | Follow-up due, reply received, or pause |
| **FOLLOW-UP 1** | FOLLOW-UP 2, REPLIED, NURTURE, DISQUALIFIED | 2nd follow-up, reply, or pause |
| **FOLLOW-UP 2** | REPLIED, NURTURE, DISQUALIFIED | Reply received or move to nurture |
| **REPLIED** | CONVERSATION, QUALIFIED, NURTURE, LOST, DISQUALIFIED | Ongoing conversation or decline |
| **CONVERSATION** | MEETING, PROPOSAL, NURTURE, LOST | Meeting scheduled, proposal sent, or decline |
| **MEETING** | PROPOSAL, NURTURE, LOST | Proposal after meeting or decline |
| **PROPOSAL** | NEGOTIATION, WON, LOST, NURTURE | Negotiation, accepted, or declined |
| **NEGOTIATION** | WON, LOST, NURTURE | Deal closed or declined |
| **WON** | _(terminal)_ | Deal closed — no further transitions |
| **LOST** | NURTURE | Re-engage later |
| **NURTURE** | RESEARCHED, QUALIFIED, OUTREACH_READY, LOST | Re-engage or give up |
| **DISQUALIFIED** | _(terminal)_ | Removed permanently — no further transitions |

---

## Transition Rules

### Rule 1: No Skipping
Cannot skip stages. Must go through each stage in order.
```
✅ NEW → RESEARCHED → QUALIFIED
❌ NEW → QUALIFIED (skipped RESEARCHED)
```

**Exception:** When re-engaging from NURTURE, can jump to RESEARCHED, QUALIFIED, or OUTREACH_READY based on context.

### Rule 2: Terminal Stages
WON and DISQUALIFIED are terminal — no further transitions allowed.
```
✅ PROPOSAL → WON
❌ WON → MEETING (cannot go back from WON)
❌ DISQUALIFIED → QUALIFIED (cannot re-qualify)
```

### Rule 3: No Backward Movement (except specific cases)
Generally cannot go backward in pipeline.
```
✅ REPLIED → CONVERSATION (forward)
❌ CONVERSATION → CONTACTED (backward)
```

**Exceptions:**
- LOST → NURTURE (allowed — re-engage path)
- NURTURE → RESEARCHED/QUALIFIED/OUTREACH_READY (allowed — re-engagement)

### Rule 4: DO_NOT_CONTACT Blocks Outbound Stages
When Contact Status = DO_NOT_CONTACT:
```
❌ Cannot move to: OUTREACH_READY, CONTACTED, FOLLOW-UP 1, FOLLOW-UP 2
✅ Can move to: NURTURE, LOST, DISQUALIFIED (internal stages)
```

### Rule 5: Touchpoint Limits Affect Follow-up Stages
```
If Email Touchpoints >= 4: Cannot move to FOLLOW-UP 1/2
If LinkedIn Touchpoints >= 3: Cannot move to FOLLOW-UP 1/2
If Total Touchpoints >= 7: Cannot move to any follow-up stage
```

### Rule 6: Stage Change Requires Reason
Every stage transition must include a reason:
```
✅ MOVE PRO-001 FROM QUALIFIED TO OUTREACH_READY
   Reason: "Outreach drafted and approved by Riajul"

❌ MOVE PRO-001 FROM QUALIFIED TO OUTREACH_READY
   (no reason — BLOCKED)
```

---

## Stage Modifiers

Modifiers are additional flags that don't change the pipeline stage but add context.

### DO_NOT_CONTACT
```
When: Prospect explicitly requests no contact
Effect: Blocks all outbound communication
Persistence: Permanent until Riajul explicitly removes
Display: [STAGE] + DO_NOT_CONTACT
```

### REFERRED
```
When: Prospect referred another person
Effect: Creates new prospect record for referral
Persistence: Permanent flag on source prospect
Display: [STAGE] + REFERRED
```

### MULTI_CONTACT
```
When: Multiple contacts at same company are engaged
Effect: Links multiple prospect records
Persistence: Active while multiple contacts engaged
Display: [STAGE] + MULTI_CONTACT
```

### RE_ENGAGING
```
When: Returning to NURTURE prospect
Effect: Resets follow-up counters, starts fresh sequence
Persistence: Temporary — removed after first new outreach
Display: [STAGE] + RE_ENGAGING
```

### AT_RISK
```
When: Conversation stalled after interest shown
Effect: Triggers re-engagement campaign
Persistence: Active until re-engaged or moved to NURTURE/LOST
Display: [STAGE] + AT_RISK
```

---

## Stage Transition Examples

### Example 1: Happy Path
```
NEW → RESEARCHED (research complete, all fields populated)
RESEARCHED → QUALIFIED (priority assigned: A)
QUALIFIED → OUTREACH_READY (outreach drafted)
OUTREACH_READY → CONTACTED (message sent after approval)
CONTACTED → REPLIED (prospect replied positively)
REPLIED → CONVERSATION (ongoing dialogue)
CONVERSATION → MEETING (discovery call scheduled)
MEETING → PROPOSAL (proposal sent after call)
PROPOSAL → WON (deal closed)
```

### Example 2: No Response
```
NEW → RESEARCHED → QUALIFIED → OUTREACH_READY → CONTACTED
CONTACTED → FOLLOW-UP 1 (5 days, no reply)
FOLLOW-UP 1 → FOLLOW-UP 2 (5 days, no reply)
FOLLOW-UP 2 → NURTURE (final follow-up sent, no reply — move to nurture)
```

### Example 3: Not Interested
```
NEW → RESEARCHED → QUALIFIED → OUTREACH_READY → CONTACTED
CONTACTED → REPLIED (prospect replied: "not interested")
REPLIED → LOST (clear decline — move to lost)
LOST → NURTURE (re-engage in 90 days)
```

### Example 4: DO_NOT_CONTACT
```
NEW → RESEARCHED → QUALIFIED → OUTREACH_READY → CONTACTED
CONTACTED → REPLIED (prospect: "stop contacting me")
REPLIED → LOST (move to lost)
+ DO_NOT_CONTACT modifier set on Contact
+ All future outreach blocked permanently
```

### Example 5: Disqualified During Research
```
NEW → DISQUALIFIED (research shows already has provider, no opportunity)
Reason: "Already has proven agency (Inflow) — no gap identified"
```

### Example 6: Re-engagement from NURTURE
```
NURTURE → RE_ENGAGING (modifier set)
RE_ENGAGING → OUTREACH_READY (new outreach drafted with fresh angle)
OUTREACH_READY → CONTACTED (new message sent)
+ RE_ENGAGING modifier removed after first outreach
```

---

## Stage History Format

Every prospect maintains a Stage History field:
```json
[
  {"stage": "NEW", "date": "2026-09-17", "reason": "Prospect created"},
  {"stage": "RESEARCHED", "date": "2026-09-17", "reason": "Research complete"},
  {"stage": "QUALIFIED", "date": "2026-09-17", "reason": "Priority A: evidence-based opportunity identified"},
  {"stage": "OUTREACH_READY", "date": "2026-09-18", "reason": "Outreach drafted"},
  {"stage": "CONTACTED", "date": "2026-09-19", "reason": "Initial outreach sent after approval"}
]
```

This provides complete audit trail of pipeline progression.

---

## Validation

### Invalid Transition Error Response
```json
{
  "success": false,
  "blocked": true,
  "operation": "MOVE_STAGE",
  "prospect_id": "PRO-001",
  "current_stage": "CONTACTED",
  "requested_stage": "WON",
  "valid_transitions": ["FOLLOW-UP 1", "REPLIED", "NURTURE", "DISQUALIFIED"],
  "reason": "Cannot move from CONTACTED to WON. Valid next stages: FOLLOW-UP 1, REPLIED, NURTURE, DISQUALIFIED"
}
```
