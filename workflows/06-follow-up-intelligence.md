# Follow-Up Intelligence Engine

> Phase 4 — Integrated Module
> Date: 2026-09-17
> Replaces/extends: 07_OUTREACH/Follow-Up-Frameworks.md (timing & logic sections)
> Integration point: Works with Reply Intelligence (workflows/03-reply-intelligence.md) and CRM (workflows/04-crm-management.md)

---

## Purpose

This engine determines the **appropriate next action** after any prospect interaction or period of non-response. It considers:

- Current pipeline stage
- Channel used
- Time since last contact
- Number of previous follow-ups
- Prospect's response status
- Conversation context
- Prospect priority (A/B/C)
- Previous outreach angle
- Any objections raised

---

## Configurable Timing (Not Hard-Coded)

### Default Timing Configuration

These defaults can be adjusted by Riajul per prospect type or campaign.

| Parameter | Default | Configurable Range | Notes |
|-----------|---------|-------------------|-------|
| Follow-up #1 delay | 5 business days | 3–7 business days | After initial outreach |
| Follow-up #2 delay | 5 business days | 4–7 business days | After follow-up #1 |
| Follow-up #3 (breakup) delay | 7 business days | 5–10 business days | After follow-up #2 |
| NURTURE re-engagement | 45 days | 30–90 days | After explicit "not now" |
| Meeting follow-up | 24 hours | 12–48 hours | After meeting/proposal |
| Post-reply pause | 3 business days | 2–5 business days | After any reply (to avoid rushing) |
| Late reply re-engagement | 2 business days | 1–5 business days | When prospect replies after 2+ weeks of silence |

### Timing Adjustment Rules

