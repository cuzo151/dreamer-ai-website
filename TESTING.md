# Dreamer AI Solutions - Testing Documentation

This document provides comprehensive information about the testing infrastructure for the Dreamer AI Solutions website, including unit tests, integration tests, and end-to-end tests.

## Table of Contents

1. [Overview](#overview)
2. [Backend Testing](#backend-testing)
3. [Frontend Testing](#frontend-testing)
4. [E2E Testing](#e2e-testing)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Running Tests](#running-tests)
7. [Writing Tests](#writing-tests)
8. [Test Coverage](#test-coverage)
9. [Troubleshooting](#troubleshooting)

## Overview

Our testing strategy follows the testing pyramid principle:

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test interactions between different parts of the system
- **E2E Tests**: Test complete user workflows through the entire application

### Technology Stack

- **Backend**: Jest, Supertest
- **Frontend**: Jest, React Testing Library
- **E2E**: Cypress
- **CI/CD**: GitHub Actions

## Backend Testing

### Setup

The backend uses Jest for both unit and integration testing with a PostgreSQL test database.

#### Configuration Files

- `jest.config.js`: Main Jest configuration
- `.env.test`: Test environment variables
- `tests/setup.js`: Global test setup

#### Test Structure

```
backend/
├── tests/
│   ├── unit/
│   │   └── authController.test.js
│   ├── integration/
│   │   └── auth.test.js
│   └── utils/
│       ├── factories.js
│       ├── testDatabase.js
│       ├── testHelpers.js
│       └── migrations.js
```

### Running Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Database

The test suite automatically:

1. Creates a separate test database
2. Runs migrations
3. Clears data between tests
4. Drops the database after all tests

### Writing Backend Tests

#### Unit Test Example

```javascript
describe('Auth Controller - Unit Tests', () => {
  it('should register a new user', async () => {
    const req = createMockRequest({
      body: {
        email: 'test@example.com',
        password: 'Test@1234'
      }
    });
    const res = createMockResponse();

    await authController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });
});
```

#### Integration Test Example

```javascript
describe('POST /api/auth/login', () => {
  it('should login successfully', async () => {
    const user = await insertUser(pool, { 
      email: 'test@example.com',
      password: 'Test@1234'
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test@1234'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
  });
});
```

## Frontend Testing

### Setup

The frontend uses Jest and React Testing Library for component testing.

#### Configuration Files

- `jest.config.js`: Jest configuration for React
- `src/setupTests.ts`: Test environment setup
- `src/test-utils/testUtils.tsx`: Custom render utilities

### Running Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in CI mode (no watch)
npm test -- --watchAll=false
```

### Writing Frontend Tests

#### Component Test Example

```javascript
import { render, screen } from '../../test-utils/testUtils';
import userEvent from '@testing-library/user-event';
import Contact from './Contact';

describe('Contact Component', () => {
  it('should submit form successfully', async () => {
    const user = userEvent.setup();
    render(<Contact />);

    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.click(screen.getByText('Send Message'));

    expect(screen.getByText(/thank you/i)).toBeInTheDocument();
  });
});
```

### Test Utilities

Custom utilities are provided in `src/test-utils/testUtils.tsx`:

- `render`: Custom render with providers
- `mockApiResponse`: Mock API responses
- `createMockUser`: Generate test user data
- `setupLocalStorageMock`: Mock localStorage

## E2E Testing

### Setup

Cypress is configured for end-to-end testing of complete user workflows.

#### Configuration Files

- `cypress.config.js`: Main Cypress configuration
- `cypress/support/commands.js`: Custom Cypress commands
- `cypress/support/e2e.js`: E2E test setup

### Running E2E Tests

```bash
# Run Cypress in interactive mode
npx cypress open

# Run Cypress in headless mode
npx cypress run

# Run specific test file
npx cypress run --spec "cypress/e2e/auth.cy.js"

# Run with specific browser
npx cypress run --browser chrome
```

### Writing E2E Tests

#### E2E Test Example

```javascript
describe('User Authentication', () => {
  it('should register and login', () => {
    cy.visit('/');
    cy.get('[data-testid="auth-button"]').click();
    
    cy.fillForm({
      email: 'newuser@example.com',
      password: 'Test@1234'
    });
    
    cy.submitForm();
    cy.shouldShowSuccessMessage('Registration successful');
  });
});
```

### Custom Commands

- `cy.login(email, password)`: Programmatic login
- `cy.fillForm(formData)`: Fill form fields
- `cy.mockApiResponse(method, url, response)`: Mock API calls
- `cy.checkA11y()`: Basic accessibility checks

## CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline runs automatically on:

- Push to `main` or `develop` branches
- Pull request creation/updates

### Pipeline Stages

1. **Backend Tests**
   - Linting
   - Unit tests
   - Integration tests
   - Coverage report

2. **Frontend Tests**
   - Linting
   - Component tests
   - Build verification
   - Coverage report

3. **E2E Tests**
   - Start backend and frontend
   - Run Cypress tests
   - Upload screenshots/videos

4. **Security Scan**
   - Trivy vulnerability scan
   - npm audit

5. **Code Quality**
   - SonarCloud analysis

### Running CI Locally

```bash
# Install act (GitHub Actions locally)
brew install act

# Run the workflow
act -j backend-tests
act -j frontend-tests
act -j e2e-tests
```

## Running Tests

### Quick Start

```bash
# Clone the repository
git clone https://github.com/dreamer-ai/website.git
cd dreamer-ai-website

# Install dependencies
npm install --prefix backend
npm install --prefix frontend

# Run all backend tests
cd backend
npm test

# Run all frontend tests
cd ../frontend
npm test

# Run E2E tests
cd ..
npm run cypress:open
```

### Test Scripts

Add these scripts to the root `package.json`:

```json
{
  "scripts": {
    "test:backend": "cd backend && npm test",
    "test:frontend": "cd frontend && npm test -- --watchAll=false",
    "test:e2e": "cypress run",
    "test:all": "npm run test:backend && npm run test:frontend && npm run test:e2e",
    "cypress:open": "cypress open",
    "cypress:run": "cypress run"
  }
}
```

## Writing Tests

### Best Practices

1. **Test Structure**
   - Use descriptive test names
   - Follow Arrange-Act-Assert pattern
   - Group related tests with `describe`
   - Use `beforeEach` for common setup

2. **Test Isolation**
   - Each test should be independent
   - Clean up after tests
   - Don't rely on test order
   - Mock external dependencies

3. **Assertions**
   - Test behavior, not implementation
   - Use meaningful assertion messages
   - Test both success and error cases
   - Verify side effects

4. **Performance**
   - Keep tests fast
   - Use `test.only` for debugging
   - Parallelize where possible
   - Mock slow operations

### Testing Patterns

#### Testing Async Code

```javascript
// Using async/await
it('should fetch data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});

// Using promises
it('should fetch data', () => {
  return fetchData().then(data => {
    expect(data).toBeDefined();
  });
});
```

#### Testing Errors

```javascript
it('should handle errors', async () => {
  await expect(failingFunction()).rejects.toThrow('Error message');
});
```

#### Testing API Calls

```javascript
it('should call API', async () => {
  mockAxios.get.mockResolvedValueOnce({ data: { id: 1 } });
  
  const result = await getUser(1);
  
  expect(mockAxios.get).toHaveBeenCalledWith('/api/users/1');
  expect(result).toEqual({ id: 1 });
});
```

## Test Coverage

### Coverage Goals

- **Overall**: 80% coverage
- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### Viewing Coverage Reports

```bash
# Backend coverage
cd backend
npm run test:coverage
open coverage/lcov-report/index.html

# Frontend coverage
cd frontend
npm test -- --coverage
open coverage/lcov-report/index.html
```

### Coverage in CI

Coverage reports are:
- Generated for each test run
- Uploaded as artifacts
- Posted as PR comments
- Sent to SonarCloud

## Troubleshooting

### Common Issues

#### Test Database Connection Failed

```bash
# Check PostgreSQL is running
pg_isready

# Check environment variables
cat .env.test

# Manually create test database
createdb dreamer_ai_test
```

#### Cypress Tests Failing

```bash
# Clear Cypress cache
npx cypress cache clear

# Verify Cypress
npx cypress verify

# Check if servers are running
curl http://localhost:3000
curl http://localhost:5000/api/health
```

#### Jest Memory Issues

```bash
# Increase Node memory
NODE_OPTIONS=--max_old_space_size=4096 npm test

# Run tests sequentially
npm test -- --runInBand
```

### Debug Mode

#### Backend Tests

```javascript
// Add debugger statement
debugger;

// Run with inspector
node --inspect-brk ./node_modules/.bin/jest
```

#### Frontend Tests

```javascript
// Use debug utility
import { screen, debug } from '@testing-library/react';

// Debug DOM
debug();
screen.debug();
```

#### Cypress Tests

```javascript
// Add debugger
cy.debug();
cy.pause();

// Take screenshot
cy.screenshot('debug-screenshot');
```

### Getting Help

- Check test output for detailed error messages
- Review test logs in CI artifacts
- Enable verbose logging: `npm test -- --verbose`
- Check GitHub Actions logs for CI failures

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all tests pass locally
3. Add appropriate test coverage
4. Update this documentation if needed
5. Verify CI pipeline passes

### Test Review Checklist

- [ ] Tests are readable and well-documented
- [ ] Tests cover happy path and edge cases
- [ ] Tests are isolated and independent
- [ ] Mock data is realistic
- [ ] No hardcoded values or passwords
- [ ] Tests run quickly (< 5 seconds per test)
- [ ] Coverage meets minimum requirements