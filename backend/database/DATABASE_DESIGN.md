# Dreamer AI Solutions Database Design Documentation

## Entity Relationship Diagram Description

### Core Entities and Relationships

```
┌─────────────────┐
│     USERS       │
│─────────────────│
│ PK: id (UUID)   │
│ email           │
│ password_hash   │
│ first_name      │
│ last_name       │
│ role            │
│ status          │
└─────────────────┘
        │
        │ 1:N
        ├──────────────────────────────────────┐
        │                                      │
        ▼                                      ▼
┌─────────────────────┐             ┌──────────────────────┐
│  USER_SESSIONS      │             │  SERVICE_BOOKINGS    │
│─────────────────────│             │──────────────────────│
│ PK: id              │             │ PK: id               │
│ FK: user_id         │             │ FK: user_id          │
│ session_token       │             │ FK: service_id       │
│ expires_at          │             │ scheduled_at         │
└─────────────────────┘             │ status               │
                                    └──────────────────────┘
                                              │
                                              │ N:1
                                              ▼
                                    ┌──────────────────────┐
                                    │     SERVICES         │
                                    │──────────────────────│
                                    │ PK: id               │
                                    │ name                 │
                                    │ slug                 │
                                    │ pricing              │
                                    └──────────────────────┘

┌─────────────────────┐
│      LEADS          │
│─────────────────────│
│ PK: id              │
│ FK: user_id (opt)   │
│ FK: assigned_to     │
│ email               │
│ status              │
│ source              │
└─────────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────────┐
│  LEAD_ACTIVITIES    │
│─────────────────────│
│ PK: id              │
│ FK: lead_id         │
│ FK: user_id         │
│ activity_type       │
└─────────────────────┘

┌─────────────────────┐             ┌──────────────────────┐
│  CASE_STUDIES       │             │   TESTIMONIALS       │
│─────────────────────│             │──────────────────────│
│ PK: id              │ 1:N         │ PK: id               │
│ title               │◄────────────│ FK: case_study_id    │
│ slug                │             │ client_name          │
│ FK: author_id       │             │ content              │
│ status              │             │ rating               │
└─────────────────────┘             └──────────────────────┘

┌─────────────────────┐
│ CHAT_CONVERSATIONS  │
│─────────────────────│
│ PK: id              │
│ FK: user_id (opt)   │
│ session_id          │
│ title               │
└─────────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────────┐
│   CHAT_MESSAGES     │
│─────────────────────│
│ PK: id              │
│ FK: conversation_id │
│ role                │
│ content             │
└─────────────────────┘

┌─────────────────────┐             ┌──────────────────────┐
│  CONTENT_PAGES      │             │ NEWSLETTER_SUBS      │
│─────────────────────│             │──────────────────────│
│ PK: id              │             │ PK: id               │
│ FK: author_id       │             │ FK: user_id (opt)    │
│ slug                │             │ email                │
│ page_type           │             │ is_active            │
│ content (JSONB)     │             │ unsubscribe_token    │
└─────────────────────┘             └──────────────────────┘

┌─────────────────────┐             ┌──────────────────────┐
│   AUDIT_LOGS        │             │  ANALYTICS_EVENTS    │
│─────────────────────│             │──────────────────────│
│ PK: id              │             │ PK: id               │
│ FK: user_id         │             │ FK: user_id (opt)    │
│ action              │             │ event_type           │
│ entity_type/id      │             │ properties (JSONB)   │
└─────────────────────┘             └──────────────────────┘
```

## Table Structure Details

### 1. User Management Tables

#### users
- **Purpose**: Central user authentication and profile management
- **Key Features**:
  - UUID primary keys for security
  - Role-based access control (visitor, client, admin, super_admin)
  - Status tracking for account lifecycle
  - JSONB fields for flexible preferences and metadata
  - Password reset and email verification tokens

#### user_sessions
- **Purpose**: Secure session management
- **Key Features**:
  - Token-based authentication
  - IP and user agent tracking
  - Automatic expiration

### 2. Service and Booking Tables

#### services
- **Purpose**: Define AI services offered
- **Key Features**:
  - Flexible pricing structure (JSONB)
  - Feature lists
  - Active/inactive status
  - Custom sorting

#### service_bookings
- **Purpose**: Manage consultation bookings
- **Key Features**:
  - Multiple consultation types
  - Status workflow (pending → confirmed → completed)
  - Meeting link storage
  - Reminder tracking

### 3. Lead Management Tables

#### leads
- **Purpose**: Track potential clients and inquiries
- **Key Features**:
  - Lead scoring
  - Source tracking
  - Assignment to team members
  - Conversion tracking
  - Tag system for categorization

#### lead_activities
- **Purpose**: Activity history for each lead
- **Key Features**:
  - Complete audit trail
  - User attribution
  - Flexible activity types

### 4. Content Management Tables

#### case_studies
- **Purpose**: Showcase successful implementations
- **Key Features**:
  - SEO-friendly slugs
  - Rich content structure
  - Technology and metrics tracking
  - Multi-image support
  - View counting

#### testimonials
- **Purpose**: Client feedback and social proof
- **Key Features**:
  - Rating system
  - Link to case studies
  - Featured flag
  - Client details

#### content_pages
- **Purpose**: Dynamic page content management
- **Key Features**:
  - JSONB content for flexibility
  - SEO metadata
  - Page type categorization
  - Publishing workflow

### 5. AI Chat Tables

#### chat_conversations
- **Purpose**: Group chat messages into conversations
- **Key Features**:
  - Session tracking for anonymous users
  - User association for logged-in users
  - Conversation titles

#### chat_messages
- **Purpose**: Store individual chat messages
- **Key Features**:
  - Role-based messages (user/assistant/system)
  - Token usage tracking
  - Model versioning

