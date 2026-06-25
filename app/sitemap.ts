import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://memoryprint.app' // Assuming .app, change if hosted elsewhere!

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0, // Most important page
    },
    {
      url: `${baseUrl}/fridge`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8, // Secondary page
    },
  ]
}
