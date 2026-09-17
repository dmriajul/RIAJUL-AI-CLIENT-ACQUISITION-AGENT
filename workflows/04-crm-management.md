# CRM Management Workflow — Expanded

> Phase 4 — Integrated Module
> Date: 2026-09-17
> Extends: workflows/04-crm-management.md
> Integration: Works with Reply Intelligence (workflows/03-reply-intelligence.md) and Follow-Up Intelligence (workflows/06-follow-up-intelligence.md)

---

## Expanded CRM Fields

### Core Fields (Existing)

| Field | Type | Description |
|-------|------|-------------|
| Prospect ID | Text | Unique identifier (PRO-XXX) |
| Company | Text | Company/brand name |
| Website | URL | Company website URL |
| Contact | Text | Decision maker name |
| Role | Text | Decision maker's job title |
| Email | Text | Business email address |
| LinkedIn | URL | Decision maker's LinkedIn profile |
| Instagram | Text | Brand Instagram handle |
| Facebook | Text | Brand Facebook page |
| Industry | Text | Business industry/category |
| Country | Text | Business location |
| Company Size | Text | Employee count range |
| Opportunity | Long Text | Identified opportunity |
| Service | Text | Relevant service(s) |
| Priority | Text | A / B / C |
| Priority Reason | Long Text | Why this priority level |
| Research Notes | Long Text | Key observations |
| Outreach Angle | Long Text | Personalization approach |
| Channel | Text | Email / LinkedIn / Both |
| Status | Text | Current pipeline stage |
| Last Contact Date | Date | Date of last outreach |
| Next Follow-up Date | Date | When to follow up next |
| Follow-up Count | Number | How many times contacted |
| Created Date | Date | When prospect was added |
| Updated Date | Date | Last CRM update |

### New Fields (Phase 4)

| Field | Type | Description |
|-------|------|-------------|
| Response Category | Text | INTERESTED / QUALIFIED / MEETING_REQUEST / PRICING / QUESTION / OBJECTION / NOT_NOW / NOT_INTERESTED / WRONG_PERSON / REFERRAL / ALREADY_HAVE_PROVIDER / NEEDS_MORE_INFORMATION / UNCLEAR |
| Interest Level | Text | High / Medium / Low / None |
| Sentiment | Text | Positive / Neutral / Negative / Mixed |
| Objection | Text | Type of objection (if any): Price / Timing / Authority / Need / Trust / Existing Provider |
| Buying Signal | Long Text | Any buying signals detected |
| Decision Maker Status | Text | Is decision-maker / Influencer / Gatekeeper / Unknown |
| Requested Info | Text | What prospect asked for |
| Urgency | Text | High / Medium / Low / None |
| Conversation Summary | Long Text | Summary of all interactions |
| Recommended Service | Text | Updated service recommendation based on conversation |
| Opportunity Status | Text | Active / At Risk / Stalled / Closed |
| Notes | Long Text | Human-added notes |
| Human Approval Status | Text | Pending / Approved / Rejected |
| DO_NOT_CONTACT | Boolean | True if prospect requested no contact |
| Linked Company ID | Text | If multiple contacts from same company |
| Referred By | Text | Name of person who referred (if applicable) |
| Re-engagement Date | Date | When to re-engage NURTURE prospects |
| Total Touchpoints | Number | Total messages sent (all channels) |
| Last Reply Date | Date | Date of last reply received |
| Days Since Last Contact | Calculated | Days between today and last contact |
| Meeting Date | Date | Scheduled meeting date (if applicable) |
| Meeting Notes | Long Text | Notes from meeting |
| Proposal Sent Date | Date | When proposal was sent |
| Loss Reason | Text | Reason for LOST status |

---

## Expanded Pipeline Stages

### Existing Stages (Unchanged)
```
NEW → RESEARCHED → QUALIFIED → OUTREACH READY → CONTACTED → 
FOLLOW-UP 1 → FOLLOW-UP 2 → REPLIED → CONVERSATION → 
MEETING → PROPOSAL → WON / LOST / NURTURE
```

### New Stage Modifiers
These are not separate stages but flags/modifiers on existing stages:

| Modifier | When Applied | Effect |
|----------|-------------|--------|
| **DO_NOT_CONTACT** | Prospect requests no contact | Blocks all future outreach |
| **REFERRED** | Contact refers another person | Links to new prospect record |
| **MULTI_CONTACT** | Multiple people from same company | Links records together |
| **RE_ENGAGING** | Returning to NURTURE prospect | Resets some counters |
| **PROPOSAL_PENDING** | Proposal sent, awaiting response | Changes follow-up logic |
| **MEETING_SCHEDULED** | Meeting confirmed | Changes follow-up logic |
| **AT_RISK** | Conversation stalled after interest | Triggers re-engagement |

---

