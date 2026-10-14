<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/readme/hero.gif">
    <source media="(prefers-color-scheme: light)" srcset="assets/readme/hero.gif">
    <img alt="LinguaPop AI Hero Image" src="assets/readme/hero.svg" width="100%">
  </picture>
</div>

<p align="center">
  <a href="README.ru.md"><strong>🇷🇺 Читать на русском</strong></a> •
  <a href="#-key-features"><strong>Features</strong></a> •
  <a href="#-how-to-install"><strong>Installation</strong></a> •
  <a href="#-configuration"><strong>Configuration</strong></a> •
  <a href="#-keyboard-shortcuts"><strong>Shortcuts</strong></a> •
  <a href="#-privacy--security"><strong>Privacy</strong></a>
</p>

<p align="center">
  <a href="https://developer.chrome.com/docs/extensions/mv3/intro/"><img src="https://img.shields.io/badge/Manifest-V3-brightgreen.svg?style=flat-square" alt="Manifest V3"></a>
  <a href="https://github.com/kkonstantin08/linguapop-ai/releases"><img src="https://img.shields.io/badge/Version-1.1.6-blue.svg?style=flat-square" alt="Version 1.1.6"></a>
  <a href="#-key-features"><img src="https://img.shields.io/badge/AI-BYOK%20Architecture-purple.svg?style=flat-square" alt="BYOK AI"></a>
  <a href="#-privacy--security"><img src="https://img.shields.io/badge/Telemetry-Zero%20Data%20Collected-success.svg?style=flat-square" alt="Zero Telemetry"></a>
  <a href="#-license"><img src="https://img.shields.io/badge/License-MIT-orange.svg?style=flat-square" alt="License MIT"></a>
</p>

---

## 🌟 Overview

**LinguaPop AI v1.1.6** is a sleek, intelligent, privacy-first browser extension built for Chromium-based browsers (Google Chrome, Brave, Microsoft Edge, Arc, Vivaldi, Opera). 

Unlike conventional browser translators that rely on rigid dictionaries or capture your private web browsing data on third-party servers, LinguaPop AI combines a **Bring Your Own Key (BYOK)** multi-LLM architecture with on-device AI fallbacks. It delivers context-aware translations, instant grammatical correction, tone-shifting writing assistance, and seamless full-page translation directly inside your browser.

---

## 🚀 Key Features

### 🤖 1. BYOK (Bring Your Own Key) Multi-Model Support
Connect your personal API keys and switch between industry-leading AI models on demand:
- **OpenAI**: `gpt-4o`, `gpt-4o-mini`, `o3-mini`
- **Anthropic**: `claude-3-5-sonnet`, `claude-3-7-sonnet`, `claude-3-5-haiku`
- **Google Gemini**: `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-2.0-flash`
- **Groq**: Ultra-low latency Llama 3 & Mixtral inference
- **Cerebras**: Lightning-fast translation powered by wafer-scale engine inference
- **Mistral AI**: `mistral-large-latest`, `codestral`, `mistral-small`

### ⚡ 2. Smart Fallback Engine (Zero Downtime)
Never get blocked by API rate limits, expired keys, or intermittent internet outages:
- **Chrome Built-in AI**: Uses local `window.ai` and Chrome Translator API (Gemini Nano) directly on your device when available.
- **Google Translate Fallback**: Automatic, zero-delay failover to public translation pipelines if primary AI provider calls fail.
- **Fail-Safe Guarantee**: If an API quota is exhausted, translation completes without breaking user experience.

### ✍️ 3. Inline Writing Assistant
A floating intelligent button appears inside editable text fields, textareas, and rich-text inputs across any website (Gmail, Notion, GitHub, Twitter/X, Telegram Web, LinkedIn):
- 🎩 **Formal**: Converts draft thoughts into polished business correspondence, academic phrasing, and professional emails.
- 💬 **Friendly**: Adapts text for casual chatting, warm customer relations, and engaging social posts.
- ⚡ **Concise**: Trims wordiness, eliminates fluff, and crystallizes your core message.
- 🔍 **Grammar-only**: Fixes punctuation, syntax, and spelling errors while strictly preserving your personal voice.

### 🌊 4. Waterfall Page Translation
Streamlined, non-destructive DOM translation:
- Translates web pages progressively from top to bottom in real time.
- Replaces visible text nodes on the fly without breaking page layouts, CSS stylesheets, event handlers, or dynamic JavaScript single-page apps.
- Allows instant toggling between original and translated content.

### 🗄️ 5. Local Sub-Millisecond LRU Cache
- Implements an in-memory and persistent Least Recently Used (LRU) translation cache.
- Delivers instantaneous **0 ms responses** for repeated terms, idioms, and sentences.
- Drastically reduces external API token consumption and lowers monthly AI inference costs.

---

## 🛠️ Supported AI Providers & Models

