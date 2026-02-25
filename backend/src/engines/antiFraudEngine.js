const pool = require('../db/pool');

/**
 * Anti-fraud middleware and detection engine.
 * Detects bots, spam, and duplicate voting using IP, fingerprint, and behavioral patterns.
 */
class AntiFraudEngine {
    // Rate limits per window
    static LIMITS = {
        VOTES_PER_MINUTE: 5,
        VOTES_PER_HOUR: 30,
        VOTES_PER_DAY: 100,
        REQUESTS_PER_MINUTE: 60,
    };

    /**
     * Check if a voter is suspicious based on IP and fingerprint patterns
     */
    static async checkVoter(voterIp, fingerprint) {
        const issues = [];
        let riskLevel = 'low'; // low, medium, high, blocked

        // Check if IP is blocked
        const blocked = await this.isBlocked(voterIp, fingerprint);
        if (blocked) {
            return { allowed: false, riskLevel: 'blocked', issues: ['IP or fingerprint is blocked'] };
        }

        // 1. Check votes per minute (burst detection)
        const votesPerMinute = await pool.query(
            `SELECT COUNT(*) as cnt FROM votes 
       WHERE (voter_ip = $1 OR voter_fingerprint = $2) 
       AND created_at > NOW() - INTERVAL '1 minute'`,
            [voterIp, fingerprint || '']
        );
        if (parseInt(votesPerMinute.rows[0].cnt) >= this.LIMITS.VOTES_PER_MINUTE) {
            issues.push('Too many votes per minute');
            riskLevel = 'high';
        }

        // 2. Check votes per hour
        const votesPerHour = await pool.query(
            `SELECT COUNT(*) as cnt FROM votes 
       WHERE (voter_ip = $1 OR voter_fingerprint = $2) 
       AND created_at > NOW() - INTERVAL '1 hour'`,
            [voterIp, fingerprint || '']
        );
        if (parseInt(votesPerHour.rows[0].cnt) >= this.LIMITS.VOTES_PER_HOUR) {
            issues.push('Too many votes per hour');
            riskLevel = 'high';
        }

        // 3. Check votes per day
        const votesPerDay = await pool.query(
            `SELECT COUNT(*) as cnt FROM votes 
       WHERE (voter_ip = $1 OR voter_fingerprint = $2) 
       AND created_at > NOW() - INTERVAL '24 hours'`,
            [voterIp, fingerprint || '']
        );
        if (parseInt(votesPerDay.rows[0].cnt) >= this.LIMITS.VOTES_PER_DAY) {
            issues.push('Daily vote limit exceeded');
            riskLevel = 'blocked';
        }

        // 4. Check for same-candidate duplicate voting (within 1 hour)
        // This is checked separately since official rules have their own per-position limits

        // 5. Pattern detection: voting for same candidate repeatedly
        const sameCandidate = await pool.query(
            `SELECT candidate_id, COUNT(*) as cnt FROM votes 
       WHERE (voter_ip = $1 OR voter_fingerprint = $2)
       AND created_at > NOW() - INTERVAL '6 hours'
       GROUP BY candidate_id
       HAVING COUNT(*) > 3`,
            [voterIp, fingerprint || '']
        );
        if (sameCandidate.rows.length > 0) {
            issues.push('Suspicious repeated voting pattern for same candidate');
            riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
        }

        // 6. Check for rapid sequential votes (less than 2 seconds apart)
        const rapidVotes = await pool.query(
            `SELECT created_at FROM votes 
       WHERE (voter_ip = $1 OR voter_fingerprint = $2)
       ORDER BY created_at DESC LIMIT 2`,
            [voterIp, fingerprint || '']
        );
        if (rapidVotes.rows.length >= 2) {
            const diff = new Date(rapidVotes.rows[0].created_at) - new Date(rapidVotes.rows[1].created_at);
            if (diff < 2000) { // less than 2 seconds
                issues.push('Votes too rapid — possible bot');
                riskLevel = 'high';
            }
        }

        return {
            allowed: riskLevel !== 'blocked',
            riskLevel,
            issues,
            stats: {
                votes_last_minute: parseInt(votesPerMinute.rows[0].cnt),
                votes_last_hour: parseInt(votesPerHour.rows[0].cnt),
                votes_last_day: parseInt(votesPerDay.rows[0].cnt),
            }
        };
    }

    /**
     * Check if IP or fingerprint is in the blocked list
     */
    static async isBlocked(ip, fingerprint) {
        // Using a simple in-memory set for now (move to Redis/DB in production)
        if (!this._blockedIps) this._blockedIps = new Set();
        if (!this._blockedFingerprints) this._blockedFingerprints = new Set();

        return this._blockedIps.has(ip) || (fingerprint && this._blockedFingerprints.has(fingerprint));
    }

    /**
     * Block an IP address
     */
    static async blockIP(ip) {
        if (!this._blockedIps) this._blockedIps = new Set();
        this._blockedIps.add(ip);
        return { blocked: true, ip };
    }

    /**
     * Unblock an IP address
     */
    static async unblockIP(ip) {
        if (this._blockedIps) this._blockedIps.delete(ip);
        return { unblocked: true, ip };
    }

    /**
     * Block a fingerprint
     */
    static async blockFingerprint(fingerprint) {
        if (!this._blockedFingerprints) this._blockedFingerprints = new Set();
        this._blockedFingerprints.add(fingerprint);
        return { blocked: true, fingerprint };
    }

    /**
     * Get fraud statistics
     */
    static async getStats() {
        const totalVotes = await pool.query('SELECT COUNT(*) as cnt FROM votes');
        const uniqueIps = await pool.query('SELECT COUNT(DISTINCT voter_ip) as cnt FROM votes');
        const uniqueFingerprints = await pool.query(
            "SELECT COUNT(DISTINCT voter_fingerprint) as cnt FROM votes WHERE voter_fingerprint != ''"
        );

        // Suspicious voters (more than 50 votes in 24h)
        const suspicious = await pool.query(`
      SELECT voter_ip, COUNT(*) as vote_count 
      FROM votes 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY voter_ip 
      HAVING COUNT(*) > 50
      ORDER BY vote_count DESC
    `);

        return {
            total_votes: parseInt(totalVotes.rows[0].cnt),
            unique_ips: parseInt(uniqueIps.rows[0].cnt),
            unique_fingerprints: parseInt(uniqueFingerprints.rows[0].cnt),
            suspicious_voters: suspicious.rows,
            blocked_ips: this._blockedIps ? this._blockedIps.size : 0,
            blocked_fingerprints: this._blockedFingerprints ? this._blockedFingerprints.size : 0,
        };
    }

    /**
     * Delete fraudulent votes from an IP
     */
    static async deleteFraudulentVotes(voterIp) {
        const result = await pool.query(
            'DELETE FROM votes WHERE voter_ip = $1 RETURNING candidate_id',
            [voterIp]
        );

        // Recalculate affected candidates
        const affectedIds = [...new Set(result.rows.map(r => r.candidate_id))];
        const RankingEngine = require('./rankingEngine');
        for (const cid of affectedIds) {
            await pool.query(
                'UPDATE candidates SET vote_count = (SELECT COUNT(*) FROM votes WHERE candidate_id = $1) WHERE id = $1',
                [cid]
            );
            await RankingEngine.recalculateCandidate(cid);
        }

        return { deleted: result.rowCount, affected_candidates: affectedIds };
    }
}

module.exports = AntiFraudEngine;
