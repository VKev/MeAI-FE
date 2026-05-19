import { z } from 'zod';

const configSchema = z.object({
  BASE_URL: z.url()
});

const config = configSchema.safeParse({
  BASE_URL: import.meta.env.VITE_API_URL,
});

if (!config.success) {
  console.error('Invalid configuration:', config.error.format());
  throw new Error('Invalid configuration');
}

const envConfig = config.data;

export default envConfig;
