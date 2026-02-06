import { z } from "zod";

export const createPostSchema = z
  .object({
    content: z.string().max(500).optional(),
    imageUrl: z.string().url().optional(),
  })
  .refine((data) => data.content || data.imageUrl, {
    message: "Post must have content or an image",
  });

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
