/**
 * cacheContext.ts — Shared React context for the Global Cache
 * Separated to satisfy: react-refresh/only-export-components
 */

import { createContext } from "react";
import type { CacheCtx } from "./GlobalCache";

export const CacheContext = createContext<CacheCtx | null>(null);