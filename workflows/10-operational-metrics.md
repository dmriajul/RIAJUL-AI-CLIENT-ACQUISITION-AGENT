# Operational Metrics

> Phase 6 — Integration & Operational Architecture
> Date: 2026-09-17
> Purpose: Define metrics for tracking system performance

---

## Purpose

This document defines the operational metrics for the Client Acquisition System. These metrics enable data-driven optimization, identify bottlenecks, and justify time investment.

**Important:** This document defines metric structures only. No historical data exists yet. Metrics will be populated once the system goes live.

---

## Metric Categories

### 1. Activity Metrics

**Purpose:** Track volume of work being done

| Metric | Definition | Calculation | Target | Frequency |
|--------|-----------|-------------|--------|-----------|
| **Prospects Researched** | Number of new prospects researched | Count of prospects with status = RESEARCHED | 15-20/day | Daily |
| **Prospects Qualified** | Number of prospects qualified (A/B/C) | Count of prospects with status = QUALIFIED | 9-12/day | Daily |
| **Outreach Drafted** | Number of outreach messages drafted | Count of conversations with message_type = Outbound | 5-10/day | Daily |
| **Outreach Approved** | Number of outreach messages approved by human | Count of conversations with human_approved = TRUE | 4-8/day | Daily |
| **Outreach Sent** | Number of outreach messages actually sent | Count of conversations with status = Sent | 4-8/day | Daily |
| **Follow-ups Due** | Number of follow-ups scheduled for today | Count of follow-ups with scheduled_date = today | N/A | Daily |
| **Follow-ups Completed** | Number of follow-ups actually sent | Count of follow-ups with status = Sent | >95% of due | Daily |
| **Replies Received** | Number of replies from prospects | Count of conversations with message_type = Inbound | N/A | Daily |
| **Meetings Scheduled** | Number of meetings scheduled | Count of meetings with status = Scheduled | 2-4/week | Weekly |
| **Proposals Sent** | Number of proposals sent | Count of proposals with status = Sent | 1-2/week | Weekly |

**Why These Matter:**
- Activity metrics show effort and throughput
- Help identify if system is being used consistently
- Reveal bottlenecks (e.g., lots of drafts but few approvals)

---

### 2. Conversion Metrics

**Purpose:** Track effectiveness of each pipeline stage

| Metric | Definition | Calculation | Target | Frequency |
|--------|-----------|-------------|--------|-----------|
| **Response Rate** | Percentage of outreach that gets replies | (Replies Received / Outreach Sent) × 100 | >15% | Weekly |
| **Positive Response Rate** | Percentage of replies that are positive | (Positive Replies / Replies Received) × 100 | >40% | Weekly |
| **Meeting Conversion Rate** | Percentage of positive replies that become meetings | (Meetings Scheduled / Positive Replies) × 100 | >50% | Weekly |
| **Proposal Rate** | Percentage of meetings that lead to proposals | (Proposals Sent / Meetings Completed) × 100 | >60% | Weekly |
| **Win Rate** | Percentage of proposals that result in won deals | (Won / Proposals Sent) × 100 | >30% | Monthly |
| **Prospect-to-Client Rate** | Overall conversion from prospect to client | (Won / Prospects Researched) × 100 | >2% | Monthly |

**Why These Matter:**
- Conversion metrics show system effectiveness
- Identify weak stages (e.g., high outreach but low response)
- Help optimize messaging and targeting

**Calculation Examples:**

**Response Rate:**
```
Outreach Sent: 100
Replies Received: 18
Response Rate: (18 / 100) × 100 = 18%
```

**Positive Response Rate:**
```
Replies Received: 18
Positive Replies (Interested + Meeting Request): 8
Positive Response Rate: (8 / 18) × 100 = 44%
```

**Meeting Conversion Rate:**
```
Positive Replies: 8
Meetings Scheduled: 5
Meeting Conversion Rate: (5 / 8) × 100 = 62.5%
```

**Win Rate:**
```
Proposals Sent: 10
Won: 3
Win Rate: (3 / 10) × 100 = 30%
```

**Prospect-to-Client Rate:**
```
Prospects Researched: 500
Won: 10
Prospect-to-Client Rate: (10 / 500) × 100 = 2%
```

---

### 3. Pipeline Metrics

**Purpose:** Track health and velocity of pipeline

