module.exports = require('@backstage/cli/config/eslint-factory')(__dirname, {
  // The repo intentionally has no Jest setup; pin the version so the
  // shared Backstage config's jest rules don't try to detect it.
  settings: { jest: { version: 29 } },
});
