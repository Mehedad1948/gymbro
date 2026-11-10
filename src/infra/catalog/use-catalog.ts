"use client";

import { useEffect, useState } from "react";
import type { Catalog } from "@/domain/exercise/types";
import { loadCatalog } from "./catalog";

export type CatalogState =
  | { status: "loading" }
  | { status: "ready"; catalog: Catalog }
  | { status: "error"; error: string };

export function useCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>({ status: "loading" });
  useEffect(() => {
    let alive = true;
    loadCatalog()
      .then((catalog) => alive && setState({ status: "ready", catalog }))
      .catch((e: Error) => alive && setState({ status: "error", error: e.message }));
    return () => {
      alive = false;
    };
  }, []);
  return state;
}
