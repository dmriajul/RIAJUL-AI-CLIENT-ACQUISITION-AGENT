# CRM Operations — CRUD Data Operations

> Phase 6A — Persistent CRM Implementation
> Defines every data operation the Agent can perform on the CRM
> All operations include validation, audit logging, and relationship checks

---

## Operation Conventions

### ID Generation

```
Format: {PREFIX}-{NNN}
Padding: 3 digits (001, 002, ...)
Auto-increment: Yes (based on highest existing ID in sheet)

Prefixes:
  COMP-   Companies
  CONT-   Contacts
  PRO-    Prospects
  CONV-   Conversations
  ANAL-   Reply Analysis
  FU-     Follow-ups
  MEET-   Meetings
  PROP-   Proposals
  LOG-    Audit Log
```

### Timestamp Convention

```
Dates: YYYY-MM-DD
DateTimes: YYYY-MM-DDTHH:MM:SS
Timezone: UTC for storage, convert to local for display
Auto-set: Created Date, Updated Date on every mutation
```

### Actor Convention

```
Agent    — AI agent performs the operation
Riajul   — Human performs the operation
System   — Automated process (e.g. daily metrics calculation)
```

---

## 1. CREATE Company

### When to Use
- New prospect identified during research
- Adding a company from referral

### Input
```
Required:
  - Company Name (string, unique)
  - Status (default: "Active")

Optional:
  - Website (URL)
  - Domain (extracted from Website)
  - Industry (string)
  - Country (string)
  - City (string)
  - Company Size (enum: 1-10, 11-50, 51-200, 201-500, 500+)
  - LinkedIn Company (URL)
  - Instagram (string)
  - Facebook (string)
  - ICP Segment (Primary/Secondary/Tertiary)
  - Notes (string)
  - Source (string)
```

### Process
```
1. VALIDATE Company Name is not blank
2. CHECK duplicate by Company Name (case-insensitive)
3. CHECK duplicate by Domain (if Website provided)
4. If duplicate found:
   → BLOCK operation
   → Return existing Company ID
   → Suggest: "Add contact to existing company" instead
5. GENERATE Company ID (COMP-{NNN})
6. SET Created Date = today
7. SET Updated Date = today
8. SET Status = "Active"
9. SET Created By = "Agent"
10. IF Website provided, EXTRACT Domain
11. INSERT row into Companies sheet
12. LOG audit event:
    - Action: CREATE
    - Entity: Company
    - Entity ID: new Company ID
    - New Value: Company Name
    - Reason: "New company added"
```

### Output
```
Success: { Company ID, Status: "Created" }
Duplicate: { Blocked: true, Existing Company ID, Existing Company Name }
Validation Error: { Blocked: true, Reason: "..." }
```

---

## 2. CREATE Contact

### When to Use
- New contact identified for a company
- Adding second/third contact to existing company
- Contact from referral

### Input
```
Required:
  - Company ID (must exist in Companies sheet)

Optional:
  - Contact Name (string)
  - Role (string)
  - Email (email, unique across all contacts)
  - Email Verified (boolean, default: false)
  - LinkedIn (URL)
  - Decision Maker Status (Decision-maker/Influencer/Gatekeeper/Unknown)
  - Referred By (string)
  - Notes (string)
  - Source (string)
```

### Process
```
1. VALIDATE Company ID exists in Companies sheet
2. If Company ID not found:
   → BLOCK operation
   → Return error: "Company ID not found"
3. IF Email provided:
   a. CHECK duplicate Email across all contacts
   b. If duplicate found:
      → BLOCK operation
      → Return existing Contact ID
      → Return error: "Email already exists for [Contact Name]"
4. GENERATE Contact ID (CONT-{NNN})
5. SET Created Date = today
6. SET Updated Date = today
7. SET Status = "Active"
8. SET Created By = "Agent"
9. INSERT row into Contacts sheet
10. LOG audit event:
    - Action: CREATE
    - Entity: Contact
    - Entity ID: new Contact ID
    - New Value: "Contact Name for Company Name"
    - Reason: "New contact added"
```

