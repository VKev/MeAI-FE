import z from 'zod';

export const SigninSchema = z.object({
  email: z.email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required')
});

export const SignupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email address').min(1, 'Email is required'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/(?=.*[A-Z])/, 'Password must include an uppercase letter')
    .regex(/(?=.*\d)/, 'Password must include a number')
    .regex(/(?=.*[^A-Za-z0-9])/, 'Password must include a special character'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
  code: z.string().length(6, 'Code is required')
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: 'custom',
      path: ['confirmPassword'],
      message: 'Passwords must match'
    });
  }
});

export const ForgotPasswordSchema = z.object({
  email: z.email('Invalid email address').min(1, 'Email is required'),
  newPassword: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/(?=.*[A-Z])/, 'Password must include an uppercase letter')
    .regex(/(?=.*\d)/, 'Password must include a number')
    .regex(/(?=.*[^A-Za-z0-9])/, 'Password must include a special character'),
  confirmNewPassword: z.string().min(1, 'Confirm password is required'),
  code: z.string().length(6, 'Code is required')
}).superRefine((data, ctx) => {
  if (data.newPassword !== data.confirmNewPassword) {
    ctx.addIssue({
      code: 'custom',
      path: ['confirmNewPassword'],
      message: 'Passwords must match'
    });
  }
});

export type SigninValues = z.infer<typeof SigninSchema>;
export type SignupValues = z.infer<typeof SignupSchema>;
export type ForgotPasswordValues = z.infer<typeof ForgotPasswordSchema>;
