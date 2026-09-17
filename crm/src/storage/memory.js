/**
 * In-Memory Storage Adapter
 * 
 * For testing and development. Stores all data in memory.
 * Implements StorageAdapter interface.
 */

import { StorageAdapter } from './adapter.js';

export class MemoryAdapter extends StorageAdapter {
  constructor() {
    super();
    // Initialize empty sheets
    this.sheets = {
      Companies: [],
      Contacts: [],
      Prospects: [],
      Conversations: [],
      'Reply Analysis': [],
      'Follow-ups': [],
      Meetings: [],
      Proposals: [],
      Metrics: [],
      'Audit Log': []
    };
  }

  async readAll(sheetName) {
    this._validateSheet(sheetName);
    return [...this.sheets[sheetName]];
  }

  async readById(sheetName, idField, idValue) {
    this._validateSheet(sheetName);
    const row = this.sheets[sheetName].find(r => r[idField] === idValue);
    return row ? { ...row } : null;
  }

  async search(sheetName, field, value) {
    this._validateSheet(sheetName);
    return this.sheets[sheetName].filter(r => r[field] === value);
  }

  async insert(sheetName, row) {
    this._validateSheet(sheetName);
    const newRow = { ...row };
    this.sheets[sheetName].push(newRow);
    return { ...newRow };
  }

  async update(sheetName, idField, idValue, updates) {
    this._validateSheet(sheetName);
    const index = this.sheets[sheetName].findIndex(r => r[idField] === idValue);
    
    if (index === -1) {
      throw new Error(`Row not found: ${idField}=${idValue} in ${sheetName}`);
    }

    this.sheets[sheetName][index] = {
      ...this.sheets[sheetName][index],
      ...updates
    };

    return { ...this.sheets[sheetName][index] };
  }

  async delete(sheetName, idField, idValue) {
    this._validateSheet(sheetName);
    const index = this.sheets[sheetName].findIndex(r => r[idField] === idValue);
    
    if (index === -1) {
      return false;
    }

    this.sheets[sheetName].splice(index, 1);
    return true;
  }

  async getNextId(sheetName, prefix) {
    this._validateSheet(sheetName);
    const rows = this.sheets[sheetName];
    
    if (rows.length === 0) {
      return `${prefix}-001`;
    }

    // Find highest ID number
    let maxNum = 0;
    for (const row of rows) {
      const idField = this._getIdField(sheetName);
      const id = row[idField];
      if (id && id.startsWith(`${prefix}-`)) {
        const num = parseInt(id.split('-')[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }

    const nextNum = maxNum + 1;
    return `${prefix}-${String(nextNum).padStart(3, '0')}`;
  }

  async clear() {
    for (const sheet in this.sheets) {
      this.sheets[sheet] = [];
    }
  }

  // Helper methods

  _validateSheet(sheetName) {
    if (!this.sheets[sheetName]) {
      throw new Error(`Unknown sheet: ${sheetName}`);
    }
  }

  _getIdField(sheetName) {
    const idFields = {
      Companies: 'Company ID',
      Contacts: 'Contact ID',
      Prospects: 'Prospect ID',
      Conversations: 'Conversation ID',
      'Reply Analysis': 'Analysis ID',
      'Follow-ups': 'Follow-up ID',
      Meetings: 'Meeting ID',
      Proposals: 'Proposal ID',
      'Audit Log': 'Log ID'
    };
    return idFields[sheetName] || 'ID';
  }
}

export default MemoryAdapter;