### Output
```
Success: { Contact ID, Company ID, Status: "Created" }
Not Found: { Blocked: true, Reason: "Company ID not found" }
Duplicate: { Blocked: true, Existing Contact ID, Reason: "Email already exists" }
```

---

## 3. CREATE Prospect

### When to Use
- New business opportunity identified for a contact+service combination
- Same contact needs different service engagement

### Input
```
Required:
  - Contact ID (must exist)
  - Company ID (must exist)
  - Priority (A/B/C)
  - Priority Reason (string, evidence-based)
  - ICP Segment (Primary/Secondary/Tertiary)
  - Service (valid service name)
  - Opportunity (string, evidence-based)
  - Research Evidence (string, verified observations)
  - Portfolio Proof (string, matching case studies)

Optional:
  - Outreach Channel (Email/LinkedIn/Both)
  - Outreach Angle (string)
  - Owner (default: "Riajul")
  - Source (string)
```

### Process
```
1. VALIDATE Contact ID exists
2. VALIDATE Company ID exists
3. VALIDATE Priority is A, B, or C
4. VALIDATE ICP Segment is valid
5. VALIDATE Service is valid service name
6. CHECK duplicate: same Contact ID + Service already exists
   → If duplicate found:
     → BLOCK operation
     → Return existing Prospect ID
     → Suggest: "Update existing prospect" instead
7. GENERATE Prospect ID (PRO-{NNN})
8. SET Pipeline Stage = "NEW"
9. SET Total Touchpoints = 0
10. SET Email Touchpoints = 0
11. SET LinkedIn Touchpoints = 0
12. SET Created Date = today
13. SET Updated Date = today
14. SET Owner = "Riajul"
15. SET Created By = "Agent"
16. INITIALIZE Stage History = [{stage: "NEW", date: today, reason: "Prospect created"}]
17. INSERT row into Prospects sheet
18. LOG audit event:
    - Action: CREATE
    - Entity: Prospect
    - Entity ID: new Prospect ID
    - New Value: "Priority Service for Company Name"
    - Reason: "New prospect created"
```

### Valid Service Names
```
- Meta Ads Management
- Social Media Management
- Google Ads Management
- SEO
- Local SEO & ORM
- Analytics & Tracking
- CRO
- Combined Package
```

### Output
```
Success: { Prospect ID, Contact ID, Company ID, Pipeline Stage: "NEW" }
Duplicate: { Blocked: true, Existing Prospect ID, Reason: "Contact+Service exists" }
Validation Error: { Blocked: true, Reason: "..." }
```

---

## 4. UPDATE Prospect

### When to Use
- Change priority, service, or any field
- Update research evidence
- Change pipeline stage (see MOVE PIPELINE STAGE for stage changes)

### Input
```
Required:
  - Prospect ID (must exist)
  - Fields to update (one or more)
  - Reason for update (required for audit)

Updatable Fields:
  - Priority
  - Priority Reason
  - Opportunity
  - Research Evidence
  - Portfolio Proof
  - Outreach Channel
  - Outreach Angle
  - Interest Level
  - Sentiment
  - Objection
  - Buying Signal
  - Stage Modifier
  - Notes
```

### Process
```
1. VALIDATE Prospect ID exists
2. VALIDATE new values are valid (enums, required fields, etc.)
3. READ current prospect record
4. FOR each field to update:
   a. RECORD previous value
   b. SET new value
5. SET Updated Date = today
6. UPDATE row in Prospects sheet
7. FOR each field changed:
   a. LOG audit event:
      - Action: UPDATE
      - Entity: Prospect
      - Entity ID: Prospect ID
      - Field: field name
      - Previous Value: old value
      - New Value: new value
      - Reason: provided reason
```

