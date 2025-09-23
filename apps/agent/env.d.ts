declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_APP_URL: string;
      EXPO_PUBLIC_MCP_URL: string;
      DATABASE_URL: string;
      OPENAI_API_KEY: string;
      PORT: string;
      DKG_PUBLISH_WALLET: string;
      DKG_BLOCKCHAIN: string;
      DKG_OTNODE_URL: string;
      SMTP_HOST: string;
      SMTP_PORT: string;
      SMTP_USER: string;
      SMTP_PASS: string;
      SMTP_SECURE?: string;
      SMTP_FROM: string;
    }
  }
}

export {};
