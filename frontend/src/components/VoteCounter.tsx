'use client';

interface Props {
    total: number;
}

export default function VoteCounter({ total }: Props) {
    const formatted = total.toLocaleString('es-PE');

    return (
        <div className="panel-glow p-4 text-center">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--vp-red)' }}>
                    <span className="text-white text-xs font-black">VP</span>
                </div>
                <span className="text-lg font-black tracking-wider" style={{ color: 'var(--vp-text)' }}>
                    VOTA<span style={{ color: 'var(--vp-red)' }}>.PE</span>
                </span>
            </div>

            {/* Counter */}
            <div className="vote-counter my-2">
                <div className="text-3xl md:text-4xl font-black tracking-wide text-glow-red" style={{ color: 'var(--vp-red)' }}>
                    {formatted}
                </div>
                <div className="text-[10px] font-bold tracking-[3px] uppercase mt-1" style={{ color: 'var(--vp-text-dim)' }}>
                    VOTOS TOTALES
                </div>
            </div>

            {/* Mini stats */}
            <div className="flex justify-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--vp-border)' }}>
                <div className="text-center">
                    <div className="text-xs font-bold" style={{ color: 'var(--vp-green)' }}>+12.4%</div>
                    <div className="text-[9px]" style={{ color: 'var(--vp-text-dim)' }}>última hora</div>
                </div>
                <div className="text-center">
                    <div className="text-xs font-bold" style={{ color: 'var(--vp-gold)' }}>24/7</div>
                    <div className="text-[9px]" style={{ color: 'var(--vp-text-dim)' }}>en vivo</div>
                </div>
            </div>
        </div>
    );
}
