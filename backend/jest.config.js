export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'src/modules/auth/service.js',
    'src/modules/members/member.service.js',
    'src/modules/finance/finance.service.js',
  ],
  setupFiles: ['./src/tests/env.setup.js'],
  setupFilesAfterEnv: ['./src/tests/setup.js'],
  testTimeout: 60000,
};
