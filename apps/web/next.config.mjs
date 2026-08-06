/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@cursorkit/engine'],

  // Dev and production builds get separate output directories.
  //
  // They share `.next` by default, so running `npm run build` while `npm run
  // dev` is up overwrites the chunks the dev server has already handed to the
  // browser. The result is a server that 500s on every request with
  // MODULE_NOT_FOUND until you delete `.next` and restart — which looks like
  // "localhost is broken" and gives no hint of the cause. Splitting the
  // directories makes the two safe to run at the same time.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  async headers() {
    return [
      {
        // The embed is loaded cross-origin by definition — every site that
        // installs CursorKit is a third party to this one.
        source: '/embed.js',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
