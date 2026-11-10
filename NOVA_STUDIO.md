# NOVA Studio — interface and language upgrade

The same NOVA app now runs as a responsive website and as an installable **Progressive Web App** (PWA).

## New interface

- Refined, original NOVA design: minimal sidebar, focused chat, composed messages, clean model picker, small status badge, soft animation and professional typography.
- On desktop, the **Focus** button hides/restores the Artifacts workspace. On mobile, the navigation switches among chat, Files, conversations and Settings.
- Generated files can be previewed in a sandbox, edited, revisited from the local gallery and exported as ZIP.
- The assistant shows visible **actual activity steps** for NOVA Native (normalization, neural intent classification, project generation and saved files). It does not reveal hidden private model reasoning or pretend to execute terminal commands.
- Real loading indicators, message entry motion that does not restart every streamed chunk, keyboard shortcuts, and reduced-motion accessibility.

## Better settings

Under **Settings → Interface & accessibility**:

| Setting | Options |
|---|---|
| Chat spacing | Comfortable, compact |
| Animations | System accessibility settings, subtle, smooth, off |
| Slang assistance | Enable/disable local interpretation for NOVA Native |
| Work steps | Show/hide real activity log |

Existing Settings retain model selection, response length, reasoning level for hosted models, voice and spoken playback, theme (dark/light/system), memory notes, usage goals, privacy controls, and backend diagnostics.

Keyboard shortcuts on desktop: **Ctrl/Cmd+K** opens conversation search, **Ctrl/Cmd+/** focuses the composer, **Ctrl/Cmd+Shift+O** starts a conversation, **Ctrl/Cmd+.** toggles chat focus mode.

## Natural-language assistance

[`nova-language.js`](nova-language.js) is an original, entirely local **interpretation adapter** for NOVA Native. It expands a curated set of informal spellings and abbreviations (for example `u` → `you`, `pls` → `please`, `wesbite` → `website`), catches common misspellings of supported task words, and recognizes task phrases.

When it changes a message, the app can show what it interpreted and records that operation in the optional activity log. If text is too unclear, it asks for clarification rather than inventing a meaning. This is *not* a new language-model checkpoint or proof of understanding all slang/dialects.

The original 50,033-parameter NOVA Native neural network still handles task recognition; local tools build the actual files. The interpreter is additional deterministic logic. Native's usable local starter projects include websites, portfolios, to-do lists, notes apps, timers, calculators, dashboards, clicker games **and quizzes**.

**Automated checks:** `node tests/nova_studio.cjs` verifies the user interface, assets, supported slang requests, conservative gibberish fallback, generated JavaScript syntax and Artifacts.

## Installation

- **iPhone/iPad:** Open https://exclusive2knight.github.io/NOVA-AI/ in Safari, tap **Share → Add to Home Screen**.
- **Android:** Open NOVA in Chrome, use **Install app** / **Add to Home Screen**.
- **Laptop:** Use a compatible browser's app installation control or continue using the website.

The installed PWA is not an App Store/Play Store binary. The local NOVA Native model and its trained checkpoint are cached for offline use once downloaded. Some browser functions (like speech recognition) depend on browser support and permission.

## Boundaries

The interface and language adapter improve workflow and supported task recognition. They do not give NOVA unlimited memory, a billion-token context window, real cloud-computer abilities, or frontier-level reasoning. Hosted AI models still require separate Cloudflare deployment and passcode and may be subject to quota.