### 6. Supporting Tables

#### newsletter_subscriptions
- **Purpose**: Email marketing list management
- **Key Features**:
  - Unsubscribe tokens
  - Tag system
  - User association

#### audit_logs
- **Purpose**: Compliance and security auditing
- **Key Features**:
  - Complete change tracking
  - Old/new value comparison
  - IP tracking

#### analytics_events
- **Purpose**: Custom analytics tracking
- **Key Features**:
  - Flexible event properties
  - Session tracking
  - Page URL tracking

## Indexing Strategy

### Primary Indexes
1. **UUID Primary Keys**: All tables use UUID primary keys with default B-tree indexes
2. **Foreign Key Indexes**: All foreign key columns have indexes for join performance

### Performance Indexes
1. **Email Lookups**: 
   - `idx_users_email` - Fast user authentication
   - `idx_leads_email` - Quick lead lookup
   - `idx_newsletter_subscriptions_email` - Subscription management

2. **Time-based Queries**:
   - `idx_*_created_at DESC` - Recent records first
   - `idx_service_bookings_scheduled_at` - Upcoming appointments
   - `idx_chat_conversations_created_at DESC` - Recent conversations

3. **Status Filtering**:
   - `idx_users_status`, `idx_leads_status`, `idx_service_bookings_status`
   - `idx_case_studies_status`, `idx_content_pages_status`

4. **Slug Lookups**:
   - `idx_services_slug`, `idx_case_studies_slug`, `idx_content_pages_slug`
   - Unique indexes for fast content retrieval

5. **Session Management**:
   - `idx_user_sessions_token` - Fast token validation
   - `idx_user_sessions_expires_at` - Cleanup queries

## Data Security Considerations

### 1. Authentication & Authorization
- **Password Security**: bcrypt hashing with salt (via pgcrypto)
- **Session Tokens**: Cryptographically secure random tokens
- **Role-Based Access**: Enum-based roles with Row Level Security
- **API Rate Limiting**: Tracked at application level

### 2. Data Protection
- **Encryption**:
  - Passwords: One-way bcrypt hashing
  - Sensitive tokens: Stored with expiration
  - PII: Can be encrypted at column level using pgcrypto

- **Row Level Security (RLS)**:
  - Users can only view/edit their own data
  - Admins have elevated privileges
  - Anonymous users have read-only access to public content

### 3. Audit Trail
- **Comprehensive Logging**:
  - All data modifications logged
  - IP address tracking
  - Old/new value comparison
  - User attribution

### 4. Data Integrity
- **Foreign Key Constraints**: Maintain referential integrity
- **Check Constraints**: Validate data (e.g., ratings 1-5)
- **NOT NULL Constraints**: Required fields enforced
- **Unique Constraints**: Prevent duplicates (emails, slugs)

### 5. GDPR Compliance
- **Data Portability**: JSONB fields allow easy export
- **Right to Erasure**: Cascade deletes configured
- **Consent Tracking**: Stored in user preferences
- **Data Minimization**: Only essential data collected

## Migration Plan

### Phase 1: Database Setup
1. **Install PostgreSQL 15+**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql-15 postgresql-contrib-15
   
   # macOS
   brew install postgresql@15
   ```

2. **Create Database**
   ```sql
   CREATE DATABASE dreamer_ai;
   CREATE USER dreamer_app WITH ENCRYPTED PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE dreamer_ai TO dreamer_app;
   ```

3. **Run Schema Migration**
   ```bash
   psql -U dreamer_app -d dreamer_ai -f schema.sql
   ```

### Phase 2: Application Integration
1. **Install Dependencies**
   ```bash
   npm install pg @prisma/client prisma bcryptjs jsonwebtoken
   npm install --save-dev @types/pg @types/bcryptjs @types/jsonwebtoken
   ```

2. **Environment Configuration**
   ```env
   DATABASE_URL="postgresql://dreamer_app:password@localhost:5432/dreamer_ai"
   JWT_SECRET="your-secret-key"
   BCRYPT_ROUNDS=10
   ```

3. **Create Database Connection Module**
   ```javascript
   // backend/database/connection.js
   const { Pool } = require('pg');
   
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
   });
   
   module.exports = pool;
   ```

### Phase 3: Data Migration
1. **Initial Data Seeding**
   - Create admin user
   - Add default services
   - Import existing testimonials

2. **Migrate Existing Data**
   - Contact form submissions → leads table
   - Newsletter subscriptions → newsletter_subscriptions table
   - Chat history → chat_conversations/messages tables

### Phase 4: API Updates
1. **Update Routes**:
   - Implement database queries
   - Add authentication middleware
   - Enable transaction support

2. **Add New Endpoints**:
   - User authentication (/api/auth/*)
   - Booking management (/api/bookings/*)
   - Lead tracking (/api/leads/*)
   - Content management (/api/content/*)

### Phase 5: Testing & Optimization
1. **Performance Testing**
   - Load test with realistic data volumes
   - Optimize slow queries
   - Add missing indexes

2. **Security Audit**
   - Penetration testing
   - SQL injection prevention
   - Access control verification

3. **Backup Strategy**
   - Daily automated backups
   - Point-in-time recovery setup
   - Disaster recovery plan

## Monitoring & Maintenance

### Performance Monitoring
- Query performance tracking with pg_stat_statements
- Slow query logging
- Index usage statistics
- Connection pool monitoring

### Regular Maintenance
- Weekly VACUUM ANALYZE
- Monthly index rebuilding
- Quarterly performance review
- Annual schema optimization

### Backup Schedule
- Hourly transaction log backups
- Daily full backups
- Weekly offsite backup transfer
- Monthly backup restoration test