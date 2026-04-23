import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://www.dsgemslk.com/', lastModified: new Date(), priority: 1 },
    { url: 'https://www.dsgemslk.com/about', lastModified: new Date(), priority: 0.8 },
    { url: 'https://www.dsgemslk.com/contact', lastModified: new Date(), priority: 0.7 },
  ]
}