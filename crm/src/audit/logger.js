/**
 * Audit Logger
 * 
 * Immutable, append-only audit trail for all CRM mutations.
 * Based on crm/audit-logging.md
 */

import { VALID_ACTORS, VALID_AUDIT_ACTIONS, VALID_ENTITIES } from '../validation/constants.js';

export class AuditLogger {
  /**
   * @param {import('../storage/adapter.js').StorageAdapter} storage
   */
  constructor(storage) {
    this.storage = storage;
  }

  /**
   * Log an audit event
   * @param {Object} event
   * @param {string} event.actor - Agent | Riajul | System
   * @param {string} event.action - CREATE | UPDATE | STAGE_CHANGE | etc.
   * @param {string} event.entityType - Company | Contact | Prospect | etc.
   * @param {string} event.entityId - ID of the changed record
   * @param {string} event.reason - Why the change was made
   * @param {string} [event.field] - Which field changed (for updates)
   * @param {any} [event.previousValue]
   * @param {any} [event.newValue]
   * @param {Object} [event.context] - Additional context
   * @returns {Promise<Object>} The created audit log entry
   */
  async log(event) {
    // Validate required fields
    if (!event.actor) throw new Error('Audit log: actor is required');
    if (!event.action) throw new Error('Audit log: action is required');
    if (!event.entityType) throw new Error('Audit log: entityType is required');
    if (!event.reason) throw new Error('Audit log: reason is required');

    if (!VALID_ACTORS.includes(event.actor)) {
      throw new Error(`Audit log: invalid actor "${event.actor}". Must be: ${VALID_ACTORS.join(', ')}`);
    }

    if (!VALID_AUDIT_ACTIONS.includes(event.action)) {
      throw new Error(`Audit log: invalid action "${event.action}". Must be one of: ${VALID_AUDIT_ACTIONS.join(', ')}`);
    }

    if (!VALID_ENTITIES.includes(event.entityType)) {
      throw new Error(`Audit log: invalid entityType "${event.entityType}". Must be one of: ${VALID_ENTITIES.join(', ')}`);
    }

    const logId = await this.storage.getNextId('Audit Log', 'LOG');

    const entry = {
      'Log ID': logId,
      'Timestamp': new Date().toISOString(),
      'Actor': event.actor,
      'Action': event.action,
      'Entity Type': event.entityType,
      'Entity ID': event.entityId || 'N/A',
      'Field': event.field || '',
      'Previous Value': event.previousValue !== undefined ? String(event.previousValue) : '',
      'New Value': event.newValue !== undefined ? String(event.newValue) : '',
      'Reason': event.reason,
      'Context': event.context ? JSON.stringify(event.context) : ''
    };

    await this.storage.insert('Audit Log', entry);
    return entry;
  }

  /**
   * Log a CREATE event
   */
  async logCreate(actor, entityType, entityId, description, reason) {
    return this.log({
      actor,
      action: 'CREATE',
      entityType,
      entityId,
      newValue: description,
      reason
    });
  }

  /**
   * Log an UPDATE event (per field)
   */
  async logUpdate(actor, entityType, entityId, field, previousValue, newValue, reason) {
    return this.log({
      actor,
      action: 'UPDATE',
      entityType,
      entityId,
      field,
      previousValue,
      newValue,
      reason
    });
  }

  /**
   * Log a STAGE_CHANGE event
   */
  async logStageChange(actor, prospectId, fromStage, toStage, reason) {
    return this.log({
      actor,
      action: 'STAGE_CHANGE',
      entityType: 'Prospect',
      entityId: prospectId,
      field: 'Pipeline Stage',
      previousValue: fromStage,
      newValue: toStage,
      reason
    });
  }

  /**
   * Log a STATUS_CHANGE event
   */
  async logStatusChange(actor, entityType, entityId, fromStatus, toStatus, reason) {
    return this.log({
      actor,
      action: 'STATUS_CHANGE',
      entityType,
      entityId,
      field: 'Status',
      previousValue: fromStatus,
      newValue: toStatus,
      reason
    });
  }

  /**
   * Log a BLOCK event (compliance)
   */
  async logBlock(actor, entityType, entityId, reason, context = {}) {
    return this.log({
      actor,
      action: 'BLOCK',
      entityType,
      entityId,
      newValue: 'Operation blocked',
      reason,
      context
    });
  }

  /**
   * Log a SEND event
   */
  async logSend(actor, conversationId, channel, prospectId, reason) {
    return this.log({
      actor,
      action: 'SEND',
      entityType: 'Conversation',
      entityId: conversationId,
      newValue: `Outbound via ${channel}`,
      reason,
      context: { prospectId }
    });
  }

  /**
   * Log a RECEIVE event
   */
  async logReceive(actor, conversationId, channel, prospectId, reason) {
    return this.log({
      actor,
      action: 'RECEIVE',
      entityType: 'Conversation',
      entityId: conversationId,
      newValue: `Inbound via ${channel}`,
      reason,
      context: { prospectId }
    });
  }

  /**
   * Get audit history for an entity
   */
  async getHistory(entityId) {
    const allLogs = await this.storage.readAll('Audit Log');
    return allLogs.filter(
      entry => entry['Entity ID'] === entityId ||
               (entry.Context && entry.Context.includes(entityId))
    );
  }

  /**
   * Get all DO_NOT_CONTACT events
   */
  async getDoNotContactEvents() {
    const allLogs = await this.storage.readAll('Audit Log');
    return allLogs.filter(
      entry => entry['New Value'] === 'DO_NOT_CONTACT' ||
               (entry.Reason && entry.Reason.includes('DO_NOT_CONTACT'))
    );
  }

  /**
   * Get all blocked operations
   */
  async getBlockedOperations() {
    const allLogs = await this.storage.readAll('Audit Log');
    return allLogs.filter(entry => entry.Action === 'BLOCK');
  }
}

export default AuditLogger;
