'use client';

/**
 * Accurate Peru map SVG outline with neon styling.
 * Path data derived from Natural Earth GeoJSON (world.geo.json).
 * 58 coordinate points defining the exact Peru geographic border.
 */
export default function PeruMapSVG() {
    return (
        <svg
            viewBox="0 0 500 600"
            xmlns="http://www.w3.org/2000/svg"
            className="peru-svg-map"
            aria-label="Mapa del Perú"
            preserveAspectRatio="xMidYMid meet"
        >
            {/* Neon glow filter */}
            <defs>
                <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur1" />
                    <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur2" />
                    <feMerge>
                        <feMergeNode in="blur2" />
                        <feMergeNode in="blur1" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                {/* Subtle fill gradient */}
                <radialGradient id="peruFill" cx="45%" cy="50%" r="55%">
                    <stop offset="0%" stopColor="#ff1744" stopOpacity="0.06" />
                    <stop offset="100%" stopColor="#ff1744" stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* Peru country outline — from Natural Earth GeoJSON */}
            <g filter="url(#neonGlow)">
                <path
                    d="M 416.8 556.5 L 408.6 572.2 L 392.8 580.0 L 362.1 562.4 L 359.5 549.9 L 298.8 519.1 L 243.9 485.6 L 220.3 466.8 L 207.6 441.5 L 212.6 432.6 L 186.7 392.5 L 156.5 336.0 L 127.6 275.0 L 115.0 261.1 L 105.4 238.5 L 81.6 218.5 L 59.8 206.1 L 69.7 192.5 L 54.9 163.3 L 64.4 141.8 L 88.8 122.5 L 92.4 135.2 L 83.7 142.5 L 84.5 153.7 L 97.2 151.3 L 109.6 154.6 L 122.4 170.1 L 139.7 157.5 L 145.5 136.8 L 164.3 110.2 L 201.1 98.1 L 234.5 66.1 L 244.0 46.2 L 239.7 22.9 L 247.9 20.0 L 268.3 34.5 L 278.0 49.0 L 292.2 56.8 L 310.2 88.9 L 333.0 92.8 L 349.9 84.7 L 361.0 90.0 L 379.3 87.3 L 402.8 101.7 L 383.0 132.8 L 392.2 133.6 L 407.5 149.8 L 379.9 148.4 L 375.8 153.0 L 350.7 158.9 L 315.7 179.7 L 313.5 194.0 L 305.7 204.7 L 308.7 221.2 L 290.2 230.1 L 290.2 243.0 L 282.2 248.6 L 294.9 276.2 L 311.9 294.8 L 305.5 307.9 L 325.8 309.7 L 337.4 326.1 L 364.4 326.8 L 389.5 308.8 L 387.4 355.3 L 401.4 358.8 L 418.6 353.6 L 445.1 402.8 L 438.5 413.2 L 437.0 434.7 L 436.4 460.8 L 424.5 476.1 L 430.0 487.4 L 422.9 497.7 L 436.1 523.4 L 416.8 556.5 Z"
                    fill="url(#peruFill)"
                    stroke="var(--vp-red)"
                    strokeWidth="1.2"
                    strokeOpacity="0.6"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
            </g>

            {/* Department borders — simplified internal lines */}
            <g opacity="0.15" stroke="var(--vp-red)" strokeWidth="0.6" fill="none" strokeLinejoin="round">
                {/* Tumbes/Piura border */}
                <path d="M 64.4 141.8 L 97 151 L 110 155" />
                {/* Lambayeque/La Libertad horizontal */}
                <path d="M 127.6 275 L 200 250 L 290 243" />
                {/* Cajamarca/Amazonas area */}
                <path d="M 164.3 110 L 200 130 L 244 46" />
                {/* Lima coast to Junín */}
                <path d="M 186.7 392 L 250 370 L 310 325" />
                {/* Arequipa/Cusco/Puno horizontal */}
                <path d="M 298.8 519 L 370 490 L 430 487" />
                {/* Ica/Ayacucho */}
                <path d="M 220 467 L 300 440 L 365 327" />
                {/* Ucayali vertical spine */}
                <path d="M 310 89 L 330 180 L 340 280 L 310 310" />
                {/* Loreto/San Martin */}
                <path d="M 244 46 L 290 100 L 350 85" />
                {/* Madre de Dios */}
                <path d="M 389.5 309 L 420 354 L 445 403" />
                {/* Ancash/Huanuco */}
                <path d="M 156.5 336 L 230 305 L 282 249" />
            </g>

            {/* Region dots — major cities */}
            <g>
                {/* Lima */}
                <circle cx="187" cy="393" r="2.5" fill="var(--vp-red)" opacity="0.45">
                    <animate attributeName="opacity" values="0.45;0.7;0.45" dur="3s" repeatCount="indefinite" />
                </circle>
                {/* Cusco */}
                <circle cx="365" cy="327" r="2" fill="var(--vp-red)" opacity="0.35" />
                {/* Arequipa */}
                <circle cx="299" cy="519" r="2" fill="var(--vp-red)" opacity="0.35" />
                {/* Trujillo */}
                <circle cx="157" cy="270" r="1.8" fill="var(--vp-red)" opacity="0.3" />
                {/* Iquitos */}
                <circle cx="310" cy="89" r="1.8" fill="var(--vp-red)" opacity="0.3" />
                {/* Piura */}
                <circle cx="89" cy="123" r="1.8" fill="var(--vp-red)" opacity="0.3" />
                {/* Huancayo */}
                <circle cx="250" cy="370" r="1.8" fill="var(--vp-red)" opacity="0.3" />
                {/* Puno */}
                <circle cx="417" cy="490" r="1.8" fill="var(--vp-red)" opacity="0.3" />
            </g>

            {/* City labels */}
            <g fontSize="6" fill="var(--vp-red)" opacity="0.3" fontWeight="600" fontFamily="monospace" letterSpacing="1">
                <text x="192" y="389">LIMA</text>
                <text x="370" y="323">CUSCO</text>
                <text x="304" y="515">AQP</text>
                <text x="315" y="86">IQT</text>
            </g>
        </svg>
    );
}