| Provider | Supported Models | Primary Strength |
| :--- | :--- | :--- |
| **OpenAI** | `gpt-4o`, `gpt-4o-mini`, `o3-mini` | Deep contextual nuance and complex language parsing |
| **Anthropic** | `claude-3-7-sonnet`, `claude-3-5-sonnet` | Nuanced writing tone, natural phrasing, and literary precision |
| **Google Gemini** | `gemini-2.5-flash`, `gemini-2.5-pro` | Large context windows, rapid multilingual comprehension |
| **Groq** | `llama-3.3-70b-versatile`, `mixtral-8x7b-32768` | Instantaneous real-time streaming translation |
| **Cerebras** | `llama3.1-70b`, `llama3.1-8b` | World-record inference speed for bulk text translation |
| **Mistral AI** | `mistral-large-latest`, `mistral-small` | High-accuracy European language translation and localization |
| **Local Device** | Chrome Built-in AI (`Gemini Nano`) | 100% offline, private, zero-cost processing |

---

## 📦 How to Install

Since LinguaPop AI is distributed as a clean, open Manifest V3 extension, you can install it directly in under 60 seconds:

### Step 1: Clone or Download Repository
Clone the repository to your local machine:
```bash
git clone https://github.com/kkonstantin08/linguapop-ai.git
```
*(Or download the ZIP archive from GitHub and extract it to a directory of your choice).*

### Step 2: Open Extensions in Chromium
Open any Chromium-based browser (Chrome, Brave, Edge, Arc, Opera, Vivaldi) and enter the extensions URL into your address bar:
```text
chrome://extensions
```
*(For Brave: `brave://extensions`, for Edge: `edge://extensions`)*

### Step 3: Enable Developer Mode
Locate the **Developer mode** toggle switch in the top-right corner of the Extensions management page and turn it **ON**.

### Step 4: Load Unpacked Extension
1. Click the **"Load unpacked"** (Загрузить распакованное расширение) button in the top-left toolbar.
2. In the file picker dialog, navigate to and select the cloned repository folder:
   ```text
   /path/to/linguapop-ai
   ```
   *(Ensure the selected folder directly contains `manifest.json`).*

### Step 5: Pin Extension
Click the puzzle piece icon (Extensions) in your browser toolbar and pin **LinguaPop AI** for quick access.

---

## ⚙️ Configuration

1. **Open Options**:
   - Click the LinguaPop AI extension icon in your browser toolbar, then click the **Settings ⚙️** icon, OR
   - Right-click the extension icon and select **Options**.
2. **Configure Providers**:
   - Navigate to the **Providers** (Провайдеры) tab.
   - Enter your personal API key for your preferred service (e.g. OpenAI, Anthropic, Gemini, Groq, Cerebras, or Mistral).
   - Select your default translation model and tone.
3. **Set Target Language**:
   - Choose your native language (e.g. Russian 🇷🇺, English 🇺🇸, Spanish 🇪🇸, German 🇩🇪).
   - LinguaPop AI automatically detects source languages and toggles bidirectional translation.

---

## ⌨️ Keyboard Shortcuts

Speed up your daily workflow with built-in hotkeys:

| Shortcut (Windows / Linux) | Shortcut (macOS) | Action | Scope |
| :--- | :--- | :--- | :--- |
| <kbd>Alt</kbd> + <kbd>T</kbd> | <kbd>⌥ Option</kbd> + <kbd>T</kbd> | **Translate Selected Text** | Any webpage selection |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd> | <kbd>⌥ Option</kbd> + <kbd>L</kbd> | **Open LinguaPop Popup** | Global browser window |
| <kbd>Esc</kbd> | <kbd>Esc</kbd> | **Close Translation Tooltip** | Active popover |

> 💡 *Want custom keybindings? Navigate to `chrome://extensions/shortcuts` to customize any shortcut to your liking.*

---

## 🔒 Privacy & Security

LinguaPop AI is engineered under a strict **Zero-Telemetry, Local-First** philosophy:

- 🛡️ **Zero Tracking**: We do not collect analytics, telemetry, browser fingerprints, or browsing history. There is no tracking script or telemetry SDK included.
- 🔑 **Locally Encrypted Secrets**: All API keys, custom system instructions, and cached entries are stored strictly inside your browser's local sandbox via `chrome.storage.local`.
- 🌐 **Direct Client-to-API Communication**: No intermediate proxy servers or third-party gateways. Every API call is dispatched over secure TLS/HTTPS directly from your browser to your designated AI provider.
- 🏢 **Enterprise Ready**: Complies with strict data governance policies since your queries are subject only to the privacy agreements between you and your AI provider.

---

## 📂 Project Architecture

```text
linguapop-ai/
├── manifest.json              # Chrome Manifest V3 configuration
├── background.js              # Service worker handling API requests & hotkeys
├── content.js                 # Content script for page DOM, popups & writing assistant
├── chrome-translator-bridge.js# Bridge to local Chrome Built-in AI (window.ai)
├── popup.html                 # Quick translation popup interface
├── options.html               # Settings, model selection & provider keys
├── options-logs.js            # Logging & diagnostic utilities
├── options-logs.css           # Styling for options dashboard
├── icons/                     # Extension branding icons (16px, 48px, 128px)
└── assets/
    ├── options-rebuilt.*      # Compiled styles & UI module for options
    ├── popup-rebuilt.*        # Compiled styles & UI module for popup
    ├── constants-*.js         # Shared runtime constants & state helpers
    └── readme/                # Documentation visual assets (hero.gif, hero.svg)
```

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE). Feel free to inspect, modify, and distribute according to the terms of the license.
