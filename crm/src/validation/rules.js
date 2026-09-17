/**
 * Validation Rules
 * 
 * Executable validation functions for all CRM entities.
 * Converts documented rules from validation-rules.md into code.
 */

import {
  VALID_PRIORITIES,
  VALID_ICP_SEGMENTS,
  VALID_SERVICES,
  VALID_PIPELINE_STAGES,
  VALID_STAGE_MODIFIERS,
  VALID_SENTIMENTS,
  VALID_INTEREST_LEVELS,
  VALID_URGENCY_LEVELS,
  VALID_REPLY_CLASSIFICATIONS,
  VALID_MESSAGE_TYPES,
  VALID_CHANNELS,
  VALID_CONTACT_STATUSES,
  VALID_COMPANY_STATUSES,
  VALID_FOLLOWUP_TYPES,
  VALID_FOLLOWUP_STATUSES,
  TOUCHPOINT_LIMITS
} from './constants.js';

/**
 * Validation result
 */
export class ValidationResult {
  constructor() {
    this.errors = [];
  }

  addError(field, message) {
    this.errors.push({ field, message });
  }

  get isValid() {
    return this.errors.length === 0;
  }

  getErrorMessages() {
    return this.errors.map(e => `${e.field}: ${e.message}`);
  }

  toString() {
    if (this.isValid) return 'Valid';
    return `Validation failed:\n${this.getErrorMessages().join('\n')}`;
  }
}

/**
 * Helper: require a field to be present and non-empty
 */
function requireField(data, field, result) {
  if (data[field] === undefined || data[field] === null || data[field] === '') {
    result.addError(field, `${field} is required`);
  }
}

/**
 * Helper: require a field to be one of a set of values
 */
function requireEnum(data, field, validValues, result) {
  const value = data[field];
  if (value !== undefined && value !== null && !validValues.includes(value)) {
    result.addError(field, `${field} must be one of: ${validValues.join(', ')} (got: ${value})`);
  }
}

/**
 * Validate a Company record for creation
 */
export function validateCompanyCreate(data) {
  const result = new ValidationResult();

  requireField(data, 'Company Name', result);

  if (data.Status) {
    requireEnum(data, 'Status', VALID_COMPANY_STATUSES, result);
  }

  return result;
}

/**
 * Validate a Contact record for creation
 */
export function validateContactCreate(data) {
  const result = new ValidationResult();

  requireField(data, 'Company ID', result);

  if (data.Status) {
    requireEnum(data, 'Status', VALID_CONTACT_STATUSES, result);
  }

  return result;
}

/**
 * Validate a Prospect record for creation
 */
export function validateProspectCreate(data) {
  const result = new ValidationResult();

  // Required fields
  requireField(data, 'Contact ID', result);
  requireField(data, 'Company ID', result);
  requireField(data, 'Priority', result);
  requireField(data, 'Priority Reason', result);
  requireField(data, 'ICP Segment', result);
  requireField(data, 'Service', result);
  requireField(data, 'Opportunity', result);
  requireField(data, 'Research Evidence', result);
  requireField(data, 'Portfolio Proof', result);

  // Enum validations
  requireEnum(data, 'Priority', VALID_PRIORITIES, result);
  requireEnum(data, 'ICP Segment', VALID_ICP_SEGMENTS, result);
  requireEnum(data, 'Service', VALID_SERVICES, result);

  // Pipeline Stage defaults to NEW if not provided
  if (data['Pipeline Stage']) {
    requireEnum(data, 'Pipeline Stage', VALID_PIPELINE_STAGES, result);
  }

  // Stage Modifier validation
  if (data['Stage Modifier']) {
    requireEnum(data, 'Stage Modifier', VALID_STAGE_MODIFIERS, result);
  }

  return result;
}

/**
 * Validate a Prospect record for update
 */
export function validateProspectUpdate(data) {
  const result = new ValidationResult();

  // Only validate fields that are present
  if (data.Priority !== undefined) {
    requireEnum(data, 'Priority', VALID_PRIORITIES, result);
  }
  if (data['ICP Segment'] !== undefined) {
    requireEnum(data, 'ICP Segment', VALID_ICP_SEGMENTS, result);
  }
  if (data.Service !== undefined) {
    requireEnum(data, 'Service', VALID_SERVICES, result);
  }
  if (data['Pipeline Stage'] !== undefined) {
    requireEnum(data, 'Pipeline Stage', VALID_PIPELINE_STAGES, result);
  }
  if (data['Stage Modifier'] !== undefined) {
    requireEnum(data, 'Stage Modifier', VALID_STAGE_MODIFIERS, result);
  }
  if (data['Interest Level'] !== undefined) {
    requireEnum(data, 'Interest Level', VALID_INTEREST_LEVELS, result);
  }
  if (data.Sentiment !== undefined) {
    requireEnum(data, 'Sentiment', VALID_SENTIMENTS, result);
  }

  return result;
}

/**
 * Validate a Conversation record for creation
 */
export function validateConversationCreate(data) {
  const result = new ValidationResult();

  requireField(data, 'Prospect ID', result);
  requireField(data, 'Message Type', result);
  requireField(data, 'Message Channel', result);
  requireField(data, 'Message Content', result);

  requireEnum(data, 'Message Type', VALID_MESSAGE_TYPES, result);
  requireEnum(data, 'Message Channel', VALID_CHANNELS, result);

  // Outbound messages must be human-approved
  if (data['Message Type'] === 'Outbound') {
    if (data['Human Approved'] !== true) {
      result.addError('Human Approved', 'Outbound messages must be human-approved before sending');
    }
  }

  return result;
}

