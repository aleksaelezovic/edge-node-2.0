import type express from "express";
export type { express };

export type BlobMetadata = {
  name: string;
  mimeType?: string;
  lastModified?: Date;
  size?: number;
};

export interface BlobStorage {
  generateId: (metadata: BlobMetadata) => Promise<string> | string;
  info: (id: string) => Promise<BlobMetadata | null>;
  exists: (id: string) => Promise<boolean>;
  get: (id: string) => Promise<{ data: Blob; metadata: BlobMetadata } | null>;
  create: (
    data: Blob,
    metadata: Omit<BlobMetadata, "lastModified" | "size">,
  ) => Promise<{ id: string }>;
  put: (
    id: string,
    data: Blob,
    metadata: Omit<BlobMetadata, "lastModified" | "size">,
  ) => Promise<void>;
  delete: (id: string) => Promise<void>;
}
