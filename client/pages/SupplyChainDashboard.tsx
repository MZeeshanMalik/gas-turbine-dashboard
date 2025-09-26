import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TurbineEngine from "@/components/TurbineEngine";
import { SelectionProvider } from "@/context/SelectionContext";
import { ChartContainer } from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { QuadrantPlot } from "@/components/charts/QuadrantPlot";

// Types for our data
interface System {
  id: string;
  name: string;
  code: string;
}

interface Subsystem {
  id: string;
  systemId: string;
  name: string;
  code: string;
}

interface Component {
  id: string;
  subsystemId: string;
  name: string;
  code: string;
  critical: boolean;
}

interface Vendor {
  id: string;
  name: string;
  tier: number;
  regionCode: string;
}

interface Metrics {
  id: string;
  entityType: "component" | "vendor";
  complexity_score: number;
  robustness_score: number;
  lead_time_days: number;
  single_source_flag: boolean;
  alt_vendor_count: number;
  geographic_concentration_index: number;
  spend_share: number;
  criticality_score: number;
}

interface Relationship {
  fromType: "system" | "subsystem" | "component";
  fromId: string;
  toType: "subsystem" | "component" | "vendor";
  toId: string;
  weight: number;
  exclusivity: "single" | "dual" | "balanced";
}

// Generate some timeseries data for risk metrics with critical scenarios
const generateTimeseriesData = (days = 30) => {
  const data = [];
  const now = new Date();

  // Systems to generate data for
  const systems = [
    "sys-inlet",
    "sys-compressor",
    "sys-combustor",
    "sys-turbine",
    "sys-exhaust",
  ];

  // Initialize starting values
  const baseValues = {
    "sys-inlet": { risk: 25, robustness: 75 },
    "sys-compressor": { risk: 60, robustness: 40 },
    "sys-combustor": { risk: 40, robustness: 60 },
    "sys-turbine": { risk: 75, robustness: 25 },
    "sys-exhaust": { risk: 30, robustness: 70 },
  };

  // Create some critical scenario events
  const criticalEvents = {
    // Simulate a turbine issue around day 10
    "sys-turbine": [10, 11, 12, 13].map((d) => ({
      day: days - d,
      risk: 95,
      isCritical: true,
      durationDays: 4,
    })),
    // Simulate a compressor issue near the end
    "sys-compressor": [3, 2, 1, 0].map((d) => ({
      day: days - d,
      risk: 88,
      isCritical: true,
      durationDays: 4,
    })),
    // A brief inlet issue in the middle
    "sys-inlet": [20, 19, 18].map((d) => ({
      day: days - d,
      risk: 85,
      isCritical: true,
      durationDays: 3,
    })),
  };

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const entry: any = {
      date: date.toISOString().split("T")[0],
    };

    console.log(`Generating data for day ${i}`);

    // Add risk values for each system with some randomness
    systems.forEach((sys) => {
      // Check if this is a critical event day
      const criticalEvent = criticalEvents[sys]?.find((e) => e.day === i);

      // Generate consistent keys for the data properties
      // Use the hyphenated version which is already in the system names
      const riskKey = `${sys}_risk`;
      const robustnessKey = `${sys}_robustness`;
      const criticalKey = `${sys}_critical`;

      // Also add with hyphens to make sure we're consistent
      const riskKeyHyphen = `${sys}-risk`;
      const robustnessKeyHyphen = `${sys}-robustness`;
      const criticalKeyHyphen = `${sys}-critical`;

      if (criticalEvent) {
        // This is a critical event day - use the predefined critical values
        const riskValue = criticalEvent.risk;
        const robustnessValue = 100 - criticalEvent.risk;

        // Set both formats for consistent access
        entry[riskKey] = riskValue;
        entry[robustnessKey] = robustnessValue;
        entry[criticalKey] = criticalEvent.isCritical;

        // Also set with hyphen format
        entry[riskKeyHyphen] = riskValue;
        entry[robustnessKeyHyphen] = robustnessValue;
        entry[criticalKeyHyphen] = criticalEvent.isCritical;
      } else {
        // Regular day - apply normal random variance
        const riskChange = Math.random() * 10 - 5; // -5 to +5
        const robustnessChange = Math.random() * 10 - 5; // -5 to +5

        // Update the base values with some persistence (80% of previous value + 20% of new change)
        if (i < days) {
          const prevEntry = data[data.length - 1];
          baseValues[sys].risk = Math.max(
            0,
            Math.min(
              100,
              baseValues[sys].risk * 0.8 +
                riskChange +
                prevEntry[riskKey] * 0.2,
            ),
          );
          baseValues[sys].robustness = Math.max(
            0,
            Math.min(
              100,
              baseValues[sys].robustness * 0.8 +
                robustnessChange +
                prevEntry[robustnessKey] * 0.2,
            ),
          );
        }

        const riskValue = Math.round(baseValues[sys].risk);
        const robustnessValue = Math.round(baseValues[sys].robustness);
        const isCritical = riskValue > 85;

        // Set both formats for consistent access
        entry[riskKey] = riskValue;
        entry[robustnessKey] = robustnessValue;
        entry[criticalKey] = isCritical;

        // Also set with hyphen format
        entry[riskKeyHyphen] = riskValue;
        entry[robustnessKeyHyphen] = robustnessValue;
        entry[criticalKeyHyphen] = isCritical;
      }
    });

    data.push(entry);
  }

  return data;
};

