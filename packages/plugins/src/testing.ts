import { createBlobStorage } from "./helpers";
import { BlobData, BlobMetadata } from "./types";

export const createInMemoryBlobStorage = () => {
  const blobStorage = new Map<
    string,
    { data: BlobData; metadata: BlobMetadata }
  >();

  return createBlobStorage({
    put: async (id, data, metadata) => {
      blobStorage.set(id, { data, metadata: metadata as any });
    },
    delete: async (id) => {
      blobStorage.delete(id);
    },
    get: async (id) => {
      return blobStorage.get(id)?.data || null;
    },
    info: async (id) => {
      return blobStorage.get(id)?.metadata || null;
    },
  });
};
