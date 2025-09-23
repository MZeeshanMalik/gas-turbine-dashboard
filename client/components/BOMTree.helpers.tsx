import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSelection } from "@/context/SelectionContext";
import { useData } from "@/hooks/useData";
import { createMinMaxNormalizer, actionHeuristics, type EntityMetrics } from "@/lib/risk";
import { toCSV, downloadCSV } from "@/lib/csv";

export type Row = { id: string; type: 'System'|'Subsystem'|'Component'|'Vendor'; name: string; parentId: string|null; lead: number; risk: number; alt: number; single: boolean; region: string; level: number };

export function OpenInMapButton({ row }: { row: Row }) {
  const { setSelectedSubsystemId } = useSelection();
  const { components, subsystems } = useData();
  const onClick = () => {
    let subsystemId: string | null = null;
    if (row.type === 'Subsystem') subsystemId = row.id;
    if (row.type === 'Component') {
      const comp = components.find((c) => c.id === row.id);
      subsystemId = comp?.subsystemId || null;
    }
    if (row.type === 'Vendor') {
      // parent is component id
      const compId = row.parentId || null;
      const comp = components.find((c) => c.id === compId);
      subsystemId = comp?.subsystemId || null;
    }
    if (row.type === 'System') {
      const sub = subsystems.find((s) => s.systemId === row.id);
      subsystemId = sub?.id || null;
    }
    if (subsystemId) setSelectedSubsystemId(subsystemId);
    const el = document.getElementById('network-map');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return <Button variant="outline" size="sm" onClick={onClick}>Open in Network Map</Button>;
}

export function PlanDialog({ open, onOpenChange, rows }: { open: boolean; onOpenChange: (o: boolean) => void; rows: Row[] }) {
  const normalize = useMemo(() => createMinMaxNormalizer(rows.map(r => r.lead)), [rows]);
  const plan = rows.map((r) => {
    const m: EntityMetrics = {
      id: r.id,
      complexity_score: Math.min(100, 40 + (r.name.length % 10) * 6),
      robustness_score: Math.max(0, 100 - r.risk),
      lead_time_days: r.lead,
      single_source_flag: r.single,
      alt_vendor_count: r.alt,
      geographic_concentration_index: r.region === 'CN' ? 0.8 : r.region === 'DE' ? 0.4 : 0.3,
      spend_share: 0.2,
      criticality_score: r.risk,
    };
    const actions = actionHeuristics(m, r.risk);
    return { ...r, actions };
  });

  const exportCSV = () => {
    const csv = toCSV(plan.map(p => ({ id: p.id, name: p.name, type: p.type, lead: p.lead, risk: p.risk, single: p.single, alt: p.alt, region: p.region, actions: p.actions.join(' | ') })));
    downloadCSV(csv, 'diversification_plan.csv');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Diversification Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[50vh] overflow-auto">
          {plan.length === 0 ? (
            <div className="text-sm text-muted-foreground">No rows selected.</div>
          ) : (
            plan.map((p) => (
              <div key={p.id} className="p-2 border rounded-md">
                <div className="text-sm font-medium">{p.name} <span className="text-muted-foreground">({p.type})</span></div>
                <div className="text-xs text-muted-foreground">Risk {p.risk} · Lead {p.lead}d · {p.single ? 'Single-source' : 'Multi-source'} · Alts {p.alt} · {p.region}</div>
                <ul className="mt-1 list-disc list-inside text-xs">
                  {p.actions.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={exportCSV} disabled={plan.length===0}>Export CSV</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
