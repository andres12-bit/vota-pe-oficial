/**
 * Candidate avatar URL generator.
 * Uses DiceBear Avatars API for unique, deterministic avatars based on candidate names.
 * Falls back to UI Avatars if DiceBear is unreachable.
 */

const DICEBEAR_BASE = 'https://api.dicebear.com/7.x/initials/svg';

/**
 * Generate a deterministic avatar URL for a candidate.
 * @param name - Candidate full name
 * @param size - Avatar size in pixels (default 40)
 * @param color - Party color hex (without #) for background
 */
export function getAvatarUrl(name: string, size = 40, color?: string): string {
    const seed = encodeURIComponent(name);
    const bg = color ? color.replace('#', '') : 'ff1744';
    return `${DICEBEAR_BASE}?seed=${seed}&size=${size}&backgroundColor=${bg}&fontFamily=Arial&fontSize=38&bold=true`;
}

/**
 * Get initials from a candidate name (first + last initial).
 */
export function getInitials(name: string): string {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
