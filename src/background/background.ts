import { translate } from "../shared/translation/service";
import { testApiKey } from "../shared/llm/client";
import type { TranslationRequest } from "../shared/types";

chrome.runtime.onInstalled.addListener(() => {
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

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (
    info.menuItemId === "translate-selection" &&
    info.selectionText &&
    tab?.id
  ) {
    chrome.tabs
      .sendMessage(tab.id, {
        type: "CONTEXT_MENU_TRANSLATE",
        text: info.selectionText,
      })
      .catch(() => {
        // Tab may not have content script loaded
      });
  } else if (info.menuItemId === "translate-page" && tab?.id) {
    chrome.tabs
      .sendMessage(tab.id, { type: "START_PAGE_TRANSLATION" })
      .catch(() => {});
  } else if (info.menuItemId === "restore-page" && tab?.id) {
    chrome.tabs
      .sendMessage(tab.id, { type: "RESTORE_PAGE" })
      .catch(() => {});
  }
});

// Handle keyboard shortcut commands
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "translate-selection" && tab?.id) {
    chrome.tabs
      .sendMessage(tab.id, { type: "KEYBOARD_SHORTCUT_TRANSLATE" })
      .catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === "TRANSLATE") {
    const req = request.data as TranslationRequest;
    translate(req)
      .then((result) => sendResponse({ success: true, result }))
      .catch((error: Error) => {
        console.error("[LinguaPop] Translation error:", error.message);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.type === "TEST_API_KEY") {
    const { provider, apiKey, model } = request.data || {};
    testApiKey(provider, apiKey, model)
      .then(() => sendResponse({ success: true }))
      .catch((error: Error) => {
        console.error("[LinguaPop] API key test error:", error.message);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.type === "TRANSLATE_PAGE") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs
          .sendMessage(tabs[0].id, { type: "START_PAGE_TRANSLATION" })
          .catch(() => {});
      }
    });
    sendResponse({ success: true });
    return true;
  }

  if (request.type === "RESTORE_PAGE") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs
          .sendMessage(tabs[0].id, { type: "RESTORE_PAGE" })
          .catch(() => {});
      }
    });
    sendResponse({ success: true });
    return true;
  }

  if (request.type === "FETCH_TTS") {
    const { url } = request;
    fetch(url, { referrerPolicy: "no-referrer" })
      .then(async (res) => {
        if (!res.ok) throw new Error("TTS fetch failed");
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          sendResponse({ success: true, dataUrl: reader.result });
        };
        reader.onerror = () => {
          console.error("[LinguaPop] TTS FileReader error");
          sendResponse({ success: false });
        };
        reader.readAsDataURL(blob);
      })
      .catch((err) => {
        console.error("[LinguaPop] TTS error:", err);
        sendResponse({ success: false });
      });
    return true;
  }

  return false;
});
