import { useState, useEffect, useCallback } from "react";
import { getSettings, setSettings } from "../shared/storage";
import { translate } from "../shared/translation/service";
import { speak } from "../shared/tts/tts";
import { detectLanguage } from "../shared/language";
import { MODELS, UI_STRINGS } from "../shared/constants";
import type { PhraseTranslationResult, Settings, ProviderID } from "../shared/types";

function applyThemeClass(theme: "light" | "dark" | "system") {
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  if (isDark) {
    document.documentElement.classList.add("lp-dark");
  } else {
    document.documentElement.classList.remove("lp-dark");
  }
}

function applyAccentColor(color: Settings["accentColor"]) {
  const colorMap: Record<string, string> = {
    pink: "#df37a7",
    blue: "#3b82f6",
    green: "#10b981",
    purple: "#8b5cf6",
    orange: "#f97316"
  };
  document.documentElement.style.setProperty('--lp-primary', colorMap[color || "pink"]);
}

export default function PopupApp() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [sourceLang, setSourceLang] = useState<"auto" | "en" | "ru">("auto");
  const [targetLang, setTargetLang] = useState<"ru" | "en">("ru");
  const [settings, setLocalSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getSettings().then((s) => {
      setLocalSettings(s);
      applyThemeClass(s.theme);
      applyAccentColor(s.accentColor);
    });

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      getSettings().then((s) => applyThemeClass(s.theme));
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleTranslate = useCallback(async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setResult("");

    try {
      const res = await translate({
        text: input.trim(),
        mode: "popup",
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
      });
      setResult((res as PhraseTranslationResult).translation);
    } catch (err) {
      const msg = (err as Error).message;
      const errors: Record<string, string> = {
        missing_api_key: UI_STRINGS.missingKey,
        invalid_api_key: UI_STRINGS.invalidKey,
        network_error: UI_STRINGS.networkError,
        rate_limit: UI_STRINGS.rateLimit,
        llm_disabled_no_fallback: UI_STRINGS.llmDisabled,
      };
      setError(errors[msg] || "Ошибка перевода.");
    } finally {
      setLoading(false);
    }
  }, [input, sourceLang, targetLang]);

  const handleSpeak = useCallback(() => {
    const textToSpeak = result || input;
    const lang = detectLanguage(textToSpeak) === "ru" ? "ru" : "en";
    speak(textToSpeak, lang);
  }, [input, result]);

  const handleCopy = useCallback(() => {
    const textToCopy = result || input;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [input, result]);

  const handleTranslatePage = useCallback(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs
          .sendMessage(tabs[0].id, { type: "START_PAGE_TRANSLATION" })
          .catch(() => {});
      }
    });
    window.close();
  }, []);

  const handleRestorePage = useCallback(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs
          .sendMessage(tabs[0].id, { type: "RESTORE_PAGE" })
          .catch(() => {});
      }
    });
    window.close();
  }, []);

  const openSettings = useCallback(() => {
    chrome.runtime.openOptionsPage();
  }, []);

  const cycleTheme = useCallback(() => {
    setLocalSettings((prev) => {
      if (!prev) return prev;
      const theme = prev.theme;
      const next =
        theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
      const updated = { ...prev, theme: next };
      setSettings(updated).catch(() => {});
      applyThemeClass(next);
      return updated;
    });
  }, []);

  if (!settings) return null;

  const themeIcon = settings.theme === "light" ? "☀" : settings.theme === "dark" ? "☾" : "◐";
  const currentProviderModels = MODELS[settings.activeProvider] || [];

  return (
    <div className="lp-popup-ui">
      <div className="lp-popup-header">
        <h1>LinguaPop AI</h1>
        <div className="lp-popup-actions">
          <button
            onClick={cycleTheme}
            className="lp-icon-btn"
            title={`Тема: ${settings.theme}`}
          >
            {themeIcon}
          </button>
          <button
            onClick={openSettings}
            className="lp-icon-btn"
            title="Настройки"
          >
            ⚙
          </button>
        </div>
      </div>

      <div className="lp-lang-row">
        <select
          value={sourceLang}
          onChange={(e) =>
            setSourceLang(e.target.value as "auto" | "en" | "ru")
          }
        >
          <option value="auto">Авто</option>
          <option value="en">English</option>
          <option value="ru">Русский</option>
        </select>
        <span>→</span>
        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value as "ru" | "en")}
        >
          <option value="ru">Русский</option>
          <option value="en">English</option>
        </select>
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Введите текст для перевода..."
        rows={4}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            handleTranslate();
          }
        }}
      />

      <div className="lp-options-row">
        <select
          value={settings.providers[settings.activeProvider].selectedModel}
          onChange={(e) => {
            const val = e.target.value;
            setLocalSettings((prev) => {
              if (!prev) return prev;
              const updated = {
                ...prev,
                providers: {
                  ...prev.providers,
                  [prev.activeProvider]: {
                    ...prev.providers[prev.activeProvider],
                    selectedModel: val
                  }
                }
              };
              setSettings(updated).catch(() => {});
              return updated;
            });
          }}
        >
          {currentProviderModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
          <label className="lp-toggle" title="Включить/выключить ИИ-перевод">
            <input
              type="checkbox"
              checked={settings.llmEnabled}
              onChange={(e) => {
                const checked = e.target.checked;
                setLocalSettings((prev) => {
                  if (!prev) return prev;
                  const updated = { ...prev, llmEnabled: checked };
                  setSettings(updated).catch(() => {});
                  return updated;
                });
              }}
            />
            LLM
          </label>
          <label className="lp-toggle" title="Включить/выключить плавающего помощника">
            <input
              type="checkbox"
              checked={settings.assistantEnabled}
              onChange={(e) => {
                const checked = e.target.checked;
                setLocalSettings((prev) => {
                  if (!prev) return prev;
                  const updated = { ...prev, assistantEnabled: checked };
                  setSettings(updated).catch(() => {});
                  return updated;
                });
              }}
            />
            Помощник
          </label>
        </div>

      <button
        className="lp-primary-btn"
        onClick={handleTranslate}
        disabled={loading || !input.trim()}
      >
        {loading ? (
          <>
            <span className="lp-spinner-inline" />
            Перевод...
          </>
        ) : (
          UI_STRINGS.translate
        )}
      </button>

      {error && <div className="lp-error">{error}</div>}

      {result && (
        <div className="lp-result">
          <div className="lp-result-text">{result}</div>
          <div className="lp-result-actions">
            <button onClick={handleSpeak}>{UI_STRINGS.speak}</button>
            <button onClick={handleCopy}>
              {copied ? UI_STRINGS.copied : UI_STRINGS.copy}
            </button>
          </div>
        </div>
      )}

      <div className="lp-page-actions">
        <button className="lp-secondary-btn" onClick={handleTranslatePage}>
          {UI_STRINGS.translatePage}
        </button>
        <button className="lp-secondary-btn" onClick={handleRestorePage}>
          {UI_STRINGS.restorePage}
        </button>
      </div>
    </div>
  );
}
