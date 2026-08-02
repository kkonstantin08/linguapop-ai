export type ProviderID = "mistral" | "openai" | "anthropic" | "gemini";

export interface ProviderConfig {
  apiKeys: string;
  selectedModel: string;
}

export interface Settings {
  activeProvider: ProviderID;
  providers: Record<ProviderID, ProviderConfig>;
  defaultTargetLanguage: "ru" | "en";
  writingAssistantTargetLanguage: string;
  llmEnabled: boolean;
  fallbackProvider: "chrome" | "libretranslate" | "none";
  libreTranslateEndpoint: string;
  excludedSites: string[];
  theme: "light" | "dark" | "system";
  accentColor: "pink" | "blue" | "green" | "purple" | "orange";
  assistantEnabled: boolean;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  originalText: string;
  rewrittenText: string;
  targetLanguage: string;
}
export interface WordTranslationResult {
  detectedLanguage: "en" | "ru" | "unknown";
  targetLanguage: "ru" | "en";
  word: string;
  mainTranslation: string;
  alternatives: string[];
  partOfSpeech: string;
  pronunciation: string;
  shortExamples: { source: string; translation: string }[];
}

export interface PhraseTranslationResult {
  detectedLanguage: "en" | "ru" | "unknown";
  targetLanguage: "ru" | "en";
  translation: string;
}

export interface BatchTranslationResult {
  translations: string[];
}

export type TranslationResult = WordTranslationResult | PhraseTranslationResult | BatchTranslationResult;

export interface TranslationRequest {
  text: string;
  mode: "word" | "phrase" | "popup" | "batch" | "rewrite";
  sourceLanguage?: "auto" | "en" | "ru";
  targetLanguage?: "ru" | "en";
  tone?: "normal" | "formal" | "friendly" | "shorter" | "grammar_only";
}
