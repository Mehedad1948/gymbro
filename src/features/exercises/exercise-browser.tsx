"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { distinct, searchCatalog } from "@/infra/catalog/catalog";
import { useCatalog } from "@/infra/catalog/use-catalog";
import { thumbUrl } from "@/infra/catalog/media";
import { Card, Empty, Input, Select, Spinner } from "@/shared/ui";

export function ExerciseBrowser() {
  const state = useCatalog();
  const [q, setQ] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [equipment, setEquipment] = useState("");

  const catalog = state.status === "ready" ? state.catalog : undefined;
  const results = useMemo(() => (catalog ? searchCatalog(catalog, { q, bodyPart, equipment }) : []), [catalog, q, bodyPart, equipment]);

  if (state.status === "loading") return <Spinner label="Loading exercise catalog…" />;
  if (state.status === "error") return <Empty title="Catalog unavailable" hint={`Run \`npm run catalog:build\` (${state.error})`} />;

  return (
    <div className="space-y-3">
      <Input placeholder="Search 1,300+ exercises…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <div className="flex gap-2">
        <Select value={bodyPart} onChange={(e) => setBodyPart(e.target.value)} className="flex-1">
          <option value="">Any body part</option>
          {distinct(catalog!, "bodyPart").map((b) => (
            <option key={b}>{b}</option>
          ))}
        </Select>
        <Select value={equipment} onChange={(e) => setEquipment(e.target.value)} className="flex-1">
          <option value="">Any equipment</option>
          {distinct(catalog!, "equipment").map((b) => (
            <option key={b}>{b}</option>
          ))}
        </Select>
      </div>

      {results.length === 0 ? (
        <Empty title="No matches" />
      ) : (
        <ul className="grid grid-cols-1 gap-2">
          {results.map((e) => (
            <li key={e.id}>
              <Link href={`/exercises/${e.id}`}>
                <Card className="flex items-center gap-3 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote dataset media, cached by the SW */}
                  <img src={thumbUrl(e)} alt="" width={56} height={56} loading="lazy" className="size-14 shrink-0 rounded-lg bg-white object-cover" />
                  <div className="min-w-0">
                    <p className="truncate font-medium capitalize">{e.name}</p>
                    <p className="truncate text-xs text-muted">
                      {e.target} · {e.equipment}
                    </p>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="text-center text-[11px] text-muted">{catalog!.attribution}</p>
    </div>
  );
}
