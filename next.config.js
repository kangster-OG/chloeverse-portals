const path = require('path')

/** @type {import('next').NextConfig} */
module.exports = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // This can silence the "inferred your workspace root" warning if you have other lockfiles elsewhere.
  turbopack: {
    root: path.join(__dirname),
  },
  async rewrites() {
    return [
      {
        source: '/models/:path*',
        destination: '/work-retro/models/:path*',
      },
      {
        source: '/fonts/:path*',
        destination: '/work-retro/fonts/:path*',
      },
      {
        source: '/textures/:path*',
        destination: '/work-retro/textures/:path*',
      },
      {
        source: '/images/:path*',
        destination: '/work-retro/images/:path*',
      },
    ]
  },
}