| Metric | Definition | Calculation | Target | Frequency |
|--------|-----------|-------------|--------|-----------|
| **Total Pipeline Value** | Sum of potential revenue in pipeline | Sum of proposal values where status = Sent | N/A | Weekly |
| **Pipeline Velocity** | Average time from prospect to won | Average(prospective.created_date → won.updated_date) | <60 days | Monthly |
| **Stage Duration** | Average time spent in each stage | Average(stage.enter_date → stage.exit_date) | Varies | Monthly |
| **Pipeline Coverage** | Pipeline value vs. revenue goal | (Pipeline Value / Revenue Goal) × 100 | >300% | Monthly |
| **Active Pipeline** | Number of prospects in active stages | Count where status IN (QUALIFIED → PROPOSAL) | 50-100 | Weekly |
| **Stale Prospects** | Number of prospects with no activity >30 days | Count where updated_date < (today - 30) | <10% | Weekly |

**Why These Matter:**
- Pipeline metrics show future revenue potential
- Identify bottlenecks (e.g., prospects stuck in one stage)
- Help forecast revenue

**Stage Duration Targets:**

| Stage | Target Duration | Why |
|-------|----------------|-----|
| NEW → RESEARCHED | 1 day | Research should be quick |
| RESEARCHED → QUALIFIED | 1 day | Qualification should be fast |
| QUALIFIED → OUTREACH_READY | 2 days | Takes time to draft + approve |
| OUTREACH_READY → CONTACTED | 1 day | Should send quickly after approval |
| CONTACTED → REPLIED | 7-14 days | Prospects need time to respond |
| REPLIED → MEETING | 3-5 days | Should schedule quickly |
| MEETING → PROPOSAL | 2-3 days | Proposal should follow meeting |
| PROPOSAL → WON/LOST | 7-14 days | Prospects need time to decide |

---

### 4. Quality Metrics

**Purpose:** Track quality of work being done

| Metric | Definition | Calculation | Target | Frequency |
|--------|-----------|-------------|--------|-----------|
| **Research Quality Score** | % of prospects with complete research | Count(complete research) / Count(researched) × 100 | >90% | Weekly |
| **Personalization Level** | % of outreach at Level 3 (deep) | Count(Level 3) / Count(outreach) × 100 | >80% | Weekly |
| **Approval Rate** | % of drafted outreach approved | Count(approved) / Count(drafted) × 100 | >80% | Weekly |
| **Follow-up Completion Rate** | % of scheduled follow-ups completed | Count(completed) / Count(due) × 100 | >95% | Weekly |
| **Data Accuracy Rate** | % of records with no conflicts | Count(no conflicts) / Count(total) × 100 | 100% | Weekly |
| **DO_NOT_CONTACT Compliance** | % of DO_NOT_CONTACT records respected | Count(respected) / Count(DO_NOT_CONTACT) × 100 | 100% | Weekly |

**Why These Matter:**
- Quality metrics ensure system is doing work correctly
- Identify areas for improvement (e.g., low approval rate = poor drafting)
- Ensure compliance and data integrity

---

### 5. Efficiency Metrics

**Purpose:** Track time saved and productivity gains

| Metric | Definition | Calculation | Target | Frequency |
|--------|-----------|-------------|--------|-----------|
| **Time per Research** | Average time to research one prospect | Total research time / Count(researched) | <10 min | Weekly |
| **Time per Outreach** | Average time to draft + approve one outreach | Total outreach time / Count(drafted) | <15 min | Weekly |
| **Time per Follow-up** | Average time to generate one follow-up | Total follow-up time / Count(follow-ups) | <5 min | Weekly |
| **Time per Reply Analysis** | Average time to analyze one reply | Total analysis time / Count(replies) | <5 min | Weekly |
| **Manual vs. Automated Time** | Time spent on manual vs. automated tasks | Manual time / Total time | <30% manual | Monthly |
| **System Uptime** | % of time system is operational | Uptime / Total time | >99% | Monthly |

**Why These Matter:**
- Efficiency metrics show ROI of automation
- Identify time sinks (e.g., slow research)
- Justify system investment

**Baseline Measurement:**
- Before automation: Track time manually for 1 week
- After automation: Compare to baseline
- Target: 50% time reduction

---

### 6. Revenue Metrics

**Purpose:** Track financial outcomes

