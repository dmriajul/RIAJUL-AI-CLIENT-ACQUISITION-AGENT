# Reply Intelligence Module — Expanded

> Phase 4 — Integrated Module
> Date: 2026-09-17
> Replaces: workflows/03-reply-intelligence.md (previous version)
> Integration: Works with Follow-Up Intelligence (workflows/06-follow-up-intelligence.md) and CRM (workflows/04-crm-management.md)

---

## Purpose

Analyze incoming prospect responses and determine:
- What they mean (intent)
- How they feel (sentiment)
- What they need (request)
- What to do next (action)

---

## Reply Analysis Framework

When a prospect responds, analyze these dimensions:

### 1. Intent Classification

Classify into one of these categories:

| Category | Signal | Meaning |
|----------|--------|---------|
| **INTERESTED** | Positive, wants to explore | Open to working together |
| **QUALIFIED** | Confirms fit, ready to proceed | Meets criteria, wants to move forward |
| **MEETING_REQUEST** | Wants to schedule call/meeting | High intent, ready for conversation |
| **PRICING** | Asks about cost | Evaluating budget fit |
| **QUESTION** | Asks about service/process | Needs clarification |
| **OBJECTION** | Raises concern/pushback | Has reservations to address |
| **NOT_NOW** | Interested but wrong timing | Right fit, wrong time |
| **NOT_INTERESTED** | Clear decline | Not a fit for them |
| **WRONG_PERSON** | Not the decision-maker | Need to find right contact |
| **REFERRAL** | Points to another person | Provides new contact |
| **ALREADY_HAVE_PROVIDER** | Has existing solution | May need differentiation |
| **NEEDS_MORE_INFORMATION** | Wants details/portfolio/case studies | Needs proof before deciding |
| **UNCLEAR** | Cannot determine intent | Ambiguous, needs clarification |

### 2. Sentiment Analysis

| Sentiment | Indicators |
|-----------|-----------|
| **Positive** | Enthusiastic language, questions about next steps, compliments |
| **Neutral** | Factual questions, information requests, no emotional language |
| **Negative** | Rejection language, frustration, dismissive tone |
| **Mixed** | Some interest but also concerns or conditions |

### 3. Interest Level

| Level | Indicators |
|-------|-----------|
| **High** | Asks for meeting, requests proposal, specific questions about implementation |
| **Medium** | Asks for portfolio/pricing, general interest expressed |
| **Low** | Vague responses, "maybe later", minimal engagement |
| **None** | Explicit decline, "not interested", requests removal |

### 4. Buying Signal Detection

| Signal Type | Examples |
|-------------|----------|
| **Timeline** | "We're looking at Q2", "Need something by March" |
| **Budget** | "Our budget is around $X", "What's your typical engagement cost?" |
| **Authority** | "I'm the one who makes these decisions", "I'll need to check with my partner" |
| **Need** | "We're struggling with X", "Our current provider isn't working" |
| **Urgency** | "We need to move quickly", "Can you start next week?" |

### 5. Objection Identification

| Objection Type | Examples | Handling Approach |
|----------------|----------|-------------------|
| **Price** | "Too expensive", "Out of our budget" | Reframe value, offer scope adjustment |
| **Timing** | "Not right now", "Maybe next quarter" | Respect timing, set follow-up date |
| **Authority** | "I need to check with my team" | Offer to join team call, provide materials |
| **Need** | "We don't need this", "We're handling it in-house" | Ask about current approach, offer comparison |
| **Trust** | "How do I know this will work?", "What if it doesn't?" | Share case studies, offer guarantees (if available) |
| **Existing Provider** | "We already have someone" | Respect arrangement, offer second opinion |

### 6. Decision-Maker Status

| Status | Indicators |
|--------|-----------|
| **Is decision-maker** | "I make these decisions", speaks with authority, asks about commitment |
| **Influencer** | "I'll need to recommend this to [name]", "I'm researching options" |
| **Gatekeeper** | "I'll pass this along", "Send me information and I'll forward it" |
| **Unknown** | Cannot determine from response |

