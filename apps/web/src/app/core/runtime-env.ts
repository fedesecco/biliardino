export interface RuntimeEnvironment {
  supabaseUrl: string;
  supabasePublishableKey: string;
}

declare global {
  interface Window {
    __BILIARDINO_ENV__?: Partial<RuntimeEnvironment>;
  }
}

export function readRuntimeEnvironment(): RuntimeEnvironment | null {
  const environment = window.__BILIARDINO_ENV__;
  const supabaseUrl = environment?.supabaseUrl?.trim() ?? '';
  const supabasePublishableKey =
    environment?.supabasePublishableKey?.trim() ?? '';

  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  return { supabaseUrl, supabasePublishableKey };
}