| Metric | Definition | Calculation | Target | Frequency |
|--------|-----------|-------------|--------|-----------|
| **Total Revenue** | Sum of won deals | Sum(won.proposal_values) | N/A | Monthly |
| **Average Deal Size** | Average revenue per won deal | Total Revenue / Count(won) | >$500 | Monthly |
| **Revenue per Prospect** | Average revenue per researched prospect | Total Revenue / Count(researched) | >$10 | Monthly |
| **Revenue per Outreach** | Average revenue per sent outreach | Total Revenue / Count(sent) | >$50 | Monthly |
| **Customer Acquisition Cost** | Cost to acquire one client | Total system cost / Count(won) | <$200 | Monthly |
| **ROI** | Return on investment | (Revenue - Cost) / Cost × 100 | >500% | Monthly |

**Why These Matter:**
- Revenue metrics show financial impact
- Justify system investment
- Help set realistic targets

**ROI Calculation Example:**
```
Monthly Revenue: $5,000 (10 clients × $500 avg)
Monthly Cost: $500 (tools, time, etc.)
ROI: ($5,000 - $500) / $500 × 100 = 900%
```

---

## Metric Tracking Implementation

### Daily Tracking (Automated)

**At end of each day (23:59):**
```
1. Count prospects researched today
2. Count prospects qualified today
3. Count outreach drafted today
4. Count outreach approved today
5. Count outreach sent today
6. Count replies received today
7. Count positive replies today
8. Count meetings scheduled today
9. Count follow-ups due today
10. Count follow-ups completed today
11. Calculate response rate
12. Calculate positive response rate
13. Write to Metrics sheet
```

### Weekly Tracking (Automated)

**At end of each week (Sunday 23:59):**
```
1. Sum daily metrics for week
2. Calculate weekly conversion rates
3. Count proposals sent this week
4. Count won deals this week
5. Count lost deals this week
6. Count nurture moves this week
7. Calculate pipeline metrics
8. Calculate quality metrics
9. Write summary to Metrics sheet
```

### Monthly Tracking (Automated)

**At end of each month (last day 23:59):**
```
1. Sum weekly metrics for month
2. Calculate monthly conversion rates
3. Calculate pipeline velocity
4. Calculate revenue metrics
5. Calculate efficiency metrics
6. Calculate ROI
7. Write summary to Metrics sheet
```

---

## Metric Dashboards

### Daily Dashboard

**Shows:**
- Today's activity (researched, qualified, outreach sent, etc.)
- Follow-ups due today
- Overdue follow-ups
- Recent replies
- Response rate (7-day rolling average)

**Purpose:** Daily operational view

### Weekly Dashboard

**Shows:**
- This week's activity
- Week-over-week comparison
- Conversion rates (response, positive, meeting, proposal)
- Pipeline health
- Quality metrics
- Stale prospects

**Purpose:** Weekly performance review

### Monthly Dashboard

**Shows:**
- This month's activity
- Month-over-month comparison
- Revenue metrics
- Pipeline velocity
- ROI calculation
- Efficiency metrics
- Trend analysis

**Purpose:** Monthly strategic review

---

## Metric Alerts

### Threshold Alerts

**Alert when:**
- Response rate < 10% (messaging problem)
- Approval rate < 70% (quality problem)
- Follow-up completion < 90% (process problem)
- Stale prospects > 20% (pipeline problem)
- Data accuracy < 100% (compliance problem)

### Trend Alerts

**Alert when:**
- Response rate declining for 3+ weeks
- Win rate declining for 2+ months
- Pipeline velocity increasing for 2+ months
- Activity declining for 1+ week

**Purpose:** Proactive problem detection

---

## Metric Reporting

### Daily Report

**Format:**
```
DAILY REPORT — [Date]
━━━━━━━━━━━━━━━━━━━━━

ACTIVITY:
  Prospects researched: [X]
  Prospects qualified: [X]
  Outreach drafted: [X]
  Outreach approved: [X]
  Outreach sent: [X]
  Replies received: [X]
  Positive replies: [X]
  Meetings scheduled: [X]

FOLLOW-UPS:
  Due today: [X]
  Completed: [X]
  Overdue: [X]

RATES (7-day rolling):
  Response rate: [X]%
  Positive response rate: [X]%

PIPELINE:
  Active prospects: [X]
  Stale prospects: [X]
━━━━━━━━━━━━━━━━━━━━━
```

### Weekly Report

