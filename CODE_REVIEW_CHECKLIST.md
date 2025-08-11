# Code Review Checklist

Use this checklist during code reviews to ensure all important aspects are covered.

## General Code Quality ✓

### Functionality
- [ ] Code accomplishes the intended purpose
- [ ] Edge cases are handled appropriately
- [ ] No obvious bugs or logic errors
- [ ] Error scenarios are properly handled
- [ ] Code behavior matches the requirements

### Code Structure
- [ ] Code follows DRY principle
- [ ] Functions/methods are single-purpose
- [ ] Code is properly modularized
- [ ] No code duplication
- [ ] Appropriate abstraction levels

### Readability
- [ ] Code is self-documenting
- [ ] Variable/function names are descriptive
- [ ] Complex logic is well-commented
- [ ] No magic numbers (use constants)
- [ ] Consistent coding style

### Clean Code
- [ ] No commented-out code
- [ ] No debug statements (console.log)
- [ ] No TODO comments without ticket references
- [ ] Unused imports removed
- [ ] Dead code eliminated

## Frontend Specific (React/TypeScript) ✓

### TypeScript
- [ ] Proper types used (no `any` unless justified)
- [ ] Interfaces/types are well-defined
- [ ] Null/undefined properly handled
- [ ] Type assertions minimized
- [ ] Generic types used appropriately

### React Patterns
- [ ] Functional components used
- [ ] Hooks follow rules of hooks
- [ ] useEffect dependencies correct
- [ ] useMemo/useCallback used appropriately
- [ ] Component props properly typed
- [ ] PropTypes or TypeScript interfaces defined

### Performance
- [ ] No unnecessary re-renders
- [ ] Large lists virtualized
- [ ] Images lazy-loaded
- [ ] Code splitting implemented
- [ ] Bundle size impact considered

### Accessibility
- [ ] Semantic HTML used
- [ ] ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient

## Backend Specific (Node.js/Express) ✓

### API Design
- [ ] RESTful conventions followed
- [ ] Proper HTTP methods used
- [ ] Correct status codes returned
- [ ] Consistent error format
- [ ] API versioning considered

### Data Handling
- [ ] Input validation implemented
- [ ] Data sanitization applied
- [ ] Database queries optimized
- [ ] N+1 queries avoided
- [ ] Transactions used where needed

### Error Handling
- [ ] All errors caught and handled
- [ ] Async errors properly handled
- [ ] Graceful degradation
- [ ] Proper error logging
- [ ] User-friendly error messages

## Security ✓

### Authentication/Authorization
- [ ] Authentication required where needed
- [ ] Authorization checks in place
- [ ] Tokens expire appropriately
- [ ] Sensitive routes protected
- [ ] RBAC implemented correctly

### Data Security
- [ ] No hardcoded secrets
- [ ] Passwords properly hashed
- [ ] SQL injection prevented
- [ ] XSS prevention in place
- [ ] CSRF protection enabled

### API Security
- [ ] Rate limiting applied
- [ ] Input size limits set
- [ ] File upload restrictions
- [ ] CORS configured properly
- [ ] Security headers set

## Performance ✓

### Frontend Performance
- [ ] Bundle size reasonable
- [ ] Critical CSS inlined
- [ ] Assets optimized
- [ ] Caching strategy defined
- [ ] Service worker considered

### Backend Performance
- [ ] Database queries optimized
- [ ] Indexes used appropriately
- [ ] Caching implemented
- [ ] Connection pooling configured
- [ ] Memory leaks avoided

### General Performance
- [ ] Algorithm complexity acceptable
- [ ] Resource cleanup implemented
- [ ] Throttling/debouncing used
- [ ] Pagination implemented
- [ ] Lazy loading utilized

## Testing ✓

### Test Coverage
- [ ] Unit tests written
- [ ] Integration tests included
- [ ] Critical paths tested
- [ ] Edge cases covered
- [ ] Error scenarios tested

### Test Quality
- [ ] Tests are descriptive
- [ ] Tests are independent
- [ ] Mocks used appropriately
- [ ] Tests follow AAA pattern
- [ ] No flaky tests

## Documentation ✓

### Code Documentation
- [ ] Functions documented (JSDoc/TSDoc)
- [ ] Complex logic explained
- [ ] API endpoints documented
- [ ] README updated if needed
- [ ] CHANGELOG updated

### Inline Comments
- [ ] Comments explain "why" not "what"
- [ ] Comments are up-to-date
- [ ] No redundant comments
- [ ] TODO comments have tickets
- [ ] Workarounds explained

## Git & Process ✓

### Commits
- [ ] Commits are atomic
- [ ] Commit messages follow convention
- [ ] No merge commits (if squashing)
- [ ] Branch is up-to-date with main
- [ ] No sensitive data in history

### Pull Request
- [ ] PR description is complete
- [ ] Screenshots included (UI changes)
- [ ] Testing steps provided
- [ ] Related issues linked
- [ ] Breaking changes noted

## Final Checks ✓

### Dependencies
- [ ] New dependencies justified
- [ ] Dependencies up-to-date
- [ ] No security vulnerabilities
- [ ] License compatibility checked
- [ ] Bundle size impact assessed

### Deployment
- [ ] Migration scripts included
- [ ] Environment variables documented
- [ ] Feature flags configured
- [ ] Rollback plan exists
- [ ] Monitoring/alerts configured

---

## Review Priority Guide

### 🔴 Critical (Must Fix)
- Security vulnerabilities
- Data loss risks
- Breaking changes
- Performance regressions
- Accessibility violations

### 🟡 Major (Should Fix)
- Code maintainability issues
- Missing tests
- Poor error handling
- Suboptimal performance
- Documentation gaps

### 🟢 Minor (Consider Fixing)
- Code style inconsistencies
- Minor optimizations
- Additional test cases
- Comment improvements
- Refactoring opportunities

---

## Quick Reference

### Common Issues to Look For
1. **Memory Leaks**: Unsubscribed events, unclosed connections
2. **Race Conditions**: Async operations without proper handling
3. **SQL Injection**: Direct string concatenation in queries
4. **XSS Vulnerabilities**: Unescaped user input in HTML
5. **Performance Issues**: N+1 queries, unnecessary loops
6. **Type Safety**: Use of `any`, missing null checks
7. **Error Handling**: Unhandled promise rejections
8. **Code Smells**: Long functions, deep nesting, duplicate code

### Questions to Ask
- What problem does this code solve?
- Is this the simplest solution?
- Will other developers understand this?
- How will this perform at scale?
- What could go wrong?
- Is this testable?
- Is this secure?

---

Remember: The goal of code review is to improve code quality and share knowledge, not to criticize. Be constructive, specific, and kind in your feedback.