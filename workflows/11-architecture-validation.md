# Architecture Validation Tests

> Phase 6 — Integration & Operational Architecture
> Date: 2026-09-17
> Purpose: Simulate 12 prospect states through complete pipeline
> Status: DEFINED (not yet executed — requires persistent CRM)

---

## Purpose

These tests validate that the complete Client Acquisition System can handle 12 different prospect scenarios correctly. Each test simulates a different real-world scenario.

**Important:** These tests define what should happen. Actual execution requires persistent CRM (Phase 6C) to be implemented first.

---

## Test Structure

Each test includes:
1. **Initial State** — What the prospect looks like when entering the system
2. **Expected Flow** — What should happen at each stage
3. **Validation Points** — What data should exist at each step
4. **Success Criteria** — How we know the test passed

---

## Test 1: New Prospect → Full Pipeline (Happy Path)

### Initial State

```
Company: Aesthetica Cosmetic Clinic
Contact: Dr. David Ong (Medical Director)
Service: Local SEO & ORM
Priority: A
ICP Segment: Tertiary (Australia, not UAE)
```

### Expected Flow

```
1. NEW → Add to CRM with full research
2. RESEARCHED → Verify all required fields populated
3. QUALIFIED → Assign A/B/C priority with reasoning
4. OUTREACH_READY → Draft personalized outreach (Level 3)
5. CONTACTED → Human approves, message sent
6. REPLIED → Receive positive reply
7. INTERESTED → Analyze reply, recommend response
8. MEETING → Schedule discovery call
9. PROPOSAL → Draft and send proposal
10. WON → Deal closed, move to client
```

### Validation Points

**After NEW:**
- ✅ Company record created (Company ID generated)
- ✅ Contact record created (Contact ID generated)
- ✅ Prospect record created (Prospect ID generated)
- ✅ All required fields populated
- ✅ Audit log entry created

**After RESEARCHED:**
- ✅ Research Evidence field populated
- ✅ Portfolio Proof field populated
- ✅ Opportunity field populated
- ✅ Updated Date set

**After QUALIFIED:**
- ✅ Priority assigned (A)
- ✅ Priority Reason populated
- ✅ Pipeline Stage = QUALIFIED
- ✅ Audit log shows stage change

**After OUTREACH_READY:**
- ✅ Conversation record created
- ✅ Message Content populated
- ✅ Human Approved = FALSE (not yet approved)
- ✅ Status = Draft

**After CONTACTED:**
- ✅ Human Approved = TRUE
- ✅ Status = Sent
- ✅ Sent Date populated
- ✅ Audit log shows approval

**After REPLIED:**
- ✅ New Conversation record (Inbound)
- ✅ Reply Analysis record created
- ✅ Classification = INTERESTED
- ✅ Recommended Action populated
- ✅ Prospect stage updated

**After INTERESTED:**
- ✅ Response draft created
- ✅ Prospect stage = INTERESTED
- ✅ Human approved response

**After MEETING:**
- ✅ Meeting record created
- ✅ Meeting Date, Time, Duration populated
- ✅ Prospect stage = MEETING
- ✅ Status = Scheduled

**After PROPOSAL:**
- ✅ Proposal record created
- ✅ Proposal Content populated
- ✅ Service and Price populated
- ✅ Prospect stage = PROPOSAL
- ✅ Status = Sent

**After WON:**
- ✅ Proposal status = Accepted
- ✅ Prospect stage = WON
- ✅ Updated Date set
- ✅ Audit log shows final stage

### Success Criteria

```
✅ 10 pipeline stages completed
✅ All records created correctly
✅ All relationships maintained (Company → Contact → Prospect)
✅ All audit log entries created
✅ No data conflicts
✅ Timeline: ~30 days from NEW to WON
```

---

## Test 2: Qualified Prospect → No Response

### Initial State

```
Company: Beefcake Swimwear
Contact: Mel Brittner Wells (Founder)
Service: Meta Ads Management
Priority: A
ICP Segment: Secondary (USA, female-founded)
```

### Expected Flow

```
1. NEW → Add to CRM
2. QUALIFIED → Assign A priority
3. OUTREACH_READY → Draft outreach
4. CONTACTED → Send outreach
5. NO_RESPONSE → Wait 7 days
6. FOLLOW_UP_1 → Send first follow-up
7. NO_RESPONSE → Wait 14 days
8. FOLLOW_UP_2 → Send second follow-up
9. NO_RESPONSE → Wait 21 days
10. FOLLOW_UP_3 → Send third follow-up
11. NO_RESPONSE → Wait 28 days
12. NURTURE → Move to nurture sequence
```

