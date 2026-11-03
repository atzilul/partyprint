module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node scripts/serve-lighthouse-proxy.mjs',
      startServerReadyPattern: 'PARTYPRINT Lighthouse proxy ready',
      startServerReadyTimeout: 120000,
      url: ['http://127.0.0.1:3333/', 'http://127.0.0.1:3333/lp/bride'],
      numberOfRuns: 3,
      settings: {
        formFactor: 'mobile',
        throttlingMethod: 'devtools',
        throttling: {
          requestLatencyMs: 150,
          downloadThroughputKbps: 1600,
          uploadThroughputKbps: 750,
          cpuSlowdownMultiplier: 4,
        },
      },
    },
    assert: {
      assertions: {
        'largest-contentful-paint': ['error', {maxNumericValue: 2500, aggregationMethod: 'median'}],
        'total-byte-weight': ['error', {maxNumericValue: 819200, aggregationMethod: 'median'}],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './artifacts/lighthouse-ci',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%.%%EXTENSION%%',
    },
  },
};
