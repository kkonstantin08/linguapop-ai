(() => {
  const LOG_KEY = "translationLogs";
  const MAX_LOGS = 500;
  const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
  let filter = "all";
  let logs = [];


  const PROVIDER_GUIDES = {
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
      note: "У Groq есть бесплатные лимиты. Если они исчерпаны, API вернёт 429 и LinguaPop переключится на fallback.",
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

  const MODEL_DESCRIPTIONS = {
    "mistral-small-latest": "Быстрый вариант для повседневного перевода. Обычно лучший баланс скорости и качества.",
    "mistral-medium-latest": "Качество выше, но ответ обычно медленнее, чем у Mistral Small.",
    "mistral-large-latest": "Наиболее качественный вариант из списка, но обычно самый медленный.",
    "openai/gpt-oss-20b": "≈1000 ток/с на Groq. Лучший вариант для мгновенного обычного перевода; reasoning снижен ради скорости.",
    "openai/gpt-oss-120b": "≈500 ток/с. Модель крупнее и обычно сильнее на сложном контексте, но медленнее 20B.",
    "qwen/qwen3.6-27b": "≈500 ток/с. Сильный мультиязычный вариант; reasoning отключён ради скорости. Preview-модель может меняться.",
    "gpt-oss-120b": "≈3000 ток/с на Cerebras. Большая модель с очень высокой скоростью; reasoning снижен ради задержки.",
    "zai-glm-4.7": "≈1000 ток/с. Сильный вариант для сложного контекста; reasoning отключён в LinguaPop ради быстрого перевода.",
  };

  const enhanceProviderPanel = () => {
    const panel = document.getElementById("panel-providers");
    if (!panel) return false;

    const providerSelect = panel.querySelector('select[aria-label="Активный провайдер ИИ"]');
    if (!providerSelect) return false;
    const provider = providerSelect.value;
    const guide = PROVIDER_GUIDES[provider];

    const keyTextarea = panel.querySelector('textarea[aria-label^="API ключи для"]');
    const keySection = keyTextarea?.closest("section");
    if (keySection) {
      let help = keySection.querySelector(".lp-provider-help");
      if (!guide) {
        if (help?.classList.contains("lp-provider-help-standalone")) help.remove();
      } else if (!help) {
        help = document.createElement("div");
        help.className = "lp-provider-help lp-provider-help-standalone";
        const title = document.createElement("div");
        title.className = "lp-provider-help-title";
        const list = document.createElement("ol");
        const note = document.createElement("div");
        note.className = "lp-provider-help-note";
        const link = document.createElement("a");
        link.className = "lp-provider-help-link";
        link.target = "_blank";
        link.rel = "noreferrer";
        help.append(title, list, note, link);
        const baseHelp = keySection.querySelector(".lp-help-text");
        if (baseHelp) baseHelp.insertAdjacentElement("afterend", help);
        else keySection.insertBefore(help, keySection.firstChild?.nextSibling || null);
      }

      if (
        guide &&
        help?.classList.contains("lp-provider-help-standalone") &&
        help.dataset.provider !== provider
      ) {
        help.querySelector(".lp-provider-help-title").textContent = guide.title;
        const list = help.querySelector("ol");
        list.replaceChildren();
        guide.steps.forEach((step) => {
          const li = document.createElement("li");
          li.textContent = step;
          list.append(li);
        });
        help.querySelector(".lp-provider-help-note").textContent = guide.note;
        const link = help.querySelector(".lp-provider-help-link");
        link.href = guide.url;
        link.textContent = `${guide.buttonLabel} ↗`;
        help.dataset.provider = provider;
      }
    }

    const modelSelect = panel.querySelector('select[aria-label="Модель нейросети"]');
    if (modelSelect) {
      const description = MODEL_DESCRIPTIONS[modelSelect.value] || "";
      let descriptionEl = modelSelect.parentElement?.querySelector(".lp-model-description");
      if (!description) {
        if (descriptionEl?.classList.contains("lp-model-description-standalone")) descriptionEl.remove();
      } else if (!descriptionEl) {
        descriptionEl = document.createElement("div");
        descriptionEl.className = "lp-model-description lp-model-description-standalone";
        modelSelect.insertAdjacentElement("afterend", descriptionEl);
      }
      if (
        descriptionEl?.classList.contains("lp-model-description-standalone") &&
        descriptionEl.textContent !== description
      ) {
        descriptionEl.textContent = description;
      }
    }

    return true;
  };

  const startProviderEnhancer = () => {
    enhanceProviderPanel();
    document.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement)) return;
      if (
        target.getAttribute("aria-label") === "Активный провайдер ИИ" ||
        target.getAttribute("aria-label") === "Модель нейросети"
      ) {
        setTimeout(enhanceProviderPanel, 0);
      }
    });
    const observer = new MutationObserver(() => enhanceProviderPanel());
    observer.observe(document.body, { childList: true, subtree: true });
  };

  const sourceLabel = (source) => ({
    cache: "Cache",
    api: "API нейросети",
    chrome_translator: "Chrome Translator",
    google_gtx: "Google GTX",
    mixed: "Смешанный fallback",
    error: "Ошибка",
  })[source] || source || "Неизвестно";

  const modeLabel = (mode) => ({
    word: "Слово",
    phrase: "Фраза",
    popup: "Popup",
    batch: "Страница",
  })[mode] || mode || "—";


  const filterLabel = (id) => ({
    all: "Все",
    api: "API",
    fallback: "Fallback",
    errors: "Ошибки",
    cache: "Cache",
  })[id] || id || "Все";

  const formatLogsForClipboard = (items, label) => {
    const lines = [
      "LinguaPop AI — логи переводов",
      `Фильтр: ${label}`,
      `Записей: ${items.length}`,
      "",
    ];

    items.forEach((item, index) => {
      lines.push(
        `#${index + 1} — ${new Date(Number(item.timestamp) || Date.now()).toLocaleString()}`,
        `Источник: ${sourceLabel(item.source)}`,
        `Режим: ${modeLabel(item.mode)}`,
        `Время: ${Number(item.totalMs) || 0} ms`,
        `Символов: ${Number(item.charCount) || 0}`,
      );
      if (item.provider) lines.push(`API: ${item.provider}`);
      if (item.model) lines.push(`Модель: ${item.model}`);
      lines.push(
        `LLM: ${Number(item.llmMs) || 0} ms`,
        `Fallback: ${Number(item.fallbackMs) || 0} ms`,
        `Cache: ${Number(item.cacheMs) || 0} ms`,
        `Путь: ${(Array.isArray(item.path) ? item.path : []).join(" → ") || "—"}`,
      );
      if (Array.isArray(item.errors) && item.errors.length > 0) {
        lines.push("Ошибки:");
        item.errors.forEach((error) => {
          const stage = error.stage || "error";
          const code = error.code || "unknown_error";
          const message = error.message && error.message !== error.code ? ` — ${error.message}` : "";
          lines.push(`- ${stage}: ${code}${message}`);
        });
      } else {
        lines.push("Ошибки: нет");
      }
      if (index < items.length - 1) lines.push("", "---", "");
    });

    return lines.join("\n");
  };

  const copyText = async (text) => {
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
    if (!copied) throw new Error("clipboard_copy_failed");
  };

  const prune = (items) => {
    const cutoff = Date.now() - RETENTION_MS;
    return (Array.isArray(items) ? items : [])
      .filter((item) => Number(item?.timestamp) >= cutoff)
      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
      .slice(0, MAX_LOGS);
  };

  const matchesFilter = (item) => {
    if (filter === "all") return true;
    if (filter === "api") return item.source === "api";
    if (filter === "cache") return item.source === "cache";
    if (filter === "errors") return item.source === "error" || (Array.isArray(item.errors) && item.errors.length > 0);
    return ["chrome_translator", "google_gtx", "mixed"].includes(item.source);
  };

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const render = (panel) => {
    const list = panel.querySelector(".lp-log-list");
    if (!list) return;
    list.replaceChildren();

    const visible = logs.filter(matchesFilter);
    const copyButton = panel.querySelector(".lp-log-copy-btn");
    if (copyButton) {
      copyButton.disabled = visible.length === 0;
      if (!copyButton.dataset.feedback) copyButton.textContent = `Скопировать (${visible.length})`;
    }
    if (visible.length === 0) {
      list.append(el("div", "lp-empty-state", "Для выбранного фильтра логов пока нет."));
      return;
    }

    for (const item of visible) {
      const card = el("div", `lp-log-item source-${item.source || "error"}`);
      const top = el("div", "lp-log-item-top");
      const badges = el("div", "lp-log-badges");
      badges.append(
        el("span", `lp-log-source source-${item.source || "error"}`, sourceLabel(item.source)),
        el("span", "lp-log-mode", modeLabel(item.mode)),
      );
      const date = el("span", "lp-log-date", new Date(Number(item.timestamp) || Date.now()).toLocaleString());
      top.append(badges, date);
      card.append(top);

      const grid = el("div", "lp-log-grid");
      const addMetric = (label, value) => {
        const span = el("span");
        const strong = el("strong", "", `${label}: `);
        span.append(strong, document.createTextNode(String(value)));
        grid.append(span);
      };
      addMetric("Время", `${Number(item.totalMs) || 0} ms`);
      addMetric("Символов", Number(item.charCount) || 0);
      if (item.provider) addMetric("API", item.provider);
      if (item.model) addMetric("Модель", item.model);
      addMetric("LLM", `${Number(item.llmMs) || 0} ms`);
      addMetric("Fallback", `${Number(item.fallbackMs) || 0} ms`);
      addMetric("Cache", `${Number(item.cacheMs) || 0} ms`);
      card.append(grid);

      const path = el("div", "lp-log-path");
      path.append(el("strong", "", "Путь: "), document.createTextNode((Array.isArray(item.path) ? item.path : []).join(" → ") || "—"));
      card.append(path);

      if (Array.isArray(item.errors) && item.errors.length > 0) {
        const errors = el("div", "lp-log-errors");
        item.errors.slice(0, 16).forEach((error) => {
          const row = el("div", "lp-log-error");
          row.append(el("strong", "", `${error.stage || "error"}: `));
          row.append(document.createTextNode(String(error.code || "unknown_error")));
          if (error.message && error.message !== error.code) {
            row.append(document.createTextNode(` — ${String(error.message)}`));
          }
          errors.append(row);
        });
        card.append(errors);
      }

      list.append(card);
    }
  };

  const loadLogs = async (panel) => {
    try {
      const result = await chrome.storage.local.get(LOG_KEY);
      logs = prune(result?.[LOG_KEY]);
      render(panel);
    } catch {
      logs = [];
      render(panel);
    }
  };

  const init = async () => {
    const tabs = document.querySelector(".lp-tabs");
    const card = document.querySelector(".lp-options-card");
    if (!tabs || !card) return false;
    if (document.getElementById("tab-logs")) return true;

    const tab = el("button", "", "Логи переводов");
    tab.id = "tab-logs";
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", "panel-logs");
    tab.setAttribute("aria-selected", "false");
    tabs.append(tab);

    const panel = el("div", "lp-tab-content lp-standalone-log-panel");
    panel.id = "panel-logs";
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", "tab-logs");
    panel.hidden = true;

    const section = el("section");
    const header = el("div", "lp-log-header");
    const headingBox = el("div");
    const heading = el("h2", "", "Логи переводов");
    heading.style.margin = "0";
    const help = el("div", "lp-help-text", "Хранятся локально: последние 500 записей, максимум 7 дней. Текст переводов и API-ключи в логи не записываются.");
    help.style.margin = "6px 0 0";
    headingBox.append(heading, help);
    const actions = el("div", "lp-log-header-actions");
    const copy = el("button", "lp-log-copy-btn", "Скопировать (0)");
    copy.setAttribute("aria-label", "Скопировать все логи выбранного фильтра");
    const clear = el("button", "lp-danger-btn", "Очистить логи");
    clear.setAttribute("aria-label", "Очистить логи переводов");
    actions.append(copy, clear);
    header.append(headingBox, actions);
    section.append(header);

    const filters = el("div", "lp-log-filters");
    filters.setAttribute("aria-label", "Фильтры логов");
    for (const [id, label] of [["all", "Все"], ["api", "API"], ["fallback", "Fallback"], ["errors", "Ошибки"], ["cache", "Cache"]]) {
      const button = el("button", id === filter ? "active" : "", label);
      button.dataset.filter = id;
      button.addEventListener("click", () => {
        filter = id;
        const copyButton = panel.querySelector(".lp-log-copy-btn");
        if (copyButton) delete copyButton.dataset.feedback;
        filters.querySelectorAll("button").forEach((node) => node.classList.toggle("active", node === button));
        render(panel);
      });
      filters.append(button);
    }
    section.append(filters, el("div", "lp-log-list"));
    panel.append(section);

    const saveRow = card.querySelector(".lp-save-row");
    if (saveRow) card.insertBefore(panel, saveRow);
    else card.append(panel);

    const hideLogPanel = () => {
      panel.hidden = true;
      tab.classList.remove("active");
      tab.setAttribute("aria-selected", "false");
    };

    tabs.querySelectorAll("button:not(#tab-logs)").forEach((button) => {
      button.addEventListener("click", () => {
        hideLogPanel();
        setTimeout(() => {
          card.querySelectorAll(".lp-tab-content:not(#panel-logs)").forEach((content) => {
            content.style.removeProperty("display");
          });
        }, 10);
      });
    });

    tab.addEventListener("click", async () => {
      tabs.querySelectorAll("button").forEach((button) => {
        button.classList.toggle("active", button === tab);
        button.setAttribute("aria-selected", button === tab ? "true" : "false");
      });
      card.querySelectorAll(".lp-tab-content:not(#panel-logs)").forEach((content) => {
        content.style.display = "none";
      });
      panel.hidden = false;
      await loadLogs(panel);
    });

    copy.addEventListener("click", async () => {
      const visible = logs.filter(matchesFilter);
      if (visible.length === 0) return;
      try {
        await copyText(formatLogsForClipboard(visible, filterLabel(filter)));
        copy.dataset.feedback = "1";
        copy.textContent = `Скопировано: ${visible.length}`;
        setTimeout(() => {
          delete copy.dataset.feedback;
          render(panel);
        }, 1800);
      } catch {
        copy.dataset.feedback = "1";
        copy.textContent = "Не удалось скопировать";
        setTimeout(() => {
          delete copy.dataset.feedback;
          render(panel);
        }, 2200);
      }
    });

    clear.addEventListener("click", async () => {
      if (!confirm("Очистить все логи переводов?")) return;
      await chrome.storage.local.remove(LOG_KEY);
      logs = [];
      render(panel);
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local" || !changes[LOG_KEY]) return;
      logs = prune(changes[LOG_KEY].newValue);
      render(panel);
    });

    await loadLogs(panel);
    return true;
  };

  const start = () => {
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts++;
      if (await init() || attempts >= 40) clearInterval(timer);
    }, 100);
  };

  const boot = () => {
    startProviderEnhancer();
    start();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
