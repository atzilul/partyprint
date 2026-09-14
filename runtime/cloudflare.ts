import { env as workerEnv } from 'cloudflare:workers';
import type { RuntimeEnv, RuntimeUser } from './types';
export const env = workerEnv as unknown as RuntimeEnv;
export const runtimeKind = 'cloudflare';
export function publicOrigin() { return 'https://partyprint-ai.atzilul.chatgpt.site'; }
export async function authenticatedUser(h: Headers): Promise<RuntimeUser | null> { const userId = h.get('oai-authenticated-user-id'), email = h.get('oai-authenticated-user-email'); if (!userId || !email)
    return null; let fullName = null; try {
    if (h.get('oai-authenticated-user-full-name-encoding') === 'percent-encoded-utf-8')
        fullName = decodeURIComponent(h.get('oai-authenticated-user-full-name') || '') || null;
}
catch { } return { userId, email, fullName, displayName: fullName || email }; }
export async function login(_r: Request): Promise<Response> { return new Response(null, { status: 404 }); }
export async function logout(_r: Request): Promise<Response> { return new Response(null, { status: 404 }); }
export function clientKey(r: Request) { return r.headers.get('CF-Connecting-IP') || r.headers.get('oai-authenticated-user-id') || 'anonymous'; }
