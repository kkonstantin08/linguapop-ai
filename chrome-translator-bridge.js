(() => {
  const translatorCache = new Map();
  const MAX_CACHE = 8;

  const normalizeLanguageCode = (language) => {
    const value = String(language || "").trim();
    if (!value) return "";
    if (/^zh[-_]hant$/i.test(value)) return "zh-Hant";
    return value.replace(/_/g, "-").split("-")[0].toLowerCase();
  };

  const withTimeout = (promise, timeoutMs) =>
    new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error("browser_translation_timeout"));
      }, timeoutMs);
      promise.then(
        (value) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          reject(error);
        },
      );
    });

  const detectLanguage = async (text) => {
    try {
      if (!chrome?.i18n?.detectLanguage) return null;
      const result = await withTimeout(chrome.i18n.detectLanguage(text), 1000);
      const languages = Array.isArray(result?.languages) ? result.languages : [];
      const best = [...languages]
        .filter((candidate) => candidate?.language)
        .sort((a, b) => Number(b?.percentage || 0) - Number(a?.percentage || 0))[0];
      return best?.language ? normalizeLanguageCode(best.language) : null;
    } catch {
      return null;
    }
  };

  const destroyEntry = (entry) => {
    entry?.promise?.then((translator) => {
      try { translator?.destroy?.(); } catch {}
    }).catch(() => {});
  };

  const trimCache = () => {
    while (translatorCache.size > MAX_CACHE) {
      const key = translatorCache.keys().next().value;
      if (!key) return;
      const entry = translatorCache.get(key);
      translatorCache.delete(key);
      destroyEntry(entry);
    }
  };

  const invalidate = (key, api) => {
    const entry = translatorCache.get(key);
    if (!entry || entry.api !== api) return;
    translatorCache.delete(key);
    destroyEntry(entry);
  };

  const getReadyTranslator = async (api, source, target) => {
    const key = `${source}->${target}`;
    const cached = translatorCache.get(key);
    if (cached?.api === api) {
      translatorCache.delete(key);
      translatorCache.set(key, cached);
      try {
        return await withTimeout(cached.promise, 2000);
      } catch {
        if (translatorCache.get(key) === cached) translatorCache.delete(key);
        return null;
      }
    }
    if (cached) translatorCache.delete(key);

    try {
      const options = { sourceLanguage: source, targetLanguage: target };
      if (typeof api.availability === "function") {
        const availability = await withTimeout(api.availability(options), 1000);
        if (availability !== "available") return null;
      }

      const entry = { api, promise: Promise.resolve(api.create(options)) };
      translatorCache.set(key, entry);
      trimCache();
      entry.promise.catch(() => {
        if (translatorCache.get(key) === entry) translatorCache.delete(key);
      });
      return await withTimeout(entry.promise, 2000);
    } catch {
      return null;
    }
  };

  const translateLocal = async (text, sourceLanguage, targetLanguage) => {
    const api = globalThis.Translator;
    if (!api || typeof api.create !== "function") return null;

    const target = normalizeLanguageCode(targetLanguage) || "ru";
    let source = normalizeLanguageCode(sourceLanguage);
    if (!source || source === "auto") {
      source =
        (await detectLanguage(text)) ||
        normalizeLanguageCode(document.documentElement?.lang || "");
    }
    if (!source) return null;
    if (source === target) return { translation: text, detectedLanguage: source };

    const key = `${source}->${target}`;
    const translator = await getReadyTranslator(api, source, target);
    if (!translator?.translate) return null;

    try {
      const translated = await withTimeout(Promise.resolve(translator.translate(text)), 2000);
      const translation = typeof translated === "string" ? translated.trim() : "";
      return translation ? { translation, detectedLanguage: source } : null;
    } catch {
      invalidate(key, api);
      return null;
    }
  };

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request?.type !== "CHROME_TRANSLATOR_FALLBACK") return false;
    const { text, sourceLanguage, targetLanguage } = request.data || {};
    translateLocal(
      String(text || ""),
      String(sourceLanguage || "auto"),
      String(targetLanguage || "ru"),
    )
      .then((result) => sendResponse({ success: Boolean(result), result }))
      .catch((error) =>
        sendResponse({ success: false, error: error?.message || "chrome_translator_error" }),
      );
    return true;
  });
})();
