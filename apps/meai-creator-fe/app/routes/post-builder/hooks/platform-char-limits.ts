import type { PostBuilderMode, PostBuilderPlatform } from './usePostBuilder';

// Per-(platform, mode) caption character budget. `recommended` is the tone-of-voice
// guidance we send to the BE caption generator (MistralCaptionService.BuildToneGuidance);
// beyond that the FE shows a warning but still allows typing. `max` is the platform's
// hard API limit — the editor clamps `maxLength` to this so users can't submit content
// the platform will reject (Threads 500, Meta/TikTok 2200).
//
// Keep in sync with [MistralCaptionService.BuildToneGuidance](../../../../../MeAI-BE/
// Backend/Microservices/Ai.Microservice/src/Infrastructure/Logic/Mistral/
// MistralCaptionService.cs) — if the BE recommendation changes, update here too.
export type CaptionLimits = {
  recommended: number;
  max: number;
};

const META_FEED: CaptionLimits = { recommended: 220, max: 2200 };
const META_REEL: CaptionLimits = { recommended: 150, max: 2200 };
const TIKTOK_VIDEO: CaptionLimits = { recommended: 150, max: 2200 };
const TIKTOK_IMAGE: CaptionLimits = { recommended: 300, max: 2200 };
const THREADS: CaptionLimits = { recommended: 500, max: 500 };
const FB_FEED: CaptionLimits = { recommended: 300, max: 2200 };

// Fallback for any (platform, mode) combination we don't explicitly map.
const DEFAULT_LIMITS: CaptionLimits = { recommended: 300, max: 2200 };

const LIMITS: Record<PostBuilderPlatform, Partial<Record<PostBuilderMode, CaptionLimits>>> = {
  facebook: {
    post: FB_FEED,
    reel: META_REEL
  },
  instagram: {
    post: META_FEED,
    reel: META_REEL
  },
  tiktok: {
    video: TIKTOK_VIDEO,
    image: TIKTOK_IMAGE
  },
  threads: {
    post: THREADS
  }
};

export function getCaptionLimits(platform: PostBuilderPlatform, mode: PostBuilderMode): CaptionLimits {
  return LIMITS[platform]?.[mode] ?? DEFAULT_LIMITS;
}
