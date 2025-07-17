declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_OPEN_API_KEY: string;
      EXPO_PUBLIC_APP_URL: string;
      EXPO_PUBLIC_MCP_URL: string;
    }
  }
}

export {};
