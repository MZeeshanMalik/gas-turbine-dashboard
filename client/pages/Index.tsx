import { useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NetworkMap } from "@/components/network/NetworkMap";
import { QuadrantPlot } from "@/components/charts/QuadrantPlot";
import { BOMTree } from "@/components/BOMTree";
import { RegionalDashboard } from "@/components/RegionalDashboard";
import { SelectionProvider } from "@/context/SelectionContext";
import { useData } from "@/hooks/useData";

export default function Index() {
  const { loading, error } = useData();

  useEffect(() => {
    if (error) console.error(error);
  }, [error]);

  return (
    <SelectionProvider>
      <MainLayout>
        <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6">
          {/* Network Map - Full width on all screens */}
          <div className="w-full">
            <Card id="network-map" className="shadow-panel">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  Supply Chain Network Map
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {loading ? (
                  <div className="h-[250px] sm:h-[350px] lg:h-[420px] skeleton" />
                ) : (
                  <div className="w-full overflow-hidden">
                    <NetworkMap />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quadrant Plot - Responsive positioning */}
          <div className="w-full">
            <Card className="shadow-panel">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  Brittleness & Complexity Quadrant
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {loading ? (
                  <div className="h-[250px] sm:h-[350px] lg:h-[420px] skeleton" />
                ) : (
                  <div className="w-full overflow-hidden">
                    <QuadrantPlot points={sampleQuadrant} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row - Column format (stacked vertically) */}
          <div className="space-y-4 sm:space-y-6">
            <Card className="shadow-panel">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  BOM → Vendor Tree
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {loading ? (
                  <div className="h-[250px] sm:h-[350px] lg:h-[420px] skeleton" />
                ) : (
                  <div className="w-full overflow-hidden">
                    <BOMTree />
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="shadow-panel">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  Regional Dependency Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {loading ? (
                  <div className="h-[250px] sm:h-[350px] lg:h-[420px] skeleton" />
                ) : (
                  <div className="w-full overflow-hidden">
                    <RegionalDashboard />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    </SelectionProvider>
  );
}

// Synthetic demo points (would be derived from metrics.json in a fuller build)
const sampleQuadrant = [
  {
    id: "c1",
    name: "Turbine Blade Set A",
    type: "component" as const,
    complexity: 82,
    robustness: 35,
    impact: 90,
    vendorCount: 1,
    singleSource: true,
    suggestedAction: "Diversify Vendor Options",
    riskScore: 78,
  },
  {
    id: "c2",
    name: "Combustor Liner B",
    type: "component" as const,
    complexity: 68,
    robustness: 45,
    impact: 70,
    vendorCount: 2,
    singleSource: false,
    suggestedAction: "Supplier Development Program",
    riskScore: 62,
  },
  {
    id: "v1",
    name: "AeroAlloy GmbH",
    type: "vendor" as const,
    complexity: 50,
    robustness: 55,
    impact: 60,
    vendorCount: 0,
    singleSource: false,
    suggestedAction: "Regional Rebalancing",
    riskScore: 48,
  },
  {
    id: "v2",
    name: "Shenzhen Precision",
    type: "vendor" as const,
    complexity: 40,
    robustness: 30,
    impact: 55,
    vendorCount: 0,
    singleSource: false,
    suggestedAction: "Qualify Alternate Vendors",
    riskScore: 72,
  },
];
