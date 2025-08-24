-- ClubOps SaaS Database Schema
-- Multi-tenant PostgreSQL schema for premium club management

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- MULTI-TENANT FOUNDATION
-- ==============================================

-- Clubs (tenant isolation)
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(50) UNIQUE NOT NULL,
    subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
    subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trialing')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Club users (managers, DJs, security)
CREATE TABLE club_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'manager', 'dj', 'security')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(club_id, email)
);

-- ==============================================
-- CORE BUSINESS TABLES (Main App Features)
-- ==============================================

-- Dancers with license compliance tracking
CREATE TABLE dancers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    stage_name VARCHAR(100) NOT NULL,
    legal_name VARCHAR(200),
    phone VARCHAR(20),
    email VARCHAR(255),
    license_number VARCHAR(100),
    license_expiry_date DATE,
    license_status VARCHAR(20) DEFAULT 'valid' CHECK (license_status IN ('valid', 'expired', 'pending', 'suspended')),
    emergency_contact JSONB DEFAULT '{}',
    preferred_music JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DJ Queue Management (drag-and-drop order)
CREATE TABLE dj_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    dancer_id UUID NOT NULL REFERENCES dancers(id) ON DELETE CASCADE,
    stage_name VARCHAR(50) NOT NULL,
    position INTEGER NOT NULL,
    song_request VARCHAR(255),
    duration_minutes INTEGER DEFAULT 3,
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'on_stage', 'completed', 'skipped')),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Music Library (MP3/AAC/FLAC/WAV metadata)
CREATE TABLE music_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255),
    album VARCHAR(255),
    duration_seconds INTEGER,
    file_path VARCHAR(500),
    file_size BIGINT,
    file_format VARCHAR(10) CHECK (file_format IN ('mp3', 'aac', 'flac', 'wav')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- VIP Room Management
CREATE TABLE vip_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    room_name VARCHAR(50) NOT NULL,
    capacity INTEGER DEFAULT 4,
    hourly_rate DECIMAL(10,2),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- VIP Room Sessions
CREATE TABLE vip_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES vip_rooms(id),
    dancer_id UUID NOT NULL REFERENCES dancers(id),
    customer_name VARCHAR(100),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration_minutes INTEGER,
    amount_charged DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled'))
);

-- Financial Transactions (bar fees, revenue)
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    dancer_id UUID REFERENCES dancers(id),
    transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('bar_fee', 'vip_room', 'tip_out', 'penalty', 'bonus')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'deferred')),
    is_paid BOOLEAN DEFAULT false,
    due_date DATE,
    recorded_by UUID REFERENCES club_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- SAAS INFRASTRUCTURE TABLES
-- ==============================================

-- Subscriptions (billing, feature access)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled', 'unpaid')),
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    trial_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usage Analytics (feature usage tracking)
CREATE TABLE usage_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB DEFAULT '{}',
    user_id UUID REFERENCES club_users(id),
    session_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feature Flags (tier-based access control)
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_name VARCHAR(100) NOT NULL UNIQUE,
    free_tier BOOLEAN DEFAULT false,
    basic_tier BOOLEAN DEFAULT false,
    pro_tier BOOLEAN DEFAULT false,
    enterprise_tier BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Methods (Stripe integration)
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('card', 'bank_account')),
    card_last4 VARCHAR(4),
    card_brand VARCHAR(20),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Multi-tenant indexes
CREATE INDEX idx_dancers_club_id ON dancers(club_id);
CREATE INDEX idx_dj_queue_club_id ON dj_queue(club_id);
CREATE INDEX idx_music_library_club_id ON music_library(club_id);
CREATE INDEX idx_vip_rooms_club_id ON vip_rooms(club_id);
CREATE INDEX idx_vip_sessions_club_id ON vip_sessions(club_id);
CREATE INDEX idx_financial_transactions_club_id ON financial_transactions(club_id);
CREATE INDEX idx_usage_analytics_club_id ON usage_analytics(club_id);

-- Business logic indexes
CREATE INDEX idx_dj_queue_position ON dj_queue(club_id, stage_name, position);
CREATE INDEX idx_dancers_license_expiry ON dancers(club_id, license_expiry_date);
CREATE INDEX idx_vip_sessions_active ON vip_sessions(club_id, status) WHERE status = 'active';
CREATE INDEX idx_financial_unpaid ON financial_transactions(club_id, is_paid) WHERE is_paid = false;

-- ==============================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ==============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_club_users_updated_at BEFORE UPDATE ON club_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dancers_updated_at BEFORE UPDATE ON dancers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dj_queue_updated_at BEFORE UPDATE ON dj_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- SAMPLE FEATURE FLAGS DATA
-- ==============================================

INSERT INTO feature_flags (feature_name, free_tier, basic_tier, pro_tier, enterprise_tier, description) VALUES
('dancer_management', true, true, true, true, 'Basic dancer check-in and management'),
('license_compliance', false, true, true, true, 'License tracking and expiration alerts'),
('dj_queue', true, true, true, true, 'Basic DJ queue management'),
('advanced_queue', false, false, true, true, 'Multiple stages and advanced queue features'),
('vip_rooms', false, true, true, true, 'VIP room management and tracking'),
('financial_reports', false, false, true, true, 'Advanced financial reporting'),
('usage_analytics', false, false, false, true, 'Detailed usage analytics and insights'),
('api_access', false, false, true, true, 'REST API access for integrations'),
('custom_branding', false, false, false, true, 'Custom branding and white-label options');
