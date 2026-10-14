(function(){const __modules={"src/shared/types":function(module,exports,require){
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
"src/shared/network":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchWithTimeout = fetchWithTimeout;
async function fetchWithTimeout(input, options = {}) {
    const { timeoutMs = 8000, signal: upstreamSignal, ...init } = options;
    const controller = new AbortController();
    let timedOut = false;
    const abortFromUpstream = () => {
        controller.abort(upstreamSignal?.reason);
    };
    if (upstreamSignal?.aborted) {
        abortFromUpstream();
    }
    else if (upstreamSignal) {
        upstreamSignal.addEventListener("abort", abortFromUpstream, { once: true });
    }
    const timer = timeoutMs > 0
        ? setTimeout(() => {
            timedOut = true;
            controller.abort();
        }, timeoutMs)
        : null;
    try {
        return await fetch(input, { ...init, signal: controller.signal });
    }
    catch (error) {
        if (upstreamSignal?.aborted) {
            throw new Error("request_aborted");
        }
        if (timedOut) {
            throw new Error("request_timeout");
        }
        if (controller.signal.aborted) {
            throw new Error("request_aborted");
        }
        const detail = error instanceof Error && error.message ? `: ${error.message}` : "";
        throw new Error(`network_error${detail}`);
    }
    finally {
        if (timer !== null) {
            clearTimeout(timer);
        }
        upstreamSignal?.removeEventListener("abort", abortFromUpstream);
    }
}

},
"src/shared/llm/providers":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectFastestMistralChatModel = selectFastestMistralChatModel;
exports.listMistralModels = listMistralModels;
exports.testMistralApiKey = testMistralApiKey;
exports.callMistral = callMistral;
exports.callGroq = callGroq;
exports.callCerebras = callCerebras;
exports.callOpenAI = callOpenAI;
exports.callAnthropic = callAnthropic;
exports.callGemini = callGemini;
const network_1 = require("../network");
function isModelAccessError(detail) {
    return /model.+not available|not available.+model|subscription tier|model.+access|access.+model/i.test(detail);
}
async function extractErrorMessage(response) {
    let detail = "";
    try {
        const json = await response.clone().json();
        if (json?.error?.message) {
            detail = json.error.message;
        }
        else if (typeof json?.error === "string") {
            detail = json.error;
        }
        else if (json?.message) {
            detail = json.message;
        }
        else if (Array.isArray(json?.detail)) {
            detail = json.detail.map((d) => d.msg || JSON.stringify(d)).join("; ");
        }
        else if (typeof json?.detail === "string") {
            detail = json.detail;
        }
    }
    catch {
        try {
            detail = await response.text();
        }
        catch { }
    }
    const suffix = detail ? `: ${detail}` : "";
    // A 403 from Mistral can mean the key is valid but the selected model is not
    // included in the current subscription. Do not mislabel that as a bad key.
    if ((response.status === 400 || response.status === 403) && isModelAccessError(detail)) {
        return `model_unavailable${suffix}`;
    }
    if (response.status === 401 || response.status === 403) {
        return `invalid_api_key${suffix}`;
    }
    if (response.status === 402) {
        return `payment_required${suffix}`;
    }
    if (response.status === 429) {
        return `rate_limit${suffix}`;
    }
    if (response.status === 400 || response.status === 404 || response.status === 422) {
        return `bad_request${suffix}`;
    }
    if (response.status === 408 || response.status === 504) {
        return `request_timeout${suffix}`;
    }
    if (response.status >= 500) {
        return `api_error${suffix}`;
    }
    return `network_error${suffix}`;
}
function providerFetch(input, init, options) {
    return (0, network_1.fetchWithTimeout)(input, {
        ...init,
        signal: options.signal,
        timeoutMs: options.timeoutMs ?? 8000,
    });
}
function modelMatches(card, model) {
    if (!model)
        return true;
    return (card.id === model ||
        card.root === model ||
        (Array.isArray(card.aliases) && card.aliases.includes(model)));
}
function modelSpeedScore(card) {
    const haystack = [card.id, card.root, ...(card.aliases || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    // Prefer the smallest chat-capable models for interactive translation.
    if (/ministral/.test(haystack) && /(?:^|[^0-9])3b(?:[^0-9]|$)/.test(haystack))
        return 0;
    if (/ministral/.test(haystack) && /(?:^|[^0-9])8b(?:[^0-9]|$)/.test(haystack))
        return 5;
    if (/mistral-small/.test(haystack))
        return 10;
    if (/ministral/.test(haystack))
        return 15;
    if (/mistral-medium/.test(haystack))
        return 30;
    if (/mistral-large/.test(haystack))
        return 40;
    return 50;
}
function selectFastestMistralChatModel(models) {
    return (models
        .filter((model) => Boolean(model?.id) &&
        model.archived !== true &&
        model.capabilities?.completion_chat === true)
        .sort((a, b) => modelSpeedScore(a) - modelSpeedScore(b))[0] || null);
}
async function listMistralModels(apiKey, options = {}) {
    const response = await (0, network_1.fetchWithTimeout)("https://api.mistral.ai/v1/models", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
        signal: options.signal,
        timeoutMs: options.timeoutMs ?? 8000,
    });
    if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
    }
    const data = await response.json();
    const models = Array.isArray(data) ? data : data?.data;
    return Array.isArray(models) ? models : [];
}
async function testMistralApiKey(apiKey, model, options = {}) {
    const models = await listMistralModels(apiKey, options);
    if (!model)
        return;
    const available = models.some((card) => card.archived !== true &&
        card.capabilities?.completion_chat === true &&
        modelMatches(card, model));
    if (!available) {
        const fallback = selectFastestMistralChatModel(models);
        const suffix = fallback ? `; available fast model: ${fallback.id}` : "";
        throw new Error(`model_unavailable: ${model} is not available for this API key${suffix}`);
    }
}
async function callMistral(options) {
    const response = await providerFetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${options.apiKey}`,
        },
        body: JSON.stringify({
            model: options.model,
            messages: [{ role: "user", content: options.prompt }],
            temperature: 0.1,
            max_tokens: options.maxTokens ?? 1024,
            response_format: { type: "json_object" },
        }),
    }, options);
    if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
}
function openAICompatibleResponseText(data) {
    return data?.choices?.[0]?.message?.content || "";
}
function speedReasoningOptions(provider, model) {
    if (provider === "groq") {
        if (model === "qwen/qwen3.6-27b")
            return { reasoning_effort: "none" };
        if (model === "openai/gpt-oss-20b" || model === "openai/gpt-oss-120b") {
            return { reasoning_effort: "low" };
        }
        return {};
    }
    if (model === "zai-glm-4.7")
        return { reasoning_effort: "none" };
    if (model === "gpt-oss-120b")
        return { reasoning_effort: "low" };
    return {};
}
async function callOpenAICompatibleProvider(provider, endpoint, options) {
    const response = await providerFetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${options.apiKey}`,
        },
        body: JSON.stringify({
            model: options.model,
            messages: [{ role: "user", content: options.prompt }],
            temperature: 0.1,
            max_completion_tokens: options.maxTokens ?? 1024,
            response_format: { type: "json_object" },
            ...speedReasoningOptions(provider, options.model),
        }),
    }, options);
    if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
    }
    return openAICompatibleResponseText(await response.json());
}
async function callGroq(options) {
    return callOpenAICompatibleProvider("groq", "https://api.groq.com/openai/v1/chat/completions", options);
}
async function callCerebras(options) {
    return callOpenAICompatibleProvider("cerebras", "https://api.cerebras.ai/v1/chat/completions", options);
}
async function callOpenAI(options) {
    const response = await providerFetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${options.apiKey}`,
        },
        body: JSON.stringify({
            model: options.model,
            messages: [{ role: "user", content: options.prompt }],
            temperature: 0.1,
            max_tokens: options.maxTokens ?? 1024,
            response_format: { type: "json_object" },
        }),
    }, options);
    if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
}
async function callAnthropic(options) {
    const response = await providerFetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": options.apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerously-allow-browser": "true",
        },
        body: JSON.stringify({
            model: options.model,
            max_tokens: options.maxTokens ?? 1024,
            messages: [{ role: "user", content: options.prompt }],
            temperature: 0.1,
        }),
    }, options);
    if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
    }
    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    return extractJsonFromMarkdown(text);
}
async function callGemini(options) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent`;
    const response = await providerFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": options.apiKey,
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: options.prompt }] }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: options.maxTokens ?? 1024,
                responseMimeType: "application/json",
            },
        }),
    }, options);
    if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
    }
    const data = await response.json();
    const candidate = data.candidates?.[0];
    if (!candidate) {
        if (data.promptFeedback?.blockReason) {
            throw new Error(`api_error: Gemini prompt blocked (${data.promptFeedback.blockReason})`);
        }
        throw new Error("api_error: No response candidate returned by Gemini");
    }
    if (candidate.finishReason &&
        candidate.finishReason !== "STOP" &&
        candidate.finishReason !== "MAX_TOKENS") {
        if (candidate.finishReason === "SAFETY") {
            throw new Error("api_error: Gemini response blocked by safety filters");
        }
        if (candidate.finishReason === "RECITATION") {
            throw new Error("api_error: Gemini response blocked due to recitation policy");
        }
        throw new Error(`api_error: Gemini candidate finish reason ${candidate.finishReason}`);
    }
    return candidate.content?.parts?.[0]?.text || "";
}
function extractJsonFromMarkdown(text) {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
        return match[1].trim();
    }
    return text.trim();
}

},
"src/shared/llm/client":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_KEY_TEST_TIMEOUT_MS = void 0;
exports.callLLM = callLLM;
exports.testApiKey = testApiKey;
const storage_1 = require("../storage");
const providers_1 = require("./providers");
const mistralResolvedModelCache = new Map();
function errorHasCode(error, code) {
    return error.message === code || error.message.startsWith(`${code}:`);
}
function traceErrorCode(error) {
    return (error.message.split(":", 1)[0] || "unknown_error").trim();
}
async function tracedProviderCall(provider, model, keyIndex, onTrace, operation) {
    const startedAt = Date.now();
    try {
        const result = await operation();
        onTrace?.({
            provider,
            model,
            keyIndex,
            status: "success",
            durationMs: Date.now() - startedAt,
        });
        return result;
    }
    catch (error) {
        const normalized = error instanceof Error ? error : new Error("unknown_error");
        onTrace?.({
            provider,
            model,
            keyIndex,
            status: "error",
            durationMs: Date.now() - startedAt,
            errorCode: traceErrorCode(normalized),
            errorMessage: normalized.message,
        });
        throw normalized;
    }
}
async function callProvider(provider, options) {
    switch (provider) {
        case "mistral":
            return (0, providers_1.callMistral)(options);
        case "groq":
            return (0, providers_1.callGroq)(options);
        case "cerebras":
            return (0, providers_1.callCerebras)(options);
        case "openai":
            return (0, providers_1.callOpenAI)(options);
        case "anthropic":
            return (0, providers_1.callAnthropic)(options);
        case "gemini":
            return (0, providers_1.callGemini)(options);
        default:
            throw new Error("unknown_provider");
    }
}
async function callMistralWithModelRecovery(callOptions, keyIndex, onTrace) {
    const cacheKey = `${callOptions.apiKey}\u0000${callOptions.model}`;
    const cachedModel = mistralResolvedModelCache.get(cacheKey);
    if (cachedModel && cachedModel !== callOptions.model) {
        try {
            return await tracedProviderCall("mistral", cachedModel, keyIndex, onTrace, () => (0, providers_1.callMistral)({ ...callOptions, model: cachedModel }));
        }
        catch (error) {
            const normalized = error instanceof Error ? error : new Error("unknown_error");
            if (!errorHasCode(normalized, "model_unavailable")) {
                throw normalized;
            }
            mistralResolvedModelCache.delete(cacheKey);
        }
    }
    try {
        return await tracedProviderCall("mistral", callOptions.model, keyIndex, onTrace, () => (0, providers_1.callMistral)(callOptions));
    }
    catch (error) {
        const normalized = error instanceof Error ? error : new Error("unknown_error");
        if (!errorHasCode(normalized, "model_unavailable")) {
            throw normalized;
        }
        const models = await (0, providers_1.listMistralModels)(callOptions.apiKey, {
            signal: callOptions.signal,
            timeoutMs: callOptions.timeoutMs,
        });
        const fallback = (0, providers_1.selectFastestMistralChatModel)(models);
        if (!fallback || fallback.id === callOptions.model) {
            throw normalized;
        }
        const result = await tracedProviderCall("mistral", fallback.id, keyIndex, onTrace, () => (0, providers_1.callMistral)({ ...callOptions, model: fallback.id }));
        mistralResolvedModelCache.set(cacheKey, fallback.id);
        return result;
    }
}
async function callLLM(prompt, options) {
    let activeProvider = options?.provider;
    let apiKeysStr = options?.apiKey?.trim();
    let selectedModel = options?.model;
    const hasExplicitProviderConfig = options?.provider !== undefined &&
        options?.apiKey !== undefined &&
        options?.model !== undefined;
    if (!hasExplicitProviderConfig) {
        const settings = await (0, storage_1.getSettings)();
        activeProvider ?? (activeProvider = settings.activeProvider);
        const providerConfig = settings.providers[activeProvider];
        if (options?.apiKey === undefined) {
            apiKeysStr = providerConfig?.apiKeys?.trim() || "";
        }
        if (options?.model === undefined) {
            selectedModel = providerConfig?.selectedModel || "";
        }
    }
    const apiKeys = (apiKeysStr || "")
        .split(/[\n,]+/)
        .map((key) => key.trim())
        .filter(Boolean);
    if (apiKeys.length === 0) {
        throw new Error("missing_api_key");
    }
    let lastError = null;
    for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
        const apiKey = apiKeys[keyIndex];
        if (options?.signal?.aborted) {
            throw new Error("request_aborted");
        }
        try {
            const callOptions = {
                apiKey,
                model: selectedModel || "",
                prompt,
                maxTokens: options?.maxTokens,
                signal: options?.signal,
                timeoutMs: options?.timeoutMs,
            };
            if (activeProvider === "mistral") {
                return await callMistralWithModelRecovery(callOptions, keyIndex, options?.onTrace);
            }
            return await tracedProviderCall(activeProvider, callOptions.model, keyIndex, options?.onTrace, () => callProvider(activeProvider, callOptions));
        }
        catch (error) {
            const normalized = error instanceof Error ? error : new Error("unknown_error");
            lastError = normalized;
            if (errorHasCode(normalized, "rate_limit") ||
                errorHasCode(normalized, "invalid_api_key") ||
                errorHasCode(normalized, "model_unavailable")) {
                continue;
            }
            throw normalized;
        }
    }
    throw lastError || new Error("unknown_error");
}
exports.API_KEY_TEST_TIMEOUT_MS = 20000;
async function testApiKey(provider, apiKey, model) {
    if (provider === "mistral") {
        await (0, providers_1.testMistralApiKey)(apiKey, model, { timeoutMs: exports.API_KEY_TEST_TIMEOUT_MS });
        return;
    }
    const prompt = 'Respond with JSON: {"status":"ok"}';
    await callLLM(prompt, {
        provider,
        apiKey,
        model,
        maxTokens: 64,
        timeoutMs: exports.API_KEY_TEST_TIMEOUT_MS,
    });
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
"src/shared/translation/formatting":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitMarkdownIntoSegments = splitMarkdownIntoSegments;
exports.containsMarkdownFormatting = containsMarkdownFormatting;
exports.preservesMarkdownFormatting = preservesMarkdownFormatting;
exports.restoreSingleSpanFormatting = restoreSingleSpanFormatting;
exports.translationSlots = translationSlots;
exports.stitchTranslatedSlots = stitchTranslatedSlots;
// Inline marks emitted by Turndown: bold, emphasis, strike, links, inline code.
// Leave code content alone and retain link destinations verbatim.
const INLINE_MARK = /(\*\*([^*\n]+(?:\*(?!\*)[^*\n]+)*)\*\*|__([^_\n]+)__|~~([^~\n]+)~~|\[([^\]\n]+)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+)\)|`([^`\n]+)`|(?<!\*)\*([^*\n]+)\*(?!\*)|(?<!\w)_([^_\n]+)_(?!\w))/g;
function splitPlainText(value) {
    const pieces = [];
    // Preserve headings, list markers, blockquotes, and exact line breaks.
    const lines = value.split(/(\r?\n)/);
    for (const line of lines) {
        if (!line)
            continue;
        if (/^\r?\n$/.test(line)) {
            pieces.push({ text: "", before: line, after: "", translate: false });
            continue;
        }
        const prefix = line.match(/^(\s{0,3}(?:#{1,6}\s+|>\s+|[-+*]\s+|\d+\.\s+))/)?.[0] || "";
        pieces.push({ text: line.slice(prefix.length), before: prefix, after: "", translate: true });
    }
    return pieces;
}
function splitMarkdownIntoSegments(markdown) {
    const segments = [];
    let offset = 0;
    for (const match of markdown.matchAll(INLINE_MARK)) {
        const index = match.index ?? offset;
        if (index > offset)
            segments.push(...splitPlainText(markdown.slice(offset, index)));
        const full = match[0];
        if (match[2] !== undefined)
            segments.push({ text: match[2], before: "**", after: "**", translate: true });
        else if (match[3] !== undefined)
            segments.push({ text: match[3], before: "__", after: "__", translate: true });
        else if (match[4] !== undefined)
            segments.push({ text: match[4], before: "~~", after: "~~", translate: true });
        else if (match[5] !== undefined)
            segments.push({ text: match[5], before: "[", after: `](${match[6]})`, translate: true });
        else if (match[7] !== undefined)
            segments.push({ text: match[7], before: "`", after: "`", translate: false });
        else if (match[8] !== undefined)
            segments.push({ text: match[8], before: "*", after: "*", translate: true });
        else if (match[9] !== undefined)
            segments.push({ text: match[9], before: "_", after: "_", translate: true });
        offset = index + full.length;
    }
    if (offset < markdown.length)
        segments.push(...splitPlainText(markdown.slice(offset)));
    return segments;
}
function containsMarkdownFormatting(text) {
    const segments = splitMarkdownIntoSegments(text);
    return segments.some((segment) => segment.before === "**" || segment.before === "__" || segment.before === "*" ||
        segment.before === "_" || segment.before === "~~" || segment.before === "[" ||
        segment.before === "`" || /^(?:#{1,6}\s|>\s|[-+*]\s|\d+\.\s)/.test(segment.before));
}
function markCounts(text) {
    const counts = new Map();
    const add = (name) => counts.set(name, (counts.get(name) || 0) + 1);
    for (const s of splitMarkdownIntoSegments(text)) {
        if (s.before === "**" || s.before === "__")
            add("bold");
        if (s.before === "*" || s.before === "_")
            add("italic");
        if (s.before === "~~")
            add("strike");
        if (s.before === "[")
            add("link");
        if (s.before === "`")
            add("code");
        if (/^#{1,6}\s/.test(s.before))
            add("heading");
        if (/^[-+*]\s|^\d+\.\s/.test(s.before))
            add("list");
    }
    return counts;
}
function preservesMarkdownFormatting(source, translated) {
    const expected = markCounts(source);
    if (!expected.size)
        return true;
    const actual = markCounts(translated);
    for (const [mark, count] of expected) {
        if ((actual.get(mark) || 0) < count)
            return false;
    }
    return true;
}
/** Safe exact repair when a source consists of one styled span. */
function restoreSingleSpanFormatting(source, translated) {
    const pieces = splitMarkdownIntoSegments(source).filter((segment) => segment.text.trim());
    if (pieces.length !== 1 || !pieces[0].before || !pieces[0].after)
        return null;
    const piece = pieces[0];
    if (piece.before === "`" || (piece.before !== "[" && !["**", "__", "*", "_", "~~"].includes(piece.before)))
        return null;
    return piece.before + translated.trim() + piece.after;
}
/** Split one formatted source into text slots for a *single* structured LLM call.
 * Formatting is reconstructed locally; model output never owns the Markdown marks.
 * Non-translatable code, newlines and punctuation remain byte-for-byte intact.
 */
function translationSlots(markdown) {
    return splitMarkdownIntoSegments(markdown)
        .filter((s) => s.translate && /[\p{L}\p{N}]/u.test(s.text))
        .map((s) => s.text.trim());
}
function stitchTranslatedSlots(markdown, values) {
    const segments = splitMarkdownIntoSegments(markdown);
    const slots = segments.filter((s) => s.translate && /[\p{L}\p{N}]/u.test(s.text));
    if (!Array.isArray(values) || !slots.length || values.length !== slots.length)
        return null;
    if (values.some((value) => typeof value !== "string" || !value.trim() ||
        /\*\*|~~|`|(?<!\*)\*(?!\*)|\[[^\]]+\]\([^)]+\)/u.test(value)))
        return null;
    let i = 0;
    return segments.map((segment) => {
        if (!segment.translate || !/[\p{L}\p{N}]/u.test(segment.text)) {
            return segment.before + segment.text + segment.after;
        }
        const trimmedTranslation = values[i++].trim();
        const white = segment.text.match(/^(\s*)([\s\S]*?)(\s*)$/u);
        return segment.before + (white?.[1] || "") + trimmedTranslation + (white?.[3] || "") + segment.after;
    }).join("") || null;
}

},
"src/shared/llm/prompts":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWordPrompt = buildWordPrompt;
exports.buildPhrasePrompt = buildPhrasePrompt;
exports.buildFormattedPhrasePrompt = buildFormattedPhrasePrompt;
exports.buildPopupPrompt = buildPopupPrompt;
exports.buildBatchPrompt = buildBatchPrompt;
const language_1 = require("../language");
const formatting_1 = require("../translation/formatting");
function buildWordPrompt(text, defaultTarget = "ru", sourceLang) {
    const detected = sourceLang && sourceLang !== "auto" ? sourceLang : (0, language_1.detectLanguage)(text);
    const target = defaultTarget;
    const targetName = (0, language_1.getLanguageName)(target);
    const sourceName = detected !== "unknown" ? (0, language_1.getLanguageName)(detected) : "";
    return `You are a precise multilingual dictionary and language expert. Translate the word ${JSON.stringify(text)} into ${targetName}${sourceName ? ` (source: ${sourceName})` : ""}.

Return ONLY a valid JSON object with this exact structure:
{
  "detectedLanguage": "${detected}",
  "targetLanguage": "${target}",
  "word": ${JSON.stringify(text)},
  "mainTranslation": "...",
  "alternatives": ["...", "..."],
  "partOfSpeech": "noun | verb | adjective | adverb | pronoun | preposition | conjunction | interjection | phrase | unknown",
  "pronunciation": "...",
  "shortExamples": [
    {
      "source": "...",
      "translation": "..."
    }
  ]
}

Rules:
- Provide 2-4 alternative translations.
- Part of speech must be accurate.
- Pronunciation: IPA or simple phonetic spelling.
- Include 1-2 short example sentences with translations.
- Be concise. Output ONLY the raw JSON object, no markdown wrappers and no explanations outside the JSON.`;
}
function buildPhrasePrompt(text, defaultTarget = "ru", sourceLang) {
    const detected = sourceLang && sourceLang !== "auto" ? sourceLang : (0, language_1.detectLanguage)(text);
    const target = defaultTarget;
    const targetName = (0, language_1.getLanguageName)(target);
    const sourceName = detected !== "unknown" ? (0, language_1.getLanguageName)(detected) : "";
    return `Translate the following text into ${targetName}${sourceName ? ` (from ${sourceName})` : ""}.

Text:
${JSON.stringify(text)}

Return ONLY a valid JSON object:
{
  "detectedLanguage": "${detected}",
  "targetLanguage": "${target}",
  "translation": "..."
}

Rules:
- Provide one natural, accurate translation into ${targetName}.
- Preserve the tone, meaning, quotes, code, and punctuation.
- If the text contains Markdown formatting (such as bold **, italic *, lists -), you MUST preserve the exact Markdown formatting.
- For paragraphs, use double newlines (escaped as \\n\\n in JSON).
- Return ONLY the JSON object. No explanations outside the JSON.`;
}
/** Translate only text slots. Markdown structure is kept by the client, never by the LLM. */
function buildFormattedPhrasePrompt(markdown, target, source) {
    const slots = (0, formatting_1.translationSlots)(markdown);
    return `Translate the following text from ${(0, language_1.getLanguageName)(source || "unknown")} into ${(0, language_1.getLanguageName)(target)}.
The text contains formatted spans. Preserve natural phrasing, but return translations ONLY for the numbered fragments below. The client will restore bold, italic, links, code and line breaks separately.

Full text (for context): ${JSON.stringify(markdown)}
Fragments (in order): ${JSON.stringify(slots)}

Output ONLY a JSON object of this exact shape:
{"translations":[${slots.map(() => '"..."').join(',')}]}

IMPORTANT:
- The translations array MUST contain exactly ${slots.length} strings, in the same order as the fragments.
- Translate each fragment to ${(0, language_1.getLanguageName)(target)}. Do not omit, combine or rearrange fragments.
- Return text WITHOUT Markdown formatting, surrounding punctuation, explanations or extra whitespace not present in the fragments.
- Preserve the meaning in the full sentence, including words outside the formatted spans.
- Do not translate URLs or code: those are not part of the fragments.
- Return strictly JSON, with no markdown code fence.`;
}
function buildPopupPrompt(text, sourceLang, targetLang) {
    const detected = (!sourceLang || sourceLang === "auto") ? (0, language_1.detectLanguage)(text) : sourceLang;
    const target = targetLang || (detected === "ru" ? "en" : "ru");
    const targetName = (0, language_1.getLanguageName)(target);
    const sourceName = detected !== "unknown" ? (0, language_1.getLanguageName)(detected) : "the original language";
    return `Translate the following text from ${sourceName} into ${targetName}.

Text:
${JSON.stringify(text)}

Return ONLY a valid JSON object:
{
  "detectedLanguage": "${detected}",
  "targetLanguage": "${target}",
  "translation": "..."
}

Rules:
- Provide one natural, accurate translation into ${targetName}.
- Preserve meaning, formatting, quotes, and punctuation.
- Return ONLY the JSON object without any other text.`;
}
function buildBatchPrompt(textArrayStr, defaultTarget = "ru") {
    const targetName = (0, language_1.getLanguageName)(defaultTarget);
    return `Translate each item of the following JSON array using automatic bidirectional language detection. Russian text must be translated into English. English and all other languages must be translated into Russian. For detected Russian use English; for all others use ${targetName}.

Input:
${textArrayStr}

Return ONLY a valid JSON object with this exact structure:
{
  "translations": ["...", "..."]
}

Rules:
- Detect the language of every string separately; do not reuse the language of a neighboring string.
- Translate Russian to English, and all other languages to Russian.
- Maintain the exact order and number of items in the array (very important).
- Return ONLY the raw JSON object. No explanations outside the JSON.`;
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
"src/shared/translation/fallback":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateWithChromeTranslator = translateWithChromeTranslator;
exports.translateWithFallback = translateWithFallback;
exports.translateWithGoogleGTX = translateWithGoogleGTX;
const network_1 = require("../network");
const policy_1 = require("./policy");
const formatting_1 = require("./formatting");
function errorCode(error, fallback) {
    const message = error instanceof Error ? error.message : String(error || fallback);
    return (message.split(":", 1)[0] || fallback).trim();
}
function throwIfAborted(signal) {
    if (signal?.aborted) {
        throw new Error("request_aborted");
    }
}
async function withBrowserDeadline(task, timeoutMs, signal) {
    throwIfAborted(signal);
    return await new Promise((resolve, reject) => {
        let settled = false;
        const finish = (fn) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            signal?.removeEventListener("abort", onAbort);
            fn();
        };
        const onAbort = () => finish(() => reject(new Error("request_aborted")));
        const timer = setTimeout(() => finish(() => reject(new Error("browser_translation_timeout"))), timeoutMs);
        signal?.addEventListener("abort", onAbort, { once: true });
        task.then((value) => finish(() => resolve(value)), (error) => finish(() => reject(error)));
    });
}
function normalizeLanguageCode(language) {
    const value = (language || "").trim();
    if (!value)
        return "";
    if (/^zh[-_]hant$/i.test(value))
        return "zh-Hant";
    return value.replace(/_/g, "-").split("-")[0].toLowerCase();
}
const translatorCache = new Map();
const MAX_TRANSLATOR_CACHE_ENTRIES = 8;
const LANGUAGE_DETECTION_TIMEOUT_MS = 1000;
const READY_TRANSLATOR_CREATE_TIMEOUT_MS = 2000;
const LOCAL_TRANSLATION_TIMEOUT_MS = 2000;
async function detectLanguageLocally(text, signal) {
    const i18n = globalThis.chrome?.i18n;
    if (!i18n || typeof i18n.detectLanguage !== "function")
        return null;
    try {
        throwIfAborted(signal);
        const result = await withBrowserDeadline(Promise.resolve(i18n.detectLanguage(text)), LANGUAGE_DETECTION_TIMEOUT_MS, signal);
        throwIfAborted(signal);
        const languages = Array.isArray(result?.languages) ? result.languages : [];
        if (languages.length === 0)
            return null;
        const best = [...languages]
            .filter((candidate) => candidate?.language)
            .sort((a, b) => Number(b?.percentage || 0) - Number(a?.percentage || 0))[0];
        return best?.language
            ? normalizeLanguageCode(String(best.language)) || null
            : null;
    }
    catch (error) {
        if (signal?.aborted ||
            (error instanceof Error && error.message === "request_aborted")) {
            throw new Error("request_aborted");
        }
        return null;
    }
}
function trimTranslatorCache() {
    while (translatorCache.size > MAX_TRANSLATOR_CACHE_ENTRIES) {
        const oldestKey = translatorCache.keys().next().value;
        if (!oldestKey)
            return;
        const entry = translatorCache.get(oldestKey);
        translatorCache.delete(oldestKey);
        void entry?.translatorPromise
            .then((translator) => {
            if (typeof translator?.destroy === "function") {
                try {
                    translator.destroy();
                }
                catch { }
            }
        })
            .catch(() => { });
    }
}
async function getReadyTranslator(TranslatorApi, sourceLanguage, targetLanguage, signal) {
    const key = `${sourceLanguage}->${targetLanguage}`;
    const cached = translatorCache.get(key);
    if (cached && cached.api === TranslatorApi) {
        // Refresh insertion order so the small cache behaves as an LRU.
        translatorCache.delete(key);
        translatorCache.set(key, cached);
        try {
            return await withBrowserDeadline(cached.translatorPromise, READY_TRANSLATOR_CREATE_TIMEOUT_MS, signal);
        }
        catch (error) {
            if (signal?.aborted ||
                (error instanceof Error && error.message === "request_aborted")) {
                throw new Error("request_aborted");
            }
            if (translatorCache.get(key) === cached)
                translatorCache.delete(key);
            return null;
        }
    }
    if (cached && cached.api !== TranslatorApi) {
        translatorCache.delete(key);
    }
    const options = { sourceLanguage, targetLanguage };
    try {
        if (typeof TranslatorApi.availability === "function") {
            const availability = await withBrowserDeadline(Promise.resolve(TranslatorApi.availability(options)), 1000, signal);
            // Interactive translation must never wait for a model/language-pack
            // download. Google GTX is faster for this request; Chrome can be used
            // automatically once the pack becomes available later.
            if (availability !== "available")
                return null;
        }
        const entry = {
            api: TranslatorApi,
            translatorPromise: Promise.resolve(TranslatorApi.create(options)),
        };
        translatorCache.set(key, entry);
        trimTranslatorCache();
        // Remove only real creation failures. If one caller aborts while the shared
        // creation promise continues, keep it cached for the next request.
        entry.translatorPromise.catch(() => {
            if (translatorCache.get(key) === entry)
                translatorCache.delete(key);
        });
        return await withBrowserDeadline(entry.translatorPromise, READY_TRANSLATOR_CREATE_TIMEOUT_MS, signal);
    }
    catch (error) {
        if (signal?.aborted ||
            (error instanceof Error && error.message === "request_aborted")) {
            throw new Error("request_aborted");
        }
        return null;
    }
}
function invalidateCachedTranslator(TranslatorApi, sourceLanguage, targetLanguage) {
    const key = `${sourceLanguage}->${targetLanguage}`;
    const entry = translatorCache.get(key);
    if (!entry || entry.api !== TranslatorApi)
        return;
    translatorCache.delete(key);
    void entry.translatorPromise
        .then((translator) => {
        if (typeof translator?.destroy === "function") {
            try {
                translator.destroy();
            }
            catch { }
        }
    })
        .catch(() => { });
}
/**
 * Must run in a document context (content script / extension page), not the
 * Manifest V3 service worker. The Translator API is unavailable in Web Workers.
 * Language detection uses chrome.i18n.detectLanguage(), which avoids creating a
 * separate built-in AI model for every short translation.
 */
async function translateWithChromeTranslator(text, sourceLanguage = "auto", targetLanguage = "ru", signal) {
    const TranslatorApi = globalThis.Translator;
    if (!TranslatorApi || typeof TranslatorApi.create !== "function")
        return null;
    throwIfAborted(signal);
    const target = normalizeLanguageCode(targetLanguage) || "ru";
    let source = normalizeLanguageCode(sourceLanguage);
    if (!source || source === "auto") {
        source =
            (await detectLanguageLocally(text, signal)) ||
                normalizeLanguageCode(String(globalThis.document?.documentElement?.lang || ""));
    }
    if (!source)
        return null;
    if (source === target) {
        return { translation: text, detectedLanguage: source };
    }
    const translator = await getReadyTranslator(TranslatorApi, source, target, signal);
    if (!translator || typeof translator.translate !== "function")
        return null;
    try {
        const translated = await withBrowserDeadline(Promise.resolve(translator.translate(text)), LOCAL_TRANSLATION_TIMEOUT_MS, signal);
        throwIfAborted(signal);
        const translation = typeof translated === "string" ? translated.trim() : "";
        return translation
            ? { translation, detectedLanguage: source }
            : null;
    }
    catch (error) {
        if (signal?.aborted ||
            (error instanceof Error && error.message === "request_aborted")) {
            throw new Error("request_aborted");
        }
        invalidateCachedTranslator(TranslatorApi, source, target);
        return null;
    }
}
function parseBatchInput(text) {
    try {
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed))
            return null;
        return parsed.map((item) => String(item));
    }
    catch {
        return null;
    }
}
async function translateBatchWithFallback(request, settings, signal, browserTranslate, trace) {
    const texts = parseBatchInput(request.text);
    if (!texts)
        throw new Error("bad_batch_input");
    if (texts.length === 0)
        return { translations: [] };
    const translations = new Array(texts.length).fill("");
    let nextIndex = 0;
    const workerCount = Math.min(4, texts.length);
    const worker = async () => {
        while (true) {
            throwIfAborted(signal);
            const index = nextIndex++;
            if (index >= texts.length)
                return;
            const itemRequest = {
                ...request,
                text: texts[index],
                mode: "phrase",
                ...(0, policy_1.resolveLanguagePair)({ text: texts[index], mode: "phrase" }),
            };
            try {
                const itemResult = await translateWithFallback(itemRequest, settings, signal, browserTranslate, trace);
                if ("translation" in itemResult) {
                    translations[index] = itemResult.translation || "";
                }
                else if ("mainTranslation" in itemResult) {
                    translations[index] = itemResult.mainTranslation || "";
                }
            }
            catch (error) {
                if (signal?.aborted ||
                    (error instanceof Error && error.message === "request_aborted")) {
                    throw new Error("request_aborted");
                }
                translations[index] = "";
            }
        }
    };
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return { translations };
}
function formatFallbackResult(request, translatedText, targetLang, detectedLang = "unknown") {
    if (request.mode === "word") {
        return {
            detectedLanguage: detectedLang,
            targetLanguage: targetLang,
            word: request.text,
            mainTranslation: translatedText,
            alternatives: [],
            partOfSpeech: "unknown",
            pronunciation: "",
            shortExamples: [],
        };
    }
    return {
        detectedLanguage: detectedLang,
        targetLanguage: targetLang,
        translation: translatedText,
    };
}
async function translateWithFallback(request, settings, signal, browserTranslate, trace) {
    throwIfAborted(signal);
    if (settings.fallbackProvider === "none") {
        throw new Error("llm_disabled_no_fallback");
    }
    if (request.mode === "batch") {
        return translateBatchWithFallback(request, settings, signal, browserTranslate, trace);
    }
    // Never pass Markdown markers to the fallback engines: they frequently
    // strip **bold**, *italic*, links, or list syntax. Translate the text pieces
    // individually, then reassemble the *unchanged* markup deterministically.
    if (request.mode === "phrase" && (0, formatting_1.containsMarkdownFormatting)(request.text)) {
        const segments = (0, formatting_1.splitMarkdownIntoSegments)(request.text);
        const translatable = segments
            .map((piece, index) => ({ piece, index }))
            .filter(({ piece }) => piece.translate && /[\p{L}\p{N}]/u.test(piece.text));
        if (translatable.length > 0 && translatable.length <= 64) {
            const pair = (0, policy_1.resolveLanguagePair)(request);
            const translatedPieces = new Array(segments.length).fill("");
            let cursor = 0;
            const workers = Array.from({ length: Math.min(3, translatable.length) }, async () => {
                while (cursor < translatable.length) {
                    throwIfAborted(signal);
                    const { piece, index } = translatable[cursor++];
                    const stripped = piece.text.trim();
                    const result = await translateWithFallback({ ...request, text: stripped, sourceLanguage: pair.sourceLanguage, targetLanguage: pair.targetLanguage }, settings, signal, browserTranslate, trace);
                    if (!("translation" in result) || !result.translation.trim()) {
                        throw new Error("formatted_translation_failed");
                    }
                    const whitespace = piece.text.match(/^(\s*)([\s\S]*?)(\s*)$/);
                    translatedPieces[index] = `${whitespace?.[1] || ""}${result.translation.trim()}${whitespace?.[3] || ""}`;
                }
            });
            await Promise.all(workers);
            return {
                detectedLanguage: pair.sourceLanguage,
                targetLanguage: pair.targetLanguage,
                translation: segments.map((piece, index) => piece.before + (piece.translate && /[\p{L}\p{N}]/u.test(piece.text) ? translatedPieces[index] : piece.text) + piece.after).join(""),
            };
        }
    }
    const pair = (0, policy_1.resolveLanguagePair)(request);
    const targetLang = pair.targetLanguage;
    const sourceLang = pair.sourceLanguage;
    // Preferred fallback: Chrome's local Translator API, executed in a document
    // context through a bridge supplied by the background service worker.
    if (browserTranslate) {
        const chromeStartedAt = Date.now();
        try {
            const localResult = await browserTranslate(request.text, sourceLang, targetLang, signal);
            if (localResult?.translation && (0, policy_1.isValidTranslation)(request.text, localResult.translation, targetLang)) {
                trace?.({
                    source: "chrome_translator",
                    status: "success",
                    durationMs: Date.now() - chromeStartedAt,
                });
                return formatFallbackResult(request, localResult.translation, targetLang, localResult.detectedLanguage ||
                    (sourceLang !== "auto" ? sourceLang : "unknown"));
            }
            trace?.({
                source: "chrome_translator",
                status: "miss",
                durationMs: Date.now() - chromeStartedAt,
                errorCode: "chrome_translator_unavailable",
            });
        }
        catch (error) {
            if (signal?.aborted ||
                (error instanceof Error && error.message === "request_aborted")) {
                throw new Error("request_aborted");
            }
            trace?.({
                source: "chrome_translator",
                status: "error",
                durationMs: Date.now() - chromeStartedAt,
                errorCode: errorCode(error, "chrome_translator_error"),
                errorMessage: error instanceof Error ? error.message : String(error),
            });
        }
    }
    else {
        trace?.({
            source: "chrome_translator",
            status: "miss",
            durationMs: 0,
            errorCode: "chrome_translator_bridge_unavailable",
        });
    }
    throwIfAborted(signal);
    // Final network fallback. This is intentionally used only after the local
    // browser translator is unavailable or fails.
    const gtxResult = await translateWithGoogleGTX(request.text, targetLang, sourceLang, signal, trace);
    if (gtxResult && (0, policy_1.isValidTranslation)(request.text, gtxResult.translation, targetLang)) {
        return formatFallbackResult(request, gtxResult.translation, targetLang, gtxResult.detectedLanguage);
    }
    throw new Error("llm_disabled_no_fallback");
}
async function translateWithGoogleGTX(text, targetLang, sourceLang = "auto", signal, trace) {
    const startedAt = Date.now();
    try {
        const sl = sourceLang && sourceLang !== "unknown" ? sourceLang : "auto";
        const tl = targetLang || "ru";
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await (0, network_1.fetchWithTimeout)(url, {
            signal,
            timeoutMs: 3000,
        });
        if (!response.ok) {
            trace?.({
                source: "google_gtx",
                status: "error",
                durationMs: Date.now() - startedAt,
                errorCode: `http_${response.status}`,
            });
            return null;
        }
        const data = await response.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
            const translation = data[0]
                .map((item) => (Array.isArray(item) ? item[0] : ""))
                .filter(Boolean)
                .join("");
            const detectedLanguage = typeof data[2] === "string"
                ? data[2]
                : sl !== "auto"
                    ? sl
                    : "unknown";
            if (translation) {
                trace?.({
                    source: "google_gtx",
                    status: "success",
                    durationMs: Date.now() - startedAt,
                });
                return { translation, detectedLanguage };
            }
            trace?.({
                source: "google_gtx",
                status: "error",
                durationMs: Date.now() - startedAt,
                errorCode: "empty_response",
            });
            return null;
        }
        trace?.({
            source: "google_gtx",
            status: "error",
            durationMs: Date.now() - startedAt,
            errorCode: "invalid_response",
        });
        return null;
    }
    catch (error) {
        if (signal?.aborted ||
            (error instanceof Error && error.message === "request_aborted")) {
            throw new Error("request_aborted");
        }
        trace?.({
            source: "google_gtx",
            status: "error",
            durationMs: Date.now() - startedAt,
            errorCode: errorCode(error, "google_gtx_error"),
            errorMessage: error instanceof Error ? error.message : String(error),
        });
        return null;
    }
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
"src/shared/translation/service":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmTimeoutForRequest = llmTimeoutForRequest;
exports.translate = translate;
const client_1 = require("../llm/client");
const prompts_1 = require("../llm/prompts");
const storage_1 = require("../storage");
const policy_1 = require("./policy");
const formatting_1 = require("./formatting");
const fallback_1 = require("./fallback");
const cache_1 = require("../cache");
function extractJsonFromResponse(raw) {
    if (!raw || typeof raw !== "string")
        return null;
    const trimmed = raw.trim();
    try {
        return JSON.parse(trimmed);
    }
    catch { }
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
        const blockContent = codeBlockMatch[1].trim();
        try {
            return JSON.parse(blockContent);
        }
        catch { }
        const innerMatch = blockContent.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (innerMatch) {
            try {
                return JSON.parse(innerMatch[0]);
            }
            catch { }
        }
    }
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
        try {
            return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
        }
        catch { }
    }
    const firstBracket = trimmed.indexOf("[");
    const lastBracket = trimmed.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket > firstBracket) {
        try {
            return JSON.parse(trimmed.slice(firstBracket, lastBracket + 1));
        }
        catch { }
    }
    return null;
}
function tokenBudgetForRequest(request) {
    switch (request.mode) {
        case "word":
            return 320;
        case "phrase":
        case "popup":
            return 512;
        case "batch":
            return Math.min(1200, Math.max(384, Math.ceil(request.text.length / 2)));
    }
}
function llmTimeoutForRequest(request) {
    switch (request.mode) {
        case "phrase":
        case "popup":
            return 3000;
        case "word":
            return 5000;
        case "batch":
            // Batch uses the local/network fallback chain by default. This limit only
            // applies when the user explicitly disables fallback and forces LLM mode.
            return 5000;
    }
}
function logTranslationTiming(request, timing) {
    if (timing.totalMs < 1000)
        return;
    console.debug(`[LinguaPop] timing mode=${request.mode} path=${timing.path} ` +
        `settings=${timing.settingsMs}ms cache=${timing.cacheMs}ms ` +
        `llm=${timing.llmMs}ms fallback=${timing.fallbackMs}ms total=${timing.totalMs}ms`);
}
function normalizeRawText(content) {
    let rawText = content.trim();
    const fenced = rawText.match(/^```(?:json|text)?\s*([\s\S]*?)\s*```$/i);
    if (fenced?.[1]) {
        rawText = fenced[1].trim();
    }
    rawText = rawText
        .replace(/^(?:translation|перевод|result|ответ):\s*/i, "")
        .trim();
    if ((rawText.startsWith('"') && rawText.endsWith('"')) ||
        (rawText.startsWith("'") && rawText.endsWith("'"))) {
        try {
            const parsed = JSON.parse(rawText);
            if (typeof parsed === "string")
                rawText = parsed;
        }
        catch {
            rawText = rawText.slice(1, -1);
        }
    }
    return rawText;
}
function buildRawResult(request, content, defaultTargetLanguage) {
    const rawText = normalizeRawText(content);
    const detectedLanguage = request.sourceLanguage && request.sourceLanguage !== "auto"
        ? request.sourceLanguage
        : "unknown";
    const targetLanguage = request.targetLanguage || defaultTargetLanguage;
    if (request.mode === "word") {
        return {
            detectedLanguage,
            targetLanguage,
            word: request.text,
            mainTranslation: rawText,
            alternatives: [],
            partOfSpeech: "unknown",
            pronunciation: "",
            shortExamples: [],
        };
    }
    if (request.mode === "batch") {
        const lines = rawText
            .split("\n")
            .map((line) => line.trim().replace(/^[-*•\d.)]+\s*/, ""))
            .filter(Boolean);
        return {
            translations: lines.length > 0 ? lines : [rawText],
        };
    }
    return {
        detectedLanguage,
        targetLanguage,
        translation: rawText,
    };
}
function parseStructuredResult(request, parsed, defaultTargetLanguage) {
    if (!parsed || typeof parsed !== "object")
        return null;
    if (request.mode === "word") {
        if (!("mainTranslation" in parsed) && !("translation" in parsed))
            return null;
        return {
            detectedLanguage: parsed.detectedLanguage ||
                (request.sourceLanguage && request.sourceLanguage !== "auto"
                    ? request.sourceLanguage
                    : "unknown"),
            targetLanguage: request.targetLanguage || defaultTargetLanguage,
            word: parsed.word || request.text,
            mainTranslation: parsed.mainTranslation || parsed.translation || "",
            alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : [],
            partOfSpeech: parsed.partOfSpeech || "unknown",
            pronunciation: parsed.pronunciation || "",
            shortExamples: Array.isArray(parsed.shortExamples) ? parsed.shortExamples : [],
        };
    }
    if (request.mode === "batch") {
        if (Array.isArray(parsed)) {
            return { translations: parsed.map(String) };
        }
        if (Array.isArray(parsed.translations)) {
            return {
                translations: parsed.translations.map(String),
            };
        }
        return null;
    }
    if (!("translation" in parsed) && !("mainTranslation" in parsed))
        return null;
    return {
        detectedLanguage: parsed.detectedLanguage ||
            (request.sourceLanguage && request.sourceLanguage !== "auto"
                ? request.sourceLanguage
                : "unknown"),
        targetLanguage: request.targetLanguage || defaultTargetLanguage,
        translation: parsed.translation || parsed.mainTranslation || "",
    };
}
function expectedBatchCount(request) {
    if (request.mode !== "batch")
        return null;
    try {
        const parsed = JSON.parse(request.text);
        return Array.isArray(parsed) ? parsed.length : null;
    }
    catch {
        return null;
    }
}
function batchResultHasExpectedCount(request, result) {
    if (request.mode !== "batch")
        return true;
    const expected = expectedBatchCount(request);
    if (expected === null || !("translations" in result))
        return false;
    return Array.isArray(result.translations) && result.translations.length === expected;
}
function cacheTranslationAsync(request, result) {
    if (!(0, policy_1.isValidResult)(request, result))
        return;
    if (request.mode === "phrase" && "translation" in result &&
        !(0, formatting_1.preservesMarkdownFormatting)(request.text, result.translation))
        return;
    void (0, cache_1.setCachedTranslation)(request.text, request.mode, result, request.sourceLanguage, request.targetLanguage);
}
function logId() {
    return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function errorCodeForLog(error, fallback = "unknown_error") {
    const message = error instanceof Error ? error.message : String(error || fallback);
    return (message.split(":", 1)[0] || fallback).trim();
}
function sanitizeLogMessage(message, settings) {
    let sanitized = String(message || "").slice(0, 300);
    for (const config of Object.values(settings.providers)) {
        for (const key of (config.apiKeys || "").split(/[\n,]+/).map((value) => value.trim()).filter(Boolean)) {
            sanitized = sanitized.split(key).join("[redacted]");
        }
    }
    return sanitized;
}
function addLogError(errors, stage, error, settings, fallbackCode) {
    const message = error instanceof Error ? error.message : String(error || fallbackCode || "unknown_error");
    errors.push({
        stage,
        code: errorCodeForLog(error, fallbackCode),
        message: sanitizeLogMessage(message, settings),
    });
}
function fallbackSourceFromTrace(trace) {
    const successful = Array.from(new Set(trace.filter((event) => event.status === "success").map((event) => event.source)));
    if (successful.length === 1)
        return successful[0];
    if (successful.length > 1)
        return "mixed";
    return "error";
}
function fallbackPathFromTrace(trace) {
    const path = [];
    for (const event of trace) {
        if (!path.includes(event.source))
            path.push(event.source);
    }
    return path;
}
function fallbackErrorsFromTrace(trace, settings) {
    const result = [];
    const seen = new Set();
    for (const event of trace) {
        if (event.status === "success")
            continue;
        const code = event.errorCode || `${event.source}_${event.status}`;
        const key = `${event.source}:${code}`;
        if (seen.has(key))
            continue;
        seen.add(key);
        result.push({
            stage: event.source,
            code,
            message: event.errorMessage ? sanitizeLogMessage(event.errorMessage, settings) : undefined,
        });
        if (result.length >= 12)
            break;
    }
    return result;
}
async function translate(request, options = {}) {
    // Resolve before cache lookup and before any translation provider is invoked.
    request = request.mode === "batch" ? { ...request, sourceLanguage: request.sourceLanguage || "auto", targetLanguage: request.targetLanguage || "ru" }
        : { ...request, ...(0, policy_1.resolveLanguagePair)(request) };
    const startedAt = Date.now();
    const settingsStartedAt = Date.now();
    const settings = await (0, storage_1.getSettings)();
    const settingsMs = Date.now() - settingsStartedAt;
    let cacheMs = 0;
    let llmMs = 0;
    let fallbackMs = 0;
    let timingPath = "unknown";
    let apiAttempted = false;
    let resolvedModel = "";
    const fallbackTrace = [];
    const logErrors = [];
    const traceFallback = (event) => fallbackTrace.push(event);
    const recordLog = (source) => {
        const fallbackPath = fallbackPathFromTrace(fallbackTrace);
        const path = apiAttempted
            ? [`api:${settings.activeProvider}`, ...fallbackPath]
            : source === "cache"
                ? ["cache"]
                : fallbackPath.length > 0
                    ? fallbackPath
                    : source === "error"
                        ? ["error"]
                        : [source];
        const combinedErrors = [...logErrors, ...fallbackErrorsFromTrace(fallbackTrace, settings)];
        const seenErrors = new Set();
        const errors = combinedErrors.filter((item) => {
            const key = `${item.stage}|${item.code}|${item.message || ""}`;
            if (seenErrors.has(key))
                return false;
            seenErrors.add(key);
            return true;
        }).slice(0, 16);
        const entry = {
            id: logId(),
            timestamp: Date.now(),
            mode: request.mode,
            source,
            ...(apiAttempted
                ? {
                    provider: settings.activeProvider,
                    model: resolvedModel || settings.providers[settings.activeProvider]?.selectedModel || "",
                }
                : {}),
            sourceLanguage: request.sourceLanguage,
            targetLanguage: request.targetLanguage || settings.defaultTargetLanguage,
            charCount: request.text.length,
            totalMs: Date.now() - startedAt,
            settingsMs,
            cacheMs,
            llmMs,
            fallbackMs,
            path,
            errors,
        };
        void (0, storage_1.addTranslationLog)(entry).catch(() => { });
    };
    if (options.signal?.aborted) {
        throw new Error("request_aborted");
    }
    const cacheStartedAt = Date.now();
    const cached = await (0, cache_1.getCachedTranslation)(request.text, request.mode, request.sourceLanguage, request.targetLanguage);
    cacheMs = Date.now() - cacheStartedAt;
    if (cached && (0, policy_1.isValidResult)(request, cached) &&
        (request.mode !== "phrase" ||
            ("translation" in cached && (0, formatting_1.preservesMarkdownFormatting)(request.text, cached.translation)))) {
        timingPath = "cache";
        recordLog("cache");
        logTranslationTiming(request, {
            settingsMs,
            cacheMs,
            llmMs,
            fallbackMs,
            totalMs: Date.now() - startedAt,
            path: timingPath,
        });
        return cached;
    }
    if (cached)
        void (0, cache_1.removeCachedTranslation)(request.text, request.mode, request.sourceLanguage, request.targetLanguage);
    // Full-page translation is latency-sensitive and needs only plain text. When
    // automatic fallback is enabled, skip the LLM entirely and use
    // Chrome Translator -> Google GTX. If fallback is explicitly disabled, keep
    // the old LLM behavior so page translation remains possible.
    if (request.mode === "batch" && settings.fallbackProvider !== "none") {
        const fallbackStartedAt = Date.now();
        try {
            const result = await (0, fallback_1.translateWithFallback)(request, settings, options.signal, options.browserTranslate, traceFallback);
            fallbackMs = Date.now() - fallbackStartedAt;
            timingPath = "page-fallback";
            if (!(0, policy_1.isValidResult)(request, result))
                throw new Error("incorrect_target_language");
            cacheTranslationAsync(request, result);
            recordLog(fallbackSourceFromTrace(fallbackTrace));
            logTranslationTiming(request, {
                settingsMs,
                cacheMs,
                llmMs,
                fallbackMs,
                totalMs: Date.now() - startedAt,
                path: timingPath,
            });
            return result;
        }
        catch (error) {
            fallbackMs = Date.now() - fallbackStartedAt;
            if (options.signal?.aborted ||
                (error instanceof Error && error.message === "request_aborted")) {
                throw new Error("request_aborted");
            }
            addLogError(logErrors, "translation", error, settings);
            recordLog("error");
            throw error;
        }
    }
    if (!settings.llmEnabled) {
        const fallbackStartedAt = Date.now();
        try {
            const result = await (0, fallback_1.translateWithFallback)(request, settings, options.signal, options.browserTranslate, traceFallback);
            fallbackMs = Date.now() - fallbackStartedAt;
            timingPath = "fallback-only";
            if (!(0, policy_1.isValidResult)(request, result))
                throw new Error("incorrect_target_language");
            cacheTranslationAsync(request, result);
            recordLog(fallbackSourceFromTrace(fallbackTrace));
            logTranslationTiming(request, {
                settingsMs,
                cacheMs,
                llmMs,
                fallbackMs,
                totalMs: Date.now() - startedAt,
                path: timingPath,
            });
            return result;
        }
        catch (error) {
            fallbackMs = Date.now() - fallbackStartedAt;
            if (options.signal?.aborted ||
                (error instanceof Error && error.message === "request_aborted")) {
                throw new Error("request_aborted");
            }
            addLogError(logErrors, "translation", error, settings);
            recordLog("error");
            throw error;
        }
    }
    const targetLang = request.targetLanguage || settings.defaultTargetLanguage;
    // Ordinary prose can be translated in a single string. Formatted selections
    // instead use structured slots so the model cannot erase presentation tags.
    const structuredFormatting = request.mode === "phrase" && (0, formatting_1.containsMarkdownFormatting)(request.text) &&
        (0, formatting_1.translationSlots)(request.text).length > 0 && (0, formatting_1.translationSlots)(request.text).length <= 64;
    const decodeLLM = (raw) => {
        const parsed = extractJsonFromResponse(raw);
        if (structuredFormatting) {
            const stitched = (0, formatting_1.stitchTranslatedSlots)(request.text, parsed?.translations);
            if (stitched && (0, formatting_1.preservesMarkdownFormatting)(request.text, stitched)) {
                return { detectedLanguage: request.sourceLanguage || "unknown",
                    targetLanguage: request.targetLanguage || settings.defaultTargetLanguage,
                    translation: stitched };
            }
        }
        return parseStructuredResult(request, parsed, settings.defaultTargetLanguage) ||
            buildRawResult(request, raw, settings.defaultTargetLanguage);
    };
    let prompt;
    if (request.mode === "word") {
        prompt = (0, prompts_1.buildWordPrompt)(request.text, targetLang, request.sourceLanguage);
    }
    else if (request.mode === "phrase") {
        prompt = structuredFormatting
            ? (0, prompts_1.buildFormattedPhrasePrompt)(request.text, targetLang, request.sourceLanguage)
            : (0, prompts_1.buildPhrasePrompt)(request.text, targetLang, request.sourceLanguage);
    }
    else if (request.mode === "batch") {
        prompt = (0, prompts_1.buildBatchPrompt)(request.text, targetLang);
    }
    else {
        prompt = (0, prompts_1.buildPopupPrompt)(request.text, request.sourceLanguage || "auto", targetLang);
    }
    let content = "";
    let result = null;
    let usedFallback = false;
    try {
        const providerConfig = settings.providers[settings.activeProvider];
        const llmStartedAt = Date.now();
        apiAttempted = true;
        try {
            content = await (0, client_1.callLLM)(prompt, {
                provider: settings.activeProvider,
                apiKey: providerConfig?.apiKeys || "",
                model: providerConfig?.selectedModel || "",
                maxTokens: tokenBudgetForRequest(request),
                timeoutMs: llmTimeoutForRequest(request),
                signal: options.signal,
                onTrace: (event) => {
                    if (event.status === "success") {
                        resolvedModel = event.model;
                        return;
                    }
                    logErrors.push({
                        stage: "llm",
                        code: event.errorCode || "unknown_error",
                        message: event.errorMessage
                            ? sanitizeLogMessage(event.errorMessage, settings)
                            : undefined,
                    });
                },
            });
        }
        finally {
            llmMs += Date.now() - llmStartedAt;
        }
        if (!content.trim()) {
            throw new Error("api_error: empty_response");
        }
        timingPath = "llm";
    }
    catch (error) {
        if (options.signal?.aborted ||
            (error instanceof Error && error.message === "request_aborted")) {
            throw new Error("request_aborted");
        }
        addLogError(logErrors, "llm", error, settings);
        try {
            const fallbackStartedAt = Date.now();
            try {
                result = await (0, fallback_1.translateWithFallback)(request, settings, options.signal, options.browserTranslate, traceFallback);
            }
            finally {
                fallbackMs += Date.now() - fallbackStartedAt;
            }
            usedFallback = true;
            timingPath = "llm->fallback";
        }
        catch {
            recordLog("error");
            throw error;
        }
    }
    if (!result) {
        result = decodeLLM(content);
    }
    if (request.mode !== "batch" && !usedFallback && !(0, policy_1.isValidResult)(request, result)) {
        logErrors.push({ stage: "validation", code: "incorrect_target_language" });
        const repairPrompt = `${prompt}\n\nIMPORTANT: The previous answer was in the wrong language. Return the translation strictly in ${request.targetLanguage}, not the original text. Only JSON.`;
        try {
            const config = settings.providers[settings.activeProvider];
            const retryStarted = Date.now();
            let repairedText = "";
            try {
                repairedText = await (0, client_1.callLLM)(repairPrompt, {
                    provider: settings.activeProvider, apiKey: config?.apiKeys || "",
                    model: config?.selectedModel || "", maxTokens: tokenBudgetForRequest(request),
                    timeoutMs: llmTimeoutForRequest(request), signal: options.signal,
                });
            }
            finally {
                llmMs += Date.now() - retryStarted;
            }
            const repaired = decodeLLM(repairedText);
            if (!(0, policy_1.isValidResult)(request, repaired))
                throw new Error("incorrect_target_language");
            result = repaired;
            timingPath = "llm-corrected";
        }
        catch (error) {
            if (options.signal?.aborted)
                throw new Error("request_aborted");
            addLogError(logErrors, "validation", error, settings);
            const fallbackStartedAt = Date.now();
            try {
                result = await (0, fallback_1.translateWithFallback)(request, settings, options.signal, options.browserTranslate, traceFallback);
                usedFallback = true;
                timingPath = "llm-invalid->fallback";
            }
            finally {
                fallbackMs += Date.now() - fallbackStartedAt;
            }
        }
    }
    // LLMs can silently drop Markdown even when the translated language is
    // correct. Repair once, then let the fallback preserve the source structure
    // by translating individual Markdown text segments. Do this before caching.
    if (request.mode === "phrase" && "translation" in result &&
        (0, formatting_1.containsMarkdownFormatting)(request.text) &&
        !(0, formatting_1.preservesMarkdownFormatting)(request.text, result.translation)) {
        const simpleRepair = (0, formatting_1.restoreSingleSpanFormatting)(request.text, result.translation);
        if (simpleRepair && (0, policy_1.isValidResult)(request, { ...result, translation: simpleRepair })) {
            result = { ...result, translation: simpleRepair };
            timingPath += "-format-wrapped";
        }
        else {
            logErrors.push({ stage: "formatting", code: "markdown_markup_lost" });
            try {
                const config = settings.providers[settings.activeProvider];
                const repairPrompt = `${prompt}\n\nCRITICAL: The previous translation lost bold/italic/links/Markdown structure. Translate the source again, keep ALL Markdown markers exactly and in their original order. Return only the required JSON.`;
                const retryStarted = Date.now();
                let corrected = "";
                try {
                    corrected = await (0, client_1.callLLM)(repairPrompt, {
                        provider: settings.activeProvider,
                        apiKey: config?.apiKeys || "",
                        model: config?.selectedModel || "",
                        maxTokens: tokenBudgetForRequest(request),
                        timeoutMs: llmTimeoutForRequest(request),
                        signal: options.signal,
                    });
                }
                finally {
                    llmMs += Date.now() - retryStarted;
                }
                const correctedResult = decodeLLM(corrected);
                if (!("translation" in correctedResult) ||
                    !(0, policy_1.isValidResult)(request, correctedResult) ||
                    !(0, formatting_1.preservesMarkdownFormatting)(request.text, correctedResult.translation)) {
                    throw new Error("markdown_markup_lost");
                }
                result = correctedResult;
                timingPath += "-format-repaired";
            }
            catch (error) {
                if (options.signal?.aborted)
                    throw new Error("request_aborted");
                addLogError(logErrors, "formatting", error, settings);
                const fallbackStartedAt = Date.now();
                try {
                    result = await (0, fallback_1.translateWithFallback)(request, settings, options.signal, options.browserTranslate, traceFallback);
                    usedFallback = true;
                    timingPath += "-format-fallback";
                }
                finally {
                    fallbackMs += Date.now() - fallbackStartedAt;
                }
            }
        }
    }
    // Batch translation must preserve a strict 1:1 mapping with DOM text nodes.
    // If the LLM returns fewer/more items, repair the batch through the exact-count
    // fallback path instead of letting the content script apply shifted results.
    if (request.mode === "batch" && !batchResultHasExpectedCount(request, result)) {
        logErrors.push({
            stage: "llm",
            code: "batch_count_mismatch",
            message: "LLM returned a batch with an unexpected item count",
        });
        const fallbackStartedAt = Date.now();
        try {
            result = await (0, fallback_1.translateWithFallback)(request, settings, options.signal, options.browserTranslate, traceFallback);
            usedFallback = true;
        }
        catch (error) {
            fallbackMs += Date.now() - fallbackStartedAt;
            if (options.signal?.aborted ||
                (error instanceof Error && error.message === "request_aborted")) {
                throw new Error("request_aborted");
            }
            addLogError(logErrors, "fallback", error, settings);
            recordLog("error");
            throw error;
        }
        fallbackMs += Date.now() - fallbackStartedAt;
        timingPath = "batch-repair-fallback";
    }
    if (request.mode === "phrase" && "translation" in result &&
        (0, formatting_1.containsMarkdownFormatting)(request.text) &&
        !(0, formatting_1.preservesMarkdownFormatting)(request.text, result.translation)) {
        recordLog("error");
        throw new Error("formatted_translation_failed");
    }
    if (!(0, policy_1.isValidResult)(request, result)) {
        addLogError(logErrors, "validation", "incorrect_target_language", settings);
        recordLog("error");
        throw new Error("incorrect_target_language");
    }
    cacheTranslationAsync(request, result);
    recordLog(usedFallback ? fallbackSourceFromTrace(fallbackTrace) : "api");
    logTranslationTiming(request, {
        settingsMs,
        cacheMs,
        llmMs,
        fallbackMs,
        totalMs: Date.now() - startedAt,
        path: timingPath,
    });
    return result;
}

},
"src/background/background":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const service_1 = require("../shared/translation/service");
const client_1 = require("../shared/llm/client");
const activeTranslationRequests = new Map();
async function awaitWithAbort(promise, signal) {
    if (!signal)
        return await promise;
    if (signal.aborted)
        throw new Error("request_aborted");
    return await new Promise((resolve, reject) => {
        let settled = false;
        const finish = (fn) => {
            if (settled)
                return;
            settled = true;
            signal.removeEventListener("abort", onAbort);
            fn();
        };
        const onAbort = () => finish(() => reject(new Error("request_aborted")));
        signal.addEventListener("abort", onAbort, { once: true });
        promise.then((value) => finish(() => resolve(value)), (error) => finish(() => reject(error)));
    });
}
async function translateWithChromeInDocument(sender, text, sourceLanguage, targetLanguage, signal) {
    if (signal?.aborted)
        throw new Error("request_aborted");
    let tabId = sender.tab?.id;
    let frameId = sender.tab?.id ? sender.frameId : undefined;
    if (tabId === undefined) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        tabId = tabs[0]?.id;
        frameId = undefined;
    }
    if (tabId === undefined)
        return null;
    try {
        const message = {
            type: "CHROME_TRANSLATOR_FALLBACK",
            data: { text, sourceLanguage, targetLanguage },
        };
        const responsePromise = frameId !== undefined
            ? chrome.tabs.sendMessage(tabId, message, { frameId })
            : chrome.tabs.sendMessage(tabId, message);
        const response = await awaitWithAbort(responsePromise, signal);
        if (response?.success && response.result?.translation) {
            return {
                translation: String(response.result.translation),
                detectedLanguage: String(response.result.detectedLanguage || sourceLanguage || "unknown"),
            };
        }
        return null;
    }
    catch (error) {
        if (signal?.aborted ||
            (error instanceof Error && error.message === "request_aborted")) {
            throw new Error("request_aborted");
        }
        return null;
    }
}
function translationRequestKey(sender, requestId) {
    return `${sender.tab?.id ?? "no-tab"}:${sender.frameId ?? 0}:${String(requestId)}`;
}
chrome.runtime.onInstalled.addListener(async () => {
    // Old Writing Assistant data and the previous translation cache are no longer compatible.
    try {
        const all = await chrome.storage.local.get(null);
        const staleKeys = Object.keys(all).filter((k) => k === "writingHistory" || k.startsWith("lp_cache_") && !k.startsWith("lp_cache_v2_"));
        if (staleKeys.length)
            await chrome.storage.local.remove(staleKeys);
        await chrome.storage.sync.remove(["assistantEnabled", "writingAssistantTargetLanguage"]);
    }
    catch (error) {
        console.warn("[LinguaPop] Migration cleanup failed", error);
    }
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: "translate-selection",
            title: "Перевести выделенное",
            contexts: ["selection"],
        });
        chrome.contextMenus.create({
            id: "translate-page",
            title: "Перевести страницу на русский (LinguaPop)",
            contexts: ["page"],
        });
        chrome.contextMenus.create({
            id: "restore-page",
            title: "Вернуть оригинал страницы",
            contexts: ["page"],
        });
    });
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "translate-selection" &&
        info.selectionText &&
        tab?.id) {
        chrome.tabs
            .sendMessage(tab.id, {
            type: "CONTEXT_MENU_TRANSLATE",
            text: info.selectionText,
        })
            .catch(() => {
            // Tab may not have content script loaded
        });
    }
    else if (info.menuItemId === "translate-page" && tab?.id) {
        chrome.tabs
            .sendMessage(tab.id, { type: "START_PAGE_TRANSLATION" })
            .catch(() => { });
    }
    else if (info.menuItemId === "restore-page" && tab?.id) {
        chrome.tabs
            .sendMessage(tab.id, { type: "RESTORE_PAGE" })
            .catch(() => { });
    }
});
// Handle keyboard shortcut commands
chrome.commands.onCommand.addListener((command, tab) => {
    if (command === "translate-selection" && tab?.id) {
        chrome.tabs
            .sendMessage(tab.id, { type: "KEYBOARD_SHORTCUT_TRANSLATE" })
            .catch(() => { });
    }
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "CANCEL_TRANSLATION" && request.requestId !== undefined) {
        const key = translationRequestKey(sender, request.requestId);
        activeTranslationRequests.get(key)?.abort();
        activeTranslationRequests.delete(key);
        sendResponse({ success: true });
        return false;
    }
    if (request.type === "TRANSLATE") {
        const req = request.data;
        const requestId = request.requestId;
        const key = requestId !== undefined ? translationRequestKey(sender, requestId) : null;
        const controller = new AbortController();
        if (key) {
            activeTranslationRequests.get(key)?.abort();
            activeTranslationRequests.set(key, controller);
        }
        (0, service_1.translate)(req, {
            signal: controller.signal,
            browserTranslate: (text, sourceLanguage, targetLanguage, signal) => translateWithChromeInDocument(sender, text, sourceLanguage, targetLanguage, signal),
        })
            .then((result) => sendResponse({ success: true, result }))
            .catch((error) => {
            if (error.message !== "request_aborted") {
                console.error("[LinguaPop] Translation error:", error.message);
            }
            sendResponse({ success: false, error: error.message });
        })
            .finally(() => {
            if (key && activeTranslationRequests.get(key) === controller) {
                activeTranslationRequests.delete(key);
            }
        });
        return true;
    }
    if (request.type === "TEST_API_KEY") {
        const { provider, apiKey, model } = request.data || {};
        (0, client_1.testApiKey)(provider, apiKey, model)
            .then(() => sendResponse({ success: true }))
            .catch((error) => {
            console.error("[LinguaPop] API key test error:", error.message);
            sendResponse({ success: false, error: error.message });
        });
        return true;
    }
    if (request.type === "TRANSLATE_PAGE") {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const tabId = tabs[0]?.id;
            if (tabId) {
                try {
                    await chrome.tabs.sendMessage(tabId, { type: "START_PAGE_TRANSLATION" });
                    sendResponse({ success: true });
                }
                catch (err) {
                    sendResponse({
                        success: false,
                        error: err?.message || "Failed to send message to tab",
                    });
                }
            }
            else {
                sendResponse({ success: false, error: "No active tab found" });
            }
        });
        return true;
    }
    if (request.type === "RESTORE_PAGE") {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const tabId = tabs[0]?.id;
            if (tabId) {
                try {
                    await chrome.tabs.sendMessage(tabId, { type: "RESTORE_PAGE" });
                    sendResponse({ success: true });
                }
                catch (err) {
                    sendResponse({
                        success: false,
                        error: err?.message || "Failed to send message to tab",
                    });
                }
            }
            else {
                sendResponse({ success: false, error: "No active tab found" });
            }
        });
        return true;
    }
    if (request.type === "FETCH_TTS") {
        const { url } = request;
        fetch(url, { referrerPolicy: "no-referrer" })
            .then(async (res) => {
            if (!res.ok) {
                throw new Error(`TTS HTTP error ${res.status}: ${res.statusText}`);
            }
            const contentType = res.headers.get("content-type") || "audio/mpeg";
            const buffer = await res.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            let binary = "";
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);
            const dataUrl = `data:${contentType};base64,${base64}`;
            sendResponse({ success: true, dataUrl, contentType, base64 });
        })
            .catch((err) => {
            console.error("[LinguaPop] TTS error:", err);
            sendResponse({
                success: false,
                error: err?.message || "TTS fetch failed",
            });
        });
        return true;
    }
    return false;
});

}};
const __EXTERNAL={};
const __cache=Object.create(null);function __normalize(s){const out=[];for(const p of s.split('/')){if(!p||p==='.')continue;if(p==='..')out.pop();else out.push(p)}return out.join('/').replace(/\.(js|ts|tsx)$/,'')}function __load(id){id=__normalize(id);if(__cache[id])return __cache[id].exports;const factory=__modules[id];if(!factory)throw Error('Missing module '+id);const module={exports:{}};__cache[id]=module;const base=id.includes('/')?id.slice(0,id.lastIndexOf('/')):'';const require=(spec)=>spec.startsWith('.')?__load(base+'/'+spec):external(spec);factory(module,module.exports,require);return module.exports}function external(s){if(s in __EXTERNAL)return __EXTERNAL[s];if(false)return __externalContent(s);throw Error('External dependency missing: '+s)};
__load("src/background/background");})();
