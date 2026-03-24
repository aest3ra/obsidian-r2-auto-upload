import { requestUrl, type RequestUrlParam } from "obsidian";
import type { HttpHandlerOptions } from "@smithy/types";

interface HttpRequest {
  protocol: string;
  hostname: string;
  port?: number;
  path: string;
  query?: Record<string, string | string[]>;
  headers: Record<string, string>;
  method: string;
  body?: ArrayBuffer | ArrayBufferView | string;
}

interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body?: ReadableStream<Uint8Array>;
}

/**
 * Custom HTTP handler that uses Obsidian's requestUrl API
 * to bypass CORS restrictions in Electron.
 * Implements the AWS SDK HttpHandler interface without
 * extending FetchHttpHandler to avoid stream conflicts.
 */
export class ObsHttpHandler {
  metadata = { handlerProtocol: "obs/requestUrl" };

  async handle(
    request: HttpRequest,
    _options?: HttpHandlerOptions
  ): Promise<{ response: HttpResponse }> {
    // Build URL
    let url = `${request.protocol}//${request.hostname}`;
    if (request.port) {
      url += `:${request.port}`;
    }
    url += request.path;
    if (request.query) {
      const qs = buildQueryString(request.query);
      if (qs) url += `?${qs}`;
    }

    // Process headers — remove host and content-length
    const headers: Record<string, string> = {};
    for (const [key, val] of Object.entries(request.headers)) {
      const lower = key.toLowerCase();
      if (lower === "host" || lower === "content-length") continue;
      headers[lower] = val;
    }

    // Process body
    let body: ArrayBuffer | string | undefined;
    if (request.body) {
      if (request.body instanceof ArrayBuffer) {
        body = request.body;
      } else if (ArrayBuffer.isView(request.body)) {
        const view = request.body;
        body = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
      } else if (typeof request.body === "string") {
        body = request.body;
      }
    }

    // Build Obsidian request
    const param: RequestUrlParam = {
      url,
      method: request.method,
      headers,
      contentType: headers["content-type"] || undefined,
      body: body,
      throw: false,
    };

    const resp = await requestUrl(param);

    // Convert response headers to lowercase
    const respHeaders: Record<string, string> = {};
    if (resp.headers) {
      for (const [key, val] of Object.entries(resp.headers)) {
        respHeaders[key.toLowerCase()] = val;
      }
    }

    // Build response body as ReadableStream — the format the AWS SDK
    // browser deserialization pipeline expects. Returning Uint8Array fails
    // because the SDK's collectBody instanceof check can fail in Electron,
    // causing it to fall through to streamCollector → collectStream →
    // stream.getReader() which breaks on non-stream types.
    let responseBody: ReadableStream<Uint8Array> | undefined;
    try {
      const ab = resp.arrayBuffer;
      if (ab && ab.byteLength > 0) {
        const bytes = new Uint8Array(ab);
        responseBody = new ReadableStream({
          start(controller) {
            controller.enqueue(bytes);
            controller.close();
          },
        });
      }
    } catch {
      // HEAD requests or empty responses may not have a body
    }

    return {
      response: {
        statusCode: resp.status,
        headers: respHeaders,
        body: responseBody,
      },
    };
  }

  destroy(): void {}
}

function buildQueryString(query: Record<string, string | string[]>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v != null) {
          parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
        }
      }
    } else if (value != null) {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  return parts.join("&");
}
