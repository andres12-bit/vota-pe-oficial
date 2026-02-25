'use client';

type TabType = 'votar' | 'encuesta' | 'planchas' | 'president' | 'senator' | 'deputy' | 'andean';

interface Props {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

const MOBILE_TABS = [
    { id: 'encuesta' as TabType, label: 'ENCUESTA', icon: '📊' },
    { id: 'votar' as TabType, label: 'VOTAR', icon: '🗳️' },
    { id: 'planchas' as TabType, label: 'PLANCHAS', icon: '🏛️' },
    { id: 'senator' as TabType, label: 'SENADORES', icon: '👔' },
    { id: 'deputy' as TabType, label: 'DIPUTADOS', icon: '📋' },
];

export default function MobileTabBar({ activeTab, onTabChange }: Props) {
    return (
        <div className="mobile-tab-bar mobile-only">
            <div className="flex w-full justify-around">
                {MOBILE_TABS.map(tab => (
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
    );
}
