import pg from 'pg';
const { Pool, types } = pg;

// Parse PostgreSQL BIGINT (OID 20) as JavaScript numbers
types.setTypeParser(20, (val) => parseInt(val, 10));

function getPool() {
    if (!globalThis._pgPool) {
        const connectionString = process.env.DATABASE_URL;
        const isLocal = connectionString?.includes('localhost') || connectionString?.includes('127.0.0.1');

        globalThis._pgPool = new Pool({
            connectionString,
            ssl: isLocal ? false : { rejectUnauthorized: false },
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        });
    }
    return globalThis._pgPool;
}

export async function execute(query, params = []) {
    const pool = getPool();
    const result = await pool.query(query, params);
    return result.rows;
}

export async function fetch(query, params = []) {
    const pool = getPool();
    const result = await pool.query(query, params);
    return result.rows;
}

export async function fetchOne(query, params = []) {
    const rows = await fetch(query, params);
    return rows && rows.length > 0 ? rows[0] : null;
}