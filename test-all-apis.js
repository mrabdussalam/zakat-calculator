#!/usr/bin/env node

/**
 * Comprehensive API Test Script
 * Tests all currency conversion APIs and asset price APIs with all supported currencies
 */

const https = require('https');
const http = require('http');

// All 38 supported currencies
const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD',
  'AED', 'SAR', 'KWD', 'BHD', 'OMR', 'QAR', 'JOD', 'EGP', 'LBP', 'IQD', 'MAD',
  'INR', 'PKR', 'BDT', 'MYR', 'IDR', 'SGD', 'CNY', 'KRW', 'THB', 'PHP', 'VND',
  'NGN', 'ZAR', 'BRL', 'MXN', 'TRY', 'RUB', 'HKD', 'TWD'
];

// Test results storage
const results = {
  timestamp: new Date().toISOString(),
  summary: {
    total_tests: 0,
    passed: 0,
    failed: 0,
    errors: 0
  },
  apis: {},
  currencies: {}
};

// Utility function to make HTTPS requests
function makeRequest(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const req = protocol.get(url, { timeout }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: json });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Test Currency Exchange Rate APIs
async function testCurrencyAPI(apiName, url, validator) {
  console.log(`\n🧪 Testing ${apiName}...`);

  if (!results.apis[apiName]) {
    results.apis[apiName] = {
      tested: 0,
      passed: 0,
      failed: 0,
      errors: [],
      currencies_tested: []
    };
  }

  try {
    const startTime = Date.now();
    const response = await makeRequest(url);
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    results.summary.total_tests++;
    results.apis[apiName].tested++;

    const validation = validator(response);

    if (validation.success) {
      results.summary.passed++;
      results.apis[apiName].passed++;
      console.log(`  ✅ ${apiName}: OK (${responseTime}ms) - ${validation.message}`);

      // Track which currencies were found
      if (validation.currencies) {
        results.apis[apiName].currencies_tested = validation.currencies;
        validation.currencies.forEach(curr => {
          if (!results.currencies[curr]) {
            results.currencies[curr] = { available_in: [] };
          }
          results.currencies[curr].available_in.push(apiName);
        });
      }

      return { success: true, responseTime, ...validation };
    } else {
      results.summary.failed++;
      results.apis[apiName].failed++;
      results.apis[apiName].errors.push(validation.error);
      console.log(`  ❌ ${apiName}: FAILED - ${validation.error}`);
      return { success: false, error: validation.error };
    }
  } catch (error) {
    results.summary.total_tests++;
    results.summary.errors++;
    results.apis[apiName].tested++;
    results.apis[apiName].failed++;
    results.apis[apiName].errors.push(error.message);
    console.log(`  ⚠️  ${apiName}: ERROR - ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test Metal Prices APIs
async function testMetalPricesAPIs() {
  console.log('\n📊 Testing Metal Prices APIs');
  console.log('=' .repeat(60));

  // Test GoldPrice.org API
  await testCurrencyAPI(
    'GoldPrice.org (Metal Prices)',
    'https://data-asg.goldprice.org/dbXRates/USD',
    (response) => {
      if (response.statusCode !== 200) {
        return { success: false, error: `HTTP ${response.statusCode}` };
      }
      if (!response.data || !response.data.items) {
        return { success: false, error: 'Invalid response format' };
      }
      const gold = response.data.items.find(item => item.curr === 'XAU');
      const silver = response.data.items.find(item => item.curr === 'XAG');

      if (!gold || !silver) {
        return { success: false, error: 'Missing gold or silver prices' };
      }

      return {
        success: true,
        message: `Gold: $${gold.xauPrice}/oz, Silver: $${silver.xagPrice}/oz`,
        data: { gold: gold.xauPrice, silver: silver.xagPrice }
      };
    }
  );

  // Test Frankfurter API for metals
  await testCurrencyAPI(
    'Frankfurter (Metal Prices)',
    'https://api.frankfurter.app/latest?from=XAU&to=USD,XAG',
    (response) => {
      if (response.statusCode !== 200) {
        return { success: false, error: `HTTP ${response.statusCode}` };
      }
      if (!response.data || !response.data.rates) {
        return { success: false, error: 'Invalid response format' };
      }

      const hasGold = response.data.base === 'XAU';
      const hasSilver = response.data.rates && 'XAG' in response.data.rates;

      if (!hasGold) {
        return { success: false, error: 'Missing gold base rate' };
      }

      return {
        success: true,
        message: `Gold base found${hasSilver ? ', Silver rate available' : ''}`,
        data: response.data.rates
      };
    }
  );

  // Test Metals.live API
  await testCurrencyAPI(
    'Metals.live',
    'https://api.metals.live/v1/spot/gold,silver',
    (response) => {
      if (response.statusCode !== 200) {
        return { success: false, error: `HTTP ${response.statusCode}` };
      }
      if (!Array.isArray(response.data) || response.data.length < 2) {
        return { success: false, error: 'Invalid response format or missing metals' };
      }

      const gold = response.data.find(m => m.metal === 'gold');
      const silver = response.data.find(m => m.metal === 'silver');

      if (!gold || !silver) {
        return { success: false, error: 'Missing gold or silver in response' };
      }

      return {
        success: true,
        message: `Gold: $${gold.price}/oz, Silver: $${silver.price}/oz`,
        data: { gold: gold.price, silver: silver.price }
      };
    }
  );
}

// Test Currency Exchange Rate APIs
async function testCurrencyExchangeAPIs() {
  console.log('\n💱 Testing Currency Exchange Rate APIs');
  console.log('='.repeat(60));

  // Test Frankfurter API
  await testCurrencyAPI(
    'Frankfurter (Exchange Rates)',
    'https://api.frankfurter.dev/v1/latest?from=USD',
    (response) => {
      if (response.statusCode !== 200) {
        return { success: false, error: `HTTP ${response.statusCode}` };
      }
      if (!response.data || !response.data.rates) {
        return { success: false, error: 'Invalid response format' };
      }

      const rates = response.data.rates;
      const availableCurrencies = Object.keys(rates);
      const ourCurrencies = CURRENCIES.filter(c => availableCurrencies.includes(c));

      return {
        success: true,
        message: `${ourCurrencies.length}/${CURRENCIES.length} supported currencies available`,
        currencies: ourCurrencies,
        data: rates
      };
    }
  );

  // Test Open Exchange Rates (ER-API)
  await testCurrencyAPI(
    'Open Exchange Rates (ER-API)',
    'https://open.er-api.com/v6/latest/USD',
    (response) => {
      if (response.statusCode !== 200) {
        return { success: false, error: `HTTP ${response.statusCode}` };
      }
      if (!response.data || !response.data.rates) {
        return { success: false, error: 'Invalid response format' };
      }

      const rates = response.data.rates;
      const availableCurrencies = Object.keys(rates);
      const ourCurrencies = CURRENCIES.filter(c => availableCurrencies.includes(c));

      return {
        success: true,
        message: `${ourCurrencies.length}/${CURRENCIES.length} supported currencies available`,
        currencies: ourCurrencies,
        data: rates
      };
    }
  );

  // Test ExchangeRate.host API
  await testCurrencyAPI(
    'ExchangeRate.host',
    'https://api.exchangerate.host/latest?base=USD',
    (response) => {
      if (response.statusCode !== 200) {
        return { success: false, error: `HTTP ${response.statusCode}` };
      }
      if (!response.data || !response.data.rates) {
        return { success: false, error: 'Invalid response format' };
      }

      const rates = response.data.rates;
      const availableCurrencies = Object.keys(rates);
      const ourCurrencies = CURRENCIES.filter(c => availableCurrencies.includes(c));

      return {
        success: true,
        message: `${ourCurrencies.length}/${CURRENCIES.length} supported currencies available`,
        currencies: ourCurrencies,
        data: rates
      };
    }
  );
}

// Test Cryptocurrency API
async function testCryptoAPI() {
  console.log('\n₿  Testing Cryptocurrency API');
  console.log('='.repeat(60));

  const cryptos = ['bitcoin', 'ethereum', 'tether', 'binancecoin', 'cardano'];
  const cryptoIds = cryptos.join(',');

  await testCurrencyAPI(
    'CoinGecko',
    `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=usd`,
    (response) => {
      if (response.statusCode !== 200) {
        return { success: false, error: `HTTP ${response.statusCode}` };
      }
      if (!response.data || typeof response.data !== 'object') {
        return { success: false, error: 'Invalid response format' };
      }

      const foundCryptos = Object.keys(response.data);
      const allHavePrices = foundCryptos.every(crypto => response.data[crypto].usd);

      if (!allHavePrices) {
        return { success: false, error: 'Some cryptocurrencies missing USD prices' };
      }

      return {
        success: true,
        message: `${foundCryptos.length} cryptocurrencies with prices`,
        data: response.data
      };
    }
  );
}

// Test Stock Prices API
async function testStockAPI() {
  console.log('\n📈 Testing Stock Prices API');
  console.log('='.repeat(60));

  await testCurrencyAPI(
    'Yahoo Finance',
    'https://query2.finance.yahoo.com/v8/finance/chart/AAPL',
    (response) => {
      if (response.statusCode !== 200) {
        return { success: false, error: `HTTP ${response.statusCode}` };
      }
      if (!response.data || !response.data.chart || !response.data.chart.result) {
        return { success: false, error: 'Invalid response format' };
      }

      const result = response.data.chart.result[0];
      if (!result || !result.meta || !result.meta.regularMarketPrice) {
        return { success: false, error: 'Missing price data' };
      }

      return {
        success: true,
        message: `AAPL: $${result.meta.regularMarketPrice}`,
        data: result.meta
      };
    }
  );
}

// Generate summary report
function generateReport() {
  console.log('\n');
  console.log('='.repeat(60));
  console.log('📋 COMPREHENSIVE API TEST REPORT');
  console.log('='.repeat(60));
  console.log(`\nTest Date: ${results.timestamp}`);
  console.log(`\n📊 Overall Summary:`);
  console.log(`   Total Tests: ${results.summary.total_tests}`);
  console.log(`   ✅ Passed: ${results.summary.passed}`);
  console.log(`   ❌ Failed: ${results.summary.failed}`);
  console.log(`   ⚠️  Errors: ${results.summary.errors}`);
  console.log(`   Success Rate: ${((results.summary.passed / results.summary.total_tests) * 100).toFixed(2)}%`);

  console.log(`\n🔌 API Status:`);
  Object.entries(results.apis).forEach(([apiName, data]) => {
    const status = data.passed === data.tested ? '✅' : '❌';
    console.log(`   ${status} ${apiName}: ${data.passed}/${data.tested} passed`);
    if (data.errors.length > 0) {
      data.errors.forEach(err => console.log(`      ⚠️  ${err}`));
    }
  });

  console.log(`\n💱 Currency Coverage:`);
  const currenciesWithAPIs = Object.keys(results.currencies);
  console.log(`   ${currenciesWithAPIs.length}/${CURRENCIES.length} currencies available in at least one API`);

  // Find currencies not available in any API
  const missingCurrencies = CURRENCIES.filter(c => !currenciesWithAPIs.includes(c));
  if (missingCurrencies.length > 0) {
    console.log(`\n   ⚠️  Currencies not found in any API:`);
    missingCurrencies.forEach(curr => console.log(`      - ${curr}`));
  }

  // Show currency distribution across APIs
  console.log(`\n   Currency API Distribution:`);
  const apiCounts = {};
  Object.values(results.currencies).forEach(curr => {
    const count = curr.available_in.length;
    apiCounts[count] = (apiCounts[count] || 0) + 1;
  });
  Object.entries(apiCounts).sort((a, b) => b[0] - a[0]).forEach(([count, num]) => {
    console.log(`      ${num} currencies available in ${count} API(s)`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('✨ Test Complete!');
  console.log('='.repeat(60) + '\n');

  // Save detailed report to file
  const fs = require('fs');
  const reportPath = './api-test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 Detailed report saved to: ${reportPath}\n`);

  return results;
}

// Main test execution
async function runAllTests() {
  console.log('\n🚀 Starting Comprehensive API Testing...\n');

  try {
    await testMetalPricesAPIs();
    await testCurrencyExchangeAPIs();
    await testCryptoAPI();
    await testStockAPI();

    const report = generateReport();

    // Exit with appropriate code
    if (report.summary.failed > 0 || report.summary.errors > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('\n💥 Fatal error during testing:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