/**
 * Validate a Reply Analysis record for creation
 */
export function validateReplyAnalysisCreate(data) {
  const result = new ValidationResult();

  requireField(data, 'Conversation ID', result);
  requireField(data, 'Prospect ID', result);
  requireField(data, 'Reply Content', result);
  requireField(data, 'Classification', result);
  requireField(data, 'Sentiment', result);
  requireField(data, 'Interest Level', result);
  requireField(data, 'Urgency', result);
  requireField(data, 'Recommended Action', result);

  requireEnum(data, 'Classification', VALID_REPLY_CLASSIFICATIONS, result);
  requireEnum(data, 'Sentiment', VALID_SENTIMENTS, result);
  requireEnum(data, 'Interest Level', VALID_INTEREST_LEVELS, result);
  requireEnum(data, 'Urgency', VALID_URGENCY_LEVELS, result);

  return result;
}

/**
 * Validate a Follow-up record for creation
 */
export function validateFollowupCreate(data) {
  const result = new ValidationResult();

  requireField(data, 'Prospect ID', result);
  requireField(data, 'Follow-up Type', result);
  requireField(data, 'Scheduled Date', result);
  requireField(data, 'Follow-up Number', result);
  requireField(data, 'Channel', result);
  requireField(data, 'Value Angle', result);
  requireField(data, 'Draft Content', result);

  requireEnum(data, 'Follow-up Type', VALID_FOLLOWUP_TYPES, result);
  requireEnum(data, 'Channel', VALID_CHANNELS, result);

  // Follow-up number must be 1-3
  if (data['Follow-up Number'] !== undefined) {
    const num = data['Follow-up Number'];
    if (typeof num !== 'number' || num < 1 || num > 3) {
      result.addError('Follow-up Number', 'Follow-up number must be 1, 2, or 3');
    }
  }

  return result;
}

/**
 * Check touchpoint limits for a prospect
 * @param {Object} prospect - The prospect record
 * @param {string} channel - 'Email' or 'LinkedIn'
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function checkTouchpointLimits(prospect, channel) {
  const emailCount = prospect['Email Touchpoints'] || 0;
  const linkedinCount = prospect['LinkedIn Touchpoints'] || 0;
  const totalCount = prospect['Total Touchpoints'] || 0;

  if (channel === 'Email') {
    if (emailCount >= TOUCHPOINT_LIMITS.email) {
      return {
        allowed: false,
        reason: `Email touchpoint limit reached (${emailCount}/${TOUCHPOINT_LIMITS.email}). Move to NURTURE or switch channel.`
      };
    }
  }

  if (channel === 'LinkedIn') {
    if (linkedinCount >= TOUCHPOINT_LIMITS.linkedin) {
      return {
        allowed: false,
        reason: `LinkedIn touchpoint limit reached (${linkedinCount}/${TOUCHPOINT_LIMITS.linkedin}). Move to NURTURE or switch channel.`
      };
    }
  }

  if (totalCount >= TOUCHPOINT_LIMITS.combined) {
    return {
      allowed: false,
      reason: `Combined touchpoint limit reached (${totalCount}/${TOUCHPOINT_LIMITS.combined}). Move to NURTURE.`
    };
  }

  return { allowed: true };
}

/**
 * Check DO_NOT_CONTACT status
 * @param {Object} contact - The contact record
 * @returns {{ blocked: boolean, reason?: string }}
 */
export function checkDoNotContact(contact) {
  if (contact.Status === 'DO_NOT_CONTACT') {
    return {
      blocked: true,
      reason: `Contact ${contact['Contact ID']} is DO_NOT_CONTACT — all outreach blocked`
    };
  }
  return { blocked: false };
}

/**
 * Check for duplicate company by name (case-insensitive)
 * @param {Array} companies - Existing companies
 * @param {string} name - Company name to check
 * @returns {{ duplicate: boolean, existing?: Object }}
 */
export function checkDuplicateCompany(companies, name) {
  const normalizedName = name.trim().toLowerCase();
  const existing = companies.find(
    c => c['Company Name'] && c['Company Name'].trim().toLowerCase() === normalizedName
  );

  if (existing) {
    return { duplicate: true, existing };
  }

  return { duplicate: false };
}

/**
 * Check for duplicate contact by email (case-insensitive)
 * @param {Array} contacts - Existing contacts
 * @param {string} email - Email to check
 * @returns {{ duplicate: boolean, existing?: Object }}
 */
export function checkDuplicateContact(contacts, email) {
  if (!email) return { duplicate: false };

  const normalizedEmail = email.trim().toLowerCase();
  const existing = contacts.find(
    c => c.Email && c.Email.trim().toLowerCase() === normalizedEmail
  );

  if (existing) {
    return { duplicate: true, existing };
  }

  return { duplicate: false };
}

/**
 * Check for duplicate prospect by Contact ID + Service
 * @param {Array} prospects - Existing prospects
 * @param {string} contactId 
 * @param {string} service 
 * @returns {{ duplicate: boolean, existing?: Object }}
 */
export function checkDuplicateProspect(prospects, contactId, service) {
  const existing = prospects.find(
    p => p['Contact ID'] === contactId && p.Service === service
  );

  if (existing) {
    return { duplicate: true, existing };
  }

  return { duplicate: false };
}

export default {
  ValidationResult,
  validateCompanyCreate,
  validateContactCreate,
  validateProspectCreate,
  validateProspectUpdate,
  validateConversationCreate,
  validateReplyAnalysisCreate,
  validateFollowupCreate,
  checkTouchpointLimits,
  checkDoNotContact,
  checkDuplicateCompany,
  checkDuplicateContact,
  checkDuplicateProspect
};