### Output
```
Success: { Prospect ID, Fields Updated: [...], Status: "Updated" }
Not Found: { Blocked: true, Reason: "Prospect ID not found" }
Validation Error: { Blocked: true, Reason: "..." }
```

---

## 5. MOVE Pipeline Stage

### When to Use
- Prospect progresses through pipeline
- Stage change for any reason (reply, meeting, proposal, etc.)

### Input
```
Required:
  - Prospect ID (must exist)
  - New Stage (valid stage name)
  - Reason (required)

Valid Stages:
  NEW, RESEARCHED, QUALIFIED, OUTREACH_READY, CONTACTED,
  FOLLOW-UP 1, FOLLOW-UP 2, REPLIED, CONVERSATION,
  MEETING, PROPOSAL, NEGOTIATION, WON, LOST, NURTURE, DISQUALIFIED
```

### Process
```
1. VALIDATE Prospect ID exists
2. READ current prospect record
3. GET current Pipeline Stage
4. CHECK stage transition is valid (see stage transition map below)
5. If invalid transition:
   → BLOCK operation
   → Return error: "Cannot move from [current] to [new]"
   → Return valid next stages
6. CHECK DO_NOT_CONTACT compliance:
   → If Contact Status = DO_NOT_CONTACT:
     → BLOCK all outbound-related stages (CONTACTED, FOLLOW-UP 1, etc.)
     → Return error: "Contact is DO_NOT_CONTACT — blocked"
7. RECORD previous stage
8. SET Pipeline Stage = new stage
9. APPEND to Stage History:
   { stage: new stage, date: today, reason: provided reason }
10. SET Updated Date = today
11. IF new stage = WON or LOST or NURTURE or DISQUALIFIED:
    → SET Stage Modifier if applicable
12. UPDATE row in Prospects sheet
13. LOG audit event:
    - Action: STAGE_CHANGE
    - Entity: Prospect
    - Entity ID: Prospect ID
    - Field: "Pipeline Stage"
    - Previous Value: old stage
    - New Value: new stage
    - Reason: provided reason
```

### Stage Transition Map

```
FROM              → VALID NEXT STAGES
─────────────────────────────────────────
NEW               → RESEARCHED, DISQUALIFIED
RESEARCHED        → QUALIFIED, DISQUALIFIED
QUALIFIED         → OUTREACH_READY, DISQUALIFIED
OUTREACH_READY    → CONTACTED, DISQUALIFIED
CONTACTED         → FOLLOW-UP 1, REPLIED, NURTURE, DISQUALIFIED
FOLLOW-UP 1       → FOLLOW-UP 2, REPLIED, NURTURE, DISQUALIFIED
FOLLOW-UP 2       → REPLIED, NURTURE, DISQUALIFIED
REPLIED           → CONVERSATION, QUALIFIED, NURTURE, LOST, DISQUALIFIED
CONVERSATION      → MEETING, PROPOSAL, NURTURE, LOST
MEETING           → PROPOSAL, NURTURE, LOST
PROPOSAL          → NEGOTIATION, WON, LOST, NURTURE
NEGOTIATION       → WON, LOST, NURTURE
WON               → (terminal — no further transitions)
LOST              → NURTURE
NURTURE           → RESEARCHED, QUALIFIED, OUTREACH_READY, LOST
DISQUALIFIED      → (terminal — no further transitions)
```

### Output
```
Success: { Prospect ID, From: old stage, To: new stage, Status: "Moved" }
Invalid: { Blocked: true, Reason: "Cannot move from X to Y", Valid: [...] }
DO_NOT_CONTACT: { Blocked: true, Reason: "Contact is DO_NOT_CONTACT" }
```

---

## 6. LOG Outreach (CREATE Conversation — Outbound)

### When to Use
- Sending initial cold outreach
- Sending follow-up message

