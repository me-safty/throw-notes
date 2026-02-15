import { ConvexReactClient } from "convex/react";

export function createConvexClient(url: string) {
  return new ConvexReactClient(url);
}
