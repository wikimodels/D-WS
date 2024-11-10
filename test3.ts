import puppeteer from "npm:puppeteer";

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://www.tradingview.com/chart?symbol=BYBIT:BTCUSDT.P"); // Replace 'symbol' with the actual symbol, e.g., BTCUSD
  // Wait for chart to load
  setTimeout(async () => {
    await page.screenshot({ path: "chart.png" });
    await browser.close();
  }, 6000);
})();
