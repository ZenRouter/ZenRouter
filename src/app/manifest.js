export default function manifest() {
  return {
    name: 'ZenRoute - Serene AI Gateway & Intelligent Routing Engine',
    short_name: 'ZenRoute',
    description: 'Serene AI Gateway & Intelligent Routing Engine. Cultivate, prune, and route all your AI models from a single unified gateway.',
    start_url: '/',
    display: 'standalone',
    background_color: '#12161f',
    theme_color: '#12161f',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
