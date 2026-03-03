'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Candidate } from '@/lib/api';

// ── State machine: empty → draft → confirmed → editing ──
export type SelectionState = 'empty' | 'draft' | 'confirmed' | 'editing';

export interface SelectionData {
    president: Candidate | null;
    senators: Candidate[];
    deputies: Candidate[];
    andean: Candidate[];
}

interface SelectionContextType {
    state: SelectionState;
    selection: SelectionData;
    activateBuilding: () => void;
    addCandidate: (candidate: Candidate) => void;
    removeCandidate: (position: string, candidateId: number) => void;
    confirmSelection: () => void;
    editSelection: () => void;
    isInCart: (candidateId: number) => boolean;
    cartVisible: boolean;
    setCartVisible: (v: boolean) => void;
    qualityStars: number;
    qualityScore: number;
    hasPresident: boolean;
    showDraftBanner: boolean;
    dismissDraftBanner: () => void;
    justConfirmed: boolean;
    clearJustConfirmed: () => void;
    totalSelected: number;
}

const EMPTY_SELECTION: SelectionData = {
    president: null,
    senators: [],
    deputies: [],
    andean: [],
};

const SelectionContext = createContext<SelectionContextType>({
    state: 'empty',
    selection: EMPTY_SELECTION,
    activateBuilding: () => { },
    addCandidate: () => { },
    removeCandidate: () => { },
    confirmSelection: () => { },
    editSelection: () => { },
    isInCart: () => false,
    cartVisible: false,
    setCartVisible: () => { },
    qualityStars: 0,
    qualityScore: 0,
    hasPresident: false,
    showDraftBanner: false,
    dismissDraftBanner: () => { },
    justConfirmed: false,
    clearJustConfirmed: () => { },
    totalSelected: 0,
});

function computeQuality(sel: SelectionData): { stars: number; score: number } {
    const all: Candidate[] = [];
    if (sel.president) all.push(sel.president);
    all.push(...sel.senators, ...sel.deputies, ...sel.andean);
    if (all.length === 0) return { stars: 0, score: 0 };
    const avgStars = all.reduce((s, c) => s + Number(c.stars_rating || 0), 0) / all.length;
    const avgScore = all.reduce((s, c) => s + Number(c.final_score || 0), 0) / all.length;
    return { stars: Math.round(avgStars), score: Math.round(avgScore * 10) / 10 };
}

function countSelected(sel: SelectionData): number {
    let count = sel.president ? 1 : 0;
    count += sel.senators.length + sel.deputies.length + sel.andean.length;
    return count;
}

export function SelectionProvider({ children }: { children: ReactNode }) {
    const [selection, setSelection] = useState<SelectionData>(EMPTY_SELECTION);
    const [state, setState] = useState<SelectionState>('empty');
    const [cartVisible, setCartVisible] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [showDraftBanner, setShowDraftBanner] = useState(false);
    const [justConfirmed, setJustConfirmed] = useState(false);

    // Load from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('vp_selection');
            const storedState = localStorage.getItem('vp_selection_state');
            if (stored) {
                try {
                    const data = JSON.parse(stored) as SelectionData;
                    setSelection(data);
                    const hasCandidates = data.president || data.senators.length || data.deputies.length || data.andean.length;

                    if (storedState === 'confirmed') {
                        setState('confirmed');
                        setCartVisible(true);
                    } else if (hasCandidates) {
                        // User had a draft — show recovery banner
                        setState('draft');
                        setShowDraftBanner(true);
                    }
                } catch { /* ignore */ }
            }
            setLoaded(true);
        }
    }, []);

    // Persist to localStorage on every change
    useEffect(() => {
        if (loaded && typeof window !== 'undefined') {
            localStorage.setItem('vp_selection', JSON.stringify(selection));
            localStorage.setItem('vp_selection_state', state);
        }
    }, [selection, state, loaded]);

    const activateBuilding = useCallback(() => {
        setState('draft');
        setCartVisible(true);
        setShowDraftBanner(false);
    }, []);

    const dismissDraftBanner = useCallback(() => {
        setShowDraftBanner(false);
        setCartVisible(true);
    }, []);

    const MAX_PER_POSITION = 2; // Max 2 for senators, deputies, andean

    const addCandidate = useCallback((candidate: Candidate) => {
        setSelection(prev => {
            const next = { ...prev };
            const pos = candidate.position;
            if (pos === 'president') {
                next.president = candidate;
            } else if (pos === 'senator') {
                if (!next.senators.find(c => c.id === candidate.id)) {
                    const updated = [...next.senators, candidate];
                    next.senators = updated.length > MAX_PER_POSITION ? updated.slice(-MAX_PER_POSITION) : updated;
                }
            } else if (pos === 'deputy') {
                if (!next.deputies.find(c => c.id === candidate.id)) {
                    const updated = [...next.deputies, candidate];
                    next.deputies = updated.length > MAX_PER_POSITION ? updated.slice(-MAX_PER_POSITION) : updated;
                }
            } else if (pos === 'andean') {
                if (!next.andean.find(c => c.id === candidate.id)) {
                    const updated = [...next.andean, candidate];
                    next.andean = updated.length > MAX_PER_POSITION ? updated.slice(-MAX_PER_POSITION) : updated;
                }
            }
            return next;
        });
        // Auto-transition to draft if empty
        setState(prev => prev === 'empty' ? 'draft' : prev);
        setCartVisible(true);
        setShowDraftBanner(false);
    }, []);

    const removeCandidate = useCallback((position: string, candidateId: number) => {
        setSelection(prev => {
            const next = { ...prev };
            if (position === 'president') {
                // In editing mode, can't remove president — only swap
                if (state === 'editing') return prev;
                next.president = null;
            } else if (position === 'senator') {
                next.senators = next.senators.filter(c => c.id !== candidateId);
            } else if (position === 'deputy') {
                next.deputies = next.deputies.filter(c => c.id !== candidateId);
            } else if (position === 'andean') {
                next.andean = next.andean.filter(c => c.id !== candidateId);
            }
            return next;
        });
    }, [state]);

    const confirmSelection = useCallback(() => {
        if (!selection.president) return;
        setState('confirmed');
        setJustConfirmed(true);
        setCartVisible(true);
    }, [selection]);

    const clearJustConfirmed = useCallback(() => {
        setJustConfirmed(false);
    }, []);

    const editSelection = useCallback(() => {
        setState('editing');
        setCartVisible(true);
    }, []);

    const isInCart = useCallback((candidateId: number): boolean => {
        if (selection.president?.id === candidateId) return true;
        if (selection.senators.some(c => c.id === candidateId)) return true;
        if (selection.deputies.some(c => c.id === candidateId)) return true;
        if (selection.andean.some(c => c.id === candidateId)) return true;
        return false;
    }, [selection]);

    const { stars: qualityStars, score: qualityScore } = computeQuality(selection);
    const hasPresident = selection.president !== null;
    const totalSelected = countSelected(selection);

    return (
        <SelectionContext.Provider value={{
            state,
            selection,
            activateBuilding,
            addCandidate,
            removeCandidate,
            confirmSelection,
            editSelection,
            isInCart,
            cartVisible,
            setCartVisible,
            qualityStars,
            qualityScore,
            hasPresident,
            showDraftBanner,
            dismissDraftBanner,
            justConfirmed,
            clearJustConfirmed,
            totalSelected,
        }}>
            {children}
        </SelectionContext.Provider>
    );
}

export function useSelection() {
    return useContext(SelectionContext);
}
