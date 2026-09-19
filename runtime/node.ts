import { createHmac, createHash, scryptSync, timingSafeEqual, randomBytes } from 'node:crypto';
import { isIP } from 'node:net';
import { DB, BUCKET } from './node-store';
import type { RuntimeEnv, RuntimeUser } from './types';
export const runtimeKind = 'node';
export const env = { DB, BUCKET, get RESEND_API_KEY() { return process.env.RESEND_API_KEY; }, get MAIL_FROM() { return process.env.MAIL_FROM; } } as unknown as RuntimeEnv;
export function publicOrigin() { const raw = process.env.PARTYPRINT_PUBLIC_URL; if (!raw)
    throw Error('PARTYPRINT_PUBLIC_URL is required'); const u = new URL(raw); if (u.protocol !== 'https:' && !(u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname)))
    throw Error('Public URL must use HTTPS'); return u.origin; }
const cookie = 'partyprint_staff', privateHeaders = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
function users(): Record<string, string> { const value = JSON.parse(process.env.PARTYPRINT_STAFF_PASSWORD_HASHES || '{}'); if (!value || Array.isArray(value) || typeof value !== 'object')
    throw Error('Invalid staff credentials configuration'); return value; }
function secret() { const value = process.env.PARTYPRINT_SESSION_SECRET || ''; if (value.length < 32)
    throw Error('PARTYPRINT_SESSION_SECRET must have at least 32 characters'); return value; }
function signature(data: string) { return createHmac('sha256', secret()).update(data).digest('base64url'); }
function equal(a: string, b: string) { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); }
function stamp(hash: string) { return createHash('sha256').update(hash).digest('hex'); }
type Credential = { stamp: string; hash?: string; password?: string };
function simpleAdmin(): (Credential & { email: string }) | null {
    const email = (process.env.PARTYPRINT_ADMIN_EMAIL || '').trim().toLowerCase();
    const password = process.env.PARTYPRINT_ADMIN_PASSWORD || '';
    if (!email || !password)
        return null;
    return { email, password, stamp: stamp('plain:' + email + ':' + password) };
}
function credential(email: string): Credential | null {
    const simple = simpleAdmin();
    if (simple?.email === email)
        return simple;
    const hash = users()[email];
    return typeof hash === 'string' ? { hash, stamp: stamp(hash) } : null;
}
export async function authenticatedUser(h: Headers): Promise<RuntimeUser | null> {
    // Never trust Sites headers on a public Node server.
    try {
        const token = h.get('cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith(cookie + '='))?.slice(cookie.length + 1);
        if (!token || token.length > 4096)
            return null;
        const parts = token.split('.');
        if (parts.length !== 2 || !equal(signature(parts[0]), parts[1]))
            return null;
        const p = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
        const current = typeof p.email === 'string' ? credential(p.email) : null;
        if (typeof p.email !== 'string' || typeof p.exp !== 'number' || p.exp < Date.now() || !current || p.stamp !== current.stamp)
            return null;
        return { userId: p.email, email: p.email, displayName: p.email, fullName: null };
    }
    catch {
        return null;
    }
}
function cookieValue(token: string, maxAge: number) { return `${cookie}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${publicOrigin().startsWith('https:') ? '; Secure' : ''}`; }
export async function login(r: Request) {
    try {
        if (r.headers.get('origin') !== publicOrigin())
            return new Response(null, { status: 403 });
        const text = await r.text();
        if (text.length > 4096)
            return new Response(null, { status: 413 });
        const f = new URLSearchParams(text), email = (f.get('email') || '').trim().toLowerCase(), password = f.get('password') || '';
        if (email.length > 150 || password.length > 1024)
            return new Response(null, { status: 400 });
        // Account-scoped persistent throttling cannot be bypassed by spoofing proxy headers.
        const now = Date.now(), key = 'login:' + stamp(email) + ':' + Math.floor(now / 900000);
        const limit = await DB.prepare('INSERT INTO form_rate_limits(key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<10 RETURNING count').bind(key, now + 1800000).first();
        if (!limit)
            return Response.json({ error: 'יותר מדי ניסיונות. נסו שוב בעוד 15 דקות.' }, { status: 429, headers: privateHeaders });
        await DB.prepare('DELETE FROM form_rate_limits WHERE expires_at < ?').bind(now).run();
        const current = credential(email);
        let valid = false;
        if (current?.password !== undefined) {
            valid = equal(password, current.password);
        }
        else if (current?.hash) {
            const parts = current.hash.split('$');
            const hashValid = parts.length === 3 && parts[0] === 'scrypt' && /^[a-f0-9]{32}$/.test(parts[1]) && /^[a-f0-9]{128}$/.test(parts[2]);
            if (hashValid)
                valid = equal(scryptSync(password, parts[1], 64).toString('hex'), parts[2]);
        }
        if (!current || !valid)
            return Response.json({ error: 'המייל או הסיסמה אינם נכונים.' }, { status: 401, headers: privateHeaders });
        const p = Buffer.from(JSON.stringify({ email, exp: now + 8 * 3600000, stamp: current.stamp, nonce: randomBytes(16).toString('hex') })).toString('base64url');
        return new Response(null, { status: 303, headers: { ...privateHeaders, Location: '/admin', 'Set-Cookie': cookieValue(p + '.' + signature(p), 8 * 3600) } });
    }
    catch {
        console.error('Staff login unavailable; check Node runtime configuration');
        return Response.json({ error: 'ההתחברות אינה זמינה. בדקו את הגדרות השרת.' }, { status: 503, headers: privateHeaders });
    }
}
export async function logout(r: Request) { if (r.method === 'POST' && r.headers.get('origin') !== publicOrigin())
    return new Response(null, { status: 403 }); return new Response(null, { status: 303, headers: { ...privateHeaders, Location: '/admin', 'Set-Cookie': cookieValue('', 0) } }); }
// Set only when the trusted reverse proxy overwrites this header. Direct client
// headers are otherwise ignored; the fallback deliberately shares a rate limit.
export function clientKey(r: Request) { const header = process.env.PARTYPRINT_TRUSTED_IP_HEADER; if (!header)
    return "anonymous"; const ip = r.headers.get(header)?.trim() || ""; return isIP(ip) ? ip : "anonymous"; }
