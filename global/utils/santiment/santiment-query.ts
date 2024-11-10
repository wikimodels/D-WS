export function getSantimentQuery(
  slug: string,
  metric: string,
  fromTime: string,
  toTime: string
) {
  return `
    query {
  getMetric(metric: "${metric}"){
    timeseriesData(
      selector: {slug: "${slug}"}
      from: "${fromTime}"
      to: "${toTime}"      
      interval: "1d"){
        datetime
        value
    }
  }
}`;
}
