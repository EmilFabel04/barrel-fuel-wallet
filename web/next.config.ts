import type { NextConfig } from 'next';

// Static export: the site has no server, no env vars and no functions.
// See spec §3 — the consequence is that spam protection is entirely the
// form service's job, since there is no request we can inspect.
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
};

export default nextConfig;