## Expanded CRM Operations

### Adding a New Prospect

**Command:** `Add prospect: [company name]`

**Process:**
1. Check for existing company records (prevent duplicates)
2. Check for existing contacts at same company
3. Assign next available Prospect ID (PRO-XXX)
4. Fill in all known information
5. Set Status → NEW
6. Set Created Date → today
7. Set Next Action → "Research prospect"
8. If referred: set Referred By → [name], link to referrer record
9. If same company as existing: set Linked Company ID → [existing ID]

---

### Updating a Prospect Record

**Command:** `Update [prospect] — [field]: [value]`

**Important Rules:**
- NEVER overwrite verified information with assumptions
- NEVER clear existing notes (only append)
- ALWAYS update Updated Date
- ALWAYS log changes in Conversation Summary
- If changing Status: document reason in Notes

---

### Processing a Reply (Expanded)

**Command:** `Process reply from [prospect]`

**Process:**
1. Read the full reply
2. Run Reply Intelligence analysis (see workflows/03-reply-intelligence.md)
3. Determine classification (13 categories)
4. Analyze: intent, sentiment, interest level, buying signals, objections
5. Update CRM fields:
   - Status → REPLIED
   - Response Category → [classification]
   - Interest Level → [assessment]
   - Sentiment → [assessment]
   - Objection → [if applicable]
   - Buying Signal → [if detected]
   - Decision Maker Status → [assessment]
   - Requested Info → [if any]
   - Urgency → [assessment]
   - Last Reply Date → today
   - Conversation Summary → append reply summary
   - Updated Date → today
6. Determine recommended next action (via Follow-Up Intelligence)
7. Draft response for human approval
8. Set Next Follow-up Date (based on classification and timing config)
9. Set Human Approval Status → Pending

---

### Follow-Up Processing (Expanded)

**Command:** `Process follow-up for [prospect]`

**Process:**
1. Check timing (is it time for follow-up?)
2. Check total touchpoints (are we under max?)
3. Check DO_NOT_CONTACT flag (if true → STOP)
4. Check previous follow-ups (what angles used?)
5. Select new value angle (not used before)
6. Draft follow-up message
7. Update CRM:
   - Status → FOLLOW-UP [N]
   - Follow-up Count → increment
   - Last Contact Date → today
   - Next Follow-up Date → [based on timing config]
   - Total Touchpoints → increment
   - Updated Date → today
8. Submit for human approval
9. Set Human Approval Status → Pending

---

### Duplicate Handling

**Scenario:** Same prospect or company already exists in CRM.

**Process:**
1. Search CRM by: company name, website URL, contact name, email, LinkedIn
2. If match found:
   - DO NOT create new record
   - Update existing record with new information
   - Log new information in Notes
   - If different contact at same company: create new contact record, link via Linked Company ID
   - If same contact, different channel: update existing record, note channel used
3. If no match: proceed with new prospect creation

---

### Multi-Contact Handling

**Scenario:** Multiple people from same company in pipeline.

**Process:**
1. All contacts linked via Linked Company ID
2. Each contact has own record (own pipeline stage)
3. Notes reference each other: "Also contacted: [name] at same company"
4. When sending outreach to second contact:
   - Check if first contact is still active
   - If yes: mention in Notes, consider different angle
   - If no (cold/lost): proceed as fresh opportunity
5. Pipeline report shows company-level summary

---

### NURTURE Re-Engagement

**Scenario:** Prospect in NURTURE status, re-engagement date reached.

**Process:**
1. Check re-engagement date (is it time?)
2. Review conversation history (what was last discussed?)
3. Check for any changes (company news, industry changes)
4. Select fresh angle (different from previous outreach)
5. Draft re-engagement message:
   - Reference previous conversation (briefly)
   - Share something new/valuable
   - Ask if timing is better now
6. Update CRM:
   - Status → NURTURE (or appropriate stage if they respond)
   - Re-engagement Date → clear
   - Next Follow-up Date → [based on timing config]
7. Submit for human approval

---

## Expanded Pipeline Report

### Command: `Pipeline report`