### Validation Points

**After CONTACTED:**
- ✅ Outreach sent
- ✅ Follow-up scheduled (7 days out)

**After FOLLOW_UP_1:**
- ✅ Follow-up record created
- ✅ Follow-up Number = 1
- ✅ Status = Sent
- ✅ Next follow-up scheduled (14 days out)

**After FOLLOW_UP_2:**
- ✅ Follow-up Number = 2
- ✅ Value Angle changed (different from first)
- ✅ Next follow-up scheduled (21 days out)

**After FOLLOW_UP_3:**
- ✅ Follow-up Number = 3 (final)
- ✅ Next follow-up scheduled (28 days out)

**After NURTURE:**
- ✅ No more follow-ups scheduled
- ✅ Pipeline Stage = NURTURE
- ✅ Stage Modifier = NURTURE
- ✅ Status remains Active (not DO_NOT_CONTACT)

### Success Criteria

```
✅ 3 follow-ups sent (max limit reached)
✅ No more follow-ups scheduled after 3rd
✅ Prospect moved to NURTURE correctly
✅ DO_NOT_CONTACT NOT set (prospect is still active)
✅ Follow-up rules respected
✅ Timeline: ~28 days from CONTACTED to NURTURE
```

---

## Test 3: Positive Reply → Meeting → Proposal

### Initial State

```
Company: City Aesthetic Australia
Contact: Clinic Manager
Service: Meta Ads Management
Priority: A
ICP Segment: Tertiary (Australia)
```

### Expected Flow

```
1. CONTACTED → Initial outreach sent
2. REPLIED → Receive reply: "Yes, we're looking for help with ads"
3. INTERESTED → Classify as INTERESTED
4. QUALIFIED → Update to QUALIFIED
5. MEETING_REQUEST → Prospect asks for call
6. MEETING → Schedule discovery call
7. PROPOSAL → Draft and send proposal
8. NEGOTIATION → Prospect negotiates price
9. WON → Deal closed
```

### Validation Points

**After REPLIED:**
- ✅ Reply Analysis created
- ✅ Classification = INTERESTED
- ✅ Sentiment = Positive
- ✅ Interest Level = High
- ✅ Recommended Action = "Schedule discovery call"

**After QUALIFIED:**
- ✅ Pipeline Stage updated to QUALIFIED
- ✅ Interest Level reflected in priority

**After MEETING_REQUEST:**
- ✅ New classification = MEETING_REQUEST
- ✅ Meeting record created
- ✅ Prospect stage = MEETING

**After MEETING:**
- ✅ Meeting Status = Completed
- ✅ Outcome = Positive
- ✅ Next Action = "Send proposal"

**After PROPOSAL:**
- ✅ Proposal record created
- ✅ Price = $500 (Meta Ads)
- ✅ Status = Sent

**After NEGOTIATION:**
- ✅ Prospect stage = NEGOTIATION
- ✅ Price negotiation tracked

**After WON:**
- ✅ Proposal Status = Accepted
- ✅ Final Price recorded
- ✅ Prospect stage = WON

### Success Criteria

```
✅ Positive reply correctly classified
✅ Meeting scheduled and completed
✅ Proposal sent with correct pricing
✅ Negotiation handled correctly
✅ Deal closed successfully
✅ All data persisted correctly
```

---

## Test 4: Pricing Inquiry

### Initial State

```
Company: Prospect with pricing question
Service: SEO Services
Priority: B
```

### Expected Flow

```
1. CONTACTED → Initial outreach sent
2. REPLIED → Receive reply: "How much does SEO cost?"
3. PRICING → Classify as PRICING
4. RESPOND → Send pricing guidance
5. INTERESTED → Prospect confirms interest
6. MEETING → Schedule call to discuss
7. PROPOSAL → Send customized proposal
8. WON → Deal closed
```

### Validation Points

**After REPLIED:**
- ✅ Classification = PRICING
- ✅ Buying Signal = "Asked about pricing"
- ✅ Recommended Action = "Share pricing guidance per 07_OUTREACH/pricing-guidance.md"

**After RESPOND:**
- ✅ Response includes pricing guidance
- ✅ Response references pricing-guidance.md
- ✅ Response includes relevant case study

**After INTERESTED:**
- ✅ Classification updated to INTERESTED
- ✅ Prospect stage updated

### Success Criteria

