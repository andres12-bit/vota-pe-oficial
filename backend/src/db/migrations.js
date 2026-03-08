/**
 * PulsoElectoral.pe — Database Migrations
 * Creates all tables in PostgreSQL.
 * Run: DATABASE_URL=... node src/db/migrations.js
 */
require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set. Provide it as env var.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const TABLES_SQL = `
-- ==================== PARTIES ====================
CREATE TABLE IF NOT EXISTS parties (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  abbreviation VARCHAR(20),
  logo TEXT,
  color VARCHAR(20) DEFAULT '#666',
  party_full_score NUMERIC(6,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== CANDIDATES ====================
CREATE TABLE IF NOT EXISTS candidates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  photo TEXT,
  party_id INTEGER REFERENCES parties(id),
  position VARCHAR(20) NOT NULL CHECK (position IN ('president','senator','deputy','andean')),
  region VARCHAR(100) DEFAULT '',
  biography TEXT DEFAULT '',
  education TEXT,
  experience TEXT,
  birth_date VARCHAR(30),
  dni VARCHAR(20),
  sex VARCHAR(10),
  cargo VARCHAR(100),
  party_jne_name VARCHAR(255) DEFAULT '',
  hoja_de_vida JSONB,
  plan_pdf_url TEXT,
  plan_pdf_local TEXT,
  intelligence_score NUMERIC(6,2) DEFAULT 0,
  momentum_score NUMERIC(6,2) DEFAULT 0,
  integrity_score NUMERIC(6,2) DEFAULT 0,
  experience_score NUMERIC(6,2) DEFAULT 0,
  risk_score NUMERIC(6,2) DEFAULT 0,
  hoja_score NUMERIC(6,2) DEFAULT 0,
  plan_score NUMERIC(6,2) DEFAULT 0,
  stars_rating NUMERIC(3,1) DEFAULT 0,
  final_score NUMERIC(6,2) DEFAULT 0,
  vote_count INTEGER DEFAULT 0,
  jne_status VARCHAR(30) DEFAULT 'INSCRITO',
  list_position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_candidates_position ON candidates(position);
CREATE INDEX IF NOT EXISTS idx_candidates_party ON candidates(party_id);
CREATE INDEX IF NOT EXISTS idx_candidates_active ON candidates(is_active);
CREATE INDEX IF NOT EXISTS idx_candidates_final_score ON candidates(final_score DESC);

-- ==================== VOTES ====================
CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id),
  voter_ip VARCHAR(50),
  voter_fingerprint VARCHAR(255),
  position_type VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_votes_candidate ON votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_votes_created ON votes(created_at);
CREATE INDEX IF NOT EXISTS idx_votes_fingerprint ON votes(voter_fingerprint);

-- ==================== CANDIDATE EVENTS ====================
CREATE TABLE IF NOT EXISTS candidate_events (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id),
  title TEXT NOT NULL,
  description TEXT,
  event_type VARCHAR(30) DEFAULT 'neutral',
  impact_score NUMERIC(5,2) DEFAULT 0,
  source TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_candidate ON candidate_events(candidate_id);

-- ==================== CANDIDATE PROPOSALS ====================
CREATE TABLE IF NOT EXISTS candidate_proposals (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id),
  title TEXT NOT NULL,
  description TEXT,
  category VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== VICE PRESIDENTS ====================
CREATE TABLE IF NOT EXISTS candidate_vice_presidents (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id),
  name VARCHAR(255) NOT NULL,
  position_label VARCHAR(255),
  photo TEXT,
  biography TEXT,
  sort_order INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== PLAN DE GOBIERNO ====================
CREATE TABLE IF NOT EXISTS candidate_plan_gobierno (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id),
  dimension VARCHAR(255),
  problem TEXT,
  objective TEXT,
  goals TEXT,
  indicator TEXT,
  sort_order INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_plan_candidate ON candidate_plan_gobierno(candidate_id);

-- ==================== ENCUESTA POLLS ====================
CREATE TABLE IF NOT EXISTS encuesta_polls (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  emoji VARCHAR(10),
  category VARCHAR(100),
  options JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== ENCUESTA VOTES ====================
CREATE TABLE IF NOT EXISTS encuesta_votes (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER REFERENCES encuesta_polls(id),
  option_index INTEGER NOT NULL,
  voter_fingerprint VARCHAR(255),
  voter_ip VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_encvotes_poll ON encuesta_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_encvotes_fp ON encuesta_votes(voter_fingerprint);

-- ==================== PARTY SCORES ====================
CREATE TABLE IF NOT EXISTS party_scores (
  id SERIAL PRIMARY KEY,
  party_id INTEGER REFERENCES parties(id) UNIQUE,
  party_full_score NUMERIC(6,2) DEFAULT 0,
  ranking_position INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== USERS (for auth) ====================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  alias VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(30),
  provider VARCHAR(30),
  provider_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== ALTER existing VARCHAR(500) to TEXT ====================
ALTER TABLE candidate_events ALTER COLUMN title TYPE TEXT;
ALTER TABLE candidate_events ALTER COLUMN source TYPE TEXT;
ALTER TABLE candidate_proposals ALTER COLUMN title TYPE TEXT;
ALTER TABLE candidate_plan_gobierno ALTER COLUMN problem TYPE TEXT;
`;

async function migrate() {
  console.log('🔄 Running migrations...');
  try {
    await pool.query(TABLES_SQL);
    console.log('✅ All tables created successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
