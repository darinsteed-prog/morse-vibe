import CryptoJS from 'crypto-js';

export function encrypt(text: string, key: string): string {
  if (!key.trim()) return text;
  try {
    const encrypted = CryptoJS.AES.encrypt(text, key).toString();
    return 'ENC:' + encrypted;
  } catch {
    return text;
  }
}

export function decrypt(text: string, key: string): string {
  if (!key.trim()) return text;
  if (!text.startsWith('ENC:')) return text;
  try {
    const encrypted = text.slice(4);
    const decrypted = CryptoJS.AES.decrypt(encrypted, key);
    return decrypted.toString(CryptoJS.enc.Utf8) || '⚠️ Wrong key';
  } catch {
    return '⚠️ Decryption failed';
  }
}

export function generateKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  for (let i = 0; i < 16; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}