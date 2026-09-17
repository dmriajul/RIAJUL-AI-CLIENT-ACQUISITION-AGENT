# CRM Persistence Schema

> Phase 6 — Integration & Operational Architecture
> Date: 2026-09-17
> Purpose: Define canonical schema for persistent CRM storage

---

## Purpose

This document defines the canonical schema for storing prospect and conversation data in persistent storage (Google Sheets, Airtable, or database). This schema ensures data consistency across sessions and enables long-term pipeline tracking.

---

## Design Principles

1. **One source of truth** — Each field has one authoritative location
2. **Immutable history** — Never delete records, only update status
3. **Audit trail** — Track who changed what and when
4. **Relationship support** — Handle multiple contacts per company
5. **Compliance ready** — Support DO_NOT_CONTACT and data retention
6. **Scalable** — Support 1000+ prospects without performance issues

---

## Table Structure

### Recommended Backend: Google Sheets

**Why Google Sheets:**
- Familiar interface for Riajul
- Easy to export/backup
- Free (within limits)
- Good API support
- Can be shared for collaboration

**Alternative:** Airtable (if more advanced features needed)

---

## Sheet 1: Companies

**Purpose:** Store company-level information (one row per company)

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| Company ID | Text | ✅ | Unique identifier | COMP-001 |
| Company Name | Text | ✅ | Company/brand name | Aesthetica Cosmetic Clinic |
| Website | URL | ❌ | Company website | https://aestheticacosmetic.com.au |
| Industry | Text | ❌ | Business industry | Aesthetic / Cosmetic |
| Country | Text | ❌ | Business location | Australia |
| City | Text | ❌ | Business city | Melbourne |
| Company Size | Text | ❌ | Employee count range | 1-10 |
| LinkedIn Company | URL | ❌ | Company LinkedIn page | https://linkedin.com/company/... |
| Instagram | Text | ❌ | Company Instagram handle | @aestheticaclinic |
| Facebook | Text | ❌ | Company Facebook page | https://facebook.com/... |
| ICP Segment | Text | ❌ | Primary/Secondary/Tertiary | Primary |
| Notes | Long Text | ❌ | Company-level notes | Doctor-led clinic in South Yarra |
| Created Date | Date | ✅ | When company was added | 2026-09-17 |
| Updated Date | Date | ✅ | Last update | 2026-09-17 |
| Status | Text | ✅ | Active / Inactive / Duplicate | Active |

**Relationships:**
- One company can have multiple contacts (see Contacts sheet)
- Company ID is foreign key in Contacts sheet

---

## Sheet 2: Contacts

**Purpose:** Store contact-level information (one row per person)

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| Contact ID | Text | ✅ | Unique identifier | CONT-001 |
| Company ID | Text | ✅ | FK to Companies sheet | COMP-001 |
| Contact Name | Text | ❌ | Person's name | Dr. David Ong |
| Role | Text | ❌ | Job title | Medical Director |
| Email | Text | ❌ | Email address | david@aestheticacosmetic.com.au |
| Email Verified | Boolean | ❌ | Is email verified? | FALSE |
| Email Verified Date | Date | ❌ | When email was verified | NULL |
| LinkedIn | URL | ❌ | LinkedIn profile | https://linkedin.com/in/... |
| Decision Maker Status | Text | ❌ | Decision-maker / Influencer / Gatekeeper / Unknown | Decision-maker |
| Referred By | Text | ❌ | Who referred this contact | NULL |
| Notes | Long Text | ❌ | Contact-level notes | Owner and medical director |
| Created Date | Date | ✅ | When contact was added | 2026-09-17 |
| Updated Date | Date | ✅ | Last update | 2026-09-17 |
| Status | Text | ✅ | Active / Inactive / DO_NOT_CONTACT | Active |

**Relationships:**
- Many contacts belong to one company (Company ID)
- Contact ID is foreign key in Prospects sheet

---

## Sheet 3: Prospects

