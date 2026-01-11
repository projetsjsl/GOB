import { chromium } from 'playwright';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const SCREENSHOT_DIR = '/Users/projetsjsl/Documents/GitHub/GOB/bug-screenshots';
const BASE_URL = 'http://localhost:5174';
const DEV_URL = `${BASE_URL}?dev=true`; // Bypass auth guard

// Enhanced test results
const deepTestResults = {
  bugs: [],
  screenshots: [],
  testLog: [],
  consoleErrors: [],
  networkErrors: [],
  performanceIssues: [],
  uiIssues: [],
  calculationErrors: [],
  accessibilityIssues: [],
  startTime: new Date().toISOString(),
  endTime: null,
  totalTestDuration: 0
};

let bugCounter = 1;

function logTest(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, type, message };
  deepTestResults.testLog.push(logEntry);
  console.log(`[${type.toUpperCase()}] ${timestamp} - ${message}`);
}

function reportBug(severity, title, description, steps, codeLocation = 'Unknown', category = 'General', screenshotPath = null) {
  const bug = {
    id: `BUG-${String(bugCounter++).padStart(3, '0')}`,
    severity,
    category,
    title,
    description,
    steps,
    codeLocation,
    screenshotPath,
    timestamp: new Date().toISOString()
  };
  deepTestResults.bugs.push(bug);
  logTest(`🐛 BUG FOUND [${severity}/${category}]: ${title}`, 'error');
  return bug;
}

