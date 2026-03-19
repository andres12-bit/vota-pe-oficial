/**
 * PulsoElectoral.pe — Next.js Sitemap Generator
 * Auto-generates sitemap.xml for SEO
 */
import type { MetadataRoute } from 'next';

const BASE_URL = 'https://pulsoelectoral.pe';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const routes: MetadataRoute.Sitemap = [
        // Core pages
        { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
        { url: `${BASE_URL}/?tab=encuesta`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
        { url: `${BASE_URL}/?tab=planchas`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
        { url: `${BASE_URL}/?tab=comparar`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
        { url: `${BASE_URL}/radar`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    ];

    // Add party pages (1-40)
    for (let i = 1; i <= 40; i++) {
        routes.push({
            url: `${BASE_URL}/party/${i}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
        });
    }

    // Add candidate pages — presidential (top priority) + first 200 others
    for (let i = 1; i <= 250; i++) {
        routes.push({
            url: `${BASE_URL}/candidate/${i}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: i <= 50 ? 0.8 : 0.6,
        });
    }

    return routes;
}