**Purpose:** Store prospect-level pipeline data (one row per contact+service combination)

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| Prospect ID | Text | ✅ | Unique identifier | PRO-001 |
| Contact ID | Text | ✅ | FK to Contacts sheet | CONT-001 |
| Company ID | Text | ✅ | FK to Companies sheet | COMP-001 |
| Priority | Text | ✅ | A / B / C | A |
| Priority Reason | Long Text | ✅ | Why this priority | 28 reviews, 4.9 rating, AU clinic |
| ICP Segment | Text | ✅ | Primary/Secondary/Tertiary | Tertiary |
| Service | Text | ✅ | Relevant service | Local SEO & ORM |
| Opportunity | Long Text | ✅ | Identified opportunity | Low review count despite high rating |
| Research Evidence | Long Text | ✅ | Verified observations | 28 reviews, 4.9 rating, South Yarra |
| Portfolio Proof | Long Text | ✅ | Relevant case studies | AU Medical Clinic case study |
| Outreach Channel | Text | ❌ | Email / LinkedIn / Both | Email |
| Outreach Angle | Long Text | ❌ | Personalization approach | Reference review count + rating |
| Pipeline Stage | Text | ✅ | Current stage | QUALIFIED |
| Stage Modifier | Text | ❌ | RE_ENGAGING / AT_RISK / etc. | NULL |
| Created Date | Date | ✅ | When prospect was added | 2026-09-17 |
| Updated Date | Date | ✅ | Last update | 2026-09-17 |
| Owner | Text | ✅ | Who owns this prospect | Riajul |

**Relationships:**
- One prospect belongs to one contact (Contact ID)
- One prospect belongs to one company (Company ID)
- Prospect ID is foreign key in Conversations sheet

---

## Sheet 4: Conversations

**Purpose:** Store conversation history (one row per message sent/received)

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| Conversation ID | Text | ✅ | Unique identifier | CONV-001 |
| Prospect ID | Text | ✅ | FK to Prospects sheet | PRO-001 |
| Message Type | Text | ✅ | Outbound / Inbound | Outbound |
| Message Channel | Text | ✅ | Email / LinkedIn | Email |
| Message Date | Date | ✅ | When message was sent/received | 2026-09-17 |
| Message Subject | Text | ❌ | Email subject or message title | Quick observation about... |
| Message Content | Long Text | ✅ | Full message content | [Full email text] |
| Follow-up Number | Number | ❌ | Which follow-up (1, 2, 3) | NULL |
| Human Approved | Boolean | ✅ | Was this approved by human? | TRUE |
| Approved Date | Date | ❌ | When human approved | 2026-09-17 |
| Sent Date | Date | ❌ | When message was actually sent | 2026-09-17 |
| Status | Text | ✅ | Draft / Approved / Sent / Failed | Sent |
| Notes | Long Text | ❌ | Additional notes | Initial cold outreach |

**Relationships:**
- Many conversations belong to one prospect (Prospect ID)
- Conversation ID is foreign key in Reply Analysis sheet

---

## Sheet 5: Reply Analysis

**Purpose:** Store analysis of received replies (one row per reply analyzed)

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| Analysis ID | Text | ✅ | Unique identifier | ANAL-001 |
| Conversation ID | Text | ✅ | FK to Conversations sheet | CONV-002 |
| Prospect ID | Text | ✅ | FK to Prospects sheet | PRO-001 |
| Reply Date | Date | ✅ | When reply was received | 2026-09-18 |
| Reply Content | Long Text | ✅ | Full reply content | [Full reply text] |
| Classification | Text | ✅ | 13 categories | INTERESTED |
| Sentiment | Text | ✅ | Positive / Neutral / Negative / Mixed | Positive |
| Interest Level | Text | ✅ | High / Medium / Low / None | Medium |
| Objection | Text | ❌ | Type of objection | NULL |
| Buying Signal | Long Text | ❌ | Detected buying signals | NULL |
| Requested Info | Text | ❌ | What prospect asked for | NULL |
| Urgency | Text | ✅ | High / Medium / Low / None | Medium |
| Recommended Action | Long Text | ✅ | AI recommendation | Suggest call, share case study |
| Human Approved | Boolean | ✅ | Was analysis approved? | TRUE |
| Notes | Long Text | ❌ | Additional notes | Prospect seems genuinely interested |