```
✅ Pricing inquiry correctly classified
✅ Response follows pricing guidance
✅ No unauthorized commitments made
✅ Human approved pricing response
✅ Deal progresses correctly
```

---

## Test 5: Meeting Request (Direct)

### Initial State

```
Company: High-priority prospect
Service: Local SEO
Priority: A
```

### Expected Flow

```
1. CONTACTED → Initial outreach sent
2. REPLIED → Receive reply: "Can we schedule a call?"
3. MEETING_REQUEST → Classify as MEETING_REQUEST
4. MEETING → Schedule call
5. PROPOSAL → Send proposal after call
6. WON → Deal closed
```

### Validation Points

**After REPLIED:**
- ✅ Classification = MEETING_REQUEST
- ✅ Urgency = High
- ✅ Recommended Action = "Schedule call ASAP"

**After MEETING:**
- ✅ Meeting record created
- ✅ Meeting Date, Time, Duration populated
- ✅ Timezone correct

### Success Criteria

```
✅ Meeting request correctly classified
✅ Meeting scheduled correctly
✅ All meeting details populated
✅ Proposal sent after meeting
✅ Timeline: ~7 days from reply to proposal
```

---

## Test 6: Referral

### Initial State

```
Company: Referred prospect
Referred By: Existing client
Service: SMM Services
Priority: A (referral bonus)
```

### Expected Flow

```
1. NEW → Add to CRM with Referred By field
2. QUALIFIED → Priority = A (referral)
3. OUTREACH_READY → Draft outreach mentioning referral
4. CONTACTED → Send outreach
5. REPLIED → Positive reply
6. INTERESTED → Fast-track to meeting
7. MEETING → Schedule call
8. PROPOSAL → Send proposal
9. WON → Close deal
```

### Validation Points

**After NEW:**
- ✅ Referred By field populated
- ✅ Notes mention referral source

**After QUALIFIED:**
- ✅ Priority = A (referral bonus)
- ✅ Priority Reason mentions referral

**After OUTREACH_READY:**
- ✅ Outreach mentions referral
- ✅ Personalization Level 3

### Success Criteria

```
✅ Referral correctly captured
✅ Priority upgraded (A)
✅ Outreach mentions referral
✅ Fast-tracked through pipeline
✅ Referral source credited
```

---

## Test 7: Not Interested

### Initial State

```
Company: Prospect who declines
Service: Google Ads
Priority: C
```

### Expected Flow

```
1. CONTACTED → Initial outreach sent
2. REPLIED → Receive reply: "Not interested right now"
3. NOT_INTERESTED → Classify as NOT_INTERESTED
4. RESPOND → Send polite acknowledgment
5. NURTURE → Move to nurture (not DO_NOT_CONTACT)
```

### Validation Points

**After REPLIED:**
- ✅ Classification = NOT_INTERESTED
- ✅ Sentiment = Negative
- ✅ Interest Level = None
- ✅ Recommended Action = "Acknowledge, move to nurture"

**After RESPOND:**
- ✅ Response is polite and professional
- ✅ Leaves door open for future
- ✅ Does NOT push or pressure

**After NURTURE:**
- ✅ Pipeline Stage = NURTURE
- ✅ Status = Active (NOT DO_NOT_CONTACT)
- ✅ No more outreach scheduled

### Success Criteria

```
✅ NOT_INTERESTED correctly classified
✅ Response is respectful
✅ Prospect NOT marked DO_NOT_CONTACT
✅ Prospect moved to nurture correctly
✅ No follow-ups scheduled
```

---

## Test 8: DO_NOT_CONTACT

### Initial State

```
Company: Prospect who requests no contact
Service: Any
Priority: N/A
```

### Expected Flow

```
1. CONTACTED → Initial outreach sent
2. REPLIED → Receive reply: "Please remove me from your list"
3. DO_NOT_CONTACT → Classify as DO_NOT_CONTACT
4. UPDATE → Set DO_NOT_CONTACT flag
5. RESPOND → Send brief acknowledgment
6. LOCK → No more outreach ever
```

### Validation Points

**After REPLIED:**
- ✅ Classification = DO_NOT_CONTACT (or NOT_INTERESTED with explicit request)
- ✅ Urgency = High

**After UPDATE:**
- ✅ Contact Status = DO_NOT_CONTACT
- ✅ Audit log shows status change
- ✅ Reason recorded

**After RESPOND:**
- ✅ Response is brief and respectful
- ✅ Confirms removal from list

**After LOCK:**
- ✅ No follow-ups scheduled
- ✅ System prevents any future outreach
- ✅ Attempting to contact triggers error

