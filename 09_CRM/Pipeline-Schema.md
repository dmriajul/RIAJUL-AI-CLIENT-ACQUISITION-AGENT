# CRM Pipeline Schema

## Pipeline Stages

```
NEW → RESEARCHED → QUALIFIED → OUTREACH READY → CONTACTED → 
FOLLOW-UP 1 → FOLLOW-UP 2 → REPLIED → CONVERSATION → 
MEETING → PROPOSAL → WON / LOST / NURTURE
```

---

## Stage Definitions

### NEW
**Meaning:** Prospect just discovered/added, no research done yet.
**Entry Criteria:** Identified from prospect source (LinkedIn, website, referral, etc.)
**Exit Criteria:** Basic information filled in.
**Next Action:** Research the prospect.

### RESEARCHED
**Meaning:** Basic research completed. Company info gathered.
**Entry Criteria:** Research fields filled (website, industry, size, social presence, etc.)
**Exit Criteria:** Opportunity identified or ruled out.
**Next Action:** Qualify the prospect.

### QUALIFIED
**Meaning:** Prospect assessed as potential fit. Priority assigned (A/B/C).
**Entry Criteria:** Qualification complete with reasoning.
**Exit Criteria:** Outreach angle defined.
**Next Action:** Prepare personalized outreach.

### OUTREACH READY
**Meaning:** Personalized outreach drafted and approved. Ready to send.
**Entry Criteria:** Outreach message drafted, approved by Riajul.
**Exit Criteria:** Message sent.
**Next Action:** Send outreach.

### CONTACTED
**Meaning:** First outreach message sent. Waiting for response.
**Entry Criteria:** Message sent. Date recorded.
**Exit Criteria:** Follow-up date reached OR reply received.
**Next Action:** Wait for response or follow up.

### FOLLOW-UP 1
**Meaning:** First follow-up sent. No reply to initial message.
**Entry Criteria:** Follow-up #1 sent. Date recorded.
**Exit Criteria:** Follow-up #2 date reached OR reply received.
**Next Action:** Wait or send follow-up #2.

### FOLLOW-UP 2
**Meaning:** Second follow-up sent. Still no reply.
**Entry Criteria:** Follow-up #2 sent. Date recorded.
**Exit Criteria:** Follow-up #3 (breakup) date reached OR reply received.
**Next Action:** Wait or send breakup email.

### REPLIED
**Meaning:** Prospect responded to outreach or follow-up.
**Entry Criteria:** Reply received and logged.
**Exit Criteria:** Reply classified. Next action determined.
**Next Action:** Respond based on reply classification.

### CONVERSATION
**Meaning:** Active back-and-forth communication happening.
**Entry Criteria:** Multiple exchanges. Interest confirmed.
**Exit Criteria:** Meeting scheduled or opportunity declined.
**Next Action:** Move to meeting or close.

### MEETING
**Meaning:** Meeting/call completed or scheduled.
**Entry Criteria:** Meeting held. Notes recorded.
**Exit Criteria:** Proposal needed or opportunity declined.
**Next Action:** Send proposal or close.

### PROPOSAL
**Meaning:** Proposal/scope/pricing sent to prospect.
**Entry Criteria:** Proposal sent. Date recorded.
**Exit Criteria:** Won, lost, or nurturing.
**Next Action:** Follow up on proposal.

### WON ✅
**Meaning:** Deal closed. Client signed.
**Entry Criteria:** Client confirmed. Contract signed or verbal agreement.
**Exit Criteria:** N/A — terminal state.
**Next Action:** Onboard client. Move to active client management.

### LOST ❌
**Meaning:** Opportunity lost. Prospect declined or went silent.
**Entry Criteria:** Explicit rejection, long-term silence, or budget mismatch.
**Exit Criteria:** N/A — terminal state (or move to NURTURE).
**Next Action:** Document reason. Consider moving to NURTURE.

