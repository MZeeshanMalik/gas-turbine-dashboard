import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TurbineEngine from "@/components/TurbineEngine";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { SelectionProvider } from "@/context/SelectionContext";

export default function TurbineVisualization() {
  const [fanColor, setFanColor] = useState("#36b691"); // Default color for Fan
  const [compressorColor, setCompressorColor] = useState("#6c63ff"); // Default color for Compressor
  const [turbineColor, setTurbineColor] = useState("#ff6347"); // Default color for Turbine
  const [exhaustColor, setExhaustColor] = useState("#ff9900"); // Default color for Exhaust
  const [tempColor, setTempColor] = useState("#36b691");
  const [selectedComponent, setSelectedComponent] = useState<
    "fan" | "compressor" | "turbine" | "exhaust"
  >("fan");
  const [temperature, setTemperature] = useState(50); // 0-100 temperature range

  // Update color based on temperature (blue-green-yellow-red gradient)
  const updateColorFromTemperature = (temp: number) => {
    let color;
    if (temp < 25) {
      // Blue to Teal (cold)
      color = `#${Math.floor(54 + (75 - 54) * (temp / 25))
        .toString(16)
        .padStart(2, "0")}${Math.floor(162 + (182 - 162) * (temp / 25))
        .toString(16)
        .padStart(2, "0")}${Math.floor(235 - (235 - 177) * (temp / 25))
        .toString(16)
        .padStart(2, "0")}`;
    } else if (temp < 50) {
      // Teal to Green
      const normalizedTemp = (temp - 25) / 25;
      color = `#${Math.floor(75 + (54 - 75) * normalizedTemp)
        .toString(16)
        .padStart(
          2,
          "0",
        )}${Math.floor(182).toString(16).padStart(2, "0")}${Math.floor(
        177 - (177 - 107) * normalizedTemp,
      )
        .toString(16)
        .padStart(2, "0")}`;
    } else if (temp < 75) {
      // Green to Yellow
      const normalizedTemp = (temp - 50) / 25;
      color = `#${Math.floor(54 + (255 - 54) * normalizedTemp)
        .toString(16)
        .padStart(2, "0")}${Math.floor(182 - (182 - 204) * normalizedTemp)
        .toString(16)
        .padStart(2, "0")}${Math.floor(107 - (107 - 0) * normalizedTemp)
        .toString(16)
        .padStart(2, "0")}`;
    } else {
      // Yellow to Red
      const normalizedTemp = (temp - 75) / 25;
      color = `#${Math.floor(255).toString(16).padStart(2, "0")}${Math.floor(
        204 - (204 - 0) * normalizedTemp,
      )
        .toString(16)
        .padStart(2, "0")}${Math.floor(0).toString(16).padStart(2, "0")}`;
    }

    // Update color for the currently selected component
    switch (selectedComponent) {
      case "fan":
        setFanColor(color);
        break;
      case "compressor":
        setCompressorColor(color);
        break;
      case "turbine":
        setTurbineColor(color);
        break;
      case "exhaust":
        setExhaustColor(color);
        break;
    }

    setTempColor(color);
  };
  return (
    <SelectionProvider>
      <MainLayout>
        <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6">
          <Card className="shadow-panel">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">
                Gas Turbine Engine Visualization
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-2/3">
                  <div
                    className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 flex justify-center items-center"
                    style={{
                      minHeight: "400px",
                      height: "calc(100vh - 300px)",
                    }}
                  >
                    <TurbineEngine
                      fanColor={fanColor}
                      compressorColor={compressorColor}
                      turbineColor={turbineColor}
                      exhaustColor={exhaustColor}
                      className="w-full h-full"
                      preserveAspectRatio="xMidYMid meet"
                    />
                  </div>
                </div>
                <div className="w-full lg:w-1/3 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Component Selection
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={
                          selectedComponent === "fan" ? "default" : "outline"
                        }
                        onClick={() => {
                          setSelectedComponent("fan");
                          setTempColor(fanColor);
                        }}
                      >
                        Fan
                      </Button>
                      <Button
                        variant={
                          selectedComponent === "compressor"
                            ? "default"
                            : "outline"
                        }
                        onClick={() => {
                          setSelectedComponent("compressor");
                          setTempColor(compressorColor);
                        }}
                      >
                        Compressor
                      </Button>
                      <Button
                        variant={
                          selectedComponent === "turbine"
                            ? "default"
                            : "outline"
                        }
                        onClick={() => {
                          setSelectedComponent("turbine");
                          setTempColor(turbineColor);
                        }}
                      >
                        Turbine
                      </Button>
                      <Button
                        variant={
                          selectedComponent === "exhaust"
                            ? "default"
                            : "outline"
                        }
                        onClick={() => {
                          setSelectedComponent("exhaust");
                          setTempColor(exhaustColor);
                        }}
                      >
                        Exhaust
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Temperature Control
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="temperature">
                        Temperature: {temperature}°C
                      </Label>
                      <Slider
                        id="temperature"
                        min={0}
                        max={100}
                        step={1}
                        value={[temperature]}
                        onValueChange={(vals) => {
                          setTemperature(vals[0]);
                          updateColorFromTemperature(vals[0]);
                        }}
                        className="py-4"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Manual Color Control
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="colorPicker">
                        {selectedComponent.charAt(0).toUpperCase() +
                          selectedComponent.slice(1)}{" "}
                        Color
                      </Label>
                      <div className="flex space-x-2">
                        <Input
                          id="colorPicker"
                          type="color"
                          value={tempColor}
                          onChange={(e) => setTempColor(e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          type="text"
                          value={tempColor}
                          onChange={(e) => setTempColor(e.target.value)}
                          className="flex-grow"
                        />
                        <Button
                          onClick={() => {
                            switch (selectedComponent) {
                              case "fan":
                                setFanColor(tempColor);
                                break;
                              case "compressor":
                                setCompressorColor(tempColor);
                                break;
                              case "turbine":
                                setTurbineColor(tempColor);
                                break;
                              case "exhaust":
                                setExhaustColor(tempColor);
                                break;
                            }
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 pt-4">
                    <h3 className="text-lg font-semibold">
                      {selectedComponent.charAt(0).toUpperCase() +
                        selectedComponent.slice(1)}{" "}
                      Health Status
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">RPM</span>
                        <span className="font-semibold">
                          {selectedComponent === "fan"
                            ? Math.floor(3000 + temperature * 42)
                            : selectedComponent === "compressor"
                              ? Math.floor(5000 + temperature * 65)
                              : Math.floor(8000 + temperature * 80)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">
                          Efficiency
                        </span>
                        <span className="font-semibold">
                          {temperature > 75
                            ? `${Math.floor(100 - (temperature - 75) * (selectedComponent === "turbine" ? 2 : 3))}%`
                            : temperature < 25
                              ? `${Math.floor(90 + (25 - temperature) * (selectedComponent === "compressor" ? 0.8 : 1))}%`
                              : selectedComponent === "compressor"
                                ? "97%"
                                : "95%"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Vibration</span>
                        <span className="font-semibold">
                          {temperature >
                          (selectedComponent === "turbine" ? 75 : 80)
                            ? "High"
                            : temperature >
                                (selectedComponent === "compressor" ? 55 : 60)
                              ? "Medium"
                              : "Low"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Status</span>
                        <span
                          className={`font-semibold ${
                            temperature >
                            (selectedComponent === "turbine" ? 80 : 85)
                              ? "text-red-500"
                              : temperature >
                                  (selectedComponent === "compressor" ? 65 : 70)
                                ? "text-amber-500"
                                : "text-green-500"
                          }`}
                        >
                          {temperature >
                          (selectedComponent === "turbine" ? 80 : 85)
                            ? "Warning"
                            : temperature >
                                (selectedComponent === "compressor" ? 65 : 70)
                              ? "Monitor"
                              : "Normal"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </SelectionProvider>
  );
}
