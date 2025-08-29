// Works only in node.js!
import fs from "fs";
import path from "path";
import { BlobStorage } from "@dkg/plugins/types";
import { createBlobStorage } from "@dkg/plugins/helpers";

const createFsBlobStorage = (blobsDirectory: string): BlobStorage =>
  createBlobStorage({
    info: (id) =>
      fs.promises
        .stat(path.join(blobsDirectory, id))
        .then((stats) => ({
          size: stats.size,
          lastModified: stats.mtime,
        }))
        .catch(() => null),
    put: (id, content /* , _metadata */) => {
      const blobPath = path.join(blobsDirectory, id);
      const blobStream = fs.createWriteStream(blobPath);
      blobStream.write(content);
      blobStream.end();
      return new Promise((resolve, reject) => {
        blobStream.on("finish", resolve);
        blobStream.on("error", reject);
      });
    },
    get: async (id) => {
      const content = await fs.promises.readFile(path.join(blobsDirectory, id));
      return new Blob([content]);
    },
    delete: (id) => fs.promises.unlink(path.join(blobsDirectory, id)),
  });

export default createFsBlobStorage;
