/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CAPTCHA_INTERVAL_MINUTES?: string;
  readonly VITE_CAPTCHA_MAX_ATTEMPTS?: string;
  readonly VITE_CAPTCHA_TIMEOUT_SECONDS?: string;
  readonly VITE_FACE_VERIFY_INTERVAL_MINUTES?: string;
  readonly VITE_IMGBB_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

