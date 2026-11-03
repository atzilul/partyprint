module.exports = {
  ci: {
    collect: {
      startServerCommand: 'PORT=3000 npm start',
      startServerReadyPattern: 'Production server running at',
      startServerReadyTimeout: 120000,
      url: ['http://localhost:3000/', 'http://localhost:3000/lp/bride'],
      numberOfRuns: 3,
      settings: {formFactor: 'mobile'},
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
