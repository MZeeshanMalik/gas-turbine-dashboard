import { createContext, useContext, useMemo, useState } from "react";

export type SelectionState = {
  selectedSubsystemId: string | null;
  highlightedRegionCode: string | null;
  lassoSelectionIds: string[]; // entity ids selected in quadrant
  filters: {
    showCriticalOnly: boolean;
    searchQuery: string;
    riskTier: ("Low"|"Moderate"|"High"|"Critical"|"All");
  };
};

export type SelectionContextType = SelectionState & {
  setSelectedSubsystemId: (id: string | null) => void;
  setHighlightedRegionCode: (code: string | null) => void;
  setLassoSelectionIds: (ids: string[]) => void;
  updateFilters: (patch: Partial<SelectionState["filters"]>) => void;
  reset: () => void;
};

const SelectionContext = createContext<SelectionContextType | null>(null);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<string | null>(null);
  const [highlightedRegionCode, setHighlightedRegionCode] = useState<string | null>(null);
  const [lassoSelectionIds, setLassoSelectionIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<SelectionState["filters"]>({
    showCriticalOnly: false,
    searchQuery: "",
    riskTier: "All",
  });

  const value = useMemo<SelectionContextType>(() => ({
    selectedSubsystemId,
    highlightedRegionCode,
    lassoSelectionIds,
    filters,
    setSelectedSubsystemId,
    setHighlightedRegionCode,
    setLassoSelectionIds,
    updateFilters: (patch) => setFilters((f) => ({ ...f, ...patch })),
    reset: () => {
      setSelectedSubsystemId(null);
      setHighlightedRegionCode(null);
      setLassoSelectionIds([]);
      setFilters({ showCriticalOnly: false, searchQuery: "", riskTier: "All" });
    }
  }), [selectedSubsystemId, highlightedRegionCode, lassoSelectionIds, filters]);

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection must be used within SelectionProvider");
  return ctx;
}
