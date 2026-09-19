// js/ai-config.js — DeepSeek config for the in-gallery AI sprite (Pip).
// Key reused from the TED course assistant (considerate-learning/js/config.js).
// NOTE: client-side key = same private-study caveat as the TED project;
// proxy through a backend before any public deployment.
window.DEEPSEEK_CONFIG = {
  "apiKey": "PASTE_YOUR_DEEPSEEK_API_KEY_HERE",
  "model": "deepseek-v4-flash",
  "endpoint": "https://api.deepseek.com/chat/completions",
  "temperature": 0.5,
  "maxTokens": 1200
};
