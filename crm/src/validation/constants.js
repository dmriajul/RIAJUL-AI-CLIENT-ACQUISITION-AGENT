/**
 * CRM Constants
 * 
 * All enums, valid values, and constants used throughout the CRM
 */

export const VALID_PRIORITIES = ['A', 'B', 'C'];

export const VALID_ICP_SEGMENTS = ['Primary', 'Secondary', 'Tertiary'];

export const VALID_SERVICES = [
  'Meta Ads Management',
  'Social Media Management',
  'Google Ads Management',
  'SEO',
  'Local SEO & ORM',
  'Analytics & Tracking',
  'CRO',
  'Combined Package'
];

export const VALID_PIPELINE_STAGES = [
  'NEW',
  'RESEARCHED',
  'QUALIFIED',
  'OUTREACH_READY',
  'CONTACTED',
  'FOLLOW_UP_1',
  'FOLLOW_UP_2',
  'REPLIED',
  'CONVERSATION',
  'MEETING',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
  'NURTURE',
  'DISQUALIFIED'
];

export const VALID_STAGE_MODIFIERS = [
  null,
  'DO_NOT_CONTACT',
  'REFERRED',
  'MULTI_CONTACT',
  'RE_ENGAGING',
  'AT_RISK'
];

export const VALID_SENTIMENTS = ['Positive', 'Neutral', 'Negative', 'Mixed'];

export const VALID_INTEREST_LEVELS = ['High', 'Medium', 'Low', 'None'];

export const VALID_URGENCY_LEVELS = ['High', 'Medium', 'Low', 'None'];

export const VALID_DECISION_MAKER_STATUS = [
  'Decision-maker',
  'Influencer',
  'Gatekeeper',
  'Unknown'
];

export const VALID_COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

export const VALID_REPLY_CLASSIFICATIONS = [
  'INTERESTED',
  'QUALIFIED',
  'MEETING_REQUEST',
  'PRICING',
  'QUESTION',
  'OBJECTION',
  'NOT_NOW',
  'NOT_INTERESTED',
  'WRONG_PERSON',
  'REFERRAL',
  'ALREADY_HAVE_PROVIDER',
  'NEEDS_MORE_INFORMATION',
  'UNCLEAR'
];

export const VALID_MESSAGE_TYPES = ['Outbound', 'Inbound'];

export const VALID_CHANNELS = ['Email', 'LinkedIn'];

export const VALID_CONTACT_STATUSES = ['Active', 'Inactive', 'DO_NOT_CONTACT', 'Archived'];

export const VALID_COMPANY_STATUSES = ['Active', 'Inactive', 'Duplicate', 'Archived'];

export const VALID_PROSPECT_STATUSES = ['Active', 'Inactive', 'Archived'];

export const VALID_CONVERSATION_STATUSES = ['Draft', 'Approved', 'Sent', 'Failed', 'Received'];

export const VALID_FOLLOWUP_STATUSES = ['Scheduled', 'Approved', 'Sent', 'Skipped', 'Blocked'];

export const VALID_FOLLOWUP_TYPES = [
  'No Response',
  'Re-engagement',
  'Proposal Follow-up',
  'Post-meeting',
  'Post-reply'
];

export const VALID_MEETING_TYPES = ['Call', 'Video', 'In-person'];

export const VALID_MEETING_STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'No-show'];

export const VALID_MEETING_OUTCOMES = ['Positive', 'Neutral', 'Negative', 'Pending'];

export const VALID_PROPOSAL_STATUSES = [
  'Draft',
  'Sent',
  'Accepted',
  'Rejected',
  'Expired',
  'Withdrawn'
];

export const VALID_ACTORS = ['Agent', 'Riajul', 'System'];

export const VALID_AUDIT_ACTIONS = [
  'CREATE',
  'READ',
  'UPDATE',
  'ARCHIVE',
  'MERGE',
  'STAGE_CHANGE',
  'STATUS_CHANGE',
  'BLOCK',
  'UNBLOCK',
  'APPROVE',
  'REJECT',
  'SEND',
  'RECEIVE',
  'SCHEDULE',
  'COMPLETE',
  'SKIP',
  'CANCEL'
];

export const VALID_ENTITIES = [
  'Company',
  'Contact',
  'Prospect',
  'Conversation',
  'ReplyAnalysis',
  'Followup',
  'Meeting',
  'Proposal'
];

// Touchpoint limits
export const TOUCHPOINT_LIMITS = {
  email: 4,
  linkedin: 3,
  combined: 7
};

// NURTURE re-engagement timing (days)
export const NURTURE_REENGAGE_DAYS = {
  A: 30,
  B: 60,
  C: 90
};

// Stage prefixes for ID generation
export const ID_PREFIXES = {
  Companies: 'COMP',
  Contacts: 'CONT',
  Prospects: 'PRO',
  Conversations: 'CONV',
  'Reply Analysis': 'ANAL',
  'Follow-ups': 'FU',
  Meetings: 'MEET',
  Proposals: 'PROP',
  'Audit Log': 'LOG'
};
