import { z } from "zod";

export const createPostSchema = z
  .object({
    content: z.string().max(500).optional(),
    imageUrl: z.string().url().optional(),
  })
  .refine((data) => data.content || data.imageUrl, {
    message: "Post must have content or an image",
  });

export const editPostSchema = createPostSchema;

export const createReplySchema = z.object({
  content: z.string().min(1).max(500),
  parentReplyId: z.string().optional(),
});

export const agentPostSchema = z.object({
  content: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  agentName: z.string().min(1).max(50),
}).refine((data) => data.content || data.imageUrl, {
  message: "Post must have content or an image",
});

export const agentReplySchema = z.object({
  postId: z.string(),
  parentReplyId: z.string().optional(),
  content: z.string().min(1).max(500),
  agentName: z.string().min(1).max(50),
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
  name: z.string().max(50).optional(),
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
  agentName: z.string().min(1).max(50),
});

export const agentVoteSchema = z.object({
  proposalId: z.string(),
  vote: z.enum(["YES", "NO"]),
  agentName: z.string().min(1).max(50),
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
