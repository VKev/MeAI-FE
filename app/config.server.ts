import { z } from 'zod';

const serverConfigSchema = z.object({
  SESSION_SECRET: z.string().min(1),
  SESSION_EXPIRES_IN_DAYS: z.coerce.number().int().positive()
});

const serverConfigProject = serverConfigSchema.safeParse({
  SESSION_SECRET: process.env.SESSION_SECRET,
  SESSION_EXPIRES_IN_DAYS: process.env.SESSION_EXPIRES_IN_DAYS
});

if (!serverConfigProject.success) {
  console.error(serverConfigProject.error.issues);
  throw new Error('Invalid server environment variables');
}

const serverEnvConfig = serverConfigProject.data;

export default serverEnvConfig;
