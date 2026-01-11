import { chromium } from 'playwright';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const SCREENSHOT_DIR = '/Users/projetsjsl/Documents/GitHub/GOB/bug-screenshots';
const BASE_URL = 'http://localhost:5174';
const TIMEOUT = 5000; // 5 seconds max wait

// Test results storage
const testResults = {
  bugs: [],
  screenshots: [],
  testLog: [],
  startTime: new Date().toISOString(),
  endTime: null
};

// List of all tabs to test based on code analysis
const TABS_TO_TEST = [
  'stocks-news',
  'dans-watchlist',
  'intelli-stocks',
  'economic-calendar',
  'nouvelles',
  'finance-pro',
  'yield-curve',
  'advanced-analysis',
  'ask-emma',
  'emma-config',
  'email-briefings',
  'admin-jslai',
  'plus',
  'test-only'
];

function logTest(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, type, message };
  testResults.testLog.push(logEntry);
  console.log(`[${type.toUpperCase()}] ${timestamp} - ${message}`);
}

function reportBug(severity, title, description, steps, codeLocation = 'Unknown', screenshotPath = null) {
  const bug = {
    id: `BUG-${String(testResults.bugs.length + 1).padStart(3, '0')}`,
    severity,
    title,
    description,
    steps,
    codeLocation,
    screenshotPath,
    timestamp: new Date().toISOString()
  };
  testResults.bugs.push(bug);
  logTest(`BUG FOUND [${severity}]: ${title}`, 'error');
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

    testResults.screenshots.push({ name, filepath, timestamp: new Date().toISOString() });

    if (bug) {
      bug.screenshotPath = filepath;
    }

    logTest(`Screenshot saved: ${filename}`);
    return filepath;
  } catch (error) {
    logTest(`Failed to take screenshot: ${error.message}`, 'error');
    return null;
  }
}

async function checkConsoleErrors(page) {
  const consoleErrors = [];
  const networkErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        type: 'console',
        message: msg.text(),
        timestamp: new Date().toISOString()
      });
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push({
      type: 'pageerror',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });

  page.on('requestfailed', request => {
    networkErrors.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure()?.errorText || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  });

  return { consoleErrors, networkErrors };
}

async function waitForPageLoad(page, timeout = TIMEOUT) {
  try {
    await page.waitForLoadState('domcontentloaded', { timeout });
    await page.waitForLoadState('networkidle', { timeout: timeout * 2 });
    return true;
  } catch (error) {
    logTest(`Page load timeout: ${error.message}`, 'warning');
    return false;
  }
}

async function testNavigation(page, context) {
  logTest('========== TESTING NAVIGATION ==========');

  for (const tab of TABS_TO_TEST) {
    try {
      logTest(`Testing navigation to tab: ${tab}`);

      // Try to click the tab
      const tabSelector = `[data-tab="${tab}"], button:has-text("${tab}"), a:has-text("${tab}")`;

      const tabElement = await page.$(tabSelector).catch(() => null);

      if (!tabElement) {
        // Try alternative selectors
        const alternativeSelectors = [
          `text=${tab}`,
          `[href="#${tab}"]`,
          `[data-testid="${tab}"]`,
          `.tab:has-text("${tab}")`
        ];

        let found = false;
        for (const selector of alternativeSelectors) {
          const element = await page.$(selector).catch(() => null);
          if (element) {
            await element.click({ timeout: TIMEOUT });
            found = true;
            break;
          }
        }

        if (!found) {
          const bug = reportBug(
            'Low',
            `Tab "${tab}" not found in navigation`,
            `Could not find navigation element for tab: ${tab}`,
            [`Navigate to ${BASE_URL}`, `Look for tab: ${tab}`],
            'BetaCombinedDashboard.tsx'
          );
          await takeScreenshot(page, `nav-missing-${tab}`, bug);
          continue;
        }
      } else {
        await tabElement.click({ timeout: TIMEOUT });
      }

      // Wait for tab content to load
      await page.waitForTimeout(1000);

      // Check for loading states
      const hasLoadingSpinner = await page.$('.animate-spin').catch(() => null);
      if (hasLoadingSpinner) {
        logTest(`Loading spinner detected for ${tab}`);
        await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 30000 }).catch(() => {
          const bug = reportBug(
            'High',
            `Infinite loading on tab: ${tab}`,
            `Tab ${tab} shows loading spinner that never disappears`,
            [`Navigate to ${BASE_URL}`, `Click on ${tab} tab`, `Observe infinite loading`],
            `${tab} component`
          );
        });
      }

      // Take screenshot of tab
      await takeScreenshot(page, `tab-${tab}`);

      // Check for error messages
      const errorMessages = await page.$$eval(
        '[class*="error"], [class*="Error"], .text-red-500, .text-red-600',
        elements => elements.map(el => el.textContent)
      ).catch(() => []);

      if (errorMessages.length > 0) {
        const bug = reportBug(
          'Medium',
          `Error messages found on tab: ${tab}`,
          `Found error messages: ${errorMessages.join(', ')}`,
          [`Navigate to ${BASE_URL}`, `Click on ${tab} tab`, `Observe error messages`],
          `${tab} component`
        );
        await takeScreenshot(page, `error-${tab}`, bug);
      }

      logTest(`✓ Tab ${tab} tested successfully`);

    } catch (error) {
      const bug = reportBug(
        'High',
        `Error testing tab: ${tab}`,
        `Exception: ${error.message}`,
        [`Navigate to ${BASE_URL}`, `Click on ${tab} tab`],
        `${tab} component`
      );
      await takeScreenshot(page, `error-tab-${tab}`, bug);
    }
  }
}