### 7. Requested Information

| Request Type | Action |
|--------------|--------|
| **Portfolio/examples** | Share relevant case studies (matched to their industry) |
| **Pricing** | Provide approved pricing range, suggest call for details |
| **Process/methodology** | Explain approach, offer call for detailed walkthrough |
| **Timeline** | Provide typical engagement timeline |
| **References** | Share testimonials (with permission), offer client introduction |
| **Proposal** | Gather requirements, draft proposal for approval |

### 8. Urgency Assessment

| Urgency | Indicators | Response Time |
|---------|-----------|---------------|
| **High** | "ASAP", "Need this week", specific deadline mentioned | Respond within 12 hours |
| **Medium** | "Soon", "This month", general interest | Respond within 24 hours |
| **Low** | "When you have time", "No rush", exploratory | Respond within 48 hours |
| **None** | Declined, not interested | Respond within 48 hours (acknowledgment only) |

---

## Classification Rules

### INTERESTED
**Triggers:**
- "This sounds interesting"
- "I'd like to learn more"
- "Can you tell me more about..."
- "We might be a good fit"
- "This aligns with what we're looking for"

**Action:** 
- Move to REPLIED status
- Draft response: acknowledge interest, ask about specific needs, suggest call
- Set follow-up: 3 days if no response

---

### QUALIFIED
**Triggers:**
- "Yes, this is exactly what we need"
- "We're ready to move forward"
- "This fits our budget and timeline"
- "Let's discuss next steps"

**Action:**
- Move to REPLIED status
- Draft response: confirm fit, suggest call to discuss scope
- Set follow-up: 2 days if no response

---

### MEETING_REQUEST
**Triggers:**
- "Can we schedule a call?"
- "When are you available?"
- "Let's set up a meeting"
- "I'd like to discuss this further"

**Action:**
- Move to MEETING_REQUEST status
- Draft response: offer 2-3 time slots in their timezone, share Calendly
- Prepare meeting notes (research summary, talking points)
- Set follow-up: 1 day before meeting (reminder)

---

### PRICING
**Triggers:**
- "How much do you charge?"
- "What's your pricing?"
- "What's your typical engagement cost?"
- "Do you have pricing packages?"

**Action:**
- Move to REPLIED status
- Draft response using `08_RULES/Pricing-Guidance.md`
- Provide range for relevant service
- Suggest call for detailed quote
- Set follow-up: 3 days if no response

---

### QUESTION
**Triggers:**
- "What exactly do you do?"
- "How does your process work?"
- "What platforms do you specialize in?"
- "Can you explain [specific service]?"

**Action:**
- Move to REPLIED status
- Draft response: clear, concise answer to specific question
- Reference relevant portfolio if helpful
- Offer call for detailed explanation
- Set follow-up: 3 days if no response

---

### OBJECTION
**Triggers:**
- "We're not sure this is right for us"
- "I'm concerned about [specific issue]"
- "We tried something similar before and it didn't work"
- "What if this doesn't work for our industry?"

**Action:**
- Move to REPLIED status
- Draft response: acknowledge concern, address with evidence
- Share relevant case study if available
- Offer call to discuss concerns
- Set follow-up: 5 days if no response

---

### NOT_NOW
**Triggers:**
- "Not right now, but maybe in [timeframe]"
- "We're focused on other priorities right now"
- "Check back with us in [quarter/month]"
- "Interesting, but the timing isn't right"

**Action:**
- Move to NURTURE status
- Record their suggested timeframe
- Draft response: acknowledge, confirm re-engagement date
- Set re-engagement date: their timeframe + 3 days
- **STOP** — do not follow up until that date

---

### NOT_INTERESTED
**Triggers:**
- "This isn't for us"
- "We're not interested"
- "No thanks"
- "Please remove us from your list"

**Action:**
- Move to LOST status
- Draft response: thank them, leave door open
- **STOP** — do not follow up again
- Exception: If they said "not now" with timeframe → NOT_NOW instead

---