**Relationships:**
- One analysis belongs to one conversation (Conversation ID)
- One analysis belongs to one prospect (Prospect ID)

---

## Sheet 6: Follow-ups

**Purpose:** Track scheduled follow-ups (one row per follow-up task)

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| Follow-up ID | Text | ✅ | Unique identifier | FU-001 |
| Prospect ID | Text | ✅ | FK to Prospects sheet | PRO-001 |
| Follow-up Type | Text | ✅ | No Response / Re-engagement / Proposal / Post-meeting | No Response |
| Scheduled Date | Date | ✅ | When follow-up is due | 2026-09-22 |
| Follow-up Number | Number | ✅ | Which follow-up (1, 2, 3) | 1 |
| Channel | Text | ✅ | Email / LinkedIn | Email |
| Value Angle | Long Text | ✅ | What value to provide | Reference case study |
| Draft Content | Long Text | ✅ | Draft follow-up message | [Draft text] |
| Human Approved | Boolean | ❌ | Was this approved? | FALSE |
| Sent Date | Date | ❌ | When follow-up was sent | NULL |
| Status | Text | ✅ | Scheduled / Approved / Sent / Skipped | Scheduled |
| Notes | Long Text | ❌ | Additional notes | First follow-up after initial outreach |

**Relationships:**
- Many follow-ups belong to one prospect (Prospect ID)

---

## Sheet 7: Meetings

**Purpose:** Track scheduled meetings (one row per meeting)

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| Meeting ID | Text | ✅ | Unique identifier | MEET-001 |
| Prospect ID | Text | ✅ | FK to Prospects sheet | PRO-001 |
| Meeting Date | Date | ✅ | When meeting is scheduled | 2026-09-25 |
| Meeting Time | Time | ✅ | What time | 14:00 |
| Duration | Number | ✅ | Duration in minutes | 30 |
| Timezone | Text | ✅ | Meeting timezone | AEST |
| Meeting Type | Text | ✅ | Call / Video / In-person | Video |
| Meeting Link | URL | ❌ | Zoom/Meet/etc. link | https://zoom.us/... |
| Meeting Notes | Long Text | ❌ | Notes from meeting | [Meeting notes] |
| Outcome | Text | ❌ | Positive / Neutral / Negative | Positive |
| Next Action | Long Text | ❌ | What to do next | Send proposal |
| Status | Text | ✅ | Scheduled / Completed / Cancelled | Scheduled |
| Created Date | Date | ✅ | When meeting was created | 2026-09-20 |
| Updated Date | Date | ✅ | Last update | 2026-09-20 |

**Relationships:**
- Many meetings can belong to one prospect (Prospect ID)

---

## Sheet 8: Proposals

**Purpose:** Track sent proposals (one row per proposal)

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| Proposal ID | Text | ✅ | Unique identifier | PROP-001 |
| Prospect ID | Text | ✅ | FK to Prospects sheet | PRO-001 |
| Proposal Date | Date | ✅ | When proposal was sent | 2026-09-28 |
| Proposal Content | Long Text | ✅ | Proposal summary/link | [Proposal document link] |
| Service | Text | ✅ | What service is proposed | Local SEO & ORM |
| Price | Number | ❌ | Proposed price | 750 |
| Price Currency | Text | ❌ | Currency | USD |
| Price Frequency | Text | ❌ | One-time / Monthly / Project | Monthly |
| Valid Until | Date | ❌ | Proposal expiration | 2026-10-28 |
| Status | Text | ✅ | Draft / Sent / Accepted / Rejected / Expired | Sent |
| Notes | Long Text | ❌ | Additional notes | Includes 3-month engagement |
| Created Date | Date | ✅ | When proposal was created | 2026-09-27 |
| Updated Date | Date | ✅ | Last update | 2026-09-28 |

