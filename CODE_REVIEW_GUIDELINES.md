# Code Review Guidelines for Dreamer AI Solutions

## Table of Contents
1. [Overview](#overview)
2. [Code Review Process](#code-review-process)
3. [Review Checklist](#review-checklist)
4. [Code Style Guides](#code-style-guides)
5. [Performance Criteria](#performance-criteria)
6. [Security Guidelines](#security-guidelines)
7. [Documentation Standards](#documentation-standards)
8. [Git Workflow](#git-workflow)
9. [Quality Metrics](#quality-metrics)
10. [Automated Tools](#automated-tools)

## Overview

This document outlines the code review standards and guidelines for the Dreamer AI Solutions website project. All code contributions must pass review before being merged into the main branch.

### Review Objectives
- Ensure code correctness and functionality
- Maintain consistent code style and patterns
- Identify security vulnerabilities and performance issues
- Improve code maintainability and readability
- Share knowledge and best practices across the team

## Code Review Process

### 1. Pre-Review (Author Responsibilities)
- [ ] Run all automated tests locally
- [ ] Run linters and fix all issues
- [ ] Self-review the code for obvious issues
- [ ] Write clear commit messages following conventions
- [ ] Update documentation if needed
- [ ] Add/update tests for new functionality

### 2. Submission Process
1. Create feature branch from `main`
2. Make changes following coding standards
3. Push branch and create Pull Request (PR)
4. Fill out PR template with:
   - Description of changes
   - Testing performed
   - Screenshots (for UI changes)
   - Related issue numbers

### 3. Review Process
1. **Automated Checks** (must pass before human review)
   - CI/CD pipeline tests
   - Linting and formatting
   - Security scanning
   - Code coverage requirements

2. **Human Review** (at least 1 approval required)
   - Code correctness review
   - Architecture and design review
   - Security and performance review
   - Documentation review

3. **Review Timeline**
   - Initial review within 24 hours
   - Critical fixes reviewed within 4 hours
   - Follow-up reviews within 12 hours

### 4. Post-Review
- Address all feedback comments
- Re-request review after changes
- Squash commits if needed
- Merge only after all checks pass

## Review Checklist

### General Code Quality
- [ ] Code accomplishes the intended purpose
- [ ] No obvious bugs or logic errors
- [ ] Proper error handling implemented
- [ ] Code is DRY (Don't Repeat Yourself)
- [ ] Functions are single-purpose and well-named
- [ ] No commented-out code
- [ ] No console.log or debug statements

### TypeScript/JavaScript Specific
- [ ] Proper TypeScript types (no `any` unless justified)
- [ ] Null/undefined checks where needed
- [ ] Promises handled correctly (async/await)
- [ ] No memory leaks (event listeners cleaned up)
- [ ] React hooks follow rules of hooks
- [ ] Component props are properly typed

### Backend Specific
- [ ] API endpoints follow REST conventions
- [ ] Input validation on all endpoints
- [ ] Proper HTTP status codes used
- [ ] Database queries are optimized
- [ ] No N+1 query problems
- [ ] Transactions used where needed
- [ ] Rate limiting applied appropriately

## Code Style Guides

### JavaScript/TypeScript Style Guide

#### Naming Conventions
```typescript
// Variables and functions: camelCase
const userProfile = {};
function calculateTotal() {}

// Classes and interfaces: PascalCase
class UserService {}
interface UserProfile {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// React components: PascalCase
const UserProfile: React.FC = () => {};

// Files: 
// - React components: PascalCase (UserProfile.tsx)
// - Other files: camelCase (userService.ts)
// - Test files: *.test.ts or *.spec.ts
```

#### Code Organization
```typescript
// Import order
import React from 'react'; // External libraries
import { Button } from '@mui/material'; // UI libraries

import { UserService } from '../services'; // Internal absolute imports
import { formatDate } from '../utils';

import './Component.css'; // Styles

// Component structure
interface ComponentProps {
  // Props interface
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Hooks first
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {}, []);
  
  // Handlers
  const handleClick = () => {};
  
  // Render helpers
  const renderContent = () => {};
  
  // Main render
  return <div>{renderContent()}</div>;
};

export default Component;
```

#### Best Practices
```typescript
// Use optional chaining
const name = user?.profile?.name ?? 'Default';

// Use destructuring
const { id, name, email } = user;

// Use template literals
const message = `Welcome ${name}!`;

// Prefer const over let
const items = [];
items.push(newItem); // Still works

// Use explicit returns for clarity
const doubleValue = (x: number): number => {
  return x * 2;
};
```

### React Best Practices

```typescript
// Use functional components with hooks
const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  
  // Memoize expensive computations
  const sortedUsers = useMemo(() => 
    users.sort((a, b) => a.name.localeCompare(b.name)),
    [users]
  );
  
  // Memoize callbacks
  const handleDelete = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);
  
  return <div>{/* render */}</div>;
};

// Proper prop types
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  onClick: () => void;
  children: React.ReactNode;
}

// Error boundaries for production
class ErrorBoundary extends React.Component {
  // Implementation
}
```

### Node.js/Express Best Practices

```javascript
// Async route handlers with error catching
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.findById(req.params.id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  res.json(user);
}));

// Middleware organization
app.use(helmet()); // Security first
app.use(cors(corsOptions));
app.use(express.json());
app.use(requestLogger);
app.use('/api', routes);
app.use(errorHandler); // Error handler last

// Service layer pattern
class UserService {
  async createUser(data) {
    // Validation
    const validatedData = await validateUserData(data);
    
    // Business logic
    const hashedPassword = await hashPassword(validatedData.password);
    
    // Database operation
    const user = await db.users.create({
      ...validatedData,
      password: hashedPassword
    });
    
    // Return DTO
    return UserDTO.fromEntity(user);
  }
}
```

## Performance Criteria

### Frontend Performance
- [ ] Lighthouse score > 90 for Performance
- [ ] First Contentful Paint < 1.8s
- [ ] Time to Interactive < 3.9s
- [ ] Bundle size < 200KB (gzipped)
- [ ] Images optimized and lazy-loaded
- [ ] Code splitting implemented
- [ ] React components memoized where appropriate

### Backend Performance
- [ ] API response time < 200ms (p95)
- [ ] Database queries < 50ms
- [ ] Proper indexing on database tables
- [ ] Caching implemented where appropriate
- [ ] Connection pooling configured
- [ ] Rate limiting prevents abuse
- [ ] Pagination on list endpoints

### Performance Review Checklist
- [ ] No synchronous I/O operations
- [ ] Efficient algorithms used (check Big O)
- [ ] Database queries optimized
- [ ] Caching strategy appropriate
- [ ] No memory leaks
- [ ] Resource cleanup implemented

## Security Guidelines

### Security Review Checklist

#### Authentication & Authorization
- [ ] Passwords hashed with bcrypt (min 10 rounds)
- [ ] JWT tokens expire appropriately
- [ ] Refresh tokens rotated on use
- [ ] RBAC implemented correctly
- [ ] Session management secure

#### Input Validation
- [ ] All user inputs validated
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding)
- [ ] File upload restrictions
- [ ] Request size limits

#### API Security
- [ ] HTTPS enforced
- [ ] CORS configured properly
- [ ] Rate limiting implemented
- [ ] API versioning in place
- [ ] Error messages don't leak info

#### Data Protection
- [ ] Sensitive data encrypted at rest
- [ ] PII handled according to policy
- [ ] Secure communication (TLS 1.2+)
- [ ] Secrets not in code
- [ ] Environment variables used

### Security Code Examples

```typescript
// Input validation
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Parameterized queries
const getUser = async (userId: string) => {
  const query = 'SELECT * FROM users WHERE id = $1';
  const result = await db.query(query, [userId]);
  return result.rows[0];
};

// Output encoding
const renderUserContent = (content: string) => {
  const encoded = he.encode(content);
  return <div dangerouslySetInnerHTML={{ __html: encoded }} />;
};

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts'
});
```

## Documentation Standards

### Code Documentation

#### TypeScript/JavaScript
```typescript
/**
 * Calculates the total price including tax and discounts
 * @param items - Array of cart items
 * @param taxRate - Tax rate as decimal (e.g., 0.08 for 8%)
 * @param discountCode - Optional discount code
 * @returns Total price rounded to 2 decimal places
 * @throws {InvalidDiscountError} If discount code is invalid
 * @example
 * const total = calculateTotal(items, 0.08, 'SAVE10');
 */
export function calculateTotal(
  items: CartItem[],
  taxRate: number,
  discountCode?: string
): number {
  // Implementation
}

/**
 * User profile component displaying user information
 * @component
 * @example
 * <UserProfile userId="123" showEmail={true} />
 */
export const UserProfile: React.FC<UserProfileProps> = ({ userId, showEmail }) => {
  // Implementation
};
```

#### API Documentation
```yaml
# OpenAPI 3.0 specification
paths:
  /api/users/{userId}:
    get:
      summary: Get user by ID
      description: Retrieves detailed user information
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        200:
          description: User found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        404:
          description: User not found
```

### README Requirements
- Project overview and purpose
- Installation instructions
- Configuration requirements
- Development setup
- Testing instructions
- Deployment guide
- API documentation link
- Contributing guidelines

## Git Workflow

### Branch Naming Convention
```
feature/JIRA-123-user-authentication
bugfix/JIRA-456-fix-login-error
hotfix/JIRA-789-security-patch
chore/update-dependencies
docs/api-documentation
```

### Commit Message Convention
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions or modifications
- `chore`: Build process or auxiliary tool changes

Example:
```
feat(auth): implement JWT refresh token rotation

- Add refresh token rotation on use
- Update token expiry to 7 days
- Add blacklist for revoked tokens

Closes #123
```

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing

## Screenshots (if applicable)

## Related Issues
Closes #(issue number)
```

## Quality Metrics

### Code Coverage Requirements
- Overall coverage: >= 80%
- New code coverage: >= 90%
- Critical paths: 100%

### Complexity Metrics
- Cyclomatic complexity: < 10 per function
- Cognitive complexity: < 15 per function
- File length: < 300 lines
- Function length: < 50 lines
- Class length: < 200 lines

### Quality Gates
1. All tests must pass
2. No critical security vulnerabilities
3. Code coverage meets requirements
4. No major code smells
5. Documentation complete
6. Performance benchmarks met

### Review Metrics to Track
- Review turnaround time
- Defect escape rate
- Code churn
- Review effectiveness
- Team participation

## Automated Tools

### Required Tools Setup

#### ESLint Configuration
See `.eslintrc.js` for full configuration

#### Prettier Configuration
See `.prettierrc` for full configuration

#### Pre-commit Hooks
See `.husky/pre-commit` for hook setup

#### CI/CD Checks
- Linting (ESLint, Prettier)
- Type checking (TypeScript)
- Unit tests (Jest)
- Integration tests
- Security scanning (npm audit, Snyk)
- Code coverage (Jest coverage)
- Bundle size analysis
- Performance testing

### Tool Commands
```bash
# Run all checks locally
npm run lint
npm run format:check
npm run test
npm run test:coverage
npm run security:check
npm run build
```

## Enforcement

### Merge Requirements
1. All CI checks must pass
2. At least 1 approved review
3. No unresolved comments
4. Up-to-date with main branch
5. Commit messages follow convention

### Exceptions
- Hotfixes may bypass some requirements with manager approval
- Documentation-only changes need only 1 review
- Dependency updates follow automated process

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Best Practices](https://react.dev/learn)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [OWASP Security Guidelines](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- [Web Performance Best Practices](https://web.dev/performance/)