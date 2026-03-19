// Temporary debug endpoint - DELETE AFTER FIXING
import { NextResponse } from 'next/server';

export async function GET() {
    const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api';
    
    const results: Record<string, unknown> = {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        API_BASE,
        testUrl: `${API_BASE}/parties`,
    };

    try {
        const res = await fetch(`${API_BASE}/parties`, { cache: 'no-store' });
        results.fetchStatus = res.status;
        results.fetchOk = res.ok;
        const data = await res.json();
        results.partiesCount = data.parties?.length ?? 'NO parties field';
    } catch (e: unknown) {
        results.fetchError = e instanceof Error ? e.message : String(e);
    }

    return NextResponse.json(results);
}
