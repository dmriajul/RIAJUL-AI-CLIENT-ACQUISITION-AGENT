# CRM Implementation Guide — Agent Usage

> Phase 6A — Persistent CRM Implementation
> How the Agent will use the persistent CRM in practice

---

## Purpose

This guide explains how the Agent will interact with the persistent CRM once Google Sheets is connected. It covers daily workflows, command usage, and data management.

---

## Overview

The persistent CRM replaces file-based prospect tracking with a structured database (Google Sheets) that:
- Persists data across sessions
- Enforces data integrity rules
- Maintains complete audit trail
- Prevents duplicates and compliance violations
- Supports multiple contacts per company
- Tracks full conversation history

---

## Daily Workflow with CRM

### Morning Routine

```
1. "Check today's follow-ups"
   → Agent reads Follow-ups sheet
   → Filters by Scheduled Date = today
   → Returns list of due follow-ups

2. "Process new replies"
   → Agent checks Conversations sheet for new Inbound messages
   → For each: creates Reply Analysis, updates Prospect stage
   → Recommends next actions

3. "Pipeline report"
   → Agent reads Prospects sheet
   → Groups by Pipeline Stage
   → Shows counts and key metrics
```

### Midday Routine

```
1. "Find clients" or "Research [company]"
   → Agent researches prospect
   → Creates Company, Contact, Prospect records
   → Logs audit events
   → Returns research summary

2. "Create outreach for [prospect]"
   → Agent drafts personalized message
   → Creates Conversation record (Draft status)
   → Submits for Riajul's approval
   → On approval: updates to Sent, logs to Conversations

3. "Update CRM for [prospect]"
   → Agent updates prospect record
   → Logs all changes to audit trail
```

### Evening Routine

```
1. "Daily report"
   → Agent reads Metrics sheet
   → Calculates daily totals
   → Creates/updates today's Metrics row
   → Generates summary report

2. "Plan tomorrow"
   → Agent checks follow-ups due tomorrow
   → Reviews pipeline status
   → Recommends priorities
```

---

## Command Reference

### CRM Initialization Commands

| Command | Action |
|---------|--------|
| `Initialize CRM` | Create sheet structure with headers and validation |
| `Migrate test data` | Load verified prospects from audits/ |
| `Run CRM validation tests` | Execute 12-test validation suite |
| `Test CRM connection` | Verify Google Sheets API access |

### CRM Query Commands

| Command | Action |
|---------|--------|
| `Pipeline report` | Show all prospects grouped by stage |
| `Show [prospect] history` | Complete history for one prospect |
| `Today's follow-ups` | List follow-ups due today |
| `Overdue follow-ups` | List follow-ups past due date |
| `A-priority prospects` | List all A-priority prospects |
| `Active pipeline` | Count prospects in active stages |
| `Stale prospects` | List prospects with no activity >30 days |

### CRM Create Commands

| Command | Action |
|---------|--------|
| `Create company [name]` | Add new company to CRM |
| `Create contact [name] for [company]` | Add contact to existing company |
| `Create prospect for [contact]` | Create prospect with research data |
| `Log outreach to [prospect]` | Record sent message |
| `Log reply from [prospect]` | Record received reply + analysis |
| `Schedule follow-up for [prospect]` | Create follow-up task |
| `Schedule meeting with [prospect]` | Create meeting record |
| `Create proposal for [prospect]` | Create proposal record |

### CRM Update Commands

| Command | Action |
|---------|--------|
| `Move [prospect] to [stage]` | Change pipeline stage |
| `Update [prospect] priority to [A/B/C]` | Change priority |
| `Mark [prospect] as DO_NOT_CONTACT` | Block all future outreach |
| `Mark [contact] as DO_NOT_CONTACT` | Block contact permanently |
| `Add referral from [prospect]` | Process referral, create new records |
| `Add contact to [company]` | Add second contact to existing company |
| `Merge duplicates for [company]` | Merge duplicate company records |

### CRM Maintenance Commands