**Format:**
```
WEEKLY REPORT — Week of [Date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACTIVITY:
  Prospects researched: [X] (target: 75-100)
  Prospects qualified: [X] (target: 45-60)
  Outreach drafted: [X] (target: 25-50)
  Outreach sent: [X] (target: 20-40)
  Replies received: [X]
  Positive replies: [X]
  Meetings scheduled: [X] (target: 2-4)
  Proposals sent: [X] (target: 1-2)

CONVERSION RATES:
  Response rate: [X]% (target: >15%)
  Positive response rate: [X]% (target: >40%)
  Meeting conversion: [X]% (target: >50%)
  Proposal rate: [X]% (target: >60%)

PIPELINE:
  Active pipeline: [X] (target: 50-100)
  Stale prospects: [X] (target: <10%)
  Pipeline velocity: [X] days (target: <60)

QUALITY:
  Research quality: [X]% (target: >90%)
  Personalization level: [X]% (target: >80%)
  Approval rate: [X]% (target: >80%)
  Follow-up completion: [X]% (target: >95%)

WEEK-OVER-WEEK:
  Activity: [↑/↓/→] [X]%
  Response rate: [↑/↓/→] [X]%
  Win rate: [↑/↓/→] [X]%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Monthly Report

**Format:**
```
MONTHLY REPORT — [Month] [Year]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACTIVITY:
  Prospects researched: [X]
  Prospects qualified: [X]
  Outreach sent: [X]
  Replies received: [X]
  Meetings scheduled: [X]
  Proposals sent: [X]

REVENUE:
  Total revenue: $[X]
  Average deal size: $[X]
  Won deals: [X]
  Lost deals: [X]

CONVERSION RATES:
  Response rate: [X]%
  Positive response rate: [X]%
  Meeting conversion: [X]%
  Proposal rate: [X]%
  Win rate: [X]%
  Prospect-to-client: [X]%

EFFICIENCY:
  Time per research: [X] min
  Time per outreach: [X] min
  Manual vs. automated: [X]% manual
  System uptime: [X]%

ROI:
  Total cost: $[X]
  Total revenue: $[X]
  ROI: [X]%

PIPELINE:
  Pipeline velocity: [X] days
  Average deal size: $[X]
  Revenue per prospect: $[X]
  Revenue per outreach: $[X]

PIPELINE HEALTH:
  Active pipeline: [X]
  Pipeline value: $[X]
  Pipeline coverage: [X]%
  Stale prospects: [X]

MONTH-OVER-MONTH:
  Activity: [↑/↓/→] [X]%
  Revenue: [↑/↓/→] [X]%
  Win rate: [↑/↓/→] [X]%
  ROI: [↑/↓/→] [X]%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Metric Storage

### Google Sheets Structure

**Metrics Sheet:**
- One row per day
- Columns for each metric
- Automatic calculation of derived metrics
- Conditional formatting for alerts

### Backup

**Daily export:**
- CSV export to Google Drive
- JSON export for programmatic access
- Retention: 365 days

---

## Metric Usage

### Decision Making

**Use metrics to:**
- Identify bottlenecks (e.g., low response rate → improve messaging)
- Set realistic targets (based on historical performance)
- Justify time investment (show ROI)
- Optimize workflow (focus on high-conversion activities)
- Forecast revenue (based on pipeline and conversion rates)

### Continuous Improvement

**Review metrics:**
- Daily: Check activity and follow-ups
- Weekly: Review conversion rates and pipeline
- Monthly: Analyze revenue and ROI
- Quarterly: Adjust targets and strategy

**Optimize based on:**
- Response rate: Improve personalization and targeting
- Approval rate: Improve drafting quality
- Win rate: Improve proposal quality and pricing
- Pipeline velocity: Reduce stage duration
- Efficiency: Automate more tasks

---

## Conclusion

This metrics framework provides comprehensive tracking of the Client Acquisition System. Key points:

✅ 6 metric categories (activity, conversion, pipeline, quality, efficiency, revenue)
✅ Automated daily/weekly/monthly tracking
✅ Dashboard views for different timeframes
✅ Alert system for proactive problem detection
✅ Reporting templates for daily/weekly/monthly reviews
✅ Storage in Google Sheets with backup

**Next Step:** Implement automated metric tracking once CRM persistence is live.

---

**Document Status:** Complete (definitions only, no historical data yet)
**Next Action:** Begin tracking metrics once system goes live
