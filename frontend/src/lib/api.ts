const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
export async function getCandidates(position?: string): Promise<Candidate[]> {
    const params = position ? `?position=${position}` : '';
    const data = await apiFetch<{ candidates: Candidate[] }>(`/api/candidates${params}`);
    return data.candidates;
}

export async function getCandidate(id: number): Promise<Candidate> {
    return apiFetch<Candidate>(`/api/candidates/${id}`);
}

// Ranking
export async function getRanking(position: string): Promise<Candidate[]> {
    const data = await apiFetch<{ ranking: Candidate[] }>(`/api/ranking/${position}`);
    return data.ranking;
}

export async function getGlobalRankingAndMomentum() {
    return apiFetch<{ top_momentum: Candidate[]; global_ranking: Candidate[] }>('/api/ranking');
}

// Parties
export async function getParties(): Promise<Party[]> {
    const data = await apiFetch<{ parties: Party[] }>('/api/parties');
    return data.parties;
}

export async function getPartyFullTicket(id: number) {
    return apiFetch<{ party: Party; ticket: Record<string, Candidate[]>; total_candidates: number }>(`/api/party/${id}/full-ticket`);
}

// Voting
export async function castVote(candidate_id: number, position_type: string, fingerprint?: string) {
    const res = await fetch(`${API_BASE}/api/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_id, position_type, fingerprint }),
    });
    return res.json();
}

// Stats
export async function getVoteStats(): Promise<VoteStats> {
    return apiFetch<VoteStats>('/api/votes/stats');
}

export async function getStats() {
    return apiFetch<{ total_votes: number; total_candidates: number; total_parties: number }>('/api/stats');
}

// Search
export async function search(query: string) {
    return apiFetch<{ candidates: Candidate[]; proposals: Proposal[]; events: CandidateEvent[] }>(`/api/search?q=${encodeURIComponent(query)}`);
}
