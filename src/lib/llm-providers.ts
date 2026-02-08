export interface LlmModel {
  id: string;
  name: string;
}

export interface LlmProvider {
  id: string;
  name: string;
  models: LlmModel[];
  placeholder: string; // API key input placeholder
}

export const LLM_PROVIDERS: LlmProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    models: [
      { id: "gpt-4o", name: "GPT-4o" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
    ],
    placeholder: "sk-...",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    models: [
      { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
      { id: "claude-haiku-235-20250414", name: "Claude Haiku 3.5" },
    ],
    placeholder: "sk-ant-...",
  },
];

export function getProvider(providerId: string): LlmProvider | undefined {
  return LLM_PROVIDERS.find((p) => p.id === providerId);
}

export function getDefaultModel(providerId: string): string {
  const provider = getProvider(providerId);
  return provider?.models[0]?.id ?? "";
}
