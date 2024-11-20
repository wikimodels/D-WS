// deno-lint-ignore-file no-explicit-any
import type { SantimentItem } from "../../../models/santiment/santiment-item.ts";

export function getSantimentEChartOptions(items: SantimentItem[]): any[] {
  if (!items || items.length === 0) {
    console.warn("No items provided to generate ECharts options.");
    return [];
  }

  return items.map((item) => ({
    tooltip: {
      trigger: "axis",
      position: function (pt: any) {
        return [pt[0], "10%"];
      },
    },
    title: {
      left: "center",
      text: item.label || "Untitled Chart",
    },
    toolbox: {
      feature: {
        saveAsImage: { show: true },
        dataZoom: { show: true },
      },
    },
    xAxis: {
      type: "time",
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      boundaryGap: [0, "100%"],
    },
    series: [
      {
        name: item.label || "Data Series",
        type: "line",
        smooth: true,
        symbol: "none",
        lineStyle: item.lineStyle || { width: 1, color: "blue" },
        areaStyle: item.areaStyle || { opacity: 0.3 },
        data: (item.data || []).map((entry: any) => [
          new Date(entry.datetime).getTime(), // Convert datetime to timestamp
          entry.value,
        ]),
      },
    ],
  }));
}
