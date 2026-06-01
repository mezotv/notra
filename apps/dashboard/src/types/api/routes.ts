export interface RouteContext<TParams extends Record<string, string>> {
  params: Promise<TParams>;
}
