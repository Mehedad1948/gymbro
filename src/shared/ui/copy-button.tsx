"use client";

import { useState } from "react";
import { CopyCheckIcon, CopyIcon } from "@solar-icons/react/linear";
import { Button } from "./index";

/** Copies `text` to the clipboard and confirms for two seconds. */
export function CopyButton({ text, label = "کپی", className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* clipboard unavailable (http, old browser): the text stays selectable */
        }
      }}
    >
      {copied ? (
        <>
          <CopyCheckIcon size={18} /> کپی شد
        </>
      ) : (
        <>
          <CopyIcon size={18} /> {label}
        </>
      )}
    </Button>
  );
}
