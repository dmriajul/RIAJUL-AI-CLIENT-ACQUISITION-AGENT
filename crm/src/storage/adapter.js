/**
 * Storage Adapter Interface
 * 
 * Defines the contract for CRM storage backends.
 * Implementations: MemoryAdapter (testing), GoogleSheetsAdapter (production)
 */

export class StorageAdapter {
  /**
   * Read all rows from a sheet
   * @param {string} sheetName 
   * @returns {Promise<Array<Object>>}
   */
  async readAll(sheetName) {
    throw new Error('Not implemented');
  }

  /**
   * Read a single row by ID
   * @param {string} sheetName 
   * @param {string} idField 
   * @param {string} idValue 
   * @returns {Promise<Object|null>}
   */
  async readById(sheetName, idField, idValue) {
    throw new Error('Not implemented');
  }

  /**
   * Search rows by field value
   * @param {string} sheetName 
   * @param {string} field 
   * @param {any} value 
   * @returns {Promise<Array<Object>>}
   */
  async search(sheetName, field, value) {
    throw new Error('Not implemented');
  }

  /**
   * Insert a new row
   * @param {string} sheetName 
   * @param {Object} row 
   * @returns {Promise<Object>}
   */
  async insert(sheetName, row) {
    throw new Error('Not implemented');
  }

  /**
   * Update an existing row
   * @param {string} sheetName 
   * @param {string} idField 
   * @param {string} idValue 
   * @param {Object} updates 
   * @returns {Promise<Object>}
   */
  async update(sheetName, idField, idValue, updates) {
    throw new Error('Not implemented');
  }

  /**
   * Delete a row (soft-delete preferred)
   * @param {string} sheetName 
   * @param {string} idField 
   * @param {string} idValue 
   * @returns {Promise<boolean>}
   */
  async delete(sheetName, idField, idValue) {
    throw new Error('Not implemented');
  }

  /**
   * Get the next ID for a sheet
   * @param {string} sheetName 
   * @param {string} prefix - e.g., "COMP", "CONT", "PRO"
   * @returns {Promise<string>}
   */
  async getNextId(sheetName, prefix) {
    throw new Error('Not implemented');
  }

  /**
   * Clear all data (for testing)
   * @returns {Promise<void>}
   */
  async clear() {
    throw new Error('Not implemented');
  }
}

export default StorageAdapter;