**Relationships:**
- Many proposals can belong to one prospect (Prospect ID)

---

## Sheet 9: Metrics

**Purpose:** Store operational metrics (one row per day)

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| Metric Date | Date | ✅ | Date for metrics | 2026-09-17 |
| Prospects Researched | Number | ✅ | New prospects researched | 15 |
| Prospects Qualified | Number | ✅ | Prospects qualified (A/B/C) | 9 |
| Outreach Drafted | Number | ✅ | Outreach messages drafted | 5 |
| Outreach Approved | Number | ✅ | Outreach approved by human | 4 |
| Outreach Sent | Number | ✅ | Outreach actually sent | 4 |
| Replies Received | Number | ✅ | Replies from prospects | 2 |
| Positive Replies | Number | ✅ | Interested / Meeting requests | 1 |
| Meetings Scheduled | Number | ✅ | Meetings scheduled | 0 |
| Proposals Sent | Number | ✅ | Proposals sent | 0 |
| Won | Number | ✅ | Deals won | 0 |
| Lost | Number | ✅ | Deals lost | 0 |
| Nurture | Number | ✅ | Moved to nurture | 1 |
| Follow-ups Due | Number | ✅ | Follow-ups scheduled | 3 |
| Follow-ups Completed | Number | ✅ | Follow-ups sent | 2 |
| Response Rate | Number | ❌ | Replies / Outreach sent | 50% |
| Positive Response Rate | Number | ❌ | Positive / Replies | 50% |
| Meeting Conversion | Number | ❌ | Meetings / Positive replies | 0% |
| Notes | Long Text | ❌ | Additional notes | Good start, 1 interested reply |

**Relationships:**
- One row per day (time series data)

---

## Sheet 10: Audit Log

**Purpose:** Track all changes to CRM data (one row per change)

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| Log ID | Text | ✅ | Unique identifier | LOG-001 |
| Timestamp | DateTime | ✅ | When change occurred | 2026-09-17 14:30:00 |
| User | Text | ✅ | Who made change | Riajul / Agent |
| Sheet | Text | ✅ | Which sheet was changed | Prospects |
| Record ID | Text | ✅ | Which record was changed | PRO-001 |
| Field | Text | ✅ | Which field was changed | Pipeline Stage |
| Old Value | Text | ❌ | Previous value | QUALIFIED |
| New Value | Text | ✅ | New value | OUTREACH_READY |
| Reason | Long Text | ❌ | Why change was made | Outreach drafted and approved |

**Relationships:**
- Independent table (no foreign keys)
- Provides audit trail for all changes

---

## Data Validation Rules

### Required Fields Enforcement

**Companies Sheet:**
- ✅ Company ID (auto-generated)
- ✅ Company Name (cannot be blank)
- ✅ Created Date (auto-generated)
- ✅ Updated Date (auto-updated)
- ✅ Status (default: Active)

**Contacts Sheet:**
- ✅ Contact ID (auto-generated)
- ✅ Company ID (must exist in Companies)
- ✅ Created Date (auto-generated)
- ✅ Updated Date (auto-updated)
- ✅ Status (default: Active)

**Prospects Sheet:**
- ✅ Prospect ID (auto-generated)
- ✅ Contact ID (must exist in Contacts)
- ✅ Company ID (must exist in Companies)
- ✅ Priority (must be A/B/C)
- ✅ Priority Reason (cannot be blank)
- ✅ ICP Segment (must be Primary/Secondary/Tertiary)
- ✅ Service (must be valid service name)
- ✅ Opportunity (cannot be blank)
- ✅ Research Evidence (cannot be blank)
- ✅ Portfolio Proof (cannot be blank)
- ✅ Pipeline Stage (must be valid stage)
- ✅ Created Date (auto-generated)
- ✅ Updated Date (auto-updated)
- ✅ Owner (default: Riajul)

