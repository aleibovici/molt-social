"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  useLlmSettings,
  useSaveLlmSettings,
  useDeleteLlmSettings,
} from "@/hooks/use-llm-settings";
import {
  LLM_PROVIDERS,
  getProvider,
  getDefaultModel,
} from "@/lib/llm-providers";

export function LlmSettingsForm() {
  const { data: settings } = useLlmSettings();
  const saveMutation = useSaveLlmSettings();
  const deleteMutation = useDeleteLlmSettings();

  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [persona, setPersona] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (settings) {
      setProvider(settings.provider ?? "");
      setModel(settings.model ?? "");
      setApiKey("");
      setPersona(settings.persona ?? "");
      setError("");
    }
  }, [settings]);

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    setModel(getDefaultModel(newProvider));
  };

  const selectedProvider = getProvider(provider);

  const handleSave = async () => {
    if (!provider || !model || (!apiKey && !settings?.configured)) {
      setError("All fields are required");
      return;
    }
    setError("");
    try {
      await saveMutation.mutateAsync({
        provider,
        model,
        ...(apiKey ? { apiKey } : {}),
        persona: persona.trim() || undefined,
      });
      setApiKey("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync();
      setProvider("");
      setModel("");
      setApiKey("");
      setPersona("");
    } catch {
      setError("Failed to remove settings");
    }
  };

  return (
    <>
      {error && (
        <p className="mb-3 rounded-lg bg-heart-red/10 px-3 py-2 text-sm text-heart-red">
          {error}
        </p>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Provider</label>
          <select
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-cyan"
          >
            <option value="">Select a provider...</option>
            {LLM_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {selectedProvider && (
          <div>
            <label className="mb-1 block text-sm font-medium">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-cyan"
            >
              {selectedProvider.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedProvider && (
          <div>
            <label className="mb-1 block text-sm font-medium">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={selectedProvider.placeholder}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-cyan"
              autoComplete="off"
            />
            {settings?.configured && !apiKey && (
              <p className="mt-1 text-xs text-muted">
                Key is saved. Enter a new one to replace it.
              </p>
            )}
          </div>
        )}

        {selectedProvider && (
          <div>
            <label className="mb-1 block text-sm font-medium">AI Persona</label>
            <textarea
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              placeholder="e.g., Be succinct and direct to the point"
              maxLength={500}
              rows={3}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-cyan resize-none"
            />
            <p className="mt-1 text-xs text-muted">
              Customize how the AI responds. Leave empty for default behavior.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div>
          {settings?.configured && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Removing..." : "Remove"}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={
              saveMutation.isPending ||
              !provider ||
              !model ||
              (!apiKey && !settings?.configured)
            }
          >
            {saveMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </>
  );
}
