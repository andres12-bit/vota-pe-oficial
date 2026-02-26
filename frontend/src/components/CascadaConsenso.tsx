'use client';

import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/lib/websocket';

interface VoteEvent {
    name: string;
    position: string;
    region: string;
    time: string;
    timestamp: number;
}

const POSITION_LABELS: Record<string, string> = {
    president: '🏛️ Presidente',
    senator: '👔 Senador',
    deputy: '📋 Diputado',
    andean: '🌎 P. Andino',
};

const REGIONS = [
    'Lima', 'Arequipa', 'Cusco', 'Piura', 'La Libertad', 'Junín',
    'Lambayeque', 'Tacna', 'Puno', 'Ica', 'Huancavelica', 'Cajamarca',
    'Loreto', 'Ucayali', 'San Martín', 'Tumbes', 'Moquegua', 'Ayacucho',
    'Áncash', 'Huánuco', 'Madre de Dios', 'Pasco', 'Apurímac', 'Callao',
    'Amazonas',
];

const POSITIONS = ['president', 'senator', 'deputy', 'andean'];

function timeAgo(ms: number): string {
    const seconds = Math.floor((Date.now() - ms) / 1000);
    if (seconds < 5) return 'ahora';
    if (seconds < 60) return `hace ${seconds}s`;
    return `hace ${Math.floor(seconds / 60)}m`;
}

export default function CascadaConsenso() {
    const [votes, setVotes] = useState<VoteEvent[]>([]);
    const { lastMessage } = useWebSocket();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Listen for real vote events from WebSocket
    useEffect(() => {
        if (!lastMessage || lastMessage.type !== 'vote_registered') return;
        const data = lastMessage.data as { position?: string; region?: string };
        const newVote: VoteEvent = {
            name: `Usuario ${data.region || REGIONS[Math.floor(Math.random() * REGIONS.length)]}`,
            position: data.position || POSITIONS[Math.floor(Math.random() * POSITIONS.length)],
            region: data.region || '',
            time: 'ahora',
            timestamp: Date.now(),
        };
        setVotes(prev => [newVote, ...prev].slice(0, 20));
    }, [lastMessage]);

    // Simulate periodic votes for demo/visual engagement
    useEffect(() => {
        // Generate initial demo votes
        const initial: VoteEvent[] = [];
        for (let i = 0; i < 8; i++) {
            initial.push({
                name: `Usuario ${REGIONS[Math.floor(Math.random() * REGIONS.length)]}`,
                position: POSITIONS[Math.floor(Math.random() * POSITIONS.length)],
                region: '',
                time: `hace ${(i + 1) * 4}s`,
                timestamp: Date.now() - (i + 1) * 4000,
            });
        }
        setVotes(initial);

        // Simulate new votes every 5-10 seconds
        intervalRef.current = setInterval(() => {
            const simVote: VoteEvent = {
                name: `Usuario ${REGIONS[Math.floor(Math.random() * REGIONS.length)]}`,
                position: POSITIONS[Math.floor(Math.random() * POSITIONS.length)],
                region: '',
                time: 'ahora',
                timestamp: Date.now(),
            };
            setVotes(prev => [simVote, ...prev].slice(0, 20));
        }, 5000 + Math.random() * 5000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // Update relative times every 5s
    useEffect(() => {
        const timer = setInterval(() => {
            setVotes(prev => prev.map(v => ({ ...v, time: timeAgo(v.timestamp) })));
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="panel-glow p-4">
            <h3 className="text-xs font-bold tracking-[2px] uppercase mb-4 flex items-center gap-2">
                <span style={{ color: 'var(--vp-text)' }}>CASCADA DE</span>
                <span style={{ color: 'var(--vp-red)' }}>CONSENSO</span>
            </h3>

            <div className="flex flex-col gap-1 max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                {votes.map((vote, i) => (
                    <div key={`${vote.timestamp}-${i}`} className="cascada-item animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-[11px] font-semibold" style={{ color: 'var(--vp-text)' }}>
                                    {vote.name}
                                </div>
                                <div className="text-[10px]" style={{ color: 'var(--vp-text-dim)' }}>
                                    {POSITION_LABELS[vote.position] || vote.position}
                                </div>
                            </div>
                            <span className="text-[9px]" style={{ color: 'var(--vp-text-dim)' }}>
                                {vote.time}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Indicador en vivo */}
            <div className="mt-3 pt-3 flex items-center justify-center gap-2" style={{ borderTop: '1px solid var(--vp-border)' }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--vp-red)' }} />
                <span className="text-[10px] font-bold tracking-wider" style={{ color: 'var(--vp-text-dim)' }}>
                    TRANSMISIÓN EN VIVO
                </span>
            </div>
        </div>
    );
}
