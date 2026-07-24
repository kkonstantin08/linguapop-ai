<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/readme/hero.gif">
    <source media="(prefers-color-scheme: light)" srcset="assets/readme/hero.gif">
    <img alt="LinguaPop AI Hero Image showing text translation" src="assets/readme/hero.svg" width="100%">
  </picture>
</div>

<p align="center">
  <strong>An AI-powered Chromium extension for seamless translation, text rewriting, and PDF localization using your own LLM keys.</strong>
</p>

<p align="center">
  <a href="README.ru.md">🇷🇺 Читать на русском</a>
</p>

---

**LinguaPop AI** brings the power of state-of-the-art language models directly into your browser. Instead of switching tabs to translate a phrase or rewrite an email, LinguaPop sits inline—offering context-aware translation, text polishing, and full-page streaming localization directly in the inputs and pages you are already using.

## ✨ Why LinguaPop?

Most translation extensions rely on standard neural machine translation (like Google Translate). LinguaPop connects directly to the best LLMs (OpenAI, Anthropic, Gemini, Mistral) using your own API keys. This means translations are not just accurate—they are context-aware, idiomatic, and preserve the original tone.

### Core Features

* **🤖 Bring Your Own API:** Natively supports OpenAI (ChatGPT), Anthropic (Claude), Google (Gemini), and Mistral. You control the costs and privacy.
* **⚡ Smart Local Fallback:** If your API key runs out or drops, LinguaPop automatically falls back to Chrome's local, built-in AI models (Nano) to ensure you never lose translation capabilities.
* **✍️ Inline AI Writing Assistant:** Focus any text input on the web (emails, chats, comments). Click the floating LinguaPop button to rewrite your draft into fluent, native-sounding English. Choose tones like *Formal*, *Friendly*, *Shorter*, or *Grammar-only*.
* **📄 Built-in PDF Localization:** Right-click any local or remote PDF link and select "Open in LinguaPop PDF" to render and translate documents natively.
* **🌊 Waterfall Page Translation:** Translate entire web pages with a beautiful top-to-bottom streaming effect. The extension intelligently batches paragraphs and replaces them live as responses arrive.
* **🗄️ Lightning-Fast LRU Cache:** 100% local `chrome.storage` cache ensures that repeated phrases load instantly (0ms) and save your API tokens.

## 🚀 Installation

LinguaPop is easy to install via the pre-built releases or from source.

### The Easy Way (Pre-built Release)

1. Download the latest `dist.zip` from the [Releases](../../releases) page.
2. Extract the ZIP file to a folder on your computer.
3. Open your Chromium-based browser (Chrome, Edge, Brave) and go to `chrome://extensions`.
4. Enable **Developer mode** in the top right corner.
5. Click **Load unpacked** and select the folder where you extracted `dist.zip`.

### From Source (For Developers)

Requires [Node.js](https://nodejs.org/) v18+.

```bash
git clone https://github.com/kkonstantin08/linguapop-ai.git
cd linguapop-ai
npm install
npm run build
```
Load the generated `dist` folder into `chrome://extensions` via **Load unpacked**.

## ⚙️ Setting up your LLM

To use LinguaPop, you must configure your preferred AI provider in the settings.

1. Click on the LinguaPop extension icon in your browser toolbar to open the **Options Page**.
2. Navigate to the **"Провайдеры ИИ" (AI Providers)** tab.
3. Select your provider (OpenAI, Anthropic, Gemini, or Mistral) and paste your API key. Keys are stored securely in local browser storage.
4. **Recommended:** Enable "Chrome Built-in AI" in the Fallback section to ensure offline or quota-free backup translations.

## 🔒 Privacy & Security

**Your data stays yours.** 
LinguaPop only sends the text you actively choose to translate (or the page content when explicitly requested) directly to the AI provider you configured. 

* **Local Keys:** API Keys are stored locally and securely in your browser's `chrome.storage`.
* **Zero Telemetry:** The extension does not collect telemetry, analytics, or background tracking data.
* **Local Caching:** The translation cache is strictly local.

---

<div align="center">
  <em>Designed for a seamless multilingual web experience.</em>
</div>