### NURTURE 🔁
**Meaning:** Not right now, but potential for future.
**Entry Criteria:** Timing was wrong, budget wasn't there, or went silent after interest.
**Exit Criteria:** Re-engaged or permanently closed.
**Next Action:** Check in every 30-60 days with relevant value.

---

## CRM Fields

| Field | Type | Description |
|-------|------|-------------|
| Prospect ID | Text | Unique identifier (e.g., PRO-001) |
| Company | Text | Company/brand name |
| Website | URL | Company website URL |
| Contact | Text | Decision maker name |
| Role | Text | Decision maker's job title |
| Email | Text | Business email address |
| LinkedIn | URL | Decision maker's LinkedIn profile |
| Instagram | Text | Brand Instagram handle |
| Facebook | Text | Brand Facebook page |
| Industry | Text | Business industry/category |
| Country | Text | Business location (country) |
| Company Size | Text | Employee count range |
| Opportunity | Long Text | Identified opportunity description |
| Service | Text | Relevant service(s) for this prospect |
| Priority | Text | A (Strong) / B (Potential) / C (Weak) |
| Priority Reason | Long Text | Why this priority level |
| Research Notes | Long Text | Key observations from research |
| Outreach Angle | Long Text | Personalization approach used |
| Channel | Text | Email / LinkedIn / Both |
| Status | Text | Current pipeline stage |
| Last Contact Date | Date | Date of last outreach/follow-up |
| Next Follow-up Date | Date | When to follow up next |
| Follow-up Count | Number | How many times contacted |
| Reply Classification | Text | Classification of their response |
| Reply Content | Long Text | What they said |
| Next Action | Text | AI-recommended next action |
| Next Action Reason | Long Text | Why this action is recommended |
| Notes | Long Text | Human-added notes |
| Created Date | Date | When prospect was added |
| Updated Date | Date | Last CRM update |

---

## CRM Operations

### Adding a New Prospect
1. Assign next available Prospect ID
2. Fill in known information
3. Set status to "NEW"
4. Set Created Date to today
5. Set Next Action to "Research prospect"

### Researching a Prospect
1. Fill in all research fields
2. Identify opportunity
3. Determine relevant service
4. Set status to "RESEARCHED"
5. Assign priority with reasoning
6. Set Next Action to "Qualify" or "Prepare outreach"

### Qualifying a Prospect
1. Review research
2. Confirm A/B/C priority
3. Identify outreach angle
4. Set status to "QUALIFIED"
5. Set Next Action to "Draft outreach"

### Sending Outreach
1. Draft personalized message
2. Get human approval
3. Send message
4. Set status to "CONTACTED"
5. Set Last Contact Date
6. Set Next Follow-up Date (3-5 days later)
7. Set Next Action to "Wait for response"

### Following Up
1. Check follow-up date
2. Draft follow-up with new value
3. Get human approval
4. Send follow-up
5. Update status to "FOLLOW-UP 1" / "FOLLOW-UP 2"
6. Increment Follow-up Count
7. Set new Next Follow-up Date
8. Update Next Action

### Processing a Reply
1. Log reply content
2. Classify reply type
3. Set status to "REPLIED"
4. Determine next action based on classification
5. Draft response for approval
6. Update Next Action with recommendation

### Closing (Won/Lost/Nurture)
1. Document outcome
2. If Lost: document reason
3. If Nurture: set reminder date (30-60 days)
4. Update status accordingly
5. Update Next Action

---

## Daily CRM Tasks

### Morning Check
1. Review follow-ups due today
2. Check for any new replies
3. Identify prospects needing status updates

### End of Day
1. Update all statuses
2. Record all actions taken
3. Set next follow-up dates
4. Update next actions
5. Generate daily summary

---

## Pipeline Health Metrics

Track these weekly:
- Total prospects in pipeline
- Prospects by stage
- Conversion rate by stage
- Average time in each stage
- Follow-up completion rate
- Reply rate
- Meeting booking rate
- Win rate
- Pipeline velocity (time from NEW to WON)
