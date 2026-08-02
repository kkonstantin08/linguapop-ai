import type {
  WordTranslationResult,
  PhraseTranslationResult,
} from "../shared/types";

import TurndownService from "turndown";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { getSettings } from "../shared/storage";

let currentAccentColor = "#df37a7";

function updateContentAccentColor() {
  getSettings().then(s => {
    const colorMap: Record<string, string> = {
      pink: "#df37a7",
      blue: "#3b82f6",
      green: "#10b981",
      purple: "#8b5cf6",
      orange: "#f97316"
    };
    currentAccentColor = colorMap[s.accentColor || "pink"];
    
    // Apply to shadow root host if it exists
    const host = document.getElementById("linguapop-host");
    if (host) {
      host.style.setProperty("--lp-primary", currentAccentColor);
    }

    // Apply to writing assistant FAB if it exists
    const fab = document.querySelector(".lp-fab") as HTMLElement;
    if (fab) {
      fab.style.setProperty("--lp-primary", currentAccentColor);
    }
  });
}

// Update color on init and when settings change
updateContentAccentColor();
chrome.storage.onChanged.addListener((changes) => {
  if (changes.settings) {
    updateContentAccentColor();
  }
});

const turndownService = new TurndownService({
  headingStyle: "atx",
  hr: "---",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*"
});

