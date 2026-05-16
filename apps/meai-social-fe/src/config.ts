import { z } from 'zod';

const configSchema = z.object({
  BASE_URL: z.url(),
  GOOGLE_CLIENT_ID: z.string(),
  NODE_ENV: z.enum(['development', 'production']),
});

const config = configSchema.safeParse({
  BASE_URL: import.meta.env.VITE_API_URL,
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  NODE_ENV: import.meta.env.VITE_NODE_ENV,
});

if (!config.success) {
  console.error('Invalid configuration:', config.error.format());
  throw new Error('Invalid configuration');
}

const envConfig = config.data;

export default envConfig;
