export default {
  testEnvironment: 'node',
  testTimeout: 30000,
  transform: {}, // native ESM, no Babel transform
  setupFiles: ['<rootDir>/tests/env.setup.js'],
};