### Success Criteria

```
✅ DO_NOT_CONTACT correctly set
✅ All future outreach blocked
✅ Compliance maintained
✅ Brief acknowledgment sent
✅ Audit trail complete
```

**Critical:** This test MUST pass. DO_NOT_CONTACT violations are compliance failures.

---

## Test 9: Duplicate Company

### Initial State

```
Company: Aesthetica Cosmetic Clinic (already in CRM)
Contact: Dr. David Ong (already in CRM)
Service: Meta Ads (different service)
```

### Expected Flow

```
1. NEW → Attempt to add duplicate company
2. DUPLICATE_DETECTED → System detects duplicate
3. ADD_CONTACT → Add new contact to existing company
4. ADD_PROSPECT → Add new prospect (different service)
5. CONTINUE → Continue pipeline for new prospect
```

### Validation Points

**After DUPLICATE_DETECTED:**
- ✅ System detects duplicate Company Name
- ✅ Alert: "Company already exists"
- ✅ Option to add new contact to existing company

**After ADD_CONTACT:**
- ✅ New Contact record created
- ✅ Linked to existing Company
- ✅ Company ID same as original

**After ADD_PROSPECT:**
- ✅ New Prospect record created
- ✅ Linked to existing Company
- ✅ Service = Meta Ads (different from original)
- ✅ No duplicate company created

### Success Criteria

```
✅ Duplicate detected correctly
✅ No duplicate company created
✅ New contact added to existing company
✅ New prospect created for different service
✅ Company has multiple contacts
✅ Company has multiple prospects
```

---

## Test 10: Multiple Contacts per Company

### Initial State

```
Company: Large clinic with multiple decision-makers
Contact 1: Dr. David Ong (Medical Director)
Contact 2: Jane Smith (Marketing Manager)
Contact 3: John Doe (Office Manager)
Service: Local SEO
```

### Expected Flow

```
1. NEW → Add company
2. ADD_CONTACT_1 → Add Dr. David Ong
3. ADD_CONTACT_2 → Add Jane Smith
4. ADD_CONTACT_3 → Add John Doe
5. QUALIFY → Qualify each contact separately
6. OUTREACH → Send outreach to decision-maker (Dr. Ong)
7. REPLIED → Jane Smith replies
8. UPDATE → Update CRM with reply
9. COORDINATE → Handle multiple contacts
```

### Validation Points

**After ADD_CONTACT_1:**
- ✅ Contact 1 created
- ✅ Decision Maker Status = Decision-maker

**After ADD_CONTACT_2:**
- ✅ Contact 2 created
- ✅ Decision Maker Status = Influencer
- ✅ Linked to same Company

**After ADD_CONTACT_3:**
- ✅ Contact 3 created
- ✅ Decision Maker Status = Gatekeeper
- ✅ Linked to same Company

**After OUTREACH:**
- ✅ Outreach sent to decision-maker (Dr. Ong)
- ✅ Prospect record for Dr. Ong

**After REPLIED:**
- ✅ Reply from Jane Smith captured
- ✅ Conversation linked to Jane Smith's contact
- ✅ Prospect updated

**After COORDINATE:**
- ✅ System tracks multiple contacts
- ✅ Knows who replied
- ✅ Knows who is decision-maker
- ✅ Can coordinate outreach

### Success Criteria

```
✅ Company has 3 contacts
✅ Each contact has separate record
✅ Decision-maker identified
✅ Influencer identified
✅ Gatekeeper identified
✅ Outreach sent to correct person
✅ Reply from different person tracked
✅ Multiple contacts handled correctly
```

---

## Test 11: Already Has Provider

### Initial State

```
Company: Clothing Connection (has agency)
Service: Meta Ads
Priority: Disqualified
```

### Expected Flow

```
1. RESEARCH → Discover they have agency
2. QUALIFIED → Mark as DISQUALIFIED
3. REASON → Record reason: "Already has provider"
4. RESPOND → Send polite acknowledgment
5. CLOSE → Close prospect
```

### Validation Points

**After RESEARCH:**
- ✅ Research Evidence mentions existing agency
- ✅ Portfolio Proof shows Inflow case study (their agency)

**After QUALIFIED:**
- ✅ Pipeline Stage = DISQUALIFIED
- ✅ Reason = "Already has provider (Inflow)"
- ✅ Status = Inactive

**After RESPOND:**
- ✅ Response is polite
- ✅ Leaves door open for future

### Success Criteria

