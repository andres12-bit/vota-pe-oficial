const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api';

export interface Candidate {
    id: number;
    name: string;
    photo: string | null;
    party_id: number;
    position: string;
    region: string;
    biography: string | null;
    education: string | null;
    experience: string | null;
    birth_date: string | null;
    dni: string | null;
    intelligence_score: number;
    momentum_score: number;
    integrity_score: number;
    risk_score: number;
    stars_rating: number;
    final_score: number;
    hoja_score: number;
    plan_score: number;
    experience_score: number;
    vote_count: number;
    party_name: string;
    party_abbreviation: string;
    party_color: string;
    party_logo?: string;
    rank?: number;
    proposals?: Proposal[];
    events?: CandidateEvent[];
    vice_presidents?: VicePresident[];
    plan_gobierno?: PlanGobierno[];
    plan_pdf_url?: string;
    plan_pdf_local?: string;
    list_position?: number;
}

export interface VicePresident {
    id: number;
    candidate_id: number;
    name: string;
    position_label: string;
    photo: string | null;
    biography: string;
    sort_order: number;
}

export interface PlanGobierno {
    id: number;
    candidate_id: number;
    dimension: string;
    problem: string;
    objective: string;
    goals: string;
    indicator: string;
    sort_order: number;
}

export interface Party {
    id: number;
    name: string;
    abbreviation: string;
    logo: string | null;
    color: string;
    party_full_score: number;
    ranking_position: number;
    candidate_count: number;
}

export interface Proposal {
    id: number;
    candidate_id: number;
    title: string;
    description: string;
    category: string;
}

export interface CandidateEvent {
    id: number;
    candidate_id: number;
    event_type: string;
    title: string;
    description: string;
    impact_score: number;
    created_at: string;
}

export interface VoteStats {
    total: number;
    by_position: { position_type: string; count: string }[];
    last_hour: number;
}

// Fetch helpers
async function apiFetch<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

// Candidates
export async function getCandidates(position?: string, limit?: number): Promise<Candidate[]> {
    const qp = new URLSearchParams();
    if (position) qp.set('position', position);
    if (limit) qp.set('limit', String(limit));
    const qs = qp.toString();
    const data = await apiFetch<{ candidates: Candidate[] }>(`/candidates${qs ? '?' + qs : ''}`);
    return data.candidates;
}

export async function getCandidate(id: number): Promise<Candidate> {
    return apiFetch<Candidate>(`/candidates/${id}`);
}

// Ranking
export async function getRanking(position: string): Promise<Candidate[]> {
    const data = await apiFetch<{ ranking: Candidate[] }>(`/ranking/${position}`);
    return data.ranking;
}

export async function getCandidatesBySector(sector: string, position: string): Promise<Candidate[]> {
    const data = await apiFetch<{ candidates: Candidate[] }>(`/candidates/by-sector?sector=${encodeURIComponent(sector)}&position=${encodeURIComponent(position)}`);
    return data.candidates;
}

export async function getGlobalRankingAndMomentum() {
    return apiFetch<{ top_momentum: Candidate[]; global_ranking: Candidate[] }>('/ranking');
}

// Parties
export async function getParties(): Promise<Party[]> {
    const data = await apiFetch<{ parties: Party[] }>('/parties');
    return data.parties;
}

export async function getPartyFullTicket(id: number) {
    return apiFetch<{ party: Party; ticket: Record<string, Candidate[]>; total_candidates: number }>(`/party/${id}/full-ticket`);
}

// Voting
export async function castVote(candidate_id: number, position_type: string, fingerprint?: string) {
    const res = await fetch(`${API_BASE}/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_id, position_type, fingerprint }),
    });
    return res.json();
}

// Stats
export async function getVoteStats(): Promise<VoteStats> {
    return apiFetch<VoteStats>('/votes/stats');
}

export async function getStats() {
    return apiFetch<{ total_votes: number; total_candidates: number; total_parties: number }>('/stats');
}

// Radar
export async function getRadarAlerts() {
    return apiFetch<{ antecedentes: any[]; sinEstudios: any[]; denuncias: any[] }>('/radar/alerts');
}

export async function getRadarMetrics() {
    return apiFetch<{ global: { total_candidates: number; total_parties: number; avg_score: number; avg_integrity: number } }>('/radar/metrics');
}

// Search
export async function search(query: string) {
    return apiFetch<{ candidates: Candidate[]; proposals: Proposal[]; events: CandidateEvent[] }>(`/search?q=${encodeURIComponent(query)}`);
}

// Encuesta (Polls)
export interface EncuestaPoll {
    id: number;
    question: string;
    emoji: string;
    category: string;
    options: string[];
    is_active: boolean;
    vote_counts: Record<string, number>;
    total_votes: number;
}

export async function getEncuestas(): Promise<EncuestaPoll[]> {
    const data = await apiFetch<{ polls: EncuestaPoll[] }>('/encuesta');
    return data.polls;
}

export async function voteEncuesta(pollId: number, optionIndex: number, fingerprint?: string) {
    const res = await fetch(`${API_BASE}/encuesta/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_index: optionIndex, fingerprint }),
    });
    return res.json();
}
