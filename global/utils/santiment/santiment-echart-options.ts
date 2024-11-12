// deno-lint-ignore-file no-explicit-any
import type { SantimentItem } from "../../../models/santiment/santiment-item.ts";

export function getSantimentEChartOptions(item: SantimentItem) {
  const options = {
    tooltip: {
      trigger: "axis",
      position: function (pt: any) {
        return [pt[0], "10%"];
      },
    },
    title: {
      left: "center",
      text: item.label,
    },
    toolbox: {},
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
        name: "Fake Data",
        type: "line",
        smooth: true,
        symbol: "none",
        lineStyle: item.lineStyle,
        areaStyle: item.areaStyle,
        data: item.data,
      },
    ],
  };
  return options;
}
