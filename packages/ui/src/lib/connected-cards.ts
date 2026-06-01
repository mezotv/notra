import { CONNECTED_CARD_COLUMN_CLASSES } from "../constants/connected-cards";

export function getConnectedCardColumnClass(count: number) {
  return CONNECTED_CARD_COLUMN_CLASSES[count] ?? "sm:grid-cols-3";
}