let currentAudioContext: AudioContext | null = null;
let currentAudioSource: AudioBufferSourceNode | null = null;

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function stopSpeaking(): void {
  if (currentAudioSource) {
    try {
      currentAudioSource.stop();
    } catch (e) {}
    currentAudioSource = null;
  }
  if (currentAudioContext) {
    currentAudioContext.close().catch(() => {});
    currentAudioContext = null;
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

async function speak(
  text: string,
  lang: "en" | "ru" | "unknown",
): Promise<void> {
  stopSpeaking();

  if (!text || lang === "unknown") return;

  const safeText = text.slice(0, 200);
  const targetLang = lang === "ru" ? "ru" : "en";
  
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
    safeText,
  )}&tl=${targetLang}&client=tw-ob`;

  try {
    const response = await new Promise<{ success: boolean; dataUrl?: string }>(
      (resolve) => {
        safeSendMessage(
          { type: "FETCH_TTS", url },
          (res) => resolve((res as any) || { success: false })
        );
      }
    );

    if (!response.success || !response.dataUrl) {
      throw new Error("TTS fetch returned false");
    }

    const base64 = response.dataUrl.split(',')[1];
    const arrayBuffer = base64ToArrayBuffer(base64);
    
    currentAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await currentAudioContext.decodeAudioData(arrayBuffer);
    
    currentAudioSource = currentAudioContext.createBufferSource();
    currentAudioSource.buffer = audioBuffer;
    currentAudioSource.connect(currentAudioContext.destination);
    currentAudioSource.start();

  } catch (error) {
    console.warn("[LinguaPop] Audio playback failed:", error);
    fallbackSpeak(text, targetLang);
  }
}

function fallbackSpeak(text: string, lang: "en" | "ru"): void {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  
  let preferredVoice = voices.find((v) => 
    v.lang.startsWith(lang === "ru" ? "ru" : "en") && 
    (v.name.includes("Google") || v.name.includes("Premium") || v.name.includes("Natural"))
  ) || voices.find((v) => v.lang.startsWith(lang === "ru" ? "ru" : "en"));

  if (preferredVoice) utterance.voice = preferredVoice;
  utterance.rate = 0.9;
  
  window.speechSynthesis.speak(utterance);
}

const POPUP_CSS = `
:host {
  all: initial;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.lp-popup, .lp-fab {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.lp-popup {
  position: absolute;
  z-index: 2147483647;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(36,0,41,.18), 0 2px 8px rgba(36,0,41,.08);
  padding: 16px;
  width: min(340px, calc(100vw - 24px));
  max-width: calc(100vw - 24px);
  max-height: min(420px, calc(100vh - 24px));
  overflow-y: auto;
  color: #333;
  font-size: 14px;
  line-height: 1.5;
  border: 1px solid #e8e0e8;
  box-sizing: border-box;
}
.lp-popup-phrase {
  width: min(560px, calc(100vw - 24px));
  max-width: calc(100vw - 24px);
  max-height: min(540px, calc(100vh - 24px));
}
.lp-fab {
  position: absolute;
  z-index: 2147483646;
  background: var(--lp-primary);
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(223,55,167,.35);
  transition: transform .1s, background .15s;
  font-family: inherit;
}
.lp-fab:hover { background: #c42e92; transform: translateY(-1px); }
.lp-fab:active { transform: translateY(0); }
.lp-fab svg { margin-left: 1px; margin-top: 1px; }
.lp-loading { color: #6d526d; font-size: 14px; padding: 8px 0; display: flex; align-items: center; gap: 10px; }
.lp-spinner {
  width: 16px; height: 16px;
  border: 2px solid #d4ccd4;
  border-top-color: var(--lp-primary);
  border-radius: 50%;
  animation: lp-spin 0.8s linear infinite;
}
@keyframes lp-spin { to { transform: rotate(360deg); } }
.lp-close-btn {
  position: absolute;
  top: 8px;
  right: 10px;
  background: none;
  border: none;
  color: #a090a0;
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
  padding: 2px 6px;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
}
.lp-close-btn:hover { color: #240029; background: #f5f0f5; }
.lp-word-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; padding-right: 20px; }
.lp-word { font-size: 18px; font-weight: 700; color: #240029; }
.lp-pos { font-size: 12px; color: #6d526d; text-transform: lowercase; background: #f5f0f5; padding: 2px 8px; border-radius: 10px; }
.lp-pronunciation { font-size: 13px; color: #6d526d; margin-bottom: 8px; font-style: italic; }
.lp-result-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 10px; padding-right: 20px; }
.lp-main-translation { font-size: 16px; font-weight: 600; color: var(--lp-primary); flex: 1; min-width: 0; }
.lp-phrase-translation { font-size: 15px; color: #333; line-height: 1.6; flex: 1; min-width: 0; }
.lp-phrase-translation p { margin-bottom: 8px; }
.lp-phrase-translation p:last-child { margin-bottom: 0; }
.lp-phrase-translation ul, .lp-phrase-translation ol { padding-left: 20px; margin-bottom: 8px; }
.lp-phrase-translation li { margin-bottom: 4px; }
.lp-phrase-translation strong { font-weight: 600; }
.lp-phrase-translation em { font-style: italic; }
.lp-icon-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.lp-icon-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d4ccd4;
  border-radius: 10px;
  background: #fff;
  color: #240029;
  cursor: pointer;
  transition: all .15s;
  padding: 0;
}
.lp-icon-btn svg { width: 16px; height: 16px; fill: currentColor; }
.lp-icon-btn:hover { background: #f8f0f8; border-color: #c4bcc4; transform: translateY(-1px); }
.lp-icon-btn:active { transform: translateY(0); }
.lp-icon-btn.is-copied { background: #ecfdf3; border-color: #86efac; color: #166534; }
.lp-alternatives { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.lp-alt { background: #f8f0f8; color: #6d526d; padding: 3px 10px; border-radius: 12px; font-size: 12px; border: 1px solid #ece5ec; }
.lp-examples { margin-bottom: 12px; }
.lp-example { padding: 8px 10px; background: #faf8fa; border-radius: 8px; margin-bottom: 6px; font-size: 13px; border-left: 3px solid var(--lp-primary); }
.lp-example div:first-child { color: #333; margin-bottom: 2px; }
.lp-example div:last-child { color: #6d526d; }
.lp-actions { display: none; }
.lp-error { color: #ef4444; font-size: 14px; padding: 8px 0; }
.lp-divider { height: 1px; background: #ece5ec; margin: 10px 0; }
.lp-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #240029;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 2147483647;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  animation: lp-fade-in-up 0.3s ease-out;
  display: flex;
  align-items: center;
  gap: 10px;
}
.lp-toast.lp-hiding {
  animation: lp-fade-out-down 0.3s ease-in forwards;
}
@keyframes lp-fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes lp-fade-out-down {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(20px); }
}
`;

let currentHost: HTMLElement | null = null;
let currentFab: HTMLElement | null = null;
let isTranslatingPage = false;
const originalTexts = new WeakMap<Text, string>();
const translatedNodes = new WeakSet<Text>();

const ICONS = {
  translate:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M12.87 15.07 11 13.2a4.7 4.7 0 0 0 .95-2.2h2.39v-2H7v2h2.86A6.7 6.7 0 0 1 7 15.3l1.4 1.4a8.7 8.7 0 0 0 3.18-2.53l1.7 1.7.59-1.8ZM17.5 10h-2l-4.5 12h2l1.12-3h4.76L20 22h2l-4.5-12Zm-2.56 7 1.44-4.33L17.82 17h-2.88Z"/></svg>',
  speak:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M3 10v4h4l5 4V6L7 10H3Zm13.5 2a3.5 3.5 0 0 0-2.5-3.35v6.69A3.5 3.5 0 0 0 16.5 12Zm0-7.5v2.06A7 7 0 0 1 21 12a7 7 0 0 1-4.5 5.44v2.06A9 9 0 0 0 23 12a9 9 0 0 0-6.5-7.5Z"/></svg>',
  copy:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H8V7h11v14Z"/></svg>',
} as const;

type ExtensionResponse = {
  success?: boolean;
  result?: unknown;
  error?: string;
} | null;

function hasExtensionContext(): boolean {
  return typeof chrome !== "undefined" && Boolean(chrome.runtime?.id);
}

function safeSendMessage(
  message: unknown,
  onResponse: (response: ExtensionResponse) => void,
): void {
  if (!hasExtensionContext()) {
    onResponse(null);
    return;
  }

  try {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        onResponse(null);
        return;
      }
      onResponse((response as ExtensionResponse) ?? null);
    });
  } catch {
    onResponse(null);
  }
}

function safeGetExcludedSites(onResult: (sites: string[]) => void): void {
  if (!hasExtensionContext()) {
    onResult([]);
    return;
  }

  try {
    chrome.storage.sync.get("excludedSites", (result) => {
      if (chrome.runtime.lastError) {
        onResult([]);
        return;
      }
      onResult((result.excludedSites as string[]) || []);
    });
  } catch {
    onResult([]);
  }
}

function createHost(): HTMLElement {
  const host = document.createElement("div");
  host.id = "linguapop-host";
  host.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;";
  document.body.appendChild(host);
  return host;
}

function getOrCreateShadowRoot(): ShadowRoot {
  if (currentHost) {
    const existing = document.getElementById("linguapop-host");
    if (existing && existing.shadowRoot) return existing.shadowRoot;
    existing?.remove();
  }
  currentHost = createHost();
  
  // Apply accent color to new host
  currentHost.style.setProperty("--lp-primary", currentAccentColor);
  
  const shadow = currentHost.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = POPUP_CSS;
  shadow.appendChild(style);
  return shadow;
}

function hidePopup() {
  const host = document.getElementById("linguapop-host");
  if (host) {
    host.remove();
    currentHost = null;
    stopSpeaking();
  }
}

function hideFab() {
  if (currentFab) {
    currentFab.remove();
    currentFab = null;
  }
}

function hideAll() {
  hidePopup();
  hideFab();
}

let activeToast: HTMLElement | null = null;
function showToast(message: string, duration = 3000, isLoading = false) {
  const shadow = getOrCreateShadowRoot();
  if (activeToast) {
    activeToast.remove();
  }
  const toast = document.createElement("div");
  toast.className = "lp-toast";
  let html = '';
  if (isLoading) {
    html += '<div class="lp-spinner" style="width: 14px; height: 14px; border-width: 2px; border-color: rgba(255,255,255,0.3); border-top-color: white;"></div>';
  }
  html += `<span>${escapeHtml(message)}</span>`;
  toast.innerHTML = html;
  shadow.appendChild(toast);
  activeToast = toast;

  if (duration > 0) {
    setTimeout(() => {
      if (activeToast === toast) {
        toast.classList.add("lp-hiding");
        setTimeout(() => toast.remove(), 300);
        activeToast = null;
      }
    }, duration);
  }
}

function createPopupInShadow(): HTMLElement {
  const shadow = getOrCreateShadowRoot();
  const existing = shadow.querySelector(".lp-popup");
  if (existing) existing.remove();

  const popup = document.createElement("div");
  popup.className = "lp-popup";
  shadow.appendChild(popup);
  makeDraggable(popup);
  return popup;
}

function getRangeAnchorRect(
  range: Range,
  anchor: "start" | "end" | "bounds" = "bounds",
): DOMRect {
  const rects = Array.from(range.getClientRects()).filter(
    (rect) => rect.width > 0 && rect.height > 0,
  );

  if (rects.length === 0) {
    return range.getBoundingClientRect();
  }

  if (anchor === "start") {
    return rects[0];
  }

  if (anchor === "end") {
    return rects[rects.length - 1];
  }

  return range.getBoundingClientRect();
}

function positionPopup(
  popup: HTMLElement,
  rect: DOMRect,
  position: "above" | "below",
) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const gap = 12;

  let left = rect.left;
  let top: number;

  const popupRect = popup.getBoundingClientRect();
  const fallbackWidth = popup.classList.contains("lp-popup-phrase")
    ? 560
    : 340;
  const popupWidth = Math.min(
    popupRect.width || fallbackWidth,
    viewportWidth - 20,
  );
  const popupHeight = popupRect.height || 200;

  if (position === "above") {
    top = rect.top - popupHeight - gap;
    if (top < 10) {
      top = rect.bottom + gap;
    }
  } else {
    top = rect.bottom + gap;
    if (top + popupHeight > viewportHeight - 10) {
      top = rect.top - popupHeight - gap;
    }
  }

  const maxLeft = viewportWidth - popupWidth - 10;
  if (left > maxLeft) left = maxLeft;
  if (left < 10) left = 10;
  if (top < 10) top = 10;

  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;
}

function eventHitsPopupOrFab(event: Event): boolean {
  const host = document.getElementById("linguapop-host");
  const popup = host?.shadowRoot?.querySelector(".lp-popup");
  const target = event.target as Node | null;
  const path =
    typeof event.composedPath === "function" ? event.composedPath() : [];

  if (popup) {
    if (path.includes(popup)) return true;
    if (target && popup.contains(target)) return true;
  }

  if (currentFab) {
    if (path.includes(currentFab)) return true;
    if (target && currentFab.contains(target)) return true;
  }

  return false;
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function makeDraggable(popup: HTMLElement) {
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialLeft = 0;
  let initialTop = 0;

  popup.addEventListener("mousedown", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest(".lp-btn, .lp-close-btn, .lp-icon-btn")) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialLeft = parseFloat(popup.style.left) || 0;
    initialTop = parseFloat(popup.style.top) || 0;
    popup.style.cursor = "grabbing";
    popup.style.userSelect = "none";
    e.preventDefault();
  });

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    popup.style.left = `${initialLeft + dx}px`;
    popup.style.top = `${initialTop + dy}px`;
  };

  const onMouseUp = () => {
    if (!isDragging) return;
    isDragging = false;
    popup.style.cursor = "default";
    popup.style.userSelect = "";
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}

function attachPopupListeners(popup: HTMLElement) {
  popup.querySelectorAll(".lp-close-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      hidePopup();
    });
  });

  popup.querySelectorAll(".lp-btn-speak").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const b = e.currentTarget as HTMLElement;
      speak(b.dataset.text || "", (b.dataset.lang as "en" | "ru") || "unknown");
    });
  });

  popup.querySelectorAll(".lp-btn-copy").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const b = e.currentTarget as HTMLElement;
      const text = b.dataset.text || "";
      navigator.clipboard.writeText(text).then(() => {
        b.textContent = "Скопировано";
        setTimeout(() => (b.textContent = "Копировать"), 1500);
      });
    });
  });
}

function attachPopupIconListeners(popup: HTMLElement) {
  popup.querySelectorAll(".lp-close-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      hidePopup();
    });
  });

  popup.querySelectorAll(".lp-icon-speak").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const button = e.currentTarget as HTMLElement;
      speak(
        button.dataset.text || "",
        (button.dataset.lang as "en" | "ru") || "unknown",
      );
    });
  });

  popup.querySelectorAll(".lp-icon-copy").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const button = e.currentTarget as HTMLElement;
      const text = button.dataset.text || "";
      navigator.clipboard.writeText(text).then(() => {
        button.classList.add("is-copied");
        button.setAttribute("title", "Copied");
        setTimeout(() => {
          button.classList.remove("is-copied");
          button.setAttribute("title", "Copy");
        }, 1200);
      });
    });
  });
}

function renderWordResult(
  popup: HTMLElement,
  result: WordTranslationResult,
  originalText: string,
) {
  const lang = result.detectedLanguage === "ru" ? "ru" : "en";
  const actionButtons = `
    <div class="lp-icon-actions">
      <button class="lp-icon-btn lp-icon-speak" type="button" title="Speak" data-text="${escapeHtml(originalText)}" data-lang="${lang}">${ICONS.speak}</button>
      <button class="lp-icon-btn lp-icon-copy" type="button" title="Copy" data-text="${escapeHtml(result.mainTranslation)}">${ICONS.copy}</button>
    </div>
  `;

  let html = `
    <button class="lp-close-btn" title="Закрыть">×</button>
    <div class="lp-word-header">
      <span class="lp-word">${escapeHtml(result.word)}</span>
      <span class="lp-pos">${escapeHtml(result.partOfSpeech)}</span>
    </div>
  `;
  if (result.pronunciation) {
    html += `<div class="lp-pronunciation">${escapeHtml(result.pronunciation)}</div>`;
  }
  html += `
    <div class="lp-result-header">
      <div class="lp-main-translation">${escapeHtml(result.mainTranslation)}</div>
      ${actionButtons}
    </div>
  `;

  if (result.alternatives && result.alternatives.length > 0) {
    html += `<div class="lp-alternatives">${result.alternatives.map((a) => `<span class="lp-alt">${escapeHtml(a)}</span>`).join("")}</div>`;
  }

  if (result.shortExamples && result.shortExamples.length > 0) {
    html += `<div class="lp-examples">`;
    for (const ex of result.shortExamples) {
      html += `<div class="lp-example"><div>${escapeHtml(ex.source)}</div><div>${escapeHtml(ex.translation)}</div></div>`;
    }
    html += `</div>`;
  }

  html += `
    <div class="lp-actions">
      <button class="lp-btn lp-btn-speak" data-text="${escapeHtml(originalText)}" data-lang="${lang}">Озвучить</button>
      <button class="lp-btn lp-btn-copy" data-text="${escapeHtml(result.mainTranslation)}">Копировать</button>
    </div>
  `;

  popup.innerHTML = html;
  attachPopupListeners(popup);
  attachPopupIconListeners(popup);
}

function renderPhraseResult(
  popup: HTMLElement,
  result: PhraseTranslationResult,
  originalText: string,
  rawOriginalText?: string,
) {
  const lang = result.detectedLanguage === "ru" ? "ru" : "en";

  // Fix literal \n strings if Mistral over-escaped them
  const fixedTranslation = result.translation.replace(/\\n/g, '\n');
  const rawHtml = marked.parse(fixedTranslation, { breaks: true }) as string;
  const safeHtml = DOMPurify.sanitize(rawHtml);
  
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = safeHtml;
  const plainText = tempDiv.innerText.trim() || result.translation;
  
  const safeOriginalText = rawOriginalText || originalText;

  popup.innerHTML = `
    <button class="lp-close-btn" title="Закрыть">×</button>
    <div class="lp-result-header">
      <div class="lp-phrase-translation">${safeHtml}</div>
      <div class="lp-icon-actions">
        <button class="lp-icon-btn lp-icon-speak" type="button" title="Speak" data-text="${escapeHtml(safeOriginalText)}" data-lang="${lang}">${ICONS.speak}</button>
        <button class="lp-icon-btn lp-icon-copy" type="button" title="Copy" data-text="${escapeHtml(plainText)}">${ICONS.copy}</button>
      </div>
    </div>
    <div class="lp-actions">
      <button class="lp-btn lp-btn-speak" data-text="${escapeHtml(safeOriginalText)}" data-lang="${lang}">Озвучить</button>
      <button class="lp-btn lp-btn-copy" data-text="${escapeHtml(plainText)}">Копировать</button>
    </div>
  `;

  attachPopupListeners(popup);
  attachPopupIconListeners(popup);
}

function renderError(popup: HTMLElement, error: string) {
  const messages: Record<string, string> = {
    missing_api_key: "Укажите API ключ в настройках расширения.",
    invalid_api_key: "Неверный API ключ.",
    network_error: "Ошибка сети. Проверьте подключение.",
    rate_limit: "Превышен лимит запросов.",
    extension_unavailable:
      "Extension was reloaded. Refresh the page.",
    llm_disabled_no_fallback:
      "LLM отключён. Настройте fallback-переводчик в настройках.",
  };

  popup.innerHTML = `
    <button class="lp-close-btn" title="Закрыть">×</button>
    <div class="lp-error">${messages[error] || "Ошибка перевода."}</div>
  `;
  attachPopupListeners(popup);
}

function showWordPopup(selection: Selection, text: string) {
  hideFab();
  hidePopup();

  const range = selection.getRangeAt(0);
  const rect = getRangeAnchorRect(range, "bounds");

  const popup = createPopupInShadow();
  popup.innerHTML = `<div class="lp-loading"><div class="lp-spinner"></div>Перевод...</div>`;

  requestAnimationFrame(() => {
    positionPopup(popup, rect, "above");
  });

  safeSendMessage(
    { type: "TRANSLATE", data: { text, mode: "word" } },
    (response) => {
      const host = document.getElementById("linguapop-host");
      if (!host || !host.shadowRoot) return;
      const currentPopup = host.shadowRoot.querySelector(
        ".lp-popup",
      ) as HTMLElement;
      if (!currentPopup) return;

      if (!response) {
        renderError(currentPopup, "extension_unavailable");
      } else if (response.success) {
        renderWordResult(
          currentPopup,
          response.result as WordTranslationResult,
          text,
        );
      } else {
        renderError(currentPopup, response?.error || "unknown");
      }
      requestAnimationFrame(() => {
        positionPopup(currentPopup, rect, "above");
      });
    },
  );
}

function showFab(selection: Selection, text: string, rawText?: string) {
  hidePopup();
  hideFab();

  const range = selection.getRangeAt(0);
  const rect = getRangeAnchorRect(range, "end");

  const fab = document.createElement("button");
  fab.className = "lp-fab";
  fab.style.cssText = `
    position: absolute;
    z-index: 2147483646;
    background: #df37a7;
    color: #fff;
    border: none;
    border-radius: 999px;
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(223, 55, 167, 0.35);
    transition: transform 0.1s, background 0.15s;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;
  fab.textContent = "Перевести";
  fab.innerHTML = ICONS.translate;
  fab.setAttribute("title", "Translate");
  fab.setAttribute("aria-label", "Translate");
  fab.addEventListener("click", (e) => {
    e.stopPropagation();
    hideFab();
    showPhrasePopup(selection, text, rawText);
  });

  document.body.appendChild(fab);
  currentFab = fab;

  const htmlRect = document.documentElement.getBoundingClientRect();
  let targetLeft = rect.right - 2;
  if (targetLeft + 28 > window.innerWidth - 8) {
    targetLeft = window.innerWidth - 28 - 8;
  }
  
  fab.style.left = `${targetLeft - htmlRect.left}px`;
  fab.style.top = `${rect.bottom + 2 - htmlRect.top}px`;
}

function showPhrasePopup(selection: Selection, text: string, rawText?: string) {
  hidePopup();

  const range = selection.getRangeAt(0);
  const rect = getRangeAnchorRect(range, "end");

  const popup = createPopupInShadow();
  popup.innerHTML = `<div class="lp-loading"><div class="lp-spinner"></div>Перевод...</div>`;

  popup.classList.add("lp-popup-phrase");
  requestAnimationFrame(() => {
    positionPopup(popup, rect, "below");
  });

  safeSendMessage(
    { type: "TRANSLATE", data: { text, mode: "phrase" } },
    (response) => {
      const host = document.getElementById("linguapop-host");
      if (!host || !host.shadowRoot) return;
      const currentPopup = host.shadowRoot.querySelector(
        ".lp-popup",
      ) as HTMLElement;
      if (!currentPopup) return;

      currentPopup.classList.add("lp-popup-phrase");

      if (!response) {
        renderError(currentPopup, "extension_unavailable");
      } else if (response.success) {
        renderPhraseResult(
          currentPopup,
          response.result as PhraseTranslationResult,
          text,
          rawText
        );
      } else {
        renderError(currentPopup, response?.error || "unknown");
      }
      requestAnimationFrame(() => {
        positionPopup(currentPopup, rect, "below");
      });
    },
  );
}

let selectionTimeout: ReturnType<typeof setTimeout> | null = null;

function handleSelection() {
  if (selectionTimeout) clearTimeout(selectionTimeout);
  selectionTimeout = setTimeout(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      hideAll();
      return;
    }

    const rawText = selection.toString().trim();
    if (!rawText) {
      hideAll();
      return;
    }

    let text = rawText;
    try {
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = document.createElement("div");
        container.appendChild(range.cloneContents());
        const unwanted = container.querySelectorAll("script, style, noscript, iframe");
        unwanted.forEach(n => n.remove());
        const md = turndownService.turndown(container.innerHTML).trim();
        if (md) {
          text = md;
        }
      }
    } catch (e) {
      console.warn("Turndown failed", e);
    }

    // Don't show popup for selections inside inputs/textareas
    const focusNode = selection.focusNode;
    if (focusNode) {
      const parent = focusNode.parentElement;
      if (parent) {
        const tag = parent.tagName.toLowerCase();
        if (["input", "textarea", "select"].includes(tag)) {
          hideAll();
          return;
        }
        if (
          parent.closest('input, textarea, select, [contenteditable="true"]')
        ) {
          hideAll();
          return;
        }
      }
    }

    checkExcluded().then((excluded) => {
      if (excluded) return;

      const words = rawText.split(/\s+/).filter((w) => w.length > 0);
      if (words.length === 1 && rawText.length > 0 && rawText.length < 50) {
        showWordPopup(selection, rawText);
      } else {
        showFab(selection, text, rawText);
      }
    });
  }, 150);
}

async function checkExcluded(): Promise<boolean> {
  try {
    const hostname = window.location.hostname;
    return new Promise((resolve) => {
      safeGetExcludedSites((sites) => {
        resolve(sites.some((site) => hostname.includes(site)));
      });
    });
  } catch {
    return false;
  }
}

document.addEventListener("mouseup", (e) => {
  if (eventHitsPopupOrFab(e)) {
    return;
  }
  handleSelection();
});
document.addEventListener("keyup", (e) => {
  if (
    e.key === "Shift" ||
    e.key === "Control" ||
    e.key === "Alt" ||
    e.key === "Meta"
  )
    return;
  handleSelection();
});

document.addEventListener("mousedown", (e) => {
  if (eventHitsPopupOrFab(e)) {
    return;
  }
  hideAll();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    hideAll();
  }
});

let lastScrollY = window.scrollY;
window.addEventListener("scroll", () => {
  const delta = Math.abs(window.scrollY - lastScrollY);
  if (delta > 80) {
    hideAll();
  }
  lastScrollY = window.scrollY;
});

// Keyboard shortcut: Alt+T to translate current selection
document.addEventListener("keydown", (e) => {
  if (
    e.altKey &&
    (e.key === "t" || e.key === "T") &&
    !e.ctrlKey &&
    !e.metaKey
  ) {
    e.preventDefault();
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const rawText = selection.toString().trim();
      if (rawText) {
        let text = rawText;
        try {
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const container = document.createElement("div");
            container.appendChild(range.cloneContents());
            const unwanted = container.querySelectorAll("script, style, noscript, iframe");
            unwanted.forEach(n => n.remove());
            const md = turndownService.turndown(container.innerHTML).trim();
            if (md) {
              text = md;
            }
          }
        } catch (e) {
          console.warn("Turndown failed", e);
        }

        const words = rawText.split(/\s+/).filter((w) => w.length > 0);
        if (words.length === 1 && rawText.length < 50) {
          showWordPopup(selection, rawText);
        } else {
          showPhrasePopup(selection, text, rawText);
        }
      }
    }
  }
});

// Context menu handler
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === "CONTEXT_MENU_TRANSLATE") {
    const text = request.text as string;
    hideAll();

    const popup = createPopupInShadow();
    popup.innerHTML = `<div class="lp-loading"><div class="lp-spinner"></div>Перевод...</div>`;

    popup.style.left = `${Math.max(10, window.innerWidth / 2 - 150)}px`;
    popup.style.top = `${Math.max(10, window.innerHeight / 2 - 100)}px`;

    const mode =
      text.split(/\s+/).filter((w) => w.length > 0).length === 1
        ? "word"
        : "phrase";
    if (mode === "phrase") {
      popup.classList.add("lp-popup-phrase");
    }
    safeSendMessage(
      { type: "TRANSLATE", data: { text, mode } },
      (response) => {
        const host = document.getElementById("linguapop-host");
        if (!host || !host.shadowRoot) return;
        const currentPopup = host.shadowRoot.querySelector(
          ".lp-popup",
        ) as HTMLElement;
        if (!currentPopup) return;

        if (mode === "phrase") {
          currentPopup.classList.add("lp-popup-phrase");
        }

        if (!response) {
          renderError(currentPopup, "extension_unavailable");
        } else if (response.success) {
          if (mode === "word") {
            renderWordResult(
              currentPopup,
              response.result as WordTranslationResult,
              text,
            );
          } else {
            renderPhraseResult(
              currentPopup,
              response.result as PhraseTranslationResult,
              text,
            );
          }
        } else {
          renderError(currentPopup, response?.error || "unknown");
        }
      },
    );
    sendResponse({ success: true });
    return true;
  }

  if (request.type === "START_PAGE_TRANSLATION") {
    startPageTranslation();
    sendResponse({ success: true });
    return true;
  }

  if (request.type === "RESTORE_PAGE") {
    restorePage();
    sendResponse({ success: true });
    return true;
  }

  if (request.type === "KEYBOARD_SHORTCUT_TRANSLATE") {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const rawText = selection.toString().trim();
      if (rawText) {
        let text = rawText;
        try {
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const container = document.createElement("div");
            container.appendChild(range.cloneContents());
            const unwanted = container.querySelectorAll("script, style, noscript, iframe");
            unwanted.forEach(n => n.remove());
            const md = turndownService.turndown(container.innerHTML).trim();
            if (md) {
              text = md;
            }
          }
        } catch (e) {
          console.warn("Turndown failed", e);
        }

        const words = rawText.split(/\s+/).filter((w) => w.length > 0);
        if (words.length === 1 && rawText.length < 50) {
          showWordPopup(selection, rawText);
        } else {
          showPhrasePopup(selection, text, rawText);
        }
        sendResponse({ success: true });
        return true;
      }
    }
    sendResponse({ success: false, error: "no_selection" });
    return true;
  }

  return false;
});

// Page translation MVP
async function startPageTranslation() {
  if (isTranslatingPage) return;
  isTranslatingPage = true;

  showToast("Переводим страницу...", 0, true);

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        const tag = parent.tagName.toLowerCase();
        if (
          [
            "script",
            "style",
            "noscript",
            "input",
            "textarea",
            "code",
            "pre",
            "iframe",
          ].includes(tag)
        ) {
          return NodeFilter.FILTER_REJECT;
        }

        if (
          parent.closest(
            'script, style, noscript, input, textarea, code, pre, iframe, [translate="no"]',
          )
        ) {
          return NodeFilter.FILTER_REJECT;
        }

        const style = window.getComputedStyle(parent);
        if (style.display === "none" || style.visibility === "hidden") {
          return NodeFilter.FILTER_REJECT;
        }

        const text = node.textContent?.trim() || "";
        if (text.length === 0) return NodeFilter.FILTER_REJECT;
        if (!/[a-zA-Zа-яёА-ЯЁ0-9]/.test(text)) return NodeFilter.FILTER_REJECT;
        if (translatedNodes.has(node as Text)) return NodeFilter.FILTER_REJECT;

        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );

  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    nodes.push(node as Text);
  }

  const batches: Text[][] = [];
  let currentBatch: Text[] = [];
  let currentChars = 0;
  // Reduce batch size for faster individual responses (streaming effect)
  const MAX_BATCH_CHARS = 800;

  for (const n of nodes) {
    const len = n.textContent?.length || 0;
    if (currentChars + len > MAX_BATCH_CHARS && currentBatch.length > 0) {
      batches.push(currentBatch);
      currentBatch = [n];
      currentChars = len;
    } else {
      currentBatch.push(n);
      currentChars += len;
    }
  }
  if (currentBatch.length > 0) batches.push(currentBatch);

  if (batches.length === 0) {
    showToast("На странице нет подходящего текста.", 3000);
    isTranslatingPage = false;
    return;
  }

  // Process batches with concurrency limit to create a smooth top-to-bottom waterfall effect
  const CONCURRENCY = 4;
  let batchIndex = 0;

  const processNextBatch = async (): Promise<void> => {
    while (batchIndex < batches.length) {
      const currentIndex = batchIndex++;
      const batch = batches[currentIndex];
      const texts = batch.map((n) => n.textContent?.trim() || "");
      const jsonStr = JSON.stringify(texts);

      await new Promise<void>((resolve) => {
        safeSendMessage(
          { type: "TRANSLATE", data: { text: jsonStr, mode: "batch" } },
          (response) => {
            if (response?.success) {
              const result = response.result as BatchTranslationResult;
              const parts = result.translations;
              if (Array.isArray(parts)) {
                batch.forEach((n, i) => {
                  if (parts[i] && !translatedNodes.has(n)) {
                    originalTexts.set(n, n.textContent || "");
                    n.textContent = parts[i];
                    translatedNodes.add(n);
                  }
                });
              }
            }
            resolve();
          },
        );
      });
    }
  };

  const workers = Array.from({ length: CONCURRENCY }, () => processNextBatch());
  await Promise.all(workers);
  showToast("Страница успешно переведена!", 3000);
}

