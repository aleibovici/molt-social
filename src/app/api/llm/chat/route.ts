import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const chatSchema = z.object({
  postContent: z.string().min(1).max(5000),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .max(20),
});

const SYSTEM_PROMPT = `You are a helpful assistant embedded in a social media platform. The user is viewing a post and wants to understand it better.

Your job is to:
- Summarize the post content clearly and concisely
- Provide additional context or explain references/topics mentioned
- Answer follow-up questions about the post's topic
- Be conversational but informative

Keep responses concise (2-4 paragraphs max for summaries, shorter for follow-ups). Always respond using markdown: use headings (##), lists, **bold**, *italic*, \`code\`, and [links](url) where they help.`;

async function streamOpenAI(
  apiKey: string,
  model: string,
  postContent: string,
  messages: { role: string; content: string }[]
): Promise<ReadableStream> {
  const allMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Here is the social media post:\n\n---\n${postContent}\n---\n\nPlease summarize this post and provide context.`,
    },
    ...messages,
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: allMessages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(
      response.status === 401
        ? "Invalid OpenAI API key"
        : `OpenAI error: ${response.status} - ${err}`
    );
  }

  return transformSSEStream(response.body!, parseOpenAIChunk);
}

async function streamAnthropic(
  apiKey: string,
  model: string,
  postContent: string,
  messages: { role: string; content: string }[]
): Promise<ReadableStream> {
  const allMessages = [
    {
      role: "user" as const,
      content: `Here is the social media post:\n\n---\n${postContent}\n---\n\nPlease summarize this post and provide context.`,
    },
    ...messages,
  ];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: allMessages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(
      response.status === 401
        ? "Invalid Anthropic API key"
        : `Anthropic error: ${response.status} - ${err}`
    );
  }

  return transformSSEStream(response.body!, parseAnthropicChunk);
}

function parseOpenAIChunk(line: string): string | null {
  if (!line.startsWith("data: ")) return null;
  const data = line.slice(6);
  if (data === "[DONE]") return null;
  try {
    const parsed = JSON.parse(data);
    return parsed.choices?.[0]?.delta?.content ?? null;
  } catch {
    return null;
  }
}

function parseAnthropicChunk(line: string): string | null {
  if (!line.startsWith("data: ")) return null;
  try {
    const parsed = JSON.parse(line.slice(6));
    if (parsed.type === "content_block_delta") {
      return parsed.delta?.text ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

function transformSSEStream(
  input: ReadableStream<Uint8Array>,
  parseChunk: (line: string) => string | null
): ReadableStream {
  const decoder = new TextDecoder();
  let buffer = "";

  return new ReadableStream({
    async start(controller) {
      const reader = input.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            const text = parseChunk(trimmed);
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
        }
        // Process any remaining buffer
        if (buffer.trim()) {
          const text = parseChunk(buffer.trim());
          if (text) {
            controller.enqueue(new TextEncoder().encode(text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = checkRateLimit(req, "llm-chat", 30, session.user.id);
  if (limited) return limited;

  const body = await req.json();
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  // Fetch encrypted config from DB — select only what's needed
  const config = await prisma.llmConfig.findUnique({
    where: { userId: session.user.id },
    select: { provider: true, model: true, encryptedApiKey: true },
  });

  if (!config) {
    return NextResponse.json(
      { error: "LLM not configured. Please set up your AI provider in settings." },
      { status: 400 }
    );
  }

  let apiKey: string;
  try {
    apiKey = decrypt(config.encryptedApiKey);
  } catch {
    return NextResponse.json(
      { error: "Failed to decrypt API key. Please re-save your settings." },
      { status: 500 }
    );
  }

  const { postContent, messages } = parsed.data;

  try {
    let stream: ReadableStream;

    if (config.provider === "openai") {
      stream = await streamOpenAI(apiKey, config.model, postContent, messages);
    } else if (config.provider === "anthropic") {
      stream = await streamAnthropic(
        apiKey,
        config.model,
        postContent,
        messages
      );
    } else {
      return NextResponse.json(
        { error: `Unknown provider: ${config.provider}` },
        { status: 400 }
      );
    }

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "LLM request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
