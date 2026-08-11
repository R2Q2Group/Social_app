import { createContext, useContext, useState, type ReactNode } from "react";
import type { ThumbnailDraft } from "@r2q2/ai-core";

interface DraftContextValue {
  idea: string;
  setIdea: (idea: string) => void;
  draft: ThumbnailDraft | null;
  setDraft: (draft: ThumbnailDraft | null) => void;
}

const DraftContext = createContext<DraftContextValue | null>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [idea, setIdea] = useState("");
  const [draft, setDraft] = useState<ThumbnailDraft | null>(null);

  return (
    <DraftContext.Provider value={{ idea, setIdea, draft, setDraft }}>
      {children}
    </DraftContext.Provider>
  );
}

/** Carries the idea text + last generated draft from the input screen to
 * the variants screen without stringifying a draft through a route param. */
export function useDraft(): DraftContextValue {
  const ctx = useContext(DraftContext);
  if (!ctx) {
    throw new Error("useDraft must be used within a DraftProvider");
  }
  return ctx;
}
