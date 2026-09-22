import { createHmac, createHash, scryptSync, timingSafeEqual, randomBytes } from 'node:crypto';
import { isIP } from 'node:net';
import { DB, BUCKET } from './node-store';
import type { RuntimeEnv, RuntimeUser } from './types';
export const runtimeKind = 'node';
export const env = { DB, BUCKET, get RESEND_API_KEY() { return process.env.RESEND_API_KEY; }, get MAIL_FROM() { return process.env.MAIL_FROM; } } as unknown as RuntimeEnv;
export function publicOrigin() { const raw = process.env.PARTYPRINT_PUBLIC_URL; if (!raw)
    throw Error('PARTYPRINT_PUBLIC_URL is required'); const u = new URL(raw); if (u.protocol !== 'https:' && !(u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname)))
    throw Error('Public URL must use HTTPS'); return u.origin; }
const cookie = '__Host-partyprint_staff', privateHeaders = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
function envValue(name: string) {
    const raw = process.env[name] || '';
    const value = raw.trim();
    return value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) ? value.slice(1, -1).trim() : value;
}
function users(): Record<string, string> {
    try {
        const value = JSON.parse(envValue('PARTYPRINT_STAFF_PASSWORD_HASHES') || '{}');
        return value && !Array.isArray(value) && typeof value === 'object' ? value : {};
    }
    catch {
        // A malformed optional legacy setting must not disable the simple owner login.
        return {};
    }
}
function secret() {
    const value = envValue('PARTYPRINT_SESSION_SECRET');
    if (value.length >= 32)
        return value;
    // Keep the easy two-variable setup working. An explicit session secret remains preferred.
    const password = envValue('PARTYPRINT_ADMIN_PASSWORD');
    if (password.length >= 12)
        return createHash('sha256').update('partyprint-session:' + password).digest('hex');
    throw Error('PARTYPRINT_SESSION_SECRET must have at least 32 characters');
}
function signature(data: string) { return createHmac('sha256', secret()).update(data).digest('base64url'); }
function equal(a: string, b: string) { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); }
function stamp(hash: string) { return createHash('sha256').update(hash).digest('hex'); }
function wasChanged(value: unknown) {
    if (!value || typeof value !== 'object' || !('meta' in value))
        return false;
    const meta = value.meta;
    return !!meta && typeof meta === 'object' && 'changes' in meta && Number(meta.changes) > 0;
}
type Credential = { stamp: string; hash?: string; password?: string };
type SimpleCredential = Credential & { email: string };
function simpleCredentials(): SimpleCredential[] {
    const accounts: SimpleCredential[] = [];
    const add = (email: string | undefined, password: string | undefined, hash: string | undefined) => {
        const normalized = (email || '').trim().toLowerCase();
        if (!normalized || accounts.some(account => account.email === normalized))
            return;
        if (hash)
            accounts.push({ email: normalized, hash, stamp: stamp(hash) });
        else if (password)
            accounts.push({ email: normalized, password, stamp: stamp('plain:' + normalized + ':' + password) });
    };
    add(envValue('PARTYPRINT_ADMIN_EMAIL'), envValue('PARTYPRINT_ADMIN_PASSWORD'), envValue('PARTYPRINT_ADMIN_PASSWORD_HASH'));
    for (let i = 1; i <= 20; i++)
        add(envValue(`PARTYPRINT_STAFF_${i}_EMAIL`), envValue(`PARTYPRINT_STAFF_${i}_PASSWORD`), envValue(`PARTYPRINT_STAFF_${i}_PASSWORD_HASH`));
    return accounts;
}
async function credential(email: string): Promise<Credential | null> {
    const simple = simpleCredentials().find(account => account.email === email);
    if (simple)
        return simple;
    const hash = users()[email];
    if (typeof hash === 'string')
        return { hash, stamp: stamp(hash) };
    try {
        const row = await DB.prepare("SELECT data FROM studio_settings WHERE key='team'").first<{ data: string }>();
        if (!row)
            return null;
        const team = JSON.parse(row.data) as { members?: Array<{ email?: string; passwordHash?: string }> };
        const member = team.members?.find(item => item.email?.trim().toLowerCase() === email);
        return member?.passwordHash ? { hash: member.passwordHash, stamp: stamp(member.passwordHash) } : null;
    }
    catch {
        return null;
    }
}
async function storedProfile(email: string): Promise<{ name: string } | null> {
    try {
        const row = await DB.prepare("SELECT data FROM studio_settings WHERE key='team'").first<{ data: string }>();
        if (!row)
            return null;
        const team = JSON.parse(row.data) as { ownerProfile?: { name?: string }; members?: Array<{ email?: string; name?: string }> };
        const ownerEmail = envValue('PARTYPRINT_ADMIN_EMAIL').toLowerCase() || 'atzilul@gmail.com';
        if (email === ownerEmail && team.ownerProfile?.name)
            return { name: team.ownerProfile.name };
        const member = team.members?.find(item => item.email?.trim().toLowerCase() === email);
        return member?.name ? { name: member.name } : null;
    }
    catch {
        return null;
    }
}
export async function hashStaffPassword(password: string) {
    if (password.length < 12)
        throw Error('password_too_short');
    const salt = randomBytes(16).toString('hex');
    return 'scrypt$' + salt + '$' + scryptSync(password, salt, 64).toString('hex');
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
        const current = typeof p.email === 'string' ? await credential(p.email) : null;
        if (typeof p.email !== 'string' || typeof p.exp !== 'number' || p.exp < Date.now() || !current || p.stamp !== current.stamp)
            return null;
        const profile = await storedProfile(p.email);
        return { userId: p.email, email: p.email, displayName: profile?.name || p.email, fullName: profile?.name || null };
    }
    catch {
        return null;
    }
}
function cookieValue(token: string, maxAge: number) { return `${cookie}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${publicOrigin().startsWith('https:') ? '; Secure' : ''}`; }
function trustedHostnames() {
    const hosts = new Set<string>();
    const add = (value: string) => {
        const host = value.trim().replace(/^https?:\/\//, '').split('/')[0].split(':')[0].toLowerCase();
        if (!host)
            return;
        hosts.add(host);
        hosts.add(host.startsWith('www.') ? host.slice(4) : 'www.' + host);
    };
    add(new URL(publicOrigin()).hostname);
    for (const value of envValue('VINEXT_TRUSTED_HOSTS').split(','))
        add(value);
    return hosts;
}
function trustedRequestHost(r: Request) {
    const forwarded = r.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
    const raw = forwarded || r.headers.get('host') || '';
    return trustedHostnames().has(raw.split(':')[0].toLowerCase());
}
function sameSiteRequest(r: Request) {
    const origin = r.headers.get('origin');
    if (origin && origin !== 'null') {
        try {
            const u = new URL(origin), publicUrl = new URL(publicOrigin());
            return u.protocol === publicUrl.protocol && trustedHostnames().has(u.hostname.toLowerCase());
        }
        catch {
            return false;
        }
    }
    const referer = r.headers.get('referer');
    if (referer) {
        try {
            const u = new URL(referer), publicUrl = new URL(publicOrigin());
            if (u.protocol === publicUrl.protocol && trustedHostnames().has(u.hostname.toLowerCase()))
                return true;
        }
        catch {}
    }
    // Hostinger can remove Origin and Referer while forwarding a same-site form.
    return trustedRequestHost(r);
}
function loginFailure(r: Request, status: number, error: string, code: string) {
    if ((r.headers.get('accept') || '').includes('text/html'))
        return new Response(null, { status: 303, headers: { ...privateHeaders, Location: '/signin-with-chatgpt?error=' + code } });
    return Response.json({ error }, { status, headers: privateHeaders });
}
export async function login(r: Request) {
    try {
        if (!sameSiteRequest(r))
            return loginFailure(r, 403, 'כתובת האתר אינה מורשית להתחברות.', 'origin');
        const text = await r.text();
        if (text.length > 4096)
            return new Response(null, { status: 413 });
        const f = new URLSearchParams(text), email = (f.get('email') || '').trim().toLowerCase(), password = f.get('password') || '';
        if (email.length > 150 || password.length > 1024)
            return new Response(null, { status: 400 });
        // Account and client throttles work together. The client value is only trusted
        // when the host has configured a reverse-proxy header it overwrites.
        const now = Date.now(), bucket = Math.floor(now / 900000), ip = clientKey(r);
        const limits = await DB.batch([
            DB.prepare('INSERT INTO form_rate_limits(key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<10 RETURNING count').bind('login:email:' + stamp(email) + ':' + bucket, now + 1800000),
            DB.prepare('INSERT INTO form_rate_limits(key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<30 RETURNING count').bind('login:ip:' + stamp(ip) + ':' + bucket, now + 1800000),
        ]);
        if (limits.some(limit => !wasChanged(limit)))
            return loginFailure(r, 429, 'יותר מדי ניסיונות. נסו שוב בעוד 15 דקות.', 'rate');
        await DB.prepare('DELETE FROM form_rate_limits WHERE expires_at < ?').bind(now).run();
        const current = await credential(email);
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
            return loginFailure(r, 401, 'המייל או הסיסמה אינם נכונים.', 'credentials');
        const p = Buffer.from(JSON.stringify({ email, exp: now + 8 * 3600000, stamp: current.stamp, nonce: randomBytes(16).toString('hex') })).toString('base64url');
        return new Response(null, { status: 303, headers: { ...privateHeaders, Location: '/admin', 'Set-Cookie': cookieValue(p + '.' + signature(p), 8 * 3600) } });
    }
    catch {
        console.error('Staff login unavailable; check Node runtime configuration');
        return loginFailure(r, 503, 'ההתחברות אינה זמינה. בדקו שהגדרות השרת נשמרו ולאחר מכן בצעו Redeploy.', 'config');
    }
}
export async function logout(r: Request) { if (r.method === 'POST' && !sameSiteRequest(r))
    return new Response(null, { status: 403 }); return new Response(null, { status: 303, headers: { ...privateHeaders, Location: '/admin', 'Set-Cookie': cookieValue('', 0) } }); }
// Set only when the trusted reverse proxy overwrites this header. Direct client
// headers are otherwise ignored; the fallback deliberately shares a rate limit.
export function clientKey(r: Request) { const header = process.env.PARTYPRINT_TRUSTED_IP_HEADER; if (!header)
    return "anonymous"; const ip = r.headers.get(header)?.trim() || ""; return isIP(ip) ? ip : "anonymous"; }
