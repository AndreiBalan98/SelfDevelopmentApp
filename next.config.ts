import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Stops `next dev` appending its own block of instructions to CLAUDE.md and
  // putting it back every time it's removed. That file is written by hand and
  // says what it needs to say.
  agentRules: false,
};

export default nextConfig;