export default function SupplyChainDashboard() {
  const [systems, setSystems] = useState<System[]>([]);
  const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [metrics, setMetrics] = useState<Metrics[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [timeseriesData, setTimeseriesData] = useState<any[]>([]);
  const [selectedSystem, setSelectedSystem] =
    useState<string>("sys-compressor");

  // Turbine component colors - using bright colors for clear testing
  const [fanColor, setFanColor] = useState<string>("#9900FF"); // Bright purple for Fan/Inlet
  const [compressorColor, setCompressorColor] = useState<string>("#FF00FF"); // Bright pink for Compressor
  const [turbineColor, setTurbineColor] = useState<string>("#FFFF00"); // Bright yellow for Turbine
  const [exhaustColor, setExhaustColor] = useState<string>("#00AAFF"); // Bright blue for Exhaust

  // Risk score for selected metrics
  const [inletRisk, setInletRisk] = useState<number>(25);
  const [compressorRisk, setCompressorRisk] = useState<number>(60);
  const [combustorRisk, setCombustorRisk] = useState<number>(40);
  const [turbineRisk, setTurbineRisk] = useState<number>(75);
  const [exhaustRisk, setExhaustRisk] = useState<number>(30);

  // Color calculation based on risk score (0-100)
  const getRiskColor = (
    risk: number,
    hasCriticalIssue: boolean = false,
  ): string => {
    // Always use bright colors for easy testing
    if (hasCriticalIssue || risk > 90) {
      return "#FF0000"; // Bright red for critical issues
    } else if (risk > 75) {
      // Bright yellow for high risk (75-90)
      return "#FFFF00";
    } else if (risk > 50) {
      // Bright pink for medium risk (50-75)
      return "#FF00FF";
    } else {
      // Bright purple for low risk (0-50)
      return "#9900FF";
    }
  };

  // Load data from JSON files
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          systemsResponse,
          subsystemsResponse,
          componentsResponse,
          vendorsResponse,
          metricsResponse,
          relationshipsResponse,
        ] = await Promise.all([
          fetch("/data/systems.json"),
          fetch("/data/subsystems.json"),
          fetch("/data/components.json"),
          fetch("/data/vendors.json"),
          fetch("/data/metrics.json"),
          fetch("/data/relationships.json"),
        ]);

        const systemsData = await systemsResponse.json();
        const subsystemsData = await subsystemsResponse.json();
        const componentsData = await componentsResponse.json();
        const vendorsData = await vendorsResponse.json();
        const metricsData = await metricsResponse.json();
        const relationshipsData = await relationshipsResponse.json();

        setSystems(systemsData.samples);
        setSubsystems(subsystemsData.samples);
        setComponents(componentsData.samples);
        setVendors(vendorsData.samples);
        setMetrics(metricsData.samples);
        setRelationships(relationshipsData.samples);

        // Generate time series data
        const generatedData = generateTimeseriesData();
        console.log("Generated timeseries data:", generatedData);
        console.log("First data point structure:", generatedData[0]);
        setTimeseriesData(generatedData);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    fetchData();
  }, []);

  // Update component colors based on the latest data point and critical issues
  useEffect(() => {
    if (timeseriesData.length > 0) {
      const latestData = timeseriesData[timeseriesData.length - 1];
      console.log("Latest data point:", latestData); // Debug log

      // Check for critical flags in the data - ensure we check all possible formats
      const inletCritical =
        latestData["sys-inlet-critical"] ||
        latestData["sys-inlet_critical"] ||
        latestData.sys_inlet_critical ||
        false;
      const compressorCritical =
        latestData["sys-compressor-critical"] ||
        latestData["sys-compressor_critical"] ||
        latestData.sys_compressor_critical ||
        false;
      const combustorCritical =
        latestData["sys-combustor-critical"] ||
        latestData["sys-combustor_critical"] ||
        latestData.sys_combustor_critical ||
        false;
      const turbineCritical =
        latestData["sys-turbine-critical"] ||
        latestData["sys-turbine_critical"] ||
        latestData.sys_turbine_critical ||
        false;
      const exhaustCritical =
        latestData["sys-exhaust-critical"] ||
        latestData["sys-exhaust_critical"] ||
        latestData.sys_exhaust_critical ||
        false;

      console.log("Critical flags in latest data:", {
        "sys-inlet-critical": latestData["sys-inlet-critical"],
        "sys-inlet_critical": latestData["sys-inlet_critical"],
        sys_inlet_critical: latestData.sys_inlet_critical,
      });

      // Update risk scores - ensure we check all possible formats
      const inletRiskValue =
        latestData["sys-inlet-risk"] ||
        latestData["sys-inlet_risk"] ||
        latestData.sys_inlet_risk ||
        25;
      const compressorRiskValue =
        latestData["sys-compressor-risk"] ||
        latestData["sys-compressor_risk"] ||
        latestData.sys_compressor_risk ||
        60;
      const combustorRiskValue =
        latestData["sys-combustor-risk"] ||
        latestData["sys-combustor_risk"] ||
        latestData.sys_combustor_risk ||
        40;
      const turbineRiskValue =
        latestData["sys-turbine-risk"] ||
        latestData["sys-turbine_risk"] ||
        latestData.sys_turbine_risk ||
        75;
      const exhaustRiskValue =
        latestData["sys-exhaust-risk"] ||
        latestData["sys-exhaust_risk"] ||
        latestData.sys_exhaust_risk ||
        30;

      console.log("Risk values found in data:", {
        "sys-inlet-risk": latestData["sys-inlet-risk"],
        "sys-inlet_risk": latestData["sys-inlet_risk"],
        sys_inlet_risk: latestData.sys_inlet_risk,
      });

      console.log("Risk values extracted:", {
        inlet: inletRiskValue,
        compressor: compressorRiskValue,
        combustor: combustorRiskValue,
        turbine: turbineRiskValue,
        exhaust: exhaustRiskValue,
      }); // Debug log

      setInletRisk(inletRiskValue);
      setCompressorRisk(compressorRiskValue);
      setCombustorRisk(combustorRiskValue);
      setTurbineRisk(turbineRiskValue);
      setExhaustRisk(exhaustRiskValue);

      // Update colors based on risk and critical flags
      const newFanColor = getRiskColor(inletRiskValue, inletCritical);
      const newCompressorColor = getRiskColor(
        compressorRiskValue,
        compressorCritical,
      );
      const newTurbineColor = getRiskColor(turbineRiskValue, turbineCritical);
      const newExhaustColor = getRiskColor(exhaustRiskValue, exhaustCritical);

      console.log("New colors calculated:", {
        fan: newFanColor,
        compressor: newCompressorColor,
        turbine: newTurbineColor,
        exhaust: newExhaustColor,
        riskValues: {
          inlet: inletRiskValue,
          compressor: compressorRiskValue,
          turbine: turbineRiskValue,
          exhaust: exhaustRiskValue,
        },
        criticalFlags: {
          inlet: inletCritical,
          compressor: compressorCritical,
          turbine: turbineCritical,
          exhaust: exhaustCritical,
        },
        previousColors: {
          fan: fanColor,
          compressor: compressorColor,
          turbine: turbineColor,
          exhaust: exhaustColor,
        },
      }); // Debug log

      setFanColor(newFanColor);
      setCompressorColor(newCompressorColor);
      setTurbineColor(newTurbineColor);
      setExhaustColor(newExhaustColor);
    }
  }, [timeseriesData]);

  // Update colors when the selected system changes
  useEffect(() => {
    console.log(`Selected system changed to: ${selectedSystem}`);

    // Only proceed if we have data
    if (timeseriesData.length === 0) {
      console.log("No timeseries data available yet");
      return;
    }

    const latestData = timeseriesData[timeseriesData.length - 1];

    // Different risk values based on the selected system
    let inletRiskValue, compressorRiskValue, turbineRiskValue, exhaustRiskValue;
    let inletCritical, compressorCritical, turbineCritical, exhaustCritical;

    // Apply different risk profiles based on selected system
    switch (selectedSystem) {
      case "sys-inlet":
        // Highest risk on inlet when inlet system is selected
        inletRiskValue = 90; // Critical level
        compressorRiskValue = 60;
        turbineRiskValue = 40;
        exhaustRiskValue = 20;
        inletCritical = true;
        compressorCritical = false;
        turbineCritical = false;
        exhaustCritical = false;
        break;

      case "sys-compressor":
        // Highest risk on compressor when compressor system is selected
        inletRiskValue = 30;
        compressorRiskValue = 95; // Critical level
        turbineRiskValue = 65;
        exhaustRiskValue = 45;
        inletCritical = false;
        compressorCritical = true;
        turbineCritical = false;
        exhaustCritical = false;
        break;

      case "sys-turbine":
        // Highest risk on turbine when turbine system is selected
        inletRiskValue = 20;
        compressorRiskValue = 40;
        turbineRiskValue = 88; // Critical level
        exhaustRiskValue = 60;
        inletCritical = false;
        compressorCritical = false;
        turbineCritical = true;
        exhaustCritical = false;
        break;

      case "sys-exhaust":
        // Highest risk on exhaust when exhaust system is selected
        inletRiskValue = 15;
        compressorRiskValue = 35;
        turbineRiskValue = 55;
        exhaustRiskValue = 85; // Critical level
        inletCritical = false;
        compressorCritical = false;
        turbineCritical = false;
        exhaustCritical = true;
        break;

      default:
        // Default to the values in the latest data
        inletRiskValue =
          latestData["sys-inlet-risk"] ||
          latestData["sys-inlet_risk"] ||
          latestData.sys_inlet_risk ||
          25;
        compressorRiskValue =
          latestData["sys-compressor-risk"] ||
          latestData["sys-compressor_risk"] ||
          latestData.sys_compressor_risk ||
          60;
        turbineRiskValue =
          latestData["sys-turbine-risk"] ||
          latestData["sys-turbine_risk"] ||
          latestData.sys_turbine_risk ||
          75;
        exhaustRiskValue =
          latestData["sys-exhaust-risk"] ||
          latestData["sys-exhaust_risk"] ||
          latestData.sys_exhaust_risk ||
          30;
        inletCritical =
          latestData["sys-inlet-critical"] ||
          latestData["sys-inlet_critical"] ||
          latestData.sys_inlet_critical ||
          false;
        compressorCritical =
          latestData["sys-compressor-critical"] ||
          latestData["sys-compressor_critical"] ||
          latestData.sys_compressor_critical ||
          false;
        turbineCritical =
          latestData["sys-turbine-critical"] ||
          latestData["sys-turbine_critical"] ||
          latestData.sys_turbine_critical ||
          false;
        exhaustCritical =
          latestData["sys-exhaust-critical"] ||
          latestData["sys-exhaust_critical"] ||
          latestData.sys_exhaust_critical ||
          false;
    }

    console.log("Tab change - new risk values:", {
      inletRisk: inletRiskValue,
      compressorRisk: compressorRiskValue,
      turbineRisk: turbineRiskValue,
      exhaustRisk: exhaustRiskValue,
      criticals: {
        inlet: inletCritical,
        compressor: compressorCritical,
        turbine: turbineCritical,
        exhaust: exhaustCritical,
      },
    });

    // Update colors based on new risk values
    const newFanColor = getRiskColor(inletRiskValue, inletCritical);
    const newCompressorColor = getRiskColor(
      compressorRiskValue,
      compressorCritical,
    );
    const newTurbineColor = getRiskColor(turbineRiskValue, turbineCritical);
    const newExhaustColor = getRiskColor(exhaustRiskValue, exhaustCritical);

    console.log("Tab change - new colors calculated:", {
      fan: newFanColor,
      compressor: newCompressorColor,
      turbine: newTurbineColor,
      exhaust: newExhaustColor,
    });

    // Set the new colors
    setFanColor(newFanColor);
    setCompressorColor(newCompressorColor);
    setTurbineColor(newTurbineColor);
    setExhaustColor(newExhaustColor);

    // Update the risk values state
    setInletRisk(inletRiskValue);
    setCompressorRisk(compressorRiskValue);
    setCombustorRisk(turbineRiskValue); // Using turbine value for combustor for simplicity
    setTurbineRisk(turbineRiskValue);
    setExhaustRisk(exhaustRiskValue);
  }, [selectedSystem, timeseriesData]);

  // Get selected system details
  const selectedSystemDetails = systems.find((s) => s.id === selectedSystem);

  // Get related subsystems, components, and vendors for the selected system
  const relatedSubsystems = subsystems.filter(
    (sub) => sub.systemId === selectedSystem,
  );

  // Get critical components for the selected system
  const relatedComponentIds = relatedSubsystems
    .map((sub) =>
      components.filter((comp) => comp.subsystemId === sub.id).map((c) => c.id),
    )
    .flat();

  // Get critical metrics for the components
  const criticalMetrics = metrics.filter(
    (m) =>
      m.entityType === "component" &&
      relatedComponentIds.includes(m.id) &&
      m.criticality_score > 70,
  );

  // Calculate risk summary
  const riskSummary = {
    singleSourceCount: metrics.filter(
      (m) =>
        m.entityType === "component" &&
        relatedComponentIds.includes(m.id) &&
        m.single_source_flag,
    ).length,
    totalComponents: relatedComponentIds.length,
    averageLeadTime: Math.round(
      metrics
        .filter(
          (m) =>
            m.entityType === "component" && relatedComponentIds.includes(m.id),
        )
        .reduce((sum, m) => sum + m.lead_time_days, 0) /
        (relatedComponentIds.length || 1),
    ),
    criticalCount: criticalMetrics.length,
  };

  return (
    <SelectionProvider>
      <MainLayout>
        <div className="space-y-4 p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <h1 className="text-2xl font-bold">
              Supply Chain Analytics Dashboard
              <span className="text-muted-foreground font-normal text-sm ml-2">
                Gas Turbine Demo
              </span>
            </h1>

            <Tabs
              defaultValue={selectedSystem}
              onValueChange={setSelectedSystem}
              className="w-full lg:w-auto"
            >
              <TabsList className="grid grid-cols-3 lg:grid-cols-5 w-full lg:w-[600px]">
                {systems.slice(0, 5).map((system) => (
                  <TabsTrigger key={system.id} value={system.id}>
                    {system.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between">
                  <span>Gas Turbine System Visualization</span>
                  {selectedSystemDetails && (
                    <Badge
                      variant={
                        riskSummary.criticalCount > 0
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {riskSummary.criticalCount > 0
                        ? `${riskSummary.criticalCount} Critical Issues`
                        : "No Critical Issues"}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-[#9900FF]"></div>
                    <span className="text-xs text-muted-foreground">
                      Low Risk
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-[#FF00FF]"></div>
                    <span className="text-xs text-muted-foreground">
                      Medium Risk
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-[#FFFF00]"></div>
                    <span className="text-xs text-muted-foreground">
                      High Risk
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-[#FF0000]"></div>
                    <span className="text-xs text-muted-foreground">
                      Critical
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative min-h-[350px] h-[calc(100vh-400px)] bg-slate-50 dark:bg-slate-950 rounded-md border p-2 overflow-hidden">
                  <TurbineEngine
                    fanColor={fanColor}
                    compressorColor={compressorColor}
                    turbineColor={turbineColor}
                    exhaustColor={exhaustColor}
                    className="w-full h-full"
                    preserveAspectRatio="xMidYMid contain"
                    criticalComponents={{
                      fan: inletRisk > 85 || selectedSystem === "sys-inlet",
                      compressor:
                        compressorRisk > 85 ||
                        selectedSystem === "sys-compressor",
                      turbine:
                        turbineRisk > 85 || selectedSystem === "sys-turbine",
                      exhaust:
                        exhaustRisk > 85 || selectedSystem === "sys-exhaust",
                    }}
                  />

                  {/* System label overlays with risk indicators */}
                  <div
                    className={`absolute top-[40%] left-[15%] px-2 py-1 ${inletRisk > 80 ? "bg-red-600" : "bg-black/50"} text-white text-xs rounded pointer-events-none flex items-center gap-1`}
                  >
                    {inletRisk > 80 && (
                      <AlertTriangle className="w-3 h-3 text-yellow-300" />
                    )}
                    <span>Fan/Inlet</span>
                    <span className="text-[0.65rem] ml-1 opacity-80">
                      {inletRisk}%
                    </span>
                  </div>
                  <div
                    className={`absolute top-[35%] left-[30%] px-2 py-1 ${compressorRisk > 80 ? "bg-red-600" : "bg-black/50"} text-white text-xs rounded pointer-events-none flex items-center gap-1`}
                  >
                    {compressorRisk > 80 && (
                      <AlertTriangle className="w-3 h-3 text-yellow-300" />
                    )}
                    <span>Compressor</span>
                    <span className="text-[0.65rem] ml-1 opacity-80">
                      {compressorRisk}%
                    </span>
                  </div>
                  <div
                    className={`absolute top-[30%] left-[50%] px-2 py-1 ${combustorRisk > 80 ? "bg-red-600" : "bg-black/50"} text-white text-xs rounded pointer-events-none flex items-center gap-1`}
                  >
                    {combustorRisk > 80 && (
                      <AlertTriangle className="w-3 h-3 text-yellow-300" />
                    )}
                    <span>Combustor</span>
                    <span className="text-[0.65rem] ml-1 opacity-80">
                      {combustorRisk}%
                    </span>
                  </div>
                  <div
                    className={`absolute top-[40%] left-[65%] px-2 py-1 ${turbineRisk > 80 ? "bg-red-600" : "bg-black/50"} text-white text-xs rounded pointer-events-none flex items-center gap-1`}
                  >
                    {turbineRisk > 80 && (
                      <AlertTriangle className="w-3 h-3 text-yellow-300" />
                    )}
                    <span>Turbine</span>
                    <span className="text-[0.65rem] ml-1 opacity-80">
                      {turbineRisk}%
                    </span>
                  </div>
                  <div
                    className={`absolute top-[45%] left-[80%] px-2 py-1 ${exhaustRisk > 80 ? "bg-red-600" : "bg-black/50"} text-white text-xs rounded pointer-events-none flex items-center gap-1`}
                  >
                    {exhaustRisk > 80 && (
                      <AlertTriangle className="w-3 h-3 text-yellow-300" />
                    )}
                    <span>Exhaust</span>
                    <span className="text-[0.65rem] ml-1 opacity-80">
                      {exhaustRisk}%
                    </span>
                  </div>

                  {/* Risk pulse indicators for critical components */}
                  {inletRisk > 80 && (
                    <div className="absolute top-[40%] left-[15%] w-8 h-8 rounded-full bg-red-500/20 animate-ping"></div>
                  )}
                  {compressorRisk > 80 && (
                    <div className="absolute top-[35%] left-[30%] w-8 h-8 rounded-full bg-red-500/20 animate-ping"></div>
                  )}
                  {turbineRisk > 80 && (
                    <div className="absolute top-[40%] left-[65%] w-8 h-8 rounded-full bg-red-500/20 animate-ping"></div>
                  )}
                  {exhaustRisk > 80 && (
                    <div className="absolute top-[45%] left-[80%] w-8 h-8 rounded-full bg-red-500/20 animate-ping"></div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card
              className={
                inletRisk > 80 ||
                compressorRisk > 80 ||
                turbineRisk > 80 ||
                exhaustRisk > 80
                  ? "border-red-500"
                  : ""
              }
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span>Supply Chain Risk Metrics</span>
                  {(inletRisk > 80 ||
                    compressorRisk > 80 ||
                    turbineRisk > 80 ||
                    exhaustRisk > 80) && (
                    <Badge variant="destructive" className="animate-pulse">
                      Critical Issues Detected
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {riskSummary.singleSourceCount > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Supply Chain Vulnerability</AlertTitle>
                    <AlertDescription>
                      {riskSummary.singleSourceCount} of{" "}
                      {riskSummary.totalComponents} components have
                      single-source vendors.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Critical component alerts */}
                {turbineRisk > 80 && (
                  <Alert
                    variant="destructive"
                    className="border-red-600 bg-red-50 dark:bg-red-900/20"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Turbine Critical Risk Alert</AlertTitle>
                    <AlertDescription className="text-sm">
                      The turbine system is showing critical risk levels (
                      {turbineRisk}%). Immediate inspection recommended.
                    </AlertDescription>
                  </Alert>
                )}

                {compressorRisk > 80 && (
                  <Alert
                    variant="destructive"
                    className="border-red-600 bg-red-50 dark:bg-red-900/20"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Compressor Critical Risk Alert</AlertTitle>
                    <AlertDescription className="text-sm">
                      The compressor system has reached critical risk levels (
                      {compressorRisk}%). Intervention required.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      Single-Source
                    </div>
                    <div className="text-xl font-semibold">
                      {riskSummary.singleSourceCount} /{" "}
                      {riskSummary.totalComponents}
                      <span className="text-sm text-muted-foreground ml-1">
                        parts
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {Math.round(
                        (riskSummary.singleSourceCount /
                          (riskSummary.totalComponents || 1)) *
                          100,
                      )}
                      % of total
                    </div>
                  </div>

                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      Avg. Lead Time
                    </div>
                    <div className="text-xl font-semibold">
                      {riskSummary.averageLeadTime}
                      <span className="text-sm text-muted-foreground ml-1">
                        days
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Industry avg: 60 days
                    </div>
                  </div>

                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      Vendor Diversity
                    </div>
                    <div className="text-xl font-semibold">
                      {vendors.length}
                      <span className="text-sm text-muted-foreground ml-1">
                        vendors
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Across{" "}
                      {
                        Array.from(new Set(vendors.map((v) => v.regionCode)))
                          .length
                      }{" "}
                      regions
                    </div>
                  </div>

                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      Critical Components
                    </div>
                    <div className="text-xl font-semibold">
                      {criticalMetrics.length}
                      <span className="text-sm text-muted-foreground ml-1">
                        items
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Requiring immediate attention
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle>Risk Trends Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={timeseriesData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(date) => {
                          const d = new Date(date);
                          return `${d.getMonth() + 1}/${d.getDate()}`;
                        }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        label={{
                          value: "Risk Score",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle" },
                        }}
                      />
                      <Tooltip
                        formatter={(value) => [`${value}`, "Risk Score"]}
                        labelFormatter={(date) =>
                          `Date: ${new Date(date).toLocaleDateString()}`
                        }
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="sys-inlet_risk"
                        name="Fan/Inlet"
                        stroke="#36b691"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="sys-compressor_risk"
                        name="Compressor"
                        stroke="#6c63ff"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="sys-combustor_risk"
                        name="Combustor"
                        stroke="#a855f7"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="sys-turbine_risk"
                        name="Turbine"
                        stroke="#ff6347"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="sys-exhaust_risk"
                        name="Exhaust"
                        stroke="#ff9900"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Component Risk Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <QuadrantPlot
                  height={350}
                  data={metrics
                    .filter(
                      (m) =>
                        m.entityType === "component" &&
                        relatedComponentIds.includes(m.id),
                    )
                    .map((m) => ({
                      id: m.id,
                      type: "component",
                      complexity: m.complexity_score,
                      robustness: m.robustness_score,
                      name: components.find((c) => c.id === m.id)?.name || m.id,
                      label:
                        components.find((c) => c.id === m.id)?.name || m.id,
                      color: m.single_source_flag ? "#ff6347" : "#6c63ff",
                      impact: m.criticality_score / 5 + 5, // Scale the size based on criticality
                      riskScore: m.criticality_score || 50,
                    }))}
                  xLabel="Complexity"
                  yLabel="Robustness"
                  quadrantLabels={[
                    "Critical Fragility",
                    "Strategic but Secure",
                    "Stable",
                    "Supplier Vulnerability",
                  ]}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>BOM → Vendor Tree</CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto">
              <table className="w-full min-w-[800px] border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 px-4 text-left">System</th>
                    <th className="py-2 px-4 text-left">Subsystem</th>
                    <th className="py-2 px-4 text-left">Component</th>
                    <th className="py-2 px-4 text-left">Vendor</th>
                    <th className="py-2 px-4 text-left">Origin</th>
                    <th className="py-2 px-4 text-left">Lead Time</th>
                    <th className="py-2 px-4 text-left">Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {relatedSubsystems.map((subsystem) => {
                    const subsystemComponents = components.filter(
                      (c) => c.subsystemId === subsystem.id,
                    );

                    return subsystemComponents.map((component, index) => {
                      const componentMetrics = metrics.find(
                        (m) => m.id === component.id,
                      );
                      const componentRelationships = relationships.filter(
                        (r) =>
                          r.fromId === component.id &&
                          r.fromType === "component" &&
                          r.toType === "vendor",
                      );

                      return componentRelationships.map((rel, vendorIdx) => {
                        const vendor = vendors.find((v) => v.id === rel.toId);
                        const isHighRisk =
                          componentMetrics?.single_source_flag ||
                          componentMetrics?.criticality_score > 70;

                        return (
                          <tr
                            key={`${component.id}-${vendor?.id}-${vendorIdx}`}
                            className="border-b border-border hover:bg-muted/50"
                          >
                            {index === 0 && vendorIdx === 0 && (
                              <td
                                className="py-2 px-4 align-top"
                                rowSpan={subsystemComponents.reduce(
                                  (sum, c) => {
                                    return (
                                      sum +
                                      relationships.filter(
                                        (r) =>
                                          r.fromId === c.id &&
                                          r.fromType === "component",
                                      ).length
                                    );
                                  },
                                  0,
                                )}
                              >
                                {selectedSystemDetails?.name}
                                <span className="text-xs block text-muted-foreground">
                                  {selectedSystemDetails?.code}
                                </span>
                              </td>
                            )}

                            {vendorIdx === 0 && (
                              <td
                                className="py-2 px-4 align-top"
                                rowSpan={componentRelationships.length}
                              >
                                {subsystem.name}
                                <span className="text-xs block text-muted-foreground">
                                  {subsystem.code}
                                </span>
                              </td>
                            )}

                            {vendorIdx === 0 && (
                              <td
                                className="py-2 px-4 align-top"
                                rowSpan={componentRelationships.length}
                              >
                                <div className="flex items-center gap-2">
                                  {component.name}
                                  {component.critical && (
                                    <Badge
                                      variant="outline"
                                      className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                    >
                                      Critical
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs block text-muted-foreground">
                                  {component.code}
                                </span>
                              </td>
                            )}

                            <td className="py-2 px-4">
                              <div className="flex items-center gap-2">
                                {vendor?.name}
                                {rel.exclusivity === "single" && (
                                  <Badge
                                    variant="destructive"
                                    className="text-[0.65rem]"
                                  >
                                    Single Source
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs block text-muted-foreground">
                                Tier {vendor?.tier}
                              </span>
                            </td>

                            <td className="py-2 px-4">{vendor?.regionCode}</td>

                            <td className="py-2 px-4">
                              {componentMetrics?.lead_time_days} days
                            </td>

                            <td className="py-2 px-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor: componentMetrics
                                      ? getRiskColor(
                                          componentMetrics.criticality_score,
                                        )
                                      : "#36b691",
                                  }}
                                ></div>
                                {isHighRisk
                                  ? "High"
                                  : componentMetrics?.criticality_score > 40
                                    ? "Medium"
                                    : "Low"}
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    });
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </SelectionProvider>
  );
}
