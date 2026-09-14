declare module '#partyprint-runtime' {
    export function clientKey(request: Request): string;
    export const env: import('./types').RuntimeEnv;
    export const runtimeKind: string;
    export function publicOrigin(): string;
    export function authenticatedUser(headers: Headers): Promise<import('./types').RuntimeUser | null>;
    export function login(request: Request): Promise<Response>;
    export function logout(request: Request): Promise<Response>;
}
