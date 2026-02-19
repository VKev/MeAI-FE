import { z } from "zod";

const configSchema = z.object({
  VITE_API_URL: z.string(),
  VITE_STRIPE_PUBLISHABLE_KEY: z.string(),
  VITE_GOOGLE_CLIENT_ID: z.string(),
});

const configProject = configSchema.safeParse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
});

if (!configProject.success) {
  console.error(configProject.error.issues);
  throw new Error("Invalid environment variables");
}

const envConfig = configProject.data;

export default envConfig;