```
✅ Existing provider detected during research
✅ Prospect correctly disqualified
✅ Reason documented
✅ Polite response sent
✅ No wasted effort on unqualified prospect
```

---

## Test 12: Re-engagement After Long Silence

### Initial State

```
Company: Old prospect from 3 months ago
Status: NURTURE (no activity for 90 days)
Service: SEO
Priority: B
```

### Expected Flow

```
1. DETECT → System detects 90-day silence
2. SCHEDULE → Schedule re-engagement campaign
3. DRAFT → Draft re-engagement message
4. APPROVE → Human approves
5. SEND → Send re-engagement
6. REPLIED → Prospect replies
7. CONTINUE → Resume pipeline
```

### Validation Points

**After DETECT:**
- ✅ System identifies stale prospect
- ✅ Updated Date > 90 days ago
- ✅ Status = Active (not DO_NOT_CONTACT)

**After SCHEDULE:**
- ✅ Re-engagement campaign scheduled
- ✅ Follow-up Type = Re-engagement

**After DRAFT:**
- ✅ Re-engagement message drafted
- ✅ References previous conversation
- ✅ Provides new value angle

**After SEND:**
- ✅ Message sent
- ✅ Conversation logged

**After REPLIED:**
- ✅ Reply captured
- ✅ Pipeline Stage updated
- ✅ Resume from where left off

### Success Criteria

```
✅ Stale prospect detected correctly
✅ Re-engagement campaign triggered
✅ Message references previous conversation
✅ Provides new value (not same message)
✅ Pipeline resumes correctly
✅ No duplicate outreach
```

---

## Test Execution Plan

### Phase 1: Manual Simulation (Current)

**What:** Simulate tests manually using file-based CRM
**When:** Now (before persistent CRM)
**How:** 
1. Create test data in files
2. Manually walk through each test
3. Verify expected behavior
4. Document results

**Tests to Run:**
- Test 1: Happy path (new prospect)
- Test 8: DO_NOT_CONTACT (critical)
- Test 9: Duplicate company
- Test 10: Multiple contacts

### Phase 2: Automated Testing (Future)

**What:** Automate tests using persistent CRM
**When:** After Phase 6C (persistent CRM implemented)
**How:**
1. Create test database
2. Run tests programmatically
3. Verify data integrity
4. Generate test report

**Tests to Run:**
- All 12 tests
- Regression tests after changes
- Performance tests (1000+ prospects)

### Phase 3: Integration Testing (Future)

**What:** Test with real integrations (email, calendar, etc.)
**When:** After Phase 6A-D (all integrations implemented)
**How:**
1. Connect real email (test account)
2. Connect real calendar (test account)
3. Run end-to-end tests
4. Verify integration behavior

**Tests to Run:**
- Email sending/receiving
- Calendar scheduling
- Metrics tracking
- Automation rules

---

## Success Criteria Summary

| Test | Critical | Status | Notes |
|------|----------|--------|-------|
| 1. Happy Path | ✅ | DEFINED | Full pipeline validation |
| 2. No Response | ✅ | DEFINED | Follow-up limits |
| 3. Positive Reply | ✅ | DEFINED | Meeting + proposal |
| 4. Pricing Inquiry | ✅ | DEFINED | Pricing guidance |
| 5. Meeting Request | ✅ | DEFINED | Direct meeting |
| 6. Referral | ⚠️ | DEFINED | Referral handling |
| 7. Not Interested | ✅ | DEFINED | Nurture path |
| 8. DO_NOT_CONTACT | 🔴 | DEFINED | Critical compliance |
| 9. Duplicate Company | ✅ | DEFINED | Data integrity |
| 10. Multiple Contacts | ✅ | DEFINED | Relationship handling |
| 11. Already Has Provider | ✅ | DEFINED | Disqualification |
| 12. Re-engagement | ⚠️ | DEFINED | Long-term nurturing |

**Critical Tests:** Must pass before going live
**Important Tests:** Should pass before going live
**Nice-to-Have Tests:** Can defer

---

## Conclusion

These 12 tests validate the complete Client Acquisition System. Key points:

✅ 12 scenarios covering real-world cases
✅ Each test has clear success criteria
✅ Validation points at each stage
✅ Critical tests identified (DO_NOT_CONTACT)
✅ Execution plan (manual → automated → integration)

**Next Step:** Execute Phase 1 manual tests (Test 1, 8, 9, 10) after persistent CRM is implemented.

---

**Document Status:** Complete (definitions only, not yet executed)
**Next Action:** Implement persistent CRM, then execute manual tests
