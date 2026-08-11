import { createContext, useContext, useState, type ReactNode } from "react";
import type { CarouselDraft } from "@r2q2/ai-core";

interface DraftContextValue {
  idea: string;
  setIdea: (idea: string) => void;
  draft: CarouselDraft | null;
  setDraft: (draft: CarouselDraft | null) => void;
}

const DraftContext = createContext<DraftContextValue | null>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [idea, setIdea] = useState("");
  const [draft, setDraft] = useState<CarouselDraft | null>(null);

  return (
    <DraftContext.Provider value={{ idea, setIdea, draft, setDraft }}>
      {children}
    </DraftContext.Provider>
  );
}

/** Carries the idea text + last generated draft from the input screen to
 * the preview screen without stringifying a draft through a route param. */
export function useDraft(): DraftContextValue {
  const ctx = useContext(DraftContext);
  if (!ctx) {
    throw new Error("useDraft must be used within a DraftProvider");
  }
  return ctx;
}
