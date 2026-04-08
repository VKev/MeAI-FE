export const AI_MODELS = [
  {
    id: 'auto',
    name: 'Auto',
    description: 'An intelligent Preset that selects the best model for your prompt',
    image: 'https://cdn.leonardo.ai/static/images/video/models/auto_preset.webp'
  },
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    description: 'Consistency & infographics (Gemini 3 Pro)',
    image: 'https://cdn.leonardo.ai/preset_assets/thumbnails/af3189d3-4619-477d-a3e5-4f076a86e2eb/thumbnail-5c39.webp'
  },
  {
    id: 'gpt-image-1-5',
    name: 'GPT Image-1.5',
    description: 'Superior editing control, image integrity and detail preservation.',
    image: 'https://cdn.leonardo.ai/preset_assets/thumbnails/cfd12969-ad0a-440a-9803-5b52d8c7d223/thumbnail-cc00.webp'
  }
] as const;

export const VIDEO_DIMENSIONS = ['9:16', '16:9', 'auto'] as const;

export const IMAGE_QUALITY = ['1K', '2K', '4K'] as const;
export const OUTPUT_FORMAT = ['png', 'jpg'] as const;

export const SIDEBAR_RATIOS = ['2:3', '1:1', '16:9', 'Custom'] as const;
export const ALL_RATIOS = ['21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16'] as const;