function restorePage() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    if (translatedNodes.has(textNode)) {
      const original = originalTexts.get(textNode);
      if (original !== undefined) {
        textNode.textContent = original;
      }
      translatedNodes.delete(textNode);
    }
  }
  isTranslatingPage = false;
  showToast("Оригинал восстановлен", 2000);
}

// -----------------------------------------
// Writing Assistant (Reverse Translation)
// -----------------------------------------

let currentInputTarget: HTMLElement | null = null;
let writeFab: HTMLElement | null = null;

function isTextInput(el: HTMLElement): boolean {
  if (el.tagName.toLowerCase() === "textarea") return true;
  if (el.isContentEditable) return true;
  if (el.tagName.toLowerCase() === "input") {
    const type = (el as HTMLInputElement).type;
    return ["text", "search", "email", "url"].includes(type);
  }
  return false;
}

function getTextInputValue(el: HTMLElement): string {
  if (el.tagName.toLowerCase() === "textarea" || el.tagName.toLowerCase() === "input") {
    return (el as HTMLInputElement | HTMLTextAreaElement).value;
  }
  if (el.isContentEditable) {
    return el.innerText || "";
  }
  return "";
}

function setTextInputValue(el: HTMLElement, newText: string) {
  if (el.tagName.toLowerCase() === "textarea" || el.tagName.toLowerCase() === "input") {
    (el as HTMLInputElement | HTMLTextAreaElement).value = newText;
  } else if (el.isContentEditable) {
    el.innerText = newText;
  }
  // Trigger standard events so React/Vue/Angular notice the change
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function hideWriteFab() {
  if (writeFab) {
    writeFab.remove();
    writeFab = null;
  }
  currentInputTarget = null;
}

function updateWriteFabPosition() {
  if (!writeFab || !currentInputTarget) return;
  
  // Find the outermost contenteditable container to get the true boundaries
  let targetNode = currentInputTarget;
  if (targetNode.isContentEditable) {
    let current = targetNode.parentElement;
    while (current && current.isContentEditable) {
      targetNode = current;
      current = current.parentElement;
    }
  }

  const rect = targetNode.getBoundingClientRect();
  const htmlRect = document.documentElement.getBoundingClientRect();
  
  // Place outside the input: below it, aligned to the right edge
  let top = rect.bottom - htmlRect.top + 6; // 6px gap below
  const left = rect.right - htmlRect.left - 28; // right-aligned (28px is fab width)
  
  // If placing it below pushes it off-screen, place it above the input
  const maxTop = window.scrollY + window.innerHeight - 34;
  if (top > maxTop) {
    top = rect.top - htmlRect.top - 28 - 6; 
  }
  
  writeFab.style.top = `${top}px`;
  writeFab.style.left = `${left}px`;
}

let writeMenu: HTMLDivElement | null = null;

function hideWriteMenu() {
  if (writeMenu && writeMenu.parentNode) {
    writeMenu.parentNode.removeChild(writeMenu);
  }
  writeMenu = null;
}

function showWriteFab(target: HTMLElement) {
  hideWriteFab();
  hideWriteMenu();
  currentInputTarget = target;
  
  writeFab = document.createElement("button");
  writeFab.className = "lp-fab";
  writeFab.style.cssText = `
    position: absolute;
    z-index: 2147483645;
    background: var(--lp-primary, #df37a7);
    color: #fff;
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(223, 55, 167, 0.3);
    transition: transform 0.1s, opacity 0.2s;
    opacity: 0.6;
  `;
  writeFab.innerHTML = ICONS.translate;
  writeFab.title = "Улучшить / Перевести текст";

  writeFab.addEventListener("mouseenter", () => {
    if (writeFab) writeFab.style.opacity = "1";
  });
  writeFab.addEventListener("mouseleave", () => {
    if (writeFab && !writeMenu) writeFab.style.opacity = "0.6";
  });

  writeFab.addEventListener("mousedown", (e) => {
    e.preventDefault(); 
    e.stopPropagation();
  });

  writeFab.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentInputTarget) return;
    const text = getTextInputValue(currentInputTarget).trim();
    if (!text) return;

    if (writeMenu) {
      hideWriteMenu();
      return;
    }

    const rect = writeFab!.getBoundingClientRect();
    writeMenu = document.createElement("div");
    let menuLeft = rect.left + window.scrollX;
    if (rect.left + 170 > window.innerWidth) {
      menuLeft = window.innerWidth - 170 - 10 + window.scrollX;
    }

    let menuTop = rect.bottom + window.scrollY + 8;
    let transform = "none";
    if (rect.bottom + 190 > window.innerHeight) {
      menuTop = rect.top + window.scrollY - 8;
      transform = "translateY(-100%)";
    }

    writeMenu.style.cssText = `
      position: absolute;
      z-index: 2147483646;
      top: ${menuTop}px;
      left: ${menuLeft}px;
      transform: ${transform};
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      width: 170px;
      font-family: system-ui, sans-serif;
      font-size: 13px;
      color: #333;
      border: 1px solid #eaeaea;
    `;

    const options: { label: string, tone: "normal" | "formal" | "friendly" | "shorter" | "grammar_only" }[] = [
      { label: "Обычный перевод", tone: "normal" },
      { label: "Формальный", tone: "formal" },
      { label: "Дружелюбный", tone: "friendly" },
      { label: "Сделать короче", tone: "shorter" },
      { label: "Только грамматика", tone: "grammar_only" }
    ];

    options.forEach(opt => {
      const btn = document.createElement("button");
      btn.textContent = opt.label;
      btn.style.cssText = `
        background: none;
        border: none;
        padding: 8px 12px;
        text-align: left;
        cursor: pointer;
        border-radius: 6px;
        color: #333;
        font-family: inherit;
        font-size: 13px;
        transition: background 0.15s;
        width: 100%;
        white-space: nowrap;
      `;
      btn.addEventListener("mouseenter", () => btn.style.background = "#f5f2f5");
      btn.addEventListener("mouseleave", () => btn.style.background = "none");
      btn.addEventListener("mousedown", (e) => e.preventDefault()); // Prevent input blur
      
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        hideWriteMenu();
        executeRewrite(opt.tone);
      });

      writeMenu!.appendChild(btn);
    });

    document.body.appendChild(writeMenu);
  });

  document.body.appendChild(writeFab);
  updateWriteFabPosition();
}

