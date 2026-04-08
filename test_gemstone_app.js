/**
 * Test script for Gemstone Explorer app
 * Tests page loading, JavaScript errors, and Temperature controls
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const errors = [];
  const consoleMessages = [];
  
  // Capture console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text });
    console.log(`[CONSOLE ${type.toUpperCase()}] ${text}`);
  });
  
  // Capture JavaScript errors
  page.on('pageerror', error => {
    errors.push(error.message);
    console.error(`[PAGE ERROR] ${error.message}`);
  });
  
  try {
    console.log('1. Loading http://localhost:8765...');
    await page.goto('http://localhost:8765', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    console.log('2. Taking initial screenshot...');
    await page.screenshot({ path: '/Users/kylemathewson/gems/screenshot_1_initial.png', fullPage: false });
    
    // Wait for app to initialize
    await page.waitForTimeout(1000);
    
    console.log('3. Clicking on Photon Experiment tab...');
    await page.click('button[data-tab="experiment"]');
    await page.waitForTimeout(500);
    
    console.log('4. Taking experiment view screenshot...');
    await page.screenshot({ path: '/Users/kylemathewson/gems/screenshot_2_experiment.png', fullPage: false });
    
    // Check if Temperature control section is visible
    console.log('5. Checking Temperature control section...');
    const tempControlVisible = await page.evaluate(() => {
      const tempSection = document.querySelector('.control-group h4');
      if (!tempSection) return false;
      const headers = Array.from(document.querySelectorAll('.control-group h4'));
      const tempHeader = headers.find(h => h.textContent.trim() === 'Temperature');
      if (!tempHeader) return false;
      const rect = tempHeader.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    
    console.log(`   Temperature section visible: ${tempControlVisible}`);
    
    // Check thermal stats elements
    const thermalStatsExist = await page.evaluate(() => {
      return {
        peakTemp: !!document.getElementById('stat-peak-temp'),
        avgRI: !!document.getElementById('stat-avg-ri-shift'),
        bandGap: !!document.getElementById('stat-bandgap-shift')
      };
    });
    
    console.log('   Thermal stats elements:', thermalStatsExist);
    
    // Test Emit Burst button
    console.log('6. Clicking Emit Burst button...');
    await page.click('#btn-emit');
    await page.waitForTimeout(1000);
    
    // Check if stats updated
    const statsAfterBurst = await page.evaluate(() => {
      return {
        active: document.getElementById('stat-active')?.textContent,
        transmitted: document.getElementById('stat-transmitted')?.textContent,
        reflected: document.getElementById('stat-reflected')?.textContent,
        absorbed: document.getElementById('stat-absorbed')?.textContent,
        peakTemp: document.getElementById('stat-peak-temp')?.textContent
      };
    });
    
    console.log('   Stats after burst:', statsAfterBurst);
    
    // Test Continuous button
    console.log('7. Clicking Continuous button...');
    await page.click('#btn-continuous');
    await page.waitForTimeout(2000);
    
    // Check stats again
    const statsAfterContinuous = await page.evaluate(() => {
      return {
        active: document.getElementById('stat-active')?.textContent,
        transmitted: document.getElementById('stat-transmitted')?.textContent,
        reflected: document.getElementById('stat-reflected')?.textContent,
        absorbed: document.getElementById('stat-absorbed')?.textContent,
        peakTemp: document.getElementById('stat-peak-temp')?.textContent
      };
    });
    
    console.log('   Stats after continuous:', statsAfterContinuous);
    
    // Stop continuous
    await page.click('#btn-continuous');
    await page.waitForTimeout(500);
    
    console.log('8. Taking final screenshot...');
    await page.screenshot({ path: '/Users/kylemathewson/gems/screenshot_3_final.png', fullPage: false });
    
    // Summary
    console.log('\n=== TEST SUMMARY ===');
    console.log(`JavaScript Errors: ${errors.length}`);
    if (errors.length > 0) {
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }
    
    console.log(`\nConsole Messages: ${consoleMessages.length}`);
    const errorMessages = consoleMessages.filter(m => m.type === 'error');
    const warningMessages = consoleMessages.filter(m => m.type === 'warning');
    console.log(`  Errors: ${errorMessages.length}`);
    console.log(`  Warnings: ${warningMessages.length}`);
    
    if (errorMessages.length > 0) {
      console.log('\nConsole Errors:');
      errorMessages.forEach((msg, i) => console.log(`  ${i + 1}. ${msg.text}`));
    }
    
    console.log(`\nTemperature Control Visible: ${tempControlVisible}`);
    console.log(`Thermal Stats Elements Present: ${JSON.stringify(thermalStatsExist)}`);
    console.log(`\nPhoton Stats Updated: ${statsAfterBurst.active !== '0' || statsAfterContinuous.active !== '0'}`);
    console.log(`Temperature Stats Updated: ${statsAfterContinuous.peakTemp !== '20.0°C'}`);
    
  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    await browser.close();
  }
})();
