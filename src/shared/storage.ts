import type { Settings, HistoryEntry } from "./types";

const DEFAULT_SETTINGS: Settings = {
  activeProvider: "mistral",
  providers: {
    mistral: { apiKeys: "", selectedModel: "mistral-small-latest" },
    openai: { apiKeys: "", selectedModel: "gpt-4o-mini" },
    anthropic: { apiKeys: "", selectedModel: "claude-3-haiku-20240307" },
    gemini: { apiKeys: "", selectedModel: "gemini-2.5-flash" }
  },
  defaultTargetLanguage: "ru",
  writingAssistantTargetLanguage: "en",
  llmEnabled: true,
  fallbackProvider: "none",
  libreTranslateEndpoint: "",
  excludedSites: [],
  theme: "system",
  accentColor: "pink",
  assistantEnabled: true,
};

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.sync.get("settings");
  // Merge recursively for providers
  const stored = result.settings || {};
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    providers: {
      ...DEFAULT_SETTINGS.providers,
      ...(stored.providers || {})
    }
  } as Settings;
}

export async function setSettings(settings: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await chrome.storage.sync.set({ settings: updated });
}

export async function getSetting<K extends keyof Settings>(
  key: K,
): Promise<Settings[K]> {
  const settings = await getSettings();
  return settings[key];
}

// History Functions (using local storage because it can get large)
export async function getHistory(): Promise<HistoryEntry[]> {
  const result = await chrome.storage.local.get("writingHistory");
  return result.writingHistory || [];
}

export async function addHistoryEntry(entry: HistoryEntry): Promise<void> {
  const history = await getHistory();
  history.unshift(entry); // Add to the beginning
  // Keep only the last 100 entries
  if (history.length > 100) {
    history.length = 100;
  }
  await chrome.storage.local.set({ writingHistory: history });
}

export async function clearHistory(): Promise<void> {
  await chrome.storage.local.remove("writingHistory");
}
