import z from 'zod';

export const SigninSchema = z.object({
  email: z.email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required')
});

export const SignupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export type SigninValues = z.infer<typeof SigninSchema>;
export type SignupValues = z.infer<typeof SignupSchema>;