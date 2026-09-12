import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Stops `next dev` appending its own block of instructions to CLAUDE.md and
  // putting it back every time it's removed. That file is written by hand and
  // says what it needs to say.
  agentRules: false,

  // The app always opens on Nutrition → Today. The home screen app on the phone
  // was installed pointing at "/", and iOS keeps that address, so "/" has to go
  // on working — it's answered here, before any page is drawn.
  async redirects() {
    return [{ source: "/", destination: "/meals", permanent: false }];
  },
};

export default nextConfig;
