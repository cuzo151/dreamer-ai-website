const crypto = require('crypto');
const { promisify } = require('util');

/**
 * Encryption Manager for data protection
 */
class EncryptionManager {
  constructor() {
    // Master encryption key - in production, use AWS KMS, HashiCorp Vault, etc.
    this.masterKey = process.env.MASTER_ENCRYPTION_KEY || this.generateMasterKey();
    this.algorithm = 'aes-256-gcm';
    this.saltLength = 32;
    this.tagLength = 16;
    this.ivLength = 16;
    this.keyDerivationIterations = 100000;
  }

  /**
   * Generate a master key (only for development)
   */
  generateMasterKey() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Master encryption key must be provided in production');
    }
    console.warn('WARNING: Using generated master key - not for production use');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Derive encryption key from master key
   */
  async deriveKey(salt, info = '') {
    return crypto.pbkdf2Sync(
      this.masterKey,
      salt,
      this.keyDerivationIterations,
      32,
      'sha256'
    );
  }

  /**
   * Encrypt data with AES-256-GCM
   */
  async encrypt(data, associatedData = '') {
    try {
      // Convert data to string if it's an object
      const plaintext = typeof data === 'object' ? JSON.stringify(data) : String(data);
      
      // Generate random salt and IV
      const salt = crypto.randomBytes(this.saltLength);
      const iv = crypto.randomBytes(this.ivLength);
      
      // Derive key from master key
      const key = await this.deriveKey(salt);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      
      // Set associated data for AEAD
      if (associatedData) {
        cipher.setAAD(Buffer.from(associatedData, 'utf8'));
      }
      
      // Encrypt data
      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final()
      ]);
      
      // Get auth tag
      const tag = cipher.getAuthTag();
      
      // Combine salt, iv, tag, and encrypted data
      const combined = Buffer.concat([salt, iv, tag, encrypted]);
      
      // Return base64 encoded
      return combined.toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data encrypted with AES-256-GCM
   */
  async decrypt(encryptedData, associatedData = '') {
    try {
      // Decode from base64
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract components
      const salt = combined.slice(0, this.saltLength);
      const iv = combined.slice(this.saltLength, this.saltLength + this.ivLength);
      const tag = combined.slice(this.saltLength + this.ivLength, this.saltLength + this.ivLength + this.tagLength);
      const encrypted = combined.slice(this.saltLength + this.ivLength + this.tagLength);
      
      // Derive key from master key
      const key = await this.deriveKey(salt);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);
      
      // Set associated data for AEAD
      if (associatedData) {
        decipher.setAAD(Buffer.from(associatedData, 'utf8'));
      }
      
      // Decrypt data
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      const plaintext = decrypted.toString('utf8');
      
      // Try to parse as JSON if possible
      try {
        return JSON.parse(plaintext);
      } catch {
        return plaintext;
      }
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  hash(data, salt = null) {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512').toString('hex');
    return salt ? hash : `${actualSalt}:${hash}`;
  }

  /**
   * Verify hashed data
   */
  verifyHash(data, hashedData) {
    const [salt, originalHash] = hashedData.split(':');
    const hash = this.hash(data, salt);
    return hash === originalHash;
  }

  /**
   * Generate cryptographically secure random tokens
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Encrypt specific fields in an object
   */
  async encryptFields(obj, fields) {
    const encrypted = { ...obj };
    
    for (const field of fields) {
      if (obj[field] !== undefined && obj[field] !== null) {
        encrypted[field] = await this.encrypt(obj[field]);
        encrypted[`${field}_encrypted`] = true;
      }
    }
    
    return encrypted;
  }

  /**
   * Decrypt specific fields in an object
   */
  async decryptFields(obj, fields) {
    const decrypted = { ...obj };
    
    for (const field of fields) {
      if (obj[field] && obj[`${field}_encrypted`]) {
        decrypted[field] = await this.decrypt(obj[field]);
        delete decrypted[`${field}_encrypted`];
      }
    }
    
    return decrypted;
  }

  /**
   * Create encrypted backup of sensitive data
   */
  async createSecureBackup(data) {
    const timestamp = new Date().toISOString();
    const backup = {
      version: '1.0',
      timestamp,
      data
    };
    
    return {
      backup: await this.encrypt(backup, timestamp),
      checksum: this.createChecksum(JSON.stringify(backup)),
      timestamp
    };
  }

  /**
   * Restore from encrypted backup
   */
  async restoreSecureBackup(encryptedBackup, checksum, timestamp) {
    const backup = await this.decrypt(encryptedBackup, timestamp);
    
    // Verify checksum
    const calculatedChecksum = this.createChecksum(JSON.stringify(backup));
    if (calculatedChecksum !== checksum) {
      throw new Error('Backup integrity check failed');
    }
    
    return backup.data;
  }

  /**
   * Create checksum for data integrity
   */
  createChecksum(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Key rotation support
   */
  async rotateEncryption(encryptedData, oldKey, newKey) {
    // Temporarily use old key
    const tempMasterKey = this.masterKey;
    this.masterKey = oldKey;
    
    // Decrypt with old key
    const decrypted = await this.decrypt(encryptedData);
    
    // Use new key
    this.masterKey = newKey;
    
    // Encrypt with new key
    const reencrypted = await this.encrypt(decrypted);
    
    // Restore original key
    this.masterKey = tempMasterKey;
    
    return reencrypted;
  }
}

/**
 * Field-level encryption for database
 */
class FieldEncryption {
  constructor(encryptionManager) {
    this.encryption = encryptionManager;
    this.encryptedFields = new Map();
  }

  /**
   * Register fields for encryption
   */
  registerFields(collection, fields) {
    this.encryptedFields.set(collection, fields);
  }

  /**
   * Middleware for encrypting before save
   */
  encryptMiddleware(collection) {
    return async (req, res, next) => {
      const fields = this.encryptedFields.get(collection);
      if (!fields || !req.body) {
        return next();
      }
      
      try {
        req.body = await this.encryption.encryptFields(req.body, fields);
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Middleware for decrypting after fetch
   */
  decryptMiddleware(collection) {
    return async (data) => {
      const fields = this.encryptedFields.get(collection);
      if (!fields || !data) {
        return data;
      }
      
      if (Array.isArray(data)) {
        return Promise.all(data.map(item => this.encryption.decryptFields(item, fields)));
      }
      
      return this.encryption.decryptFields(data, fields);
    };
  }
}

/**
 * Secure file encryption
 */
class FileEncryption {
  constructor(encryptionManager) {
    this.encryption = encryptionManager;
    this.chunkSize = 64 * 1024; // 64KB chunks
  }

  /**
   * Encrypt file stream
   */
  async encryptFile(inputPath, outputPath) {
    const fs = require('fs');
    const stream = require('stream');
    const pipeline = promisify(stream.pipeline);
    
    // Generate file-specific key
    const fileKey = this.encryption.generateToken(32);
    const salt = crypto.randomBytes(32);
    const key = await this.encryption.deriveKey(salt);
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    // Create streams
    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);
    
    // Write header (salt + iv)
    output.write(Buffer.concat([salt, iv]));
    
    // Encrypt file
    await pipeline(input, cipher, output);
    
    return {
      encryptedPath: outputPath,
      fileKey: fileKey.toString('base64')
    };
  }

  /**
   * Decrypt file stream
   */
  async decryptFile(inputPath, outputPath, fileKey) {
    const fs = require('fs');
    const stream = require('stream');
    const pipeline = promisify(stream.pipeline);
    
    // Read header
    const header = Buffer.alloc(48); // 32 bytes salt + 16 bytes iv
    const fd = fs.openSync(inputPath, 'r');
    fs.readSync(fd, header, 0, 48, 0);
    fs.closeSync(fd);
    
    const salt = header.slice(0, 32);
    const iv = header.slice(32, 48);
    
    // Derive key
    const key = await this.encryption.deriveKey(salt);
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    // Create streams
    const input = fs.createReadStream(inputPath, { start: 48 });
    const output = fs.createWriteStream(outputPath);
    
    // Decrypt file
    await pipeline(input, decipher, output);
    
    return outputPath;
  }
}

/**
 * Tokenization for sensitive data
 */
class Tokenization {
  constructor() {
    this.tokens = new Map();
    this.reverseTokens = new Map();
  }

  /**
   * Tokenize sensitive data
   */
  tokenize(data, type = 'default') {
    const token = `${type}_${crypto.randomBytes(16).toString('hex')}`;
    this.tokens.set(token, data);
    this.reverseTokens.set(`${type}:${data}`, token);
    return token;
  }

  /**
   * Detokenize
   */
  detokenize(token) {
    return this.tokens.get(token);
  }

  /**
   * Get token for data if exists
   */
  getToken(data, type = 'default') {
    return this.reverseTokens.get(`${type}:${data}`);
  }

  /**
   * Remove token
   */
  removeToken(token) {
    const data = this.tokens.get(token);
    if (data) {
      this.tokens.delete(token);
      this.reverseTokens.delete(`${token.split('_')[0]}:${data}`);
    }
  }

  /**
   * Clean expired tokens
   */
  cleanExpiredTokens(maxAge = 3600000) { // 1 hour default
    // In production, implement with Redis TTL
    console.log('Token cleanup not implemented in memory storage');
  }
}

// Create singleton instances
const encryptionManager = new EncryptionManager();
const fieldEncryption = new FieldEncryption(encryptionManager);
const fileEncryption = new FileEncryption(encryptionManager);
const tokenization = new Tokenization();

// Register encrypted fields for different collections
fieldEncryption.registerFields('users', ['email', 'phone', 'ssn', 'creditCard']);
fieldEncryption.registerFields('payments', ['cardNumber', 'cvv', 'billingAddress']);
fieldEncryption.registerFields('messages', ['content', 'attachments']);

module.exports = {
  encryptionManager,
  fieldEncryption,
  fileEncryption,
  tokenization,
  EncryptionManager,
  FieldEncryption,
  FileEncryption,
  Tokenization
};