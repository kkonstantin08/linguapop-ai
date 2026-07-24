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
    testApiKey()
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
        const buffer = await res.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        const dataUrl = `data:audio/mpeg;base64,${base64}`;
        sendResponse({ success: true, dataUrl });
      })
      .catch((err) => {
        console.error("[LinguaPop] TTS error:", err);
        sendResponse({ success: false });
      });
    return true;
  }

  return false;
});
