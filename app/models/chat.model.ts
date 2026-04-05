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
  watermark: z.boolean().optional(),
});

export type TCreateVideoChat = z.infer<typeof CreateVideoChatSchema>;

export const CreateImageChatSchema = z.object({
  chatSessionId: z.string().trim(),
  prompt: z.string().trim(),
  resourceIds: z.array(z.string()).optional(),
  model: z.string().trim(),
  numberOfVariances: z.number().int().optional(),
  resolution: z.string().trim().optional(),
  outputFormat: z.string().trim().optional(),
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

