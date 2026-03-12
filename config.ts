// API key from env (VITE_GEMINI_API_KEY); optional model (VITE_GEMINI_DEFAULT_MODEL)
export const APP_CONFIG = {
  DEFAULT_API_KEY:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_API_KEY) ||
    "",
  DEFAULT_MODEL:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_DEFAULT_MODEL) ||
    "gemini-2.5-flash",
};
