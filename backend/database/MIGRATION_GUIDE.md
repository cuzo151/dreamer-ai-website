# Database Migration Guide

## Prerequisites

1. **PostgreSQL 15+** installed on your system
2. **Node.js 18+** and npm installed
3. Basic knowledge of PostgreSQL and SQL

## Quick Setup

### Option 1: Automated Setup (Recommended)

```bash
cd backend/database
./setup.sh
```

This script will:
- Create the database and user
- Run schema migrations
- Optionally seed sample data
- Create .env file with connection details
- Install required npm packages

### Option 2: Manual Setup

1. **Create Database and User**

```sql
-- Connect to PostgreSQL as superuser
sudo -u postgres psql

-- Create user
CREATE USER dreamer_app WITH ENCRYPTED PASSWORD 'your-secure-password';

-- Create database
CREATE DATABASE dreamer_ai OWNER dreamer_app;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE dreamer_ai TO dreamer_app;

-- Exit
\q
```

2. **Run Schema Migration**

```bash
psql -U dreamer_app -d dreamer_ai -f schema.sql
```

3. **Seed Sample Data (Optional)**

```bash
psql -U dreamer_app -d dreamer_ai -f seed.sql
```

4. **Install Dependencies**

```bash
cd ../..
npm install pg bcryptjs jsonwebtoken dotenv
```

5. **Configure Environment**

Create `.env` file in backend directory:

```env
# Database
DATABASE_URL=postgresql://dreamer_app:your-password@localhost:5432/dreamer_ai

# Security
JWT_SECRET=your-random-secret-key
BCRYPT_ROUNDS=10

# API Keys
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

## Integration with Existing Code

### 1. Update Contact Route

```javascript
// backend/routes/contact.js
const Database = require('../database');

router.post('/submit', async (req, res) => {
  try {
    const { name, email, company, message, type } = req.body;
    
    // Create lead in database
    const lead = await Database.createLead({
      email,
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' '),
      company,
      message,
      inquiryType: type
    });
    
    res.json({
      success: true,
      message: 'Thank you for contacting us!',
      leadId: lead.id
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});
```

### 2. Add Authentication Middleware

```javascript
// backend/middleware/auth.js
const Database = require('../database');

async function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const session = await Database.validateSession(token);
    if (!session) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = session;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
}

module.exports = { authenticateToken };
```

### 3. Add New Routes

```javascript
// backend/routes/auth.js
const express = require('express');
const Database = require('../database');
const router = express.Router();

// User registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, company } = req.body;
    
    const { user, verificationToken } = await Database.createUser({
      email, password, firstName, lastName, company
    });
    
    // Send verification email (implement email service)
    
    res.json({ success: true, userId: user.id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await Database.findUserByEmail(email);
    if (!user || !await Database.verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const session = await Database.createSession(
      user.id,
      req.ip,
      req.headers['user-agent']
    );
    
    res.json({
      success: true,
      token: session.session_token,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
```

## Database Maintenance

### Daily Tasks

1. **Automated Backups**

```bash
# Add to crontab
0 2 * * * pg_dump -U dreamer_app dreamer_ai | gzip > /backups/dreamer_ai_$(date +\%Y\%m\%d).sql.gz
```

2. **Monitor Performance**

```sql
-- Check slow queries
SELECT 
  query,
  calls,
  mean_exec_time,
  total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Weekly Tasks

1. **Vacuum and Analyze**

```sql
VACUUM ANALYZE;
```

2. **Check Index Usage**

```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

### Security Best Practices

1. **Enable Row Level Security**

```sql
-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
```

2. **Regular Security Audits**

```sql
-- Check for unusual access patterns
SELECT 
  user_id,
  action,
  COUNT(*) as action_count,
  COUNT(DISTINCT ip_address) as unique_ips
FROM audit_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY user_id, action
HAVING COUNT(*) > 100
ORDER BY action_count DESC;
```

3. **Password Policy Enforcement**

```javascript
// Add to user registration
function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);
  
  return password.length >= minLength && 
         hasUpperCase && hasLowerCase && 
         hasNumbers && hasSpecialChar;
}
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check PostgreSQL is running: `sudo systemctl status postgresql`
   - Verify connection details in .env file
   - Check pg_hba.conf allows connections

2. **Permission Denied**
   - Ensure user has proper privileges: `GRANT ALL ON ALL TABLES IN SCHEMA public TO dreamer_app;`
   - Check table ownership

3. **Slow Queries**
   - Run EXPLAIN ANALYZE on slow queries
   - Add missing indexes
   - Consider query optimization

### Performance Optimization

1. **Connection Pooling**
   - Already configured in database/index.js
   - Adjust pool size based on load

2. **Query Optimization**
   - Use prepared statements (already implemented)
   - Batch operations when possible
   - Use appropriate indexes

3. **Caching Strategy**
   - Implement Redis for session storage
   - Cache frequently accessed data
   - Use materialized views for complex reports

## Next Steps

1. Set up monitoring with tools like pgAdmin or Grafana
2. Implement automated backup testing
3. Configure replication for high availability
4. Set up database migration versioning (consider Flyway or Liquibase)
5. Implement data archival strategy for old records