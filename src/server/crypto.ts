import crypto from 'crypto';

// Secret key derived or defaulted for app session security
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET 
  ? crypto.createHash('sha256').update(process.env.ENCRYPTION_SECRET).digest()
  : crypto.createHash('sha256').update('linkpulse-secure-storage-key-2026').digest();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

export function encryptPassword(plainText: string): string {
  if (!plainText) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptPassword(cipherPayload: string): string {
  if (!cipherPayload) return '';
  try {
    const parts = cipherPayload.split(':');
    if (parts.length !== 3) return '';
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return '';
  }
}

export function generateStrongPassword(length = 16): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()_+~';
  const all = upper + lower + digits + symbols;
  
  let password = '';
  password += upper[crypto.randomInt(0, upper.length)];
  password += lower[crypto.randomInt(0, lower.length)];
  password += digits[crypto.randomInt(0, digits.length)];
  password += symbols[crypto.randomInt(0, symbols.length)];
  
  for (let i = 4; i < length; i++) {
    password += all[crypto.randomInt(0, all.length)];
  }
  
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}
