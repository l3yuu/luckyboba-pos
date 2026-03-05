/**
 * useCache.ts — Hook for the Global Cache
 * Separated from globalCache.tsx to satisfy react-refresh/only-export-components
 *
 * Usage: import { useCache } from "../../useCache"
 */

import { useContext } from "react";
import { CacheContext } from "./CacheContext";
import type { CacheCtx } from "./GlobalCache";

export function useCache(): CacheCtx {
  const ctx = useContext(CacheContext);
  if (!ctx) throw new Error("useCache() must be used inside <CacheProvider>");
  return ctx;
}