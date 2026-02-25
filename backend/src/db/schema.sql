-- VOTA.PE Database Schema
-- PostgreSQL

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Parties table
CREATE TABLE IF NOT EXISTS parties (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  abbreviation VARCHAR(50),
  logo TEXT,
  color VARCHAR(7) DEFAULT '#ff1744',
  party_full_score NUMERIC(5,2) DEFAULT 0,
  ranking_position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  photo TEXT,
  party_id INTEGER REFERENCES parties(id),
  position VARCHAR(50) NOT NULL CHECK (position IN ('president', 'senator', 'deputy', 'andean')),
  region VARCHAR(100),
  biography TEXT,
  intelligence_score NUMERIC(5,2) DEFAULT 50,
  momentum_score NUMERIC(5,2) DEFAULT 0,
  integrity_score NUMERIC(5,2) DEFAULT 50,
  risk_score NUMERIC(5,2) DEFAULT 0,
  stars_rating NUMERIC(3,1) DEFAULT 3.0,
  final_score NUMERIC(5,2) DEFAULT 0,
  vote_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Candidate proposals
CREATE TABLE IF NOT EXISTS candidate_proposals (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Candidate events
CREATE TABLE IF NOT EXISTS candidate_events (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('positive', 'negative', 'corruption', 'achievement')),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  impact_score NUMERIC(5,2) DEFAULT 0,
  is_validated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
  position_type VARCHAR(50) NOT NULL,
  voter_ip VARCHAR(45),
  voter_fingerprint VARCHAR(255),
  session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users table (optional login)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  alias VARCHAR(100),
  provider VARCHAR(50) DEFAULT 'email',
  provider_id VARCHAR(255),
  is_admin BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_candidates_position ON candidates(position);
CREATE INDEX IF NOT EXISTS idx_candidates_party ON candidates(party_id);
CREATE INDEX IF NOT EXISTS idx_candidates_final_score ON candidates(final_score DESC);
CREATE INDEX IF NOT EXISTS idx_votes_candidate ON votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_votes_created ON votes(created_at);
CREATE INDEX IF NOT EXISTS idx_votes_ip ON votes(voter_ip);
CREATE INDEX IF NOT EXISTS idx_events_candidate ON candidate_events(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidates_name_trgm ON candidates USING gin(name gin_trgm_ops);

-- Full Text Search index
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS idx_candidates_search ON candidates USING gin(search_vector);

-- Party scores table
CREATE TABLE IF NOT EXISTS party_scores (
  id SERIAL PRIMARY KEY,
  party_id INTEGER REFERENCES parties(id) ON DELETE CASCADE UNIQUE,
  party_full_score NUMERIC(5,2) DEFAULT 0,
  ranking_position INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Add JNE profile columns to candidates
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS experience TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS birth_date VARCHAR(20);
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS dni VARCHAR(20);

-- Vice-presidents (for presidential formulas)
CREATE TABLE IF NOT EXISTS candidate_vice_presidents (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  position_label VARCHAR(100) NOT NULL,
  photo TEXT,
  biography TEXT,
  sort_order INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Government plan by dimension (JNE format)
CREATE TABLE IF NOT EXISTS candidate_plan_gobierno (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
  dimension VARCHAR(100) NOT NULL,
  problem TEXT,
  objective TEXT,
  goals TEXT,
  indicator TEXT,
  sort_order INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vice_presidents_candidate ON candidate_vice_presidents(candidate_id);
CREATE INDEX IF NOT EXISTS idx_plan_gobierno_candidate ON candidate_plan_gobierno(candidate_id);
