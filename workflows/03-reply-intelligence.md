# Reply Intelligence Workflow

## Trigger Command
```
Analyze reply from [prospect/company]
```

---

## Reply Classification System

When a prospect responds, classify their reply into one of these categories:

### Classification Categories

| # | Classification | Signal | Meaning |
|---|---|---|---|
| 1 | **Interested** | Positive, wants to learn more | They want to explore working together |
| 2 | **Not Interested** | Clear decline | They're not interested right now |
| 3 | **Maybe Later** | Interested but bad timing | Right fit, wrong time |
| 4 | **Needs Portfolio** | Wants to see work | Interested but needs proof first |
| 5 | **Asks Pricing** | Wants cost information | Evaluating budget fit |
| 6 | **Asks Experience** | Wants credentials | Evaluating capability fit |
| 7 | **Asks Availability** | Checking if you're free | Evaluating timing fit |
| 8 | **Wants Meeting** | Ready to talk | High interest, wants to discuss |
| 9 | **Needs More Info** | Wants details | Interested but needs clarity |
| 10 | **Unknown** | Can't determine | Need to ask clarifying question |

---

## Classification Rules

### How to Classify:

**Interested:**
- "This sounds interesting"
- "I'd love to learn more"
- "Tell me more about your services"
- "We might need help with this"
- "This is exactly what we're looking for"

**Not Interested:**
- "We're not looking for this right now"
- "We already have someone handling this"
- "This isn't a priority for us"
- "Not a fit for us, thanks"
- "Please remove me from your list"

**Maybe Later:**
- "Reach out again in [timeframe]"
- "Not right now but we might need this in Q[X]"
- "We're focused on other things right now"
- "Interesting — let's revisit this in a few months"

**Needs Portfolio:**
- "Can you share some examples of your work?"
- "Do you have case studies?"
- "Would love to see what you've done"
- "Any portfolio you can share?"

**Asks Pricing:**
- "What are your rates?"
- "How much does this typically cost?"
- "What's your pricing structure?"
- "Do you have pricing packages?"

**Asks Experience:**
- "How long have you been doing this?"
- "Have you worked with [industry] before?"
- "What's your experience with [platform]?"
- "Can you tell me about similar clients?"

**Asks Availability:**
- "Are you taking on new clients?"
- "When could you start?"
- "Do you have capacity right now?"
- "What's your timeline?"

**Wants Meeting:**
- "Let's schedule a call"
- "Can we jump on a quick call?"
- "I'd love to discuss this — when are you free?"
- "Let's set up a meeting"

**Needs More Info:**
- "What exactly does this include?"
- "Can you explain your process?"
- "What platforms do you work with?"
- "How does this work exactly?"

**Unknown:**
- Vague responses
- Short/unclear replies
- Responses that don't clearly indicate intent
- Need more context to classify

---

## Recommended Actions by Classification

### Interested
**Status:** CONVERSATION
**Action:** Respond warmly, ask about their specific needs, suggest a call
**Priority:** HIGH — Respond within 24 hours

**Draft Response:**
```
Hi [Name],

Great to hear! I'd love to learn more about what you're working on at [Company].

Would it make sense to have a quick 15-minute call this week? Happy to share some ideas based on what I've seen, and learn more about your goals.

[Optional: suggest 2-3 specific times]

Riajul
```

---

### Not Interested
**Status:** LOST
**Action:** Thank them gracefully, leave door open
**Priority:** LOW — Respond within 48 hours

**Draft Response:**
```
Hi [Name],

Totally understand — thanks for being upfront!

If things change down the line, feel free to reach out. Wishing [Company] continued growth.

Best,
Riajul
```

---

### Maybe Later
**Status:** NURTURE
**Action:** Acknowledge, set reminder to re-engage at suggested time
**Priority:** MEDIUM — Respond within 48 hours

**Draft Response:**
```
Hi [Name],

Completely understand — timing is everything.

I'll check back in around [their suggested time]. In the meantime, feel free to reach out if anything comes up.

Keep up the great work with [Company]!

Riajul
```

---

### Needs Portfolio
**Status:** CONVERSATION
**Action:** Share relevant portfolio (matched to their industry/service need)
**Priority:** HIGH — Respond within 24 hours

**Draft Response:**
```
Hi [Name],

Happy to share! Here are a few relevant examples:

[Relevant portfolio link 1] — [Brief description of what it shows]
[Relevant portfolio link 2] — [Brief description]

These are from [similar type of brand/project]. Happy to walk through more detail on a quick call if helpful.

Riajul
```

---

### Asks Pricing
**Status:** CONVERSATION
**Action:** Provide range, suggest call for specifics
**Priority:** HIGH — Respond within 24 hours

**Draft Response:**
```
Hi [Name],

Good question — pricing depends on scope and what makes sense for [Company].

For [relevant service], clients typically invest between $[X]–$[Y] per month. But it really depends on [specific factors relevant to their situation].

Happy to discuss what would work best for your situation. Would a quick call make sense?

Riajul
```

---

### Asks Experience
**Status:** CONVERSATION
**Action:** Share relevant case studies and background
**Priority:** MEDIUM — Respond within 24 hours

**Draft Response:**
```
Hi [Name],

Sure — I've been working on [relevant area] for [time period], primarily with [type of clients].

Most recently, I worked with a [similar type of brand] on [relevant project]. [Brief result — if real and specific].

You can also see more on my LinkedIn: [URL]

Happy to dive deeper into anything specific.

Riajul
```

---

### Asks Availability
**Status:** CONVERSATION
**Action:** Confirm availability, suggest call
**Priority:** HIGH — Respond within 24 hours

**Draft Response:**
```
Hi [Name],

Yes, I'm currently taking on new clients! I have capacity to start [timeframe].

Would it make sense to have a quick call to discuss what you're looking for? I'm available [suggest 2-3 times].

Riajul
```

---

### Wants Meeting
**Status:** MEETING
**Action:** Schedule meeting immediately
**Priority:** URGENT — Respond within 12 hours

**Draft Response:**
```
Hi [Name],

Sounds great! Here are a few times that work for me:

- [Day], [Date] at [Time] [Timezone]
- [Day], [Date] at [Time] [Timezone]
- [Day], [Date] at [Time] [Timezone]

Let me know what works best. I'll send a calendar invite.

Looking forward to it!

Riajul
```

---

### Needs More Info
**Status:** CONVERSATION
**Action:** Provide clear, concise information
**Priority:** MEDIUM — Respond within 24 hours

**Draft Response:**
```
Hi [Name],

Happy to explain!

[Brief, clear answer to their specific question]

[Additional relevant context — one or two sentences max]

Want to jump on a quick call to discuss more? Happy to walk through the details.

Riajul
```

---

### Unknown
**Status:** REPLIED
**Action:** Ask a clarifying question
**Priority:** MEDIUM — Respond within 48 hours

**Draft Response:**
```
Hi [Name],

Thanks for your response! Just want to make sure I understand — are you [asking about X / interested in Y / looking for Z]?

Happy to help however makes sense.

Riajul
```

---

## Reply Processing Checklist

When processing any reply:

1. [ ] Read the full reply carefully
2. [ ] Identify the classification
3. [ ] Note any specific questions or requests
4. [ ] Update CRM status
5. [ ] Log reply content
6. [ ] Draft recommended response
7. [ ] Present for human approval
8. [ ] Set next action and date

---

## Multi-Reply Tracking

If a prospect sends multiple replies:
- Track the conversation thread
- Note progression (e.g., from "Needs Portfolio" → "Interested" → "Wants Meeting")
- Update status accordingly
- Adjust priority based on engagement level
