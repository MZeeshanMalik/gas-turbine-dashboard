import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSelection } from "@/context/SelectionContext";
import { useData } from "@/hooks/useData";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

function KPI({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="shadow-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

export function RegionalDashboard() {
  const { relationships, vendors } = useData();
  const { setHighlightedRegionCode } = useSelection();

  const totalsByRegion = useMemo(() => {
    const map = new Map<string, number>();
    relationships.forEach(r => {
      if (r.toType === 'vendor') {
        const ven = vendors.find(v => v.id === r.toId);
        if (!ven) return;
        map.set(ven.regionCode, (map.get(ven.regionCode) || 0) + r.weight);
      }
    });
    return Array.from(map, ([region, value]) => ({ region, value }));
  }, [relationships, vendors]);

  const diversityIndex = useMemo(() => {
    // Herfindahl-Hirschman-like: sum(s_i^2) where s_i are shares per region
    const total = totalsByRegion.reduce((a, b) => a + b.value, 0) || 1;
    const hhi = totalsByRegion.reduce((sum, x) => sum + Math.pow(x.value / total, 2), 0);
    const normalized = (1 - hhi) * 100; // higher is more diverse
    return normalized.toFixed(1) + "%";
  }, [totalsByRegion]);

  const { donutData, total } = useMemo(() => {
    const sorted = [...totalsByRegion].sort((a,b) => b.value - a.value);
    const top = sorted.slice(0, 5);
    const total = sorted.reduce((s, x) => s + x.value, 0);
    const others = sorted.slice(5).reduce((s, x) => s + x.value, 0);
    const data = others > 0 ? [...top, { region: 'Others', value: others }] : top;
    return { donutData: data, total };
  }, [totalsByRegion]);
  const colors = ['#6366F1','#0EA5E9','#22C55E','#F59E0B','#EF4444','#14B8A6'];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="% Sole-Source Parts" value="18%" sub="Components with single vendor" />
        <KPI label="Supplier Diversity Index" value={diversityIndex} sub="1 - ∑ share² (by region)" />
        <KPI label="Lead Time Spread" value={"42 days"} sub="P90 - P10" />
        <KPI label="% High-Risk Components" value="24%" sub={"Risk ≥ 70"} />
      </div>

      <Card className="shadow-panel">
        <CardHeader>
          <CardTitle>Regional Dependency (Choropleth)</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Simple grid choropleth substitute */}
          <div className="grid grid-cols-6 gap-2">
            {['US','DE','CN','MX','IN','JP'].map((code, i) => {
              const val = totalsByRegion.find(d => d.region === code)?.value || 0;
              const pct = Math.min(1, val / 5);
              return (
                <div key={code} className="p-3 rounded-md border cursor-pointer" style={{ backgroundColor: `rgba(99,102,241,${pct})` }} onMouseEnter={() => setHighlightedRegionCode(code)} onMouseLeave={() => setHighlightedRegionCode(null)}>
                  <div className="text-xs font-medium">{code}</div>
                  <div className="text-xs opacity-70">{(val*100).toFixed(0)}%</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-panel">
          <CardHeader>
            <CardTitle>Supply Volume % by Region & Tier</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer>
              <BarChart data={['US','DE','CN','MX','IN','JP'].map(code => ({ code, tier0: Math.random()*2, tier1: Math.random()*2, tier2: Math.random()*2 }))}>
                <XAxis dataKey="code" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tier0" stackId="a" fill="#6366F1" />
                <Bar dataKey="tier1" stackId="a" fill="#0EA5E9" />
                <Bar dataKey="tier2" stackId="a" fill="#22C55E" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-panel">
          <CardHeader>
            <CardTitle>Top Regions Share</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {(!donutData || donutData.length === 0 || total === 0) ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No regional data</div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={donutData} dataKey="value" nameKey="region" innerRadius={60} outerRadius={100} label={(e) => `${e.region}: ${Math.round((e.value/total)*100)}%`}>
                    {donutData.map((_, idx) => <Cell key={idx} fill={colors[idx % colors.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any, _n: any, p: any) => [`${Math.round((v/total)*100)}%`, p && p.payload ? p.payload.region : '']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
