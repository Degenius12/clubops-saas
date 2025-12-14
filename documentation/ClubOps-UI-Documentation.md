# ClubOps - UI/UX Documentation

**Version:** 1.0  
**Date:** December 14, 2025  
**Status:** Production Ready  
**Live URL:** https://clubops-saas-frontend.vercel.app

---

## Executive Summary

ClubOps is a comprehensive SaaS platform designed for gentlemen's club management. The application features a premium dark theme optimized for low-light environments, with accent colors of metallic gold, deep blue, and subtle red highlights.

### Key Design Principles
- **Dark Theme**: Optimized for club environments with minimal eye strain
- **Color Palette**: Deep charcoal backgrounds (#1a1a1a), gold accents (#D4AF37), teal highlights
- **Typography**: Clean, readable fonts with high contrast
- **Data Visualization**: Real-time metrics with color-coded status indicators

---

## Application Screenshots

### 1. Dashboard (Home)
**File:** `screenshots/01-dashboard.png`

The main dashboard provides an at-a-glance view of club operations:

**Key Metrics Cards:**
- Active Dancers: 12 (gold badge)
- Tonight's Revenue: $2,847 (+12.5% indicator)
- VIP Rooms Active: 3/8 (utilization tracking)
- Queue Length: 8 dancers (real-time count)

**Features:**
- Quick action buttons for common tasks
- Staff status indicators
- Revenue trend visualization
- Live activity feed

---

### 2. Dancer Management
**File:** `screenshots/02-dancers.png`

Comprehensive dancer roster management with compliance tracking:

**License Status Color Coding:**
- 🟢 **Green (Valid)**: License current and valid
- 🟡 **Yellow (Expiring Soon)**: License expires within 14 days
- 🔴 **Red (Expired)**: Immediate action required

**Dancer Cards Display:**
- Profile photo placeholder
- Stage name
- License expiration date
- Current status (Checked In/Available/On Break)
- Quick action buttons

**Compliance Features:**
- Proactive expiration alerts
- Blocking alerts for expired licenses
- Filter by status (All/Active/Pending/Expired)

---

### 3. DJ Queue Management
**File:** `screenshots/03-dj-queue.png`

The core operational interface for DJ workflow:

**Stage Queue Section:**
- Drag-and-drop dancer reordering
- Visual queue with numbered positions
- Stage assignment (Main Stage, VIP Stage, etc.)
- Estimated wait times

**Now Playing Display:**
- Current performer highlighted
- Active stage timer
- Song information
- Quick controls

**Music Player Integration:**
- Built-in audio player
- Format support: MP3, AAC, FLAC, WAV
- Dancer-specific playlists
- Volume and playback controls

---

### 4. VIP Booth Management
**File:** `screenshots/04-vip-booths.png`

Real-time VIP room tracking and session management:

**Booth Status Grid:**
- **Available** (Green): Ready for booking
- **Occupied** (Gold/Yellow): Active session with timer
- **Reserved** (Blue): Pre-booked for upcoming
- **Cleaning** (Gray): Maintenance/turnover

**Session Information:**
- Active dancer assignment
- Session start time
- Running timer display
- Revenue tracking per booth

**Room Details:**
- Booth number/name
- Capacity information
- Amenity icons
- Quick status toggle

---

### 5. Revenue Dashboard
**File:** `screenshots/05-revenue.png`

Financial tracking and reporting interface:

**Summary Cards:**
| Period | Revenue | Change |
|--------|---------|--------|
| Today | $2,847 | +12.5% |
| This Week | $12,500 | +8.2% |
| This Month | $48,500 | +15.7% |
| This Year | $485,000 | +22.1% |

**Revenue Breakdown Bar Chart:**
- VIP Booth Revenue: 55% (Gold)
- Bar Fees: 28% (Purple)
- Cover Charges: 12% (Teal)
- Tips & Other: 5% (Gray)

**Features:**
- Time period filters
- Export functionality
- Trend analysis
- Category breakdown

---

### 6. Settings
**File:** `screenshots/06-settings.png`

Account and system configuration:

**Settings Tabs:**
1. **Profile** - Personal & club information
2. **Notifications** - Alert preferences
3. **Preferences** - System settings
4. **Security** - Account protection
5. **Integrations** - Connected services
6. **Appearance** - Look & feel customization

**Profile Section:**
- Avatar with "Change Photo" option
- Full Name input
- Email Address
- Phone Number
- Club Name
- Club Address
- Timezone selector

**Design Notes:**
- Tab navigation with gold highlight on active tab
- Form fields with dark input backgrounds
- Gold "Save Changes" button

---

## Color Palette Reference

| Element | Color | Hex Code |
|---------|-------|----------|
| Background (Primary) | Dark Charcoal | #0D0D0D |
| Background (Cards) | Elevated Dark | #1A1A1A |
| Background (Input) | Field Dark | #2A2A2A |
| Accent (Primary) | Metallic Gold | #D4AF37 |
| Accent (Secondary) | Deep Teal | #0D9488 |
| Status - Success | Green | #22C55E |
| Status - Warning | Amber | #F59E0B |
| Status - Error | Red | #EF4444 |
| Text (Primary) | White | #FFFFFF |
| Text (Secondary) | Gray | #9CA3AF |

---

## Typography

- **Headings**: Inter, Semi-bold
- **Body Text**: Inter, Regular
- **Metrics/Numbers**: Inter, Medium (tabular figures)
- **Buttons**: Inter, Medium

---

## Responsive Design

The application is fully responsive with breakpoints:
- **Desktop**: 1280px+ (Full sidebar, expanded views)
- **Tablet**: 768px - 1279px (Collapsible sidebar)
- **Mobile**: < 768px (Bottom navigation, stacked cards)

---

## Navigation Structure

```
ClubOps
├── Club Management
│   ├── Dashboard
│   ├── Dancers
│   ├── DJ Queue
│   ├── VIP Booths
│   └── Revenue
├── Platform
│   ├── Subscription
│   ├── Billing
│   └── Admin
└── Settings
```

---

## Authentication

**Login Credentials (Demo):**
- Email: admin@clubops.com
- Password: demo123

**Features:**
- JWT-based authentication
- Session management
- Role-based access control

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Build Tool | Vite |
| State Management | React Context + Hooks |
| Real-time | Socket.io |
| Backend | Node.js + Express |
| Database | PostgreSQL + Prisma ORM |
| Hosting | Vercel (Frontend) |
| API | Vercel Serverless Functions |

---

## Production URLs

- **Frontend**: https://clubops-saas-frontend.vercel.app
- **Backend API**: https://clubops-saas-backend.vercel.app/api

---

*Document generated: December 14, 2025*  
*ClubOps © 2025 - All Rights Reserved*
