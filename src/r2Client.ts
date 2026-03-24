import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { ObsHttpHandler } from "./obsHttpHandler";

export interface R2Config {
  accountId: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
}

function createClient(config: R2Config): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    requestHandler: new ObsHttpHandler(),
    // Custom streamCollector to handle cases where the SDK's default
    // streamCollector receives a Uint8Array/ArrayBuffer instead of a
    // ReadableStream (Electron cross-realm instanceof issues).
    streamCollector: async (stream: ReadableStream | ArrayBuffer | ArrayBufferView | Blob): Promise<Uint8Array> => {
      if (ArrayBuffer.isView(stream)) {
        return new Uint8Array(
          stream.buffer,
          stream.byteOffset,
          stream.byteLength
        );
      }
      if (stream instanceof ArrayBuffer) {
        return new Uint8Array(stream);
      }
      if (typeof Blob === "function" && stream instanceof Blob) {
        return new Uint8Array(await stream.arrayBuffer());
      }
      if (typeof stream.getReader === "function") {
        const reader = stream.getReader();
        const chunks: Uint8Array[] = [];
        let length = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            length += value.length;
          }
        }
        const result = new Uint8Array(length);
        let offset = 0;
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }
        return result;
      }
      return new Uint8Array();
    },
  });
}

export async function uploadToR2(
  config: R2Config,
  key: string,
  body: ArrayBuffer,
  contentType: string
): Promise<void> {
  const client = createClient(config);
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: new Uint8Array(body),
        ContentType: contentType,
      })
    );
  } catch (err: unknown) {
    const s3Err = err as { $metadata?: { httpStatusCode?: number }; message?: string };
    const status = s3Err?.$metadata?.httpStatusCode;
    if (status === 403) {
      throw new Error("Upload denied – check credentials and bucket permissions");
    }
    throw new Error(s3Err?.message || "Upload failed");
  } finally {
    client.destroy();
  }
}

export async function testConnection(config: R2Config): Promise<void> {
  const client = createClient(config);
  try {
    await client.send(
      new HeadBucketCommand({
        Bucket: config.bucketName,
      })
    );
  } catch (err: unknown) {
    const s3Err = err as { $metadata?: { httpStatusCode?: number }; message?: string };
    const status = s3Err?.$metadata?.httpStatusCode;
    if (status === 403) {
      throw new Error("Access denied – check credentials and bucket permissions");
    }
    if (status === 404) {
      throw new Error("Bucket not found – check Account ID and Bucket Name");
    }
    throw new Error(s3Err?.message || "Connection failed");
  } finally {
    client.destroy();
  }
}
