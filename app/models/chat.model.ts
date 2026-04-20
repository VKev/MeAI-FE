import z from "zod";

export type TChat = {
  id: string;
  sessionId: string;
  prompt: string;
  config: any;
  referenceResourceIds: string[] | null;
  resultResourceIds: string[] | null;
  referenceResourceUrls: string[] | null;
  resultResourceUrls: string[] | null;
  status: string | null;
  errorMessage: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type TGetAllChatResponse = {
  value: TChat[],
  isSuccess: boolean,
  isFailure: boolean,
  error: {
    code: string;
    description: string;
  }
}

export type TChatResponse = {
  value: TChat,
  isSuccess: boolean,
  isFailure: boolean,
  error: {
    code: string;
    description: string;
  }
}

export type TDeleteChatResponse = {
  value: boolean,
  isSuccess: boolean,
  isFailure: boolean,
  error: {
    code: string;
    description: string;
  }
}

export const CreateVideoChatSchema = z.object({
  chatSessionId: z.string().trim(),
  prompt: z.string().trim(),
  resourceIds: z.array(z.string()).optional(),
  model: z.string().trim(),
  aspectRatio: z.string().trim().optional(),
  seeds: z.array(z.number().int()).optional(),
  enableTranslation: z.boolean().optional(),
  watermark: z.string().trim().optional(),
});

export type TCreateVideoChat = z.infer<typeof CreateVideoChatSchema>;

export const SocialTargetSchema = z.object({
  platform: z.string().trim(),
  type: z.string().trim(),
  ratio: z.string().trim()
});

export const CreateImageChatSchema = z.object({
  chatSessionId: z.string().trim(),
  prompt: z.string().trim(),
  resourceIds: z.array(z.string()).optional(),
  model: z.string().trim(),
  aspectRatio: z.string().trim().optional(),
  numberOfVariances: z.number().int().optional(),
  resolution: z.string().trim().optional(),
  socialTargets: z.array(SocialTargetSchema).optional()
});

export type TCreateImageChat = z.infer<typeof CreateImageChatSchema>;

export type TCreateChatResponse = {
  value: {
    chatId: string,
    correlationId: string
  },
  isSuccess: boolean,
  isFailure: boolean,
  error: {
    code: string,
    description: string
  }
}

