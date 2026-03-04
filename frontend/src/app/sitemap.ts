/**
 * VOTA.PE — Next.js Sitemap Generator
 * Auto-generates sitemap.xml for SEO
 */
import type { MetadataRoute } from 'next';

const BASE_URL = 'https://votape-web.onrender.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const routes: MetadataRoute.Sitemap = [
        { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
        { url: `${BASE_URL}/?tab=encuesta`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
        { url: `${BASE_URL}/?tab=planchas`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
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

    // Add top candidate pages (1-50)
    for (let i = 1; i <= 50; i++) {
        routes.push({
            url: `${BASE_URL}/candidate/${i}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
        });
    }

    return routes;
}