| Condition | Adjustment |
|-----------|-----------|
| A-priority prospect | Shorten intervals by 1 day |
| C-priority prospect | Lengthen intervals by 2 days |
| Prospect in AU/UAE time zones | Add 1 day (larger time difference) |
| Prospect responded previously (even briefly) | Reset follow-up counter, use conversation-aware timing |
| Prospect explicitly said "not now" + gave timeframe | Use THEIR timeframe + 3 days buffer |
| Holiday season (prospect's country) | Pause all follow-ups |
| Prospect replied after 2+ weeks gap | Treat as warm — shorten response time to 12 hours |

---

## Follow-Up Decision Matrix

### Scenario 1: No Response to Initial Outreach

**Input:** Prospect has not responded to initial email/LinkedIn message.

| Factor | Value | Decision |
|--------|-------|----------|
| Days since last contact | ≥ follow-up #1 delay | Proceed to Follow-up #1 |
| Previous follow-ups | 0 | Send Follow-up #1 |
| Channel used | Email | Follow up on same channel |
| Priority | Any | Proceed |

**Action:**
1. Draft Follow-up #1 using **new value angle** (not "just checking in")
2. Select angle based on what wasn't covered in initial outreach
3. Get human approval
4. Update CRM: status → FOLLOW-UP 1, increment follow-up count, set next date

**Value Angle Selection (rotate through):**
- If initial was observation-based → follow-up with relevant case study
- If initial was case-study-based → follow-up with specific idea/insight
- If initial was service-specific → follow-up with different service angle
- If initial was generic → follow-up with specific observation

---

### Scenario 2: No Response After Follow-Up #1

**Input:** Prospect has not responded to initial + follow-up #1.

**Action:**
1. Draft Follow-up #2 with **different angle** from both previous messages
2. Keep shorter than initial message
3. Get human approval
4. Update CRM: status → FOLLOW-UP 2

---

### Scenario 3: No Response After Follow-Up #2

**Input:** Prospect has not responded after 3 total messages.

**Action:**
1. Draft Follow-up #3 (breakup/graceful exit)
2. Leave door open without pressure
3. Get human approval
4. Update CRM: status → LOST or NURTURE (depending on priority)
   - A-priority → NURTURE (re-engage in 45 days)
   - B-priority → NURTURE (re-engage in 60 days)
   - C-priority → LOST (do not re-engage)

---

### Scenario 4: Prospect Responds "Interested"

**Input:** Prospect expressed interest.

**Action:**
1. Update CRM: status → REPLIED, classification → INTERESTED
2. Draft response: acknowledge interest, ask about specific needs, suggest call
3. Get human approval
4. Set next follow-up: 3 days (if no response to your reply)

---

### Scenario 5: Prospect Says "Not Interested"

**Input:** Prospect explicitly declined.

**Action:**
1. Update CRM: status → LOST, classification → NOT_INTERESTED
2. Draft response: thank them gracefully, leave door open
3. Get human approval
4. **STOP** — do not follow up again unless they re-initiate
5. Exception: If they said "not now" with timeframe → move to NURTURE instead

---

### Scenario 6: Prospect Says "Maybe Later" / "Not Now"

**Input:** Prospect interested but wrong timing.

**Action:**
1. Update CRM: status → NURTURE, classification → NOT_NOW
2. Record their suggested timeframe (if given)
3. Draft response: acknowledge, confirm re-engagement timing
4. Get human approval
5. Set re-engagement date: their timeframe + 3 days buffer
6. **STOP** — do not follow up until re-engagement date

---

### Scenario 7: Prospect Asks Pricing

**Input:** Prospect wants to know cost.

**Action:**
1. Update CRM: status → REPLIED, classification → PRICING
2. Draft response using approved pricing from `08_RULES/Pricing-Guidance.md`
3. Include relevant service range
4. Suggest call for specifics
5. Get human approval
6. Set next follow-up: 3 days (if no response)

---

### Scenario 8: Prospect Says "Already Have an Agency/Provider"

**Input:** Objection — existing provider.

**Action:**
1. Update CRM: status → REPLIED, classification → ALREADY_HAVE_PROVIDER
2. Draft response: respect their arrangement, offer free audit/second opinion
3. Do NOT attack their current provider
4. Get human approval
5. Set next follow-up: 30 days (nurture, low pressure)
6. If they don't respond → move to NURTURE (90-day re-engagement)

---

### Scenario 9: Prospect Asks for Portfolio

**Input:** Prospect wants to see proof.

**Action:**
1. Update CRM: status → REPLIED, classification → NEEDS_PORTFOLIO
2. Select relevant portfolio based on:
   - Their industry
   - The service discussed
   - The specific need expressed
3. Share 1-2 most relevant portfolio links (not all)
4. Suggest call for deeper walkthrough
5. Get human approval
6. Set next follow-up: 3 days

---

### Scenario 10: Prospect Wants Meeting/Call

**Input:** Prospect ready to talk.

**Action:**
1. Update CRM: status → MEETING_REQUEST, classification → MEETING_REQUEST
2. Draft response: offer 2-3 time slots in THEIR timezone
3. Share Calendly link as backup
4. Get human approval
5. Prepare meeting prep notes (research summary, talking points)
6. Set next action: "Prepare for meeting"

---

### Scenario 11: Wrong Person

**Input:** Contact says they're not the right decision-maker.

**Action:**
1. Update CRM: status → REPLIED, classification → WRONG_PERSON
2. Draft response: thank them, ask for referral to correct person
3. If they provide new contact:
   - Add new contact to CRM
   - Start research on new contact
   - Keep original prospect as context
4. Get human approval
5. Set next action: "Research new decision-maker"

---

### Scenario 12: Prospect Refers to Another Decision-Maker

**Input:** Contact provides name of actual decision-maker.

**Action:**
1. Update CRM for current contact: classification → REFERRAL
2. Add new prospect (decision-maker) to CRM
3. Link both records
4. Research new decision-maker
5. Draft introduction referencing the referral
6. Get human approval
7. Set next action: "Research and draft outreach to [new contact]"

---

### Scenario 13: Unclear / Ambiguous Response

**Input:** Cannot confidently classify the response.

**Action:**
1. Update CRM: status → REPLIED, classification → UNCLEAR
2. **DO NOT force into a category**
3. Draft response: ask clarifying question
4. Get human approval
5. Set next follow-up: 5 days (if no clarification)

---

### Scenario 14: Prospect Asks "What Exactly Do You Do?"

**Input:** Prospect doesn't understand service offering.

**Action:**
1. Update CRM: status → REPLIED, classification → QUESTION
2. Draft response: brief overview of relevant services only (not all 7)
3. Match to their industry/context
4. Include 1 relevant portfolio link
5. Suggest call for detailed discussion
6. Get human approval

---

### Scenario 15: Prospect Asks for Proposal

**Input:** Prospect wants formal proposal.

**Action:**
1. Update CRM: status → PROPOSAL_REQUEST, classification → PROPOSAL_REQUEST
2. Gather requirements (ask clarifying questions if needed)
3. Draft proposal outline for Riajul's review
4. Get human approval before sending
5. Set next follow-up: 3 days after proposal sent

---

### Scenario 16: Prospect Replies After Extended Silence (2+ weeks)

**Input:** Prospect was unresponsive for weeks, then suddenly replies.

**Action:**
1. Update CRM: status → REPLIED
2. **DO NOT reference the silence or guilt them**
3. Treat as fresh conversation
4. Respond within 12 hours (treat as warm lead)
5. Classify the reply normally (interested/pricing/etc.)
6. Get human approval

---

### Scenario 17: Prospect Asks Not to Be Contacted

**Input:** Explicit opt-out request.

**Action:**
1. Update CRM: status → LOST, add "DO_NOT_CONTACT" flag
2. Draft brief acknowledgment: confirm removal, wish them well
3. Get human approval
4. **STOP ALL CONTACT** — permanently
5. Remove from all future follow-up schedules
6. Exception: Never re-engage unless THEY initiate

---

### Scenario 18: Multiple People from Same Company

**Input:** Different contacts from same company enter the pipeline.

**Action:**
1. Check CRM for existing company records
2. Link both contacts to same company record
3. Do NOT send outreach to second person if first is already being contacted
4. If first contact went cold, consider second contact as fresh angle
5. Note in CRM: "Also contacted: [other contact name]"
6. Get human approval before any new outreach to same company

---

### Scenario 19: Duplicate Prospect

**Input:** Same prospect already exists in CRM.

**Action:**
1. Do NOT create duplicate record
2. Update existing record with new information
3. Note the new research/outreach in existing record
4. Continue with existing pipeline stage

---

### Scenario 20: Same Company, Different Channel

**Input:** Contacted via email, now considering LinkedIn (or vice versa).

**Action:**
1. Wait minimum 5 business days between channels
2. Adjust message for channel (LinkedIn shorter, email more detailed)
3. Do NOT reference the other channel ("I sent you an email...")
4. Treat as new touchpoint but same pipeline record
5. Count toward total touchpoint limit (max 6 total across all channels)

---

## Follow-Up Quality Rules

### Every follow-up MUST:
1. ✅ Bring new value (not "just checking in")
2. ✅ Be shorter than or equal in length to the previous message
3. ✅ Respect the configured timing (no early follow-ups)
4. ✅ Use a different angle from previous messages
5. ✅ Maintain the same tone/brand voice
6. ✅ Be reviewed and approved by Riajul before sending

### Every follow-up MUST NOT:
1. ❌ Become spammy or repetitive
2. ❌ Use fake urgency
3. ❌ Guilt the prospect for not responding
4. ❌ Repeat the same message
5. ❌ Ignore previous objections
6. ❌ Continue after prospect clearly declines
7. ❌ Continue after prospect requests no contact
8. ❌ Exceed maximum touchpoints (4 email + 3 LinkedIn = 7 total max)
9. ❌ Send without human approval
10. ❌ Reference the other channel inappropriately

---

## Maximum Touchpoint Rules

| Channel | Maximum Messages | Includes |
|---------|-----------------|----------|
| Email | 4 | Initial + 3 follow-ups |
| LinkedIn | 3 | Connection + 2 DMs |
| Combined | 7 | Total across all channels |
| NURTURE | 1 per cycle | After 30+ day gap |

### When to Stop
- After maximum touchpoints reached → move to NURTURE or LOST
- After prospect says "no" → STOP immediately
- After prospect requests no contact → STOP permanently
- After 90+ days in NURTURE with no response → move to LOST

---

## Channel Switching Rules

| Condition | Action |
|-----------|--------|
| No response to 2 emails | May try LinkedIn (after 5-day gap) |
| No response to LinkedIn DM | May try email (after 5-day gap) |
| Prospect active on one channel | Focus on that channel |
| Prospect responded on one channel | Continue on that channel |
| All channels exhausted | Move to NURTURE or LOST |

---

## Follow-Up Angle Library

### For No-Response Follow-Ups (rotate through):

**Angle 1 — New Observation**
"I noticed [something new about their business since last message]..."

**Angle 2 — Industry Insight**
"Been seeing a trend in [their industry] where [observation]..."

**Angle 3 — Specific Idea**
"Had a quick idea for [specific thing based on research]..."

**Angle 4 — Different Service Angle**
"Also wanted to mention [different service] might be relevant because..."

**Angle 5 — Case Study**
"Recently helped [similar brand] with [relevant result]..."

**Angle 6 — Resource/Value**
"Came across this [article/tool/insight] that made me think of [Company]..."

**Angle 7 — Seasonal/Timely**
"With [upcoming season/event], wanted to share [relevant thought]..."

### Rules for Angle Selection:
- Never use the same angle twice for the same prospect
- Match angle to prospect's industry and situation
- Prefer angles backed by evidence over generic insights
- When in doubt, use a specific observation from research