**Conversations Sheet:**
- ✅ Conversation ID (auto-generated)
- ✅ Prospect ID (must exist in Prospects)
- ✅ Message Type (must be Outbound/Inbound)
- ✅ Message Channel (must be Email/LinkedIn)
- ✅ Message Date (cannot be blank)
- ✅ Message Content (cannot be blank)
- ✅ Human Approved (default: FALSE)
- ✅ Status (default: Draft)

**Reply Analysis Sheet:**
- ✅ Analysis ID (auto-generated)
- ✅ Conversation ID (must exist in Conversations)
- ✅ Prospect ID (must exist in Prospects)
- ✅ Reply Date (cannot be blank)
- ✅ Reply Content (cannot be blank)
- ✅ Classification (must be one of 13 categories)
- ✅ Sentiment (must be Positive/Neutral/Negative/Mixed)
- ✅ Interest Level (must be High/Medium/Low/None)
- ✅ Urgency (must be High/Medium/Low/None)
- ✅ Recommended Action (cannot be blank)
- ✅ Human Approved (default: FALSE)

**Follow-ups Sheet:**
- ✅ Follow-up ID (auto-generated)
- ✅ Prospect ID (must exist in Prospects)
- ✅ Follow-up Type (must be valid type)
- ✅ Scheduled Date (cannot be blank)
- ✅ Follow-up Number (must be > 0)
- ✅ Channel (must be Email/LinkedIn)
- ✅ Value Angle (cannot be blank)
- ✅ Draft Content (cannot be blank)
- ✅ Status (default: Scheduled)

**Meetings Sheet:**
- ✅ Meeting ID (auto-generated)
- ✅ Prospect ID (must exist in Prospects)
- ✅ Meeting Date (cannot be blank)
- ✅ Meeting Time (cannot be blank)
- ✅ Duration (must be > 0)
- ✅ Timezone (cannot be blank)
- ✅ Meeting Type (must be Call/Video/In-person)
- ✅ Status (default: Scheduled)
- ✅ Created Date (auto-generated)
- ✅ Updated Date (auto-updated)

**Proposals Sheet:**
- ✅ Proposal ID (auto-generated)
- ✅ Prospect ID (must exist in Prospects)
- ✅ Proposal Date (cannot be blank)
- ✅ Proposal Content (cannot be blank)
- ✅ Service (must be valid service name)
- ✅ Status (default: Draft)
- ✅ Created Date (auto-generated)
- ✅ Updated Date (auto-updated)

**Metrics Sheet:**
- ✅ Metric Date (cannot be blank, one per day)
- ✅ Prospects Researched (default: 0)
- ✅ Prospects Qualified (default: 0)
- ✅ Outreach Drafted (default: 0)
- ✅ Outreach Approved (default: 0)
- ✅ Outreach Sent (default: 0)
- ✅ Replies Received (default: 0)
- ✅ Positive Replies (default: 0)
- ✅ Meetings Scheduled (default: 0)
- ✅ Proposals Sent (default: 0)
- ✅ Won (default: 0)
- ✅ Lost (default: 0)
- ✅ Nurture (default: 0)
- ✅ Follow-ups Due (default: 0)
- ✅ Follow-ups Completed (default: 0)

**Audit Log Sheet:**
- ✅ Log ID (auto-generated)
- ✅ Timestamp (auto-generated)
- ✅ User (cannot be blank)
- ✅ Sheet (cannot be blank)
- ✅ Record ID (cannot be blank)
- ✅ Field (cannot be blank)
- ✅ New Value (cannot be blank)

---

## Data Relationships Diagram

```
Companies (1)
    ↓ (has many)
Contacts (1)
    ↓ (has many)
Prospects (1)
    ↓ (has many)
    ├─→ Conversations (1)
    │       ↓ (has many)
    │       └─→ Reply Analysis
    ├─→ Follow-ups
    ├─→ Meetings
    └─→ Proposals

Metrics (independent, time series)
Audit Log (independent, append-only)
```

---

## Access Control

### Google Sheets Permissions

**Owner:** Riajul
- Full access (read/write/delete)
- Can share with others
- Can export data

**Agent (via API):**
- Read all sheets
- Write to all sheets (with validation)
- Cannot delete sheets
- Cannot change sharing settings

