const MAGIC = new Uint8Array([
  0x66, 0x69, 0x67, 0x2d, 0x6b, 0x69, 0x77, 0x69, 0x6a,
]);
const PADDING = new Uint8Array([0x00, 0x00, 0x00]);

const META_RE =
  /data-metadata="&lt;!--\(figmeta\)([A-Za-z0-9+/=]+)\(\/figmeta\)--&gt;"/;
const BUFFER_RE =
  /data-buffer="&lt;!--\(figma\)([A-Za-z0-9+/=]+)\(\/figma\)--&gt;"/;

export interface FigmaMetadata {
  fileKey: string;
  pasteID: number;
  dataType: string;
}

async function deflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as unknown as BlobPart])
    .stream()
    .pipeThrough(new CompressionStream("deflate-raw"));
  const out = await new Response(stream).arrayBuffer();
  return new Uint8Array(out);
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as unknown as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  const out = await new Response(stream).arrayBuffer();
  return new Uint8Array(out);
}

function startsWith(buf: Uint8Array, prefix: Uint8Array, offset = 0): boolean {
  if (buf.length - offset < prefix.length) {
    return false;
  }
  for (let i = 0; i < prefix.length; i += 1) {
    if (buf[offset + i] !== prefix[i]) {
      return false;
    }
  }
  return true;
}

export async function packBuffer(
  schemaBytes: Uint8Array,
  dataBytes: Uint8Array
): Promise<Uint8Array> {
  const schemaDeflated = await deflateRaw(schemaBytes);
  const dataDeflated = await deflateRaw(dataBytes);

  const total =
    MAGIC.length +
    PADDING.length +
    4 +
    schemaDeflated.length +
    4 +
    dataDeflated.length;
  const out = new Uint8Array(total);
  let pos = 0;

  out.set(MAGIC, pos);
  pos += MAGIC.length;
  out.set(PADDING, pos);
  pos += PADDING.length;

  const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
  view.setUint32(pos, schemaDeflated.length, true);
  pos += 4;
  out.set(schemaDeflated, pos);
  pos += schemaDeflated.length;

  view.setUint32(pos, dataDeflated.length, true);
  pos += 4;
  out.set(dataDeflated, pos);
  pos += dataDeflated.length;

  return out;
}

export async function unpackBuffer(
  buf: Uint8Array
): Promise<{ schema: Uint8Array; data: Uint8Array }> {
  if (!startsWith(buf, MAGIC)) {
    throw new Error("not a fig-kiwij buffer");
  }
  if (!startsWith(buf, PADDING, MAGIC.length)) {
    throw new Error("unexpected padding");
  }

  let pos = MAGIC.length + PADDING.length;
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const chunks: Uint8Array[] = [];

  while (pos < buf.length) {
    const length = view.getUint32(pos, true);
    pos += 4;
    const compressed = buf.subarray(pos, pos + length);
    if (compressed.length !== length) {
      throw new Error(
        `chunk underrun at pos ${pos}: need ${length}, got ${compressed.length}`
      );
    }
    const inflated = await inflateRaw(compressed);
    chunks.push(inflated);
    pos += length;
  }
  if (pos !== buf.length) {
    throw new Error(`trailing bytes: pos=${pos} len=${buf.length}`);
  }
  const [schema, data] = chunks;
  if (!schema || !data) {
    throw new Error(`expected 2 chunks, got ${chunks.length}`);
  }

  return { schema, data };
}

function base64Encode(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x80_00;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

function base64Decode(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export function packHtml(
  metadata: FigmaMetadata,
  buffer: Uint8Array,
  label = "Paste from divriots"
): string {
  const metaJson = JSON.stringify(metadata);
  const metaBytes = new TextEncoder().encode(metaJson);
  const metaB64 = base64Encode(metaBytes);
  const bufB64 = base64Encode(buffer);

  return (
    `<meta charset='utf-8'>` +
    `<html><head><meta charset="utf-8"></head><body>` +
    `<span data-metadata="&lt;!--(figmeta)${metaB64}(/figmeta)--&gt;"></span>` +
    `<span data-buffer="&lt;!--(figma)${bufB64}(/figma)--&gt;"></span>` +
    `<span style="white-space:pre-wrap;">${label}</span>` +
    "</body></html>"
  );
}

export function unpackHtml(html: string): {
  metadata: FigmaMetadata;
  buffer: Uint8Array;
} {
  const metaMatch = META_RE.exec(html);
  const bufMatch = BUFFER_RE.exec(html);
  const metaB64 = metaMatch?.[1];
  const bufB64 = bufMatch?.[1];
  if (!metaB64 || !bufB64) {
    throw new Error("Could not find figma metadata/buffer in HTML");
  }
  const metaBytes = base64Decode(metaB64);
  const metadata: FigmaMetadata = JSON.parse(
    new TextDecoder().decode(metaBytes)
  );
  const buffer = base64Decode(bufB64);
  return { metadata, buffer };
}
