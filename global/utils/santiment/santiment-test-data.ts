import type { SantimentItem } from "../../../models/santiment/santiment-item.ts";
const symbol = "SHITUSDT";
const label = `Some ${symbol} Label`;
const slug = "shitcoin";
export const testSantimentItems: SantimentItem[] = [
  {
    areaStyle: {
      color: "#FF5733",
      opacity: 0.4,
      shadowBlur: 5,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
    },
    lineStyle: { color: "#FF5733", width: 1, type: "solid" },
    symbol: symbol,
    label: label,
    metric: "price",
    slug: slug,
    data: Array.from({ length: 180 }, (_, i) => ({
      datetime: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      value: Math.random() * 50000 + 10000,
    })),
  },
  {
    areaStyle: {
      color: "#33FF57",
      opacity: 0.4,
      shadowBlur: 5,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
    },
    lineStyle: { color: "#33FF57", width: 1, type: "solid" },
    symbol: symbol,
    label: label,
    metric: "price",
    slug: slug,
    data: Array.from({ length: 180 }, (_, i) => ({
      datetime: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      value: Math.random() * 3000 + 500,
    })),
  },
  {
    areaStyle: {
      color: "#3357FF",
      opacity: 0.4,
      shadowBlur: 5,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
    },
    lineStyle: { color: "#3357FF", width: 1, type: "solid" },
    symbol: symbol,
    label: label,
    metric: "price",
    slug: slug,
    data: Array.from({ length: 180 }, (_, i) => ({
      datetime: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      value: Math.random() * 2 + 0.5,
    })),
  },
  {
    areaStyle: {
      color: "#FF33A6",
      opacity: 0.4,
      shadowBlur: 5,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
    },
    lineStyle: { color: "#FF33A6", width: 1, type: "solid" },
    symbol: symbol,
    label: label,
    metric: "price",
    slug: slug,
    data: Array.from({ length: 180 }, (_, i) => ({
      datetime: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      value: Math.random() * 1 + 0.2,
    })),
  },
  {
    areaStyle: {
      color: "#FFA533",
      opacity: 0.4,
      shadowBlur: 5,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
    },
    lineStyle: { color: "#FFA533", width: 1, type: "solid" },
    symbol: symbol,
    label: label,
    metric: "price",
    slug: slug,
    data: Array.from({ length: 180 }, (_, i) => ({
      datetime: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      value: Math.random() * 200 + 50,
    })),
  },
];
