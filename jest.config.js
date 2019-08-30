module.exports = {
  rootDir: 'src',
  verbose: true,
  testRegex: '.test.ts$',
  collectCoverage: true,
  coverageDirectory: '../coverage',
  coveragePathIgnorePatterns: ['/node_modules/'],
  transformIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: ['**/*.{ts}', '!**/*.test.{ts}']
}
