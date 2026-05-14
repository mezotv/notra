import { buildSceneFromElement } from "./dom-to-scene";
import {
  ByteWriter,
  encodeDefinition,
  findDefinition,
  parseSchema,
} from "./kiwi";
import { packBuffer, packHtml } from "./packer";
import { getSchemaBytes } from "./schema";

export { buildSceneFromElement } from "./dom-to-scene";
export type { Definition, FieldDef, KiwiValue } from "./kiwi";
export {
  ByteReader,
  ByteWriter,
  decodeDefinition,
  encodeDefinition,
  findDefinition,
  parseSchema,
} from "./kiwi";
export type { FigmaMetadata } from "./packer";
export { packBuffer, packHtml, unpackBuffer, unpackHtml } from "./packer";
export type {
  AddFrameOptions,
  AddTextOptions,
  Color,
  Guid,
  RGBA,
  SceneNode,
  SolidFill,
  Transform,
} from "./scene-builder";
export {
  positionFor,
  SceneBuilder,
  solidFill,
  transformAt,
} from "./scene-builder";
export { getSchemaBytes } from "./schema";

export async function buildFigmaPasteHtml(
  element: HTMLElement
): Promise<string> {
  const schemaBytes = getSchemaBytes();
  const defs = parseSchema(schemaBytes);
  const messageIdx = findDefinition(defs, "Message");

  const sb = buildSceneFromElement(element);
  const message = sb.toMessage();

  const writer = new ByteWriter();
  encodeDefinition(writer, message, messageIdx, defs);
  const dataBytes = writer.get();

  const buffer = await packBuffer(schemaBytes, dataBytes);
  return packHtml(
    { fileKey: "html-to-figma", pasteID: sb.pasteID, dataType: "scene" },
    buffer
  );
}

export async function copyAsFigma(element: HTMLElement): Promise<void> {
  const html = await buildFigmaPasteHtml(element);
  const blob = new Blob([html], { type: "text/html" });
  const item = new ClipboardItem({ "text/html": blob });
  await navigator.clipboard.write([item]);
}
