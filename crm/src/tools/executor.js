/**
 * CRM Tool Executor
 * 
 * Secure tool dispatcher that maps agent tool calls to CRMService methods.
 * This is the runtime integration layer between the AI agent and the CRM.
 * 
 * Architecture:
 *   Agent → ToolExecutor → CRMService → StorageAdapter → Google Sheets
 * 
 * Security:
 * - Only registered tools can be called
 * - All inputs are validated against schemas
 * - No arbitrary function execution
 * - No filesystem access through tool arguments
 * - No credential exposure
 * 
 * Design:
 * - Tools are THIN ADAPTERS — no business logic duplication
 * - CRMService remains the final authority for validation
 * - Each tool maps agent-friendly names → CRMService field names
 */

import { TOOL_SCHEMAS, getToolSchema } from './schemas.js';

export class ToolExecutor {
  /**
   * @param {import('../service/crm.js').CRMService} crm
   */
  constructor(crm) {
    this.crm = crm;
    this.tools = new Map();
    this._registerTools();
  }

  /**
   * Register all CRM tools.
   * Maps tool names → { schema, handler }.
   */
  _registerTools() {
    const registrations = [
      // Company operations
      ['create_company', this._createCompany],
      // Contact operations
      ['create_contact', this._createContact],
      ['mark_do_not_contact', this._markDoNotContact],
      ['check_do_not_contact', this._checkDoNotContact],
      // Prospect operations
      ['create_prospect', this._createProspect],
      ['get_prospect', this._getProspect],
      ['search_prospects', this._searchProspects],
      ['update_prospect', this._updateProspect],
      ['update_stage', this._updateStage],
      ['get_prospect_history', this._getProspectHistory],
      // Interaction operations
      ['add_interaction', this._addInteraction],
      ['log_reply_analysis', this._logReplyAnalysis],
      // Follow-up operations
      ['add_follow_up', this._addFollowUp],
      ['complete_follow_up', this._completeFollowUp],
      // Referral operations
      ['add_referral', this._addReferral],
    ];

    for (const [name, handler] of registrations) {
      const schema = TOOL_SCHEMAS[name];
      if (!schema) {
        throw new Error(`No schema found for tool: ${name}`);
      }
      this.tools.set(name, {
        schema,
        handler: handler.bind(this)
      });
    }
  }

  /**
   * Execute a tool
   * @param {string} toolName - Tool name
   * @param {Object} args - Tool arguments (validated against schema)
   * @param {string} actor - Actor performing the action (default: 'Agent')
   * @returns {Promise<Object>} Structured result { success, ...data } or { success: false, error, ... }
   */
  async execute(toolName, args, actor = 'Agent') {
    // 1. Check tool is registered
    if (!this.tools.has(toolName)) {
      return {
        success: false,
        error: `Unknown tool: "${toolName}"`,
        availableTools: Array.from(this.tools.keys())
      };
    }

    // 2. Validate arguments against schema
    const validation = this._validateArguments(toolName, args);
    if (!validation.valid) {
      return {
        success: false,
        error: 'Invalid arguments',
        tool: toolName,
        validationErrors: validation.errors
      };
    }

    // 3. Execute handler (CRMService remains the authority for business rules)
    try {
      const tool = this.tools.get(toolName);
      const result = await tool.handler(args, actor);
      
      // Normalize result: if CRMService returned success: false, propagate it
      // Otherwise wrap with tool metadata
      if (result && result.success === false) {
        return { success: false, tool: toolName, ...result };
      }
      return { success: true, tool: toolName, ...result };
    } catch (error) {
      return {
        success: false,
        tool: toolName,
        error: error.message
      };
    }
  }

