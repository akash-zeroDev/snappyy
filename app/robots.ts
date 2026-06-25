import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*', // '*' means these rules apply to all bots (Google, Bing, etc.)
      allow: '/',
      // Disallow any private API routes so bots don't hit them
      disallow: ['/api/', '/private/'], 
    },
    sitemap: 'https://memoryprint.app/sitemap.xml', // Point bots directly to your sitemap
  }
}
