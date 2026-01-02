import z from 'zod';

const usernamePattern = /^[a-zA-Z0-9._-]{3,30}$/;

export const SigninSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Username or email is required')
    .min(5, 'Username or email must be at least 5 characters')
    .refine(
      (value) => z.email().safeParse(value).success || usernamePattern.test(value),
      'Enter a valid username or email'
    )
    .trim(),
  password: z.string().min(1, 'Password is required').trim()
});

export const SignupSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(5, 'Username must be at least 5 characters')
    .refine((value) => usernamePattern.test(value), 'Username contains invalid characters')
    .trim(),
  email: z.email('Invalid email address').min(1, 'Email is required').trim(),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .regex(/(?=.*[A-Z])/, 'Password must include an uppercase letter')
    .regex(/(?=.*\d)/, 'Password must include a number')
    .regex(/(?=.*[^A-Za-z0-9])/, 'Password must include a special character')
    .trim(),
  confirmPassword: z.string().min(1, 'Confirm password is required').trim(),
  code: z.string().length(6, 'Code is required').trim()
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: 'custom',
      path: ['confirmPassword'],
      message: 'Passwords must match'
    });
  }
});

export const SignupBodySchema = z.object({
  username: z.string().trim(),
  email: z.email().trim(),
  password: z.string().trim(),
  code: z.string().trim(),
  fullName: z.string().optional(),
  phoneNumber: z.string().optional(),
})

export const ForgotPasswordSchema = z.object({
  email: z.email('Invalid email address').min(1, 'Email is required').trim(),
  newPassword: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .regex(/(?=.*[A-Z])/, 'Password must include an uppercase letter')
    .regex(/(?=.*\d)/, 'Password must include a number')
    .regex(/(?=.*[^A-Za-z0-9])/, 'Password must include a special character')
    .trim(),
  confirmNewPassword: z.string().min(1, 'Confirm password is required').trim(),
  code: z.string().length(6, 'Code is required').trim()
}).superRefine((data, ctx) => {
  if (data.newPassword !== data.confirmNewPassword) {
    ctx.addIssue({
      code: 'custom',
      path: ['confirmNewPassword'],
      message: 'Passwords must match'
    });
  }
});

export type TSigninValues = z.infer<typeof SigninSchema>;
export type TSignupValues = z.infer<typeof SignupSchema>;
export type TSignupBodyValues = z.infer<typeof SignupBodySchema>;
export type TForgotPasswordValues = z.infer<typeof ForgotPasswordSchema>;