### Input
```
Required:
  - Prospect ID (must exist)
  - Message Channel (Email/LinkedIn)
  - Message Content (string)
  - Human Approved (boolean)

Optional:
  - Message Subject (string, for emails)
  - Follow-up Number (1, 2, 3 — null for initial)
  - Message Date (default: today)
```

### Process
```
1. VALIDATE Prospect ID exists
2. READ prospect record
3. READ associated Contact record
4. CHECK Contact Status != DO_NOT_CONTACT
   → If DO_NOT_CONTACT:
     → BLOCK operation
     → Return error: "Contact is DO_NOT_CONTACT — outreach blocked"
5. CHECK touchpoint limits:
   - If Email: count Email Touchpoints
   - If LinkedIn: count LinkedIn Touchpoints
   - Total = Email + LinkedIn
   → If Email >= 4: BLOCK ("Email limit reached")
   → If LinkedIn >= 3: BLOCK ("LinkedIn limit reached")
   → If Total >= 7: BLOCK ("Combined limit reached")
6. CHECK Human Approved = true
   → If false: BLOCK ("Must be human-approved before sending")
7. GENERATE Conversation ID (CONV-{NNN})
8. SET Message Type = "Outbound"
9. SET Status = "Sent"
10. SET Sent Date = today
11. SET Created Date = today
12. INSERT row into Conversations sheet
13. INCREMENT prospect's Total Touchpoints +1
14. INCREMENT prospect's channel Touchpoints +1
15. SET prospect's Last Contact Date = today
16. MOVE prospect stage:
    - If initial outreach → CONTACTED
    - If follow-up 1 → FOLLOW-UP 1
    - If follow-up 2 → FOLLOW-UP 2
17. LOG audit event:
    - Action: SEND
    - Entity: Conversation
    - Entity ID: new Conversation ID
    - New Value: "Outbound via [channel] to [prospect]"
    - Reason: "Outreach sent"
```

### Output
```
Success: { Conversation ID, Prospect ID, Stage: new stage, Touchpoints: N }
DO_NOT_CONTACT: { Blocked: true, Reason: "Contact is DO_NOT_CONTACT" }
Limit Reached: { Blocked: true, Reason: "[Channel] limit reached" }
Not Approved: { Blocked: true, Reason: "Must be human-approved" }
```

---

## 7. LOG Reply (CREATE Conversation — Inbound + Reply Analysis)

### When to Use
- Receiving reply from prospect
- Analyzing reply content

### Input
```
Required (Conversation):
  - Prospect ID (must exist)
  - Message Channel (Email/LinkedIn)
  - Message Content (string)
  - Message Date (date received)

Required (Reply Analysis):
  - Classification (13 categories)
  - Sentiment (Positive/Neutral/Negative/Mixed)
  - Interest Level (High/Medium/Low/None)
  - Urgency (High/Medium/Low/None)
  - Recommended Action (string)

Optional:
  - Objection (string)
  - Buying Signal (string)
  - Requested Info (string)
  - Notes (string)
```

### Process
```
1. VALIDATE Prospect ID exists
2. GENERATE Conversation ID (CONV-{NNN})
3. SET Message Type = "Inbound"
4. SET Status = "Received"
5. SET Created Date = today
6. INSERT row into Conversations sheet
7. GENERATE Analysis ID (ANAL-{NNN})
8. SET Reply Date = today
9. SET Created Date = today
10. INSERT row into Reply Analysis sheet
11. SET prospect's Last Reply Date = today
12. UPDATE prospect's Interest Level, Sentiment, Objection, Buying Signal
13. MOVE prospect stage based on classification:
    - INTERESTED → CONVERSATION
    - QUALIFIED → QUALIFIED
    - MEETING_REQUEST → MEETING
    - PRICING → CONVERSATION
    - QUESTION → CONVERSATION
    - OBJECTION → CONVERSATION
    - NOT_NOW → NURTURE
    - NOT_INTERESTED → LOST
    - WRONG_PERSON → (keep current, add referral)
    - REFERRAL → (keep current, create new prospect)
    - ALREADY_HAVE_PROVIDER → NURTURE
    - NEEDS_MORE_INFORMATION → CONVERSATION
    - UNCLEAR → CONVERSATION
14. LOG audit event for conversation:
    - Action: RECEIVE
    - Entity: Conversation
    - Entity ID: new Conversation ID
15. LOG audit event for analysis:
    - Action: CREATE
    - Entity: ReplyAnalysis
    - Entity ID: new Analysis ID
    - New Value: "Classification: [X]"
```

