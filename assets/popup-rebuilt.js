import{r as __React,j as __JSX,c as __ReactDOM}from'./constants-DLtXp2zm.js';
const __modules={"src/shared/types":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"src/shared/storage":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRANSLATION_LOG_RETENTION_MS = exports.TRANSLATION_LOG_MAX_ENTRIES = exports.DEFAULT_SETTINGS = void 0;
exports.hasStorageContext = hasStorageContext;
exports.getSettings = getSettings;
exports.setSettings = setSettings;
exports.getSetting = getSetting;
exports.getHistory = getHistory;
exports.addHistoryEntry = addHistoryEntry;
exports.updateHistoryFavorite = updateHistoryFavorite;
exports.removeHistoryEntry = removeHistoryEntry;
exports.clearHistory = clearHistory;
exports.getTranslationLogs = getTranslationLogs;
exports.addTranslationLog = addTranslationLog;
exports.flushTranslationLogWrites = flushTranslationLogWrites;
exports.clearTranslationLogs = clearTranslationLogs;
exports.DEFAULT_SETTINGS = {
    activeProvider: "mistral",
    providers: {
        mistral: { apiKeys: "", selectedModel: "mistral-small-latest" },
        groq: { apiKeys: "", selectedModel: "openai/gpt-oss-20b" },
        cerebras: { apiKeys: "", selectedModel: "gpt-oss-120b" },
        openai: { apiKeys: "", selectedModel: "gpt-4o-mini" },
        anthropic: { apiKeys: "", selectedModel: "claude-3-haiku-20240307" },
        gemini: { apiKeys: "", selectedModel: "gemini-2.0-flash" },
    },
    defaultTargetLanguage: "ru",
    llmEnabled: true,
    fallbackProvider: "auto",
    libreTranslateEndpoint: "",
    excludedSites: [],
    theme: "system",
    overlayTheme: "system",
    accentColor: "pink",
    fontSize: "medium",
    compactMode: false,
    showExamples: true,
};
const SYNC_KEYS = [
    "theme",
    "overlayTheme",
    "accentColor",
    "fontSize",
    "compactMode",
    "showExamples",
    "defaultTargetLanguage",
    "llmEnabled",
    "fallbackProvider",
    "libreTranslateEndpoint",
    "activeProvider",
];
function cloneDefaultSettings() {
    return {
        ...exports.DEFAULT_SETTINGS,
        providers: {
            mistral: { ...exports.DEFAULT_SETTINGS.providers.mistral },
            groq: { ...exports.DEFAULT_SETTINGS.providers.groq },
            cerebras: { ...exports.DEFAULT_SETTINGS.providers.cerebras },
            openai: { ...exports.DEFAULT_SETTINGS.providers.openai },
            anthropic: { ...exports.DEFAULT_SETTINGS.providers.anthropic },
            gemini: { ...exports.DEFAULT_SETTINGS.providers.gemini },
        },
        excludedSites: [...exports.DEFAULT_SETTINGS.excludedSites],
    };
}
function hasStorageContext() {
    return (typeof chrome !== "undefined" &&
        Boolean(chrome.runtime?.id) &&
        Boolean(chrome.storage?.sync) &&
        Boolean(chrome.storage?.local));
}
async function getSettings() {
    if (!hasStorageContext()) {
        return cloneDefaultSettings();
    }
    try {
        // 1. Fetch sync and local storage simultaneously
        const [syncRes, localRes] = await Promise.all([
            chrome.storage.sync.get(["settings", ...SYNC_KEYS]),
            chrome.storage.local.get(["settings", "providers", "excludedSites"]),
        ]);
        const legacySyncSettings = syncRes.settings || {};
        const legacyLocalSettings = localRes.settings || {};
        // 2. Resolve providers (local > legacyLocal > legacySync > DEFAULT)
        let storedProviders = localRes.providers || legacyLocalSettings.providers || legacySyncSettings.providers;
        // Check if migration is needed from sync to local
        let shouldSaveLocal = false;
        const localMigrationPayload = {};
        if (!localRes.providers && storedProviders) {
            localMigrationPayload.providers = storedProviders;
            shouldSaveLocal = true;
        }
        // 3. Resolve excludedSites (local > legacyLocal > legacySync > DEFAULT)
        let storedExcludedSites = localRes.excludedSites || legacyLocalSettings.excludedSites || legacySyncSettings.excludedSites;
        if (!localRes.excludedSites && storedExcludedSites) {
            localMigrationPayload.excludedSites = storedExcludedSites;
            shouldSaveLocal = true;
        }
        if (shouldSaveLocal) {
            chrome.storage.local.set(localMigrationPayload).catch(() => { });
        }
        // If legacy sync settings contain heavy keys, clean up sync storage
        if (legacySyncSettings.providers || legacySyncSettings.excludedSites) {
            const cleanSyncSettings = { ...legacySyncSettings };
            delete cleanSyncSettings.providers;
            delete cleanSyncSettings.excludedSites;
            chrome.storage.sync.set({ settings: cleanSyncSettings }).catch(() => { });
        }
        // 4. Merge provider configurations
        const mergedProviders = {
            mistral: { ...exports.DEFAULT_SETTINGS.providers.mistral },
            groq: { ...exports.DEFAULT_SETTINGS.providers.groq },
            cerebras: { ...exports.DEFAULT_SETTINGS.providers.cerebras },
            openai: { ...exports.DEFAULT_SETTINGS.providers.openai },
            anthropic: { ...exports.DEFAULT_SETTINGS.providers.anthropic },
            gemini: { ...exports.DEFAULT_SETTINGS.providers.gemini },
        };
        if (storedProviders) {
            for (const [key, val] of Object.entries(storedProviders)) {
                const providerKey = key;
                if (mergedProviders[providerKey]) {
                    mergedProviders[providerKey] = {
                        ...mergedProviders[providerKey],
                        ...val,
                    };
                }
            }
        }
        // 5. Merge sync settings
        const mergedSyncSettings = {};
        for (const key of SYNC_KEYS) {
            if (syncRes[key] !== undefined) {
                mergedSyncSettings[key] = syncRes[key];
            }
            else if (legacySyncSettings[key] !== undefined) {
                mergedSyncSettings[key] = legacySyncSettings[key];
            }
            else if (legacyLocalSettings[key] !== undefined) {
                mergedSyncSettings[key] = legacyLocalSettings[key];
            }
        }
        // Migration from v1.1.4: the old global theme controlled both popup and
        // floating translator. Preserve that appearance once, then keep the two
        // preferences independent (including after popup theme toggles).
        if (mergedSyncSettings.overlayTheme === undefined) {
            const legacyTheme = mergedSyncSettings.theme;
            const overlayTheme = legacyTheme === "light" || legacyTheme === "dark" || legacyTheme === "system"
                ? legacyTheme : exports.DEFAULT_SETTINGS.overlayTheme;
            mergedSyncSettings.overlayTheme = overlayTheme;
            // Failure to sync a new appearance preference must not make the rest
            // of the stored provider/translation settings appear to be missing.
            try {
                await chrome.storage.sync.set({ overlayTheme });
            }
            catch (error) {
                console.warn("[LinguaPop] Could not persist migrated overlay theme:", error);
            }
        }
        const rawFallback = mergedSyncSettings.fallbackProvider;
        const normalizedFallback = rawFallback === "none" ? "none" : "auto";
        return {
            ...exports.DEFAULT_SETTINGS,
            ...mergedSyncSettings,
            fallbackProvider: normalizedFallback,
            providers: mergedProviders,
            excludedSites: Array.isArray(storedExcludedSites)
                ? storedExcludedSites
                : exports.DEFAULT_SETTINGS.excludedSites,
        };
    }
    catch (err) {
        console.error("[LinguaPop] getSettings error:", err);
        return cloneDefaultSettings();
    }
}
let settingsWriteQueue = Promise.resolve();
async function setSettings(settings) {
    const write = settingsWriteQueue.catch(() => { }).then(() => writeSettings(settings));
    settingsWriteQueue = write;
    await write;
}
async function writeSettings(settings) {
    try {
        const current = await getSettings();
        const updated = { ...current, ...settings };
        // Deep merge providers if provided in partial settings
        if (settings.providers) {
            updated.providers = {
                ...current.providers,
            };
            for (const [k, v] of Object.entries(settings.providers)) {
                const pKey = k;
                updated.providers[pKey] = {
                    ...(current.providers[pKey] || exports.DEFAULT_SETTINGS.providers[pKey]),
                    ...v,
                };
            }
        }
        // 1. Prepare sync storage updates
        const syncData = {};
        for (const key of SYNC_KEYS) {
            if (Object.prototype.hasOwnProperty.call(settings, key) && settings[key] !== undefined) {
                syncData[key] = settings[key];
            }
        }
        // 2. Prepare local storage updates (heavy & private data)
        const localPayload = {};
        if (settings.providers)
            localPayload.providers = updated.providers;
        if (settings.excludedSites)
            localPayload.excludedSites = updated.excludedSites;
        await Promise.all([
            chrome.storage.sync.set(syncData),
            Object.keys(localPayload).length ? chrome.storage.local.set(localPayload) : Promise.resolve(),
        ]);
    }
    catch (err) {
        console.error("[LinguaPop] setSettings error:", err);
        throw err;
    }
}
async function getSetting(key) {
    const settings = await getSettings();
    return settings[key];
}
// Popup history is distinct from the removed Writing Assistant history.
const HISTORY_KEY = "popupTranslationHistory";
let historyWriteQueue = Promise.resolve();
async function getHistory() {
    const data = await chrome.storage.local.get(HISTORY_KEY);
    return Array.isArray(data[HISTORY_KEY]) ? data[HISTORY_KEY] : [];
}
async function updateHistory(change) {
    const job = historyWriteQueue.catch(() => { }).then(async () => {
        const old = await getHistory();
        await chrome.storage.local.set({ [HISTORY_KEY]: change(old) });
    });
    historyWriteQueue = job;
    await job;
}
async function addHistoryEntry(entry) {
    await updateHistory((items) => {
        const withoutDuplicate = items.filter((item) => item.id !== entry.id);
        const list = [entry, ...withoutDuplicate];
        while (list.length > 500) {
            const idx = list.findLastIndex((item) => !item.favorite);
            if (idx < 0)
                list.pop();
            else
                list.splice(idx, 1);
        }
        return list;
    });
}
async function updateHistoryFavorite(id, favorite) {
    await updateHistory((items) => items.map((item) => item.id === id ? { ...item, favorite } : item));
}
async function removeHistoryEntry(id) {
    await updateHistory((items) => items.filter((item) => item.id !== id));
}
async function clearHistory() { await updateHistory(() => []); }
const TRANSLATION_LOG_KEY = "translationLogs";
exports.TRANSLATION_LOG_MAX_ENTRIES = 500;
exports.TRANSLATION_LOG_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
let translationLogWriteQueue = Promise.resolve();
function pruneTranslationLogs(logs, now = Date.now()) {
    const cutoff = now - exports.TRANSLATION_LOG_RETENTION_MS;
    return logs
        .filter((item) => Number(item?.timestamp) >= cutoff)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, exports.TRANSLATION_LOG_MAX_ENTRIES);
}
async function getTranslationLogs() {
    try {
        const result = await chrome.storage.local.get(TRANSLATION_LOG_KEY);
        const current = Array.isArray(result[TRANSLATION_LOG_KEY])
            ? result[TRANSLATION_LOG_KEY]
            : [];
        const pruned = pruneTranslationLogs(current);
        if (pruned.length !== current.length) {
            await chrome.storage.local.set({ [TRANSLATION_LOG_KEY]: pruned });
        }
        return pruned;
    }
    catch {
        return [];
    }
}
async function writeTranslationLog(entry) {
    const result = await chrome.storage.local.get(TRANSLATION_LOG_KEY);
    const current = Array.isArray(result[TRANSLATION_LOG_KEY])
        ? result[TRANSLATION_LOG_KEY]
        : [];
    const next = pruneTranslationLogs([entry, ...current]);
    await chrome.storage.local.set({ [TRANSLATION_LOG_KEY]: next });
}
function addTranslationLog(entry) {
    translationLogWriteQueue = translationLogWriteQueue
        .catch(() => { })
        .then(() => writeTranslationLog(entry));
    return translationLogWriteQueue;
}
async function flushTranslationLogWrites() {
    await translationLogWriteQueue.catch(() => { });
}
async function clearTranslationLogs() {
    await flushTranslationLogWrites();
    await chrome.storage.local.remove(TRANSLATION_LOG_KEY);
}

},
"src/shared/tts/tts":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSpeaking = isSpeaking;
exports.stopSpeaking = stopSpeaking;
exports.speak = speak;
let sharedAudioContext = null;
let currentAudioSource = null;
let currentAudioElement = null;
let speaking = false;
function getOrCreateAudioContext() {
    if (typeof window === "undefined")
        return null;
    if (!sharedAudioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            sharedAudioContext = new AudioContextClass();
        }
    }
    return sharedAudioContext;
}
function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}
function isSpeaking() {
    return speaking;
}
function stopSpeaking() {
    speaking = false;
    if (currentAudioSource) {
        try {
            currentAudioSource.stop();
            currentAudioSource.disconnect();
        }
        catch { }
        currentAudioSource = null;
    }
    if (currentAudioElement) {
        try {
            currentAudioElement.pause();
            currentAudioElement.currentTime = 0;
        }
        catch { }
        currentAudioElement = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
        try {
            window.speechSynthesis.cancel();
        }
        catch { }
    }
}
function splitTextIntoChunks(text, maxLen = 180) {
    const trimmed = text.trim();
    if (trimmed.length <= maxLen)
        return [trimmed];
    const chunks = [];
    const sentences = trimmed.match(/[^.!?\n]+[.!?\n]*/g) || [trimmed];
    let current = "";
    for (const sentence of sentences) {
        if ((current + sentence).length <= maxLen) {
            current += sentence;
        }
        else {
            if (current.trim()) {
                chunks.push(current.trim());
                current = "";
            }
            if (sentence.length <= maxLen) {
                current = sentence;
            }
            else {
                const words = sentence.split(/\s+/);
                for (const word of words) {
                    if ((current + " " + word).trim().length <= maxLen) {
                        current = (current + " " + word).trim();
                    }
                    else {
                        if (current.trim())
                            chunks.push(current.trim());
                        current = word;
                    }
                }
            }
        }
    }
    if (current.trim())
        chunks.push(current.trim());
    return chunks.length > 0 ? chunks : [trimmed.slice(0, maxLen)];
}
async function fetchTTSAudio(text, lang) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${encodeURIComponent(lang)}&client=tw-ob`;
    return new Promise((resolve) => {
        if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
            chrome.runtime.sendMessage({ type: "FETCH_TTS", url }, (res) => {
                if (chrome.runtime.lastError || !res?.success) {
                    resolve({});
                }
                else {
                    resolve(res);
                }
            });
        }
        else {
            resolve({});
        }
    });
}
async function playAudioBuffer(arrayBuffer, ctx) {
    if (ctx.state === "suspended") {
        await ctx.resume();
    }
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    if (!speaking)
        return;
    return new Promise((resolve) => {
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => {
            if (currentAudioSource === source) {
                currentAudioSource = null;
            }
            resolve();
        };
        currentAudioSource = source;
        source.start();
    });
}
async function playAudioElement(dataUrl) {
    return new Promise((resolve, reject) => {
        if (typeof Audio === "undefined") {
            reject(new Error("HTMLAudioElement not supported"));
            return;
        }
        const audio = new Audio(dataUrl);
        currentAudioElement = audio;
        audio.onended = () => {
            if (currentAudioElement === audio) {
                currentAudioElement = null;
            }
            resolve();
        };
        audio.onerror = () => {
            if (currentAudioElement === audio) {
                currentAudioElement = null;
            }
            reject(new Error("Audio playback failed"));
        };
        audio.play().catch((err) => {
            if (currentAudioElement === audio) {
                currentAudioElement = null;
            }
            reject(err);
        });
    });
}
async function speak(text, lang = "en") {
    stopSpeaking();
    if (!text || !text.trim() || lang === "unknown")
        return;
    speaking = true;
    const targetLang = lang.toLowerCase().trim() || "en";
    // Pre-initialize and resume AudioContext synchronously inside user gesture
    const audioContext = getOrCreateAudioContext();
    if (audioContext && audioContext.state === "suspended") {
        audioContext.resume().catch(() => { });
    }
    const chunks = splitTextIntoChunks(text, 180);
    try {
        for (const chunk of chunks) {
            if (!speaking)
                break;
            const response = await fetchTTSAudio(chunk, targetLang);
            if (!response.dataUrl && !response.base64) {
                throw new Error("TTS fetch failed");
            }
            if (!speaking)
                break;
            if (response.dataUrl) {
                try {
                    await playAudioElement(response.dataUrl);
                    continue;
                }
                catch { }
            }
            const base64 = response.base64 || response.dataUrl?.split(",")[1];
            if (base64 && audioContext) {
                const arrayBuffer = base64ToArrayBuffer(base64);
                await playAudioBuffer(arrayBuffer, audioContext);
            }
            else {
                throw new Error("No audio playback method available");
            }
        }
    }
    catch (error) {
        console.warn("[LinguaPop] Audio playback failed, falling back to Web Speech:", error);
        if (speaking) {
            await fallbackSpeak(text, targetLang);
            return;
        }
    }
    speaking = false;
}
function getVoicesAsync() {
    return new Promise((resolve) => {
        if (typeof window === "undefined" || !window.speechSynthesis) {
            resolve([]);
            return;
        }
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            resolve(voices);
            return;
        }
        let resolved = false;
        const onVoicesChanged = () => {
            if (resolved)
                return;
            resolved = true;
            window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
            resolve(window.speechSynthesis.getVoices());
        };
        window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
        setTimeout(() => {
            if (resolved)
                return;
            resolved = true;
            window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
            resolve(window.speechSynthesis.getVoices());
        }, 300);
    });
}
async function fallbackSpeak(text, lang) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
        speaking = false;
        return;
    }
    const voices = await getVoicesAsync();
    if (!speaking)
        return;
    const targetPrefix = lang.toLowerCase();
    const preferredVoice = voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix) &&
        (v.name.includes("Google") ||
            v.name.includes("Premium") ||
            v.name.includes("Natural"))) || voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix));
    const chunks = splitTextIntoChunks(text, 180);
    for (const chunk of chunks) {
        if (!speaking)
            break;
        await new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(chunk);
            if (preferredVoice)
                utterance.voice = preferredVoice;
            utterance.lang = lang;
            utterance.rate = 0.95;
            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
            window.speechSynthesis.speak(utterance);
        });
    }
    speaking = false;
}

},
"src/shared/constants":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UI_STRINGS = exports.FALLBACK_PROVIDERS = exports.PROVIDER_HELP = exports.MODELS = exports.PROVIDERS = void 0;
exports.getApiKeyCheckDisposition = getApiKeyCheckDisposition;
exports.formatApiKeyError = formatApiKeyError;
exports.PROVIDERS = [
    { id: "mistral", name: "Mistral" },
    { id: "groq", name: "Groq" },
    { id: "cerebras", name: "Cerebras" },
    { id: "openai", name: "OpenAI (ChatGPT)" },
    { id: "anthropic", name: "Anthropic (Claude)" },
    { id: "gemini", name: "Google Gemini" },
];
exports.MODELS = {
    mistral: [
        {
            id: "mistral-small-latest",
            name: "Mistral Small — быстрый",
            description: "Быстрый вариант для повседневного перевода. Обычно лучший баланс скорости и качества.",
        },
        {
            id: "mistral-medium-latest",
            name: "Mistral Medium — баланс",
            description: "Качество выше, но ответ обычно медленнее, чем у Mistral Small.",
        },
        {
            id: "mistral-large-latest",
            name: "Mistral Large — качество",
            description: "Наиболее качественный вариант из списка, но обычно самый медленный.",
        },
    ],
    groq: [
        {
            id: "openai/gpt-oss-20b",
            name: "GPT-OSS 20B — самый быстрый (рекомендуется)",
            description: "≈1000 ток/с на Groq. Лучший вариант для мгновенного обычного перевода; reasoning снижен ради скорости.",
        },
        {
            id: "openai/gpt-oss-120b",
            name: "GPT-OSS 120B — качество выше",
            description: "≈500 ток/с. Модель крупнее и обычно сильнее на сложном контексте, но медленнее 20B.",
        },
        {
            id: "qwen/qwen3.6-27b",
            name: "Qwen 3.6 27B — мультиязычный (Preview)",
            description: "≈500 ток/с. Сильный мультиязычный вариант; reasoning отключён ради скорости. Preview-модель может меняться.",
        },
    ],
    cerebras: [
        {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B — очень быстрый (рекомендуется)",
            description: "≈3000 ток/с на Cerebras. Большая модель с очень высокой скоростью; reasoning снижен ради задержки.",
        },
        {
            id: "zai-glm-4.7",
            name: "GLM 4.7 — качество / reasoning (Preview)",
            description: "≈1000 ток/с. Сильный вариант для сложного контекста; reasoning отключён в LinguaPop ради быстрого перевода.",
        },
    ],
    openai: [
        { id: "gpt-4o-mini", name: "GPT-4o Mini (быстрый)" },
        { id: "gpt-4o", name: "GPT-4o (умный)" },
        { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
    ],
    anthropic: [
        { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku (быстрый)" },
        { id: "claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet (умный)" },
        { id: "claude-3-opus-20240229", name: "Claude 3 Opus" },
    ],
    gemini: [
        { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash (быстрый)" },
        { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
    ],
};
exports.PROVIDER_HELP = {
    mistral: {
        title: "Как получить API-ключ Mistral",
        steps: [
            "Откройте Mistral Studio и войдите в аккаунт.",
            "Перейдите в API Keys и нажмите Create new key.",
            "Скопируйте ключ и вставьте его в поле выше.",
        ],
        note: "Free mode доступен без банковской карты, но лимиты и доступность моделей могут меняться.",
        url: "https://console.mistral.ai/",
        buttonLabel: "Открыть Mistral Studio",
    },
    groq: {
        title: "Как получить API-ключ Groq",
        steps: [
            "Откройте GroqCloud Console и войдите в аккаунт.",
            "На странице API Keys нажмите Create API Key.",
            "Скопируйте ключ и вставьте его в поле выше.",
        ],
        note: "У Groq есть бесплатные лимиты. При их исчерпании API вернёт 429, и LinguaPop переключится на fallback.",
        url: "https://console.groq.com/keys",
        buttonLabel: "Открыть Groq API Keys",
    },
    cerebras: {
        title: "Как получить API-ключ Cerebras",
        steps: [
            "Откройте Cerebras Cloud Console и войдите в аккаунт.",
            "Перейдите в API Keys и создайте новый ключ.",
            "Скопируйте ключ и вставьте его в поле выше.",
        ],
        note: "У Cerebras есть бесплатный доступ / free trial с лимитами. Точные квоты зависят от аккаунта и могут временно снижаться.",
        url: "https://cloud.cerebras.ai/",
        buttonLabel: "Открыть Cerebras Cloud",
    },
};
exports.FALLBACK_PROVIDERS = [
    { id: "auto", name: "Автоматический: Chrome Translator → Google GTX" },
];
exports.UI_STRINGS = {
    translate: "Перевести",
    copy: "Копировать",
    copied: "Скопировано",
    speak: "Озвучить",
    settings: "Настройки",
    apiKeyLabel: "API ключи",
    checkKey: "Проверить",
    keyWorks: "Работает",
    missingKey: "Укажите API ключ в настройках расширения.",
    networkError: "Ошибка сети. Проверьте подключение.",
    invalidKey: "Неверный API ключ.",
    rateLimit: "Превышен лимит запросов.",
    llmDisabled: "LLM отключён. Настройте fallback-переводчик в настройках.",
    translatePage: "Перевести страницу (экспериментально)",
    restorePage: "Вернуть оригинал",
};
function getApiKeyCheckDisposition(error) {
    if (!error)
        return "unknown";
    const separator = error.indexOf(":");
    const code = (separator >= 0 ? error.slice(0, separator) : error).trim();
    return code === "invalid_api_key" || code === "missing_api_key"
        ? "invalid"
        : "unknown";
}
function formatApiKeyError(error) {
    if (!error)
        return "Неизвестная ошибка проверки.";
    const separator = error.indexOf(":");
    const code = (separator >= 0 ? error.slice(0, separator) : error).trim();
    const detail = separator >= 0 ? error.slice(separator + 1).trim() : "";
    const messages = {
        invalid_api_key: "Ключ отклонён API (HTTP 401/403).",
        model_unavailable: "Выбранная модель недоступна для этого API-ключа или тарифа.",
        payment_required: "API-доступ требует оплаты или активации биллинга (HTTP 402).",
        rate_limit: "Достигнут лимит запросов или квоты (HTTP 429).",
        bad_request: "API отклонил тестовый запрос (HTTP 400/404/422).",
        request_timeout: "API не ответил за 20 секунд. Статус ключа не определён.",
        network_error: "Сетевая ошибка при обращении к API. Статус ключа не определён.",
        api_error: "Ошибка на стороне API (HTTP 5xx). Статус ключа не определён.",
        missing_api_key: "API-ключ не указан.",
    };
    const base = messages[code] || `Ошибка API: ${code}.`;
    return detail ? `${base} ${detail}` : base;
}

},
"src/shared/language":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LANGUAGE_NAMES = void 0;
exports.getLanguageName = getLanguageName;
exports.detectLanguage = detectLanguage;
exports.determineTargetLanguage = determineTargetLanguage;
exports.LANGUAGE_NAMES = {
    en: "English",
    ru: "Russian",
    es: "Spanish",
    de: "German",
    fr: "French",
    it: "Italian",
    pt: "Portuguese",
    zh: "Chinese",
    ja: "Japanese",
    ko: "Korean",
    ar: "Arabic",
    hi: "Hindi",
    tr: "Turkish",
    uk: "Ukrainian",
    pl: "Polish",
    nl: "Dutch",
    sv: "Swedish",
    fi: "Finnish",
    el: "Greek",
    he: "Hebrew",
    th: "Thai",
    vi: "Vietnamese",
    cs: "Czech",
    id: "Indonesian",
};
const SPANISH_COMMON_WORDS = new Set([
    "el", "la", "los", "las", "un", "una", "unos", "unas", "y", "o", "pero",
    "por", "para", "con", "como", "en", "es", "son", "este", "esta", "esto",
    "estos", "estas", "que", "del", "al", "hola", "gracias", "bueno", "buena",
    "buenos", "buenas", "bien", "si", "no", "amigo", "amiga", "nosotros",
    "ellos", "ellas", "hacer", "tener", "estar", "ser", "mas", "todo", "todos",
    "toda", "todas", "muy", "mucho", "muchos", "donde", "cuando", "quien", "porque",
    "tambien", "nada", "casa", "dia", "tiempo", "ano", "vida", "hombre", "mujer",
]);
const FRENCH_COMMON_WORDS = new Set([
    "le", "la", "les", "un", "une", "des", "et", "ou", "mais", "pour", "avec",
    "comme", "dans", "est", "sont", "ce", "cette", "ces", "que", "qui", "du",
    "au", "aux", "bonjour", "merci", "bien", "oui", "non", "nous", "vous",
    "ils", "elles", "faire", "avoir", "etre", "suis", "es", "sommes", "etes",
    "plus", "tout", "tous", "toute", "toutes", "tres", "beaucoup", "quand",
    "pourquoi", "aussi", "rien", "maison", "jour", "temps", "vie", "homme", "femme",
]);
const GERMAN_COMMON_WORDS = new Set([
    "der", "die", "das", "den", "dem", "des", "ein", "eine", "einer", "eines",
    "einem", "einen", "und", "oder", "aber", "fur", "mit", "wie", "in", "im",
    "ist", "sind", "dieser", "diese", "dieses", "dass", "nicht", "danke", "bitte",
    "gut", "guten", "ja", "nein", "wir", "ihr", "sie", "machen", "haben", "hat",
    "hatte", "sein", "bin", "bist", "war", "waren", "mehr", "alles", "alle",
    "sehr", "viel", "wo", "wann", "wer", "warum", "auch", "nichts", "haus", "tag",
    "zeit", "leben", "mann", "frau",
]);
const ITALIAN_COMMON_WORDS = new Set([
    "il", "lo", "la", "i", "gli", "le", "un", "uno", "una", "e", "ed", "o", "ma",
    "per", "con", "come", "in", "nel", "nella", "nei", "negli", "nelle", "sul",
    "sulla", "sui", "sono", "questo", "questa", "questi", "queste", "che", "chi",
    "del", "della", "dei", "degli", "delle", "al", "alla", "ai", "agli", "alle",
    "ciao", "grazie", "bene", "si", "no", "noi", "voi", "loro", "fare", "avere",
    "ho", "hai", "ha", "hanno", "essere", "siamo", "siete", "piu", "tutto", "tutti",
    "tutta", "tutte", "molto", "molti", "dove", "quando", "perche", "anche",
    "niente", "casa", "giorno", "tempo", "vita", "uomo", "donna",
]);
function getLanguageName(code) {
    if (!code)
        return "English";
    const normalized = code.toLowerCase().trim();
    if (exports.LANGUAGE_NAMES[normalized]) {
        return exports.LANGUAGE_NAMES[normalized];
    }
    // If already a full language name (e.g. "Russian", "English", "German")
    if (normalized.length > 3) {
        return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }
    return code.toUpperCase();
}
function detectLanguage(text) {
    if (!text || !text.trim())
        return "unknown";
    // Clean text from URLs, markdown symbols, and numbers
    const clean = text
        .replace(/https?:\/\/\S+/g, "")
        .replace(/[`*_~#\[\]()<>]/g, "")
        .trim();
    if (!clean)
        return "unknown";
    // Japanese Hiragana & Katakana
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(clean))
        return "ja";
    // Korean Hangul
    if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(clean))
        return "ko";
    // Chinese Hanzi (when no Japanese kana present)
    if (/[\u4E00-\u9FFF]/.test(clean))
        return "zh";
    // Arabic
    if (/[\u0600-\u06FF\u0750-\u077F]/.test(clean))
        return "ar";
    // Hebrew
    if (/[\u0590-\u05FF]/.test(clean))
        return "he";
    // Greek
    if (/[\u0370-\u03FF]/.test(clean))
        return "el";
    // Devanagari (Hindi)
    if (/[\u0900-\u097F]/.test(clean))
        return "hi";
    // Thai
    if (/[\u0E00-\u0E7F]/.test(clean))
        return "th";
    // Ukrainian specific Cyrillic letters
    if (/[іїєґІЇЄҐ]/.test(clean))
        return "uk";
    // Russian / General Cyrillic
    if (/[а-яёА-ЯЁ\u0400-\u04FF]/.test(clean))
        return "ru";
    // Specific Latin character sets
    if (/[äöüßÄÖÜ]/.test(clean))
        return "de";
    if (/[àâçéèêëîïôûùüÿœæÀÂÇÉÈÊËÎÏÔÛÙÜŸŒÆ]/.test(clean))
        return "fr";
    if (/[ñ¿¡áéíóúÁÉÍÓÚÑ]/.test(clean))
        return "es";
    if (/[ãõâêôÃÕÂÊÔ]/.test(clean))
        return "pt";
    if (/[ğışĞİŞ]/.test(clean))
        return "tr";
    if (/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(clean))
        return "pl";
    if (/[ěščřžýáíéůúďťňĚŠČŘŽÝÁÍÉŮÚĎŤŇ]/.test(clean))
        return "cs";
    // Common word heuristics for unaccented Latin text
    const words = clean.toLowerCase().match(/\b[a-z]{2,}\b/g) || [];
    if (words.length > 0) {
        let esScore = 0;
        let frScore = 0;
        let deScore = 0;
        let itScore = 0;
        for (const w of words) {
            if (SPANISH_COMMON_WORDS.has(w))
                esScore++;
            if (FRENCH_COMMON_WORDS.has(w))
                frScore++;
            if (GERMAN_COMMON_WORDS.has(w))
                deScore++;
            if (ITALIAN_COMMON_WORDS.has(w))
                itScore++;
        }
        const maxScore = Math.max(esScore, frScore, deScore, itScore);
        if (maxScore > 0) {
            if (esScore === maxScore && esScore > frScore && esScore > deScore && esScore > itScore)
                return "es";
            if (frScore === maxScore && frScore > esScore && frScore > deScore && frScore > itScore)
                return "fr";
            if (deScore === maxScore && deScore > esScore && deScore > frScore && deScore > itScore)
                return "de";
            if (itScore === maxScore && itScore > esScore && itScore > frScore && itScore > deScore)
                return "it";
            if (esScore === maxScore)
                return "es";
            if (frScore === maxScore)
                return "fr";
            if (deScore === maxScore)
                return "de";
            if (itScore === maxScore)
                return "it";
        }
    }
    // Default Latin to English
    if (/[a-zA-Z]/.test(clean))
        return "en";
    return "unknown";
}
function determineTargetLanguage(detected, defaultTarget = "ru") {
    const normDetected = (detected || "unknown").toLowerCase().trim();
    const normDefault = (defaultTarget || "ru").toLowerCase().trim();
    // If detected language matches defaultTarget, toggle to alternate language
    if (normDetected !== "unknown" && normDetected === normDefault) {
        return normDefault === "ru" ? "en" : (normDefault === "en" ? "ru" : "en");
    }
    // If detected language is known and different from defaultTarget, translate into defaultTarget
    if (normDetected !== "unknown" && normDetected !== "") {
        return normDefault;
    }
    // Fallback to defaultTarget
    return normDefault;
}

},
"src/shared/accent":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGACY_COLORS = exports.ACCENTS = void 0;
exports.resolveAccent = resolveAccent;
exports.accentForeground = accentForeground;
exports.applyAccent = applyAccent;
/** Central palette shared by popup, settings and the content-script Shadow DOM. */
exports.ACCENTS = [
    ["Розовый", "#df37a7"], ["Синий", "#3b82f6"], ["Изумруд", "#10b981"],
    ["Фиолетовый", "#8b5cf6"], ["Оранжевый", "#f97316"], ["Индиго", "#6366f1"],
    ["Бирюзовый", "#14b8a6"], ["Голубой", "#0ea5e9"], ["Красный", "#ef4444"],
    ["Янтарный", "#d97706"], ["Лайм", "#65a30d"], ["Малиновый", "#e11d48"],
    ["Сиреневый", "#a855f7"], ["Фуксия", "#d946ef"], ["Лазурный", "#0284c7"],
    ["Хвойный", "#15803d"], ["Шоколад", "#92400e"], ["Графит", "#475569"],
    ["Коралловый", "#e76f51"], ["Небесный", "#38bdf8"], ["Слива", "#9333ea"],
    ["Морская волна", "#0f766e"], ["Терракотовый", "#c2410c"], ["Лаванда", "#7c3aed"],
];
exports.LEGACY_COLORS = {
    pink: "#df37a7", blue: "#3b82f6", green: "#10b981", purple: "#8b5cf6", orange: "#f97316",
};
function resolveAccent(value) {
    if (/^#[\da-f]{6}$/i.test(value))
        return value.toLowerCase();
    return exports.LEGACY_COLORS[value] || "#df37a7";
}
function accentForeground(color) {
    const hex = resolveAccent(color);
    const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map((n) => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4);
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722 > .18 ? "#111827" : "#ffffff";
}
function applyAccent(color, el = document.documentElement) {
    el.style.setProperty("--lp-primary", resolveAccent(color));
    el.style.setProperty("--lp-primary-contrast", accentForeground(color));
}

},
"src/shared/theme":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyTheme = applyTheme;
exports.initTheme = initTheme;
exports.toggleTheme = toggleTheme;
const storage_1 = require("./storage");
function applyTheme(theme) {
    const root = document.documentElement;
    const isDark = theme === "dark" ||
        (theme === "system" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDark) {
        root.classList.add("lp-dark");
    }
    else {
        root.classList.remove("lp-dark");
    }
}
async function initTheme() {
    const theme = await (0, storage_1.getSetting)("theme");
    applyTheme(theme);
    // Listen for system theme changes
    window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", () => {
        (0, storage_1.getSetting)("theme").then((t) => applyTheme(t));
    });
}
async function toggleTheme() {
    const current = await (0, storage_1.getSetting)("theme");
    const next = current === "light" ? "dark" : current === "dark" ? "system" : "light";
    await (0, storage_1.setSettings)({ theme: next });
    applyTheme(next);
    return next;
}

},
"src/shared/translation/policy":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLanguagePair = resolveLanguagePair;
exports.isValidTranslation = isValidTranslation;
exports.isValidResult = isValidResult;
const language_1 = require("../language");
/** Only one resolver owns direction; explicit source+target is a deliberate override. */
function resolveLanguagePair(request) {
    const sourceLanguage = request.sourceLanguage && request.sourceLanguage !== "auto"
        ? request.sourceLanguage : (0, language_1.detectLanguage)(request.text);
    const targetLanguage = request.targetLanguage || (sourceLanguage === "ru" ? "en" : "ru");
    return { sourceLanguage: sourceLanguage === "unknown" ? "auto" : sourceLanguage, targetLanguage };
}
const normalized = (s) => s.toLocaleLowerCase().trim().replace(/\s+/g, " ");
const cyrillic = (s) => (s.match(/[а-яёіїєґ]/gi) || []).length;
const latin = (s) => (s.match(/[a-z]/gi) || []).length;
const COMMON_WORDS = new Set(["hello", "hi", "hey", "welcome", "goodbye", "thanks", "thank", "yes", "no", "please", "sorry", "morning", "evening", "night", "house", "book", "love", "world", "cat", "dog", "computer", "language", "text", "translate", "translation", "apple", "orange", "word", "english", "russian", "привет", "здравствуйте", "спасибо", "пожалуйста", "да", "нет", "мир", "дом", "книга", "кот", "кошка", "собака", "перевод", "язык", "текст", "слово"]);
const KNOWN_IDENTIFIERS = new Set(["iphone", "ipad", "macos", "github", "chatgpt", "openai", "python", "javascript", "typescript", "sql", "api", "gpt", "html", "css", "http", "json", "linux", "windows", "android", "ios", "microsoft", "google", "youtube"]);
const knownIdentifier = (s) => KNOWN_IDENTIFIERS.has(s.trim().toLocaleLowerCase());
const knownWord = (s) => COMMON_WORDS.has(s.trim().toLocaleLowerCase());
const entityOnly = (s) => !knownWord(s) && (knownIdentifier(s) || /[a-z][A-Z]/.test(s) || /^[\p{Lu}\p{N}\s.\-_'’+#@/]+$/u.test(s) || /^[A-Z][a-z]*\d*[+#]*$/.test(s));
/** Fail only on strong evidence. Never discard names, product labels, code or numbers. */
function isValidTranslation(source, translated, target) {
    const result = (translated || "").trim();
    if (!result)
        return false;
    const sourceClean = source.trim();
    if (!sourceClean || entityOnly(sourceClean) || /^(https?:\/\/|www\.)/i.test(sourceClean) || /^[\p{N}\p{P}\p{S}\s_]+$/u.test(sourceClean))
        return true;
    const sourceC = cyrillic(sourceClean), sourceL = latin(sourceClean);
    const outputC = cyrillic(result), outputL = latin(result);
    if (target === "ru" && sourceL >= 3 && sourceC === 0 && outputC === 0 && outputL >= 3) {
        // Protected entities have already been accepted above. A capitalized English
        // output is not enough evidence of a proper name ("Hello" -> "Greeting").
        return false;
    }
    if (target === "en" && sourceC >= 3 && sourceL === 0 && outputL === 0 && outputC >= 3)
        return false;
    if (normalized(sourceClean) === normalized(result) && sourceClean.length >= 4) {
        const textLang = (0, language_1.detectLanguage)(sourceClean);
        if (textLang === target)
            return true;
        if (textLang === "ru" && target === "en")
            return false;
        if (textLang === "en" && target === "ru")
            return entityOnly(sourceClean);
    }
    return true;
}
function isValidResult(request, result) {
    const target = request.targetLanguage || "ru";
    if ("translations" in result) {
        let texts;
        try {
            texts = JSON.parse(request.text);
        }
        catch {
            return false;
        }
        return Array.isArray(texts) && texts.length === result.translations.length &&
            texts.every((s, i) => isValidTranslation(s, result.translations[i], request.sourceLanguage === "auto" ? resolveLanguagePair({ ...request, mode: "phrase", text: s, targetLanguage: undefined }).targetLanguage : target));
    }
    return isValidTranslation(request.text, "mainTranslation" in result ? result.mainTranslation : result.translation, target);
}

},
"src/popup/PopupApp":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PopupApp;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const storage_1 = require("../shared/storage");
const tts_1 = require("../shared/tts/tts");
const constants_1 = require("../shared/constants");
const language_1 = require("../shared/language");
const accent_1 = require("../shared/accent");
const theme_1 = require("../shared/theme");
const policy_1 = require("../shared/translation/policy");
const DRAFT_KEY = "popupDraftV2";
const blankDraft = { input: "", result: "", resultLang: "ru" };
const icons = {
    settings: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("circle", { cx: "12", cy: "12", r: "3" }), (0, jsx_runtime_1.jsx)("path", { d: "M19.4 15a1.7 1.7 0 0 0 .34 1.88l.05.05-2.86 2.86-.05-.05A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1.5 1.6H10.5A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.88.34l-.05.05-2.86-2.86.05-.05A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 3 13.5v-3A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.05-.05 2.86-2.86.05.05A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10.5 3h3A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.05-.05 2.86 2.86-.05.05A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.6 1.5v3a1.7 1.7 0 0 0-1.6 1.5Z" })] }),
    clock: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("circle", { cx: "12", cy: "12", r: "9" }), (0, jsx_runtime_1.jsx)("path", { d: "M12 7v5l3 2" })] }),
    sun: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("circle", { cx: "12", cy: "12", r: "4" }), (0, jsx_runtime_1.jsx)("path", { d: "M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" })] }),
    moon: (0, jsx_runtime_1.jsx)("path", { d: "M20.4 13.3A8.5 8.5 0 0 1 10.7 3.6 8.5 8.5 0 1 0 20.4 13.3Z" }),
    copy: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("rect", { x: "8", y: "8", width: "12", height: "12", rx: "2" }), (0, jsx_runtime_1.jsx)("path", { d: "M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" })] }),
    speak: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M11 5 6 9H3v6h3l5 4V5Z" }), (0, jsx_runtime_1.jsx)("path", { d: "M15 9a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12" })] }),
    arrow: (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)("path", { d: "M5 12h14m-6-6 6 6-6 6" }) }),
    back: (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)("path", { d: "m15 18-6-6 6-6" }) }),
    refresh: (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)("path", { d: "M20 11a8 8 0 0 0-14-5L4 8m0-5v5h5M4 13a8 8 0 0 0 14 5l2-2m0 5v-5h-5" }) }),
    trash: (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)("path", { d: "M4 7h16M10 4h4m-8 3 1 14h10l1-14M10 11v6m4-6v6" }) }),
    star: (0, jsx_runtime_1.jsx)("path", { d: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" }),
    search: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("circle", { cx: "10.5", cy: "10.5", r: "6.5" }), (0, jsx_runtime_1.jsx)("path", { d: "m16 16 5 5" })] }),
    x: (0, jsx_runtime_1.jsx)("path", { d: "M5 5l14 14M19 5 5 19" }),
    keyboard: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("rect", { x: "2", y: "5", width: "20", height: "14", rx: "2" }), (0, jsx_runtime_1.jsx)("path", { d: "M5 9h1m3 0h1m3 0h1m3 0h1M5 13h1m3 0h1m3 0h1m3 0h1m-10 3h8" })] }),
};
function Icon({ name, size = 18 }) {
    return (0, jsx_runtime_1.jsx)("svg", { "aria-hidden": "true", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", children: icons[name] });
}
function useAppearance(settings) {
    (0, react_1.useEffect)(() => {
        if (!settings)
            return;
        const apply = () => {
            (0, theme_1.applyTheme)(settings.theme);
            document.documentElement.dataset.fontSize = settings.fontSize;
            document.documentElement.classList.toggle("lp-compact", settings.compactMode);
            (0, accent_1.applyAccent)(settings.accentColor);
        };
        const mq = matchMedia("(prefers-color-scheme: dark)");
        apply();
        mq.addEventListener("change", apply);
        return () => mq.removeEventListener("change", apply);
    }, [settings]);
}
function PopupApp() {
    const [settings, setLocalSettings] = (0, react_1.useState)(null);
    const [draft, setDraft] = (0, react_1.useState)(blankDraft);
    const [direction, setDirection] = (0, react_1.useState)("auto");
    const [screen, setScreen] = (0, react_1.useState)("translate");
    const [history, setHistory] = (0, react_1.useState)([]);
    const [search, setSearch] = (0, react_1.useState)("");
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)("");
    const [copied, setCopied] = (0, react_1.useState)(false);
    const [draftReady, setDraftReady] = (0, react_1.useState)(false);
    const inputRef = (0, react_1.useRef)(null);
    const requestRef = (0, react_1.useRef)(null);
    const seqRef = (0, react_1.useRef)(0);
    useAppearance(settings);
    (0, react_1.useEffect)(() => {
        let alive = true;
        Promise.all([(0, storage_1.getSettings)(), chrome.storage.local.get(DRAFT_KEY)]).then(([s, saved]) => {
            if (!alive)
                return;
            setLocalSettings(s);
            const d = saved[DRAFT_KEY];
            if (d && typeof d.input === "string" && typeof d.result === "string")
                setDraft({ input: d.input, result: d.result, resultLang: d.resultLang || "ru" });
            setDraftReady(true);
        });
        const listener = (changes) => {
            if (["theme", "accentColor", "providers", "activeProvider", "llmEnabled", "fontSize", "compactMode", "showExamples"].some(k => changes[k]))
                (0, storage_1.getSettings)().then(s => { if (alive)
                    setLocalSettings(s); });
            if (changes.popupTranslationHistory)
                (0, storage_1.getHistory)().then(items => { if (alive)
                    setHistory(items); });
        };
        chrome.storage.onChanged.addListener(listener);
        return () => { alive = false; chrome.storage.onChanged.removeListener(listener); if (requestRef.current)
            chrome.runtime.sendMessage({ type: "CANCEL_TRANSLATION", requestId: requestRef.current }).catch(() => { }); };
    }, []);
    // Wait for the persisted draft to be rendered before selecting. Focusing during
    // the storage request would leave the cursor after the restored text.
    (0, react_1.useEffect)(() => {
        if (!draftReady)
            return;
        const field = inputRef.current;
        if (field) {
            field.focus();
            field.select();
        }
    }, [draftReady]);
    (0, react_1.useEffect)(() => {
        if (!draftReady)
            return;
        const timer = setTimeout(() => { void chrome.storage.local.set({ [DRAFT_KEY]: draft }); }, 180);
        return () => clearTimeout(timer);
    }, [draft]);
    (0, react_1.useEffect)(() => { if (screen === "history")
        (0, storage_1.getHistory)().then(setHistory);
    else
        inputRef.current?.focus(); }, [screen]);
    const cancelPending = (0, react_1.useCallback)(() => {
        seqRef.current += 1;
        if (requestRef.current)
            chrome.runtime.sendMessage({ type: "CANCEL_TRANSLATION", requestId: requestRef.current }).catch(() => { });
        requestRef.current = null;
        setLoading(false);
    }, []);
    const editInput = (value) => { cancelPending(); setError(""); setDraft({ input: value, result: "", resultLang: "ru" }); };
    const pair = direction === "auto" ? (0, policy_1.resolveLanguagePair)({ text: draft.input, mode: "popup" }) : {
        sourceLanguage: direction === "en-ru" ? "en" : "ru",
        targetLanguage: direction === "en-ru" ? "ru" : "en",
    };
    const sourceSpeechLanguage = (0, language_1.detectLanguage)(draft.input);
    const speakSource = () => {
        if (!draft.input.trim())
            return;
        void (0, tts_1.speak)(draft.input, sourceSpeechLanguage === "unknown"
            ? (pair.sourceLanguage === "auto" ? "en" : pair.sourceLanguage)
            : sourceSpeechLanguage);
    };
    const translate = (0, react_1.useCallback)(() => {
        const text = draft.input.trim();
        if (!text)
            return;
        cancelPending();
        const token = `popup-${crypto.randomUUID()}`;
        const currentSeq = seqRef.current;
        requestRef.current = token;
        setLoading(true);
        setError("");
        setDraft(d => ({ ...d, result: "" }));
        const pair = direction === "auto" ? (0, policy_1.resolveLanguagePair)({ text, mode: "popup" }) : {
            sourceLanguage: direction === "en-ru" ? "en" : "ru", targetLanguage: direction === "en-ru" ? "ru" : "en",
        };
        const request = { text, mode: "popup", ...pair };
        chrome.runtime.sendMessage({ type: "TRANSLATE", requestId: token, data: request }, async (response) => {
            if (seqRef.current !== currentSeq || requestRef.current !== token)
                return;
            requestRef.current = null;
            setLoading(false);
            if (chrome.runtime.lastError) {
                setError("Не удалось связаться с расширением.");
                return;
            }
            if (!response?.success || !response.result?.translation) {
                const code = response?.error || "unknown";
                setError(code === "incorrect_target_language" ? "Не удалось получить перевод на нужном языке." : code === "llm_disabled_no_fallback" ? "Переводчики недоступны. Проверьте настройки." : "Ошибка перевода. Проверьте подключение и настройки.");
                return;
            }
            const result = response.result;
            setDraft(d => ({ ...d, result: result.translation, resultLang: pair.targetLanguage }));
            await (0, storage_1.addHistoryEntry)({ id: crypto.randomUUID(), timestamp: Date.now(), originalText: text, translation: result.translation, sourceLanguage: pair.sourceLanguage, targetLanguage: pair.targetLanguage, favorite: false }).catch(() => { });
        });
    }, [draft.input, direction, cancelPending]);
    const copy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
        catch {
            setError("Не удалось скопировать текст.");
        }
    };
    const updateSettings = async (patch) => {
        setLocalSettings(s => s ? { ...s, ...patch } : s);
        await (0, storage_1.setSettings)(patch);
    };
    const pageAction = async (type) => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id)
                throw new Error("no_tab");
            await chrome.tabs.sendMessage(tab.id, { type });
            window.close();
        }
        catch {
            setError("Эта страница не поддерживает перевод расширениями.");
        }
    };
    const openHistory = () => { cancelPending(); setScreen("history"); };
    const restore = (entry) => { cancelPending(); setDraft({ input: entry.originalText, result: entry.translation, resultLang: entry.targetLanguage }); setDirection("auto"); setScreen("translate"); };
    const toggleFavorite = async (item) => { await (0, storage_1.updateHistoryFavorite)(item.id, !item.favorite); setHistory(await (0, storage_1.getHistory)()); };
    const remove = async (id) => { await (0, storage_1.removeHistoryEntry)(id); setHistory(await (0, storage_1.getHistory)()); };
    const shortcuts = (e) => {
        if (e.key === "Escape") {
            e.preventDefault();
            window.close();
        }
        else if (e.altKey && e.code === "KeyL") {
            e.preventDefault();
            window.close();
        }
        else if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && screen === "translate") {
            e.preventDefault();
            translate();
        }
    };
    if (!settings)
        return (0, jsx_runtime_1.jsx)("div", { className: "lp-loading-screen", "aria-label": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430", children: "LinguaPop" });
    const models = constants_1.MODELS[settings.activeProvider] || [];
    const isEffectivelyDark = settings.theme === "dark" ||
        (settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const shown = history.filter(i => `${i.originalText} ${i.translation}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
    return (0, jsx_runtime_1.jsxs)("div", { className: "lp-shell", onKeyDown: shortcuts, children: [(0, jsx_runtime_1.jsxs)("header", { className: "lp-header", children: [(0, jsx_runtime_1.jsxs)("div", { className: "lp-brand", children: [(0, jsx_runtime_1.jsxs)("div", { className: "lp-logo", children: ["L", (0, jsx_runtime_1.jsx)("span", { children: "\u2197" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "LinguaPop" }), (0, jsx_runtime_1.jsx)("div", { className: "lp-subtitle", children: "AI TRANSLATOR" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "lp-header-actions", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", className: `lp-icon-button ${screen === "history" ? "is-active" : ""}`, onClick: () => screen === "history" ? setScreen("translate") : openHistory(), title: "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u043E\u0432", "aria-label": "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u043E\u0432", children: (0, jsx_runtime_1.jsx)(Icon, { name: "clock" }) }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "lp-icon-button", onClick: () => updateSettings({ theme: isEffectivelyDark ? "light" : "dark" }), title: `Тема: ${settings.theme}`, "aria-label": "\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0442\u0435\u043C\u0443", children: (0, jsx_runtime_1.jsx)(Icon, { name: isEffectivelyDark ? "moon" : "sun" }) }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "lp-icon-button", onClick: () => chrome.runtime.openOptionsPage(), title: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438", "aria-label": "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438", children: (0, jsx_runtime_1.jsx)(Icon, { name: "settings" }) })] })] }), screen === "translate" ? (0, jsx_runtime_1.jsxs)("main", { className: "lp-main", children: [(0, jsx_runtime_1.jsxs)("div", { className: "lp-direction-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "lp-eyebrow", children: "\u041D\u0410\u041F\u0420\u0410\u0412\u041B\u0415\u041D\u0418\u0415" }), (0, jsx_runtime_1.jsxs)("div", { className: "lp-direction-pills", role: "group", "aria-label": "\u041D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430", children: [(0, jsx_runtime_1.jsx)("button", { className: direction === "auto" ? "selected" : "", onClick: () => { cancelPending(); setDirection("auto"); setDraft(d => ({ ...d, result: "" })); }, children: "\u0410\u0432\u0442\u043E" }), (0, jsx_runtime_1.jsx)("button", { className: direction === "en-ru" ? "selected" : "", onClick: () => { cancelPending(); setDirection("en-ru"); setDraft(d => ({ ...d, result: "" })); }, children: "EN \u2192 RU" }), (0, jsx_runtime_1.jsx)("button", { className: direction === "ru-en" ? "selected" : "", onClick: () => { cancelPending(); setDirection("ru-en"); setDraft(d => ({ ...d, result: "" })); }, children: "RU \u2192 EN" })] })] }), (0, jsx_runtime_1.jsxs)("section", { className: "lp-text-card lp-source", children: [(0, jsx_runtime_1.jsxs)("div", { className: "lp-card-title", children: [(0, jsx_runtime_1.jsx)("span", { children: "\u0418\u0441\u0445\u043E\u0434\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442" }), (0, jsx_runtime_1.jsx)("span", { className: "lp-language-mark", children: draft.input ? (pair.sourceLanguage === "auto" ? "AUTO" : pair.sourceLanguage.toUpperCase()) : "AUTO" })] }), (0, jsx_runtime_1.jsx)("textarea", { ref: inputRef, "aria-label": "\u0422\u0435\u043A\u0441\u0442 \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430", placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0442\u0435\u043A\u0441\u0442 \u043D\u0430 \u043B\u044E\u0431\u043E\u043C \u044F\u0437\u044B\u043A\u0435\u2026", value: draft.input, onChange: e => editInput(e.target.value), spellCheck: false }), (0, jsx_runtime_1.jsxs)("div", { className: "lp-field-foot", children: [(0, jsx_runtime_1.jsxs)("span", { children: [draft.input.length, " \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432"] }), (0, jsx_runtime_1.jsxs)("div", { className: "lp-field-actions", children: [(0, jsx_runtime_1.jsxs)("button", { type: "button", className: "lp-mini-btn", onClick: speakSource, disabled: !draft.input.trim(), title: "\u041E\u0437\u0432\u0443\u0447\u0438\u0442\u044C \u0438\u0441\u0445\u043E\u0434\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442", "aria-label": "\u041E\u0437\u0432\u0443\u0447\u0438\u0442\u044C \u0438\u0441\u0445\u043E\u0434\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442", children: [(0, jsx_runtime_1.jsx)(Icon, { name: "speak", size: 16 }), " \u041E\u0437\u0432\u0443\u0447\u0438\u0442\u044C"] }), draft.input && (0, jsx_runtime_1.jsxs)("button", { type: "button", className: "lp-mini-btn", onClick: () => editInput(""), title: "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u043F\u043E\u043B\u0435", children: [(0, jsx_runtime_1.jsx)(Icon, { name: "x", size: 14 }), " \u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C"] })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "lp-translate-bar", children: [(0, jsx_runtime_1.jsxs)("div", { className: "lp-model-choice", children: [(0, jsx_runtime_1.jsx)("span", { className: "lp-model-dot" }), (0, jsx_runtime_1.jsx)("select", { "aria-label": "\u041C\u043E\u0434\u0435\u043B\u044C \u0418\u0418", value: settings.providers[settings.activeProvider]?.selectedModel || "", onChange: e => { const id = settings.activeProvider; void updateSettings({ providers: { ...settings.providers, [id]: { ...settings.providers[id], selectedModel: e.target.value } } }); }, disabled: !settings.llmEnabled, children: models.map(m => (0, jsx_runtime_1.jsx)("option", { value: m.id, children: m.name }, m.id)) })] }), (0, jsx_runtime_1.jsxs)("button", { type: "button", className: "lp-translate-button", onClick: translate, disabled: !draft.input.trim() || loading, children: [loading ? (0, jsx_runtime_1.jsx)("span", { className: "lp-loader" }) : (0, jsx_runtime_1.jsx)(Icon, { name: "arrow", size: 17 }), " ", loading ? "Переводим" : "Перевести"] })] }), (0, jsx_runtime_1.jsxs)("section", { className: "lp-text-card lp-result", children: [(0, jsx_runtime_1.jsxs)("div", { className: "lp-card-title", children: [(0, jsx_runtime_1.jsx)("span", { children: "\u041F\u0435\u0440\u0435\u0432\u043E\u0434" }), (0, jsx_runtime_1.jsx)("span", { className: "lp-language-mark", children: draft.result ? draft.resultLang.toUpperCase() : pair.targetLanguage.toUpperCase() })] }), (0, jsx_runtime_1.jsx)("div", { className: `lp-result-content ${!draft.result ? "placeholder" : ""}`, "aria-live": "polite", children: draft.result || (loading ? "Получаем перевод…" : "Здесь появится перевод") }), (0, jsx_runtime_1.jsx)("div", { className: "lp-result-foot", children: draft.result ? (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("button", { className: "lp-mini-btn", onClick: () => (0, tts_1.speak)(draft.result, draft.resultLang), children: [(0, jsx_runtime_1.jsx)(Icon, { name: "speak", size: 16 }), " \u041E\u0437\u0432\u0443\u0447\u0438\u0442\u044C"] }), (0, jsx_runtime_1.jsxs)("button", { className: "lp-mini-btn", onClick: () => copy(draft.result), children: [(0, jsx_runtime_1.jsx)(Icon, { name: "copy", size: 16 }), " ", copied ? "Скопировано" : "Копировать"] })] }) : (0, jsx_runtime_1.jsx)("span", { children: "\u0411\u044B\u0441\u0442\u0440\u043E \u0438 \u0431\u0435\u0437 \u043B\u0438\u0448\u043D\u0438\u0445 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439" }) })] }), error && (0, jsx_runtime_1.jsx)("div", { className: "lp-error", role: "alert", children: error }), (0, jsx_runtime_1.jsxs)("div", { className: "lp-page-row", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => pageAction("START_PAGE_TRANSLATION"), children: ["\u041F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443 ", (0, jsx_runtime_1.jsx)(Icon, { name: "arrow", size: 14 })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => pageAction("RESTORE_PAGE"), children: [(0, jsx_runtime_1.jsx)(Icon, { name: "refresh", size: 14 }), " \u041E\u0440\u0438\u0433\u0438\u043D\u0430\u043B"] })] }), (0, jsx_runtime_1.jsxs)("footer", { className: "lp-footer", children: [(0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)(Icon, { name: "keyboard", size: 14 }), " ", (0, jsx_runtime_1.jsx)("kbd", { children: "\u2318" }), " + ", (0, jsx_runtime_1.jsx)("kbd", { children: "\u21B5" }), " \u043F\u0435\u0440\u0435\u0432\u043E\u0434"] }), (0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("kbd", { children: "\u2325" }), " + ", (0, jsx_runtime_1.jsx)("kbd", { children: "L" }), " \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u00B7 ", (0, jsx_runtime_1.jsx)("kbd", { children: "Esc" }), " \u0437\u0430\u043A\u0440\u044B\u0442\u044C"] })] })] }) : (0, jsx_runtime_1.jsxs)("main", { className: "lp-history-screen", children: [(0, jsx_runtime_1.jsxs)("div", { className: "lp-history-head", children: [(0, jsx_runtime_1.jsx)("button", { className: "lp-icon-button", onClick: () => setScreen("translate"), title: "\u041D\u0430\u0437\u0430\u0434", children: (0, jsx_runtime_1.jsx)(Icon, { name: "back" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { children: "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u043E\u0432" }), (0, jsx_runtime_1.jsxs)("span", { children: [history.length, " \u0438\u0437 500 \u0437\u0430\u043F\u0438\u0441\u0435\u0439"] })] }), (0, jsx_runtime_1.jsx)("button", { className: "lp-icon-button", title: "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u0438\u0441\u0442\u043E\u0440\u0438\u044E", onClick: async () => { if (window.confirm("Удалить все переводы из истории?")) {
                                    await (0, storage_1.clearHistory)();
                                    setHistory([]);
                                } }, children: (0, jsx_runtime_1.jsx)(Icon, { name: "trash" }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "lp-search", children: [(0, jsx_runtime_1.jsx)(Icon, { name: "search", size: 17 }), (0, jsx_runtime_1.jsx)("input", { "aria-label": "\u041F\u043E\u0438\u0441\u043A \u0432 \u0438\u0441\u0442\u043E\u0440\u0438\u0438", placeholder: "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430\u043C", value: search, onChange: e => setSearch(e.target.value) })] }), (0, jsx_runtime_1.jsx)("div", { className: "lp-history-list", children: !shown.length ? (0, jsx_runtime_1.jsx)("div", { className: "lp-history-empty", children: search ? "Ничего не найдено" : "История пока пуста" }) : shown.map(item => (0, jsx_runtime_1.jsxs)("div", { className: "lp-history-item", children: [(0, jsx_runtime_1.jsxs)("button", { className: "lp-history-text", onClick: () => restore(item), title: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u0435\u0440\u0435\u0432\u043E\u0434", children: [(0, jsx_runtime_1.jsxs)("span", { className: "lp-history-date", children: [new Date(item.timestamp).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }), " \u00B7 ", item.sourceLanguage.toUpperCase(), " \u2192 ", item.targetLanguage.toUpperCase()] }), (0, jsx_runtime_1.jsx)("strong", { children: item.originalText }), (0, jsx_runtime_1.jsx)("span", { children: item.translation })] }), (0, jsx_runtime_1.jsxs)("div", { className: "lp-history-actions", children: [(0, jsx_runtime_1.jsx)("button", { className: item.favorite ? "favorite" : "", title: item.favorite ? "Убрать из избранного" : "В избранное", onClick: () => toggleFavorite(item), children: (0, jsx_runtime_1.jsx)(Icon, { name: "star", size: 16 }) }), (0, jsx_runtime_1.jsx)("button", { title: "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C", onClick: () => copy(item.translation), children: (0, jsx_runtime_1.jsx)(Icon, { name: "copy", size: 16 }) }), (0, jsx_runtime_1.jsx)("button", { title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C", onClick: () => remove(item.id), children: (0, jsx_runtime_1.jsx)(Icon, { name: "trash", size: 16 }) })] })] }, item.id)) })] })] });
}

},
"src/popup/popup":function(module,exports,require){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const client_1 = require("react-dom/client");
const PopupApp_1 = __importDefault(require("./PopupApp"));

(0, client_1.createRoot)(document.getElementById("root")).render((0, jsx_runtime_1.jsx)(react_1.StrictMode, { children: (0, jsx_runtime_1.jsx)(PopupApp_1.default, {}) }));

}};
const __EXTERNAL={"react":__React,"react/jsx-runtime":__JSX,"react-dom/client":__ReactDOM};
const __cache=Object.create(null);function __normalize(s){const out=[];for(const p of s.split('/')){if(!p||p==='.')continue;if(p==='..')out.pop();else out.push(p)}return out.join('/').replace(/\.(js|ts|tsx)$/,'')}function __load(id){id=__normalize(id);if(__cache[id])return __cache[id].exports;const factory=__modules[id];if(!factory)throw Error('Missing module '+id);const module={exports:{}};__cache[id]=module;const base=id.includes('/')?id.slice(0,id.lastIndexOf('/')):'';const require=(spec)=>spec.startsWith('.')?__load(base+'/'+spec):external(spec);factory(module,module.exports,require);return module.exports}function external(s){if(s in __EXTERNAL)return __EXTERNAL[s];if(false)return __externalContent(s);throw Error('External dependency missing: '+s)};
__load("src/popup/popup");