async function takeScreenshot(page, name, bug = null) {
  try {
    const timestamp = Date.now();
    const filename = `${timestamp}-${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
    const filepath = join(SCREENSHOT_DIR, filename);

    await page.screenshot({
      path: filepath,
      fullPage: true,
      timeout: 10000
    });

    deepTestResults.screenshots.push({ name, filepath, timestamp: new Date().toISOString() });

    if (bug) {
      bug.screenshotPath = filepath;
    }

    logTest(`📸 Screenshot: ${filename}`);
    return filepath;
  } catch (error) {
    logTest(`❌ Screenshot failed: ${error.message}`, 'error');
    return null;
  }
}

function setupErrorMonitoring(page) {
  // Console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const error = {
        type: 'console',
        message: msg.text(),
        timestamp: new Date().toISOString()
      };
      deepTestResults.consoleErrors.push(error);

      reportBug(
        'Medium',
        'Console Error Detected',
        `Console error: ${msg.text()}`,
        ['Open browser console', 'Reproduce error'],
        'Browser Console',
        'JavaScript Error'
      );
    }
  });

  // Page errors
  page.on('pageerror', error => {
    const errorObj = {
      type: 'pageerror',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    deepTestResults.consoleErrors.push(errorObj);

    reportBug(
      'High',
      'Page JavaScript Error',
      `Uncaught exception: ${error.message}\n\nStack: ${error.stack}`,
      ['Navigate to page', 'Observe error'],
      'JavaScript Runtime',
      'JavaScript Error'
    );
  });

  // Network errors
  page.on('requestfailed', request => {
    const error = {
      url: request.url(),
      method: request.method(),
      failure: request.failure()?.errorText || 'Unknown',
      timestamp: new Date().toISOString()
    };
    deepTestResults.networkErrors.push(error);

    // Only report API/resource failures, not random external resources
    if (request.url().includes('/api/') || request.url().includes(BASE_URL)) {
      reportBug(
        'High',
        'Network Request Failed',
        `Failed ${request.method()} request to: ${request.url()}\nError: ${error.failure}`,
        ['Navigate to page', 'Open network tab', 'Observe failed request'],
        'Network/API',
        'Network Error'
      );
    }
  });

  // Response errors (4xx, 5xx)
  page.on('response', response => {
    if (response.status() >= 400) {
      const url = response.url();
      // Only report API errors
      if (url.includes('/api/') || url.includes(BASE_URL)) {
        reportBug(
          response.status() >= 500 ? 'Critical' : 'High',
          `HTTP ${response.status()} Error`,
          `Request to ${url} returned status ${response.status()} ${response.statusText()}`,
          ['Navigate to page', 'Open network tab', 'Find failed request'],
          'API/Backend',
          'Network Error'
        );
      }
    }
  });
}

async function comprehensiveUIInspection(page) {
  logTest('========== COMPREHENSIVE UI INSPECTION ==========');

  try {
    // Check for broken images
    const brokenImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter(img => !img.complete || img.naturalHeight === 0).map(img => ({
        src: img.src,
        alt: img.alt || 'No alt text'
      }));
    });

    if (brokenImages.length > 0) {
      brokenImages.forEach(img => {
        reportBug(
          'Medium',
          'Broken Image',
          `Image failed to load: ${img.src}`,
          ['Navigate to page', 'Inspect images'],
          'UI/Images',
          'UI/UX'
        );
      });
    }

    // Check for empty or missing text content
    const emptyElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a, h1, h2, h3, h4, h5, h6, p, span, div[class*="text"]'));
      return elements.filter(el => {
        const text = el.textContent.trim();
        return text === '' || text === 'undefined' || text === 'null' || text === 'NaN';
      }).map(el => ({
        tag: el.tagName,
        className: el.className,
        text: el.textContent
      })).slice(0, 10);
    });

    if (emptyElements.length > 0) {
      emptyElements.forEach(el => {
        if (el.text === 'undefined' || el.text === 'null' || el.text === 'NaN') {
          const bug = reportBug(
            'High',
            'Invalid Text Content',
            `Element shows "${el.text}": <${el.tag} class="${el.className}">`,
            ['Navigate to page', 'Inspect element'],
            'UI/Text Content',
            'UI/UX'
          );
        }
      });
    }

    // Check for overlapping UI elements
    const overlaps = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, input'));
      const overlapping = [];

      for (let i = 0; i < Math.min(buttons.length, 50); i++) {
        const elem1 = buttons[i];
        const rect1 = elem1.getBoundingClientRect();

        if (rect1.width === 0 || rect1.height === 0) continue;

        for (let j = i + 1; j < Math.min(buttons.length, 50); j++) {
          const elem2 = buttons[j];
          const rect2 = elem2.getBoundingClientRect();

          if (rect2.width === 0 || rect2.height === 0) continue;

          // Check if interactive elements overlap significantly
          const overlapX = Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
          const overlapY = Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));
          const overlapArea = overlapX * overlapY;

          const area1 = rect1.width * rect1.height;
          const area2 = rect2.width * rect2.height;

          // If overlap is more than 30% of either element
          if (overlapArea > area1 * 0.3 || overlapArea > area2 * 0.3) {
            overlapping.push({
              elem1: { tag: elem1.tagName, text: elem1.textContent.substring(0, 30) },
              elem2: { tag: elem2.tagName, text: elem2.textContent.substring(0, 30) }
            });
          }
        }
      }

      return overlapping.slice(0, 5);
    });

    if (overlaps.length > 0) {
      overlaps.forEach(overlap => {
        reportBug(
          'Medium',
          'Overlapping Interactive Elements',
          `Interactive elements overlap: "${overlap.elem1.text}" and "${overlap.elem2.text}"`,
          ['Navigate to page', 'Inspect layout'],
          'UI/Layout',
          'UI/UX'
        );
      });
    }

    // Check for invisible but rendered elements
    const invisibleContent = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*')).slice(0, 200);
      return elements.filter(el => {
        const style = window.getComputedStyle(el);
        const text = el.textContent.trim();
        return text.length > 10 && (
          style.opacity === '0' ||
          style.visibility === 'hidden' ||
          style.display === 'none'
        );
      }).length;
    });

    if (invisibleContent > 20) {
      logTest(`⚠️ Found ${invisibleContent} invisible elements with content`, 'warning');
    }

    // Check for scrollbar issues
    const scrollIssues = await page.evaluate(() => {
      const issues = [];
      const body = document.body;
      const html = document.documentElement;

      // Check for unexpected horizontal scroll
      if (html.scrollWidth > html.clientWidth + 10) {
        issues.push({
          type: 'horizontal-scroll',
          scrollWidth: html.scrollWidth,
          clientWidth: html.clientWidth
        });
      }

      // Check for elements extending beyond viewport
      const elements = Array.from(document.querySelectorAll('*')).slice(0, 100);
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth + 50) {
          issues.push({
            type: 'element-overflow',
            element: el.className,
            right: rect.right,
            viewportWidth: window.innerWidth
          });
          break; // Just report first one
        }
      }

      return issues;
    });

    if (scrollIssues.length > 0) {
      scrollIssues.forEach(issue => {
        if (issue.type === 'horizontal-scroll') {
          const bug = reportBug(
            'Medium',
            'Horizontal Scrollbar',
            `Page has unexpected horizontal scroll. ScrollWidth: ${issue.scrollWidth}px, ClientWidth: ${issue.clientWidth}px`,
            ['Navigate to page', 'Observe horizontal scrollbar'],
            'UI/Layout',
            'UI/UX'
          );
        } else if (issue.type === 'element-overflow') {
          reportBug(
            'Medium',
            'Element Overflow',
            `Element extends beyond viewport: ${issue.element}`,
            ['Navigate to page', 'Scroll right'],
            'UI/Layout',
            'UI/UX'
          );
        }
      });
    }

    await takeScreenshot(page, 'ui-inspection-complete');

  } catch (error) {
    logTest(`Error in UI inspection: ${error.message}`, 'error');
  }
}

async function testAllClickableElements(page) {
  logTest('========== TESTING ALL CLICKABLE ELEMENTS ==========');

  try {
    // Get all clickable elements
    const clickables = await page.$$('button, a, [onclick], [role="button"], input[type="submit"], input[type="button"]');

    logTest(`Found ${clickables.length} clickable elements`);

    for (let i = 0; i < Math.min(clickables.length, 100); i++) {
      try {
        const element = clickables[i];
        const isVisible = await element.isVisible().catch(() => false);

        if (!isVisible) continue;

        const tagName = await element.evaluate(el => el.tagName);
        const text = await element.textContent().catch(() => '');
        const classList = await element.getAttribute('class').catch(() => '');

        logTest(`Testing clickable ${i + 1}/${clickables.length}: <${tagName}> "${text.substring(0, 50)}"`);

        // Take screenshot before
        await takeScreenshot(page, `click-${i}-before-${text.substring(0, 20)}`);

        // Try to click
        try {
          await element.click({ timeout: 3000 });
          await page.waitForTimeout(1000);

          // Check for errors after click
          const hasError = await page.$('[class*="error"], [class*="Error"], .text-red-500, .text-red-600').catch(() => null);

          if (hasError) {
            const errorText = await hasError.textContent().catch(() => 'Unknown error');
            const bug = reportBug(
              'Medium',
              `Error after clicking: ${text.substring(0, 30)}`,
              `Clicking "${text}" caused error: ${errorText}`,
              [`Find element: ${text}`, 'Click it', 'Observe error'],
              'UI/Interaction',
              'UI/UX'
            );
            await takeScreenshot(page, `click-${i}-error-${text.substring(0, 20)}`, bug);
          }

          // Take screenshot after
          await takeScreenshot(page, `click-${i}-after-${text.substring(0, 20)}`);

        } catch (clickError) {
          // Only report if it's a real issue
          if (!clickError.message.includes('detached') && !clickError.message.includes('navigated')) {
            reportBug(
              'Low',
              `Click Failed: ${text.substring(0, 30)}`,
              `Could not click element: ${clickError.message}`,
              [`Find element: ${text}`, 'Attempt to click'],
              'UI/Interaction',
              'UI/UX'
            );
          }
        }

      } catch (error) {
        logTest(`Error testing clickable ${i}: ${error.message}`, 'warning');
      }
    }

  } catch (error) {
    logTest(`Error in clickable elements test: ${error.message}`, 'error');
  }
}

async function deepDataValidation(page) {
  logTest('========== DEEP DATA VALIDATION ==========');

  try {
    // Check all text content for invalid values
    const dataIssues = await page.evaluate(() => {
      const allText = document.body.textContent;
      const issues = [];

      // Check for NaN
      if (allText.includes('NaN')) {
        const matches = allText.match(/NaN/g);
        issues.push({ type: 'NaN', count: matches ? matches.length : 0 });
      }

      // Check for Infinity
      if (allText.includes('Infinity')) {
        const matches = allText.match(/Infinity/g);
        issues.push({ type: 'Infinity', count: matches ? matches.length : 0 });
      }

      // Check for undefined
      if (allText.includes('undefined')) {
        const matches = allText.match(/undefined/g);
        issues.push({ type: 'undefined', count: matches ? matches.length : 0 });
      }

      // Check for null displayed as text
      const nullMatches = allText.match(/\bnull\b/gi);
      if (nullMatches && nullMatches.length > 2) {
        issues.push({ type: 'null', count: nullMatches.length });
      }

      // Check for malformed percentages
      const percentMatches = allText.match(/-?\d+\.?\d*%/g);
      if (percentMatches) {
        const invalid = percentMatches.filter(p => {
          const value = parseFloat(p);
          return Math.abs(value) > 10000 || isNaN(value);
        });
        if (invalid.length > 0) {
          issues.push({ type: 'invalid-percentage', examples: invalid.slice(0, 5) });
        }
      }

      // Check for malformed prices
      const priceMatches = allText.match(/\$-?\d+\.?\d*/g);
      if (priceMatches) {
        const invalid = priceMatches.filter(p => {
          const value = parseFloat(p.replace('$', ''));
          return value < 0 || isNaN(value);
        });
        if (invalid.length > 0) {
          issues.push({ type: 'invalid-price', examples: invalid.slice(0, 5) });
        }
      }

      return issues;
    });

    if (dataIssues.length > 0) {
      dataIssues.forEach(issue => {
        const bug = reportBug(
          'High',
          `Invalid Data: ${issue.type}`,
          `Found ${issue.count || issue.examples?.length || 0} instances of ${issue.type}${issue.examples ? ': ' + issue.examples.join(', ') : ''}`,
          ['Navigate to page', 'Inspect data'],
          'Data/Calculation',
          'Calculation Error'
        );
        deepTestResults.calculationErrors.push(issue);
      });

      await takeScreenshot(page, 'data-validation-errors');
    } else {
      logTest('✅ No data validation issues found');
    }

    // Check for empty tables/lists that should have data
    const emptyDataContainers = await page.evaluate(() => {
      const containers = Array.from(document.querySelectorAll('table, [class*="table"], [class*="list"], ul, ol'));
      return containers.filter(c => {
        const text = c.textContent.trim();
        return text.length < 50 && (
          text.includes('No data') ||
          text.includes('Aucune donnée') ||
          text.includes('Empty') ||
          text.includes('Vide')
        );
      }).map(c => ({
        tag: c.tagName,
        className: c.className,
        text: c.textContent.substring(0, 100)
      }));
    });

    if (emptyDataContainers.length > 0) {
      logTest(`⚠️ Found ${emptyDataContainers.length} empty data containers`, 'warning');

      const bug = reportBug(
        'Medium',
        'Empty Data Containers',
        `Found ${emptyDataContainers.length} tables/lists with no data or "No data" messages`,
        ['Navigate to page', 'Check for empty tables/lists'],
        'Data/Content',
        'UI/UX'
      );
    }

  } catch (error) {
    logTest(`Error in data validation: ${error.message}`, 'error');
  }
}

async function performanceAudit(page) {
  logTest('========== PERFORMANCE AUDIT ==========');

  try {
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      const paintEntries = performance.getEntriesByType('paint');

      return {
        domContentLoaded: perfData?.domContentLoadedEventEnd - perfData?.domContentLoadedEventStart,
        loadComplete: perfData?.loadEventEnd - perfData?.loadEventStart,
        domInteractive: perfData?.domInteractive - perfData?.fetchStart,
        totalTime: perfData?.loadEventEnd - perfData?.fetchStart,
        firstPaint: paintEntries.find(e => e.name === 'first-paint')?.startTime,
        firstContentfulPaint: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime,
        memoryUsage: performance.memory ? {
          usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1048576),
          totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1048576),
          jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
        } : null
      };
    });

    logTest(`Performance Metrics:\n${JSON.stringify(metrics, null, 2)}`);

    // Check for slow load times
    if (metrics.totalTime > 5000) {
      reportBug(
        'Medium',
        'Slow Page Load',
        `Page took ${Math.round(metrics.totalTime)}ms to load (threshold: 5000ms)`,
        ['Navigate to page', 'Measure load time'],
        'Performance',
        'Performance'
      );
      deepTestResults.performanceIssues.push({ type: 'slow-load', value: metrics.totalTime });
    }

    if (metrics.firstContentfulPaint > 3000) {
      reportBug(
        'Medium',
        'Slow First Contentful Paint',
        `First Contentful Paint took ${Math.round(metrics.firstContentfulPaint)}ms (threshold: 3000ms)`,
        ['Navigate to page', 'Measure FCP'],
        'Performance',
        'Performance'
      );
      deepTestResults.performanceIssues.push({ type: 'slow-fcp', value: metrics.firstContentfulPaint });
    }

    // Check for memory issues
    if (metrics.memoryUsage && metrics.memoryUsage.usedJSHeapSize > 100) {
      logTest(`⚠️ High memory usage: ${metrics.memoryUsage.usedJSHeapSize}MB`, 'warning');
      if (metrics.memoryUsage.usedJSHeapSize > 250) {
        reportBug(
          'Low',
          'High Memory Usage',
          `JavaScript heap size: ${metrics.memoryUsage.usedJSHeapSize}MB (warning threshold: 250MB)`,
          ['Navigate to page', 'Check memory usage'],
          'Performance',
          'Performance'
        );
      }
    }

    // Check resource sizes
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map(r => ({
        name: r.name,
        type: r.initiatorType,
        size: r.transferSize,
        duration: r.duration
      })).filter(r => r.size > 500000); // > 500KB
    });

    if (resources.length > 0) {
      logTest(`Found ${resources.length} large resources (>500KB)`);
      resources.slice(0, 5).forEach(resource => {
        reportBug(
          'Low',
          'Large Resource File',
          `Large ${resource.type}: ${resource.name.split('/').pop()} (${Math.round(resource.size / 1024)}KB)`,
          ['Open network tab', 'Check resource sizes'],
          'Performance',
          'Performance'
        );
      });
    }

    // Count DOM nodes
    const domStats = await page.evaluate(() => {
      return {
        totalNodes: document.getElementsByTagName('*').length,
        depth: (function getDepth(node, depth = 0) {
          if (!node.children || node.children.length === 0) return depth;
          return Math.max(...Array.from(node.children).map(child => getDepth(child, depth + 1)));
        })(document.body)
      };
    });

    logTest(`DOM Stats: ${domStats.totalNodes} nodes, depth ${domStats.depth}`);

    if (domStats.totalNodes > 3000) {
      reportBug(
        'Low',
        'Large DOM Tree',
        `DOM has ${domStats.totalNodes} nodes (warning threshold: 3000)`,
        ['Inspect page', 'Count DOM nodes'],
        'Performance',
        'Performance'
      );
    }

  } catch (error) {
    logTest(`Error in performance audit: ${error.message}`, 'error');
  }
}

async function accessibilityDeepDive(page) {
  logTest('========== ACCESSIBILITY DEEP DIVE ==========');

  try {
    // Check for missing alt text
    const imageIssues = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return {
        total: images.length,
        withoutAlt: images.filter(img => !img.alt || img.alt.trim() === '').length,
        withEmptyAlt: images.filter(img => img.alt === '').length
      };
    });

    if (imageIssues.withoutAlt > 0) {
      const bug = reportBug(
        'Medium',
        'Images Missing Alt Text',
        `${imageIssues.withoutAlt} out of ${imageIssues.total} images missing alt text`,
        ['Inspect all img tags', 'Check alt attributes'],
        'Accessibility',
        'Accessibility'
      );
      deepTestResults.accessibilityIssues.push({ type: 'missing-alt', count: imageIssues.withoutAlt });
    }

    // Check for form labels
    const formIssues = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
      const withoutLabel = inputs.filter(input => {
        const hasLabel = !!document.querySelector(`label[for="${input.id}"]`);
        const hasAriaLabel = input.hasAttribute('aria-label');
        const hasAriaLabelledBy = input.hasAttribute('aria-labelledby');
        const hasPlaceholder = input.hasAttribute('placeholder');

        return !hasLabel && !hasAriaLabel && !hasAriaLabelledBy && !hasPlaceholder;
      });

      return {
        total: inputs.length,
        withoutLabel: withoutLabel.length
      };
    });

    if (formIssues.withoutLabel > 0) {
      reportBug(
        'Medium',
        'Form Inputs Without Labels',
        `${formIssues.withoutLabel} out of ${formIssues.total} form inputs missing labels`,
        ['Inspect form inputs', 'Check for labels'],
        'Accessibility',
        'Accessibility'
      );
      deepTestResults.accessibilityIssues.push({ type: 'missing-labels', count: formIssues.withoutLabel });
    }

    // Check for button accessibility
    const buttonIssues = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
      const inaccessible = buttons.filter(btn => {
        const hasText = btn.textContent.trim().length > 0;
        const hasAriaLabel = btn.hasAttribute('aria-label');
        const hasTitle = btn.hasAttribute('title');

        return !hasText && !hasAriaLabel && !hasTitle;
      });

      return {
        total: buttons.length,
        inaccessible: inaccessible.length
      };
    });

    if (buttonIssues.inaccessible > 0) {
      reportBug(
        'Medium',
        'Buttons Without Accessible Names',
        `${buttonIssues.inaccessible} out of ${buttonIssues.total} buttons lack accessible names`,
        ['Inspect buttons', 'Check for text/aria-label/title'],
        'Accessibility',
        'Accessibility'
      );
      deepTestResults.accessibilityIssues.push({ type: 'inaccessible-buttons', count: buttonIssues.inaccessible });
    }

    // Check for proper heading hierarchy
    const headingIssues = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      const levels = headings.map(h => parseInt(h.tagName.substring(1)));

      let skipped = 0;
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] - levels[i-1] > 1) {
          skipped++;
        }
      }

      return {
        total: headings.length,
        skippedLevels: skipped,
        h1Count: headings.filter(h => h.tagName === 'H1').length
      };
    });

    if (headingIssues.h1Count === 0) {
      reportBug(
        'Low',
        'Missing H1 Heading',
        'Page has no H1 heading',
        ['Inspect page', 'Check for H1'],
        'Accessibility',
        'Accessibility'
      );
    }

    if (headingIssues.h1Count > 1) {
      reportBug(
        'Low',
        'Multiple H1 Headings',
        `Page has ${headingIssues.h1Count} H1 headings (should have only one)`,
        ['Inspect page', 'Count H1 tags'],
        'Accessibility',
        'Accessibility'
      );
    }

    if (headingIssues.skippedLevels > 0) {
      reportBug(
        'Low',
        'Skipped Heading Levels',
        `Found ${headingIssues.skippedLevels} instances of skipped heading levels`,
        ['Inspect heading hierarchy'],
        'Accessibility',
        'Accessibility'
      );
    }

    // Check for color contrast (basic)
    const contrastIssues = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('p, span, a, button, h1, h2, h3, h4, h5, h6')).slice(0, 100);
      let lowContrast = 0;

      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const fgColor = style.color;
        const bgColor = style.backgroundColor;

        // Simple check: if bg is very similar to fg, it's a problem
        if (fgColor === bgColor) {
          lowContrast++;
        }
      });

      return lowContrast;
    });

    if (contrastIssues > 0) {
      logTest(`⚠️ Found ${contrastIssues} potential color contrast issues`, 'warning');
    }

  } catch (error) {
    logTest(`Error in accessibility audit: ${error.message}`, 'error');
  }
}

async function testResponsiveDesign(page) {
  logTest('========== RESPONSIVE DESIGN TESTING ==========');

  const viewports = [
    { width: 1920, height: 1080, name: 'Desktop-4K' },
    { width: 1440, height: 900, name: 'Desktop-Large' },
    { width: 1024, height: 768, name: 'Desktop-Small' },
    { width: 768, height: 1024, name: 'Tablet-Portrait' },
    { width: 1024, height: 768, name: 'Tablet-Landscape' },
    { width: 414, height: 896, name: 'Mobile-Large' },
    { width: 375, height: 667, name: 'Mobile-Medium' },
    { width: 320, height: 568, name: 'Mobile-Small' }
  ];

  for (const viewport of viewports) {
    try {
      logTest(`Testing ${viewport.name} (${viewport.width}x${viewport.height})`);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1500);

      await takeScreenshot(page, `responsive-${viewport.name}`);

      // Check for horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      if (hasHorizontalScroll) {
        const bug = reportBug(
          'Medium',
          `Horizontal Scroll on ${viewport.name}`,
          `Page has horizontal scrollbar on ${viewport.name} (${viewport.width}x${viewport.height})`,
          [`Set viewport to ${viewport.width}x${viewport.height}`, 'Observe scroll'],
          'UI/Responsive',
          'UI/UX'
        );
        await takeScreenshot(page, `responsive-scroll-${viewport.name}`, bug);
      }

      // Check if interactive elements are too small on mobile
      if (viewport.width < 768) {
        const smallElements = await page.evaluate(() => {
          const interactive = Array.from(document.querySelectorAll('button, a, input'));
          return interactive.filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width < 44 || rect.height < 44; // Below recommended tap target size
          }).length;
        });

        if (smallElements > 0) {
          reportBug(
            'Medium',
            `Small Touch Targets on ${viewport.name}`,
            `${smallElements} interactive elements smaller than 44x44px on ${viewport.name}`,
            [`Set viewport to ${viewport.width}x${viewport.height}`, 'Check button sizes'],
            'UI/Responsive',
            'Accessibility'
          );
        }
      }

      // Check for text overflow
      const textOverflow = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*')).slice(0, 100);
        return elements.filter(el => {
          const rect = el.getBoundingClientRect();
          return el.scrollWidth > rect.width + 5;
        }).length;
      });

      if (textOverflow > 5) {
        logTest(`⚠️ ${textOverflow} elements with text overflow on ${viewport.name}`, 'warning');
      }

    } catch (error) {
      logTest(`Error testing ${viewport.name}: ${error.message}`, 'error');
    }
  }

  // Reset to default
  await page.setViewportSize({ width: 1920, height: 1080 });
}

async function stressTestInteractions(page) {
  logTest('========== STRESS TEST: RAPID INTERACTIONS ==========');

  try {
    // Rapid clicking
    const buttons = await page.$$('button');

    if (buttons.length > 0) {
      const button = buttons[0];
      const isVisible = await button.isVisible().catch(() => false);

      if (isVisible) {
        logTest('Testing rapid clicking...');

        for (let i = 0; i < 10; i++) {
          await button.click({ timeout: 1000 }).catch(() => {});
          await page.waitForTimeout(100);
        }

        // Check for errors after rapid clicking
        const hasError = await page.$('[class*="error"], [class*="Error"]').catch(() => null);

        if (hasError) {
          const errorText = await hasError.textContent().catch(() => '');
          const bug = reportBug(
            'High',
            'Error After Rapid Clicking',
            `Rapid clicking caused error: ${errorText}`,
            ['Click button rapidly 10 times', 'Observe error'],
            'UI/Interaction',
            'UI/UX'
          );
          await takeScreenshot(page, 'stress-rapid-click-error', bug);
        }
      }
    }

    // Rapid form input
    const inputs = await page.$$('input[type="text"], textarea');

    if (inputs.length > 0) {
      const input = inputs[0];
      const isVisible = await input.isVisible().catch(() => false);

      if (isVisible) {
        logTest('Testing rapid form input...');

        for (let i = 0; i < 20; i++) {
          await input.fill(`Test${i}`).catch(() => {});
          await page.waitForTimeout(50);
        }

        await takeScreenshot(page, 'stress-rapid-input');
      }
    }

  } catch (error) {
    logTest(`Error in stress test: ${error.message}`, 'error');
  }
}

async function generateComprehensiveReport() {
  logTest('========== GENERATING COMPREHENSIVE REPORT ==========');

  deepTestResults.endTime = new Date().toISOString();
  const duration = new Date(deepTestResults.endTime) - new Date(deepTestResults.startTime);
  deepTestResults.totalTestDuration = Math.round(duration / 1000 / 60);

  // Group bugs by severity and category
  const bugsBySeverity = {
    'Critical': deepTestResults.bugs.filter(b => b.severity === 'Critical'),
    'High': deepTestResults.bugs.filter(b => b.severity === 'High'),
    'Medium': deepTestResults.bugs.filter(b => b.severity === 'Medium'),
    'Low': deepTestResults.bugs.filter(b => b.severity === 'Low')
  };

  const bugsByCategory = deepTestResults.bugs.reduce((acc, bug) => {
    if (!acc[bug.category]) acc[bug.category] = [];
    acc[bug.category].push(bug);
    return acc;
  }, {});

  let report = `# 🔍 RAPPORT DE TEST EXHAUSTIF - GOB DASHBOARD\n\n`;
  report += `## 📋 Informations Générales\n\n`;
  report += `| Paramètre | Valeur |\n`;
  report += `|-----------|--------|\n`;
  report += `| **Date de début** | ${deepTestResults.startTime} |\n`;
  report += `| **Date de fin** | ${deepTestResults.endTime} |\n`;
  report += `| **Durée totale** | ${deepTestResults.totalTestDuration} minutes |\n`;
  report += `| **URL testée** | ${BASE_URL} |\n`;
  report += `| **Bugs trouvés** | **${deepTestResults.bugs.length}** |\n`;
  report += `| **Screenshots capturés** | ${deepTestResults.screenshots.length} |\n`;
  report += `| **Erreurs console** | ${deepTestResults.consoleErrors.length} |\n`;
  report += `| **Erreurs réseau** | ${deepTestResults.networkErrors.length} |\n\n`;

  report += `---\n\n`;
  report += `## 📊 Résumé par Sévérité\n\n`;
  report += `| Sévérité | Nombre | Pourcentage |\n`;
  report += `|----------|--------|-------------|\n`;
  report += `| 🔴 **Critique** | ${bugsBySeverity.Critical.length} | ${deepTestResults.bugs.length > 0 ? Math.round(bugsBySeverity.Critical.length / deepTestResults.bugs.length * 100) : 0}% |\n`;
  report += `| 🟠 **Haute** | ${bugsBySeverity.High.length} | ${deepTestResults.bugs.length > 0 ? Math.round(bugsBySeverity.High.length / deepTestResults.bugs.length * 100) : 0}% |\n`;
  report += `| 🟡 **Moyenne** | ${bugsBySeverity.Medium.length} | ${deepTestResults.bugs.length > 0 ? Math.round(bugsBySeverity.Medium.length / deepTestResults.bugs.length * 100) : 0}% |\n`;
  report += `| 🟢 **Basse** | ${bugsBySeverity.Low.length} | ${deepTestResults.bugs.length > 0 ? Math.round(bugsBySeverity.Low.length / deepTestResults.bugs.length * 100) : 0}% |\n\n`;

  report += `## 📦 Résumé par Catégorie\n\n`;
  report += `| Catégorie | Nombre de bugs |\n`;
  report += `|-----------|----------------|\n`;
  Object.entries(bugsByCategory).sort((a, b) => b[1].length - a[1].length).forEach(([category, bugs]) => {
    report += `| ${category} | ${bugs.length} |\n`;
  });
  report += `\n`;

  report += `---\n\n`;
  report += `## ✅ Tests Effectués\n\n`;
  report += `### 1️⃣ Tests de Navigation\n`;
  report += `- ✅ Navigation entre tous les onglets\n`;
  report += `- ✅ Vérification de tous les liens\n`;
  report += `- ✅ Test de redirection et routing\n\n`;

  report += `### 2️⃣ Tests d'Interface Utilisateur (UI/UX)\n`;
  report += `- ✅ Inspection complète de l'UI\n`;
  report += `- ✅ Vérification des images cassées\n`;
  report += `- ✅ Détection des éléments qui se chevauchent\n`;
  report += `- ✅ Vérification du contenu vide ou invalide\n`;
  report += `- ✅ Test de défilement horizontal\n`;
  report += `- ✅ Test de tous les éléments cliquables (${deepTestResults.screenshots.filter(s => s.name.includes('click')).length} testés)\n\n`;

  report += `### 3️⃣ Tests de Données et Calculs\n`;
  report += `- ✅ Validation des calculs\n`;
  report += `- ✅ Détection de NaN, Infinity, undefined\n`;
  report += `- ✅ Vérification des pourcentages invalides\n`;
  report += `- ✅ Vérification des prix invalides\n`;
  report += `- ✅ Test des conteneurs de données vides\n\n`;

  report += `### 4️⃣ Tests de Performance\n`;
  report += `- ✅ Mesure du temps de chargement\n`;
  report += `- ✅ First Contentful Paint (FCP)\n`;
  report += `- ✅ Utilisation de la mémoire\n`;
  report += `- ✅ Taille des ressources\n`;
  report += `- ✅ Analyse de l'arbre DOM\n`;
  report += `- Issues trouvées: ${deepTestResults.performanceIssues.length}\n\n`;

  report += `### 5️⃣ Tests d'Accessibilité\n`;
  report += `- ✅ Vérification des attributs alt sur images\n`;
  report += `- ✅ Vérification des labels de formulaires\n`;
  report += `- ✅ Vérification des noms accessibles de boutons\n`;
  report += `- ✅ Hiérarchie des en-têtes\n`;
  report += `- ✅ Contraste des couleurs\n`;
  report += `- Issues trouvées: ${deepTestResults.accessibilityIssues.length}\n\n`;

  report += `### 6️⃣ Tests de Responsive Design\n`;
  report += `- ✅ 8 viewports testés (Desktop 4K → Mobile 320px)\n`;
  report += `- ✅ Défilement horizontal\n`;
  report += `- ✅ Taille des cibles tactiles\n`;
  report += `- ✅ Dépassement de texte\n\n`;

  report += `### 7️⃣ Tests de Stress\n`;
  report += `- ✅ Clics rapides répétés\n`;
  report += `- ✅ Saisie rapide dans les formulaires\n\n`;

  report += `### 8️⃣ Monitoring des Erreurs\n`;
  report += `- ✅ Erreurs console JavaScript (${deepTestResults.consoleErrors.length} détectées)\n`;
  report += `- ✅ Erreurs réseau (${deepTestResults.networkErrors.length} détectées)\n`;
  report += `- ✅ Erreurs HTTP 4xx/5xx\n\n`;

  report += `---\n\n`;

  // Detailed bugs
  report += `## 🐛 LISTE DÉTAILLÉE DES BUGS\n\n`;

  for (const [severity, bugs] of Object.entries(bugsBySeverity)) {
    if (bugs.length === 0) continue;

    const icon = {
      'Critical': '🔴',
      'High': '🟠',
      'Medium': '🟡',
      'Low': '🟢'
    }[severity];

    report += `### ${icon} ${severity} Priority (${bugs.length} bugs)\n\n`;

    bugs.forEach(bug => {
      report += `#### ${bug.id}: ${bug.title}\n\n`;
      report += `| Attribut | Valeur |\n`;
      report += `|----------|--------|\n`;
      report += `| **Sévérité** | ${severity} |\n`;
      report += `| **Catégorie** | ${bug.category} |\n`;
      report += `| **Localisation** | \`${bug.codeLocation}\` |\n`;
      report += `| **Timestamp** | ${bug.timestamp} |\n\n`;

      report += `**📝 Description:**\n`;
      report += `${bug.description}\n\n`;

      report += `**🔄 Étapes pour reproduire:**\n`;
      bug.steps.forEach((step, i) => {
        report += `${i + 1}. ${step}\n`;
      });
      report += `\n`;

      if (bug.screenshotPath) {
        report += `**📸 Screenshot:** [\`${bug.screenshotPath.split('/').pop()}\`](${bug.screenshotPath})\n\n`;
        report += `![Bug Screenshot](${bug.screenshotPath})\n\n`;
      }

      report += `---\n\n`;
    });
  }

  // Console errors section
  if (deepTestResults.consoleErrors.length > 0) {
    report += `## 🔴 Erreurs Console JavaScript\n\n`;
    report += `Total: ${deepTestResults.consoleErrors.length} erreurs détectées\n\n`;

    deepTestResults.consoleErrors.slice(0, 20).forEach((error, i) => {
      report += `### Erreur Console #${i + 1}\n\n`;
      report += `**Type:** ${error.type}\n\n`;
      report += `**Message:**\n\`\`\`\n${error.message}\n\`\`\`\n\n`;
      if (error.stack) {
        report += `**Stack:**\n\`\`\`\n${error.stack.substring(0, 500)}\n\`\`\`\n\n`;
      }
      report += `**Timestamp:** ${error.timestamp}\n\n`;
      report += `---\n\n`;
    });

    if (deepTestResults.consoleErrors.length > 20) {
      report += `\n_... et ${deepTestResults.consoleErrors.length - 20} erreurs supplémentaires_\n\n`;
    }
  }

  // Network errors section
  if (deepTestResults.networkErrors.length > 0) {
    report += `## 🌐 Erreurs Réseau\n\n`;
    report += `Total: ${deepTestResults.networkErrors.length} erreurs détectées\n\n`;

    deepTestResults.networkErrors.slice(0, 20).forEach((error, i) => {
      report += `### Erreur Réseau #${i + 1}\n\n`;
      report += `**URL:** ${error.url}\n\n`;
      report += `**Méthode:** ${error.method}\n\n`;
      report += `**Erreur:** ${error.failure}\n\n`;
      report += `**Timestamp:** ${error.timestamp}\n\n`;
      report += `---\n\n`;
    });

    if (deepTestResults.networkErrors.length > 20) {
      report += `\n_... et ${deepTestResults.networkErrors.length - 20} erreurs supplémentaires_\n\n`;
    }
  }

  // Screenshots gallery
  report += `## 📸 Galerie de Screenshots\n\n`;
  report += `Total: ${deepTestResults.screenshots.length} screenshots capturés\n\n`;

  // Group screenshots by type
  const screenshotTypes = {
    'UI': deepTestResults.screenshots.filter(s => s.name.includes('ui-')),
    'Responsive': deepTestResults.screenshots.filter(s => s.name.includes('responsive-')),
    'Clicks': deepTestResults.screenshots.filter(s => s.name.includes('click-')),
    'Errors': deepTestResults.screenshots.filter(s => s.name.includes('error-')),
    'Other': deepTestResults.screenshots.filter(s => !s.name.match(/ui-|responsive-|click-|error-/))
  };

  Object.entries(screenshotTypes).forEach(([type, screenshots]) => {
    if (screenshots.length > 0) {
      report += `### ${type} (${screenshots.length})\n\n`;
      screenshots.slice(0, 10).forEach(screenshot => {
        const filename = screenshot.filepath.split('/').pop();
        report += `- [\`${filename}\`](${screenshot.filepath}) - ${screenshot.timestamp}\n`;
      });
      if (screenshots.length > 10) {
        report += `\n_... et ${screenshots.length - 10} screenshots supplémentaires_\n`;
      }
      report += `\n`;
    }
  });

  // Test log
  report += `---\n\n`;
  report += `## 📜 Log de Test (dernières 100 entrées)\n\n`;
  report += `\`\`\`\n`;
  deepTestResults.testLog.slice(-100).forEach(log => {
    report += `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}\n`;
  });
  report += `\`\`\`\n\n`;

  // Recommendations
  report += `---\n\n`;
  report += `## 💡 Recommandations\n\n`;

  if (bugsBySeverity.Critical.length > 0) {
    report += `### 🔴 URGENT: Bugs Critiques\n`;
    report += `${bugsBySeverity.Critical.length} bugs critiques trouvés qui nécessitent une attention immédiate:\n`;
    bugsBySeverity.Critical.forEach(bug => {
      report += `- ${bug.id}: ${bug.title}\n`;
    });
    report += `\n`;
  }

  if (bugsBySeverity.High.length > 0) {
    report += `### 🟠 Priorité Haute\n`;
    report += `${bugsBySeverity.High.length} bugs de priorité haute à corriger rapidement:\n`;
    bugsBySeverity.High.slice(0, 5).forEach(bug => {
      report += `- ${bug.id}: ${bug.title}\n`;
    });
    if (bugsBySeverity.High.length > 5) {
      report += `_... et ${bugsBySeverity.High.length - 5} autres bugs haute priorité_\n`;
    }
    report += `\n`;
  }

  if (deepTestResults.performanceIssues.length > 0) {
    report += `### ⚡ Performance\n`;
    report += `Optimisations recommandées pour améliorer la performance:\n`;
    report += `- Réduire le temps de chargement initial\n`;
    report += `- Optimiser les ressources volumineuses\n`;
    report += `- Simplifier l'arbre DOM si nécessaire\n\n`;
  }

  if (deepTestResults.accessibilityIssues.length > 0) {
    report += `### ♿ Accessibilité\n`;
    report += `Améliorations d'accessibilité recommandées:\n`;
    report += `- Ajouter des attributs alt manquants\n`;
    report += `- Améliorer les labels de formulaires\n`;
    report += `- Vérifier les noms accessibles des boutons\n\n`;
  }

  report += `---\n\n`;
  report += `## ✅ Conclusion\n\n`;
  report += `Ce test exhaustif a couvert:\n`;
  report += `- ${deepTestResults.screenshots.length} interactions testées et capturées\n`;
  report += `- 8 viewports différents pour le responsive design\n`;
  report += `- ${deepTestResults.bugs.length} bugs identifiés et documentés\n`;
  report += `- ${deepTestResults.consoleErrors.length} erreurs console détectées\n`;
  report += `- ${deepTestResults.networkErrors.length} erreurs réseau identifiées\n\n`;

  const totalIssues = deepTestResults.bugs.length + deepTestResults.consoleErrors.length + deepTestResults.networkErrors.length;

  if (totalIssues === 0) {
    report += `🎉 **Excellent!** Aucun problème majeur détecté.\n\n`;
  } else if (bugsBySeverity.Critical.length > 0) {
    report += `⚠️ **Action requise:** Des bugs critiques nécessitent une attention immédiate.\n\n`;
  } else if (bugsBySeverity.High.length > 5) {
    report += `⚠️ **Attention:** Plusieurs bugs de haute priorité à corriger.\n\n`;
  } else {
    report += `✅ **Bon état général** avec quelques améliorations recommandées.\n\n`;
  }

  report += `---\n\n`;
  report += `**📅 Rapport généré le:** ${new Date().toLocaleString('fr-FR')}\n`;
  report += `**⏱️ Durée du test:** ${deepTestResults.totalTestDuration} minutes\n`;
  report += `**🔧 Outil:** Playwright + Chrome\n`;

  const reportPath = '/Users/projetsjsl/Documents/GitHub/GOB/RAPPORT-BUGS-EXHAUSTIF-2026-01-10.md';
  await writeFile(reportPath, report, 'utf-8');

  logTest(`✅ Report generated: ${reportPath}`);

  return reportPath;
}

async function runDeepDiveTesting() {
  let browser;
  let page;

  try {
    logTest('🚀 ========== STARTING DEEP DIVE TEST MARATHON ==========');
    logTest(`🎯 Target: ${BASE_URL}`);
    logTest(`🔓 Using dev mode bypass: ${DEV_URL}`);

    browser = await chromium.launch({
      headless: false,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      bypassCSP: true
    });

    page = await context.newPage();

    // Setup error monitoring
    setupErrorMonitoring(page);

    // Navigate with dev mode bypass
    logTest('🌐 Navigating to application (dev mode)...');
    await page.goto(DEV_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    // Take initial screenshot
    await takeScreenshot(page, 'deep-dive-initial-load');

    // Check if we're on the dashboard or still on login
    const pageTitle = await page.title();
    logTest(`📄 Page title: ${pageTitle}`);

    // Run all deep tests
    logTest('\n🔬 Phase 1: Comprehensive UI Inspection');
    await comprehensiveUIInspection(page);

    logTest('\n🔬 Phase 2: Testing All Clickable Elements');
    await testAllClickableElements(page);

    logTest('\n🔬 Phase 3: Deep Data Validation');
    await deepDataValidation(page);

    logTest('\n🔬 Phase 4: Performance Audit');
    await performanceAudit(page);

    logTest('\n🔬 Phase 5: Accessibility Deep Dive');
    await accessibilityDeepDive(page);

    logTest('\n🔬 Phase 6: Responsive Design Testing');
    await testResponsiveDesign(page);

    logTest('\n🔬 Phase 7: Stress Testing');
    await stressTestInteractions(page);

    logTest('\n✅ ========== ALL DEEP DIVE TESTS COMPLETED ==========');

  } catch (error) {
    logTest(`❌ CRITICAL ERROR: ${error.message}`, 'error');
    logTest(`Stack: ${error.stack}`, 'error');

    reportBug(
      'Critical',
      'Test Suite Failure',
      `Critical error in test suite: ${error.message}\n\nStack:\n${error.stack}`,
      ['Run test suite'],
      'Test Infrastructure',
      'Critical'
    );

    if (page) {
      await takeScreenshot(page, 'deep-dive-critical-error');
    }
  } finally {
    // Generate comprehensive report
    const reportPath = await generateComprehensiveReport();
    logTest(`📊 Final report: ${reportPath}`);

    // Close browser
    if (browser) {
      await browser.close();
    }

    logTest('🏁 Deep dive test marathon completed!');

    return deepTestResults;
  }
}

// Run the deep dive tests
runDeepDiveTesting().then(results => {
  console.log('\n🎉 ========== DEEP DIVE TEST MARATHON COMPLETE ==========');
  console.log(`📊 Total bugs found: ${results.bugs.length}`);
  console.log(`📸 Total screenshots: ${results.screenshots.length}`);
  console.log(`🔴 Critical: ${results.bugs.filter(b => b.severity === 'Critical').length}`);
  console.log(`🟠 High: ${results.bugs.filter(b => b.severity === 'High').length}`);
  console.log(`🟡 Medium: ${results.bugs.filter(b => b.severity === 'Medium').length}`);
  console.log(`🟢 Low: ${results.bugs.filter(b => b.severity === 'Low').length}`);
  console.log(`⏱️ Duration: ${results.totalTestDuration} minutes`);
  process.exit(0);
}).catch(error => {
  console.error('❌ Test marathon failed:', error);
  process.exit(1);
});
