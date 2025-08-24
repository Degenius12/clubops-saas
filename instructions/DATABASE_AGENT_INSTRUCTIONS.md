# DATABASE AGENT - ClubOps SaaS Schema & Multi-Tenant Architecture

## CONTEXT & REQUIREMENTS
You are implementing the database layer for ClubOps, a premium gentlemen's club management SaaS. Based on the PRD requirements, create a multi-tenant PostgreSQL schema that supports:

### Core App Features (from main prompt):
- Dancer management with license compliance tracking
- DJ queue management with music metadata
- VIP room status and timing
- Financial tracking (bar fees, revenue)
- User authentication and club management
- Offline-capable data structure

### SaaS Features Required:
- Multi-tenant architecture (club isolation)
- Subscription management (Free/Basic/Pro/Enterprise)
- Usage analytics and reporting
- Payment processing integration
- Feature flags for tier-based access

## TOOL: Claude Code (VS Code Extension)

## TASK: Create complete database implementation

### Step 1: Database Schema Design
Create `C:\Users\tonyt\ClubOps-SaaS\database\schema.sql` with:

1. **Multi-tenant Foundation**:
   ```sql
   -- Clubs (tenant isolation)
   CREATE TABLE clubs (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name VARCHAR(255) NOT NULL,
     subdomain VARCHAR(50) UNIQUE NOT NULL,
     subscription_tier VARCHAR(20) DEFAULT 'free',
     subscription_status VARCHAR(20) DEFAULT 'active',
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

2. **Core Business Tables**:
   - `dancers` (license tracking, compliance alerts)
   - `dj_queue` (drag-and-drop order, stage assignments)  
   - `music_library` (MP3/AAC/FLAC/WAV metadata)
   - `vip_rooms` (status, timing, assignments)
   - `financial_transactions` (bar fees, revenue tracking)
   - `compliance_alerts` (license expiration warnings)

3. **SaaS Infrastructure Tables**:
   - `subscriptions` (billing, feature access)
   - `usage_analytics` (feature usage tracking)
   - `feature_flags` (tier-based access control)
   - `payment_methods` (Stripe integration)

## SUCCESS CRITERIA:
- [ ] Multi-tenant PostgreSQL schema created
- [ ] All core app features supported
- [ ] SaaS features implemented
- [ ] Prisma ORM configured and working
- [ ] Sample data loaded for testing

Save to: `C:\Users\tonyt\ClubOps-SaaS\database\`