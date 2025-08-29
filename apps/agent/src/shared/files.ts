import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { fetch } from "expo/fetch";

import { MessageContentComplex } from "@langchain/core/messages";

import { ChatMessage, toContents } from "./chat";

export type FileDefinition = {
  id: string;
  uri: string;
  name?: string;
  mimeType?: string;
};

export const serializeFiles = (
  files: FileDefinition[],
): ChatMessage["content"] => `Attached files: ${JSON.stringify(files)}`;

const parseFilesFromContent = (
  content: MessageContentComplex,
): FileDefinition[] => {
  if (content.type !== "text") return [];

  const [matches] = String(content.text)
    .matchAll(/Attached files: (.+)/g)
    .toArray();
  const match = matches?.at(1);
  if (!match) return [];

  try {
    const parsed = JSON.parse(match);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

export const parseFiles = (
  content: ChatMessage["content"],
): FileDefinition[] => {
  const files: FileDefinition[] = [];

  for (const c of toContents(content)) {
    files.push(...parseFilesFromContent(c));
  }

  return files;
};

/**
 * Universal way to upload multiple files to a remote server.
 * Uses expo-file-system under the hood for mobile platforms.
 *
 * @param {URL} location URL of upload route on a remote server
 * @param {string[]} uris Array of file URIs.
 * On mobile these should be local file uris and on web these should be base64 encoded data uris
 * @param {FileSystem.FileSystemUploadOptions} options Upload options
 * @returns {Promise<PromiseSettledResult<{body: string; status: number; }>[]>} Result of Promise.allSettled for every uri
 */
export const uploadFiles = (
  location: URL,
  uris: FileDefinition["uri"][],
  options: FileSystem.FileSystemUploadOptions,
): Promise<PromiseSettledResult<{ body: string; status: number }>[]> => {
  return Promise.allSettled(
    uris.map((uri) =>
      Platform.OS === "web"
        ? fetch(uri) // fetch base64 of the file to get blob
            .then((r) => r.blob())
            .then((blob) =>
              fetch(location.toString(), {
                method: options.httpMethod,
                body:
                  options.uploadType ===
                  FileSystem.FileSystemUploadType.MULTIPART
                    ? (() => {
                        const f = new FormData();
                        f.append(
                          (options as FileSystem.UploadOptionsMultipart)
                            .fieldName ?? "file",
                          blob,
                        );
                        return f;
                      })()
                    : blob,
                headers: {
                  ...options.headers,
                  "Content-Type":
                    options.uploadType ===
                    FileSystem.FileSystemUploadType.MULTIPART
                      ? "multipart/form-data"
                      : "application/octet-stream",
                },
              }),
            )
            .then(async (r) => ({
              body: await r.text(),
              status: r.status,
            }))
        : FileSystem.uploadAsync(location.toString(), uri, options).then(
            (r) => ({
              body: r.body,
              status: r.status,
            }),
          ),
    ),
  );
};
