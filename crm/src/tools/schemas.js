/**
 * CRM Tool Schemas
 * 
 * Defines JSON schemas for all CRM tools that can be called by the agent.
 * These schemas are used for:
 * 1. Function calling interfaces (OpenAI, Claude, etc.)
 * 2. Input validation before CRMService calls
 * 3. Documentation of tool parameters
 * 
 * IMPORTANT: Tool-level parameter names use agent-friendly names.
 * The ToolExecutor maps these to CRMService's internal field names.
 */

import {
  VALID_PRIORITIES,
  VALID_ICP_SEGMENTS,
  VALID_SERVICES,
  VALID_PIPELINE_STAGES,
  VALID_SENTIMENTS,
  VALID_INTEREST_LEVELS,
  VALID_URGENCY_LEVELS,
  VALID_REPLY_CLASSIFICATIONS,
  VALID_FOLLOWUP_TYPES,
  VALID_COMPANY_SIZES
} from '../validation/constants.js';

export const TOOL_SCHEMAS = {
  // ============================================
  // COMPANY OPERATIONS
  // ============================================

  create_company: {
    name: 'create_company',
    description: 'Create a new company record in the CRM',
    inputSchema: {
      type: 'object',
      properties: {
        'Company Name': { type: 'string', description: 'Company name (required)' },
        'Website': { type: 'string', description: 'Company website URL' },
        'Industry': { type: 'string', description: 'Industry/sector' },
        'Country': { type: 'string', description: 'Country' },
        'City': { type: 'string', description: 'City' },
        'Company Size': { type: 'string', enum: VALID_COMPANY_SIZES, description: 'Company size' },
        'LinkedIn Company': { type: 'string', description: 'Company LinkedIn URL' },
        'ICP Segment': { type: 'string', enum: VALID_ICP_SEGMENTS, description: 'ICP segment' },
        'Notes': { type: 'string', description: 'Notes about the company' }
      },
      required: ['Company Name'],
      additionalProperties: false
    }
  },

  // ============================================
  // CONTACT OPERATIONS
  // ============================================

  create_contact: {
    name: 'create_contact',
    description: 'Create a new contact record in the CRM. The company must already exist.',
    inputSchema: {
      type: 'object',
      properties: {
        'Company ID': { type: 'string', description: 'Company ID (COMP-XXX) — must exist' },
        'Contact Name': { type: 'string', description: 'Contact name' },
        'Role': { type: 'string', description: 'Job title/role' },
        'Email': { type: 'string', description: 'Contact email address' },
        'LinkedIn': { type: 'string', description: 'Contact LinkedIn URL' },
        'Decision Maker Status': { type: 'string', enum: ['Decision-maker', 'Influencer', 'Gatekeeper', 'Unknown'], description: 'Decision maker status' },
        'Referred By': { type: 'string', description: 'Who referred this contact' },
        'Notes': { type: 'string', description: 'Notes about the contact' }
      },
      required: ['Company ID'],
      additionalProperties: false
    }
  },

  mark_do_not_contact: {
    name: 'mark_do_not_contact',
    description: 'Mark a contact as DO NOT CONTACT. This blocks all future outbound outreach to this contact and all linked prospects.',
    inputSchema: {
      type: 'object',
      properties: {
        'Contact ID': { type: 'string', description: 'Contact ID (CONT-XXX)' },
        'Reason': { type: 'string', description: 'Why this contact should not be contacted' }
      },
      required: ['Contact ID', 'Reason'],
      additionalProperties: false
    }
  },

  check_do_not_contact: {
    name: 'check_do_not_contact',
    description: 'Check if a contact is marked as DO NOT CONTACT. Call this before any outbound action.',
    inputSchema: {
      type: 'object',
      properties: {
        'Contact ID': { type: 'string', description: 'Contact ID (CONT-XXX)' }
      },
      required: ['Contact ID'],
      additionalProperties: false
    }
  },

  // ============================================
  // PROSPECT OPERATIONS
  // ============================================

  create_prospect: {
    name: 'create_prospect',
    description: 'Create a new prospect (sales opportunity). Both company and contact must already exist.',
    inputSchema: {
      type: 'object',
      properties: {
        'Company ID': { type: 'string', description: 'Existing company ID (COMP-XXX)' },
        'Contact ID': { type: 'string', description: 'Existing contact ID (CONT-XXX) — must belong to the company' },
        'Priority': { type: 'string', enum: VALID_PRIORITIES, description: 'Priority level (A=highest)' },
        'Priority Reason': { type: 'string', description: 'Why this priority was assigned' },
        'ICP Segment': { type: 'string', enum: VALID_ICP_SEGMENTS, description: 'ICP segment match' },
        'Service': { type: 'string', enum: VALID_SERVICES, description: 'Service opportunity' },
        'Opportunity': { type: 'string', description: 'Specific opportunity identified' },
        'Research Evidence': { type: 'string', description: 'Evidence supporting the opportunity' },
        'Portfolio Proof': { type: 'string', description: 'Portfolio proof that matches' },
        'Pipeline Stage': { type: 'string', enum: VALID_PIPELINE_STAGES, description: 'Initial pipeline stage (defaults to NEW)' }
      },
      required: ['Company ID', 'Contact ID', 'Priority', 'Priority Reason', 'ICP Segment', 'Service', 'Opportunity', 'Research Evidence', 'Portfolio Proof'],
      additionalProperties: false
    }
  },

  get_prospect: {
    name: 'get_prospect',
    description: 'Retrieve a prospect record by ID',
    inputSchema: {
      type: 'object',
      properties: {
        'Prospect ID': { type: 'string', description: 'Prospect ID (PRO-XXX)' }
      },
      required: ['Prospect ID'],
      additionalProperties: false
    }
  },

  search_prospects: {
    name: 'search_prospects',
    description: 'Search for prospects by field and value',
    inputSchema: {
      type: 'object',
      properties: {
        'Field': { type: 'string', enum: ['Priority', 'Pipeline Stage', 'Service', 'ICP Segment', 'Status', 'Contact ID', 'Company ID'], description: 'Field to search by' },
        'Value': { type: 'string', description: 'Value to match' }
      },
      required: ['Field', 'Value'],
      additionalProperties: false
    }
  },

  update_prospect: {
    name: 'update_prospect',
    description: 'Update prospect fields (not stage — use update_stage for stage changes)',
    inputSchema: {
      type: 'object',
      properties: {
        'Prospect ID': { type: 'string', description: 'Prospect ID (PRO-XXX)' },
        'Priority': { type: 'string', enum: VALID_PRIORITIES, description: 'Updated priority' },
        'ICP Segment': { type: 'string', enum: VALID_ICP_SEGMENTS, description: 'Updated ICP segment' },
        'Service': { type: 'string', enum: VALID_SERVICES, description: 'Updated service' },
        'Interest Level': { type: 'string', enum: VALID_INTEREST_LEVELS, description: 'Interest level' },
        'Sentiment': { type: 'string', enum: VALID_SENTIMENTS, description: 'Sentiment' },
        'Objection': { type: 'string', description: 'Objection type' },
        'Buying Signal': { type: 'string', description: 'Buying signal detected' }
      },
      required: ['Prospect ID'],
      additionalProperties: false
    }
  },

  update_stage: {
    name: 'update_stage',
    description: 'Update prospect pipeline stage. Stage transitions are validated against business rules. A reason is required.',
    inputSchema: {
      type: 'object',
      properties: {
        'Prospect ID': { type: 'string', description: 'Prospect ID (PRO-XXX)' },
        'New Stage': { type: 'string', enum: VALID_PIPELINE_STAGES, description: 'New pipeline stage' },
        'Reason': { type: 'string', description: 'Reason for stage change (required)' }
      },
      required: ['Prospect ID', 'New Stage', 'Reason'],
      additionalProperties: false
    }
  },

  get_prospect_history: {
    name: 'get_prospect_history',
    description: 'Get complete history of a prospect (all interactions, follow-ups, stage changes, audit log)',
    inputSchema: {
      type: 'object',
      properties: {
        'Prospect ID': { type: 'string', description: 'Prospect ID (PRO-XXX)' }
      },
      required: ['Prospect ID'],
      additionalProperties: false
    }
  },

  // ============================================
  // INTERACTION OPERATIONS
  // ============================================

  add_interaction: {
    name: 'add_interaction',
    description: 'Log an interaction (outbound or inbound). CRITICAL: Outbound interactions require Human Approved=true. The agent should NEVER set Human Approved=true itself — only Riajul (the human) can approve outbound messages.',
    inputSchema: {
      type: 'object',
      properties: {
        'Prospect ID': { type: 'string', description: 'Prospect ID (PRO-XXX)' },
        'Message Type': { type: 'string', enum: ['Outbound', 'Inbound'], description: 'Interaction direction' },
        'Message Channel': { type: 'string', enum: ['Email', 'LinkedIn'], description: 'Communication channel' },
        'Message Content': { type: 'string', description: 'Message content/body' },
        'Message Subject': { type: 'string', description: 'Message subject line' },
        'Human Approved': { type: 'boolean', description: 'Whether Riajul approved this (MUST be true for Outbound)' }
      },
      required: ['Prospect ID', 'Message Type', 'Message Channel', 'Message Content'],
      additionalProperties: false
    }
  },

  log_reply_analysis: {
    name: 'log_reply_analysis',
    description: 'Log analysis of a reply received from a prospect. Updates prospect fields based on the analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        'Prospect ID': { type: 'string', description: 'Prospect ID (PRO-XXX)' },
        'Conversation ID': { type: 'string', description: 'Conversation ID of the reply being analyzed (CONV-XXX)' },
        'Reply Content': { type: 'string', description: 'The reply content' },
        'Classification': { type: 'string', enum: VALID_REPLY_CLASSIFICATIONS, description: 'Classification of the reply' },
        'Sentiment': { type: 'string', enum: VALID_SENTIMENTS, description: 'Reply sentiment' },
        'Interest Level': { type: 'string', enum: VALID_INTEREST_LEVELS, description: 'Interest level' },
        'Objection': { type: 'string', description: 'Objection if any' },
        'Buying Signal': { type: 'string', description: 'Buying signal if any' },
        'Urgency': { type: 'string', enum: VALID_URGENCY_LEVELS, description: 'Urgency level' },
        'Recommended Action': { type: 'string', description: 'Recommended next action' }
      },
      required: ['Prospect ID', 'Conversation ID', 'Reply Content', 'Classification', 'Sentiment', 'Interest Level', 'Urgency', 'Recommended Action'],
      additionalProperties: false
    }
  },

  // ============================================
  // FOLLOW-UP OPERATIONS
  // ============================================

  add_follow_up: {
    name: 'add_follow_up',
    description: 'Schedule a follow-up action for a prospect. Subject to DO_NOT_CONTACT and touchpoint limits.',
    inputSchema: {
      type: 'object',
      properties: {
        'Prospect ID': { type: 'string', description: 'Prospect ID (PRO-XXX)' },
        'Follow-up Type': { type: 'string', enum: VALID_FOLLOWUP_TYPES, description: 'Type of follow-up' },
        'Scheduled Date': { type: 'string', description: 'When to execute (YYYY-MM-DD)' },
        'Follow-up Number': { type: 'number', description: 'Follow-up sequence number (1, 2, or 3)' },
        'Channel': { type: 'string', enum: ['Email', 'LinkedIn'], description: 'Follow-up channel' },
        'Value Angle': { type: 'string', description: 'Value proposition for this follow-up' },
        'Draft Content': { type: 'string', description: 'Draft content for the follow-up message' }
      },
      required: ['Prospect ID', 'Follow-up Type', 'Scheduled Date', 'Follow-up Number', 'Channel', 'Value Angle', 'Draft Content'],
      additionalProperties: false
    }
  },

  complete_follow_up: {
    name: 'complete_follow_up',
    description: 'Mark a follow-up as completed (sent). Only works if the follow-up is not blocked.',
    inputSchema: {
      type: 'object',
      properties: {
        'Follow-up ID': { type: 'string', description: 'Follow-up ID (FU-XXX)' }
      },
      required: ['Follow-up ID'],
      additionalProperties: false
    }
  },

  // ============================================
  // REFERRAL OPERATIONS
  // ============================================

  add_referral: {
    name: 'add_referral',
    description: 'Create a new prospect from a referral. Creates company, contact, and prospect records automatically.',
    inputSchema: {
      type: 'object',
      properties: {
        'Source Prospect ID': { type: 'string', description: 'Prospect ID of the referrer (PRO-XXX)' },
        'New Company Name': { type: 'string', description: 'Referred company name' },
        'New Contact Name': { type: 'string', description: 'Referred contact name' },
        'New Contact Email': { type: 'string', description: 'Referred contact email' },
        'Referred Role': { type: 'string', description: 'Referred contact role/title' },
        'Referred Company Website': { type: 'string', description: 'Referred company website' },
        'Service': { type: 'string', enum: VALID_SERVICES, description: 'Service opportunity' },
        'Priority': { type: 'string', enum: VALID_PRIORITIES, description: 'Priority level' },
        'Priority Reason': { type: 'string', description: 'Why this priority' },
        'ICP Segment': { type: 'string', enum: VALID_ICP_SEGMENTS, description: 'ICP segment' },
        'Opportunity': { type: 'string', description: 'Specific opportunity' },
        'Research Evidence': { type: 'string', description: 'Evidence' },
        'Portfolio Proof': { type: 'string', description: 'Portfolio proof' }
      },
      required: ['Source Prospect ID', 'New Company Name', 'New Contact Name', 'New Contact Email', 'Service', 'Priority', 'Priority Reason', 'ICP Segment', 'Opportunity', 'Research Evidence', 'Portfolio Proof'],
      additionalProperties: false
    }
  }
};

/**
 * Get all tool schemas as an array (for function calling interfaces)
 */
export function getAllToolSchemas() {
  return Object.values(TOOL_SCHEMAS);
}

/**
 * Get a specific tool schema by name
 */
export function getToolSchema(toolName) {
  return TOOL_SCHEMAS[toolName] || null;
}