function executeRewrite(tone: "normal" | "formal" | "friendly" | "shorter" | "grammar_only") {
  if (!currentInputTarget) return;
  const text = getTextInputValue(currentInputTarget).trim();
  if (!text) return;
  
  const originalIcon = writeFab!.innerHTML;
  writeFab!.innerHTML = '<div class="lp-spinner" style="width:14px;height:14px;border-width:2px;border-color:rgba(255,255,255,0.3);border-top-color:white;"></div>';
  writeFab!.style.opacity = "1";
  writeFab!.style.pointerEvents = "none";
  
  safeSendMessage(
    { type: "TRANSLATE", data: { text, mode: "rewrite", tone } },
    (response) => {
      if (writeFab) {
        writeFab.innerHTML = originalIcon;
        writeFab.style.pointerEvents = "auto";
        writeFab.style.opacity = "0.6";
      }
      
      if (response?.success && response.result) {
        const res = response.result as PhraseTranslationResult;
        if (res.translation && currentInputTarget) {
          const fixed = res.translation.replace(/\\n/g, '\n');
          setTextInputValue(currentInputTarget, fixed);
          
          if (writeFab) {
            writeFab.style.background = "#10b981";
            writeFab.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.4)";
            writeFab.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
            setTimeout(() => {
              if (writeFab) {
                writeFab.style.background = "var(--lp-primary, #df37a7)";
                writeFab.style.boxShadow = "0 4px 12px rgba(223, 55, 167, 0.3)";
                writeFab.innerHTML = ICONS.translate;
              }
              }, 1500);
            }
          }
        } else {
          showToast("Ошибка перевода текста", 3000);
        }
      }
    );
}

