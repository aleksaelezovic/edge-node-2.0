import * as ExpoCrypto from "expo-crypto";

const crypto = {
  ...ExpoCrypto,
  subtle: {
    async digest(alg: ExpoCrypto.CryptoDigestAlgorithm, data: BufferSource) {
      return ExpoCrypto.digest(alg, data);
    },
  },
} as unknown as Crypto;
if (typeof globalThis.crypto !== "object") {
  globalThis.crypto = crypto as any;
}
if (typeof global.crypto !== "object") {
  global.crypto = crypto as any;
}

URL.canParse = function (url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
