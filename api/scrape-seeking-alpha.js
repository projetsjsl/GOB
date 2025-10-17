/**
 * Scraping API - Seeking Alpha Virtual Analyst Report
 * Uses Puppeteer to scrape server-side, bypassing CORS
 *
 * FULLY AUTOMATIC - No manual copy/paste required!
 */

import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export const config = {
  maxDuration: 60, // 60 seconds timeout for scraping
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({
      success: false,
      error: 'Ticker symbol required',
      usage: '/api/scrape-seeking-alpha?ticker=AAPL'
    });
  }

  console.log(`🤖 Starting automatic scraping for ${ticker}...`);

  let browser = null;

  try {
    // Launch Puppeteer with chromium
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Set user agent to avoid bot detection
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    const url = `https://seekingalpha.com/symbol/${ticker}/virtual_analyst_report`;
    console.log(`📄 Loading ${url}...`);

    // Navigate to page
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log(`✅ Page loaded for ${ticker}`);

    // Wait for content to load (adjust selector based on actual page structure)
    await page.waitForSelector('body', { timeout: 10000 });

    // Extract ALL text content from the page
    const scrapedData = await page.evaluate(() => {
      // Get all text content
      const fullText = document.body.innerText;

      // Try to extract structured data if possible
      const sections = {};

      // Look for common section headers
      const sectionHeaders = [
        'Investment Thesis',
        'Valuation',
        'Key Metrics',
        'Financial Performance',
        'Risks',
        'Catalysts',
        'Summary',
        'Price Target'
      ];

      sectionHeaders.forEach(header => {
        const regex = new RegExp(`${header}[\\s\\S]*?(?=(?:${sectionHeaders.join('|')})|$)`, 'i');
        const match = fullText.match(regex);
        if (match) {
          sections[header] = match[0].trim();
        }
      });

      return {
        fullText: fullText,
        sections: sections,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };
    });

    console.log(`✅ Scraped ${scrapedData.fullText.length} characters for ${ticker}`);

    await browser.close();

    // Return scraped data
    return res.status(200).json({
      success: true,
      ticker: ticker,
      data: scrapedData,
      source: 'puppeteer-server-side',
      timestamp: new Date().toISOString(),
      message: `✅ Scraping automatique réussi pour ${ticker}`
    });

  } catch (error) {
    console.error(`❌ Scraping error for ${ticker}:`, error.message);

    if (browser) {
      await browser.close();
    }

    return res.status(500).json({
      success: false,
      ticker: ticker,
      error: error.message,
      fallback: true,
      timestamp: new Date().toISOString()
    });
  }
}
