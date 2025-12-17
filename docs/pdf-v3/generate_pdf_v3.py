"""
ClubOps UI Documentation PDF Generator v3.0
Generates comprehensive PDF with embedded application screenshots
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak,
    Table, TableStyle
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import os
from datetime import datetime

# Configuration
SCREENSHOT_DIR = r"C:\Users\tonyt\AppData\Local\Temp\playwright-mcp-output\1765929013988"
OUTPUT_DIR = r"C:\Users\tonyt\ClubOps-SaaS\docs\pdf-v3"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "ClubOps-UI-Documentation-v3.pdf")

# ClubOps Brand Colors
GOLD = HexColor("#F59E0B")
DARK_BG = HexColor("#0F172A")
BLUE = HexColor("#2563EB")
RED = HexColor("#DC2626")
GREEN = HexColor("#22C55E")

def create_styles():
    """Create custom paragraph styles"""
    styles = getSampleStyleSheet()
    
    styles.add(ParagraphStyle(
        name='CoverTitle',
        parent=styles['Title'],
        fontSize=36,
        textColor=GOLD,
        alignment=TA_CENTER,
        spaceAfter=20,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='CoverSubtitle',
        parent=styles['Normal'],
        fontSize=18,
        textColor=black,
        alignment=TA_CENTER,
        spaceAfter=30
    ))
    
    styles.add(ParagraphStyle(
        name='SectionTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=BLUE,
        spaceBefore=20,
        spaceAfter=15,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='SubSection',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=black,
        spaceBefore=15,
        spaceAfter=10,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='ClubBody',
        parent=styles['Normal'],
        fontSize=11,
        textColor=black,
        spaceBefore=6,
        spaceAfter=6,
        leading=14
    ))
    
    styles.add(ParagraphStyle(
        name='ImageCaption',
        parent=styles['Normal'],
        fontSize=10,
        textColor=HexColor("#666666"),
        alignment=TA_CENTER,
        spaceBefore=5,
        spaceAfter=15,
        fontName='Helvetica-Oblique'
    ))
    
    styles.add(ParagraphStyle(
        name='FeatureItem',
        parent=styles['Normal'],
        fontSize=11,
        textColor=black,
        leftIndent=20,
        spaceBefore=3,
        spaceAfter=3
    ))
    
    return styles


def add_screenshot(story, filename, caption, styles, max_width=6.5*inch, max_height=4.5*inch):
    """Add a screenshot image with caption"""
    filepath = os.path.join(SCREENSHOT_DIR, filename)
    if os.path.exists(filepath):
        img = Image(filepath)
        img_width, img_height = img.drawWidth, img.drawHeight
        scale = min(max_width / img_width, max_height / img_height)
        img.drawWidth = img_width * scale
        img.drawHeight = img_height * scale
        story.append(img)
        story.append(Paragraph(caption, styles['ImageCaption']))
    else:
        story.append(Paragraph(f"[Screenshot not found: {filename}]", styles['ClubBody']))

def build_cover_page(story, styles):
    """Build the cover page"""
    story.append(Spacer(1, 1.5*inch))
    story.append(Paragraph("ClubOps", styles['CoverTitle']))
    story.append(Paragraph("UI Documentation & Visual Guide", styles['CoverSubtitle']))
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph("Version 3.0 - With Screenshots", styles['ClubBody']))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", styles['ClubBody']))
    story.append(Spacer(1, 0.5*inch))
    
    url_data = [
        ["Resource", "URL"],
        ["Frontend Application", "https://clubops-saas-frontend.vercel.app"],
        ["Backend API", "https://clubops-backend.vercel.app"],
        ["Investor Page", "https://clubops-saas-frontend.vercel.app/investors"],
        ["Demo Login", "admin@clubops.com / password"]
    ]
    
    url_table = Table(url_data, colWidths=[2*inch, 4*inch])
    url_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('GRID', (0, 0), (-1, -1), 1, black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(url_table)
    story.append(PageBreak())

def build_toc(story, styles):
    """Build table of contents"""
    story.append(Paragraph("Table of Contents", styles['SectionTitle']))
    story.append(Spacer(1, 0.3*inch))
    
    toc_items = [
        ("1. Executive Summary", "3"),
        ("2. Dashboard Overview", "4"),
        ("3. Dancer Management", "5"),
        ("4. DJ Queue System", "6"),
        ("5. VIP Booth Management", "7"),
        ("6. Revenue Dashboard", "8"),
        ("7. Settings & Configuration", "9"),
        ("8. Investor Landing Page", "10"),
        ("9. Technical Stack", "11"),
        ("10. Subscription Tiers", "12"),
    ]
    
    for item, page in toc_items:
        story.append(Paragraph(f"{item} {'.' * (50 - len(item) - len(page))} {page}", styles['ClubBody']))
    
    story.append(PageBreak())


def build_executive_summary(story, styles):
    """Build executive summary section"""
    story.append(Paragraph("1. Executive Summary", styles['SectionTitle']))
    
    story.append(Paragraph(
        "ClubOps is a comprehensive SaaS platform designed specifically for gentlemen's club management. "
        "The application provides a premium, dark-themed interface optimized for low-light environments "
        "with real-time operations tracking across all key business functions.",
        styles['ClubBody']
    ))
    
    story.append(Paragraph("Design Principles", styles['SubSection']))
    principles = [
        "• Dark theme with vibrant gold, blue, and red accents",
        "• Optimized for low-light club environments",
        "• Real-time data synchronization across all modules",
        "• Drag-and-drop interfaces for intuitive operation",
        "• Mobile-responsive design for management on-the-go"
    ]
    for p in principles:
        story.append(Paragraph(p, styles['FeatureItem']))
    
    story.append(Spacer(1, 0.3*inch))
    
    story.append(Paragraph("Brand Color Palette", styles['SubSection']))
    color_data = [
        ["Color", "Hex Code", "Usage"],
        ["Gold (Primary)", "#F59E0B", "Buttons, highlights, branding"],
        ["Metallic Blue", "#2563EB", "Links, interactive elements"],
        ["Deep Red", "#DC2626", "Alerts, occupied status"],
        ["Success Green", "#22C55E", "Confirmations, available status"],
        ["Dark Background", "#0F172A", "Primary background color"]
    ]
    
    color_table = Table(color_data, colWidths=[1.5*inch, 1.2*inch, 3*inch])
    color_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), GOLD),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('GRID', (0, 0), (-1, -1), 1, black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(color_table)
    story.append(PageBreak())

def build_dashboard_section(story, styles):
    """Build dashboard documentation section"""
    story.append(Paragraph("2. Dashboard Overview", styles['SectionTitle']))
    
    story.append(Paragraph(
        "The main dashboard provides at-a-glance visibility into all club operations with real-time "
        "metrics, activity feeds, and quick action buttons.",
        styles['ClubBody']
    ))
    
    add_screenshot(story, "01-dashboard.png", "Figure 2.1: Main Dashboard with real-time metrics and activity feed", styles)
    
    story.append(Paragraph("Key Dashboard Components", styles['SubSection']))
    components = [
        "• Active Dancers Counter - Shows checked-in dancers vs total roster",
        "• VIP Booth Status - Real-time occupancy with percentage indicator",
        "• DJ Queue Status - Live indicator showing current queue depth",
        "• Today's Revenue - Running total with growth percentage",
        "• Recent Activity Feed - License alerts, payments, check-ins",
        "• Monthly Revenue Widget - Progress toward monthly goal",
        "• Quick Actions Panel - One-click access to common tasks"
    ]
    for c in components:
        story.append(Paragraph(c, styles['FeatureItem']))
    story.append(PageBreak())


def build_dancers_section(story, styles):
    """Build dancer management documentation section"""
    story.append(Paragraph("3. Dancer Management", styles['SectionTitle']))
    
    story.append(Paragraph(
        "Comprehensive dancer roster management with license compliance tracking, bar fee collection, "
        "and performance status monitoring. Color-coded cards provide instant visibility into compliance issues.",
        styles['ClubBody']
    ))
    
    add_screenshot(story, "02-dancers.png", "Figure 3.1: Dancer Management grid with compliance status indicators", styles)
    
    story.append(Paragraph("License Status Indicators", styles['SubSection']))
    status_data = [
        ["Status", "Color", "Description"],
        ["Valid", "Green", "All documents current, dancer can perform"],
        ["Expiring Soon", "Yellow/Orange", "License expires within 2 weeks - proactive alert"],
        ["Expired", "Red", "Cannot perform until license renewed - blocking alert"],
        ["Pending", "Blue", "Application submitted, awaiting approval"]
    ]
    
    status_table = Table(status_data, colWidths=[1.5*inch, 1*inch, 3.5*inch])
    status_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), GOLD),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(status_table)
    story.append(PageBreak())

def build_dj_queue_section(story, styles):
    """Build DJ Queue documentation section"""
    story.append(Paragraph("4. DJ Queue System", styles['SectionTitle']))
    
    story.append(Paragraph(
        "The DJ Queue is the operational heart of ClubOps, featuring drag-and-drop stage management, "
        "an integrated music player supporting all common audio formats, and real-time coordination.",
        styles['ClubBody']
    ))
    
    add_screenshot(story, "03-dj-queue.png", "Figure 4.1: DJ Queue interface with integrated music player", styles)
    
    story.append(Paragraph("Music Player Features", styles['SubSection']))
    features = [
        "• Support for MP3, AAC, FLAC, and WAV formats",
        "• Automatic audio optimization on upload",
        "• Dancer-specific playlist management",
        "• Volume control with visual feedback",
        "• Track progress timeline with seek",
        "• Previous/Play/Next controls"
    ]
    for f in features:
        story.append(Paragraph(f, styles['FeatureItem']))
    story.append(PageBreak())

def build_vip_section(story, styles):
    """Build VIP Booth documentation section"""
    story.append(Paragraph("5. VIP Booth Management", styles['SectionTitle']))
    
    story.append(Paragraph(
        "Real-time VIP booth monitoring with session timers, occupancy tracking, and revenue calculation. "
        "Visual status cards show availability at a glance with one-click session controls.",
        styles['ClubBody']
    ))
    
    add_screenshot(story, "04-vip-booths.png", "Figure 5.1: VIP Booth status cards with session controls", styles)
    
    story.append(Paragraph("Booth Status Types", styles['SubSection']))
    booth_data = [
        ["Status", "Color", "Actions Available"],
        ["Available", "Green", "Start Session, Set Maintenance"],
        ["Occupied", "Red", "End Session, View Details"],
        ["Cleaning", "Yellow", "Mark Available"],
        ["Maintenance", "Gray", "Mark Available"]
    ]
    
    booth_table = Table(booth_data, colWidths=[1.5*inch, 1*inch, 3.5*inch])
    booth_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), GOLD),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(booth_table)
    story.append(PageBreak())


def build_revenue_section(story, styles):
    """Build Revenue Dashboard documentation section"""
    story.append(Paragraph("6. Revenue Dashboard", styles['SectionTitle']))
    
    story.append(Paragraph(
        "Comprehensive financial tracking with multi-period views (Today, Week, Month, Year), "
        "revenue breakdown by category, and transaction history with goal tracking.",
        styles['ClubBody']
    ))
    
    add_screenshot(story, "05-revenue.png", "Figure 6.1: Revenue Dashboard with breakdown and goal progress", styles)
    
    story.append(Paragraph("Revenue Categories", styles['SubSection']))
    revenue_data = [
        ["Category", "Typical %", "Description"],
        ["VIP Booth", "55%", "Session fees from private VIP areas"],
        ["Bar Fees", "28%", "House fees collected from dancers"],
        ["Cover Charges", "12%", "Door entrance fees"],
        ["Tips & Other", "5%", "Miscellaneous revenue streams"]
    ]
    
    revenue_table = Table(revenue_data, colWidths=[1.5*inch, 1*inch, 3.5*inch])
    revenue_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), GOLD),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(revenue_table)
    story.append(PageBreak())

def build_settings_section(story, styles):
    """Build Settings documentation section"""
    story.append(Paragraph("7. Settings & Configuration", styles['SectionTitle']))
    
    story.append(Paragraph(
        "Centralized settings management for user profiles, club information, notification preferences, "
        "security settings, integrations, and appearance customization.",
        styles['ClubBody']
    ))
    
    add_screenshot(story, "06-settings.png", "Figure 7.1: Settings page with profile configuration", styles)
    
    story.append(Paragraph("Settings Categories", styles['SubSection']))
    settings = [
        "• Profile - Personal and club information management",
        "• Notifications - Alert preferences and delivery settings",
        "• Preferences - System defaults and behavior settings",
        "• Security - Password, 2FA, and account protection",
        "• Integrations - Connected services and API keys",
        "• Appearance - Theme customization and display options"
    ]
    for s in settings:
        story.append(Paragraph(s, styles['FeatureItem']))
    story.append(PageBreak())

def build_investor_section(story, styles):
    """Build Investor Page documentation section"""
    story.append(Paragraph("8. Investor Landing Page", styles['SectionTitle']))
    
    story.append(Paragraph(
        "A dedicated public landing page for investors featuring market opportunity data, "
        "product roadmap, revenue model overview, and live demo access.",
        styles['ClubBody']
    ))
    
    add_screenshot(story, "07-investors.png", "Figure 8.1: Investor landing page hero section", styles)
    
    story.append(Paragraph("Key Investor Highlights", styles['SubSection']))
    highlights = [
        "• $8.1B US market opportunity",
        "• 4,000+ potential club customers nationwide",
        "• < 15% digital adoption = massive growth potential",
        "• SaaS subscription model ($99-$499/month)",
        "• Transaction fee revenue (2.5% + $0.25)",
        "• Hardware lease opportunity ($199-$499/month)"
    ]
    for h in highlights:
        story.append(Paragraph(h, styles['FeatureItem']))
    story.append(PageBreak())


def build_executive_summary(story, styles):
    story.append(Paragraph("1. Executive Summary", styles['SectionTitle']))
    story.append(Paragraph(
        "ClubOps is a comprehensive SaaS platform designed specifically for gentlemen's club management. "
        "The application provides a premium, dark-themed interface optimized for low-light environments "
        "with real-time operations tracking across all key business functions.",
        styles['ClubBody']
    ))
    story.append(Paragraph("Design Principles", styles['SubSection']))
    for p in ["Dark theme with vibrant gold, blue, and red accents", "Optimized for low-light club environments",
              "Real-time data synchronization across all modules", "Drag-and-drop interfaces for intuitive operation"]:
        story.append(Paragraph(f"• {p}", styles['FeatureItem']))
    story.append(PageBreak())

def build_dashboard_section(story, styles):
    story.append(Paragraph("2. Dashboard Overview", styles['SectionTitle']))
    story.append(Paragraph(
        "The main dashboard provides at-a-glance visibility into all club operations with real-time "
        "metrics, activity feeds, and quick action buttons.", styles['ClubBody']
    ))
    add_screenshot(story, "01-dashboard.png", "Figure 2.1: Main Dashboard with real-time metrics and activity feed", styles)
    story.append(Paragraph("Key Components", styles['SubSection']))
    for c in ["Active Dancers Counter", "VIP Booth Status with occupancy", "DJ Queue Status", 
              "Today's Revenue with growth %", "Recent Activity Feed", "Quick Actions Panel"]:
        story.append(Paragraph(f"• {c}", styles['FeatureItem']))
    story.append(PageBreak())

def build_dancers_section(story, styles):
    story.append(Paragraph("3. Dancer Management", styles['SectionTitle']))
    story.append(Paragraph(
        "Comprehensive dancer roster management with license compliance tracking, bar fee collection, "
        "and performance status monitoring.", styles['ClubBody']
    ))
    add_screenshot(story, "02-dancers.png", "Figure 3.1: Dancer Management grid with compliance indicators", styles)
    story.append(PageBreak())

def build_dj_queue_section(story, styles):
    story.append(Paragraph("4. DJ Queue System", styles['SectionTitle']))
    story.append(Paragraph(
        "The DJ Queue features drag-and-drop stage management, an integrated music player supporting "
        "MP3, AAC, FLAC, and WAV formats.", styles['ClubBody']
    ))
    add_screenshot(story, "03-dj-queue.png", "Figure 4.1: DJ Queue interface with integrated music player", styles)
    story.append(PageBreak())

def build_vip_section(story, styles):
    story.append(Paragraph("5. VIP Booth Management", styles['SectionTitle']))
    story.append(Paragraph(
        "Real-time VIP booth monitoring with session timers, occupancy tracking, and revenue calculation.", 
        styles['ClubBody']
    ))
    add_screenshot(story, "04-vip-booths.png", "Figure 5.1: VIP Booth status cards with session controls", styles)
    story.append(PageBreak())

def build_revenue_section(story, styles):
    story.append(Paragraph("6. Revenue Dashboard", styles['SectionTitle']))
    story.append(Paragraph(
        "Comprehensive financial tracking with multi-period views, revenue breakdown by category, "
        "and goal tracking with progress visualization.", styles['ClubBody']
    ))
    add_screenshot(story, "05-revenue.png", "Figure 6.1: Revenue Dashboard with breakdown and goal progress", styles)
    story.append(PageBreak())

def build_settings_section(story, styles):
    story.append(Paragraph("7. Settings & Configuration", styles['SectionTitle']))
    story.append(Paragraph(
        "Centralized settings for user profiles, club information, notifications, security, and integrations.",
        styles['ClubBody']
    ))
    add_screenshot(story, "06-settings.png", "Figure 7.1: Settings page with profile configuration", styles)
    story.append(PageBreak())

def build_investor_section(story, styles):
    story.append(Paragraph("8. Investor Landing Page", styles['SectionTitle']))
    story.append(Paragraph(
        "A dedicated public landing page featuring market opportunity ($8.1B), product roadmap, "
        "revenue model overview, and live demo access.", styles['ClubBody']
    ))
    add_screenshot(story, "07-investors.png", "Figure 8.1: Investor landing page hero section", styles)
    story.append(PageBreak())


def build_tech_stack_section(story, styles):
    story.append(Paragraph("9. Technical Stack", styles['SectionTitle']))
    story.append(Paragraph("Frontend", styles['SubSection']))
    for f in ["React 18 with TypeScript", "Vite for fast builds", "Tailwind CSS", "Lucide React icons"]:
        story.append(Paragraph(f"• {f}", styles['FeatureItem']))
    story.append(Paragraph("Backend", styles['SubSection']))
    for b in ["Node.js with Express.js", "PostgreSQL with Prisma ORM", "JWT authentication", "Socket.io for real-time"]:
        story.append(Paragraph(f"• {b}", styles['FeatureItem']))
    story.append(PageBreak())

def build_subscription_section(story, styles):
    story.append(Paragraph("10. Subscription Tiers", styles['SectionTitle']))
    tier_data = [
        ["Tier", "Price", "Features"],
        ["Free", "$0/mo", "Basic dashboard, up to 10 dancers"],
        ["Basic", "$99/mo", "Full dashboard, unlimited dancers"],
        ["Pro", "$199/mo", "All features, API access, analytics"],
        ["Enterprise", "$399/mo", "Multi-location, white-label, SLA"]
    ]
    tier_table = Table(tier_data, colWidths=[1.2*inch, 1*inch, 4*inch])
    tier_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GOLD),
        ('TEXTCOLOR', (0, 0), (-1, 0), black),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(tier_table)

def generate_pdf():
    print("Starting PDF generation...")
    doc = SimpleDocTemplate(OUTPUT_FILE, pagesize=letter,
        rightMargin=0.75*inch, leftMargin=0.75*inch,
        topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = create_styles()
    story = []
    
    print("Building sections...")
    build_cover_page(story, styles)
    build_toc(story, styles)
    build_executive_summary(story, styles)
    build_dashboard_section(story, styles)
    build_dancers_section(story, styles)
    build_dj_queue_section(story, styles)
    build_vip_section(story, styles)
    build_revenue_section(story, styles)
    build_settings_section(story, styles)
    build_investor_section(story, styles)
    build_tech_stack_section(story, styles)
    build_subscription_section(story, styles)
    
    print(f"Generating PDF...")
    doc.build(story)
    print(f"PDF generated: {OUTPUT_FILE}")
    print(f"Size: {os.path.getsize(OUTPUT_FILE) / 1024:.1f} KB")

if __name__ == "__main__":
    generate_pdf()

