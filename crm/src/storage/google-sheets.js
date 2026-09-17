/**
 * Google Sheets Storage Adapter
 * 
 * Production storage backend using Google Sheets API.
 * Requires credentials via environment variables.
 * 
 * NOTE: This adapter cannot be tested without live Google Sheets credentials.
 * Unit tests use MemoryAdapter instead.
 */

import { StorageAdapter } from './adapter.js';
import { ID_PREFIXES } from '../validation/constants.js';

export class GoogleSheetsAdapter extends StorageAdapter {
  /**
   * @param {Object} config
   * @param {string} config.spreadsheetId
   * @param {Object} config.credentials - Google service account credentials
   */
  constructor(config) {
    super();
    this.spreadsheetId = config.spreadsheetId;
    this.credentials = config.credentials;
    this.doc = null;
    this._cache = {};
    this._cacheExpiry = {};
    this.CACHE_TTL = 30000; // 30 seconds
  }

  /**
   * Initialize connection to Google Sheets
   */
  async connect() {
    const { GoogleSpreadsheet } = await import('google-spreadsheet');
    const { JWT } = await import('google-auth-library');

    const auth = new JWT({
      email: this.credentials.client_email,
      key: this.credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    this.doc = new GoogleSpreadsheet(this.spreadsheetId, auth);
    await this.doc.loadInfo();
  }

  /**
   * Get a sheet by name, with caching
   */
  async _getSheet(sheetName) {
    if (!this.doc) {
      throw new Error('Google Sheets not connected. Call connect() first.');
    }

    const sheets = Object.values(this.doc.sheetsById);
    const sheet = sheets.find(s => s.title === sheetName);

    if (!sheet) {
      throw new Error(`Sheet not found: ${sheetName}`);
    }

    return sheet;
  }

  /**
   * Read all rows from a sheet
   */
  async readAll(sheetName) {
    const sheet = await this._getSheet(sheetName);
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    return rows.map(row => row.toObject());
  }

  /**
   * Read a single row by ID
   */
  async readById(sheetName, idField, idValue) {
    const rows = await this.readAll(sheetName);
    const row = rows.find(r => r[idField] === idValue);
    return row || null;
  }

  /**
   * Search rows by field value
   */
  async search(sheetName, field, value) {
    const rows = await this.readAll(sheetName);
    return rows.filter(r => r[field] === value);
  }

  /**
   * Insert a new row
   */
  async insert(sheetName, row) {
    const sheet = await this._getSheet(sheetName);
    await sheet.addRow(row);
    return { ...row };
  }

  /**
   * Update an existing row
   */
  async update(sheetName, idField, idValue, updates) {
    const sheet = await this._getSheet(sheetName);
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    const row = rows.find(r => r[idField] === idValue);

    if (!row) {
      throw new Error(`Row not found: ${idField}=${idValue} in ${sheetName}`);
    }

    for (const [key, value] of Object.entries(updates)) {
      row[key] = value !== undefined && value !== null ? String(value) : '';
    }

    await row.save();
    return { ...row.toObject() };
  }

  /**
   * Delete a row (sets Status to Archived)
   */
  async delete(sheetName, idField, idValue) {
    const sheet = await this._getSheet(sheetName);
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    const row = rows.find(r => r[idField] === idValue);

    if (!row) {
      return false;
    }

    // Soft delete: set Status to Archived
    row['Status'] = 'Archived';
    await row.save();
    return true;
  }

  /**
   * Get the next ID for a sheet
   */
  async getNextId(sheetName, prefix) {
    const rows = await this.readAll(sheetName);
    const idField = this._getIdField(sheetName);

    let maxNum = 0;
    for (const row of rows) {
      const id = row[idField];
      if (id && id.startsWith(`${prefix}-`)) {
        const num = parseInt(id.split('-')[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    const nextNum = maxNum + 1;
    return `${prefix}-${String(nextNum).padStart(3, '0')}`;
  }

  /**
   * Initialize CRM structure (create headers if they don't exist)
   */
  async initializeStructure() {
    if (!this.doc) {
      throw new Error('Not connected. Call connect() first.');
    }

    const sheetConfigs = this._getSheetConfigs();

    for (const [sheetName, headers] of Object.entries(sheetConfigs)) {
      let sheet;
      try {
        sheet = await this._getSheet(sheetName);
      } catch {
        // Sheet doesn't exist, create it
        sheet = await this.doc.addSheet({ title: sheetName });
      }

      await sheet.setHeaderRow(headers);
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
      Metrics: 'Metric Date',
      'Audit Log': 'Log ID'
    };
    return idFields[sheetName] || 'ID';
  }

  _getSheetConfigs() {
    return {
      Companies: [
        'Company ID', 'Company Name', 'Website', 'Domain', 'Industry',
        'Country', 'City', 'Company Size', 'LinkedIn Company', 'Instagram',
        'Facebook', 'ICP Segment', 'Notes', 'Status',
        'Created Date', 'Updated Date', 'Created By', 'Source'
      ],
      Contacts: [
        'Contact ID', 'Company ID', 'Contact Name', 'Role', 'Email',
        'Email Verified', 'Email Verified Date', 'LinkedIn',
        'Decision Maker Status', 'Referred By', 'Notes', 'Status',
        'DO_NOT_CONTACT Date', 'DO_NOT_CONTACT Reason',
        'Created Date', 'Updated Date', 'Created By', 'Source'
      ],
      Prospects: [
        'Prospect ID', 'Contact ID', 'Company ID', 'Priority',
        'Priority Reason', 'ICP Segment', 'Service', 'Opportunity',
        'Research Evidence', 'Portfolio Proof', 'Outreach Channel',
        'Outreach Angle', 'Pipeline Stage', 'Stage Modifier',
        'Interest Level', 'Sentiment', 'Objection', 'Buying Signal',
        'Total Touchpoints', 'Email Touchpoints', 'LinkedIn Touchpoints',
        'Last Contact Date', 'Last Reply Date', 'Next Follow-up Date',
        'Stage History', 'Created Date', 'Updated Date', 'Owner',
        'Created By', 'Source'
      ],
      Conversations: [
        'Conversation ID', 'Prospect ID', 'Message Type', 'Message Channel',
        'Message Date', 'Message Subject', 'Message Content',
        'Follow-up Number', 'Human Approved', 'Approved Date',
        'Sent Date', 'Status', 'Notes', 'Created Date'
      ],
      'Reply Analysis': [
        'Analysis ID', 'Conversation ID', 'Prospect ID', 'Reply Date',
        'Reply Content', 'Classification', 'Sentiment', 'Interest Level',
        'Objection', 'Buying Signal', 'Requested Info', 'Urgency',
        'Recommended Action', 'Human Approved', 'Notes', 'Created Date'
      ],
      'Follow-ups': [
        'Follow-up ID', 'Prospect ID', 'Follow-up Type', 'Scheduled Date',
        'Follow-up Number', 'Channel', 'Value Angle', 'Draft Content',
        'Human Approved', 'Sent Date', 'Status', 'Blocked Reason',
        'Notes', 'Created Date'
      ],
      Meetings: [
        'Meeting ID', 'Prospect ID', 'Meeting Date', 'Meeting Time',
        'Duration', 'Timezone', 'Meeting Type', 'Meeting Link',
        'Meeting Notes', 'Outcome', 'Next Action', 'Status',
        'Created Date', 'Updated Date'
      ],
      Proposals: [
        'Proposal ID', 'Prospect ID', 'Proposal Date', 'Proposal Content',
        'Service', 'Price', 'Price Currency', 'Price Frequency',
        'Valid Until', 'Status', 'Notes', 'Created Date', 'Updated Date'
      ],
      Metrics: [
        'Metric Date', 'Prospects Researched', 'Prospects Qualified',
        'Outreach Drafted', 'Outreach Approved', 'Outreach Sent',
        'Replies Received', 'Positive Replies', 'Meetings Scheduled',
        'Proposals Sent', 'Won', 'Lost', 'Nurture',
        'Follow-ups Due', 'Follow-ups Completed',
        'Response Rate', 'Positive Response Rate', 'Meeting Conversion', 'Notes'
      ],
      'Audit Log': [
        'Log ID', 'Timestamp', 'Actor', 'Action', 'Entity Type',
        'Entity ID', 'Field', 'Previous Value', 'New Value',
        'Reason', 'Context'
      ]
    };
  }
}

/**
 * Create adapter from environment variables
 */
export async function createFromEnv() {
  const spreadsheetId = process.env.CRM_SPREADSHEET_ID;
  
  if (!spreadsheetId) {
    throw new Error(
      'CRM_SPREADSHEET_ID not set. ' +
      'Set it in environment or .env file. ' +
      'See crm/.env.example for configuration.'
    );
  }

  // Try to load credentials
  let credentials;

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Load from file
    const fs = await import('fs');
    const credFile = JSON.parse(
      fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8')
    );
    credentials = {
      client_email: credFile.client_email,
      private_key: credFile.private_key
    };
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    credentials = {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n')
    };
  } else {
    throw new Error(
      'Google credentials not configured. ' +
      'Set GOOGLE_APPLICATION_CREDENTIALS or ' +
      'GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_KEY'
    );
  }

  return new GoogleSheetsAdapter({ spreadsheetId, credentials });
}

export default GoogleSheetsAdapter;
