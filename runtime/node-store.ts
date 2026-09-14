import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { readFile, writeFile, rename, unlink, mkdir, readdir } from 'node:fs/promises';
import { resolve, join, isAbsolute, dirname } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
let database: DatabaseSync | undefined;
export function dataDirectory() { const dir = process.env.PARTYPRINT_DATA_DIR; if (!dir || !isAbsolute(dir))
    throw Error('PARTYPRINT_DATA_DIR must be an absolute persistent directory outside the deployment'); const target = resolve(dir), root = resolve(process.cwd()); if (target === root || target.startsWith(root + '/'))
    throw Error('Persistent data must be outside the deployment directory'); return target; }
export function sqlite() {
    if (database)
        return database;
    const dir = dataDirectory();
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    const db = new DatabaseSync(join(dir, 'partyprint.sqlite'));
    db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS runtime_migrations (name TEXT PRIMARY KEY);');
    // The build command includes the canonical SQL migrations with the Node bundle.
    const migrations = resolve(dirname(process.argv[1]), 'drizzle');
    for (const name of readdirSync(migrations).filter(n => n.endsWith('.sql')).sort()) {
        if (db.prepare('SELECT name FROM runtime_migrations WHERE name=?').get(name))
            continue;
        db.exec('BEGIN IMMEDIATE');
        try {
            db.exec(readFileSync(join(migrations, name), 'utf8'));
            db.prepare('INSERT INTO runtime_migrations(name) VALUES (?)').run(name);
            db.exec('COMMIT');
        }
        catch (e) {
            db.exec('ROLLBACK');
            db.close();
            throw e;
        }
    }
    database = db;
    return db;
}
class Statement {
    constructor(readonly query: string, readonly values: unknown[] = []) { }
    bind(...values: unknown[]) { return new Statement(this.query, values); }
    execute(kind: 'first' | 'all' | 'run', column?: string) { const s = sqlite().prepare(this.query), values = this.values as (string | number | null | Uint8Array)[]; if (kind === 'first') {
        const row = s.get(...values);
        return row ? (column ? row[column] : row) : null;
    } if (kind === 'all')
        return { results: s.all(...values), success: true, meta: {} }; const result = s.run(...values); return { success: true, results: [], meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } }; }
    async first<T = unknown>(column?: string) { return this.execute('first', column) as T | null; }
    async all<T = unknown>() { return this.execute('all') as {
        results: T[];
        success: boolean;
        meta: Record<string, unknown>;
    }; }
    async run() { return this.execute('run'); }
}
export const DB = { prepare(query: string) { return new Statement(query); }, async batch(statements: Statement[]) { const db = sqlite(); db.exec('BEGIN IMMEDIATE'); try {
        const results = statements.map(s => s.execute('run'));
        db.exec('COMMIT');
        return results;
    }
    catch (e) {
        db.exec('ROLLBACK');
        throw e;
    } } };
// One atomic file per object keeps content and HTTP metadata consistent. Hashing
// keys prevents path traversal; the directory is never served as static content.
function objectPath(key: string) { if (!key || key.length > 2048)
    throw Error('Invalid object key'); const hash = createHash('sha256').update(key).digest('hex'); return join(dataDirectory(), 'objects', hash.slice(0, 2), hash + '.json'); }
async function object(key: string) { try {
    const entry = JSON.parse(await readFile(objectPath(key), 'utf8'));
    if (entry.key !== key)
        throw Error('Object key mismatch');
    return entry as {
        key: string;
        bytes: string;
        httpMetadata?: Record<string, string>;
    };
}
catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT')
        return null;
    throw e;
} }
export const BUCKET = {
    async list(options: {
        prefix?: string;
        limit?: number;
        cursor?: string;
    } = {}) { const root = join(dataDirectory(), 'objects'); const entries = [] as {
        key: string;
        size: number;
    }[]; let dirs: string[]; try {
        dirs = await readdir(root);
    }
    catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'ENOENT')
            dirs = [];
        else
            throw e;
    } for (const dir of dirs) {
        for (const file of await readdir(join(root, dir))) {
            if (!file.endsWith('.json'))
                continue;
            try {
                const v = JSON.parse(await readFile(join(root, dir, file), 'utf8'));
                if (v.key.startsWith(options.prefix || '') && v.key > (options.cursor || ''))
                    entries.push({ key: v.key, size: Buffer.byteLength(v.bytes, 'base64') });
            }
            catch (e) {
                if ((e as NodeJS.ErrnoException).code !== 'ENOENT')
                    throw e;
            }
        }
    } entries.sort((a, b) => a.key < b.key ? -1 : 1); const objects = entries.slice(0, Math.max(1, Math.min(options.limit || 1000, 1000))), truncated = entries.length > objects.length; return { objects, truncated, cursor: truncated ? objects.at(-1)?.key : undefined }; },
    async put(key: string, value: string | ArrayBuffer | ArrayBufferView | Blob | ReadableStream, options?: {
        httpMetadata?: Record<string, string>;
    }) { let bytes: Buffer; if (typeof value === 'string')
        bytes = Buffer.from(value);
    else if (value instanceof ArrayBuffer)
        bytes = Buffer.from(value);
    else if (ArrayBuffer.isView(value))
        bytes = Buffer.from(value.buffer, value.byteOffset, value.byteLength);
    else if (value instanceof Blob)
        bytes = Buffer.from(await value.arrayBuffer());
    else
        bytes = Buffer.from(await new Response(value).arrayBuffer()); const dest = objectPath(key), temp = dest + '.' + randomUUID() + '.tmp'; await mkdir(resolve(dest, '..'), { recursive: true, mode: 0o700 }); try {
        await writeFile(temp, JSON.stringify({ key, bytes: bytes.toString('base64'), httpMetadata: options?.httpMetadata }), { mode: 0o600 });
        await rename(temp, dest);
    }
    finally {
        await unlink(temp).catch(() => { });
    } return { key, size: bytes.length }; },
    async get(key: string) { const entry = await object(key); if (!entry)
        return null; const bytes = Buffer.from(entry.bytes, 'base64'); return { key, size: bytes.length, httpMetadata: entry.httpMetadata, body: new Uint8Array(bytes), async arrayBuffer() { return Uint8Array.from(bytes).buffer; }, async text() { return bytes.toString('utf8'); }, async json<T>() { return JSON.parse(bytes.toString('utf8')) as T; } }; },
    async head(key: string) { const entry = await object(key); return entry ? { key, size: Buffer.byteLength(entry.bytes, 'base64'), httpMetadata: entry.httpMetadata } : null; },
    async delete(key: string | string[]) { await Promise.all((Array.isArray(key) ? key : [key]).map(k => unlink(objectPath(k)).catch(e => { if (e.code !== 'ENOENT')
        throw e; }))); }
};
