module.exports = {
	testEnvironment: 'node',
	testPathIgnorePatterns: [
	],
	collectCoverage: true,
	coverageDirectory: '<rootDir>/coverage',
	coverageReporters: ['json', 'lcov', 'text-summary'],
	coveragePathIgnorePatterns: [
	]
};