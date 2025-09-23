import { useMemo, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSelection } from "@/context/SelectionContext";
import { useData } from "@/hooks/useData";

export function NetworkMap() {
  const { systems, subsystems, components, vendors, relationships } = useData();
  const { filters, updateFilters, selectedSubsystemId, setSelectedSubsystemId } = useSelection();
  const [threshold, setThreshold] = useState(0.15);

  const laneX = { system: 160, subsystem: 420, component: 760, vendor: 1080 } as const;
  const spacing = { system: 64, subsystem: 52, component: 44, vendor: 44 } as const;

  const nodesByLevel = useMemo(() => {
    const sys = systems.map((s, i) => ({ ...s, x: laneX.system, y: 120 + i * spacing.system }));
    const sub = subsystems.map((s, i) => ({ ...s, x: laneX.subsystem, y: 100 + i * spacing.subsystem }));
    const cmp = components.map((c, i) => ({ ...c, x: laneX.component, y: 80 + i * spacing.component }));
    const ven = vendors.map((v, i) => ({ ...v, x: laneX.vendor, y: 80 + i * spacing.vendor }));
    return { system: sys, subsystem: sub, component: cmp, vendor: ven };
  }, [systems, subsystems, components, vendors]);

  const height = useMemo(() => {
    const counts = [nodesByLevel.system.length, nodesByLevel.subsystem.length, nodesByLevel.component.length, nodesByLevel.vendor.length];
    return Math.max(520, Math.max(...counts) * 48 + 140);
  }, [nodesByLevel]);

  const edges = useMemo(() => relationships.filter((e) => !filters.showCriticalOnly || e.weight >= threshold), [relationships, filters.showCriticalOnly, threshold]);

  const getPos = (type: string, id: string) => {
    const n = (nodesByLevel as any)[type]?.find((n: any) => n.id === id);
    return n ? { x: n.x, y: n.y } : { x: 0, y: 0 };
  };

  const edgeColor = (exclusivity: string) => {
    if (exclusivity === "single") return "#D92D20"; // red
    if (exclusivity === "dual") return "#F79009"; // amber
    return "#6366F1"; // indigo
  };

  const halo = (id: string) => relationships.filter((r) => r.toId === id).length >= 5;

  const search = filters.searchQuery.trim().toLowerCase();
  const matchesSearch = (name: string) => !search || name.toLowerCase().includes(search);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={filters.showCriticalOnly} onCheckedChange={(v) => updateFilters({ showCriticalOnly: v })} id="critical-only" />
            <Label htmlFor="critical-only">Show Critical Only</Label>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="thresh">Strength ≥</Label>
            <input id="thresh" className="w-28 accent-indigo-500" type="range" min={0} max={0.6} step={0.05} value={threshold} onChange={(e) => setThreshold(parseFloat(e.target.value))} />
            <span className="text-xs text-muted-foreground">{Math.round(threshold * 100)}%</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Badge className="bg-[hsl(var(--risk-critical))]/10 text-[hsl(var(--risk-critical))]">Single-source</Badge>
            <Badge className="bg-[hsl(var(--risk-moderate))]/10 text-[hsl(var(--risk-moderate))]">Dual-source ≥65%</Badge>
            <Badge className="bg-primary/10 text-primary">Balanced</Badge>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">Arrowheads show flow · thickness = strength</div>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg className="w-full bg-[hsl(var(--panel))] rounded-md border shadow-panel" viewBox={`0 0 1220 ${height}`} role="img" aria-label="Supply Chain Network Map">
          <defs>
            {/* small, crisp arrowhead */}
            <marker id="arrow" viewBox="0 0 8 8" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
            </marker>
            {/* subtle halo */}
            <filter id="halo" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Column headers */}
          {[
            { x: laneX.system, t: "System" },
            { x: laneX.subsystem, t: "Subsystem" },
            { x: laneX.component, t: "Component" },
            { x: laneX.vendor, t: "Vendor" },
          ].map((h) => (
            <g key={h.t} transform={`translate(${h.x - 40}, 40)`}>
              <rect width="120" height="28" rx="8" fill="hsl(var(--bg-alt))" stroke="hsl(var(--border))" />
              <text x="60" y="19" textAnchor="middle" fontSize="12" fill="#334155">{h.t}</text>
            </g>
          ))}

          {/* Anchor schematic of turbine (left) */}
          <g transform="translate(20,80)">
            {["Inlet","Compressor","Combustor","Turbine","Exhaust","Generator","Fuel System","Lube & Cooling"].map((seg, i) => (
              <g key={seg} transform={`translate(0, ${i * 24})`}>
                <rect x={0} y={0} width={140} height={18} rx={6} fill={i % 2 ? "hsl(var(--accent))" : "hsl(var(--bg-alt))"} stroke="hsl(var(--border))" />
                <text x={8} y={13} fontSize={11} fill="#334155">{seg}</text>
              </g>
            ))}
          </g>

          {/* Edges (simple straight lines with small arrowheads) */}
          {edges.map((e, idx) => {
            const from = getPos(e.fromType, e.fromId);
            const to = getPos(e.toType, e.toId);
            const color = edgeColor(e.exclusivity);
            const thick = Math.max(1, 1 + e.weight * 5); // thinner range
            const faded = !!(selectedSubsystemId && !(e.fromType === "subsystem" && e.fromId === selectedSubsystemId));
            return (
              <line
                key={idx}
                x1={from.x + 18}
                y1={from.y}
                x2={to.x - 18}
                y2={to.y}
                stroke={color}
                strokeWidth={thick}
                strokeLinecap="round"
                style={{ color }}
                markerEnd="url(#arrow)"
                opacity={faded ? 0.25 : 0.9}
              />
            );
          })}

          {/* Nodes (small circles, simple) */}
          {["system", "subsystem", "component", "vendor"].map((level) => (
            <g key={level}>
              {(nodesByLevel as any)[level]?.map((n: any) => {
                const muted = search && !matchesSearch(n.name);
                const fill = level === "vendor" ? "#0EA5E9" : level === "component" ? "#A78BFA" : level === "subsystem" ? "#22C55E" : "#64748B";
                const r = level === "system" ? 8 : 7;
                return (
                  <Tooltip key={n.id}>
                    <TooltipTrigger asChild>
                      <g transform={`translate(${n.x}, ${n.y})`} className={muted ? "opacity-30" : "opacity-100"}>
                        <circle r={r} fill={fill} stroke="#fff" strokeWidth={2} filter={halo(n.id) ? "url(#halo)" : undefined} />
                        <text x={12} y={4} fontSize={11} fill="#334155">{n.name}</text>
                        {level === "subsystem" && (
                          <rect x={-10} y={-10} width={20} height={20} rx={6} fill="transparent" stroke={selectedSubsystemId === n.id ? "#111827" : "transparent"} strokeWidth={selectedSubsystemId === n.id ? 2 : 0} onClick={() => setSelectedSubsystemId(selectedSubsystemId === n.id ? null : n.id)} />
                        )}
                      </g>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        <div className="font-semibold">{n.name}</div>
                        <div>Type: {level}</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </g>
          ))}
        </svg>
      </div>

      {selectedSubsystemId && (
        <div className="mt-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Context:</span> All Systems ▸ {subsystems.find((s) => s.id === selectedSubsystemId)?.name || ""}
          <button className="underline ml-2" onClick={() => setSelectedSubsystemId(null)}>Clear</button>
        </div>
      )}
    </div>
  );
}