**Backup Service:**
- Read-only access
- Automated daily backups
- Cannot modify data

### API Access

**Service Account:**
- Create service account in Google Cloud
- Grant access to CRM spreadsheet
- Use for automated read/write operations

**Scopes Required:**
- `https://www.googleapis.com/auth/spreadsheets` (read/write)
- `https://www.googleapis.com/auth/drive.readonly` (list files)

---

## Backup Strategy

### Daily Backups

**Method:** Google Sheets version history + manual export

**Frequency:** Daily at 23:59

**Retention:**
- Last 7 days: Full backups
- Last 30 days: Daily backups
- Last 365 days: Weekly backups
- Older: Monthly backups

**Storage:**
- Google Drive (version history)
- Local export (CSV/JSON)
- Optional: Cloud storage (S3, etc.)

### Manual Export

**When:**
- Before major changes
- Before API integration
- On-demand (Riajul can request)

**Format:**
- CSV (for spreadsheet import)
- JSON (for programmatic access)
- PDF (for reporting)

---

## Migration Plan

### From Current System to Persistent Storage

**Step 1: Create Google Sheets structure**
- Create spreadsheet: "Riajul Client Acquisition CRM"
- Create all 10 sheets
- Set up data validation rules
- Set up sharing permissions

**Step 2: Migrate test data**
- Export current test prospects (Aesthetica, etc.)
- Import to new CRM structure
- Verify data integrity
- Test relationships (Company → Contact → Prospect)

**Step 3: Test read/write operations**
- Test reading prospect data
- Test writing conversation data
- Test updating pipeline stages
- Test creating follow-ups

**Step 4: Validate with real workflow**
- Run full workflow with persistent CRM
- Verify data persists across sessions
- Verify relationships are maintained
- Verify audit log captures changes

**Step 5: Go live**
- Switch from file-based to API-based
- Monitor for errors
- Collect feedback
- Iterate on schema if needed

---

## Performance Considerations

### Google Sheets Limits

**Cell limit:** 10 million cells per spreadsheet
**Row limit:** No hard limit (practical limit ~100k rows)
**API quota:** 60 requests per minute (per user)
**Read/write speed:** ~1-2 seconds per operation

**Estimated usage for 1000 prospects:**
- Companies: 1000 rows
- Contacts: 2000 rows (avg 2 per company)
- Prospects: 3000 rows (avg 3 per contact)
- Conversations: 15000 rows (avg 5 per prospect)
- Reply Analysis: 5000 rows (avg 1-2 per prospect)
- Follow-ups: 9000 rows (avg 3 per prospect)
- Meetings: 1000 rows (avg 1 per prospect)
- Proposals: 500 rows (avg 0.5 per prospect)
- Metrics: 365 rows (1 per day)
- Audit Log: 50000 rows (avg 5 changes per record)

**Total:** ~86,000 rows — well within limits

---

## Future Enhancements

### Phase 2: Advanced Features

**Views and Filters:**
- Saved filters (A-priority, due today, etc.)
- Custom views by user
- Dashboard views

**Automation:**
- Auto-generate Prospect ID
- Auto-update Updated Date
- Auto-calculate metrics
- Auto-trigger follow-ups

**Integration:**
- Connect to email (auto-log conversations)
- Connect to calendar (auto-create meetings)
- Connect to analytics (auto-update metrics)

### Phase 3: Multi-User Support

**Team collaboration:**
- Multiple users (Riajul + team members)
- Role-based access (admin, agent, viewer)
- Assignment and ownership
- Comments and mentions

---

## Conclusion

This schema provides a robust foundation for persistent CRM storage. It supports:

✅ Multiple contacts per company
✅ Full conversation history
✅ Reply analysis and classification
✅ Follow-up tracking
✅ Meeting management
✅ Proposal tracking
✅ Operational metrics
✅ Audit trail
✅ Data validation
✅ Backup and recovery

**Next Step:** Implement Google Sheets structure and migrate test data.