### Output
```
Success: { Conversation ID, Analysis ID, Classification, New Stage }
Error: { Blocked: true, Reason: "..." }
```

---

## 8. CREATE Follow-up

### When to Use
- Scheduling next follow-up after no response
- Scheduling re-engagement for NURTURE prospect
- Scheduling post-meeting or post-reply follow-up

### Input
```
Required:
  - Prospect ID (must exist)
  - Follow-up Type (No Response/Re-engagement/Proposal Follow-up/Post-meeting/Post-reply)
  - Scheduled Date (date)
  - Follow-up Number (integer)
  - Channel (Email/LinkedIn)
  - Value Angle (string)
  - Draft Content (string)

Optional:
  - Notes (string)
```

### Process
```
1. VALIDATE Prospect ID exists
2. READ prospect record
3. READ associated Contact record
4. CHECK Contact Status != DO_NOT_CONTACT
   → If DO_NOT_CONTACT:
     → BLOCK operation
     → SET Status = "Blocked"
     → SET Blocked Reason = "DO_NOT_CONTACT"
     → Return error
5. CHECK touchpoint limits:
   → If limit reached: BLOCK
6. CHECK Follow-up Number <= 3
   → If > 3: BLOCK ("Maximum follow-ups reached — move to NURTURE")
7. CHECK Scheduled Date is in the future
   → If past: BLOCK ("Cannot schedule follow-up in the past")
8. GENERATE Follow-up ID (FU-{NNN})
9. SET Status = "Scheduled"
10. SET Created Date = today
11. INSERT row into Follow-ups sheet
12. UPDATE prospect's Next Follow-up Date = Scheduled Date
13. LOG audit event:
    - Action: SCHEDULE
    - Entity: Followup
    - Entity ID: new Follow-up ID
    - New Value: "Follow-up #[N] scheduled for [date]"
    - Reason: Follow-up Type
```

### Output
```
Success: { Follow-up ID, Prospect ID, Scheduled Date, Status: "Scheduled" }
DO_NOT_CONTACT: { Blocked: true, Status: "Blocked", Reason: "DO_NOT_CONTACT" }
Limit: { Blocked: true, Reason: "Max follow-ups reached" }
```

---

## 9. COMPLETE Follow-up

### When to Use
- Follow-up message has been sent
- Marking scheduled follow-up as done

### Input
```
Required:
  - Follow-up ID (must exist)
  - Sent Date (date)

Optional:
  - Conversation ID (if conversation was created)
  - Notes (string)
```

### Process
```
1. VALIDATE Follow-up ID exists
2. READ follow-up record
3. CHECK Status = "Scheduled" or "Approved"
   → If already Sent: BLOCK ("Already completed")
   → If Blocked: BLOCK ("Follow-up is blocked")
4. SET Status = "Sent"
5. SET Sent Date = provided date
6. UPDATE row in Follow-ups sheet
7. LOG audit event:
    - Action: COMPLETE
    - Entity: Followup
    - Entity ID: Follow-up ID
    - Field: "Status"
    - Previous Value: "Scheduled"
    - New Value: "Sent"
    - Reason: "Follow-up sent"
```

### Output
```
Success: { Follow-up ID, Status: "Sent", Sent Date }
Error: { Blocked: true, Reason: "..." }
```

---

## 10. ADD Referral