### Output:
```
PIPELINE REPORT — [Date]
━━━━━━━━━━━━━━━━━━━━━━━━━━

OVERVIEW:
  Total prospects: [X]
  Active pipeline: [X]
  Won (total): [X]
  Lost (total): [X]
  NURTURE: [X]

BY STAGE:
  NEW:              [X]
  RESEARCHED:       [X]
  QUALIFIED:        [X]
  OUTREACH READY:   [X]
  CONTACTED:        [X]
  FOLLOW-UP 1:      [X]
  FOLLOW-UP 2:      [X]
  REPLIED:          [X]
  CONVERSATION:     [X]
  MEETING:          [X]
  PROPOSAL:         [X]
  WON:              [X]
  LOST:             [X]
  NURTURE:          [X]

BY PRIORITY:
  A (Strong fit):   [X]
  B (Potential fit): [X]
  C (Weak fit):     [X]

BY RESPONSE CATEGORY:
  INTERESTED:                [X]
  QUALIFIED:                 [X]
  MEETING_REQUEST:           [X]
  PRICING:                   [X]
  QUESTION:                  [X]
  OBJECTION:                 [X]
  NOT_NOW:                   [X]
  NOT_INTERESTED:            [X]
  WRONG_PERSON:              [X]
  REFERRAL:                  [X]
  ALREADY_HAVE_PROVIDER:     [X]
  NEEDS_MORE_INFORMATION:    [X]
  UNCLEAR:                   [X]

BY INTEREST LEVEL:
  High: [X]
  Medium: [X]
  Low: [X]
  None: [X]

BY SERVICE:
  Meta Ads:         [X]
  Google Ads:       [X]
  SMM:              [X]
  SEO:              [X]
  Local SEO/ORM:    [X]
  Analytics:        [X]
  CRO:              [X]
  Multiple:         [X]

BY GEOGRAPHY:
  USA:              [X]
  UK:               [X]
  Canada:           [X]
  Australia:        [X]
  UAE:              [X]
  Singapore:        [X]

FOLLOW-UPS:
  Due today:        [X]
  Due this week:    [X]
  Overdue:          [X]
  NURTURE re-engagement due: [X]

ACTIONS NEEDED:
  [List all prospects requiring action, sorted by priority and urgency]

HEALTH METRICS:
  Reply rate:       [X]%
  Meeting rate:     [X]%
  Win rate:         [X]%
  Avg. cycle time:  [X] days (NEW to WON)
  Avg. touchpoints to reply: [X]
  Avg. touchpoints to meeting: [X]

DO NOT CONTACT: [X] prospects
MULTI-CONTACT companies: [X]
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Daily Follow-Up Check (Expanded)

### Command: `Today's follow-ups`

### Output:
```
FOLLOW-UPS DUE TODAY — [Date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NO-RESPONSE FOLLOW-UPS:

1. [Company] (PRO-XXX) — Follow-Up #[N]
   Contact: [Name] — [Role]
   Channel: [Email/LinkedIn]
   Last contact: [Date] ([X] days ago)
   Priority: [A/B/C]
   
   Suggested angle: [Value angle to use]
   Suggested draft:
   ---
   [Follow-up message]
   ---

RE-ENGAGEMENT FOLLOW-UPS (from NURTURE):

2. [Company] (PRO-XXX) — Re-engagement
   Contact: [Name] — [Role]
   Last contact: [Date] ([X] days ago)
   Previous classification: [NOT_NOW / ALREADY_HAVE_PROVIDER]
   
   Suggested angle: [Fresh angle]
   Suggested draft:
   ---
   [Re-engagement message]
   ---

PROPOSAL FOLLOW-UPS:

3. [Company] (PRO-XXX) — Proposal follow-up
   Contact: [Name] — [Role]
   Proposal sent: [Date] ([X] days ago)
   
   Suggested draft:
   ---
   [Proposal follow-up message]
   ---

POST-MEETING FOLLOW-UPS:

4. [Company] (PRO-XXX) — Post-meeting follow-up
   Contact: [Name] — [Role]
   Meeting date: [Date] ([X] days ago)
   
   Suggested draft:
   ---
   [Post-meeting message]
   ---

Total follow-ups due: [X]

OVERDUE FOLLOW-UPS:
1. [Company] — Was due [Date] ([X] days overdue)
   ...

Total overdue: [X]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## CRM Data Integrity Rules (Expanded)

### Must-Have Fields (Every Record)
1. ✅ Prospect ID
2. ✅ Company name
3. ✅ Status (pipeline stage)
4. ✅ Priority (A/B/C) with reasoning
5. ✅ Next Action
6. ✅ Created Date
7. ✅ Updated Date

### Recommended Fields (Fill When Available)
- Contact name and role
- Channel used
- Industry
- Country
- Research notes
- Outreach angle

### New Fields (Fill When Applicable)
- Response Category (after reply)
- Interest Level (after reply)
- Sentiment (after reply)
- Conversation Summary (after any interaction)
- Human Approval Status (for all outbound)
- DO_NOT_CONTACT (when applicable)

### Rules:
1. **Never overwrite verified information with assumptions**
2. **Never clear existing notes** — only append
3. **Always update Updated Date** on any change
4. **Always log changes in Conversation Summary**
5. **Always document status changes with reason**
6. **Check for duplicates before adding new prospects**
7. **Check for existing contacts at same company**
8. **Never send external communication without approval**
9. **Never contact DO_NOT_CONTACT prospects**
10. **Regular cleanup** — archive old LOST prospects (>180 days)
