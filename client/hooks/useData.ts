import { useEffect, useMemo, useState } from "react";
import { createMinMaxNormalizer, computeRiskScore, riskTier, type EntityMetrics } from "@/lib/risk";

export type System = { id: string; name: string; code: string };
export type Subsystem = { id: string; systemId: string; name: string; code: string };
export type Component = { id: string; subsystemId: string; name: string; code: string; critical: boolean };
export type Vendor = { id: string; name: string; tier: 0 | 1 | 2; regionCode: string };
export type Relationship = { fromType: "system"|"subsystem"|"component"; fromId: string; toType: "subsystem"|"component"|"vendor"; toId: string; weight: number; exclusivity: "single"|"dual"|"balanced" };
export type Region = { code: string; name: string; sanctionFlag?: boolean };
export type Metrics = EntityMetrics & { entityType: "component" | "vendor" };

export function useData() {
  const [systems, setSystems] = useState<System[]>([]);
  const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [metrics, setMetrics] = useState<Metrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const [systemsR, subsystemsR, componentsR, vendorsR, relationshipsR, metricsR, regionsR] = await Promise.all([
          fetch("/data/systems.json").then((r) => r.json()),
          fetch("/data/subsystems.json").then((r) => r.json()),
          fetch("/data/components.json").then((r) => r.json()),
          fetch("/data/vendors.json").then((r) => r.json()),
          fetch("/data/relationships.json").then((r) => r.json()),
          fetch("/data/metrics.json").then((r) => r.json()),
          fetch("/data/regions.json").then((r) => r.json()),
        ]);
        if (cancelled) return;
        setSystems(systemsR.samples);
        setSubsystems(subsystemsR.samples);
        setComponents(componentsR.samples);
        setVendors(vendorsR.samples);
        setRelationships(relationshipsR.samples);
        setMetrics(metricsR.samples);
        setRegions(regionsR.samples);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const normalizeLeadTime = useMemo(() => createMinMaxNormalizer(metrics.map((m) => m.lead_time_days)), [metrics]);

  const enriched = useMemo(() => {
    const metricsById = new Map(metrics.map((m) => [m.id, { ...m, risk_score: computeRiskScore(m, normalizeLeadTime), risk_tier: riskTier(computeRiskScore(m, normalizeLeadTime)) }]));
    return { metricsById } as const;
  }, [metrics, normalizeLeadTime]);

  return {
    systems, subsystems, components, vendors, relationships, regions, metrics, enriched,
    loading, error,
  };
}
