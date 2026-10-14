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
"src/shared/cache":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedTranslation = getCachedTranslation;
exports.removeCachedTranslation = removeCachedTranslation;
exports.setCachedTranslation = setCachedTranslation;
exports.clearTranslationCache = clearTranslationCache;
const CACHE_PREFIX = "lp_cache_v2_";
const CACHE_INDEX_KEY = "lp_cache_index";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
const MAX_CACHE_ITEMS = 1000;
const CLEANUP_BATCH_SIZE = 50;
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return hash.toString(36);
}
function buildKey(text, mode, sourceLang, targetLang, tone) {
    const hash = hashString(text);
    const snippet = text
        .trim()
        .toLowerCase()
        .slice(0, 30)
        .replace(/[^a-z0-9а-яё]/gi, "");
    return `${mode}_${sourceLang || "auto"}_${targetLang || "default"}_${tone || "none"}_${snippet}_${hash}`;
}
async function getCachedTranslation(text, mode, sourceLang, targetLang, tone) {
    try {
        const key = CACHE_PREFIX + buildKey(text, mode, sourceLang, targetLang, tone);
        const result = await chrome.storage.local.get(key);
        const entry = result[key];
        if (!entry)
            return null;
        // Verify original text to avoid hash collisions
        if (entry.originalText !== undefined && entry.originalText !== text) {
            return null;
        }
        // Check expiration
        if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
            chrome.storage.local.remove(key).catch(() => { });
            return null;
        }
        return entry.result;
    }
    catch {
        return null;
    }
}
/** Remove an invalid hit so it cannot poison subsequent requests. */
async function removeCachedTranslation(text, mode, sourceLang, targetLang) {
    const key = CACHE_PREFIX + buildKey(text, mode, sourceLang, targetLang);
    try {
        await chrome.storage.local.remove(key);
    }
    catch { /* ignore */ }
}
async function _setCachedTranslation(text, mode, result, sourceLang, targetLang, tone) {
    try {
        const key = CACHE_PREFIX + buildKey(text, mode, sourceLang, targetLang, tone);
        const entry = {
            key,
            originalText: text,
            result,
            timestamp: Date.now(),
        };
        // Read only the LRU index to avoid loading the entire local storage into memory
        const indexResult = await chrome.storage.local.get(CACHE_INDEX_KEY);
        let index = Array.isArray(indexResult[CACHE_INDEX_KEY])
            ? indexResult[CACHE_INDEX_KEY]
            : [];
        // Move key to the end of LRU list
        const existingIndex = index.indexOf(key);
        if (existingIndex !== -1) {
            index.splice(existingIndex, 1);
        }
        index.push(key);
        let keysToRemove = [];
        if (index.length > MAX_CACHE_ITEMS + CLEANUP_BATCH_SIZE) {
            const excessCount = index.length - MAX_CACHE_ITEMS;
            keysToRemove = index.slice(0, excessCount);
            index = index.slice(excessCount);
        }
        const payload = {
            [key]: entry,
            [CACHE_INDEX_KEY]: index,
        };
        await chrome.storage.local.set(payload);
        if (keysToRemove.length > 0) {
            chrome.storage.local.remove(keysToRemove).catch(() => { });
        }
    }
    catch {
        // Silently fail if cache write fails
    }
}
async function setCachedTranslation(text, mode, result, sourceLang, targetLang, tone) {
    if (typeof navigator !== "undefined" && navigator.locks) {
        await navigator.locks.request("linguapop_cache_lock", async () => {
            await _setCachedTranslation(text, mode, result, sourceLang, targetLang, tone);
        });
    }
    else {
        await _setCachedTranslation(text, mode, result, sourceLang, targetLang, tone);
    }
}
async function _clearTranslationCache() {
    try {
        const indexResult = await chrome.storage.local.get(CACHE_INDEX_KEY);
        const index = Array.isArray(indexResult[CACHE_INDEX_KEY])
            ? indexResult[CACHE_INDEX_KEY]
            : [];
        const keysToRemove = new Set(index);
        keysToRemove.add(CACHE_INDEX_KEY);
        // Also sweep any remaining cache keys in storage to ensure full cleanup
        const all = await chrome.storage.local.get(null);
        for (const k of Object.keys(all)) {
            if (k.startsWith(CACHE_PREFIX)) {
                keysToRemove.add(k);
            }
        }
        if (keysToRemove.size > 0) {
            await chrome.storage.local.remove(Array.from(keysToRemove));
        }
    }
    catch {
        // Silently fail
    }
}
async function clearTranslationCache() {
    if (typeof navigator !== "undefined" && navigator.locks) {
        await navigator.locks.request("linguapop_cache_lock", async () => {
            await _clearTranslationCache();
        });
    }
    else {
        await _clearTranslationCache();
    }
}

},
"src/options/logExport":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTranslationLogsForClipboard = formatTranslationLogsForClipboard;
exports.writeLogsToClipboard = writeLogsToClipboard;
const SOURCE_LABELS = {
    cache: "Cache",
    api: "API нейросети",
    chrome_translator: "Chrome Translator",
    google_gtx: "Google GTX",
    mixed: "Смешанный fallback",
    error: "Ошибка",
};
const MODE_LABELS = {
    word: "Слово",
    phrase: "Фраза",
    popup: "Popup",
    batch: "Страница",
};
function formatTranslationLogsForClipboard(entries, filterLabel) {
    const lines = [
        "LinguaPop AI — логи переводов",
        `Фильтр: ${filterLabel}`,
        `Записей: ${entries.length}`,
        "",
    ];
    entries.forEach((item, index) => {
        lines.push(`#${index + 1} — ${new Date(Number(item.timestamp) || Date.now()).toLocaleString()}`, `Источник: ${SOURCE_LABELS[item.source] || item.source || "Неизвестно"}`, `Режим: ${MODE_LABELS[item.mode] || item.mode || "—"}`, `Время: ${Number(item.totalMs) || 0} ms`, `Символов: ${Number(item.charCount) || 0}`);
        if (item.provider)
            lines.push(`API: ${item.provider}`);
        if (item.model)
            lines.push(`Модель: ${item.model}`);
        lines.push(`LLM: ${Number(item.llmMs) || 0} ms`, `Fallback: ${Number(item.fallbackMs) || 0} ms`, `Cache: ${Number(item.cacheMs) || 0} ms`, `Путь: ${Array.isArray(item.path) && item.path.length ? item.path.join(" → ") : "—"}`);
        if (Array.isArray(item.errors) && item.errors.length > 0) {
            lines.push("Ошибки:");
            item.errors.forEach((error) => {
                const stage = error.stage || "error";
                const code = error.code || "unknown_error";
                const message = error.message && error.message !== code
                    ? ` — ${error.message}`
                    : "";
                lines.push(`- ${stage}: ${code}${message}`);
            });
        }
        else {
            lines.push("Ошибки: нет");
        }
        if (index < entries.length - 1)
            lines.push("", "---", "");
    });
    return lines.join("\n");
}
async function writeLogsToClipboard(entries, filterLabel) {
    const text = formatTranslationLogsForClipboard(entries, filterLabel);
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied)
        throw new Error("clipboard_copy_failed");
}

},
"src/shared/accent":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGACY_COLORS = exports.ACCENTS = void 0;
exports.resolveAccent = resolveAccent;
exports.accentForeground = accentForeground;
exports.accentHover = accentHover;
exports.accentFocusRing = accentFocusRing;
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
/** Derive hover and focus colors from the current accent, never from the old pink theme. */
function accentHover(color) {
    const hex = resolveAccent(color);
    const toHex = (value) => Math.round(value * 0.86).toString(16).padStart(2, "0");
    return "#" + [1, 3, 5].map((start) => toHex(parseInt(hex.slice(start, start + 2), 16))).join("");
}
function accentFocusRing(color) {
    const hex = resolveAccent(color);
    const rgb = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.2)`;
}
function applyAccent(color, el = document.documentElement) {
    el.style.setProperty("--lp-primary", resolveAccent(color));
    el.style.setProperty("--lp-primary-contrast", accentForeground(color));
    el.style.setProperty("--lp-primary-hover", accentHover(color));
    el.style.setProperty("--lp-focus-ring", accentFocusRing(color));
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
"src/options/OptionsApp":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = OptionsApp;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const storage_1 = require("../shared/storage");
const cache_1 = require("../shared/cache");
const logExport_1 = require("./logExport");
const accent_1 = require("../shared/accent");
const theme_1 = require("../shared/theme");
const constants_1 = require("../shared/constants");
function applyThemeClass(theme) { (0, theme_1.applyTheme)(theme); }
function applyAccentColor(color) { (0, accent_1.applyAccent)(color); }
function ThemeChoiceIcon({ theme }) {
    if (theme === "light") {
        return (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("circle", { cx: "12", cy: "12", r: "3.6" }), (0, jsx_runtime_1.jsx)("path", { d: "M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" })] });
    }
    if (theme === "dark") {
        return (0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: (0, jsx_runtime_1.jsx)("path", { d: "M20.5 14.2A8.7 8.7 0 0 1 9.8 3.5 8.7 8.7 0 1 0 20.5 14.2Z" }) });
    }
    return (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("rect", { x: "3", y: "4", width: "18", height: "13", rx: "2" }), (0, jsx_runtime_1.jsx)("path", { d: "M9 21h6m-3-4v4" })] });
}
const THEME_CHOICES = [
    { value: "light", label: "Светлая" },
    { value: "dark", label: "Тёмная" },
    { value: "system", label: "Системная" },
];
/** Native radios preserve arrow-key navigation and expose the selected mode to screen readers. */
function ThemeSegmentedControl({ name, title, value, onChange, }) {
    return (0, jsx_runtime_1.jsxs)("fieldset", { className: "lp-theme-choice-group", children: [(0, jsx_runtime_1.jsx)("legend", { className: "lp-theme-choice-title", children: title }), (0, jsx_runtime_1.jsxs)("div", { className: `lp-theme-segmented lp-theme-selected-${value}`, children: [(0, jsx_runtime_1.jsx)("div", { className: "lp-theme-selection-indicator", "aria-hidden": "true" }), THEME_CHOICES.map((choice) => ((0, jsx_runtime_1.jsxs)("label", { className: "lp-theme-choice", children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: name, value: choice.value, checked: value === choice.value, onChange: () => onChange(choice.value), "aria-label": `${title}: ${choice.label}` }), (0, jsx_runtime_1.jsxs)("span", { className: "lp-theme-choice-face", children: [(0, jsx_runtime_1.jsx)(ThemeChoiceIcon, { theme: choice.value }), (0, jsx_runtime_1.jsx)("span", { children: choice.label })] })] }, choice.value)))] })] });
}
const LOG_FILTER_LABELS = {
    all: "Все",
    api: "API",
    fallback: "Fallback",
    errors: "Ошибки",
    cache: "Cache",
};
function logSourceLabel(source) {
    switch (source) {
        case "cache": return "Cache";
        case "api": return "API нейросети";
        case "chrome_translator": return "Chrome Translator";
        case "google_gtx": return "Google GTX";
        case "mixed": return "Смешанный fallback";
        case "error": return "Ошибка";
    }
}
function logModeLabel(mode) {
    switch (mode) {
        case "word": return "Слово";
        case "phrase": return "Фраза";
        case "popup": return "Popup";
        case "batch": return "Страница";
    }
}
function OptionsApp() {
    const [activeTab, setActiveTab] = (0, react_1.useState)("providers");
    const [settings, setLocalSettings] = (0, react_1.useState)(null);
    const [excludedSitesText, setExcludedSitesText] = (0, react_1.useState)("");
    const excludedSitesTextRef = (0, react_1.useRef)(excludedSitesText);
    excludedSitesTextRef.current = excludedSitesText;
    const isEditingExcludedRef = (0, react_1.useRef)(false);
    const saveTimeoutRef = (0, react_1.useRef)(null);
    const pendingSettingsRef = (0, react_1.useRef)(null);
    // Key testing state
    const [keyStatuses, setKeyStatuses] = (0, react_1.useState)({});
    const [keyErrors, setKeyErrors] = (0, react_1.useState)({});
    const [translationLogs, setTranslationLogs] = (0, react_1.useState)([]);
    const [logFilter, setLogFilter] = (0, react_1.useState)("all");
    const [logCopyFeedback, setLogCopyFeedback] = (0, react_1.useState)(null);
    const [saved, setSaved] = (0, react_1.useState)(false);
    const [cacheCleared, setCacheCleared] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        (0, storage_1.getSettings)().then((s) => {
            setLocalSettings(s);
            setExcludedSitesText(s.excludedSites?.join("\n") || "");
            applyThemeClass(s.theme);
            applyAccentColor(s.accentColor);
        });
        (0, storage_1.getTranslationLogs)().then(setTranslationLogs);
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const themeHandler = () => {
            (0, storage_1.getSettings)().then((s) => applyThemeClass(s.theme));
        };
        mq.addEventListener("change", themeHandler);
        const storageListener = (changes, _areaName) => {
            if (changes.settings ||
                changes.providers ||
                changes.excludedSites ||
                changes.theme ||
                changes.overlayTheme ||
                changes.accentColor ||
                changes.activeProvider ||
                changes.llmEnabled ||
                changes.fallbackProvider ||
                changes.libreTranslateEndpoint ||
                changes.defaultTargetLanguage ||
                changes.fontSize ||
                changes.compactMode ||
                changes.showExamples) {
                (0, storage_1.getSettings)().then((s) => {
                    // Uncommitted edits take precedence over incoming storage updates.
                    const pending = pendingSettingsRef.current;
                    const view = pending ? { ...s, ...pending,
                        providers: pending.providers ? { ...s.providers, ...pending.providers } : s.providers } : s;
                    setLocalSettings(view);
                    if (!isEditingExcludedRef.current) {
                        setExcludedSitesText(s.excludedSites?.join("\n") || "");
                    }
                    applyThemeClass(view.theme);
                    applyAccentColor(view.accentColor);
                });
            }
            if (changes.translationLogs) {
                setTranslationLogs(changes.translationLogs.newValue || []);
            }
        };
        chrome.storage.onChanged.addListener(storageListener);
        const handleBeforeUnload = () => {
            if (isEditingExcludedRef.current) {
                const sites = excludedSitesTextRef.current
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean);
                if (pendingSettingsRef.current) {
                    pendingSettingsRef.current.excludedSites = sites;
                }
            }
            if (pendingSettingsRef.current) {
                (0, storage_1.setSettings)(pendingSettingsRef.current).catch(() => { });
                pendingSettingsRef.current = null;
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            mq.removeEventListener("change", themeHandler);
            chrome.storage.onChanged.removeListener(storageListener);
            window.removeEventListener("beforeunload", handleBeforeUnload);
            if (saveTimeoutRef.current)
                clearTimeout(saveTimeoutRef.current);
            if (pendingSettingsRef.current) {
                (0, storage_1.setSettings)(pendingSettingsRef.current).catch(() => { });
                pendingSettingsRef.current = null;
            }
        };
    }, []);
    const triggerSave = (0, react_1.useCallback)((patch) => {
        const previous = pendingSettingsRef.current || {};
        pendingSettingsRef.current = {
            ...previous,
            ...patch,
            ...(patch.providers ? { providers: { ...(previous.providers || {}), ...patch.providers } } : {}),
        };
        if (saveTimeoutRef.current)
            clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            const changes = pendingSettingsRef.current;
            if (!changes)
                return;
            try {
                await (0, storage_1.setSettings)(changes);
                if (pendingSettingsRef.current === changes)
                    pendingSettingsRef.current = null;
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }
            catch (error) {
                console.warn("LinguaPop settings save failed", error);
            }
        }, 600);
    }, []);
    const updateSetting = (0, react_1.useCallback)((key, value) => {
        setLocalSettings((prev) => {
            if (!prev)
                return prev;
            triggerSave({ [key]: value });
            return { ...prev, [key]: value };
        });
    }, [triggerSave]);
    const updateProviderSetting = (0, react_1.useCallback)((provider, key, value) => {
        setLocalSettings((prev) => {
            if (!prev)
                return prev;
            const updated = {
                ...prev,
                providers: {
                    ...prev.providers,
                    [provider]: { ...prev.providers[provider], [key]: value },
                },
            };
            triggerSave({ providers: { [provider]: updated.providers[provider] } });
            return updated;
        });
    }, [triggerSave]);
    const handleExcludedSitesBlur = (0, react_1.useCallback)(() => {
        isEditingExcludedRef.current = false;
        const sites = excludedSitesText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
        updateSetting("excludedSites", sites);
    }, [excludedSitesText, updateSetting]);
    const handleCheckKeys = (0, react_1.useCallback)(async () => {
        if (!settings)
            return;
        const provider = settings.activeProvider;
        const keys = settings.providers[provider].apiKeys
            .split(/[\n,]+/)
            .map((k) => k.trim())
            .filter(Boolean);
        if (keys.length === 0)
            return;
        const newStatuses = {};
        keys.forEach((k) => (newStatuses[k] = "checking"));
        setKeyStatuses(newStatuses);
        setKeyErrors({});
        for (const key of keys) {
            try {
                const response = await chrome.runtime.sendMessage({
                    type: "TEST_API_KEY",
                    data: {
                        provider,
                        apiKey: key,
                        model: settings.providers[provider].selectedModel,
                    },
                });
                if (response && response.success) {
                    setKeyStatuses((prev) => ({ ...prev, [key]: "valid" }));
                    setKeyErrors((prev) => {
                        const next = { ...prev };
                        delete next[key];
                        return next;
                    });
                }
                else {
                    const errorCode = response?.error;
                    const disposition = (0, constants_1.getApiKeyCheckDisposition)(errorCode);
                    setKeyStatuses((prev) => ({ ...prev, [key]: disposition }));
                    setKeyErrors((prev) => ({
                        ...prev,
                        [key]: (0, constants_1.formatApiKeyError)(errorCode),
                    }));
                }
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "network_error";
                const disposition = (0, constants_1.getApiKeyCheckDisposition)(message);
                setKeyStatuses((prev) => ({ ...prev, [key]: disposition }));
                setKeyErrors((prev) => ({
                    ...prev,
                    [key]: (0, constants_1.formatApiKeyError)(message),
                }));
            }
        }
    }, [settings]);
    const handleClearCache = (0, react_1.useCallback)(async () => {
        await (0, cache_1.clearTranslationCache)();
        setCacheCleared(true);
        setTimeout(() => setCacheCleared(false), 2000);
    }, []);
    const handleClearLogs = (0, react_1.useCallback)(async () => {
        if (confirm("Очистить все логи переводов?")) {
            await (0, storage_1.clearTranslationLogs)();
            setTranslationLogs([]);
        }
    }, []);
    const handleExport = (0, react_1.useCallback)(() => {
        if (!settings)
            return;
        const blob = new Blob([JSON.stringify(settings, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "linguapop-settings.json";
        a.click();
        URL.revokeObjectURL(url);
    }, [settings]);
    const handleImport = (0, react_1.useCallback)(async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result;
                const parsed = JSON.parse(text);
                if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                    throw new Error("Invalid format: root must be an object");
                }
                const validProviders = constants_1.PROVIDERS.map((provider) => provider.id);
                const sanitized = {};
                if (validProviders.includes(parsed.activeProvider)) {
                    sanitized.activeProvider = parsed.activeProvider;
                }
                if (parsed.providers && typeof parsed.providers === "object") {
                    sanitized.providers = {};
                    for (const p of validProviders) {
                        if (parsed.providers[p] && typeof parsed.providers[p] === "object") {
                            sanitized.providers[p] = {
                                apiKeys: typeof parsed.providers[p].apiKeys === "string"
                                    ? parsed.providers[p].apiKeys
                                    : "",
                                selectedModel: typeof parsed.providers[p].selectedModel === "string"
                                    ? parsed.providers[p].selectedModel
                                    : "",
                            };
                        }
                    }
                }
                if (parsed.defaultTargetLanguage === "ru" ||
                    parsed.defaultTargetLanguage === "en") {
                    sanitized.defaultTargetLanguage = parsed.defaultTargetLanguage;
                }
                if (typeof parsed.llmEnabled === "boolean") {
                    sanitized.llmEnabled = parsed.llmEnabled;
                }
                if (parsed.fallbackProvider === "none") {
                    sanitized.fallbackProvider = "none";
                }
                else if (["auto", "chrome_ai", "chrome", "libretranslate"].includes(parsed.fallbackProvider)) {
                    sanitized.fallbackProvider = "auto";
                }
                if (Array.isArray(parsed.excludedSites)) {
                    sanitized.excludedSites = parsed.excludedSites.filter((s) => typeof s === "string");
                }
                if (["light", "dark", "system"].includes(parsed.theme)) {
                    sanitized.theme = parsed.theme;
                }
                if (["light", "dark", "system"].includes(parsed.overlayTheme)) {
                    sanitized.overlayTheme = parsed.overlayTheme;
                }
                if (typeof parsed.accentColor === "string" && (accent_1.ACCENTS.some((c) => c[1] === parsed.accentColor) || /^#[\da-f]{6}$/i.test(parsed.accentColor) || ["pink", "blue", "green", "purple", "orange"].includes(parsed.accentColor))) {
                    sanitized.accentColor = parsed.accentColor;
                }
                if (["small", "medium", "large"].includes(parsed.fontSize))
                    sanitized.fontSize = parsed.fontSize;
                if (typeof parsed.compactMode === "boolean")
                    sanitized.compactMode = parsed.compactMode;
                if (typeof parsed.showExamples === "boolean")
                    sanitized.showExamples = parsed.showExamples;
                await (0, storage_1.setSettings)(sanitized);
                const updated = await (0, storage_1.getSettings)();
                setLocalSettings(updated);
                setExcludedSitesText(updated.excludedSites?.join("\n") || "");
                applyThemeClass(updated.theme);
                applyAccentColor(updated.accentColor);
                alert("Настройки успешно импортированы!");
            }
            catch (err) {
                console.error("[LinguaPop] Import error:", err);
                alert("Ошибка при импорте: файл повреждён или имеет неверный формат.");
            }
        };
        reader.readAsText(file);
        e.target.value = ""; // Reset input
    }, []);
    const filteredLogs = translationLogs.filter((item) => {
        if (logFilter === "all")
            return true;
        if (logFilter === "api")
            return item.source === "api";
        if (logFilter === "cache")
            return item.source === "cache";
        if (logFilter === "errors")
            return item.source === "error" || item.errors.length > 0;
        return ["chrome_translator", "google_gtx", "mixed"].includes(item.source);
    });
    const handleCopyLogs = (0, react_1.useCallback)(async () => {
        if (filteredLogs.length === 0)
            return;
        try {
            await (0, logExport_1.writeLogsToClipboard)(filteredLogs, LOG_FILTER_LABELS[logFilter]);
            setLogCopyFeedback(`Скопировано: ${filteredLogs.length}`);
            setTimeout(() => setLogCopyFeedback(null), 1800);
        }
        catch {
            setLogCopyFeedback("Не удалось скопировать");
            setTimeout(() => setLogCopyFeedback(null), 2200);
        }
    }, [filteredLogs, logFilter]);
    if (!settings)
        return null;
    const currentProviderConfig = settings.providers[settings.activeProvider] || {
        apiKeys: "",
        selectedModel: "",
    };
    const providerHelp = constants_1.PROVIDER_HELP[settings.activeProvider];
    const currentModel = (constants_1.MODELS[settings.activeProvider] || []).find((model) => model.id === currentProviderConfig.selectedModel);
    const currentModelDescription = currentModel && "description" in currentModel
        ? String(currentModel.description || "")
        : "";
    return ((0, jsx_runtime_1.jsx)("div", { className: "lp-options-page", children: (0, jsx_runtime_1.jsxs)("div", { className: "lp-options-card", style: { maxWidth: "800px" }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "lp-options-header", style: {
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "24px",
                    }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { style: { margin: 0, marginBottom: "4px" }, children: "LinguaPop AI \u2014 \u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438" }), (0, jsx_runtime_1.jsx)("div", { className: "lp-options-subtitle", style: { margin: 0 }, children: "\u0423\u043C\u043D\u044B\u0439 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0447\u0438\u043A \u0441 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u043C \u0432\u044B\u0431\u043E\u0440\u043E\u043C \u044F\u0437\u044B\u043A\u0430" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "lp-options-header-actions", style: { display: "flex", gap: "8px" }, children: [(0, jsx_runtime_1.jsx)("button", { className: "lp-btn", onClick: handleExport, "aria-label": "\u042D\u043A\u0441\u043F\u043E\u0440\u0442 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A", style: { padding: "6px 12px", fontSize: "13px" }, children: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442" }), (0, jsx_runtime_1.jsx)("button", { className: "lp-btn", onClick: () => document.getElementById("import-file")?.click(), "aria-label": "\u0418\u043C\u043F\u043E\u0440\u0442 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A", style: { padding: "6px 12px", fontSize: "13px" }, children: "\u0418\u043C\u043F\u043E\u0440\u0442" }), (0, jsx_runtime_1.jsx)("input", { type: "file", id: "import-file", "aria-label": "\u0424\u0430\u0439\u043B \u0434\u043B\u044F \u0438\u043C\u043F\u043E\u0440\u0442\u0430 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A", style: { display: "none" }, accept: ".json", onChange: handleImport })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "lp-tabs", role: "tablist", "aria-label": "\u0412\u043A\u043B\u0430\u0434\u043A\u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A", children: [(0, jsx_runtime_1.jsx)("button", { role: "tab", id: "tab-providers", "aria-controls": "panel-providers", "aria-selected": activeTab === "providers", className: activeTab === "providers" ? "active" : "", onClick: () => setActiveTab("providers"), children: "\u041F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440\u044B \u0418\u0418" }), (0, jsx_runtime_1.jsx)("button", { role: "tab", id: "tab-translation", "aria-controls": "panel-translation", "aria-selected": activeTab === "translation", className: activeTab === "translation" ? "active" : "", onClick: () => setActiveTab("translation"), children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430" }), (0, jsx_runtime_1.jsx)("button", { role: "tab", id: "tab-logs", "aria-controls": "panel-logs", "aria-selected": activeTab === "logs", className: activeTab === "logs" ? "active" : "", onClick: () => setActiveTab("logs"), children: "\u041B\u043E\u0433\u0438 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u043E\u0432" })] }), activeTab === "providers" && ((0, jsx_runtime_1.jsxs)("div", { className: "lp-tab-content", role: "tabpanel", id: "panel-providers", "aria-labelledby": "tab-providers", children: [(0, jsx_runtime_1.jsxs)("section", { children: [(0, jsx_runtime_1.jsx)("h2", { children: "\u0420\u0435\u0436\u0438\u043C \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430 (LLM)" }), (0, jsx_runtime_1.jsxs)("label", { className: "lp-switch-label", children: [(0, jsx_runtime_1.jsxs)("span", { className: "lp-switch", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", "aria-label": "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u043D\u0435\u0439\u0440\u043E\u0441\u0435\u0442\u0438 (LLM)", checked: settings.llmEnabled, onChange: (e) => updateSetting("llmEnabled", e.target.checked) }), (0, jsx_runtime_1.jsx)("span", { className: "lp-slider" })] }), (0, jsx_runtime_1.jsx)("span", { className: "lp-switch-text", children: settings.llmEnabled
                                                ? "Использовать нейросети (LLM)"
                                                : "LLM отключён" })] })] }), (0, jsx_runtime_1.jsxs)("section", { children: [(0, jsx_runtime_1.jsx)("h2", { children: "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0439 \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440" }), (0, jsx_runtime_1.jsx)("select", { "aria-label": "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0439 \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440 \u0418\u0418", value: settings.activeProvider, onChange: (e) => updateSetting("activeProvider", e.target.value), children: constants_1.PROVIDERS.map((p) => ((0, jsx_runtime_1.jsx)("option", { value: p.id, children: p.name }, p.id))) })] }), (0, jsx_runtime_1.jsxs)("section", { children: [(0, jsx_runtime_1.jsxs)("h2", { children: ["API \u043A\u043B\u044E\u0447\u0438 \u0434\u043B\u044F", " ", constants_1.PROVIDERS.find((p) => p.id === settings.activeProvider)
                                            ?.name] }), (0, jsx_runtime_1.jsx)("div", { className: "lp-help-text", children: "\u041C\u043E\u0436\u043D\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u043A\u043B\u044E\u0447\u0435\u0439 (\u043A\u0430\u0436\u0434\u044B\u0439 \u0441 \u043D\u043E\u0432\u043E\u0439 \u0441\u0442\u0440\u043E\u043A\u0438 \u0438\u043B\u0438 \u0447\u0435\u0440\u0435\u0437 \u0437\u0430\u043F\u044F\u0442\u0443\u044E)." }), providerHelp && ((0, jsx_runtime_1.jsxs)("div", { className: "lp-provider-help", "data-provider": settings.activeProvider, children: [(0, jsx_runtime_1.jsx)("div", { className: "lp-provider-help-title", children: providerHelp.title }), (0, jsx_runtime_1.jsx)("ol", { children: providerHelp.steps.map((step) => ((0, jsx_runtime_1.jsx)("li", { children: step }, step))) }), (0, jsx_runtime_1.jsx)("div", { className: "lp-provider-help-note", children: providerHelp.note }), (0, jsx_runtime_1.jsxs)("a", { className: "lp-provider-help-link", href: providerHelp.url, target: "_blank", rel: "noreferrer", children: [providerHelp.buttonLabel, " \u2197"] })] })), (0, jsx_runtime_1.jsxs)("div", { className: "lp-key-row", children: [(0, jsx_runtime_1.jsx)("textarea", { "aria-label": `API ключи для ${constants_1.PROVIDERS.find((p) => p.id === settings.activeProvider)?.name || settings.activeProvider}`, value: currentProviderConfig.apiKeys, onChange: (e) => updateProviderSetting(settings.activeProvider, "apiKeys", e.target.value), placeholder: "\u0412\u0441\u0442\u0430\u0432\u044C\u0442\u0435 API \u043A\u043B\u044E\u0447\u0438...", rows: 4 }), (0, jsx_runtime_1.jsx)("button", { "aria-label": "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C API \u043A\u043B\u044E\u0447\u0438", onClick: handleCheckKeys, children: "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u043A\u043B\u044E\u0447\u0438" })] }), (0, jsx_runtime_1.jsx)("div", { className: "lp-key-statuses", children: currentProviderConfig.apiKeys
                                        .split(/[\n,]+/)
                                        .map((k) => k.trim())
                                        .filter(Boolean)
                                        .map((key) => {
                                        const status = keyStatuses[key];
                                        const masked = key.length > 8
                                            ? key.slice(0, 4) + "..." + key.slice(-4)
                                            : "••••••••";
                                        return ((0, jsx_runtime_1.jsxs)("div", { className: `lp-status-item ${status || ""}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "lp-key-status-content", children: [(0, jsx_runtime_1.jsx)("span", { children: masked }), (status === "invalid" || status === "unknown") && keyErrors[key] && ((0, jsx_runtime_1.jsx)("span", { className: status === "invalid" ? "lp-key-error" : "lp-key-warning", children: keyErrors[key] }))] }), status === "checking" && ((0, jsx_runtime_1.jsx)("span", { className: "lp-badge checking", children: "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430..." })), status === "valid" && ((0, jsx_runtime_1.jsx)("span", { className: "lp-badge valid", children: "\u0420\u0430\u0431\u043E\u0442\u0430\u0435\u0442" })), status === "invalid" && ((0, jsx_runtime_1.jsx)("span", { className: "lp-badge invalid", children: "\u041A\u043B\u044E\u0447 \u043D\u0435\u0432\u0435\u0440\u0435\u043D" })), status === "unknown" && ((0, jsx_runtime_1.jsx)("span", { className: "lp-badge unknown", children: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C" }))] }, key));
                                    }) })] }), (0, jsx_runtime_1.jsxs)("section", { children: [(0, jsx_runtime_1.jsx)("h2", { children: "\u041C\u043E\u0434\u0435\u043B\u044C" }), (0, jsx_runtime_1.jsx)("select", { "aria-label": "\u041C\u043E\u0434\u0435\u043B\u044C \u043D\u0435\u0439\u0440\u043E\u0441\u0435\u0442\u0438", value: currentProviderConfig.selectedModel, onChange: (e) => updateProviderSetting(settings.activeProvider, "selectedModel", e.target.value), children: (constants_1.MODELS[settings.activeProvider] || []).map((m) => ((0, jsx_runtime_1.jsx)("option", { value: m.id, children: m.name }, m.id))) }), currentModelDescription && ((0, jsx_runtime_1.jsx)("div", { className: "lp-model-description", children: currentModelDescription }))] }), (0, jsx_runtime_1.jsxs)("section", { children: [(0, jsx_runtime_1.jsx)("h2", { children: "Fallback-\u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0447\u0438\u043A (\u0437\u0430\u043F\u0430\u0441\u043D\u043E\u0439)" }), (0, jsx_runtime_1.jsx)("div", { className: "lp-help-text", children: "\u0415\u0441\u043B\u0438 \u043E\u0441\u043D\u043E\u0432\u043D\u043E\u0439 LLM \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D, LinguaPop \u0441\u043D\u0430\u0447\u0430\u043B\u0430 \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0435\u0442 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0439 Chrome Translator. \u0415\u0441\u043B\u0438 \u043E\u043D \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D \u0438\u043B\u0438 \u043D\u0435 \u0443\u0441\u043F\u0435\u043B \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C\u0441\u044F, \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F Google GTX." }), (0, jsx_runtime_1.jsxs)("select", { "aria-label": "Fallback-\u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0447\u0438\u043A", value: settings.fallbackProvider, onChange: (e) => updateSetting("fallbackProvider", e.target.value), children: [constants_1.FALLBACK_PROVIDERS.map((p) => ((0, jsx_runtime_1.jsx)("option", { value: p.id, children: p.name }, p.id))), (0, jsx_runtime_1.jsx)("option", { value: "none", children: "\u041D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C fallback" })] })] })] })), activeTab === "translation" && ((0, jsx_runtime_1.jsxs)("div", { className: "lp-tab-content", role: "tabpanel", id: "panel-translation", "aria-labelledby": "tab-translation", children: [(0, jsx_runtime_1.jsxs)("section", { children: [(0, jsx_runtime_1.jsx)("h2", { children: "\u041D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430" }), (0, jsx_runtime_1.jsx)("p", { className: "lp-help-text", children: "\u041F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E \u044F\u0437\u044B\u043A \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u044F\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438: \u0440\u0443\u0441\u0441\u043A\u0438\u0439 \u2192 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0439; \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0439 \u0438 \u043E\u0441\u0442\u0430\u043B\u044C\u043D\u044B\u0435 \u044F\u0437\u044B\u043A\u0438 \u2192 \u0440\u0443\u0441\u0441\u043A\u0438\u0439. \u0412 popup \u043D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043C\u043E\u0436\u043D\u043E \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0442\u044C \u0432\u0440\u0443\u0447\u043D\u0443\u044E \u043D\u0430 \u0432\u0440\u0435\u043C\u044F \u043E\u0442\u043A\u0440\u044B\u0442\u043E\u0433\u043E \u043E\u043A\u043D\u0430." })] }), (0, jsx_runtime_1.jsxs)("section", { children: [(0, jsx_runtime_1.jsx)("h2", { children: "\u0422\u0435\u043C\u044B \u043E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u044F" }), (0, jsx_runtime_1.jsxs)("div", { className: "lp-theme-preferences", children: [(0, jsx_runtime_1.jsx)(ThemeSegmentedControl, { name: "popup-theme", title: "Popup \u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438", value: settings.theme, onChange: (value) => {
                                                updateSetting("theme", value);
                                                applyThemeClass(value);
                                            } }), (0, jsx_runtime_1.jsx)("div", { className: "lp-theme-section-divider", "aria-hidden": "true" }), (0, jsx_runtime_1.jsx)(ThemeSegmentedControl, { name: "overlay-theme", title: "\u041F\u043B\u0430\u0432\u0430\u044E\u0449\u0438\u0439 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0447\u0438\u043A \u043D\u0430 \u0441\u0430\u0439\u0442\u0430\u0445", value: settings.overlayTheme, onChange: (value) => updateSetting("overlayTheme", value) }), (0, jsx_runtime_1.jsx)("p", { className: "lp-help-text lp-theme-help", children: "\u0422\u0435\u043C\u044B \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u044E\u0442\u0441\u044F \u043D\u0435\u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E. \u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0442\u0435\u043B\u044C \u0432 popup \u043C\u0435\u043D\u044F\u0435\u0442 \u0442\u043E\u043B\u044C\u043A\u043E popup \u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438." })] })] }), (0, jsx_runtime_1.jsxs)("section", { children: [(0, jsx_runtime_1.jsx)("h2", { children: "\u0410\u043A\u0446\u0435\u043D\u0442\u043D\u044B\u0439 \u0446\u0432\u0435\u0442" }), (0, jsx_runtime_1.jsx)("p", { className: "lp-help-text", children: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0433\u043E\u0442\u043E\u0432\u044B\u0439 \u043E\u0442\u0442\u0435\u043D\u043E\u043A \u0438\u043B\u0438 \u0437\u0430\u0434\u0430\u0439\u0442\u0435 \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 HEX. \u041E\u0434\u0438\u043D \u0446\u0432\u0435\u0442 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F \u0432\u043E \u0432\u0441\u0435\u0445 \u043E\u043A\u043D\u0430\u0445 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0447\u0438\u043A\u0430." }), (0, jsx_runtime_1.jsx)("div", { className: "lp-accent-grid", children: accent_1.ACCENTS.map(([name, hex]) => ((0, jsx_runtime_1.jsx)("button", { type: "button", className: `lp-accent-swatch ${(0, accent_1.resolveAccent)(settings.accentColor) === hex ? "selected" : ""}`, title: name, "aria-label": `Выбрать цвет: ${name}`, style: { backgroundColor: hex }, onClick: () => { updateSetting("accentColor", hex); applyAccentColor(hex); } }, hex))) }), (0, jsx_runtime_1.jsxs)("div", { className: "lp-hex-control", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "accent-hex", children: "\u0421\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0446\u0432\u0435\u0442" }), (0, jsx_runtime_1.jsx)("input", { id: "accent-hex", type: "color", value: (0, accent_1.resolveAccent)(settings.accentColor), onChange: e => { updateSetting("accentColor", e.target.value); applyAccentColor(e.target.value); } }), (0, jsx_runtime_1.jsx)("input", { "aria-label": "HEX-\u043A\u043E\u0434", type: "text", maxLength: 7, defaultValue: (0, accent_1.resolveAccent)(settings.accentColor), onChange: e => { if (/^#[0-9a-f]{6}$/i.test(e.target.value)) {
                                                updateSetting("accentColor", e.target.value);
                                                applyAccentColor(e.target.value);
                                            } } }, (0, accent_1.resolveAccent)(settings.accentColor))] })] }), (0, jsx_runtime_1.jsxs)("section", { children: [(0, jsx_runtime_1.jsx)("h2", { children: "\u0420\u0430\u0437\u043C\u0435\u0440 \u0448\u0440\u0438\u0444\u0442\u0430" }), (0, jsx_runtime_1.jsxs)("select", { value: settings.fontSize, onChange: e => updateSetting("fontSize", e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "small", children: "\u041C\u0435\u043B\u043A\u0438\u0439" }), (0, jsx_runtime_1.jsx)("option", { value: "medium", children: "\u0421\u0442\u0430\u043D\u0434\u0430\u0440\u0442\u043D\u044B\u0439" }), (0, jsx_runtime_1.jsx)("option", { value: "large", children: "\u041A\u0440\u0443\u043F\u043D\u044B\u0439" })] })] }), (0, jsx_runtime_1.jsxs)("section", { className: "lp-display-toggles", "aria-label": "\u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043E\u0442\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F", children: [(0, jsx_runtime_1.jsxs)("label", { className: "lp-toggle-row", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: settings.compactMode, onChange: e => updateSetting("compactMode", e.target.checked) }), (0, jsx_runtime_1.jsx)("span", { children: "\u041A\u043E\u043C\u043F\u0430\u043A\u0442\u043D\u044B\u0439 \u0440\u0435\u0436\u0438\u043C" })] }), (0, jsx_runtime_1.jsxs)("label", { className: "lp-toggle-row", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: settings.showExamples, onChange: e => updateSetting("showExamples", e.target.checked) }), (0, jsx_runtime_1.jsx)("span", { children: "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u043F\u0440\u0438\u043C\u0435\u0440\u044B \u0443\u043F\u043E\u0442\u0440\u0435\u0431\u043B\u0435\u043D\u0438\u044F \u0441\u043B\u043E\u0432" })] })] }), (0, jsx_runtime_1.jsxs)("section", { children: [(0, jsx_runtime_1.jsx)("h2", { children: "\u041A\u044D\u0448 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u043E\u0432" }), (0, jsx_runtime_1.jsxs)("div", { className: "lp-key-row", children: [(0, jsx_runtime_1.jsx)("input", { type: "text", "aria-label": "\u0421\u0442\u0430\u0442\u0443\u0441 \u043A\u044D\u0448\u0430 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u043E\u0432", value: cacheCleared
                                                ? "Кэш очищен!"
                                                : "Кэш хранит переводы 24 часа", readOnly: true, style: { color: cacheCleared ? "#16a34a" : undefined } }), (0, jsx_runtime_1.jsx)("button", { "aria-label": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u043A\u044D\u0448 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u043E\u0432", onClick: handleClearCache, children: "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u043A\u044D\u0448" })] })] })] })), activeTab === "logs" && ((0, jsx_runtime_1.jsx)("div", { className: "lp-tab-content", role: "tabpanel", id: "panel-logs", "aria-labelledby": "tab-logs", children: (0, jsx_runtime_1.jsxs)("section", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "lp-log-header", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { style: { margin: 0 }, children: "\u041B\u043E\u0433\u0438 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u043E\u0432" }), (0, jsx_runtime_1.jsx)("div", { className: "lp-help-text", style: { margin: "6px 0 0" }, children: "\u0425\u0440\u0430\u043D\u044F\u0442\u0441\u044F \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E: \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 500 \u0437\u0430\u043F\u0438\u0441\u0435\u0439, \u043C\u0430\u043A\u0441\u0438\u043C\u0443\u043C 7 \u0434\u043D\u0435\u0439. \u0422\u0435\u043A\u0441\u0442 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u043E\u0432 \u0438 API-\u043A\u043B\u044E\u0447\u0438 \u0432 \u043B\u043E\u0433\u0438 \u043D\u0435 \u0437\u0430\u043F\u0438\u0441\u044B\u0432\u0430\u044E\u0442\u0441\u044F." })] }), (0, jsx_runtime_1.jsx)("button", { onClick: handleClearLogs, className: "lp-danger-btn", "aria-label": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u043B\u043E\u0433\u0438 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u043E\u0432", children: "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u043B\u043E\u0433\u0438" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "lp-log-toolbar", children: [(0, jsx_runtime_1.jsx)("div", { className: "lp-log-filters", "aria-label": "\u0424\u0438\u043B\u044C\u0442\u0440\u044B \u043B\u043E\u0433\u043E\u0432", children: Object.entries(LOG_FILTER_LABELS).map(([id, label]) => ((0, jsx_runtime_1.jsx)("button", { className: logFilter === id ? "active" : "", onClick: () => {
                                                setLogFilter(id);
                                                setLogCopyFeedback(null);
                                            }, children: label }, id))) }), (0, jsx_runtime_1.jsx)("button", { className: "lp-log-copy-btn", onClick: handleCopyLogs, disabled: filteredLogs.length === 0, "aria-label": `Скопировать все логи фильтра ${LOG_FILTER_LABELS[logFilter]}`, children: logCopyFeedback || `Скопировать (${filteredLogs.length})` })] }), (0, jsx_runtime_1.jsx)("div", { className: "lp-log-list", children: filteredLogs.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "lp-empty-state", children: "\u0414\u043B\u044F \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0433\u043E \u0444\u0438\u043B\u044C\u0442\u0440\u0430 \u043B\u043E\u0433\u043E\u0432 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442." })) : (filteredLogs.map((item) => ((0, jsx_runtime_1.jsxs)("div", { className: `lp-log-item source-${item.source}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "lp-log-item-top", children: [(0, jsx_runtime_1.jsxs)("div", { className: "lp-log-badges", children: [(0, jsx_runtime_1.jsx)("span", { className: `lp-log-source source-${item.source}`, children: logSourceLabel(item.source) }), (0, jsx_runtime_1.jsx)("span", { className: "lp-log-mode", children: logModeLabel(item.mode) })] }), (0, jsx_runtime_1.jsx)("span", { className: "lp-log-date", children: new Date(item.timestamp).toLocaleString() })] }), (0, jsx_runtime_1.jsxs)("div", { className: "lp-log-grid", children: [(0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "\u0412\u0440\u0435\u043C\u044F:" }), " ", item.totalMs, " ms"] }), (0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "\u0421\u0438\u043C\u0432\u043E\u043B\u043E\u0432:" }), " ", item.charCount] }), item.provider && ((0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "API:" }), " ", item.provider] })), item.model && ((0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "\u041C\u043E\u0434\u0435\u043B\u044C:" }), " ", item.model] })), (0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "LLM:" }), " ", item.llmMs, " ms"] }), (0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Fallback:" }), " ", item.fallbackMs, " ms"] }), (0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Cache:" }), " ", item.cacheMs, " ms"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "lp-log-path", children: [(0, jsx_runtime_1.jsx)("strong", { children: "\u041F\u0443\u0442\u044C:" }), " ", item.path.join(" → ")] }), item.errors.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "lp-log-errors", children: item.errors.map((error, index) => ((0, jsx_runtime_1.jsxs)("div", { className: "lp-log-error", children: [(0, jsx_runtime_1.jsxs)("strong", { children: [error.stage, ":"] }), " ", error.code, error.message && error.message !== error.code
                                                        ? ` — ${error.message}`
                                                        : ""] }, `${item.id}-error-${index}`))) }))] }, item.id)))) })] }) })), (0, jsx_runtime_1.jsx)("div", { className: "lp-save-row", style: { height: "36px", alignItems: "center" }, children: saved && ((0, jsx_runtime_1.jsx)("span", { style: { color: "#16a34a", fontWeight: 600 }, children: "\u2713 \u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E" })) })] }) }));
}

},
"src/options/options":function(module,exports,require){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const client_1 = require("react-dom/client");
const OptionsApp_1 = __importDefault(require("./OptionsApp"));

(0, client_1.createRoot)(document.getElementById("root")).render((0, jsx_runtime_1.jsx)(react_1.StrictMode, { children: (0, jsx_runtime_1.jsx)(OptionsApp_1.default, {}) }));

}};
const __EXTERNAL={"react":__React,"react/jsx-runtime":__JSX,"react-dom/client":__ReactDOM};
const __cache=Object.create(null);function __normalize(s){const out=[];for(const p of s.split('/')){if(!p||p==='.')continue;if(p==='..')out.pop();else out.push(p)}return out.join('/').replace(/\.(js|ts|tsx)$/,'')}function __load(id){id=__normalize(id);if(__cache[id])return __cache[id].exports;const factory=__modules[id];if(!factory)throw Error('Missing module '+id);const module={exports:{}};__cache[id]=module;const base=id.includes('/')?id.slice(0,id.lastIndexOf('/')):'';const require=(spec)=>spec.startsWith('.')?__load(base+'/'+spec):external(spec);factory(module,module.exports,require);return module.exports}function external(s){if(s in __EXTERNAL)return __EXTERNAL[s];if(false)return __externalContent(s);throw Error('External dependency missing: '+s)};
__load("src/options/options");
