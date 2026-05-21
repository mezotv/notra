export interface VNode {
  type?: string;
  props?: Record<string, unknown> & {
    style?: Record<string, unknown>;
    children?: unknown;
  };
}
