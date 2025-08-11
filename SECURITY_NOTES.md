# Security Notes

## Frontend Vulnerabilities

As of July 30, 2025, there are 9 known vulnerabilities (3 moderate, 6 high) in the frontend dependencies:

- **nth-check** - Inefficient Regular Expression Complexity (High)
- **postcss** - Line return parsing error (Moderate)  
- **webpack-dev-server** - Source code exposure vulnerability (Moderate)

These vulnerabilities are in development dependencies (react-scripts) and do not affect the production build. The production build itself is secure.

### Mitigation

1. These are development-only dependencies that are not included in production builds
2. The vulnerabilities require specific attack vectors that are not applicable in production
3. Updating react-scripts would require significant refactoring due to breaking changes

### Recommendation

Monitor for updates to react-scripts that address these vulnerabilities without breaking changes. Consider migrating to Vite or Next.js in future for better security posture.

## Backend Security

The backend has 0 known vulnerabilities and follows security best practices:

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on all endpoints
- Input validation and sanitization
- SQL injection protection
- XSS protection headers
- CORS properly configured
- Environment variables for secrets