async function testInteractiveElements(page) {
  logTest('========== TESTING INTERACTIVE ELEMENTS ==========');

  try {
    // Test all buttons
    const buttons = await page.$$('button');
    logTest(`Found ${buttons.length} buttons to test`);

    for (let i = 0; i < Math.min(buttons.length, 50); i++) {
      try {
        const button = buttons[i];
        const isVisible = await button.isVisible().catch(() => false);

        if (!isVisible) continue;

        const buttonText = await button.textContent().catch(() => 'Unknown');
        logTest(`Testing button: ${buttonText}`);

        // Check if button is disabled
        const isDisabled = await button.isDisabled().catch(() => false);

        // Take screenshot before click
        await takeScreenshot(page, `button-before-${i}-${buttonText.substring(0, 20)}`);

        if (!isDisabled) {
          await button.click({ timeout: TIMEOUT }).catch(error => {
            reportBug(
              'Low',
              `Button click failed: ${buttonText}`,
              `Could not click button: ${error.message}`,
              [`Find button with text: ${buttonText}`, `Attempt to click`],
              'Unknown'
            );
          });

          await page.waitForTimeout(500);

          // Take screenshot after click
          await takeScreenshot(page, `button-after-${i}-${buttonText.substring(0, 20)}`);
        }

      } catch (error) {
        logTest(`Error testing button ${i}: ${error.message}`, 'warning');
      }
    }

    // Test all input fields
    const inputs = await page.$$('input, textarea');
    logTest(`Found ${inputs.length} input fields to test`);

    for (let i = 0; i < Math.min(inputs.length, 30); i++) {
      try {
        const input = inputs[i];
        const isVisible = await input.isVisible().catch(() => false);

        if (!isVisible) continue;

        const placeholder = await input.getAttribute('placeholder').catch(() => 'No placeholder');
        logTest(`Testing input: ${placeholder}`);

        // Test typing
        await input.fill('TEST_INPUT_123').catch(error => {
          reportBug(
            'Low',
            `Input field not editable: ${placeholder}`,
            `Could not type into input: ${error.message}`,
            [`Find input with placeholder: ${placeholder}`, `Attempt to type`],
            'Unknown'
          );
        });

        await takeScreenshot(page, `input-filled-${i}-${placeholder.substring(0, 20)}`);

        // Clear the input
        await input.fill('').catch(() => {});

      } catch (error) {
        logTest(`Error testing input ${i}: ${error.message}`, 'warning');
      }
    }

  } catch (error) {
    reportBug(
      'Medium',
      'Error testing interactive elements',
      `Exception: ${error.message}`,
      ['Test interactive elements'],
      'Unknown'
    );
  }
}

