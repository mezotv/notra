export const MAGIC = new Uint8Array([
  0x66, 0x69, 0x67, 0x2d, 0x6b, 0x69, 0x77, 0x69, 0x6a,
]);

export const PADDING = new Uint8Array([0x00, 0x00, 0x00]);

export const META_RE =
  /data-metadata="&lt;!--\(figmeta\)([A-Za-z0-9+/=]+)\(\/figmeta\)--&gt;"/;

export const BUFFER_RE =
  /data-buffer="&lt;!--\(figma\)([A-Za-z0-9+/=]+)\(\/figma\)--&gt;"/;
