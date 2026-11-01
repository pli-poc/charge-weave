import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const hash = value => createHash('sha256').update(value).digest();
const random = () => randomBytes(32).toString('base64url');

// Pairing and browser sessions deliberately live only for this process lifetime.
export class PairingSessions {
  constructor(code, now = () => Date.now()) {
    if (typeof code !== 'string' || Buffer.byteLength(code) < 32) throw new Error('Pairing code must contain at least 32 bytes');
    this.codeHash = hash(code);
    this.expires = now() + 5 * 60 * 1000;
    this.now = now;
    this.failures = 0;
    this.sessions = new Map();
  }
  pair(code) {
    if (!this.codeHash || this.now() >= this.expires || this.failures >= 5) return null;
    const candidate = hash(typeof code === 'string' ? code : '');
    if (!timingSafeEqual(this.codeHash, candidate)) { this.failures++; return null; }
    this.codeHash = null;
    const id = random(), csrf = random();
    this.sessions.set(id, { csrf, expires: this.now() + 8 * 60 * 60 * 1000 });
    return { id, csrf };
  }
  get(id) {
    const session = this.sessions.get(id);
    if (!session || this.now() >= session.expires) { this.sessions.delete(id); return null; }
    return session;
  }
  revoke(id) { this.sessions.delete(id); }
}
