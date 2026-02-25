'use client';

interface Vote {
    name: string;
    party: string;
    time: string;
}

interface Props {
    votes: Vote[];
}

export default function CascadaConsenso({ votes }: Props) {
    // Generate demo votes if empty
    const displayVotes = votes.length > 0 ? votes : [
        { name: 'Usuario Lima', party: 'president', time: 'hace 2s' },
        { name: 'Usuario Arequipa', party: 'senator', time: 'hace 5s' },
        { name: 'Usuario Cusco', party: 'deputy', time: 'hace 8s' },
        { name: 'Usuario Piura', party: 'president', time: 'hace 12s' },
        { name: 'Usuario Tacna', party: 'andean', time: 'hace 15s' },
        { name: 'Usuario Junín', party: 'senator', time: 'hace 20s' },
        { name: 'Usuario Lambayeque', party: 'president', time: 'hace 25s' },
        { name: 'Usuario La Libertad', party: 'deputy', time: 'hace 30s' },
    ];

    const positionLabels: Record<string, string> = {
        president: '🏛️ Presidente',
        senator: '👔 Senador',
        deputy: '📋 Diputado',
        andean: '🌎 P. Andino'
    };

    return (
        <div className="panel-glow p-4">
            <h3 className="text-xs font-bold tracking-[2px] uppercase mb-4 flex items-center gap-2">
                <span style={{ color: 'var(--vp-text)' }}>CASCADA DE</span>
                <span style={{ color: 'var(--vp-red)' }}>CONSENSO</span>
            </h3>

            <div className="flex flex-col gap-1 max-h-[400px] overflow-y-auto">
                {displayVotes.map((vote, i) => (
                    <div key={i} className="cascada-item animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-[11px] font-semibold" style={{ color: 'var(--vp-text)' }}>
                                    {vote.name}
                                </div>
                                <div className="text-[10px]" style={{ color: 'var(--vp-text-dim)' }}>
                                    {positionLabels[vote.party] || vote.party}
                                </div>
                            </div>
                            <span className="text-[9px]" style={{ color: 'var(--vp-text-dim)' }}>
                                {vote.time}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Live indicator */}
            <div className="mt-3 pt-3 flex items-center justify-center gap-2" style={{ borderTop: '1px solid var(--vp-border)' }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--vp-red)' }} />
                <span className="text-[10px] font-bold tracking-wider" style={{ color: 'var(--vp-text-dim)' }}>
                    TRANSMISIÓN EN VIVO
                </span>
            </div>
        </div>
    );
}