### When to Use
- Prospect refers another person/company

### Input
```
Required:
  - Source Prospect ID (prospect who made referral)
  - Referred Contact Name
  - Referred Company Name

Optional:
  - Referred Email
  - Referred Role
  - Referred Company Website
  - Relationship (string)
  - Notes (string)
```

### Process
```
1. VALIDATE Source Prospect ID exists
2. READ source prospect record
3. CREATE new Company record for referred company:
   → Check duplicate first
   → If exists: use existing Company ID
   → If new: create new Company
4. CREATE new Contact record:
   → Link to new/existing Company
   → SET Referred By = source contact name
5. CREATE new Prospect record:
   → Link to new Contact
   → SET Priority based on referral quality
   → SET Priority Reason includes "Referred by [name]"
   → SET Stage Modifier = "REFERRED"
6. UPDATE source prospect:
   → SET Stage Modifier = "REFERRED"
7. LOG audit events for all created records:
   → Reason: "Referral from [source prospect]"
```

### Output
```
Success: {
  New Company ID,
  New Contact ID,
  New Prospect ID,
  Source Prospect ID updated
}
```

---

## 11. MARK DO_NOT_CONTACT

### When to Use
- Prospect explicitly requests no further contact
- Legal compliance requirement

### Input
```
Required:
  - Contact ID (must exist)
  - Reason (string — why DO_NOT_CONTACT is being set)

Optional:
  - Prospect ID (to also update prospect records)
```

### Process
```
1. VALIDATE Contact ID exists
2. READ contact record
3. CHECK if already DO_NOT_CONTACT
   → If already set: WARN ("Already DO_NOT_CONTACT")
4. SET Contact Status = "DO_NOT_CONTACT"
5. SET DO_NOT_CONTACT Date = today
6. SET DO_NOT_CONTACT Reason = provided reason
7. SET Updated Date = today
8. IF Prospect ID provided:
   a. UPDATE Prospect Stage Modifier = "DO_NOT_CONTACT"
   b. MOVE prospect stage to LOST or NURTURE
9. CHECK all follow-ups for this contact:
   → SET Status = "Blocked" for all Scheduled follow-ups
   → SET Blocked Reason = "DO_NOT_CONTACT"
10. UPDATE row in Contacts sheet
11. LOG audit event:
    - Action: STATUS_CHANGE
    - Entity: Contact
    - Entity ID: Contact ID
    - Field: "Status"
    - Previous Value: "Active"
    - New Value: "DO_NOT_CONTACT"
    - Reason: provided reason
12. LOG audit event for each blocked follow-up
```

### Output
```
Success: { Contact ID, Status: "DO_NOT_CONTACT", Blocked Follow-ups: N }
Already Set: { Warning: "Already DO_NOT_CONTACT", Date: original date }
```

---

## 12. MERGE Duplicate Records

### When to Use
- Duplicate company discovered
- Duplicate contact discovered
- Need to consolidate data

### Input
```
Required:
  - Entity Type (Company or Contact)
  - Primary ID (record to keep)
  - Duplicate ID (record to merge into primary)

Optional:
  - Field Resolution Rules (which value wins for conflicts)
```

### Process
```
1. VALIDATE both IDs exist
2. VALIDATE they are actually duplicates
3. READ both records
4. FOR each field:
   a. If primary has value, keep primary
   b. If primary is empty but duplicate has value, copy from duplicate
   c. If both have different values:
      → Keep primary's value
      → Log conflict for Riajul review
5. UPDATE primary record with merged data
6. SET duplicate record Status = "Duplicate"
7. UPDATE all foreign key references:
   → Point all references from duplicate ID to primary ID
   → This includes: Contacts (for companies), Prospects, Conversations, etc.
8. SET duplicate's Updated Date = today
9. LOG audit event for primary:
    - Action: MERGE
    - Entity: [Entity Type]
    - Entity ID: Primary ID
    - Reason: "Merged from [Duplicate ID]"
10. LOG audit event for duplicate:
    - Action: ARCHIVE
    - Entity: [Entity Type]
    - Entity ID: Duplicate ID
    - Reason: "Merged into [Primary ID]"
```

