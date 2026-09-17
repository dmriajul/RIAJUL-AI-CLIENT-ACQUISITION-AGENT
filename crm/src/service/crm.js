/**
 * CRM Service Layer
 * 
 * Main service providing all CRM operations.
 * Enforces validation, business rules, stage transitions, and audit logging.
 */

import {
  validateProspectCreate,
  validateProspectUpdate,
  validateConversationCreate,
  validateReplyAnalysisCreate,
  validateFollowupCreate,
  validateCompanyCreate,
  validateContactCreate,
  checkTouchpointLimits,
  checkDoNotContact,
  checkDuplicateCompany,
  checkDuplicateContact,
  checkDuplicateProspect
} from '../validation/rules.js';

import { validateStageTransition, isOutboundStage } from '../validation/stages.js';
import { VALID_PIPELINE_STAGES } from '../validation/constants.js';
import { AuditLogger } from '../audit/logger.js';

export class CRMService {
  /**
   * @param {import('../storage/adapter.js').StorageAdapter} storage
   */
  constructor(storage) {
    this.storage = storage;
    this.audit = new AuditLogger(storage);
  }

  // ============================================
  // COMPANY OPERATIONS
  // ============================================

  /**
   * Create a new company
   */
  async createCompany(data, actor = 'Agent') {
    // Validate
    const validation = validateCompanyCreate(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.toString()}`);
    }

    // Check duplicate
    const companies = await this.storage.readAll('Companies');
    const duplicate = checkDuplicateCompany(companies, data['Company Name']);
    if (duplicate.duplicate) {
      await this.audit.logBlock(
        actor,
        'Company',
        null,
        `Duplicate company detected: "${data['Company Name']}" already exists as ${duplicate.existing['Company ID']}`,
        { attemptedName: data['Company Name'], existingId: duplicate.existing['Company ID'] }
      );
      return {
        success: false,
        blocked: true,
        reason: 'Duplicate company',
        existingCompanyId: duplicate.existing['Company ID'],
        existingCompanyName: duplicate.existing['Company Name']
      };
    }

    // Generate ID
    const companyId = await this.storage.getNextId('Companies', 'COMP');
    const now = new Date().toISOString().split('T')[0];

    const record = {
      'Company ID': companyId,
      'Company Name': data['Company Name'],
      'Website': data.Website || '',
      'Domain': data.Domain || this._extractDomain(data.Website),
      'Industry': data.Industry || '',
      'Country': data.Country || '',
      'City': data.City || '',
      'Company Size': data['Company Size'] || '',
      'LinkedIn Company': data['LinkedIn Company'] || '',
      'Instagram': data.Instagram || '',
      'Facebook': data.Facebook || '',
      'ICP Segment': data['ICP Segment'] || '',
      'Notes': data.Notes || '',
      'Status': data.Status || 'Active',
      'Created Date': now,
      'Updated Date': now,
      'Created By': actor,
      'Source': data.Source || ''
    };

    await this.storage.insert('Companies', record);

    // Audit log
    await this.audit.logCreate(
      actor,
      'Company',
      companyId,
      data['Company Name'],
      data._reason || 'New company created'
    );

    return { success: true, companyId, company: record };
  }

  /**
   * Get a company by ID
   */
  async getCompany(companyId) {
    return this.storage.readById('Companies', 'Company ID', companyId);
  }

  /**
   * Search companies
   */
  async searchCompanies(field, value) {
    return this.storage.search('Companies', field, value);
  }

  // ============================================
  // CONTACT OPERATIONS
  // ============================================

  /**
   * Create a new contact
   */
  async createContact(data, actor = 'Agent') {
    // Validate
    const validation = validateContactCreate(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.toString()}`);
    }

    // Check company exists
    const company = await this.getCompany(data['Company ID']);
    if (!company) {
      throw new Error(`Company not found: ${data['Company ID']}`);
    }

    // Check duplicate email
    if (data.Email) {
      const contacts = await this.storage.readAll('Contacts');
      const duplicate = checkDuplicateContact(contacts, data.Email);
      if (duplicate.duplicate) {
        return {
          success: false,
          blocked: true,
          reason: 'Duplicate email',
          existingContactId: duplicate.existing['Contact ID'],
          existingEmail: duplicate.existing.Email
        };
      }
    }

    // Generate ID
    const contactId = await this.storage.getNextId('Contacts', 'CONT');
    const now = new Date().toISOString().split('T')[0];

    const record = {
      'Contact ID': contactId,
      'Company ID': data['Company ID'],
      'Contact Name': data['Contact Name'] || 'Not verified',
      'Role': data.Role || '',
      'Email': data.Email || '',
      'Email Verified': data['Email Verified'] || false,
      'Email Verified Date': data['Email Verified Date'] || '',
      'LinkedIn': data.LinkedIn || '',
      'Decision Maker Status': data['Decision Maker Status'] || 'Unknown',
      'Referred By': data['Referred By'] || '',
      'Notes': data.Notes || '',
      'Status': data.Status || 'Active',
      'DO_NOT_CONTACT Date': '',
      'DO_NOT_CONTACT Reason': '',
      'Created Date': now,
      'Updated Date': now,
      'Created By': actor,
      'Source': data.Source || ''
    };

    await this.storage.insert('Contacts', record);

    await this.audit.logCreate(
      actor,
      'Contact',
      contactId,
      `${record['Contact Name']} for ${company['Company Name']}`,
      data._reason || 'New contact added'
    );

    return { success: true, contactId, contact: record };
  }

  /**
   * Get a contact by ID
   */
  async getContact(contactId) {
    return this.storage.readById('Contacts', 'Contact ID', contactId);
  }

  /**
   * Mark a contact as DO_NOT_CONTACT
   */
  async markDoNotContact(contactId, reason, actor = 'Riajul') {
    const contact = await this.getContact(contactId);
    if (!contact) {
      throw new Error(`Contact not found: ${contactId}`);
    }

    if (contact.Status === 'DO_NOT_CONTACT') {
      return {
        success: true,
        warning: 'Already DO_NOT_CONTACT',
        originalDate: contact['DO_NOT_CONTACT Date']
      };
    }

    const now = new Date().toISOString().split('T')[0];

    await this.storage.update('Contacts', 'Contact ID', contactId, {
      'Status': 'DO_NOT_CONTACT',
      'DO_NOT_CONTACT Date': now,
      'DO_NOT_CONTACT Reason': reason,
      'Updated Date': now
    });

    // Audit
    await this.audit.logStatusChange(
      actor,
      'Contact',
      contactId,
      'Active',
      'DO_NOT_CONTACT',
      reason
    );

    // Block all scheduled follow-ups for prospects linked to this contact
    const prospects = await this.storage.readAll('Prospects');
    const linkedProspects = prospects.filter(p => p['Contact ID'] === contactId);
    let blockedCount = 0;

    for (const prospect of linkedProspects) {
      const followups = await this.storage.readAll('Follow-ups');
      const scheduled = followups.filter(
        fu => fu['Prospect ID'] === prospect['Prospect ID'] && fu.Status === 'Scheduled'
      );

      for (const fu of scheduled) {
        await this.storage.update('Follow-ups', 'Follow-up ID', fu['Follow-up ID'], {
          'Status': 'Blocked',
          'Blocked Reason': 'DO_NOT_CONTACT'
        });
        blockedCount++;
      }

      // Update prospect modifier
      await this.storage.update('Prospects', 'Prospect ID', prospect['Prospect ID'], {
        'Stage Modifier': 'DO_NOT_CONTACT',
        'Updated Date': now
      });
    }

    return {
      success: true,
      contactId,
      status: 'DO_NOT_CONTACT',
      blockedFollowups: blockedCount
    };
  }

  /**
   * Check if a contact is DO_NOT_CONTACT
   */
  async checkDoNotContact(contactId) {
    const contact = await this.getContact(contactId);
    if (!contact) {
      throw new Error(`Contact not found: ${contactId}`);
    }
    return checkDoNotContact(contact);
  }

  // ============================================
  // PROSPECT OPERATIONS
  // ============================================

  /**
   * Create a new prospect
   */
  async createProspect(data, actor = 'Agent') {
    // Validate
    const validation = validateProspectCreate(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.toString()}`);
    }

    // Check contact exists
    const contact = await this.getContact(data['Contact ID']);
    if (!contact) {
      throw new Error(`Contact not found: ${data['Contact ID']}`);
    }

    // Check company exists
    const company = await this.getCompany(data['Company ID']);
    if (!company) {
      throw new Error(`Company not found: ${data['Company ID']}`);
    }

    // Check relationship integrity
    if (contact['Company ID'] !== data['Company ID']) {
      throw new Error(
        `Company mismatch: Contact ${data['Contact ID']} belongs to ${contact['Company ID']}, not ${data['Company ID']}`
      );
    }

    // Check duplicate (same contact + service)
    const prospects = await this.storage.readAll('Prospects');
    const duplicate = checkDuplicateProspect(prospects, data['Contact ID'], data.Service);
    if (duplicate.duplicate) {
      return {
        success: false,
        blocked: true,
        reason: 'Duplicate prospect (same contact + service)',
        existingProspectId: duplicate.existing['Prospect ID']
      };
    }

    // Generate ID
    const prospectId = await this.storage.getNextId('Prospects', 'PRO');
    const now = new Date().toISOString().split('T')[0];
    const stage = data['Pipeline Stage'] || 'NEW';

    const record = {
      'Prospect ID': prospectId,
      'Contact ID': data['Contact ID'],
      'Company ID': data['Company ID'],
      'Priority': data.Priority,
      'Priority Reason': data['Priority Reason'],
      'ICP Segment': data['ICP Segment'],
      'Service': data.Service,
      'Opportunity': data.Opportunity,
      'Research Evidence': data['Research Evidence'],
      'Portfolio Proof': data['Portfolio Proof'],
      'Outreach Channel': data['Outreach Channel'] || '',
      'Outreach Angle': data['Outreach Angle'] || '',
      'Pipeline Stage': stage,
      'Stage Modifier': data['Stage Modifier'] || null,
      'Interest Level': data['Interest Level'] || '',
      'Sentiment': data.Sentiment || '',
      'Objection': data.Objection || '',
      'Buying Signal': data['Buying Signal'] || '',
      'Total Touchpoints': 0,
      'Email Touchpoints': 0,
      'LinkedIn Touchpoints': 0,
      'Last Contact Date': '',
      'Last Reply Date': '',
      'Next Follow-up Date': '',
      'Stage History': JSON.stringify([{ stage, date: now, reason: 'Prospect created' }]),
      'Created Date': now,
      'Updated Date': now,
      'Owner': data.Owner || 'Riajul',
      'Created By': actor,
      'Source': data.Source || ''
    };

    await this.storage.insert('Prospects', record);

    await this.audit.logCreate(
      actor,
      'Prospect',
      prospectId,
      `${data.Priority} priority ${data.Service} for ${company['Company Name']}`,
      data._reason || 'New prospect created'
    );

    return { success: true, prospectId, prospect: record };
  }

  /**
   * Get a prospect by ID
   */
  async getProspect(prospectId) {
    return this.storage.readById('Prospects', 'Prospect ID', prospectId);
  }

  /**
   * Search prospects
   */
  async searchProspects(field, value) {
    return this.storage.search('Prospects', field, value);
  }

  /**
   * Update a prospect
   */
  async updateProspect(prospectId, updates, actor = 'Agent', reason = 'Updated') {
    const prospect = await this.getProspect(prospectId);
    if (!prospect) {
      throw new Error(`Prospect not found: ${prospectId}`);
    }

    // Validate updates
    const validation = validateProspectUpdate(updates);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.toString()}`);
    }

    const now = new Date().toISOString().split('T')[0];
    const changes = { ...updates, 'Updated Date': now };

    // Log each changed field
    for (const [field, newValue] of Object.entries(updates)) {
      if (prospect[field] !== newValue) {
        await this.audit.logUpdate(
          actor,
          'Prospect',
          prospectId,
          field,
          prospect[field],
          newValue,
          reason
        );
      }
    }

    const updated = await this.storage.update('Prospects', 'Prospect ID', prospectId, changes);
    return { success: true, prospect: updated };
  }

  /**
   * Update pipeline stage
   */
  async updateStage(prospectId, newStage, actor = 'Agent', reason = '') {
    if (!reason) {
      throw new Error('Stage change requires a reason');
    }

    const prospect = await this.getProspect(prospectId);
    if (!prospect) {
      throw new Error(`Prospect not found: ${prospectId}`);
    }

    const currentStage = prospect['Pipeline Stage'];

    // Validate transition
    const transition = validateStageTransition(currentStage, newStage);
    if (!transition.valid) {
      await this.audit.logBlock(
        actor,
        'Prospect',
        prospectId,
        transition.reason,
        { currentStage, requestedStage: newStage, allowedStages: transition.allowedStages }
      );
      return {
        success: false,
        blocked: true,
        reason: transition.reason,
        currentStage,
        allowedStages: transition.allowedStages
      };
    }

    // Check DO_NOT_CONTACT compliance for outbound stages
    if (isOutboundStage(newStage)) {
      const contact = await this.getContact(prospect['Contact ID']);
      const dnc = checkDoNotContact(contact);
      if (dnc.blocked) {
        await this.audit.logBlock(
          actor,
          'Prospect',
          prospectId,
          `Cannot move to ${newStage}: ${dnc.reason}`,
          { contactId: prospect['Contact ID'] }
        );
        return {
          success: false,
          blocked: true,
          reason: dnc.reason
        };
      }
    }

    // Update stage
    const now = new Date().toISOString().split('T')[0];
    const history = JSON.parse(prospect['Stage History'] || '[]');
    history.push({ stage: newStage, date: now, reason });

    const updated = await this.storage.update('Prospects', 'Prospect ID', prospectId, {
      'Pipeline Stage': newStage,
      'Stage History': JSON.stringify(history),
      'Updated Date': now
    });

    // Audit
    await this.audit.logStageChange(actor, prospectId, currentStage, newStage, reason);

    return { success: true, prospect: updated, from: currentStage, to: newStage };
  }

  /**
   * Get complete prospect history
   */
  async getProspectHistory(prospectId) {
    const prospect = await this.getProspect(prospectId);
    if (!prospect) {
      throw new Error(`Prospect not found: ${prospectId}`);
    }

    const contact = await this.getContact(prospect['Contact ID']);
    const company = await this.getCompany(prospect['Company ID']);
    const conversations = await this.storage.search('Conversations', 'Prospect ID', prospectId);
    const followups = await this.storage.search('Follow-ups', 'Prospect ID', prospectId);
    const meetings = await this.storage.search('Meetings', 'Prospect ID', prospectId);
    const proposals = await this.storage.search('Proposals', 'Prospect ID', prospectId);
    const auditTrail = await this.audit.getHistory(prospectId);

    return {
      prospect,
      contact,
      company,
      conversations: conversations.sort((a, b) => (a['Message Date'] || '').localeCompare(b['Message Date'] || '')),
      followups,
      meetings,
      proposals,
      auditTrail,
      summary: {
        totalTouchpoints: prospect['Total Touchpoints'] || 0,
        pipelineStage: prospect['Pipeline Stage'],
        lastActivity: prospect['Last Contact Date'] || prospect['Last Reply Date'] || 'None',
        stageHistory: JSON.parse(prospect['Stage History'] || '[]')
      }
    };
  }

  // ============================================
  // CONVERSATION / INTERACTION OPERATIONS
  // ============================================

  /**
   * Log an outbound interaction (outreach)
   */
  async addInteraction(data, actor = 'Agent') {
    // Validate
    const validation = validateConversationCreate(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.toString()}`);
    }

    const prospect = await this.getProspect(data['Prospect ID']);
    if (!prospect) {
      throw new Error(`Prospect not found: ${data['Prospect ID']}`);
    }

    // DO_NOT_CONTACT check for outbound
    if (data['Message Type'] === 'Outbound') {
      const contact = await this.getContact(prospect['Contact ID']);
      const dnc = checkDoNotContact(contact);
      if (dnc.blocked) {
        await this.audit.logBlock(
          actor,
          'Conversation',
          null,
          dnc.reason,
          { prospectId: data['Prospect ID'] }
        );
        return {
          success: false,
          blocked: true,
          reason: dnc.reason
        };
      }

      // Touchpoint limits
      const tpCheck = checkTouchpointLimits(prospect, data['Message Channel']);
      if (!tpCheck.allowed) {
        await this.audit.logBlock(
          actor,
          'Conversation',
          null,
          tpCheck.reason,
          { prospectId: data['Prospect ID'] }
        );
        return {
          success: false,
          blocked: true,
          reason: tpCheck.reason
        };
      }
    }

    // Create conversation
    const convId = await this.storage.getNextId('Conversations', 'CONV');
    const now = new Date().toISOString().split('T')[0];

    const record = {
      'Conversation ID': convId,
      'Prospect ID': data['Prospect ID'],
      'Message Type': data['Message Type'],
      'Message Channel': data['Message Channel'],
      'Message Date': data['Message Date'] || now,
      'Message Subject': data['Message Subject'] || '',
      'Message Content': data['Message Content'],
      'Follow-up Number': data['Follow-up Number'] || '',
      'Human Approved': data['Human Approved'] || false,
      'Approved Date': data['Approved Date'] || '',
      'Sent Date': data['Sent Date'] || now,
      'Status': data['Status'] || (data['Message Type'] === 'Inbound' ? 'Received' : 'Sent'),
      'Notes': data.Notes || '',
      'Created Date': now
    };

    await this.storage.insert('Conversations', record);

    // Update prospect touchpoints (outbound only)
    if (data['Message Type'] === 'Outbound') {
      const updates = {
        'Total Touchpoints': (prospect['Total Touchpoints'] || 0) + 1,
        'Last Contact Date': now,
        'Updated Date': now
      };

      if (data['Message Channel'] === 'Email') {
        updates['Email Touchpoints'] = (prospect['Email Touchpoints'] || 0) + 1;
      } else {
        updates['LinkedIn Touchpoints'] = (prospect['LinkedIn Touchpoints'] || 0) + 1;
      }

      await this.storage.update('Prospects', 'Prospect ID', data['Prospect ID'], updates);
    }

    // Update for inbound
    if (data['Message Type'] === 'Inbound') {
      await this.storage.update('Prospects', 'Prospect ID', data['Prospect ID'], {
        'Last Reply Date': now,
        'Updated Date': now
      });
    }

    // Audit
    if (data['Message Type'] === 'Outbound') {
      await this.audit.logSend(actor, convId, data['Message Channel'], data['Prospect ID'], 'Outreach sent');
    } else {
      await this.audit.logReceive(actor, convId, data['Message Channel'], data['Prospect ID'], 'Reply received');
    }

    return { success: true, conversationId: convId, conversation: record };
  }

  /**
   * Log a reply analysis
   */
  async logReplyAnalysis(data, actor = 'Agent') {
    const validation = validateReplyAnalysisCreate(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.toString()}`);
    }

    const analysisId = await this.storage.getNextId('Reply Analysis', 'ANAL');
    const now = new Date().toISOString().split('T')[0];

    const record = {
      'Analysis ID': analysisId,
      'Conversation ID': data['Conversation ID'],
      'Prospect ID': data['Prospect ID'],
      'Reply Date': data['Reply Date'] || now,
      'Reply Content': data['Reply Content'],
      'Classification': data.Classification,
      'Sentiment': data.Sentiment,
      'Interest Level': data['Interest Level'],
      'Objection': data.Objection || '',
      'Buying Signal': data['Buying Signal'] || '',
      'Requested Info': data['Requested Info'] || '',
      'Urgency': data.Urgency,
      'Recommended Action': data['Recommended Action'],
      'Human Approved': data['Human Approved'] || false,
      'Notes': data.Notes || '',
      'Created Date': now
    };

    await this.storage.insert('Reply Analysis', record);

    // Update prospect fields
    await this.storage.update('Prospects', 'Prospect ID', data['Prospect ID'], {
      'Interest Level': data['Interest Level'],
      'Sentiment': data.Sentiment,
      'Objection': data.Objection || '',
      'Buying Signal': data['Buying Signal'] || '',
      'Updated Date': now
    });

    await this.audit.logCreate(
      actor,
      'ReplyAnalysis',
      analysisId,
      `Classification: ${data.Classification}, Sentiment: ${data.Sentiment}`,
      'Reply analyzed'
    );

    return { success: true, analysisId, analysis: record };
  }

  // ============================================
  // FOLLOW-UP OPERATIONS
  // ============================================

  /**
   * Create a follow-up
   */
  async addFollowUp(data, actor = 'Agent') {
    const validation = validateFollowupCreate(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.toString()}`);
    }

    const prospect = await this.getProspect(data['Prospect ID']);
    if (!prospect) {
      throw new Error(`Prospect not found: ${data['Prospect ID']}`);
    }

    // DO_NOT_CONTACT check
    const contact = await this.getContact(prospect['Contact ID']);
    const dnc = checkDoNotContact(contact);
    
    const now = new Date().toISOString().split('T')[0];
    const fuId = await this.storage.getNextId('Follow-ups', 'FU');

    if (dnc.blocked) {
      // Create as blocked
      const record = {
        'Follow-up ID': fuId,
        'Prospect ID': data['Prospect ID'],
        'Follow-up Type': data['Follow-up Type'],
        'Scheduled Date': data['Scheduled Date'],
        'Follow-up Number': data['Follow-up Number'],
        'Channel': data.Channel,
        'Value Angle': data['Value Angle'],
        'Draft Content': data['Draft Content'],
        'Human Approved': false,
        'Sent Date': '',
        'Status': 'Blocked',
        'Blocked Reason': dnc.reason,
        'Notes': data.Notes || '',
        'Created Date': now
      };

      await this.storage.insert('Follow-ups', record);

      await this.audit.logBlock(
        'System',
        'Followup',
        fuId,
        dnc.reason,
        { prospectId: data['Prospect ID'] }
      );

      return { success: false, blocked: true, reason: dnc.reason, followupId: fuId, status: 'Blocked' };
    }

    // Touchpoint check
    const tpCheck = checkTouchpointLimits(prospect, data.Channel);
    if (!tpCheck.allowed) {
      const record = {
        'Follow-up ID': fuId,
        'Prospect ID': data['Prospect ID'],
        'Follow-up Type': data['Follow-up Type'],
        'Scheduled Date': data['Scheduled Date'],
        'Follow-up Number': data['Follow-up Number'],
        'Channel': data.Channel,
        'Value Angle': data['Value Angle'],
        'Draft Content': data['Draft Content'],
        'Human Approved': false,
        'Sent Date': '',
        'Status': 'Blocked',
        'Blocked Reason': tpCheck.reason,
        'Notes': data.Notes || '',
        'Created Date': now
      };

      await this.storage.insert('Follow-ups', record);

      return { success: false, blocked: true, reason: tpCheck.reason, followupId: fuId, status: 'Blocked' };
    }

    // Create normally
    const record = {
      'Follow-up ID': fuId,
      'Prospect ID': data['Prospect ID'],
      'Follow-up Type': data['Follow-up Type'],
      'Scheduled Date': data['Scheduled Date'],
      'Follow-up Number': data['Follow-up Number'],
      'Channel': data.Channel,
      'Value Angle': data['Value Angle'],
      'Draft Content': data['Draft Content'],
      'Human Approved': false,
      'Sent Date': '',
      'Status': 'Scheduled',
      'Blocked Reason': '',
      'Notes': data.Notes || '',
      'Created Date': now
    };

    await this.storage.insert('Follow-ups', record);

    // Update prospect next follow-up date
    await this.storage.update('Prospects', 'Prospect ID', data['Prospect ID'], {
      'Next Follow-up Date': data['Scheduled Date'],
      'Updated Date': now
    });

    await this.audit.log({
      actor,
      action: 'SCHEDULE',
      entityType: 'Followup',
      entityId: fuId,
      newValue: `Follow-up #${data['Follow-up Number']} scheduled for ${data['Scheduled Date']}`,
      reason: data['Follow-up Type']
    });

    return { success: true, followupId: fuId, followup: record };
  }

  /**
   * Complete a follow-up (mark as sent)
   */
  async completeFollowUp(followupId, actor = 'Agent') {
    const fu = await this.storage.readById('Follow-ups', 'Follow-up ID', followupId);
    if (!fu) {
      throw new Error(`Follow-up not found: ${followupId}`);
    }

    if (fu.Status === 'Sent') {
      return { success: false, reason: 'Already completed' };
    }
    if (fu.Status === 'Blocked') {
      return { success: false, reason: `Follow-up is blocked: ${fu['Blocked Reason']}` };
    }

    const now = new Date().toISOString().split('T')[0];

    await this.storage.update('Follow-ups', 'Follow-up ID', followupId, {
      'Status': 'Sent',
      'Sent Date': now
    });

    await this.audit.log({
      actor,
      action: 'COMPLETE',
      entityType: 'Followup',
      entityId: followupId,
      field: 'Status',
      previousValue: fu.Status,
      newValue: 'Sent',
      reason: 'Follow-up sent'
    });

    return { success: true, followupId };
  }

  // ============================================
  // REFERRAL OPERATIONS
  // ============================================

  /**
   * Add a referral from an existing prospect
   */
  async addReferral(data, actor = 'Agent') {
    const {
      sourceProspectId,
      referredCompanyName,
      referredContactName,
      referredEmail,
      referredRole,
      referredCompanyWebsite,
      service,
      priority,
      priorityReason,
      icpSegment,
      opportunity,
      researchEvidence,
      portfolioProof
    } = data;

    // Validate source prospect exists
    const sourceProspect = await this.getProspect(sourceProspectId);
    if (!sourceProspect) {
      throw new Error(`Source prospect not found: ${sourceProspectId}`);
    }

    const sourceContact = await this.getContact(sourceProspect['Contact ID']);

    // Create company
    const companyResult = await this.createCompany({
      'Company Name': referredCompanyName,
      'Website': referredCompanyWebsite || '',
      Source: `Referral from ${sourceContact['Contact Name']}`,
      _reason: `Referral from prospect ${sourceProspectId}`
    }, actor);

    const companyId = companyResult.companyId || companyResult.existingCompanyId;

    // Create contact
    const contactResult = await this.createContact({
      'Company ID': companyId,
      'Contact Name': referredContactName || 'Not verified',
      'Role': referredRole || '',
      'Email': referredEmail || '',
      'Referred By': sourceContact['Contact Name'],
      _reason: `Referral from prospect ${sourceProspectId}`
    }, actor);

    const contactId = contactResult.contactId;

    // Create prospect
    const prospectResult = await this.createProspect({
      'Contact ID': contactId,
      'Company ID': companyId,
      'Priority': priority || 'B',
      'Priority Reason': priorityReason || `Referred by ${sourceContact['Contact Name']}`,
      'ICP Segment': icpSegment || 'Secondary',
      'Service': service || sourceProspect.Service,
      'Opportunity': opportunity || 'Not verified — referred prospect',
      'Research Evidence': researchEvidence || 'Not verified — pending research',
      'Portfolio Proof': portfolioProof || 'Not verified — pending research',
      'Stage Modifier': 'REFERRED',
      _reason: `Referral from prospect ${sourceProspectId}`
    }, actor);

    // Update source prospect
    await this.storage.update('Prospects', 'Prospect ID', sourceProspectId, {
      'Stage Modifier': 'REFERRED',
      'Updated Date': new Date().toISOString().split('T')[0]
    });

    return {
      success: true,
      companyId,
      contactId,
      prospectId: prospectResult.prospectId,
      sourceProspectId
    };
  }

  // ============================================
  // MERGE OPERATIONS
  // ============================================

  /**
   * Merge duplicate company records
   */
  async mergeCompanies(primaryId, duplicateId, actor = 'Agent') {
    const primary = await this.getCompany(primaryId);
    const duplicate = await this.getCompany(duplicateId);

    if (!primary) throw new Error(`Primary company not found: ${primaryId}`);
    if (!duplicate) throw new Error(`Duplicate company not found: ${duplicateId}`);

    // Merge: fill empty fields in primary from duplicate
    const updates = {};
    const mergeableFields = [
      'Website', 'Domain', 'Industry', 'Country', 'City',
      'Company Size', 'LinkedIn Company', 'Instagram', 'Facebook',
      'ICP Segment', 'Notes', 'Source'
    ];

    for (const field of mergeableFields) {
      if ((!primary[field] || primary[field] === '') && duplicate[field] && duplicate[field] !== '') {
        updates[field] = duplicate[field];
      }
    }

    if (Object.keys(updates).length > 0) {
      updates['Updated Date'] = new Date().toISOString().split('T')[0];
      await this.storage.update('Companies', 'Company ID', primaryId, updates);
    }

    // Update all contacts to point to primary
    const contacts = await this.storage.readAll('Contacts');
    const dupContacts = contacts.filter(c => c['Company ID'] === duplicateId);
    let refsUpdated = 0;

    for (const contact of dupContacts) {
      await this.storage.update('Contacts', 'Contact ID', contact['Contact ID'], {
        'Company ID': primaryId
      });
      refsUpdated++;
    }

    // Archive duplicate
    await this.storage.update('Companies', 'Company ID', duplicateId, {
      'Status': 'Duplicate',
      'Updated Date': new Date().toISOString().split('T')[0]
    });

    // Audit
    await this.audit.log({
      actor,
      action: 'MERGE',
      entityType: 'Company',
      entityId: primaryId,
      reason: `Merged duplicate ${duplicateId} into ${primaryId}`,
      context: { duplicateId, fieldsUpdated: Object.keys(updates).length }
    });

    await this.audit.log({
      actor,
      action: 'ARCHIVE',
      entityType: 'Company',
      entityId: duplicateId,
      reason: `Merged into ${primaryId}`
    });

    return {
      success: true,
      primaryId,
      duplicateId,
      fieldsMerged: Object.keys(updates).length,
      referencesUpdated: refsUpdated
    };
  }

  // ============================================
  // MIGRATION
  // ============================================

  /**
   * Migrate test prospects from audit data
   */
  async migrateProspects(prospects, actor = 'System') {
    const results = {
      companies: { created: 0, skipped: 0 },
      contacts: { created: 0, skipped: 0 },
      prospects: { created: 0, skipped: 0 },
      auditEntries: 0,
      errors: []
    };

    for (const p of prospects) {
      try {
        // Create company
        const companyResult = await this.createCompany({
          'Company Name': p.company.name,
          'Website': p.company.website || '',
          'Industry': p.company.industry || '',
          'Country': p.company.country || '',
          'City': p.company.city || '',
          'ICP Segment': p.icpSegment || '',
          'Notes': p.company.notes || '',
          Source: 'Migration from test data',
          _reason: 'Migration from test data'
        }, actor);

        const companyId = companyResult.companyId || companyResult.existingCompanyId;
        if (companyResult.companyId) {
          results.companies.created++;
        } else {
          results.companies.skipped++;
        }

        // Create contact
        const contactResult = await this.createContact({
          'Company ID': companyId,
          'Contact Name': p.contact.name || 'Not verified',
          'Role': p.contact.role || '',
          'Decision Maker Status': p.contact.decisionMakerStatus || 'Unknown',
          'Notes': p.contact.notes || '',
          Source: 'Migration from test data',
          _reason: 'Migration from test data'
        }, actor);

        const contactId = contactResult.contactId || contactResult.existingContactId;
        if (contactResult.contactId) {
          results.contacts.created++;
        } else {
          results.contacts.skipped++;
        }

        // Create prospect
        const prospectResult = await this.createProspect({
          'Contact ID': contactId,
          'Company ID': companyId,
          'Priority': p.priority,
          'Priority Reason': p.priorityReason,
          'ICP Segment': p.icpSegment,
          'Service': p.service,
          'Opportunity': p.opportunity,
          'Research Evidence': p.researchEvidence,
          'Portfolio Proof': p.portfolioProof,
          'Pipeline Stage': p.pipelineStage || 'QUALIFIED',
          'Outreach Channel': p.outreachChannel || '',
          Source: 'Migration from test data',
          _reason: 'Migration from test data'
        }, actor);

        if (prospectResult.prospectId) {
          results.prospects.created++;
        } else {
          results.prospects.skipped++;
        }
      } catch (err) {
        results.errors.push({ company: p.company.name, error: err.message });
      }
    }

    results.auditEntries = (await this.storage.readAll('Audit Log')).length;

    return results;
  }

  // ============================================
  // UTILITIES
  // ============================================

  _extractDomain(website) {
    if (!website) return '';
    try {
      const url = new URL(website);
      return url.hostname;
    } catch {
      return '';
    }
  }
}

export default CRMService;