### WRONG_PERSON
**Triggers:**
- "I'm not the right person for this"
- "You should talk to [name]"
- "This isn't my area"
- "I don't make these decisions"

**Action:**
- Move to REPLIED status
- Draft response: thank them, ask for introduction to correct person
- If they provide name: add new prospect, research, draft outreach
- Set follow-up: 3 days if no introduction provided

---

### REFERRAL
**Triggers:**
- "You should talk to [name], they handle [area]"
- "Let me connect you with [name]"
- "[Name] would be the right person for this"

**Action:**
- Move to REPLIED status
- Draft response: thank them, ask for introduction
- Add new prospect (referred person) to CRM
- Research new prospect
- Draft outreach referencing referral
- Set follow-up: 3 days if no introduction

---

### ALREADY_HAVE_PROVIDER
**Triggers:**
- "We already have someone handling this"
- "We're working with an agency"
- "We have an in-house team"
- "We're covered on this"

**Action:**
- Move to REPLIED status
- Draft response: respect their arrangement, offer second opinion/audit
- Do NOT attack their current provider
- Set follow-up: 30 days (nurture)
- If no response → move to NURTURE (90-day re-engagement)

---

### NEEDS_MORE_INFORMATION
**Triggers:**
- "Can you send me more details?"
- "Do you have a portfolio?"
- "Can you share case studies?"
- "I need more information before deciding"

**Action:**
- Move to REPLIED status
- Draft response: share relevant portfolio/case studies
- Match to their industry/service need
- Suggest call for detailed walkthrough
- Set follow-up: 3 days if no response

---

### UNCLEAR
**Triggers:**
- Vague responses
- Short/ambiguous replies
- "OK" / "Thanks" / "Noted"
- Cannot determine intent

**Action:**
- Move to REPLIED status
- **DO NOT force into another category**
- Draft response: ask clarifying question
- Set follow-up: 5 days if no clarification

---

## Response Generation Rules

### Every response MUST:
1. ✅ Use only verified profile information
2. ✅ Reference only verified services
3. ✅ Use only verified portfolio proof
4. ✅ Follow approved pricing guidance
5. ✅ Match approved brand voice
6. ✅ Consider conversation context
7. ✅ Be reviewed by Riajul before sending

### Every response MUST NOT:
1. ❌ Invent results or metrics
2. ❌ Create fake case studies
3. ❌ Claim client relationships that don't exist
4. ❌ Make up pricing
5. ❏ Promise availability without checking
6. ❌ Make guarantees
7. ❌ Make claims about the prospect's business
8. ❌ Assume information not in evidence

---

## Multi-Reply Tracking

When a prospect sends multiple replies:

1. **Track conversation thread** — maintain full context
2. **Note progression** — e.g., QUESTION → INTERESTED → MEETING_REQUEST
3. **Update classification** — use most recent intent
4. **Adjust priority** — increase if engagement deepens
5. **Log all interactions** — maintain complete history in CRM

---

## Edge Case Handling

### Prospect replies after 2+ weeks of silence
- **DO NOT** reference the silence or guilt them
- Treat as fresh conversation
- Respond quickly (within 12 hours)
- Classify normally based on content

### Prospect changes requirements mid-conversation
- Update CRM notes with new requirements
- Reassess service match
- Adjust proposal if already sent
- Get human approval for significant changes

### Prospect asks for something outside scope
- Acknowledge request
- Clarify what you CAN do
- Suggest alternatives if available
- Get human approval before committing

### Prospect becomes unresponsive after showing interest
- Treat as NOT_NOW (not NOT_INTERESTED)
- Move to NURTURE status
- Set re-engagement date: 30 days
- Use different angle on re-engagement

### Prospect refers someone but doesn't introduce
- Thank them
- Ask for introduction
- If no introduction after 5 days, try reaching out directly (mentioning referral)
- Get human approval

### Prospect asks for something you can't provide
- Be honest about limitations
- Offer alternatives if possible
- Suggest other resources if appropriate
- Do NOT overpromise
