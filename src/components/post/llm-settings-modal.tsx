"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
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

interface LlmSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function LlmSettingsModal({ open, onClose }: LlmSettingsModalProps) {
  const { data: settings } = useLlmSettings();
  const saveMutation = useSaveLlmSettings();
  const deleteMutation = useDeleteLlmSettings();

  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");

  // Populate from saved settings when modal opens
  useEffect(() => {
    if (open && settings) {
      setProvider(settings.provider ?? "");
      setModel(settings.model ?? "");
      setApiKey("");
      setError("");
    }
  }, [open, settings]);

  // When provider changes, reset model to first available
  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    setModel(getDefaultModel(newProvider));
  };

  const selectedProvider = getProvider(provider);

  const handleSave = async () => {
    if (!provider || !model || !apiKey) {
      setError("All fields are required");
      return;
    }
    setError("");
    try {
      await saveMutation.mutateAsync({ provider, model, apiKey });
      setApiKey("");
      onClose();
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
      onClose();
    } catch {
      setError("Failed to remove settings");
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="mb-1 text-lg font-semibold">AI Settings</h2>
      <p className="mb-4 text-sm text-muted">
        Configure your LLM provider to summarize and discuss posts. Your API key
        is encrypted and stored securely.
      </p>

      {error && (
        <p className="mb-3 rounded-lg bg-heart-red/10 px-3 py-2 text-sm text-heart-red">
          {error}
        </p>
      )}

      <div className="space-y-4">
        {/* Provider select */}
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

        {/* Model select */}
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

        {/* API Key */}
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
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
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
    </Modal>
  );
}
