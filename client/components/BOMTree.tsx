import { useMemo, useState } from "react";
import { useData } from "@/hooks/useData";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useSelection } from "@/context/SelectionContext";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createMinMaxNormalizer, actionHeuristics } from "@/lib/risk";
import { toCSV, downloadCSV } from "@/lib/csv";
import { OpenInMapButton, PlanDialog } from "./BOMTree.helpers";

type Row = { id: string; type: 'System'|'Subsystem'|'Component'|'Vendor'; name: string; parentId: string|null; lead: number; risk: number; alt: number; single: boolean; region: string; level: number };

export function BOMTree() {
  const { systems, subsystems, components, vendors } = useData();
  const { filters, updateFilters } = useSelection();
  const [leadTimeMin, setLeadTimeMin] = useState(0);
  const [region, setRegion] = useState("All");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [planOpen, setPlanOpen] = useState(false);

  const toggle = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));
  const selectOne = (id: string, on: boolean) => setSelected((s) => ({ ...s, [id]: on }));

  // Synthetic lead time/metrics for demo columns
  const fakeLead = (name: string) => 20 + (name.length % 12) * 7;
  const fakeRisk = (name: string) => (name.length * 7) % 100;
  const fakeAlt = (name: string) => (name.length % 3);
  const fakeRegion = (name: string) => ["US","DE","CN","MX","IN","JP"][name.length % 6];

  const rows = useMemo<Row[]>(() => {
    const r: Row[] = [];
    for (const sys of systems) {
      const sysLead = fakeLead(sys.name);
      const sysRisk = fakeRisk(sys.name);
      if (filters.riskTier !== 'All') {
        const tier = sysRisk <= 34 ? 'Low' : sysRisk <=59 ? 'Moderate' : sysRisk <=74 ? 'High' : 'Critical';
        if (tier !== filters.riskTier) continue;
      }
      r.push({ id: sys.id, type: 'System', name: sys.name, parentId: null, lead: sysLead, risk: sysRisk, alt: 2, single: false, region: '—', level: 0 });
      for (const sub of subsystems.filter(s => s.systemId === sys.id)) {
        const subLead = fakeLead(sub.name);
        const subRisk = fakeRisk(sub.name);
        r.push({ id: sub.id, type: 'Subsystem', name: sub.name, parentId: sys.id, lead: subLead, risk: subRisk, alt: 2, single: false, region: '—', level: 1 });
        for (const comp of components.filter(c => c.subsystemId === sub.id)) {
          const compLead = fakeLead(comp.name);
          const compRisk = fakeRisk(comp.name);
          const single = comp.name.length % 5 === 0;
          if (filters.showCriticalOnly && compRisk < 60) continue;
          if (leadTimeMin && compLead < leadTimeMin) continue;
          r.push({ id: comp.id, type: 'Component', name: comp.name, parentId: sub.id, lead: compLead, risk: compRisk, alt: fakeAlt(comp.name), single, region: fakeRegion(comp.name), level: 2 });
          for (const ven of vendors.slice(0, 2)) {
            const vLead = fakeLead(ven.name);
            const vRisk = fakeRisk(ven.name);
            const vRegion = ven.id.charCodeAt(0) % 2 ? 'US' : 'CN';
            r.push({ id: `${comp.id}-${ven.id}`, type: 'Vendor', name: ven.name, parentId: comp.id, lead: vLead, risk: vRisk, alt: 0, single: vRegion==='CN', region: vRegion, level: 3 });
          }
        }
      }
    }
    return r;
  }, [systems, subsystems, components, vendors, filters.showCriticalOnly, filters.riskTier, leadTimeMin]);

  const childrenOf = useMemo(() => {
    const map: Record<string, Row[]> = {};
    rows.forEach((row) => {
      if (!row.parentId) return;
      (map[row.parentId] ||= []).push(row);
    });
    return map;
  }, [rows]);

  const hasChildren = (row: Row) => !!childrenOf[row.id]?.length;
  const isVisible = (row: Row): boolean => {
    if (!row.parentId) return true;
    const parent = rows.find((r) => r.id === row.parentId);
    if (!parent) return true;
    return expanded[parent.id] && isVisible(parent);
  };

  const visibleRows = rows.filter(isVisible);
  const selectedCount = Object.values(selected).filter(Boolean).length;

  const openInNetwork = (row: Row) => {
    // Focus the map by selecting subsystem where possible
    const { components: comps, subsystems: subs } = useData(); // note: hooks can't be called here; handled below in render per-row
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-3 items-end mb-3">
        <div className="flex items-center gap-2">
          <Switch id="single-only" checked={filters.showCriticalOnly} onCheckedChange={(v) => updateFilters({ showCriticalOnly: v })} />
          <Label htmlFor="single-only">Single-source / High-risk only</Label>
        </div>
        <div>
          <Label htmlFor="lead">Lead time ≥</Label>
          <Input id="lead" type="number" className="w-28" value={leadTimeMin} onChange={(e) => setLeadTimeMin(parseInt(e.target.value||'0'))} />
        </div>
        <div>
          <Label htmlFor="region">Region</Label>
          <select id="region" className="border rounded-md h-10 px-3" value={region} onChange={(e) => setRegion(e.target.value)}>
            {['All','US','DE','CN','MX','IN','JP'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <Label htmlFor="tier">Risk tier</Label>
          <select id="tier" className="border rounded-md h-10 px-3" value={filters.riskTier} onChange={(e) => updateFilters({ riskTier: e.target.value as any })}>
            {['All','Low','Moderate','High','Critical'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <Button variant="secondary" className="ml-auto" disabled={selectedCount===0} onClick={() => setPlanOpen(true)}>Create Diversification Plan</Button>
      </div>
      <div role="treegrid" aria-label="BOM to Vendor Tree" className="rounded-md border overflow-hidden">
        <div className="grid grid-cols-10 gap-2 bg-muted/50 p-2 text-xs font-medium">
          <div>
            <input aria-label="select all" type="checkbox" checked={visibleRows.every(r => selected[r.id]) && visibleRows.length>0} onChange={(e) => {
              const on = e.target.checked;
              const patch: Record<string, boolean> = {};
              visibleRows.forEach(r => { patch[r.id] = on; });
              setSelected(s => ({ ...s, ...patch }));
            }} />
          </div>
          <div className="col-span-3">Name</div>
          <div>Type</div>
          <div>Single-Source?</div>
          <div>Lead Time (days)</div>
          <div>Region</div>
          <div>Risk</div>
          <div>Alt Vendors</div>
          <div>Actions</div>
        </div>
        <div className="divide-y">
          {visibleRows.map((row) => (
            <div key={row.id} role="row" className="grid grid-cols-10 gap-2 items-center p-2 text-sm">
              <div>
                <input aria-label={`select ${row.name}`} type="checkbox" checked={!!selected[row.id]} onChange={(e) => selectOne(row.id, e.target.checked)} />
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <button aria-label={expanded[row.id] ? "collapse" : "expand"} onClick={() => hasChildren(row) && toggle(row.id)} className="w-5 text-muted-foreground">
                  {hasChildren(row) ? (expanded[row.id] ? '−' : '+') : ''}
                </button>
                <span className="font-medium" style={{ paddingLeft: `${row.level * 12}px` }}>{row.name}</span>
                {row.type==='Component' && row.risk >= 70 && (<Badge variant="destructive">Critical</Badge>)}
              </div>
              <div>{row.type}</div>
              <div>{row.single ? 'Yes' : 'No'}</div>
              <div>{row.lead}</div>
              <div>{row.region}</div>
              <div>
                <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: row.risk>=75? 'hsl(var(--risk-critical))' : row.risk>=60? 'hsl(var(--risk-high))' : row.risk>=35? 'hsl(var(--risk-moderate))' : 'hsl(var(--risk-low))', color: 'white' }}>{row.risk}</span>
              </div>
              <div>{row.alt}</div>
              <div>
                <OpenInMapButton row={row} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <PlanDialog open={planOpen} onOpenChange={setPlanOpen} rows={rows.filter(r => selected[r.id])} />
    </div>
  );
}
