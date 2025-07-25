declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_APP_URL: string;
      EXPO_PUBLIC_MCP_URL: string;
      DATABASE_URL: string;
      OPEN_API_KEY: string;
      PORT: string;
    }
  }
}

export {};
