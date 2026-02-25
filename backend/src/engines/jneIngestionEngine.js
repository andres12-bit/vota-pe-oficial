/**
 * JNE Data Ingestion Module
 * 
 * Handles fetching and parsing candidate data from the official
 * Jurado Nacional de Elecciones (JNE) Voto Informado portal.
 * 
 * Sources:
 * - https://votoinformado.jne.gob.pe/presidente-vicepresidentes
 * - https://votoinformado.jne.gob.pe/senadores
 * - https://votoinformado.jne.gob.pe/diputados
 * - https://votoinformado.jne.gob.pe/parlamento-andino
 */

const pool = require('../db/pool');

const JNE_SOURCES = {
    president: {
        url: 'https://votoinformado.jne.gob.pe/presidente-vicepresidentes',
        apiUrl: 'https://votoinformado.jne.gob.pe/votoinformado/api/candidato/presidente',
        position: 'president',
        label: 'Presidente'
    },
    senator: {
        url: 'https://votoinformado.jne.gob.pe/senadores',
        apiUrl: 'https://votoinformado.jne.gob.pe/votoinformado/api/candidato/senadores',
        position: 'senator',
        label: 'Senador'
    },
    deputy: {
        url: 'https://votoinformado.jne.gob.pe/diputados',
        apiUrl: 'https://votoinformado.jne.gob.pe/votoinformado/api/candidato/diputados',
        position: 'deputy',
        label: 'Diputado'
    },
    andean: {
        url: 'https://votoinformado.jne.gob.pe/parlamento-andino',
        apiUrl: 'https://votoinformado.jne.gob.pe/votoinformado/api/candidato/parlamento-andino',
        position: 'andean',
        label: 'Parlamento Andino'
    }
};

class JNEIngestionEngine {
    /**
     * Attempt to fetch candidate data from JNE API
     * Note: The actual JNE API URLs may require different endpoints.
     * This module provides the framework for ingestion.
     */
    static async fetchFromJNE(source) {
        try {
            const response = await fetch(source.apiUrl, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'VOTA.PE Electoral Intelligence System'
                },
                signal: AbortSignal.timeout(10000) // 10s timeout
            });

            if (!response.ok) {
                throw new Error(`JNE API returned ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (err) {
            console.warn(`[JNE] Could not fetch from ${source.apiUrl}: ${err.message}`);
            return null;
        }
    }

    /**
     * Parse JNE candidate data into our format
     */
    static parseCandidateData(rawData, position) {
        if (!rawData || !Array.isArray(rawData)) return [];

        return rawData.map(item => ({
            name: item.strCandidato || item.nombre || item.strNombreCompleto || '',
            photo: item.strFoto || item.foto || null,
            party: item.strOrganizacionPolitica || item.partido || '',
            position: position,
            region: item.strDistritoElectoral || item.region || '',
            biography: item.strHojaVida || item.hojaVida || '',
            proposals: item.planGobierno || item.propuestas || [],
        }));
    }

    /**
     * Upsert a party by name, return its ID
     */
    static async ensureParty(partyName, client) {
        if (!partyName) return null;

        // Check if exists
        const existing = await client.query(
            'SELECT id FROM parties WHERE name = $1',
            [partyName]
        );

        if (existing.rows.length > 0) return existing.rows[0].id;

        // Create new party
        const abbreviation = partyName.split(' ')
            .filter(w => w.length > 2)
            .map(w => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 5);

        const colors = ['#FF6600', '#0066CC', '#7B1FA2', '#D32F2F', '#1565C0', '#2E7D32', '#C62828', '#00897B', '#FF8F00', '#F44336'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        const result = await client.query(
            'INSERT INTO parties (name, abbreviation, color) VALUES ($1, $2, $3) RETURNING id',
            [partyName, abbreviation, color]
        );
        return result.rows[0].id;
    }

    /**
     * Ingest candidates from a parsed dataset
     */
    static async ingestCandidates(candidates, position) {
        const client = await pool.connect();
        let inserted = 0;
        let updated = 0;
        let errors = 0;

        try {
            await client.query('BEGIN');

            for (const c of candidates) {
                try {
                    if (!c.name || c.name.trim() === '') continue;

                    const partyId = await this.ensureParty(c.party, client);
                    if (!partyId) continue;

                    // Check if candidate already exists (by name + party + position)
                    const existing = await client.query(
                        'SELECT id FROM candidates WHERE name = $1 AND party_id = $2 AND position = $3',
                        [c.name, partyId, position]
                    );

                    if (existing.rows.length > 0) {
                        // Update existing
                        await client.query(
                            `UPDATE candidates SET 
                photo = COALESCE($1, photo),
                region = COALESCE($2, region),
                biography = COALESCE($3, biography),
                updated_at = NOW()
               WHERE id = $4`,
                            [c.photo, c.region, c.biography, existing.rows[0].id]
                        );
                        updated++;
                    } else {
                        // Insert new
                        const result = await client.query(
                            `INSERT INTO candidates (name, photo, party_id, position, region, biography, intelligence_score, momentum_score, integrity_score, risk_score, stars_rating, final_score)
               VALUES ($1, $2, $3, $4, $5, $6, 50, 0, 50, 25, 3.0, 30) RETURNING id`,
                            [c.name, c.photo, partyId, position, c.region || '', c.biography || '']
                        );

                        // Insert proposals if available
                        if (c.proposals && Array.isArray(c.proposals)) {
                            for (const prop of c.proposals) {
                                const title = typeof prop === 'string' ? prop : (prop.titulo || prop.title || '');
                                if (title) {
                                    await client.query(
                                        'INSERT INTO candidate_proposals (candidate_id, title, category, description) VALUES ($1, $2, $3, $4)',
                                        [result.rows[0].id, title, 'JNE', typeof prop === 'string' ? '' : (prop.descripcion || prop.description || '')]
                                    );
                                }
                            }
                        }
                        inserted++;
                    }
                } catch (err) {
                    console.error(`[JNE] Error processing candidate ${c.name}:`, err.message);
                    errors++;
                }
            }

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

        return { inserted, updated, errors, total: candidates.length };
    }

    /**
     * Run full ingestion from all JNE sources
     */
    static async runFullIngestion() {
        const results = {};

        for (const [key, source] of Object.entries(JNE_SOURCES)) {
            console.log(`[JNE] Ingesting ${source.label}...`);

            const rawData = await this.fetchFromJNE(source);
            if (rawData) {
                const parsed = this.parseCandidateData(rawData, source.position);
                results[key] = await this.ingestCandidates(parsed, source.position);
                console.log(`[JNE] ${source.label}: ${results[key].inserted} inserted, ${results[key].updated} updated`);
            } else {
                results[key] = { status: 'skipped', reason: 'Could not fetch from JNE API' };
                console.log(`[JNE] ${source.label}: Skipped (API unavailable)`);
            }
        }

        // Update search vectors for new candidates
        await pool.query(`
      UPDATE candidates SET search_vector = 
        to_tsvector('spanish', COALESCE(name, '') || ' ' || COALESCE(region, '') || ' ' || COALESCE(biography, ''))
      WHERE search_vector IS NULL
    `);

        return results;
    }

    /**
     * Get ingestion status/summary
     */
    static async getIngestionStatus() {
        const counts = await pool.query(`
      SELECT position, COUNT(*) as cnt, MAX(updated_at) as last_updated
      FROM candidates
      GROUP BY position
      ORDER BY position
    `);

        return {
            sources: JNE_SOURCES,
            current_data: counts.rows,
            last_check: new Date().toISOString()
        };
    }
}

module.exports = JNEIngestionEngine;
