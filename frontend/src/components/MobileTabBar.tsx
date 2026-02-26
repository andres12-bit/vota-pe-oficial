'use client';

type TabType = 'votar' | 'encuesta' | 'planchas' | 'president' | 'senator' | 'deputy' | 'andean';

interface Props {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

// Bottom bar: main election categories
const BOTTOM_TABS = [
    { id: 'president' as TabType, label: 'PRESIDENTE', icon: '🏛️' },
    { id: 'deputy' as TabType, label: 'DIPUTADOS', icon: '📋' },
    { id: 'planchas' as TabType, label: 'PLANCHAS', icon: '🗂️' },
    { id: 'senator' as TabType, label: 'SENADORES', icon: '👔' },
    { id: 'andean' as TabType, label: 'P.ANDINO', icon: '🌎' },
];

// Top buttons: special modules
const TOP_TABS = [
    { id: 'encuesta' as TabType, label: 'ENCUESTA', icon: '📊' },
    { id: 'votar' as TabType, label: 'VOTAR', icon: '🗳️' },
];

export default function MobileTabBar({ activeTab, onTabChange }: Props) {
    return (
        <>
            {/* Top header buttons for ENCUESTA and VOTAR — mobile only */}
            <div className="mobile-top-buttons mobile-only">
                {TOP_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`mobile-top-btn ${activeTab === tab.id ? 'active' : ''}`}
                    >
                        <span className="mobile-top-btn-icon">{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Bottom tab bar — main navigation */}
            <div className="mobile-tab-bar mobile-only">
                <div className="flex w-full justify-around">
                    {BOTTOM_TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            <div className="tab-icon">{tab.icon}</div>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