| Command | Action |
|---------|--------|
| `Check duplicates for [company]` | Detect duplicate companies |
| `Validate CRM data` | Check for integrity issues |
| `Backup CRM` | Export CRM data to backup |
| `Audit log report` | Show recent audit entries |
| `Metrics report` | Show operational metrics |

---

## Data Operations

### CREATE Operations

**When Agent creates a record:**
1. Validates all required fields
2. Checks for duplicates
3. Generates unique ID
4. Creates record in appropriate sheet
5. Logs audit event
6. Returns success confirmation

**Example:**
```
Command: Create company "Acme Corp"
Agent Actions:
  1. Check for duplicate "Acme Corp" → None found
  2. Generate ID: COMP-010
  3. Insert row into Companies sheet
  4. Log audit event: CREATE Company COMP-010
  5. Return: "Company created: COMP-010 (Acme Corp)"
```

### UPDATE Operations

**When Agent updates a record:**
1. Validates new values
2. Reads current record
3. Updates fields
4. Logs audit event (per field changed)
5. Returns confirmation

**Example:**
```
Command: Move PRO-005 to MEETING
Agent Actions:
  1. Validate transition: CONVERSATION → MEETING (valid)
  2. Read PRO-005: Current stage = CONVERSATION
  3. Update: Pipeline Stage = MEETING
  4. Update: Stage History += {stage: MEETING, date: today}
  5. Log audit: STAGE_CHANGE from CONVERSATION to MEETING
  6. Return: "Moved PRO-005 to MEETING"
```

### READ Operations

**When Agent reads data:**
1. Queries appropriate sheet(s)
2. Filters/sorts as needed
3. Returns formatted results
4. (Optional) Logs READ event

**Example:**
```
Command: Pipeline report
Agent Actions:
  1. Read all rows from Prospects sheet
  2. Group by Pipeline Stage
  3. Count prospects per stage
  4. Format report
  5. Return formatted pipeline report
```

---

## Compliance Enforcement

### DO_NOT_CONTACT

**When Agent attempts outbound action:**
1. Read Contact record
2. Check Status field
3. If Status = DO_NOT_CONTACT:
   - BLOCK operation immediately
   - Log BLOCK audit event
   - Return error: "Contact is DO_NOT_CONTACT — outreach blocked"

**This is absolute — no exceptions.**

### Touchpoint Limits

**When Agent sends outreach:**
1. Read Prospect record
2. Check touchpoint counts:
   - Email Touchpoints
   - LinkedIn Touchpoints
   - Total Touchpoints
3. If limit reached:
   - BLOCK operation
   - Return error with limit details
   - Suggest: "Move to NURTURE or switch channel"

### Duplicate Prevention

**When Agent creates company/contact:**
1. Check for existing record with same name/email
2. If duplicate found:
   - BLOCK operation
   - Return existing record ID
   - Suggest: "Use existing record instead"

---

## Audit Trail

**Every mutation generates audit log entry:**
- Timestamp (automatic)
- Actor (Agent/Riajul/System)
- Action (CREATE/UPDATE/STAGE_CHANGE/etc.)
- Entity Type (Company/Contact/Prospect/etc.)
- Entity ID (record ID)
- Field (if UPDATE)
- Previous Value (if UPDATE)
- New Value
- Reason

**Audit log is immutable:**
- Append-only (never modify or delete)
- Complete history of all changes
- Enables debugging and compliance verification

---

## Error Handling

### Validation Errors

**When validation fails:**
```
{
  "success": false,
  "blocked": true,
  "operation": "CREATE_PROSPECT",
  "validation_failed": "REQUIRED_FIELD",
  "reason": "Opportunity is required (evidence-based)",
  "suggestion": "Add evidence-based opportunity before creating prospect"
}
```

### Duplicate Errors

**When duplicate detected:**
```
{
  "success": false,
  "blocked": true,
  "operation": "CREATE_COMPANY",
  "validation_failed": "DUPLICATE_DETECTION",
  "reason": "Company 'Acme Corp' already exists",
  "existing_id": "COMP-005",
  "suggestion": "Use existing company COMP-005 instead"
}
```

### Compliance Errors

