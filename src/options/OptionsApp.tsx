import { useState, useEffect, useCallback, useRef } from "react";
import { getSettings, setSettings, getHistory, clearHistory } from "../shared/storage";
import { clearTranslationCache } from "../shared/cache";
import {
  PROVIDERS,
  MODELS,
  FALLBACK_PROVIDERS,
  UI_STRINGS,
} from "../shared/constants";
import type { Settings, ProviderID, HistoryEntry } from "../shared/types";

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

export default function OptionsApp() {
  const [activeTab, setActiveTab] = useState<"providers" | "translation" | "history">("providers");
  const [settings, setLocalSettings] = useState<Settings | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Key testing state
  const [keyStatuses, setKeyStatuses] = useState<Record<string, "valid" | "invalid" | "checking">>({});
  
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [excludedInput, setExcludedInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  useEffect(() => {
    getSettings().then((s) => {
      setLocalSettings(s);
      applyThemeClass(s.theme);
      applyAccentColor(s.accentColor);
    });
    getHistory().then(setHistory);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      getSettings().then((s) => applyThemeClass(s.theme));
    };
    mq.addEventListener("change", handler);
    return () => {
      mq.removeEventListener("change", handler);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const triggerSave = useCallback((updatedSettings: Settings) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await setSettings(updatedSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 600);
  }, []);

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setLocalSettings(prev => {
        if (!prev) return prev;
        const updated = { ...prev, [key]: value };
        triggerSave(updated);
        return updated;
      });
    },
    [triggerSave],
  );

  const updateProviderSetting = useCallback(
    (provider: ProviderID, key: "apiKeys" | "selectedModel", value: string) => {
      setLocalSettings(prev => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          providers: {
            ...prev.providers,
            [provider]: {
              ...prev.providers[provider],
              [key]: value
            }
          }
        };
        triggerSave(updated);
        return updated;
      });
    },
    [triggerSave],
  );

  const handleCheckKeys = useCallback(async () => {
    if (!settings) return;
    const provider = settings.activeProvider;
    const keys = settings.providers[provider].apiKeys.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
    
    if (keys.length === 0) return;

    const newStatuses: Record<string, "checking"> = {};
    keys.forEach(k => newStatuses[k] = "checking");
    setKeyStatuses(newStatuses);

    for (const key of keys) {
      try {
        const response = await chrome.runtime.sendMessage({
          type: "TEST_API_KEY",
          data: { provider, apiKey: key, model: settings.providers[provider].selectedModel }
        });
        if (response && response.success) {
          setKeyStatuses(prev => ({ ...prev, [key]: "valid" }));
        } else {
          setKeyStatuses(prev => ({ ...prev, [key]: "invalid" }));
        }
      } catch {
        setKeyStatuses(prev => ({ ...prev, [key]: "invalid" }));
      }
    }
  }, [settings]);

  const handleClearCache = useCallback(async () => {
    await clearTranslationCache();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
  }, []);

  const handleClearHistory = useCallback(async () => {
    if (confirm("Вы уверены, что хотите очистить историю?")) {
      await clearHistory();
      setHistory([]);
    }
  }, []);

  const handleExport = useCallback(() => {
    if (!settings) return;
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "linguapop-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [settings]);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === "object") {
          await setSettings(parsed);
          setLocalSettings(prev => prev ? { ...prev, ...parsed } : parsed);
          alert("Настройки успешно импортированы!");
        }
      } catch (err) {
        alert("Ошибка при чтении файла настроек");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset input
  }, [settings]);

  if (!settings) return null;

  const currentProviderConfig = settings.providers[settings.activeProvider];

  return (
    <div className="lp-options-page">
      <div className="lp-options-card" style={{ maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, marginBottom: '4px' }}>LinguaPop AI — Настройки</h1>
            <div className="lp-options-subtitle" style={{ margin: 0 }}>Умный переводчик и помощник</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="lp-btn" onClick={handleExport} style={{ padding: '6px 12px', fontSize: '13px' }}>Экспорт</button>
            <button className="lp-btn" onClick={() => document.getElementById('import-file')?.click()} style={{ padding: '6px 12px', fontSize: '13px' }}>Импорт</button>
            <input type="file" id="import-file" style={{ display: 'none' }} accept=".json" onChange={handleImport} />
          </div>
        </div>

        <div className="lp-tabs">
          <button className={activeTab === "providers" ? "active" : ""} onClick={() => setActiveTab("providers")}>Провайдеры ИИ</button>
          <button className={activeTab === "translation" ? "active" : ""} onClick={() => setActiveTab("translation")}>Настройки перевода</button>
          <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}>История помощника</button>
        </div>

        {activeTab === "providers" && (
          <div className="lp-tab-content">
            <section>
              <h2>Режим перевода (LLM)</h2>
              <label className="lp-switch-label">
                <span className="lp-switch">
                  <input
                    type="checkbox"
                    checked={settings.llmEnabled}
                    onChange={(e) => updateSetting("llmEnabled", e.target.checked)}
                  />
                  <span className="lp-slider" />
                </span>
                <span className="lp-switch-text">
                  {settings.llmEnabled ? "Использовать нейросети (LLM)" : "LLM отключён"}
                </span>
              </label>
            </section>

            <section>
              <h2>Активный провайдер</h2>
              <select
                value={settings.activeProvider}
                onChange={(e) => updateSetting("activeProvider", e.target.value as ProviderID)}
              >
                {PROVIDERS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </section>

            <section>
              <h2>API ключи для {PROVIDERS.find(p => p.id === settings.activeProvider)?.name}</h2>
              <div className="lp-help-text">
                Можно указать несколько ключей (каждый с новой строки или через запятую).
              </div>
              <div className="lp-key-row">
                <textarea
                  value={currentProviderConfig.apiKeys}
                  onChange={(e) => updateProviderSetting(settings.activeProvider, "apiKeys", e.target.value)}
                  placeholder="Вставьте API ключи..."
                  rows={4}
                />
                <button onClick={handleCheckKeys}>Проверить ключи</button>
              </div>
              
              <div className="lp-key-statuses">
                {currentProviderConfig.apiKeys.split(/[\n,]+/).map(k => k.trim()).filter(Boolean).map(key => {
                  const status = keyStatuses[key];
                  const masked = key.slice(0, 4) + "..." + key.slice(-4);
                  return (
                    <div key={key} className={`lp-status-item ${status || ""}`}>
                      <span>{masked}</span>
                      {status === "checking" && <span className="lp-badge checking">Проверка...</span>}
                      {status === "valid" && <span className="lp-badge valid">Работает</span>}
                      {status === "invalid" && <span className="lp-badge invalid">Ошибка</span>}
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <h2>Модель</h2>
              <select
                value={currentProviderConfig.selectedModel}
                onChange={(e) => updateProviderSetting(settings.activeProvider, "selectedModel", e.target.value)}
              >
                {MODELS[settings.activeProvider].map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </section>

            <section>
              <h2>Fallback-переводчик (запасной)</h2>
              <div className="lp-help-text">
                Chrome Built-in AI попытается использовать локальную нейросеть браузера, если основной API недоступен.
              </div>
              <select
                value={settings.fallbackProvider}
                onChange={(e) => updateSetting("fallbackProvider", e.target.value as Settings["fallbackProvider"])}
              >
                <option value="none">Не использовать</option>
                {FALLBACK_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </section>
          </div>
        )}

        {activeTab === "translation" && (
          <div className="lp-tab-content">
            <section>
              <h2>Язык перевода (Обычный)</h2>
              <select
                value={settings.defaultTargetLanguage}
                onChange={(e) => updateSetting("defaultTargetLanguage", e.target.value as "ru" | "en")}
              >
                <option value="ru">Русский (автоопределение исходного)</option>
                <option value="en">English</option>
              </select>
            </section>

            <section>
              <h2>Язык для помощника при письме</h2>
              <select
                value={settings.writingAssistantTargetLanguage}
                onChange={(e) => updateSetting("writingAssistantTargetLanguage", e.target.value)}
              >
                <option value="en">English (по умолчанию)</option>
                <option value="ru">Русский</option>
                <option value="es">Испанский</option>
                <option value="de">Немецкий</option>
                <option value="fr">Французский</option>
                <option value="zh">Китайский</option>
              </select>
            </section>

            <section>
              <h2>Тема оформления</h2>
              <select
                value={settings.theme}
                onChange={(e) => {
                  const val = e.target.value as Settings["theme"];
                  updateSetting("theme", val);
                  applyThemeClass(val);
                }}
              >
                <option value="system">Системная</option>
                <option value="light">Светлая</option>
                <option value="dark">Тёмная</option>
              </select>
            </section>

            <section>
              <h2>Акцентный цвет</h2>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                {[
                  { id: "pink", color: "#df37a7" },
                  { id: "blue", color: "#3b82f6" },
                  { id: "green", color: "#10b981" },
                  { id: "purple", color: "#8b5cf6" },
                  { id: "orange", color: "#f97316" }
                ].map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      updateSetting("accentColor", c.id as Settings["accentColor"]);
                      document.documentElement.style.setProperty('--lp-primary', c.color);
                    }}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: c.color,
                      border: settings.accentColor === c.id ? '3px solid var(--lp-text-primary)' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    title={c.id}
                  />
                ))}
              </div>
            </section>

            <section>
              <h2>Исключения для помощника</h2>
              <div className="lp-help-text">Укажите домены (по одному в строке), на которых кнопка помощника не будет появляться (например: github.com).</div>
              <textarea
                value={settings.excludedSites?.join("\n") || ""}
                onChange={(e) => {
                  const sites = e.target.value.split("\n").map(s => s.trim()).filter(Boolean);
                  updateSetting("excludedSites", sites);
                }}
                rows={4}
                placeholder="github.com&#10;web.telegram.org"
              />
            </section>

            <section>
              <h2>Кэш переводов</h2>
              <div className="lp-key-row">
                <input
                  type="text"
                  value={cacheCleared ? "Кэш очищен!" : "Кэш хранит переводы 24 часа"}
                  readOnly
                  style={{ color: cacheCleared ? "#16a34a" : undefined }}
                />
                <button onClick={handleClearCache}>Очистить кэш</button>
              </div>
            </section>
          </div>
        )}

        {activeTab === "history" && (
          <div className="lp-tab-content">
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0 }}>История переписывания</h2>
                <button onClick={handleClearHistory} className="lp-danger-btn">Очистить историю</button>
              </div>
              <div className="lp-history-list">
                {history.length === 0 ? (
                  <div className="lp-empty-state">История пуста. Используйте помощник при письме на любой странице.</div>
                ) : (
                  history.map(item => (
                    <div key={item.id} className="lp-history-item">
                      <div className="lp-history-date">{new Date(item.timestamp).toLocaleString()}</div>
                      <div className="lp-history-original"><strong>Оригинал:</strong> {item.originalText}</div>
                      <div className="lp-history-result"><strong>Результат:</strong> {item.rewrittenText}</div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        <div className="lp-save-row" style={{ height: '36px', alignItems: 'center' }}>
          {saved && <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Автоматически сохранено</span>}
        </div>
      </div>
    </div>
  );
}
