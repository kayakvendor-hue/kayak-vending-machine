module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['js', 'ts', 'json', 'node'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
};