### Output
```
Success: { Primary ID, Duplicate ID (archived), Fields Merged: N, References Updated: N }
```

---

## 13. ADD Additional Contact to Existing Company

### When to Use
- Multiple decision-makers at same company
- Different contact for same engagement

### Input
```
Required:
  - Company ID (must exist)
  - Contact Name
  - Role

Optional:
  - Email (must be unique)
  - LinkedIn
  - Decision Maker Status
  - Notes
```

### Process
```
1. VALIDATE Company ID exists
2. CHECK Company Status != "Inactive" or "Archived"
3. CREATE new Contact record (standard CREATE Contact process)
4. CHECK if any existing prospects need Stage Modifier update:
   → SET Stage Modifier = "MULTI_CONTACT" for all prospects at this company
5. LOG audit event:
    - Action: CREATE
    - Entity: Contact
    - Entity ID: new Contact ID
    - Reason: "Additional contact for [Company Name]"
```

### Output
```
Success: { Contact ID, Company ID, Total Contacts at Company: N }
```

---

## 14. READ Complete Prospect History

### When to Use
- Reviewing full context before interaction
- Generating reports
- Debugging issues

### Input
```
Required:
  - Prospect ID (must exist)
```

### Process
```
1. VALIDATE Prospect ID exists
2. READ Prospect record
3. READ associated Contact record
4. READ associated Company record
5. READ all Conversations for this Prospect (ORDER BY Message Date)
6. READ all Reply Analyses for this Prospect
7. READ all Follow-ups for this Prospect (ORDER BY Scheduled Date)
8. READ all Meetings for this Prospect
9. READ all Proposals for this Prospect
10. READ all Audit Log entries for this Prospect
11. COMPILE complete history report
```

### Output
```
{
  Prospect: { ... },
  Contact: { ... },
  Company: { ... },
  Conversations: [ ... ],
  ReplyAnalyses: [ ... ],
  Followups: [ ... ],
  Meetings: [ ... ],
  Proposals: [ ... ],
  AuditTrail: [ ... ],
  Summary: {
    Total Touchpoints: N,
    Pipeline Stage: "...",
    Days in Pipeline: N,
    Last Activity: "...",
    Next Action: "..."
  }
}
```

---

## Operation Summary Table

| # | Operation | Entity | Validates | Audit Logs | DO_NOT_CONTACT Check |
|---|-----------|--------|-----------|------------|---------------------|
| 1 | CREATE Company | Company | Unique name/domain | Yes | No |
| 2 | CREATE Contact | Contact | Company exists, unique email | Yes | No |
| 3 | CREATE Prospect | Prospect | Contact+Company exist, unique | Yes | No |
| 4 | UPDATE Prospect | Prospect | Valid values | Yes (per field) | No |
| 5 | MOVE Pipeline Stage | Prospect | Valid transition | Yes | Yes |
| 6 | LOG Outreach | Conversation | Limits, approval | Yes | Yes |
| 7 | LOG Reply | Conversation + Analysis | Classification valid | Yes (×2) | No |
| 8 | CREATE Follow-up | Followup | Limits, future date | Yes | Yes |
| 9 | COMPLETE Follow-up | Followup | Status check | Yes | No |
| 10 | ADD Referral | Company + Contact + Prospect | Source exists | Yes (×3) | No |
| 11 | MARK DO_NOT_CONTACT | Contact | Exists | Yes (×1+N) | N/A |
| 12 | MERGE Duplicates | Company/Contact | Both exist | Yes (×2) | No |
| 13 | ADD Contact | Contact | Company exists | Yes | No |
| 14 | READ History | All | Exists | No (read-only) | No |
