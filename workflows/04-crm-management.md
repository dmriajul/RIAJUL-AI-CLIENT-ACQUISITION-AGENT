# CRM Management Workflow

## Trigger Commands
```
Pipeline report
Update CRM for [prospect]
Move [prospect] to [stage]
```

---

## CRM Operations

### Adding a New Prospect
**Command:** `Add prospect: [company name]`

**Required fields:**
- Company name
- Website URL
- Industry

**Optional fields (fill as available):**
- Contact name and role
- LinkedIn URL
- Email
- Instagram handle
- Facebook page
- Country
- Company size

**Process:**
1. Assign next Prospect ID (PRO-XXX)
2. Fill in all known information
3. Set status to "NEW"
4. Set Created Date to today
5. Set Next Action to "Research prospect"
6. Set Next Action Reason to "Initial research needed"

---

### Updating a Prospect
**Command:** `Update [prospect] — [field]: [value]`

**Common updates:**
- Status changes
- New research notes
- Priority changes
- Follow-up date updates
- Next action updates
- Reply logging

**Process:**
1. Find prospect by ID or company name
2. Update specified fields
3. Set Updated Date to today
4. Confirm changes

---

### Moving Through Pipeline

**From NEW → RESEARCHED:**
- Complete research fields
- Fill in company information
- Document marketing observations
- Set Next Action to "Qualify"

**From RESEARCHED → QUALIFIED:**
- Assign A/B/C priority with reasoning
- Identify opportunity
- Match relevant service
- Set Next Action to "Draft outreach"

**From QUALIFIED → OUTREACH READY:**
- Draft personalized outreach
- Identify relevant proof
- Get human approval
- Set Next Action to "Send outreach"

**From OUTREACH READY → CONTACTED:**
- Send outreach (after approval)
- Record send date
- Set next follow-up date
- Increment follow-up count
- Set Next Action to "Wait for response"

**From CONTACTED → FOLLOW-UP 1:**
- Send follow-up #1 (after approval)
- Record send date
- Set next follow-up date
- Increment follow-up count

**From FOLLOW-UP 1 → FOLLOW-UP 2:**
- Send follow-up #2 (after approval)
- Record send date
- Set next follow-up date
- Increment follow-up count

**From any stage → REPLIED:**
- Log reply content
- Classify reply
- Update Next Action based on classification
- Draft response for approval

**From REPLIED → CONVERSATION:**
- Multiple exchanges confirmed
- Interest demonstrated
- Next Action: "Schedule meeting" or similar

**From CONVERSATION → MEETING:**
- Meeting held
- Log meeting notes
- Next Action: "Send proposal" or "Close"

**From MEETING → PROPOSAL:**
- Proposal sent
- Record send date
- Next Action: "Follow up on proposal"

**From PROPOSAL → WON:**
- Client confirmed
- Log deal details
- Next Action: "Onboard client"

**From PROPOSAL → LOST:**
- Document loss reason
- Consider moving to NURTURE

**From any stage → NURTURE:**
- Set re-engagement date (30-60 days)
- Document reason for nurture status
- Next Action: "Re-engage on [date]"

---

## Pipeline Report

### Command: `Pipeline report`

### Output:
```
PIPELINE REPORT — [Date]
━━━━━━━━━━━━━━━━━━━━━━━

OVERVIEW:
  Total prospects: [X]
  Active pipeline: [X]
  Won (total): [X]
  Lost (total): [X]

BY STAGE:
  NEW:              [X] prospects
  RESEARCHED:       [X] prospects
  QUALIFIED:        [X] prospects
  OUTREACH READY:   [X] prospects
  CONTACTED:        [X] prospects
  FOLLOW-UP 1:      [X] prospects
  FOLLOW-UP 2:      [X] prospects
  REPLIED:          [X] prospects
  CONVERSATION:     [X] prospects
  MEETING:          [X] prospects
  PROPOSAL:         [X] prospects
  WON:              [X] prospects
  LOST:             [X] prospects
  NURTURE:          [X] prospects

BY PRIORITY:
  A (Strong fit):   [X] prospects
  B (Potential fit): [X] prospects
  C (Weak fit):     [X] prospects

BY SERVICE:
  Meta Ads:         [X] prospects
  Google Ads:       [X] prospects
  SMM:              [X] prospects
  SEO:              [X] prospects
  Multiple:         [X] prospects

BY GEOGRAPHY:
  USA:              [X] prospects
  UK:               [X] prospects
  Canada:           [X] prospects
  Australia:        [X] prospects
  Other:            [X] prospects

FOLLOW-UPS:
  Due today:        [X]
  Due this week:    [X]
  Overdue:          [X]

ACTIONS NEEDED:
  [List all prospects requiring action, sorted by priority]

HEALTH METRICS:
  Reply rate:       [X]%
  Meeting rate:     [X]%
  Win rate:         [X]%
  Avg. cycle time:  [X] days (NEW to WON)
━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Follow-Up Management

### Daily Follow-Up Check
**Command:** `Today's follow-ups`

### Output:
```
FOLLOW-UPS DUE TODAY — [Date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. [Company] (PRO-XXX) — Follow-Up #[N]
   Contact: [Name] — [Role]
   Channel: [Email/LinkedIn]
   Last contact: [Date] ([X] days ago)
   Reason: [No response / etc.]
   
   Suggested draft:
   ---
   [Follow-up message]
   ---

2. [Company] (PRO-XXX) — Follow-Up #[N]
   ...

Total follow-ups due: [X]

OVERDUE FOLLOW-UPS:
1. [Company] — Was due [Date] ([X] days overdue)
   ...

Total overdue: [X]
```

---

## CRM Data Integrity Rules

1. **Every prospect must have a status** — never leave blank
2. **Every prospect must have a next action** — always know what's next
3. **Dates must be recorded** — last contact, next follow-up, created, updated
4. **Priority must have reasoning** — never A/B/C without explanation
5. **Replies must be logged** — full content + classification
6. **Notes for context** — add human notes for anything unusual
7. **Regular cleanup** — archive old prospects, update stale records
8. **No duplicates** — check before adding new prospects
