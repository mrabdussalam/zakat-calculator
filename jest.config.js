module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  testPathIgnorePatterns: ['/node_modules/', '/tmp/', '/__tests__/utils\\.ts$'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
} 