import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não foi configurada no arquivo .env.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
let initialization;

export function initializeDatabase() {
  if (!initialization) {
    initialization = pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';

      CREATE TABLE IF NOT EXISTS sessions (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS sessions_token_hash_idx ON sessions (token_hash);
    `);
  }

  return initialization;
}

export async function findUserByEmail(email) {
  const { rows } = await pool.query(
    "SELECT id, name, email, password_hash FROM users WHERE email = $1",
    [email],
  );
  return rows[0];
}

export async function createUser(name, email, passwordHash) {
  const { rows } = await pool.query(
    "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
    [name, email, passwordHash],
  );
  return rows[0];
}

export async function createSession(userId, tokenHash, expiresAt) {
  await pool.query(
    "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [userId, tokenHash, new Date(expiresAt)],
  );
}

export async function findUserBySession(tokenHash) {
  const { rows } = await pool.query(
    `
    SELECT users.id, users.name, users.email
    FROM sessions
    INNER JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = $1 AND sessions.expires_at > NOW()
  `,
    [tokenHash],
  );
  return rows[0];
}

export async function deleteSession(tokenHash) {
  await pool.query("DELETE FROM sessions WHERE token_hash = $1", [tokenHash]);
}

export async function closeDatabase() {
  await pool.end();
}