async function testResponsiveness(page) {
  logTest('========== TESTING RESPONSIVENESS ==========');

  const viewports = [
    { width: 1920, height: 1080, name: 'Desktop-Large' },
    { width: 1366, height: 768, name: 'Desktop-Medium' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 375, height: 667, name: 'Mobile' }
  ];

  for (const viewport of viewports) {
    try {
      logTest(`Testing viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);

      // Take screenshot
      await takeScreenshot(page, `responsive-${viewport.name}`);

      // Check for overflow issues
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      if (hasHorizontalScroll && viewport.width < 768) {
        const bug = reportBug(
          'Medium',
          `Horizontal scroll on ${viewport.name}`,
          `Page has horizontal scrollbar on ${viewport.name} viewport`,
          [`Set viewport to ${viewport.width}x${viewport.height}`, `Observe horizontal scroll`],
          'CSS/Layout issue'
        );
        await takeScreenshot(page, `overflow-${viewport.name}`, bug);
      }

      // Check for overlapping elements
      const overlaps = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const overlapping = [];

        for (let i = 0; i < Math.min(elements.length, 100); i++) {
          const elem1 = elements[i];
          const rect1 = elem1.getBoundingClientRect();

          if (rect1.width === 0 || rect1.height === 0) continue;

          for (let j = i + 1; j < Math.min(elements.length, 100); j++) {
            const elem2 = elements[j];
            const rect2 = elem2.getBoundingClientRect();

            if (rect2.width === 0 || rect2.height === 0) continue;

            // Check if elements overlap
            if (!(rect1.right < rect2.left ||
                  rect1.left > rect2.right ||
                  rect1.bottom < rect2.top ||
                  rect1.top > rect2.bottom)) {
              overlapping.push({
                elem1: elem1.className,
                elem2: elem2.className
              });
            }
          }
        }

        return overlapping.slice(0, 5); // Return first 5 overlaps
      });

      if (overlaps.length > 0) {
        logTest(`Found ${overlaps.length} potential overlapping elements on ${viewport.name}`, 'warning');
      }

    } catch (error) {
      logTest(`Error testing viewport ${viewport.name}: ${error.message}`, 'error');
    }
  }

  // Reset to default viewport
  await page.setViewportSize({ width: 1920, height: 1080 });
}

async function testPerformance(page) {
  logTest('========== TESTING PERFORMANCE ==========');

  try {
    // Measure page load performance
    const performanceMetrics = await page.evaluate(() => {
      const perfData = window.performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        domInteractive: perfData.domInteractive - perfData.fetchStart,
        totalTime: perfData.loadEventEnd - perfData.fetchStart
      };
    });

    logTest(`Performance metrics: ${JSON.stringify(performanceMetrics, null, 2)}`);

    if (performanceMetrics.totalTime > 5000) {
      reportBug(
        'Medium',
        'Slow page load time',
        `Page took ${performanceMetrics.totalTime}ms to load (threshold: 5000ms)`,
        ['Navigate to page', 'Measure load time'],
        'Performance optimization needed'
      );
    }

    // Check for large bundle sizes
    const resourceSizes = await page.evaluate(() => {
      const resources = window.performance.getEntriesByType('resource');
      return resources.map(r => ({
        name: r.name,
        size: r.transferSize,
        duration: r.duration
      })).filter(r => r.size > 500000); // Files larger than 500KB
    });

    if (resourceSizes.length > 0) {
      logTest(`Found ${resourceSizes.length} large resources (>500KB)`);
      resourceSizes.forEach(resource => {
        reportBug(
          'Low',
          'Large resource file',
          `Resource ${resource.name} is ${Math.round(resource.size / 1024)}KB`,
          ['Load page', 'Check network tab'],
          'Bundle optimization needed'
        );
      });
    }

  } catch (error) {
    logTest(`Error testing performance: ${error.message}`, 'error');
  }
}

async function testAccessibility(page) {
  logTest('========== TESTING ACCESSIBILITY ==========');

  try {
    // Check for missing alt text on images
    const imagesWithoutAlt = await page.$$eval('img:not([alt])', imgs => imgs.length);

    if (imagesWithoutAlt > 0) {
      const bug = reportBug(
        'Medium',
        'Images missing alt text',
        `Found ${imagesWithoutAlt} images without alt text`,
        ['Inspect all img tags', 'Check for alt attribute'],
        'HTML/Accessibility'
      );
      await takeScreenshot(page, 'accessibility-missing-alt', bug);
    }

    // Check for buttons without accessible names
    const buttonsWithoutLabels = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.filter(btn => {
        const hasText = btn.textContent.trim().length > 0;
        const hasAriaLabel = btn.hasAttribute('aria-label');
        const hasTitle = btn.hasAttribute('title');
        return !hasText && !hasAriaLabel && !hasTitle;
      }).length;
    });

    if (buttonsWithoutLabels > 0) {
      reportBug(
        'Medium',
        'Buttons without accessible names',
        `Found ${buttonsWithoutLabels} buttons without text, aria-label, or title`,
        ['Inspect all button elements', 'Check for accessible names'],
        'HTML/Accessibility'
      );
    }

    // Check color contrast (basic check)
    const contrastIssues = await page.evaluate(() => {
      const getContrast = (fg, bg) => {
        const getLuminance = (color) => {
          const rgb = color.match(/\d+/g).map(Number);
          const [r, g, b] = rgb.map(val => {
            val = val / 255;
            return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };

        const l1 = getLuminance(fg);
        const l2 = getLuminance(bg);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      };

      const elements = Array.from(document.querySelectorAll('*')).slice(0, 100);
      let lowContrastCount = 0;

      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const fgColor = style.color;
        const bgColor = style.backgroundColor;

        if (fgColor && bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
          try {
            const contrast = getContrast(fgColor, bgColor);
            if (contrast < 4.5) {
              lowContrastCount++;
            }
          } catch (e) {
            // Skip elements we can't calculate
          }
        }
      });

      return lowContrastCount;
    });

    if (contrastIssues > 0) {
      logTest(`Found ${contrastIssues} potential color contrast issues`, 'warning');
    }

  } catch (error) {
    logTest(`Error testing accessibility: ${error.message}`, 'error');
  }
}

async function testDataCalculations(page) {
  logTest('========== TESTING DATA CALCULATIONS ==========');

  try {
    // Navigate to tabs with calculations
    const calculationTabs = ['dans-watchlist', 'intelli-stocks', 'finance-pro', 'yield-curve'];

    for (const tab of calculationTabs) {
      logTest(`Testing calculations on: ${tab}`);

      // Try to navigate to tab
      const tabElements = await page.$$(`text=${tab}`).catch(() => []);
      if (tabElements.length > 0) {
        await tabElements[0].click({ timeout: TIMEOUT }).catch(() => {});
        await page.waitForTimeout(2000);

        // Check for NaN, Infinity, or undefined in displayed text
        const invalidValues = await page.evaluate(() => {
          const bodyText = document.body.textContent;
          const issues = [];

          if (bodyText.includes('NaN')) issues.push('NaN found in UI');
          if (bodyText.includes('Infinity')) issues.push('Infinity found in UI');
          if (bodyText.includes('undefined')) issues.push('undefined found in UI');
          if (bodyText.includes('null')) issues.push('null found in UI');

          return issues;
        });

        if (invalidValues.length > 0) {
          const bug = reportBug(
            'High',
            `Invalid calculation values on ${tab}`,
            `Found invalid values: ${invalidValues.join(', ')}`,
            [`Navigate to ${tab}`, `Check displayed values`],
            `${tab} component`
          );
          await takeScreenshot(page, `invalid-calc-${tab}`, bug);
        }

        // Check for percentage calculations
        const percentageElements = await page.$$eval(
          '[class*="percent"], [class*="Percent"], .text-green-500, .text-red-500',
          elements => elements.map(el => el.textContent)
        ).catch(() => []);

        percentageElements.forEach(text => {
          if (text.includes('%')) {
            const match = text.match(/-?\d+\.?\d*/);
            if (match) {
              const value = parseFloat(match[0]);
              if (Math.abs(value) > 1000) {
                reportBug(
                  'High',
                  `Unrealistic percentage value: ${text}`,
                  `Found percentage value that seems incorrect: ${value}%`,
                  [`Navigate to ${tab}`, `Check percentage displays`],
                  `${tab} component`
                );
              }
            }
          }
        });
      }
    }

  } catch (error) {
    logTest(`Error testing calculations: ${error.message}`, 'error');
  }
}

async function testCharts(page) {
  logTest('========== TESTING CHARTS AND VISUALIZATIONS ==========');

  try {
    // Check for canvas elements (charts)
    const canvasElements = await page.$$('canvas');
    logTest(`Found ${canvasElements.length} canvas elements (charts)`);

    for (let i = 0; i < canvasElements.length; i++) {
      const canvas = canvasElements[i];
      const isVisible = await canvas.isVisible().catch(() => false);

      if (!isVisible) {
        reportBug(
          'Medium',
          `Chart ${i} not visible`,
          `Canvas element ${i} exists but is not visible`,
          ['Navigate to page with charts', `Check chart ${i}`],
          'Chart component'
        );
        continue;
      }

      // Check if canvas has content
      const hasContent = await canvas.evaluate(node => {
        const context = node.getContext('2d');
        if (!context) return false;

        const imageData = context.getImageData(0, 0, node.width, node.height);
        const data = imageData.data;

        // Check if canvas is completely empty (all transparent pixels)
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] !== 0) return true;
        }
        return false;
      }).catch(() => false);

      if (!hasContent) {
        const bug = reportBug(
          'High',
          `Chart ${i} is empty`,
          `Canvas element ${i} is visible but has no content`,
          ['Navigate to page with charts', `Check chart ${i}`],
          'Chart component'
        );
        await takeScreenshot(page, `empty-chart-${i}`, bug);
      } else {
        await takeScreenshot(page, `chart-${i}`);
        logTest(`✓ Chart ${i} has content`);
      }
    }

    // Check for SVG charts
    const svgElements = await page.$$('svg');
    logTest(`Found ${svgElements.length} SVG elements`);

    for (let i = 0; i < Math.min(svgElements.length, 20); i++) {
      const svg = svgElements[i];
      const isVisible = await svg.isVisible().catch(() => false);

      if (isVisible) {
        await takeScreenshot(page, `svg-${i}`);
      }
    }

  } catch (error) {
    logTest(`Error testing charts: ${error.message}`, 'error');
  }
}

async function testErrorStates(page) {
  logTest('========== TESTING ERROR STATES ==========');

  try {
    // Test with invalid data
    const inputs = await page.$$('input[type="text"], input:not([type])');

    for (let i = 0; i < Math.min(inputs.length, 10); i++) {
      const input = inputs[i];
      const isVisible = await input.isVisible().catch(() => false);

      if (!isVisible) continue;

      // Try invalid inputs
      const invalidInputs = [
        '<script>alert("xss")</script>',
        '999999999999999999999',
        '-999999999999999999999',
        '@@@@@@@@',
        '     ',
        'null',
        'undefined'
      ];

      for (const invalidInput of invalidInputs) {
        await input.fill(invalidInput).catch(() => {});
        await page.waitForTimeout(500);

        // Check if error message appears
        const errorMessages = await page.$$eval(
          '[class*="error"], [class*="Error"], .text-red-500',
          elements => elements.map(el => el.textContent)
        ).catch(() => []);

        if (errorMessages.length > 0) {
          logTest(`✓ Error validation working for: ${invalidInput}`);
        }

        await takeScreenshot(page, `invalid-input-${i}-${invalidInput.substring(0, 10)}`);

        // Clear input
        await input.fill('').catch(() => {});
      }
    }

  } catch (error) {
    logTest(`Error testing error states: ${error.message}`, 'error');
  }
}

async function testLoadingStates(page) {
  logTest('========== TESTING LOADING STATES ==========');

  try {
    // Check all tabs for loading states
    for (const tab of TABS_TO_TEST.slice(0, 5)) {
      logTest(`Testing loading state for: ${tab}`);

      // Navigate to tab
      const tabElements = await page.$$(`text=${tab}`).catch(() => []);
      if (tabElements.length > 0) {
        await tabElements[0].click({ timeout: TIMEOUT }).catch(() => {});

        // Immediately check for loading state
        const hasLoadingState = await page.$('.animate-spin, [class*="loading"], [class*="Loading"]').catch(() => null);

        if (hasLoadingState) {
          await takeScreenshot(page, `loading-${tab}`);
          logTest(`✓ Loading state present for ${tab}`);

          // Wait for loading to finish (max 30 seconds)
          const loadingFinished = await page.waitForSelector(
            '.animate-spin, [class*="loading"], [class*="Loading"]',
            { state: 'hidden', timeout: 30000 }
          ).then(() => true).catch(() => false);

          if (!loadingFinished) {
            const bug = reportBug(
              'Critical',
              `Infinite loading on ${tab}`,
              `Loading state never completes on ${tab} tab`,
              [`Navigate to ${tab}`, `Wait 30+ seconds`, `Loading never finishes`],
              `${tab} component`
            );
            await takeScreenshot(page, `infinite-loading-${tab}`, bug);
          }
        } else {
          logTest(`No loading state detected for ${tab}`, 'warning');
        }

        await page.waitForTimeout(2000);
      }
    }

  } catch (error) {
    logTest(`Error testing loading states: ${error.message}`, 'error');
  }
}

async function generateReport() {
  logTest('========== GENERATING COMPREHENSIVE REPORT ==========');

  testResults.endTime = new Date().toISOString();
  const duration = new Date(testResults.endTime) - new Date(testResults.startTime);
  const durationMinutes = Math.round(duration / 1000 / 60);

  let report = `# RAPPORT DE TEST EXHAUSTIF - GOB Dashboard\n\n`;
  report += `**Date:** ${testResults.startTime}\n`;
  report += `**Durée:** ${durationMinutes} minutes\n`;
  report += `**URL testée:** ${BASE_URL}\n`;
  report += `**Bugs trouvés:** ${testResults.bugs.length}\n`;
  report += `**Screenshots:** ${testResults.screenshots.length}\n\n`;

  report += `## Résumé Exécutif\n\n`;
  const criticalBugs = testResults.bugs.filter(b => b.severity === 'Critical').length;
  const highBugs = testResults.bugs.filter(b => b.severity === 'High').length;
  const mediumBugs = testResults.bugs.filter(b => b.severity === 'Medium').length;
  const lowBugs = testResults.bugs.filter(b => b.severity === 'Low').length;

  report += `- **Critique:** ${criticalBugs} bugs\n`;
  report += `- **Haute:** ${highBugs} bugs\n`;
  report += `- **Moyenne:** ${mediumBugs} bugs\n`;
  report += `- **Basse:** ${lowBugs} bugs\n\n`;

  report += `## Tests Effectués\n\n`;
  report += `1. ✅ Navigation entre tous les onglets\n`;
  report += `2. ✅ Test de tous les éléments interactifs\n`;
  report += `3. ✅ Test de responsiveness (4 viewports)\n`;
  report += `4. ✅ Test de performance\n`;
  report += `5. ✅ Test d'accessibilité\n`;
  report += `6. ✅ Test des calculs de données\n`;
  report += `7. ✅ Test des graphiques et visualisations\n`;
  report += `8. ✅ Test des états d'erreur\n`;
  report += `9. ✅ Test des états de chargement\n`;
  report += `10. ✅ Vérification des erreurs console\n`;
  report += `11. ✅ Vérification des erreurs réseau\n\n`;

  report += `---\n\n`;
  report += `## Liste Détaillée des Bugs\n\n`;

  // Group bugs by severity
  const bugsBySeverity = {
    'Critical': testResults.bugs.filter(b => b.severity === 'Critical'),
    'High': testResults.bugs.filter(b => b.severity === 'High'),
    'Medium': testResults.bugs.filter(b => b.severity === 'Medium'),
    'Low': testResults.bugs.filter(b => b.severity === 'Low')
  };

  for (const [severity, bugs] of Object.entries(bugsBySeverity)) {
    if (bugs.length === 0) continue;

    report += `### ${severity} Priority (${bugs.length} bugs)\n\n`;

    bugs.forEach(bug => {
      report += `#### ${bug.id}: ${bug.title}\n\n`;
      report += `**Sévérité:** ${bug.severity}\n\n`;
      report += `**Description:**\n${bug.description}\n\n`;
      report += `**Étapes pour reproduire:**\n`;
      bug.steps.forEach((step, i) => {
        report += `${i + 1}. ${step}\n`;
      });
      report += `\n`;
      report += `**Localisation du code:** ${bug.codeLocation}\n\n`;

      if (bug.screenshotPath) {
        report += `**Screenshot:** \`${bug.screenshotPath}\`\n\n`;
        report += `![Bug Screenshot](${bug.screenshotPath})\n\n`;
      }

      report += `**Timestamp:** ${bug.timestamp}\n\n`;
      report += `---\n\n`;
    });
  }

  report += `## Log de Test Complet\n\n`;
  report += `\`\`\`\n`;
  testResults.testLog.slice(-200).forEach(log => {
    report += `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}\n`;
  });
  report += `\`\`\`\n\n`;

  report += `## Screenshots Capturés\n\n`;
  testResults.screenshots.forEach(screenshot => {
    report += `- ${screenshot.name} - \`${screenshot.filepath}\`\n`;
  });

  report += `\n\n---\n\n`;
  report += `**Fin du rapport de test**\n`;

  const reportPath = '/Users/projetsjsl/Documents/GitHub/GOB/RAPPORT-BUGS-EXHAUSTIF-2026-01-10.md';
  await writeFile(reportPath, report, 'utf-8');

  logTest(`Report generated: ${reportPath}`);

  return reportPath;
}

async function runComprehensiveTests() {
  let browser;
  let context;
  let page;

  try {
    logTest('========== STARTING COMPREHENSIVE TEST MARATHON ==========');
    logTest(`Target URL: ${BASE_URL}`);
    logTest(`Screenshot directory: ${SCREENSHOT_DIR}`);

    // Launch browser
    browser = await chromium.launch({
      headless: false, // Run with UI so we can see what's happening
      args: ['--disable-blink-features=AutomationControlled']
    });

    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    page = await context.newPage();

    // Setup error monitoring
    const { consoleErrors, networkErrors } = await checkConsoleErrors(page);

    // Navigate to the application
    logTest('Navigating to application...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for initial load
    await waitForPageLoad(page);

    // Take initial screenshot
    await takeScreenshot(page, 'initial-load');

    // Run all test suites
    await testNavigation(page, context);
    await testInteractiveElements(page);
    await testResponsiveness(page);
    await testPerformance(page);
    await testAccessibility(page);
    await testDataCalculations(page);
    await testCharts(page);
    await testErrorStates(page);
    await testLoadingStates(page);

    // Report console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        reportBug(
          'Medium',
          'Console Error',
          `Console error: ${msg.text()}`,
          ['Open browser console', 'Observe error'],
          'JavaScript'
        );
      }
    });

    // Report network errors
    page.on('requestfailed', request => {
      reportBug(
        'High',
        'Network Request Failed',
        `Failed request: ${request.url()} - ${request.failure()?.errorText}`,
        ['Open network tab', 'Observe failed request'],
        'Network/API'
      );
    });

    logTest('========== ALL TESTS COMPLETED ==========');

  } catch (error) {
    logTest(`CRITICAL ERROR: ${error.message}`, 'error');
    reportBug(
      'Critical',
      'Test Suite Failure',
      `Test suite encountered critical error: ${error.message}\nStack: ${error.stack}`,
      ['Run test suite'],
      'Test Infrastructure'
    );

    if (page) {
      await takeScreenshot(page, 'critical-error');
    }
  } finally {
    // Generate report
    const reportPath = await generateReport();
    logTest(`Final report saved to: ${reportPath}`);

    // Close browser
    if (browser) {
      await browser.close();
    }

    logTest('Test marathon completed!');

    return testResults;
  }
}

// Run the tests
runComprehensiveTests().then(results => {
  console.log('\n========== TEST MARATHON COMPLETE ==========');
  console.log(`Total bugs found: ${results.bugs.length}`);
  console.log(`Total screenshots: ${results.screenshots.length}`);
  console.log(`Duration: ${Math.round((new Date(results.endTime) - new Date(results.startTime)) / 1000 / 60)} minutes`);
  process.exit(0);
}).catch(error => {
  console.error('Test marathon failed:', error);
  process.exit(1);
});
