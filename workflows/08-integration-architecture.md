# Integration Architecture — Phase 6

> Phase 6 — Integration & Operational Architecture
> Date: 2026-09-17
> Status: Design Complete — No External Connections Made

---

## Purpose

This document defines the integration layer required to move from a validated AI workflow to a production-ready client acquisition system. It specifies what integrations are needed, why they're needed, and in what priority order.

---

## 1. Integration Readiness Audit

### Current System State

**What Exists:**
- ✅ Knowledge Base (verified professional data)
- ✅ Client Hunting Engine (research + qualification)
- ✅ Outreach Engine (drafting + approval workflow)
- ✅ Follow-Up Intelligence (decision logic)
- ✅ Reply Intelligence (classification + response)
- ✅ CRM Schema (workflow documentation)

**What's Missing for Production:**
- ❌ Persistent data storage (CRM data doesn't persist across sessions)
- ❌ Email integration (cannot send/receive emails automatically)
- ❌ Calendar integration (cannot schedule meetings)
- ❌ Automated reminders (no notification system)
- ❌ Email verification (cannot verify prospect emails)
- ❌ Ad library access (cannot check if prospects run ads)
- ❌ Social media monitoring (cannot track prospect activity)

---

## 2. Required Integrations

### 2.1 Email Integration

**Purpose:** Send approved outreach, receive and process replies

**Current Workflow:**
1. Agent drafts outreach
2. Human approves
3. Human manually sends email
4. Human manually logs reply when received

**With Integration:**
1. Agent drafts outreach
2. Human approves
3. System sends email automatically
4. System receives reply and routes to Reply Intelligence
5. Agent analyzes reply and drafts response

**Required Data:**
- Email account credentials (OAuth)
- Prospect email addresses
- Email templates
- Reply routing rules

**Input/Output:**
- Input: Approved email draft, recipient list
- Output: Sent email confirmation, received reply notification

**Connection Point:**
- Outreach Engine → Email API → Prospect inbox
- Prospect reply → Email API → Reply Intelligence

**Priority:** P0 — Required for production
- Without this, every email requires manual send/receive
- Scales poorly beyond 5-10 prospects/day

**Risks/Dependencies:**
- Gmail API limits (quota, rate limits)
- Email deliverability (spam filters, domain reputation)
- OAuth token management
- Reply detection accuracy (threading, forwarding)

**Human Approval Requirements:**
- ✅ All outbound emails require approval before sending
- ✅ No automatic sending without approval
- ✅ Human can review sent emails

---

### 2.2 Calendar Integration

**Purpose:** Schedule meetings, send reminders, avoid conflicts

**Current Workflow:**
1. Prospect requests meeting
2. Agent suggests times
3. Human manually checks calendar
4. Human manually sends calendar invite
5. Human manually adds reminder

**With Integration:**
1. Prospect requests meeting
2. Agent checks available slots via Calendar API
3. Agent suggests times
4. Prospect confirms
5. System creates calendar event automatically
6. System sends reminder 24h before

**Required Data:**
- Calendar account credentials (OAuth)
- Meeting duration preferences
- Buffer time between meetings
- Timezone information

**Input/Output:**
- Input: Meeting request, preferred duration
- Output: Calendar event, reminder notifications

**Connection Point:**
- Reply Intelligence (MEETING_REQUEST) → Calendar API → Calendar event
- Reminder system → Email/notification → Human

**Priority:** P1 — High-value improvement
- Saves 5-10 minutes per meeting
- Reduces scheduling errors
- Professional appearance

**Risks/Dependencies:**
- Calendar API complexity (timezones, recurrence)
- Double-booking risk if multiple calendars
- Reminder delivery reliability

**Human Approval Requirements:**
- ✅ All calendar events require human confirmation before creation
- ✅ Human can modify/cancel events
- ✅ No automatic scheduling without approval

---

### 2.3 Persistent CRM Storage

**Purpose:** Store prospect data, conversation history, pipeline state across sessions

**Current Workflow:**
1. Agent maintains CRM in memory/files
2. Data doesn't persist between sessions
3. No backup or versioning
4. Limited to single-user access

**With Integration:**
1. Agent reads/writes to persistent storage
2. Data persists across sessions
3. Automatic backups
4. Can support multiple users (future)

**Required Data:**
- Storage backend (Google Sheets, Airtable, or database)
- Schema definition (see workflows/09-crm-persistence-schema.md)
- Data validation rules
- Backup strategy

**Input/Output:**
- Input: Prospect updates, status changes, conversation logs
- Output: Persistent records, query results, reports

**Connection Point:**
- All workflows → CRM Storage → Persistent data
- Dashboard → CRM Storage → Reports

**Priority:** P0 — Required for production
- Without this, all work is lost between sessions
- Cannot track pipeline across days/weeks
- Cannot generate historical reports

**Risks/Dependencies:**
- Storage limits (rows, API calls)
- Data consistency (concurrent updates)
- Backup/recovery complexity
- Migration if changing backends

**Human Approval Requirements:**
- ✅ Human can export all data anytime
- ✅ Human can manually edit records
- ✅ Human receives notifications for bulk changes

---

### 2.4 Automated Reminders

**Purpose:** Notify human of follow-ups due, replies received, meetings scheduled

**Current Workflow:**
1. Human asks "What's due today?"
2. Agent checks CRM and reports
3. Human must remember to check

**With Integration:**
1. System checks for due items automatically
2. System sends notification (email/Slack/etc.)
3. Human receives proactive alert

**Required Data:**
- Reminder schedule (daily/real-time)
- Notification channel (email/Slack/webhook)
- Reminder rules (what triggers notification)

**Input/Output:**
- Input: CRM state changes, time triggers
- Output: Notification messages

**Connection Point:**
- CRM Storage → Reminder Engine → Notification channel

**Priority:** P1 — High-value improvement
- Prevents missed follow-ups
- Reduces manual checking
- Improves response time

**Risks/Dependencies:**
- Notification fatigue (too many alerts)
- Delivery reliability
- Timezone handling

**Human Approval Requirements:**
- ✅ Human configures notification preferences
- ✅ Human can pause/resume notifications
- ✅ No automatic actions without approval

---

### 2.5 Email Verification

**Purpose:** Verify prospect email addresses before sending outreach

**Current Workflow:**
1. Agent finds prospect email
2. Agent includes in outreach draft
3. Human sends email
4. If email bounces, human updates CRM

**With Integration:**
1. Agent finds prospect email
2. System verifies email via API
3. If invalid, agent finds alternative or flags for manual review
4. Only verified emails are sent to

**Required Data:**
- Email verification service API key
- Verification rules (format, domain, mailbox)
- Fallback strategy (what if email is invalid)

**Input/Output:**
- Input: Email address
- Output: Verification status (valid/invalid/risky)

**Connection Point:**
- Research Engine → Email Verification → Outreach Engine

**Priority:** P1 — High-value improvement
- Reduces bounce rate
- Protects sender reputation
- Saves time on invalid emails

**Risks/Dependencies:**
- Verification accuracy (false positives/negatives)
- API costs (per-verification pricing)
- Service reliability

**Human Approval Requirements:**
- ✅ Human reviews flagged emails
- ✅ Human can override verification decision

---

### 2.6 Meta Ad Library Access

**Purpose:** Check if prospects are running ads, what creative they use

**Current Workflow:**
1. Agent researches prospect
2. Cannot verify ad activity
3. Must assume based on other signals

**With Integration:**
1. Agent researches prospect
2. System checks Meta Ad Library
3. Agent sees actual ads being run
4. Agent can reference specific ads in outreach

**Required Data:**
- Meta Ad Library API access
- Prospect Facebook Page ID
- Ad filtering rules

**Input/Output:**
- Input: Company name / Facebook Page ID
- Output: Active ads list, creative, spend estimates

**Connection Point:**
- Research Engine → Meta Ad Library → Opportunity Detection

**Priority:** P2 — Advanced enhancement
- Provides concrete evidence for outreach
- Shows prospect's marketing sophistication
- Not required for initial outreach

**Risks/Dependencies:**
- API access requirements
- Data freshness (ads change frequently)
- Privacy/compliance considerations

**Human Approval Requirements:**
- ✅ No restrictions (read-only access)

---

### 2.7 LinkedIn / Sales Navigator

**Purpose:** Find decision-makers, verify roles, track activity

**Current Workflow:**
1. Agent researches prospect
2. Manually searches LinkedIn
3. Limited by free tier access

**With Integration:**
1. Agent searches LinkedIn via API
2. System finds decision-makers automatically
3. System tracks role changes, activity
4. Agent has richer context for outreach

**Required Data:**
- LinkedIn API / Sales Navigator access
- Search criteria (industry, role, company size)
- Activity tracking rules

**Input/Output:**
- Input: Company name, search criteria
- Output: Decision-maker profiles, activity feed

**Connection Point:**
- Research Engine → LinkedIn API → Prospect Profile

**Priority:** P2 — Advanced enhancement
- Better decision-maker identification
- Activity-based personalization
- Not required for initial outreach

**Risks/Dependencies:**
- API access restrictions (LinkedIn limits automation)
- Cost (Sales Navigator is expensive)
- Compliance (LinkedIn ToS)

**Human Approval Requirements:**
- ✅ No restrictions (read-only access)
- ✅ Human must manually initiate LinkedIn actions

---

### 2.8 Social Media Monitoring

**Purpose:** Track prospect social media activity for personalization

**Current Workflow:**
1. Agent researches prospect
2. Manually checks social media
3. Limited by manual process

**With Integration:**
1. System monitors prospect social accounts
2. Agent receives activity feed
3. Agent can reference recent posts in outreach

**Required Data:**
- Social media API access (Instagram, Twitter, etc.)
- Monitoring rules (what to track)
- Activity summarization logic

**Input/Output:**
- Input: Social media account handles
- Output: Recent posts, engagement metrics, trends

**Connection Point:**
- Research Engine → Social Media API → Personalization Engine

**Priority:** P2 — Advanced enhancement
- Richer personalization
- Real-time relevance
- Not required for initial outreach

**Risks/Dependencies:**
- API access restrictions
- Data volume (too much noise)
- Privacy considerations

**Human Approval Requirements:**
- ✅ No restrictions (read-only access)

---

### 2.9 Proposal Generation

**Purpose:** Create professional proposals for qualified prospects

**Current Workflow:**
1. Prospect requests proposal
2. Agent drafts proposal outline
3. Human manually creates proposal document
4. Human sends to prospect

**With Integration:**
1. Prospect requests proposal
2. Agent gathers requirements from conversation
3. System generates proposal document (PDF/Google Doc)
4. Human reviews and approves
5. System sends to prospect

**Required Data:**
- Proposal templates
- Pricing rules
- Case study library
- Document generation service

**Input/Output:**
- Input: Prospect requirements, conversation history
- Output: Professional proposal document

**Connection Point:**
- Reply Intelligence (PROPOSAL_REQUEST) → Proposal Generator → Document

**Priority:** P1 — High-value improvement
- Professional appearance
- Saves time on proposal creation
- Consistent formatting

**Risks/Dependencies:**
- Template management
- Customization complexity
- Document storage/sharing

**Human Approval Requirements:**
- ✅ All proposals require human approval before sending
- ✅ Human can edit proposal before sending

---

### 2.10 Meeting Preparation

**Purpose:** Generate talking points and research briefs before meetings

**Current Workflow:**
1. Meeting scheduled
2. Human manually reviews prospect
3. Human prepares notes manually

**With Integration:**
1. Meeting scheduled
2. System generates meeting brief automatically
3. Brief includes: prospect research, conversation history, talking points, questions to ask
4. Human reviews brief before meeting

**Required Data:**
- Meeting template
- Research summary logic
- Conversation history
- Question library

**Input/Output:**
- Input: Prospect ID, conversation history
- Output: Meeting brief document

**Connection Point:**
- Calendar (meeting event) → Meeting Prep Engine → Brief document

**Priority:** P1 — High-value improvement
- Better meeting preparation
- Consistent quality
- Saves time

**Risks/Dependencies:**
- Brief quality (requires good data)
- Template customization
- Time to generate

**Human Approval Requirements:**
- ✅ Human reviews brief before meeting
- ✅ Human can add/modify talking points

---

### 2.11 Analytics Dashboard

**Purpose:** Track system performance, identify bottlenecks, optimize workflow

**Current Workflow:**
1. Agent generates reports on demand
2. Human manually reviews
3. No persistent tracking

**With Integration:**
1. System tracks metrics continuously
2. Dashboard displays real-time performance
3. Human can identify trends, bottlenecks
4. System suggests optimizations

**Required Data:**
- Metrics definitions (see workflows/10-operational-metrics.md)
- Data aggregation logic
- Visualization rules
- Alert thresholds

**Input/Output:**
- Input: CRM data, conversation data, performance data
- Output: Dashboard, reports, alerts

**Connection Point:**
- All workflows → Analytics Engine → Dashboard

**Priority:** P1 — High-value improvement
- Data-driven optimization
- Identify what's working
- Justify time investment

**Risks/Dependencies:**
- Data accuracy (garbage in, garbage out)
- Dashboard complexity
- Interpretation errors

**Human Approval Requirements:**
- ✅ No restrictions (read-only dashboard)
- ✅ Human configures alert thresholds

---

## 3. Source of Truth

### Principle: Prevent Conflicting Data

Each type of information has ONE authoritative source. Other systems may reference or cache this data, but the source of truth is canonical.

### Source of Truth Map

| Data Type | Source of Truth | Why | Who Can Modify |
|-----------|----------------|-----|----------------|
| **Professional facts** (name, services, pricing, experience) | Knowledge Base files (01_PROFILE, 02_SERVICES, etc.) | These are verified, curated facts about Riajul | Riajul only (manual update) |
| **Portfolio proof** (case studies, results, testimonials) | Portfolio files (03_PORTFOLIO, 05_PROOF) + portfolio.riajultech.com | These are verified achievements | Riajul only (manual update) |
| **Prospect research** (company info, observations, opportunities) | CRM records (prospect fields) | Research is tied to specific prospect | Agent (during research workflow) |
| **Relationship state** (pipeline stage, follow-ups, replies) | CRM records (status, conversation fields) | State changes frequently, needs persistence | Agent (during workflow execution) |
| **Conversation history** (emails, replies, meeting notes) | CRM records (conversation summary, reply content) | Full context needed for continuity | Agent (auto) + Riajul (manual edits) |
| **Approved pricing** (ranges, packages) | Pricing Guidance (08_RULES/Pricing-Guidance.md) | Pricing is business decision | Riajul only (manual update) |
| **Behavioral rules** (tone, accuracy, approval requirements) | Agent System Prompt + Rules files (08_RULES) | These are global constraints | Riajul only (manual update) |
| **Follow-up timing** (delays, max touchpoints) | Follow-Up Intelligence (workflows/06-follow-up-intelligence.md) | Timing is configurable business rule | Riajul (can adjust defaults) |
| **Reply classification** (intent, sentiment, next action) | Reply Intelligence (workflows/03-reply-intelligence.md) | Classification logic is centralized | Agent (during reply processing) |

### Conflict Resolution Rules

**Rule 1: Source of truth takes precedence**
- If CRM has outdated pricing, use Pricing Guidance file
- If research contradicts Knowledge Base, use Knowledge Base
- If conversation history is unclear, ask Riajul

**Rule 2: Never silently overwrite verified information**
- Agent must flag conflicts: "CRM shows X, but Knowledge Base shows Y"
- Human must resolve conflict before proceeding
- Log conflict in Notes field

**Rule 3: Agent can update prospect-specific data, not global data**
- ✅ Agent can update: prospect research, conversation history, pipeline stage
- ❌ Agent cannot update: Riajul's services, pricing, experience, portfolio
- ✅ Agent can suggest updates to global data, but Riajul must approve

**Rule 4: Timestamps for data freshness**
- All CRM records have Created Date and Updated Date
- Agent checks timestamps before using data
- If data is stale (>90 days), flag for review

---

## 4. Automation Boundaries

### Principle: Human Control Over External Communication

The agent can automate internal analysis and recommendations, but all external communication requires human approval.

### AUTOMATIC (No Approval Required)

**Internal Operations:**
- ✅ Research prospects (web search, data collection)
- ✅ Qualify prospects (A/B/C classification)
- ✅ Detect opportunities (gap analysis)
- ✅ Match services (service-problem mapping)
- ✅ Select proof (case study matching)
- ✅ Classify replies (13 categories)
- ✅ Analyze sentiment, interest, buying signals
- ✅ Recommend next actions
- ✅ Update CRM records (internal state)
- ✅ Generate reports and dashboards
- ✅ Check for duplicates
- ✅ Calculate follow-up timing
- ✅ Draft follow-up reminders

**Draft Generation:**
- ✅ Draft outreach messages (email, LinkedIn)
- ✅ Draft follow-up messages
- ✅ Draft reply responses
- ✅ Draft meeting briefs
- ✅ Draft proposals
- ✅ Generate personalization angles

**Rationale:** These are internal operations that don't affect prospects. Human reviews before any external action.

---

### APPROVAL REQUIRED (Must Get Human OK)

**External Communication:**
- ⚠️ Send cold outreach emails
- ⚠️ Send follow-up emails
- ⚠️ Send reply responses
- ⚠️ Send LinkedIn connection requests
- ⚠️ Send LinkedIn messages
- ⚠️ Send proposals
- ⚠️ Send meeting confirmations
- ⚠️ Send calendar invites

**Commitments:**
- ⚠️ Commit to pricing (even if within approved range)
- ⚠️ Commit to timeline/scope
- ⚠️ Schedule meetings (confirm availability)
- ⚠️ Accept projects/contracts
- ⚠️ Make guarantees (even soft ones)

**CRM Changes (High Impact):**
- ⚠️ Move prospect to WON (client won)
- ⚠️ Move prospect to LOST (opportunity lost)
- ⚠️ Change priority based on ambiguous information
- ⚠️ Delete prospect records
- ⚠️ Merge duplicate records

**Data Sharing:**
- ⚠️ Share portfolio links (select which ones)
- ⚠️ Share case study details
- ⚠️ Share pricing information
- ⚠️ Share availability/calendar

**Rationale:** These actions affect prospects or commit Riajul to something. Human must review and approve.

**Approval Workflow:**
1. Agent drafts message/action
2. Agent presents to Riajul with:
   - Draft content
   - Context (prospect info, conversation history)
   - Recommended action
   - Risk assessment (if any)
3. Riajul reviews
4. Riajul approves, rejects, or requests changes
5. If approved: Agent executes
6. If rejected: Agent logs reason, adjusts approach
7. If changes requested: Agent revises and re-submits

---

### NEVER AUTOMATIC (Hard Stop)

**Fabrication:**
- ❌ Fabricate client names or testimonials
- ❌ Invent results or metrics
- ❌ Create fake case studies
- ❌ Misrepresent experience or skills
- ❌ Claim certifications not held

**Unauthorized Contact:**
- ❌ Contact prospects without approval
- ❌ Contact prospects after DO_NOT_CONTACT flag
- ❌ Contact prospects after explicit rejection
- ❌ Contact wrong decision-maker (if known)
- ❌ Send duplicate messages to same prospect

**Unauthorized Commitments:**
- ❌ Make guarantees (results, ROI, timeline)
- ❌ Negotiate pricing outside approved range
- ❌ Accept contracts/projects
- ❌ Agree to scope changes
- ❌ Promise deliverables without approval

**Data Violations:**
- ❌ Access private/restricted information
- ❌ Share confidential client information
- ❌ Violate data retention policies
- ❌ Export data without approval
- ❌ Modify verified professional data (services, pricing, experience)

**Rationale:** These violate trust, compliance, or business rules. Hard stop with no exceptions.

---

## 5. Integration Priority Matrix

### P0 — Required for Production

**Must have before scaling beyond 5-10 prospects/day**

| Integration | Problem Solved | Impact | Effort |
|-------------|---------------|--------|--------|
| **Persistent CRM Storage** | Data doesn't persist between sessions | Cannot track pipeline without this | Medium |
| **Email Integration** | Manual send/receive doesn't scale | Bottleneck for outreach volume | High |

**Why P0:**
- Without persistent CRM, all work is lost between sessions
- Without email integration, every outreach requires manual send
- These two block scaling beyond manual operation

**Implementation Order:**
1. Persistent CRM Storage (foundation for everything else)
2. Email Integration (enables automated send/receive)

---

### P1 — High-Value Improvement

**Significant time savings or quality improvement**

| Integration | Problem Solved | Impact | Effort |
|-------------|---------------|--------|--------|
| **Calendar Integration** | Manual scheduling is time-consuming | Saves 5-10 min per meeting | Medium |
| **Automated Reminders** | Manual checking leads to missed follow-ups | Prevents missed opportunities | Low |
| **Email Verification** | Bounced emails waste time and hurt reputation | Improves deliverability | Low |
| **Proposal Generation** | Manual proposal creation is slow | Professional appearance, saves time | Medium |
| **Meeting Preparation** | Manual prep is inconsistent | Better meetings, saves time | Low |
| **Analytics Dashboard** | No visibility into system performance | Data-driven optimization | Medium |

**Why P1:**
- These improve efficiency and quality significantly
- Not strictly required for production, but make system much better
- Can be implemented incrementally

**Implementation Order:**
1. Automated Reminders (low effort, high value)
2. Email Verification (low effort, protects reputation)
3. Calendar Integration (medium effort, saves time)
4. Analytics Dashboard (medium effort, enables optimization)
5. Meeting Preparation (low effort, improves quality)
6. Proposal Generation (medium effort, professional appearance)

---

### P2 — Advanced Enhancement

**Nice to have, but not critical**

| Integration | Problem Solved | Impact | Effort |
|-------------|---------------|--------|--------|
| **Meta Ad Library** | Cannot verify prospect ad activity | Richer research, better personalization | Low |
| **LinkedIn / Sales Navigator** | Manual LinkedIn search is limited | Better decision-maker identification | High |
| **Social Media Monitoring** | Manual social media checking | Real-time personalization opportunities | High |

**Why P2:**
- These are advanced features that enhance quality
- Not required for basic operation
- Higher effort or complexity
- Can be added later as system matures

**Implementation Order:**
1. Meta Ad Library (low effort, good value)
2. LinkedIn / Sales Navigator (high effort, high value)
3. Social Media Monitoring (high effort, moderate value)

---

### Integration Dependency Map

```
Persistent CRM (P0)
    ↓
Email Integration (P0)
    ↓
Automated Reminders (P1)
    ↓
Calendar Integration (P1)
    ↓
Analytics Dashboard (P1)
    ↓
Email Verification (P1)
    ↓
Meeting Preparation (P1)
    ↓
Proposal Generation (P1)
    ↓
Meta Ad Library (P2)
    ↓
LinkedIn / Sales Navigator (P2)
    ↓
Social Media Monitoring (P2)
```

**Key Dependencies:**
- Everything depends on Persistent CRM (foundation)
- Email Integration enables Reminders, Analytics
- Calendar Integration enables Meeting Preparation
- Analytics Dashboard uses data from all other integrations

---

## 6. Recommended Implementation Plan

### Phase 6A — Foundation (Current Phase)

**Goal:** Complete integration architecture, no external connections yet

**Deliverables:**
- ✅ Integration architecture document (this file)
- ✅ CRM persistence schema (workflows/09-crm-persistence-schema.md)
- ✅ Operational metrics definitions (workflows/10-operational-metrics.md)
- ✅ Architecture validation tests (workflows/11-architecture-validation.md)
- ✅ Updated dashboard (DASHBOARD.md)
- ✅ Updated agent system prompt (agent-system-prompt.md)

**Status:** Complete

---

### Phase 6B — P0 Integrations (Next Phase)

**Goal:** Enable persistent storage and email automation

**Deliverables:**
- Persistent CRM Storage (Google Sheets or Airtable)
- Email Integration (Gmail API)
- Migration of existing test data to persistent storage
- Testing of automated email send/receive

**Prerequisites:**
- Riajul provides Google account credentials (OAuth)
- Riajul approves email sending workflow
- Test with 5-10 prospects before scaling

**Estimated Effort:** 2-3 days

---

### Phase 6C — P1 Integrations (Future)

**Goal:** Add high-value improvements

**Deliverables:**
- Automated Reminders (email notifications)
- Email Verification (email verification API)
- Calendar Integration (Google Calendar API)
- Analytics Dashboard (real-time metrics)

**Prerequisites:**
- Phase 6B complete
- Riajul approves each integration
- Test each integration incrementally

**Estimated Effort:** 5-7 days (can be done incrementally)

---

### Phase 6D — P2 Integrations (Future)

**Goal:** Add advanced enhancements

**Deliverables:**
- Meta Ad Library integration
- LinkedIn / Sales Navigator integration
- Social media monitoring

**Prerequisites:**
- Phase 6C complete
- Riajul approves each integration
- API access confirmed

**Estimated Effort:** 7-10 days (can be done incrementally)

---

## 7. Risk Mitigation

### Data Security

**Risk:** Prospect data exposure
**Mitigation:**
- Store only necessary data
- Use secure storage (Google Sheets with restricted access)
- Regular backups
- Data retention policy (archive after 180 days inactive)

### Compliance

**Risk:** Violating anti-spam laws (CAN-SPAM, GDPR)
**Mitigation:**
- Include unsubscribe link in all emails
- Honor DO_NOT_CONTACT immediately
- Respect opt-out requests
- Include physical address in emails (CAN-SPAM requirement)
- Limit outreach volume (max 50 emails/day initially)

### Deliverability

**Risk:** Emails going to spam
**Mitigation:**
- Use verified email address
- Warm up new email accounts gradually
- Verify emails before sending (Email Verification integration)
- Monitor bounce rate (keep <2%)
- Include plain text version
- Personalize emails (reduce spam score)

### API Limits

**Risk:** Hitting API rate limits
**Mitigation:**
- Implement rate limiting in agent
- Queue outgoing emails
- Batch operations where possible
- Monitor API usage
- Implement fallback (manual send if API fails)

### Data Loss

**Risk:** Losing CRM data
**Mitigation:**
- Daily backups (automated)
- Version control (track changes)
- Export capability (manual backup anytime)
- Test restore procedure

---

## 8. Success Metrics

### Integration Success

| Metric | Target | Measurement |
|--------|--------|-------------|
| CRM persistence | 100% data retention | Verify data persists across 7-day test |
| Email delivery | >98% success rate | Track sent vs. delivered |
| Email verification | >95% accuracy | Compare verified vs. bounced |
| Calendar sync | 100% accuracy | Verify no double-bookings in 30-day test |
| Reminder delivery | 100% on-time | Track reminder sent vs. due date |

### Operational Success

| Metric | Target | Measurement |
|--------|--------|-------------|
| Outreach volume | 20-50 prospects/day | Count approved emails sent |
| Response rate | >15% | Track replies / emails sent |
| Follow-up completion | >95% | Track follow-ups sent / follow-ups due |
| Time saved | >50% reduction | Compare manual vs. automated time |
| Data accuracy | 100% | Zero conflicts between sources |

---

## 9. Next Steps

### Immediate (Phase 6A — Complete)
- ✅ Complete integration architecture (this document)
- ✅ Define CRM persistence schema
- ✅ Define operational metrics
- ✅ Create architecture validation tests
- ✅ Update dashboard and system prompt

### Short-term (Phase 6B — Next)
- ⏳ Implement Persistent CRM Storage (Google Sheets)
- ⏳ Implement Email Integration (Gmail API)
- ⏳ Migrate test data to persistent storage
- ⏳ Test automated workflow with 5-10 prospects

### Medium-term (Phase 6C — Future)
- ⏳ Implement Automated Reminders
- ⏳ Implement Email Verification
- ⏳ Implement Calendar Integration
- ⏳ Implement Analytics Dashboard

### Long-term (Phase 6D — Future)
- ⏳ Implement Meta Ad Library integration
- ⏳ Implement LinkedIn / Sales Navigator integration
- ⏳ Implement Social Media Monitoring

---

## 10. Open Questions

### For Riajul to Decide

1. **CRM Storage Backend:** Google Sheets vs. Airtable vs. Database?
   - Google Sheets: Simple, familiar, free
   - Airtable: More powerful, better UI, paid
   - Database: Most flexible, requires setup, paid

2. **Email Provider:** Gmail vs. Outlook vs. Other?
   - Gmail: Most common, good API
   - Outlook: Enterprise standard, good API
   - Other: Custom setup required

3. **Notification Channel:** Email vs. Slack vs. Both?
   - Email: Universal, easy
   - Slack: Real-time, team-friendly
   - Both: Redundant but comprehensive

4. **API Budget:** How much to spend on APIs?
   - Email verification: $0.01-0.05 per verification
   - LinkedIn Sales Navigator: $99/month
   - Other APIs: Varies

5. **Data Retention:** How long to keep prospect data?
   - Active prospects: Keep indefinitely
   - Inactive prospects (>180 days): Archive or delete?
   - Won/Lost prospects: Keep for reporting?

---

## 11. Conclusion

This integration architecture defines the path from validated AI workflow to production-ready client acquisition system. The key insights are:

1. **Two P0 integrations** (Persistent CRM + Email) are required before scaling
2. **Six P1 integrations** provide high-value improvements
3. **Three P2 integrations** are advanced enhancements
4. **Source of truth** prevents data conflicts
5. **Automation boundaries** ensure human control
6. **Phased implementation** reduces risk

The system is now architecturally complete. Next step is implementing P0 integrations (Phase 6B).

---

**Document Status:** Complete
**Next Action:** Riajul reviews and approves architecture, then proceed to Phase 6B (P0 implementations)