**When DO_NOT_CONTACT violated:**
```
{
  "success": false,
  "blocked": true,
  "operation": "LOG_OUTREACH",
  "validation_failed": "DO_NOT_CONTACT",
  "reason": "Contact CONT-003 is DO_NOT_CONTACT — all outreach blocked",
  "compliance_violation": true
}
```

---

## Data Integrity

### Relationship Integrity

**All relationships validated:**
- Contact must belong to existing Company
- Prospect must belong to existing Contact and Company
- Conversation must belong to existing Prospect
- Follow-up must belong to existing Prospect

**Orphan prevention:**
- Cannot delete Company if it has Contacts
- Cannot delete Contact if it has Prospects
- Use ARCHIVE instead of DELETE

### Stage History

**Every prospect maintains Stage History:**
```json
[
  {"stage": "NEW", "date": "2026-09-17", "reason": "Prospect created"},
  {"stage": "RESEARCHED", "date": "2026-09-17", "reason": "Research complete"},
  {"stage": "QUALIFIED", "date": "2026-09-18", "reason": "Priority A assigned"}
]
```

This provides complete audit trail of pipeline progression.

---

## Metrics Tracking

**Daily metrics automatically updated:**
- Prospects Researched
- Prospects Qualified
- Outreach Drafted/Sent
- Replies Received
- Meetings Scheduled
- Proposals Sent
- Won/Lost/Nurture counts
- Response rates
- Conversion rates

**Metrics stored in Metrics sheet:**
- One row per day
- Automatic calculation
- Historical tracking

---

## Backup and Recovery

### Daily Backup

**Agent creates daily backup:**
- Export all sheets to CSV
- Save to Google Drive backup folder
- Retain last 30 days of backups

### Recovery

**If data corruption detected:**
1. Identify corruption from audit log
2. Restore from backup
3. Verify data integrity
4. Resume operations

---

## Performance

### Expected Performance

**Google Sheets API limits:**
- 60 requests per minute
- Should handle 1000+ prospects easily
- Response time: 1-2 seconds per operation

**Optimization:**
- Batch read operations when possible
- Cache frequently accessed data
- Minimize unnecessary writes

---

## Migration Path

### Current State (File-Based)
- Prospects tracked in audit files
- No persistent storage
- Manual tracking
- Limited history

### Future State (CRM-Based)
- All data in Google Sheets
- Automatic persistence
- Full audit trail
- Complete history
- Metrics tracking

### Transition

1. **Initialize CRM** — Create sheet structure
2. **Migrate test data** — Load verified prospects
3. **Run validation tests** — Verify behavior
4. **Dual-track (optional)** — Use both systems briefly
5. **Switch to CRM** — Use CRM as primary system
6. **Archive old files** — Keep audit files for reference

---

## Best Practices

### For Riajul

1. **Review audit log weekly** — Catch any issues early
2. **Check pipeline daily** — Stay on top of follow-ups
3. **Approve outreach promptly** — Don't let drafts sit
4. **Update metrics daily** — Track performance
5. **Backup weekly** — Protect your data

### For Agent

1. **Always validate before creating** — Prevent duplicates
2. **Always log audit events** — Maintain trail
3. **Always check DO_NOT_CONTACT** — Compliance first
4. **Always check touchpoint limits** — Don't over-contact
5. **Always use verified data** — Never fabricate

---

## Troubleshooting

### CRM Not Responding

**Check:**
1. Google Sheets API enabled?
2. Service account has access?
3. Spreadsheet ID correct?
4. Credentials valid?

### Data Not Persisting

**Check:**
1. Write operations succeeding?
2. Audit log showing CREATE/UPDATE?
3. Sheet permissions correct?

### Duplicate Records

**Check:**
1. Validation rules enabled?
2. Duplicate detection working?
3. Unique constraints set?

---

## Support

For CRM issues:
1. Check `crm/test-suite.md` — Run validation tests
2. Check `crm/google-sheets-setup.md` — Verify setup
3. Check audit log — Trace what happened
4. Contact Arena.ai support — Agent-specific issues

---

**Next Action:** Once Google Sheets is connected, run `Initialize CRM` command.
