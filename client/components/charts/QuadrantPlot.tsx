import { useMemo, useRef, useState } from "react";
import {
  ScatterChart, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Scatter, ResponsiveContainer, ZAxis, ReferenceLine, ReferenceArea,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { downloadCSV, toCSV } from "@/lib/csv";
import { useSelection } from "@/context/SelectionContext";
import { riskTier } from "@/lib/risk";

export type QuadrantPoint = {
  id: string;
  name: string;
  type: "component" | "vendor";
  complexity: number; // X
  robustness: number; // Y (higher is safer)
  impact: number; // size
  vendorCount?: number;
  singleSource?: boolean;
  suggestedAction?: string;
  riskScore: number;
};

export function QuadrantPlot({ points }: { points: QuadrantPoint[] }) {
  const { setLassoSelectionIds } = useSelection();
  const [mode, setMode] = useState<"component"|"vendor">("component");
  const [area, setArea] = useState<{x1:number, y1:number, x2:number, y2:number} | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => points.filter(p => p.type === mode), [points, mode]);

  const colorFor = (score: number) => {
    const t = riskTier(score);
    if (t === 'Low') return 'hsl(var(--risk-low))';
    if (t === 'Moderate') return 'hsl(var(--risk-moderate))';
    if (t === 'High') return 'hsl(var(--risk-high))';
    return 'hsl(var(--risk-critical))';
  };

  const onMouseDown = (_: any, e: any) => setArea({ x1: e.activeLabel ?? 0, y1: e.chartY ?? 0, x2: e.activeLabel ?? 0, y2: e.chartY ?? 0});
  const onMouseMove = (_: any, e: any) => {
    if (!area) return;
    setArea((a) => a && { ...a, x2: e.activeLabel ?? 0, y2: e.chartY ?? 0 });
  };
  const onMouseUp = () => {
    if (!area) return;
    const xMin = Math.min(area.x1, area.x2);
    const xMax = Math.max(area.x1, area.x2);
    const yMin = Math.min(area.y1, area.y2);
    const yMax = Math.max(area.y1, area.y2);
    const inArea = filtered.filter(p => p.complexity >= xMin && p.complexity <= xMax && (100 - p.robustness) >= yMin && (100 - p.robustness) <= yMax);
    setLassoSelectionIds(inArea.map(p => p.id));
    setArea(null);
  };

  const exportSelected = () => {
    const sel = filtered.filter(p => p && p.id && p);
    const csv = toCSV(sel.map(p => ({ id: p.id, name: p.name, type: p.type, complexity: p.complexity, robustness: p.robustness, impact: p.impact, riskScore: p.riskScore })));
    downloadCSV(csv, `quadrant_${mode}.csv`);
  };

  return (
    <div className="w-full h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-[hsl(var(--risk-critical))]/10 text-[hsl(var(--risk-critical))]">Critical Fragility</Badge>
          <Badge className="bg-[hsl(var(--risk-moderate))]/10 text-[hsl(var(--risk-moderate))]">Supplier Vulnerability</Badge>
          <Badge className="bg-[hsl(var(--risk-low))]/10 text-[hsl(var(--risk-low))]">Stable</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={mode==='component'? 'default':'outline'} size="sm" onClick={() => setMode('component')}>Components</Button>
          <Button variant={mode==='vendor'? 'default':'outline'} size="sm" onClick={() => setMode('vendor')}>Vendors</Button>
          <Button variant="secondary" size="sm" onClick={exportSelected}>Export CSV</Button>
        </div>
      </div>
      <div ref={ref} className="h-[380px] w-full">
        <ResponsiveContainer>
          <ScatterChart onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="complexity" name="Complexity" domain={[0, 100]} tick={{ fontSize: 12 }} />
            <YAxis type="number" dataKey={(p) => 100 - (p as any).robustness} name="Risk (inverted robustness)" domain={[0, 100]} tick={{ fontSize: 12 }} />
            <ZAxis type="number" dataKey="impact" range={[60, 400]} />
            <RTooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [v as number, n as string]} contentStyle={{ fontSize: 12 }} />
            <ReferenceLine x={50} stroke="#9CA3AF" strokeDasharray="4 4" />
            <ReferenceLine y={50} stroke="#9CA3AF" strokeDasharray="4 4" />
            {area && (
              <ReferenceArea x1={area.x1} x2={area.x2} y1={area.y1} y2={area.y2} strokeOpacity={0.3} />
            )}
            <Scatter data={filtered} shape={(props: any) => {
              const entry = props.payload as any;
              const r = Math.max(4, (entry.impact ?? 10) / 10);
              return <circle cx={props.cx} cy={props.cy} r={r} fill={colorFor(entry.riskScore)} />;
            }} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
