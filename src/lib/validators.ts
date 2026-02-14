import { z, type ZodError } from "zod";

export function formatValidationError(error: ZodError): string {
  const flattened = error.flatten();
  const fieldEntries = Object.entries(flattened.fieldErrors) as [string, string[] | undefined][];
  if (fieldEntries.length > 0) {
    const [field, messages] = fieldEntries[0];
    if (messages && messages.length > 0) return `${field}: ${messages[0]}`;
  }
  return flattened.formErrors[0] || "Validation failed";
}

export const interactionSignalsSchema = z.object({
  keystrokeCount: z.number().int().min(0),
  pasteCount: z.number().int().min(0),
  composeDurationMs: z.number().int().min(0),
  focusCycleCount: z.number().int().min(0),
  hadMouseMovement: z.boolean(),
  scrollEventCount: z.number().int().min(0),
  avgKeystrokeIntervalMs: z.number().int().min(0),
}).optional();

export const createPostSchema = z
  .object({
    content: z.string().max(500).optional(),
    imageUrl: z.string().url().optional(),
    interactionSignals: interactionSignalsSchema,
  })
  .refine((data) => data.content || data.imageUrl, {
    message: "Post must have content or an image",
  });

export const editPostSchema = createPostSchema;

export const createReplySchema = z.object({
  content: z.string().min(1).max(500),
  parentReplyId: z.string().optional(),
  interactionSignals: interactionSignalsSchema,
});

export const agentPostSchema = z.object({
  content: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
}).refine((data) => data.content || data.imageUrl, {
  message: "Post must have content or an image",
});

export const agentReplySchema = z.object({
  postId: z.string(),
  parentReplyId: z.string().optional(),
  content: z.string().min(1).max(500),
});

export const usernameSchema = z
  .string()
  .min(3)
  .max(20)
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers, and underscores"
  );

export const updateProfileSchema = z.object({
  displayName: z.string().max(50).optional(),
  username: usernameSchema,
});

export const searchSchema = z.object({
  q: z.string().min(1).max(100),
  type: z.enum(["people", "posts"]).default("people"),
  cursor: z.string().optional(),
});

export const createProposalSchema = z.object({
  title: z.string().min(5).max(150),
  description: z.string().min(10).max(2000),
});

export const castVoteSchema = z.object({
  vote: z.enum(["YES", "NO"]),
});

export const agentProposalSchema = z.object({
  title: z.string().min(5).max(150),
  description: z.string().min(10).max(2000),
});

export const agentVoteSchema = z.object({
  proposalId: z.string(),
  vote: z.enum(["YES", "NO"]),
});

export const adminUpdateUserSchema = z.object({
  role: z.enum(["USER", "ADMIN"]).optional(),
  name: z.string().max(50).optional(),
  username: usernameSchema.optional(),
  bio: z.string().max(160).optional(),
});

export const adminUpdateProposalSchema = z.object({
  status: z.enum(["APPROVED", "DECLINED", "IMPLEMENTED"]),
});

export const agentSlugSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only");

export const createAgentProfileSchema = z.object({
  name: z.string().min(1).max(50),
  slug: agentSlugSchema,
  bio: z.string().max(300).optional(),
  avatarUrl: z.string().url().optional(),
});

export const updateAgentProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  bio: z.string().max(300).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export const agentFollowSchema = z
  .object({
    username: z.string().optional(),
    agentSlug: z.string().optional(),
  })
  .refine(
    (data) => (data.username ? 1 : 0) + (data.agentSlug ? 1 : 0) === 1,
    { message: "Provide exactly one of username or agentSlug" }
  );

// Direct messaging validators
export const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const startConversationSchema = z
  .object({
    recipientUsername: z.string().optional(),
    recipientAgentSlug: z.string().optional(),
    content: z.string().min(1).max(2000),
  })
  .refine(
    (data) =>
      (data.recipientUsername ? 1 : 0) + (data.recipientAgentSlug ? 1 : 0) ===
      1,
    { message: "Provide exactly one of recipientUsername or recipientAgentSlug" }
  );

export const agentStartConversationSchema = z.object({
  recipientAgentSlug: z.string(),
  content: z.string().min(1).max(2000),
});

export const createReportSchema = z
  .object({
    reason: z.enum(["AI_IMPERSONATION", "SPAM", "HARASSMENT", "OTHER"]),
    details: z.string().max(500).optional(),
    targetPostId: z.string().optional(),
    targetReplyId: z.string().optional(),
    targetUserId: z.string().optional(),
  })
  .refine(
    (data) =>
      [data.targetPostId, data.targetReplyId, data.targetUserId].filter(Boolean)
        .length === 1,
    { message: "Provide exactly one of targetPostId, targetReplyId, or targetUserId" }
  );

export const mobileTokenExchangeSchema = z.object({
  provider: z.enum(["google", "github"]),
  token: z.string().min(1),
  deviceName: z.string().max(100).optional(),
});
