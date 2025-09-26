import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TurbineEngineProps {
  fanColor?: string;
  compressorColor?: string;
  turbineColor?: string;
  exhaustColor?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  preserveAspectRatio?: string;
}

/**
 * TurbineEngine component renders an SVG of a turbine engine with the ability
 * to dynamically change the color of the "Fan", "Compressor", "Turbine", and "Exhaust" layers.
 *
 * @param fanColor - The color to apply to the Fan layer (default: #36b691)
 * @param compressorColor - The color to apply to the Compressor layer (default: #6c63ff)
 * @param turbineColor - The color to apply to the Turbine layer (default: #ff6347)
 * @param exhaustColor - The color to apply to the Exhaust layer (default: #ff9900)
 * @param className - Additional CSS classes to apply to the container
 * @param width - The width of the SVG (default: "100%")
 * @param height - The height of the SVG (default: "auto")
 * @param preserveAspectRatio - The SVG preserveAspectRatio attribute (default: "xMidYMid meet")
 */
export default function TurbineEngine({
  fanColor = "#36b691", // Default color for Fan
  compressorColor = "#6c63ff", // Default color for Compressor
  turbineColor = "#ff6347", // Default color for Turbine
  exhaustColor = "#ff9900", // Default color for Exhaust
  className,
  width = "100%",
  height = "auto",
  preserveAspectRatio = "xMidYMid meet",
}: TurbineEngineProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch the SVG file
    fetch("/turbine-engine.svg")
      .then((response) => response.text())
      .then((data) => {
        // Log the SVG structure for debugging
        console.log("SVG Content Preview:", data.substring(0, 500) + "...");

        // Create a temporary DOM element to parse the SVG
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(data, "image/svg+xml");

        // Search for elements by various attributes and log what we find
        const fanElements = [
          ...svgDoc.querySelectorAll('[inkscape\\:label="Fan"]'),
          ...svgDoc.querySelectorAll('[id="Fan"]'),
          ...svgDoc.querySelectorAll('[class*="Fan"]'),
          ...svgDoc.querySelectorAll("g#Fan"),
        ];

        const compressorElements = [
          ...svgDoc.querySelectorAll('[inkscape\\:label="compressor"]'),
          ...svgDoc.querySelectorAll('[id="compressor"]'),
          ...svgDoc.querySelectorAll('[class*="compressor"]'),
          ...svgDoc.querySelectorAll("g#compressor"),
        ];

        const turbineElements = [
          ...svgDoc.querySelectorAll('[inkscape\\:label="Turbinee"]'),
          ...svgDoc.querySelectorAll('[id="Turbinee"]'),
          ...svgDoc.querySelectorAll('[class*="Turbinee"]'),
          ...svgDoc.querySelectorAll("g#Turbinee"),
        ];

        // Log what we found
        console.log("SVG Structure Analysis:");
        console.log("Fan elements:", fanElements.length);
        console.log("Compressor elements:", compressorElements.length);
        console.log("Turbine elements:", turbineElements.length);

        // Log first instance of each type to see their structure
        if (fanElements.length > 0) {
          console.log("Fan element example:", fanElements[0].outerHTML);
        }
        if (compressorElements.length > 0) {
          console.log(
            "Compressor element example:",
            compressorElements[0].outerHTML,
          );
        }
        if (turbineElements.length > 0) {
          console.log("Turbine element example:", turbineElements[0].outerHTML);
        }

        // Store the original SVG content
        setSvgContent(data);
      })
      .catch((error) => {
        console.error("Error loading turbine SVG:", error);
      });
  }, []);

  // Effect to modify the DOM directly when colors change
  useEffect(() => {
    if (!containerRef.current || !svgContent) return;

    // Wait for the SVG to be in the DOM
    setTimeout(() => {
      const svgElement = containerRef.current?.querySelector("svg");
      if (!svgElement) return;

      console.log("Applying colors via direct DOM manipulation");

      // Update Fan elements
      const fanElements = svgElement.querySelectorAll(
        '[inkscape\\:label="Fan"], [id="Fan"], g#Fan, [class*="Fan"]',
      );
      fanElements.forEach((el) => {
        console.log("Updating Fan element");
        el.setAttribute("fill", fanColor);
        const style = el.getAttribute("style") || "";
        el.setAttribute(
          "style",
          style.replace(/fill:[^;]+;/, `fill:${fanColor};`),
        );

        // Apply color to all child paths of fan elements
        el.querySelectorAll("path").forEach((path) => {
          path.setAttribute("fill", fanColor);
          path.style.fill = fanColor;
        });
      });

      // Find the specific path with the data you mentioned
      const allPaths = svgElement.querySelectorAll("path");
      allPaths.forEach((path) => {
        const d = path.getAttribute("d");
        if (d && d.includes("m 506,385") && d.includes("c 1.74,19.18")) {
          console.log("Found specific fan path");
          path.setAttribute("fill", fanColor);
          path.style.fill = fanColor;
        }
      });

      // Update Compressor elements
      const compressorElements = svgElement.querySelectorAll(
        '[inkscape\\:label="compressor"], [id="compressor"], g#compressor, [class*="compressor"]',
      );
      compressorElements.forEach((el) => {
        console.log("Updating Compressor element");
        el.setAttribute("fill", compressorColor);
        const style = el.getAttribute("style") || "";
        el.setAttribute(
          "style",
          style.replace(/fill:[^;]+;/, `fill:${compressorColor};`),
        );
      });

      // Update Turbine elements
      const turbineElements = svgElement.querySelectorAll(
        '[inkscape\\:label="Turbinee"], [id="Turbinee"], g#Turbinee, [class*="Turbinee"]',
      );
      turbineElements.forEach((el) => {
        console.log("Updating Turbine element");
        el.setAttribute("fill", turbineColor);
        const style = el.getAttribute("style") || "";
        el.setAttribute(
          "style",
          style.replace(/fill:[^;]+;/, `fill:${turbineColor};`),
        );
      });

      // Update Exhaust elements - first try to find by label "Exaust" (note the spelling in SVG file)
      const exaustElements = svgElement.querySelectorAll(
        '[inkscape\\:label="Exaust"], [id="Exaust"], g#Exaust, [class*="Exaust"]',
      );

      if (exaustElements.length > 0) {
        console.log("Found Exaust elements by label", exaustElements.length);
        exaustElements.forEach((el) => {
          el.setAttribute("fill", exhaustColor);
          const style = el.getAttribute("style") || "";
          el.setAttribute(
            "style",
            style.replace(/fill:[^;]+;/, `fill:${exhaustColor};`),
          );

          // Apply color to all child paths of exhaust elements
          el.querySelectorAll("path").forEach((path) => {
            path.setAttribute("fill", exhaustColor);
            path.style.fill = exhaustColor;
          });
        });
      } else {
        // Fallback: Look for paths in the exhaust area of the engine
        console.log(
          "No labeled exhaust elements found, using geometric targeting",
        );
        allPaths.forEach((path) => {
          const d = path.getAttribute("d");
          // Target paths that are in the rear/exhaust section of the engine
          // This uses geometric positioning to identify exhaust-related paths
          if (
            d &&
            // Paths in the rightmost part of the SVG (assuming engine exhaust is on the right)
            ((d.includes("M 1760") && d.includes("796")) ||
              (d.includes("M 1771") && d.includes("784")) ||
              // Additional paths around exhaust area (can be refined based on SVG content)
              (d.includes("M 1700") &&
                d.includes("730") &&
                d.includes("800")) ||
              // General exhaust section area based on coordinates
              (d.match(/M 1[6-8][0-9]{2},7[0-9]{2}/) && d.match(/8[0-9]{2}/)))
          ) {
            console.log("Found likely exhaust path");
            path.setAttribute("fill", exhaustColor);
            path.style.fill = exhaustColor;

            // Also apply to parent groups that might contain these exhaust paths
            let parent = path.parentElement;
            if (parent && parent.tagName.toLowerCase() === "g") {
              parent.setAttribute("fill", exhaustColor);
              const style = parent.getAttribute("style") || "";
              parent.setAttribute(
                "style",
                style.replace(/fill:[^;]+;/, `fill:${exhaustColor};`),
              );
            }
          }
        });
      }
    }, 100);
  }, [svgContent, fanColor, compressorColor, turbineColor, exhaustColor]);

  /**
   * A more robust method to modify SVG content by creating a DOM, manipulating it,
   * and serializing it back to a string
   */
  const modifySvgContent = (content: string) => {
    if (!content) return null;

    try {
      // Create a DOM parser to properly handle the SVG
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(content, "image/svg+xml");

      // Apply responsive attributes to the root SVG element
      const svgRoot = svgDoc.querySelector("svg");
      if (svgRoot) {
        svgRoot.setAttribute("width", "100%");
        svgRoot.setAttribute("height", "100%");
        svgRoot.setAttribute("preserveAspectRatio", preserveAspectRatio);
        svgRoot.setAttribute("style", "max-width: 100%; height: auto;");
      }

      // Find the specific path and apply fan color directly
      const allPaths = svgDoc.querySelectorAll("path");
      allPaths.forEach((path) => {
        const d = path.getAttribute("d");
        if (d && d.includes("m 506,385") && d.includes("c 1.74,19.18")) {
          console.log("Found specific fan path in SVG content");
          path.setAttribute("fill", fanColor);
          path.setAttribute("style", `fill:${fanColor};`);
        }
      });

      // Log what we find for debugging purposes
      console.log("Searching for components to color:");

      // Function to update fill colors of elements matching a selector
      const updateElementColors = (
        selector: string,
        color: string,
        label: string,
      ) => {
        const elements = svgDoc.querySelectorAll(selector);
        console.log(
          `Found ${elements.length} ${label} elements with selector: ${selector}`,
        );

        elements.forEach((el) => {
          // If element has a style attribute, modify it
          let styleAttr = el.getAttribute("style") || "";

          // Replace fill color if it exists
          if (styleAttr.includes("fill:")) {
            styleAttr = styleAttr.replace(/fill:#[^;]*;/, `fill:${color};`);
          } else {
            // Add fill color if it doesn't exist
            styleAttr += `fill:${color};`;
          }

          el.setAttribute("style", styleAttr);
          console.log(
            `Updated ${label} element:`,
            el.outerHTML.substring(0, 100) + "...",
          );
        });
      };

      // Function to update elements based on path data content
      const updateElementsByPathData = (
        pathDataMatches: string[],
        color: string,
        label: string,
      ) => {
        const allPaths = svgDoc.querySelectorAll("path");
        let matchFound = false;

        allPaths.forEach((path) => {
          const d = path.getAttribute("d");
          if (d && pathDataMatches.some((match) => d.includes(match))) {
            console.log(`Found ${label} path`);

            // Update path fill color
            path.setAttribute("fill", color);

            // Update path style
            let styleAttr = path.getAttribute("style") || "";
            if (styleAttr.includes("fill:")) {
              styleAttr = styleAttr.replace(/fill:#[^;]*;/, `fill:${color};`);
            } else {
              styleAttr += `fill:${color};`;
            }
            path.setAttribute("style", styleAttr);

            // Update parent group if it exists
            const parent = path.parentElement;
            if (parent && parent.tagName.toLowerCase() === "g") {
              parent.setAttribute("fill", color);
              let parentStyle = parent.getAttribute("style") || "";
              if (parentStyle.includes("fill:")) {
                parentStyle = parentStyle.replace(
                  /fill:#[^;]*;/,
                  `fill:${color};`,
                );
              } else {
                parentStyle += `fill:${color};`;
              }
              parent.setAttribute("style", parentStyle);
            }

            matchFound = true;
          }
        });

        return matchFound;
      };

      // Try multiple selectors for each component until we find matches

      // Fan selectors
      [
        '[inkscape\\:label="Fan"]',
        '[id="Fan"]',
        '[class*="Fan"]',
        "g#Fan",
        "g.Fan",
        'path[id*="Fan"]',
      ].some((selector) => {
        const found = svgDoc.querySelectorAll(selector).length > 0;
        if (found) {
          updateElementColors(selector, fanColor, "Fan");
          return true;
        }
        return false;
      });

      // Compressor selectors
      [
        '[inkscape\\:label="compressor"]',
        '[id="compressor"]',
        '[class*="compressor"]',
        "g#compressor",
        "g.compressor",
        'path[id*="compressor"]',
      ].some((selector) => {
        const found = svgDoc.querySelectorAll(selector).length > 0;
        if (found) {
          updateElementColors(selector, compressorColor, "Compressor");
          return true;
        }
        return false;
      });

      // Turbine selectors
      [
        '[inkscape\\:label="Turbinee"]',
        '[id="Turbinee"]',
        '[class*="Turbinee"]',
        "g#Turbinee",
        "g.Turbinee",
        'path[id*="Turbinee"]',
      ].some((selector) => {
        const found = svgDoc.querySelectorAll(selector).length > 0;
        if (found) {
          updateElementColors(selector, turbineColor, "Turbine");
          return true;
        }
        return false;
      });

      // Exhaust selectors - try both spellings "Exhaust" and "Exaust"
      // First try explicit selectors (in case they're added later)
      let exhaustFound = [
        '[inkscape\\:label="Exaust"]',
        '[inkscape\\:label="Exhaust"]',
        '[id="Exaust"]',
        '[id="Exhaust"]',
        '[class*="Exaust"]',
        '[class*="Exhaust"]',
        "g#Exaust",
        "g#Exhaust",
        "g.Exaust",
        "g.Exhaust",
        'path[id*="Exaust"]',
        'path[id*="Exhaust"]',
      ].some((selector) => {
        const found = svgDoc.querySelectorAll(selector).length > 0;
        if (found) {
          updateElementColors(selector, exhaustColor, "Exhaust");
          return true;
        }
        return false;
      });

      // If no explicit labels found, try using path data patterns to identify exhaust area
      if (!exhaustFound) {
        exhaustFound = updateElementsByPathData(
          ["M 1760", "M 1771", "M 1700"],
          exhaustColor,
          "Exhaust",
        );
      }

      // Convert the modified DOM back to a string
      const serializer = new XMLSerializer();
      return serializer.serializeToString(svgDoc);
    } catch (error) {
      console.error("Error modifying SVG content:", error);

      // Fallback to basic string replacement for the Fan layer which we know works
      let modified = content.replace(
        /<svg([^>]*)>/,
        `<svg$1 width="100%" height="100%" preserveAspectRatio="${preserveAspectRatio}" style="max-width: 100%; height: auto;">`,
      );

      modified = modified.replace(
        /inkscape:label="Fan"[\s\S]*?style="([^"]*)fill:#[^;]*;/g,
        `inkscape:label="Fan" style="$1fill:${fanColor};`,
      );

      // Try to replace the fill color for Exaust layer (note the spelling in SVG file)
      modified = modified.replace(
        /inkscape:label="Exaust"[\s\S]*?style="([^"]*)fill:#[^;]*;/g,
        `inkscape:label="Exaust" style="$1fill:${exhaustColor};`,
      );

      // Add fallback replacements for any path potentially in the exhaust section
      // This is a more aggressive approach targeting the path by coordinates in case other methods fail
      modified = modified.replace(
        /(d="[^"]*M 17[6-8][0-9][^"]*7[8-9][0-9][^"]*)(fill="#[^"]+")/g,
        `$1fill="${exhaustColor}"`,
      );

      return modified;
    }
  };

  // Create a container to inject the SVG content
  return (
    <div
      ref={containerRef}
      className={cn(
        "turbine-engine-container relative w-full h-full",
        className,
      )}
      style={{
        width,
        height,
      }}
      dangerouslySetInnerHTML={{
        __html: svgContent
          ? modifySvgContent(svgContent)
          : '<div class="flex items-center justify-center w-full h-full">Loading turbine...</div>',
      }}
    />
  );
}
