let loaded = false;

export function env(key: string): string | undefined {
  if (!loaded && import.meta.env.DEV) {
    loaded = true;
    try {
      process.loadEnvFile('.env');
    } catch {
      /* no local .env */
    }
  }
  return process.env[key] || undefined;
}