  /**
   * Validate tool arguments against its schema.
   * 
   * Checks:
   * - Required fields present
   * - Field types correct
   * - Enum values valid
   * - No unknown fields (when additionalProperties=false)
   */
  _validateArguments(toolName, args) {
    const tool = this.tools.get(toolName);
    const schema = tool.schema.inputSchema;
    const errors = [];

    // Must be an object
    if (typeof args !== 'object' || args === null || Array.isArray(args)) {
      return { valid: false, errors: ['Arguments must be an object'] };
    }

    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (args[field] === undefined || args[field] === null || args[field] === '') {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // Check types and enums for provided fields
    for (const [field, fieldSchema] of Object.entries(schema.properties || {})) {
      const value = args[field];
      if (value === undefined) continue;

      // Type check
      if (fieldSchema.type) {
        if (fieldSchema.type === 'string' && typeof value !== 'string') {
          errors.push(`Field "${field}" must be a string (got ${typeof value})`);
        } else if (fieldSchema.type === 'number' && typeof value !== 'number') {
          errors.push(`Field "${field}" must be a number (got ${typeof value})`);
        } else if (fieldSchema.type === 'boolean' && typeof value !== 'boolean') {
          errors.push(`Field "${field}" must be a boolean (got ${typeof value})`);
        }
      }

      // Enum check
      if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
        errors.push(`Field "${field}" must be one of: ${fieldSchema.enum.join(', ')} (got: ${value})`);
      }
    }

    // Check for unknown fields
    if (schema.additionalProperties === false) {
      const allowedFields = new Set(Object.keys(schema.properties || {}));
      for (const field of Object.keys(args)) {
        if (!allowedFields.has(field)) {
          errors.push(`Unknown field: "${field}"`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get all registered tool names
   */
  getRegisteredTools() {
    return Array.from(this.tools.keys());
  }

  /**
   * Check if a tool is registered
   */
  hasTool(toolName) {
    return this.tools.has(toolName);
  }

  /**
   * Get tool schema for external use (e.g., generating function-calling definitions)
   */
  getToolSchema(toolName) {
    const tool = this.tools.get(toolName);
    return tool ? tool.schema : null;
  }

  // ============================================
  // TOOL HANDLERS — Thin adapters to CRMService
  // No business logic duplication.
  // ============================================

  async _createCompany(args, actor) {
    return await this.crm.createCompany(args, actor);
  }

  async _createContact(args, actor) {
    return await this.crm.createContact(args, actor);
  }

  async _markDoNotContact(args, actor) {
    return await this.crm.markDoNotContact(args['Contact ID'], args.Reason, actor);
  }

  async _checkDoNotContact(args) {
    return await this.crm.checkDoNotContact(args['Contact ID']);
  }

  async _createProspect(args, actor) {
    return await this.crm.createProspect(args, actor);
  }

  async _getProspect(args) {
    const prospect = await this.crm.getProspect(args['Prospect ID']);
    if (!prospect) {
      return { success: false, reason: `Prospect not found: ${args['Prospect ID']}` };
    }
    return { prospect };
  }

  async _searchProspects(args) {
    const results = await this.crm.searchProspects(args.Field, args.Value);
    return { results, count: results.length };
  }

  async _updateProspect(args, actor) {
    const prospectId = args['Prospect ID'];
    const updates = { ...args };
    delete updates['Prospect ID'];
    return await this.crm.updateProspect(prospectId, updates, actor, 'Updated via tool');
  }

  async _updateStage(args, actor) {
    return await this.crm.updateStage(
      args['Prospect ID'],
      args['New Stage'],
      actor,
      args.Reason
    );
  }

  async _getProspectHistory(args) {
    return await this.crm.getProspectHistory(args['Prospect ID']);
  }

  async _addInteraction(args, actor) {
    // Tool args map directly to CRMService addInteraction format
    const data = {
      'Prospect ID': args['Prospect ID'],
      'Message Type': args['Message Type'],
      'Message Channel': args['Message Channel'],
      'Message Content': args['Message Content'],
      'Message Subject': args['Message Subject'] || '',
      'Human Approved': args['Human Approved'] || false
    };
    return await this.crm.addInteraction(data, actor);
  }

  async _logReplyAnalysis(args, actor) {
    // Tool args map directly to CRMService logReplyAnalysis format
    const data = {
      'Conversation ID': args['Conversation ID'],
      'Prospect ID': args['Prospect ID'],
      'Reply Content': args['Reply Content'],
      'Classification': args.Classification,
      'Sentiment': args.Sentiment,
      'Interest Level': args['Interest Level'],
      'Objection': args.Objection || '',
      'Buying Signal': args['Buying Signal'] || '',
      'Urgency': args.Urgency,
      'Recommended Action': args['Recommended Action']
    };
    return await this.crm.logReplyAnalysis(data, actor);
  }

  async _addFollowUp(args, actor) {
    // Tool args map directly to CRMService addFollowUp format
    const data = {
      'Prospect ID': args['Prospect ID'],
      'Follow-up Type': args['Follow-up Type'],
      'Scheduled Date': args['Scheduled Date'],
      'Follow-up Number': args['Follow-up Number'],
      'Channel': args.Channel,
      'Value Angle': args['Value Angle'],
      'Draft Content': args['Draft Content']
    };
    return await this.crm.addFollowUp(data, actor);
  }

  async _completeFollowUp(args, actor) {
    return await this.crm.completeFollowUp(args['Follow-up ID'], actor);
  }

  async _addReferral(args, actor) {
    // Map tool args to CRMService addReferral format
    const data = {
      sourceProspectId: args['Source Prospect ID'],
      referredCompanyName: args['New Company Name'],
      referredContactName: args['New Contact Name'],
      referredEmail: args['New Contact Email'],
      referredRole: args['Referred Role'] || '',
      referredCompanyWebsite: args['Referred Company Website'] || '',
      service: args.Service,
      priority: args.Priority,
      priorityReason: args['Priority Reason'],
      icpSegment: args['ICP Segment'],
      opportunity: args.Opportunity,
      researchEvidence: args['Research Evidence'],
      portfolioProof: args['Portfolio Proof']
    };
    return await this.crm.addReferral(data, actor);
  }
}

export default ToolExecutor;