// Global focus listeners
document.addEventListener("focusin", async (e) => {
  const target = e.target as HTMLElement;
  if (!target) return;
  
  if (isTextInput(target)) {
    // Only show if the element is reasonably large
    const rect = target.getBoundingClientRect();
    if (rect.width > 100 && rect.height >= 20) {
      const excluded = await checkExcluded();
      if (excluded) return;

      const settings = await new Promise<any>((resolve) => {
        if (!chrome?.runtime?.id) { resolve(null); return; }
        try {
          chrome.storage.sync.get("settings", (res) => resolve(res.settings));
        } catch { resolve(null); }
      });
      
      if (settings && settings.assistantEnabled === false) return;
      
      // Make sure the element is still focused after async check
      if (document.activeElement === target) {
        showWriteFab(target);
      }
    }
  }
});

document.addEventListener("focusout", (e) => {
  const related = e.relatedTarget as HTMLElement;
  // Don't hide if clicking on our FAB
  if (related && (related === writeFab || writeFab?.contains(related))) {
    return;
  }
  
  // Use a tiny delay so clicks on FAB can process before blur hides it
  setTimeout(() => {
    if (document.activeElement !== currentInputTarget && document.activeElement !== writeFab) {
      hideWriteFab();
    }
  }, 100);
});

// Update FAB position on resize and scroll
window.addEventListener("resize", () => updateWriteFabPosition());
document.addEventListener("scroll", () => {
  if (writeFab && currentInputTarget) {
    updateWriteFabPosition();
  }
}, { capture: true });
