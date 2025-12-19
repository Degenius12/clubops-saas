"""
ClubOps Operations Manual PDF Generator
Generates comprehensive operations manual PDF with embedded screenshots
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak,
    Table, TableStyle, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
import os
from datetime import datetime

# Configuration
SCREENSHOT_DIR = r"C:\Users\tonyt\ClubOps-SaaS\docs\manual\screenshots"
OUTPUT_DIR = r"C:\Users\tonyt\ClubOps-SaaS\docs\manual"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "ClubOps_Operations_Manual.pdf")

# ClubOps Brand Colors
GOLD = HexColor("#F59E0B")
ELECTRIC = HexColor("#3B82F6")
ROYAL = HexColor("#8B5CF6")
DARK_BG = HexColor("#0F172A")
STATUS_SUCCESS = HexColor("#22C55E")
STATUS_DANGER = HexColor("#DC2626")

def create_styles():
    """Create custom paragraph styles"""
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name='CoverTitle',
        parent=styles['Title'],
        fontSize=42,
        textColor=GOLD,
        alignment=TA_CENTER,
        spaceAfter=20,
        fontName='Helvetica-Bold'
    ))

    styles.add(ParagraphStyle(
        name='CoverSubtitle',
        parent=styles['Normal'],
        fontSize=20,
        textColor=ELECTRIC,
        alignment=TA_CENTER,
        spaceAfter=12
    ))

    styles.add(ParagraphStyle(
        name='CoverVersion',
        parent=styles['Normal'],
        fontSize=14,
        textColor=black,
        alignment=TA_CENTER,
        spaceAfter=30
    ))

    styles.add(ParagraphStyle(
        name='SectionTitle',
        parent=styles['Heading1'],
        fontSize=22,
        textColor=ELECTRIC,
        spaceBefore=20,
        spaceAfter=12,
        fontName='Helvetica-Bold',
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        name='SubSection',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=ROYAL,
        spaceBefore=12,
        spaceAfter=8,
        fontName='Helvetica-Bold',
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        name='SubSubSection',
        parent=styles['Heading3'],
        fontSize=13,
        textColor=black,
        spaceBefore=10,
        spaceAfter=6,
        fontName='Helvetica-Bold',
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        name='ManualBody',
        parent=styles['Normal'],
        fontSize=11,
        textColor=black,
        spaceBefore=6,
        spaceAfter=6,
        leading=15,
        alignment=TA_JUSTIFY
    ))

    styles.add(ParagraphStyle(
        name='ImageCaption',
        parent=styles['Normal'],
        fontSize=10,
        textColor=HexColor("#555555"),
        alignment=TA_CENTER,
        spaceBefore=4,
        spaceAfter=12,
        fontName='Helvetica-Oblique'
    ))

    styles.add(ParagraphStyle(
        name='BulletItem',
        parent=styles['Normal'],
        fontSize=11,
        textColor=black,
        leftIndent=20,
        spaceBefore=3,
        spaceAfter=3,
        bulletIndent=10
    ))

    styles.add(ParagraphStyle(
        name='CodeBlock',
        parent=styles['Normal'],
        fontSize=10,
        textColor=black,
        fontName='Courier',
        leftIndent=20,
        spaceBefore=6,
        spaceAfter=6,
        backColor=HexColor("#F5F5F5")
    ))

    return styles


def add_screenshot(story, filename, caption, styles, max_width=6.5*inch, max_height=4.5*inch):
    """Add a screenshot image with caption"""
    filepath = os.path.join(SCREENSHOT_DIR, filename)
    if os.path.exists(filepath):
        try:
            img = Image(filepath)
            img_width, img_height = img.drawWidth, img.drawHeight
            scale = min(max_width / img_width, max_height / img_height)
            img.drawWidth = img_width * scale
            img.drawHeight = img_height * scale
            story.append(Spacer(1, 0.1*inch))
            story.append(img)
            story.append(Paragraph(caption, styles['ImageCaption']))
            story.append(Spacer(1, 0.1*inch))
        except Exception as e:
            story.append(Paragraph(f"[Error loading screenshot: {filename}]", styles['ManualBody']))
    else:
        story.append(Paragraph(f"[Screenshot not found: {filename}]", styles['ManualBody']))


def build_cover_page(story, styles):
    """Build the cover page"""
    story.append(Spacer(1, 2*inch))
    story.append(Paragraph("ClubOps", styles['CoverTitle']))
    story.append(Paragraph("Operations Manual", styles['CoverSubtitle']))
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("Premium Gentlemen's Club Management Platform", styles['CoverVersion']))
    story.append(Paragraph(f"Version 2.0 | {datetime.now().strftime('%B %Y')}", styles['ManualBody']))
    story.append(Spacer(1, 1*inch))

    # Quick access URLs
    url_data = [
        ["Resource", "URL/Credentials"],
        ["Live Application", "https://clubops-saas-frontend.vercel.app"],
        ["Demo Login", "admin@clubops.com / password"],
        ["Backend API", "https://clubops-backend.vercel.app"],
        ["Support Email", "support@clubops.com"]
    ]

    url_table = Table(url_data, colWidths=[2*inch, 4*inch])
    url_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ELECTRIC),
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


def build_getting_started(story, styles):
    """Build Getting Started section"""
    story.append(Paragraph("1. Getting Started", styles['SectionTitle']))

    story.append(Paragraph("1.1 System Requirements", styles['SubSection']))
    story.append(Paragraph(
        "ClubOps is a cloud-based web application accessible from any modern device. "
        "No installation is required.",
        styles['ManualBody']
    ))

    story.append(Paragraph("Supported Browsers:", styles['SubSubSection']))
    for browser in ["• Chrome 90+ (Recommended)", "• Firefox 88+", "• Safari 14+", "• Edge 90+"]:
        story.append(Paragraph(browser, styles['BulletItem']))

    story.append(Paragraph("Device Compatibility:", styles['SubSubSection']))
    for device in ["• Desktop/Laptop (Windows, macOS, Linux)", "• Tablets (iPad, Android tablets)",
                   "• Mobile Phones (iOS 14+, Android 10+)"]:
        story.append(Paragraph(device, styles['BulletItem']))

    story.append(Paragraph("1.2 Accessing ClubOps", styles['SubSection']))
    add_screenshot(story, "00-login.png", "Figure 1.1: ClubOps Login Screen", styles)

    story.append(Paragraph(
        "Navigate to https://clubops-saas-frontend.vercel.app and enter your credentials. "
        "Contact your club administrator if you don't have login credentials.",
        styles['ManualBody']
    ))

    story.append(PageBreak())


def build_dashboard(story, styles):
    """Build Dashboard section"""
    story.append(Paragraph("2. Dashboard Overview", styles['SectionTitle']))

    story.append(Paragraph(
        "The Dashboard is your central command center, providing real-time visibility into all "
        "club operations. It displays key metrics, recent activity, and quick action buttons.",
        styles['ManualBody']
    ))

    add_screenshot(story, "01-dashboard.png", "Figure 2.1: Main Dashboard with Real-Time Metrics", styles)

    story.append(Paragraph("2.1 Key Metrics Cards", styles['SubSection']))

    metric_data = [
        ["Metric", "Description"],
        ["Active Dancers", "Number of checked-in dancers vs total roster size"],
        ["VIP Booths", "Occupancy percentage and available booth count"],
        ["DJ Queue", "Current queue depth and stage rotation status"],
        ["Today's Revenue", "Running total with growth percentage indicator"]
    ]

    metric_table = Table(metric_data, colWidths=[1.5*inch, 4.5*inch])
    metric_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), GOLD),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(metric_table)

    story.append(Paragraph("2.2 Recent Activity Feed", styles['SubSection']))
    story.append(Paragraph(
        "The activity feed shows real-time events including license alerts, payment confirmations, "
        "dancer check-ins, and compliance notifications. Click any activity to view details.",
        styles['ManualBody']
    ))

    story.append(PageBreak())


def build_dancer_management(story, styles):
    """Build Dancer Management section"""
    story.append(Paragraph("3. Dancer Management", styles['SectionTitle']))

    story.append(Paragraph(
        "Manage your complete dancer roster with license compliance tracking, bar fee collection, "
        "and performance status monitoring. The color-coded card system provides instant visibility "
        "into compliance issues.",
        styles['ManualBody']
    ))

    add_screenshot(story, "02-dancers.png", "Figure 3.1: Dancer Management Grid with Compliance Indicators", styles)

    story.append(Paragraph("3.1 License Status Indicators", styles['SubSection']))

    status_data = [
        ["Status", "Color", "Meaning"],
        ["Valid", "Green", "All documents current - dancer can perform"],
        ["Expiring Soon", "Yellow", "License expires within 14 days - proactive alert"],
        ["Expired", "Red", "Cannot perform - license renewal required"],
        ["Pending", "Blue", "Application submitted - awaiting approval"]
    ]

    status_table = Table(status_data, colWidths=[1.3*inch, 1*inch, 3.7*inch])
    status_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), GOLD),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(status_table)

    story.append(Paragraph("3.2 Adding a New Dancer", styles['SubSection']))
    steps = [
        "1. Click the 'Add Dancer' button in the top right",
        "2. Fill in required information: Legal Name, Stage Name, Phone, Email",
        "3. Upload license documentation and ID verification",
        "4. Set bar fee amount and schedule preferences",
        "5. Click 'Save' to add dancer to roster"
    ]
    for step in steps:
        story.append(Paragraph(step, styles['BulletItem']))

    story.append(PageBreak())


def build_dj_queue(story, styles):
    """Build DJ Queue section"""
    story.append(Paragraph("4. DJ Queue Management", styles['SectionTitle']))

    story.append(Paragraph(
        "The DJ Queue is the operational heart of ClubOps, featuring drag-and-drop stage management "
        "and an integrated music player supporting MP3, AAC, FLAC, and WAV formats.",
        styles['ManualBody']
    ))

    add_screenshot(story, "03-dj-queue.png", "Figure 4.1: DJ Queue Interface with Music Player", styles)

    story.append(Paragraph("4.1 Managing the Queue", styles['SubSection']))
    operations = [
        "• Drag and drop dancers to reorder the queue",
        "• Click 'Now on Stage' to move a dancer to performance",
        "• Use 'Add to Queue' to include checked-in dancers",
        "• Click 'Clear' to remove a dancer from the queue",
        "• Auto-rotation timer visible on active performer card"
    ]
    for op in operations:
        story.append(Paragraph(op, styles['BulletItem']))

    story.append(Paragraph("4.2 Music Player Controls", styles['SubSection']))
    story.append(Paragraph(
        "The integrated music player allows DJs to manage dancer-specific playlists with full "
        "playback controls, volume adjustment, and track seeking.",
        styles['ManualBody']
    ))

    story.append(PageBreak())


def build_vip_booths(story, styles):
    """Build VIP Booths section"""
    story.append(Paragraph("5. VIP Booth Management", styles['SectionTitle']))

    story.append(Paragraph(
        "Monitor all VIP booth sessions in real-time with automatic timers, occupancy tracking, "
        "and revenue calculation. Visual status cards show availability at a glance.",
        styles['ManualBody']
    ))

    add_screenshot(story, "04-vip-booths.png", "Figure 5.1: VIP Booth Status Cards with Session Controls", styles)

    story.append(Paragraph("5.1 Booth Status Types", styles['SubSection']))

    booth_data = [
        ["Status", "Color", "Available Actions"],
        ["Available", "Green", "Start Session, Set Maintenance Mode"],
        ["Occupied", "Red", "End Session, View Timer, Calculate Revenue"],
        ["Cleaning", "Yellow", "Mark as Available (after cleanup)"],
        ["Maintenance", "Gray", "Mark as Available (after repairs)"]
    ]

    booth_table = Table(booth_data, colWidths=[1.3*inch, 1*inch, 3.7*inch])
    booth_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), GOLD),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(booth_table)

    story.append(Paragraph("5.2 Starting a VIP Session", styles['SubSection']))
    session_steps = [
        "1. Click 'Start Session' on an available booth",
        "2. Select dancer(s) from the dropdown",
        "3. Session timer begins automatically",
        "4. Revenue tracking starts based on booth rate",
        "5. Click 'End Session' when customer leaves"
    ]
    for step in session_steps:
        story.append(Paragraph(step, styles['BulletItem']))

    story.append(PageBreak())


def build_revenue(story, styles):
    """Build Revenue Dashboard section"""
    story.append(Paragraph("6. Revenue Dashboard", styles['SectionTitle']))

    story.append(Paragraph(
        "Track all financial activity with multi-period views (Today, Week, Month, Year), "
        "revenue breakdown by category, and automated goal tracking.",
        styles['ManualBody']
    ))

    add_screenshot(story, "05-revenue.png", "Figure 6.1: Revenue Dashboard with Category Breakdown", styles)

    story.append(Paragraph("6.1 Revenue Categories", styles['SubSection']))

    revenue_data = [
        ["Category", "Typical %", "Description"],
        ["VIP Booth Revenue", "50-60%", "Session fees from private VIP areas"],
        ["Bar Fees (House Fees)", "25-30%", "Fees collected from dancers per shift"],
        ["Cover Charges", "10-15%", "Door entrance fees from customers"],
        ["Tips & Miscellaneous", "3-5%", "Other revenue streams"]
    ]

    revenue_table = Table(revenue_data, colWidths=[1.5*inch, 1*inch, 3.5*inch])
    revenue_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), GOLD),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(revenue_table)

    story.append(PageBreak())


def build_settings(story, styles):
    """Build Settings section"""
    story.append(Paragraph("7. Settings & Configuration", styles['SectionTitle']))

    story.append(Paragraph(
        "Centralized management for user profiles, club information, notification preferences, "
        "security settings, and system integrations.",
        styles['ManualBody']
    ))

    add_screenshot(story, "06-settings.png", "Figure 7.1: Settings Page with Profile Configuration", styles)

    story.append(Paragraph("7.1 Settings Categories", styles['SubSection']))

    categories = [
        ("Profile", "Personal information, contact details, role assignment"),
        ("Club Information", "Business name, address, operating hours, tax settings"),
        ("Notifications", "Email/SMS alerts, compliance reminders, revenue thresholds"),
        ("Security", "Password management, two-factor authentication, session timeout"),
        ("Integrations", "Payment processors, accounting software, security systems"),
        ("Appearance", "Theme customization, dashboard layout, display preferences")
    ]

    for cat, desc in categories:
        story.append(Paragraph(f"<b>{cat}:</b> {desc}", styles['BulletItem']))

    story.append(PageBreak())


def build_subscription(story, styles):
    """Build Subscription section"""
    story.append(Paragraph("8. Subscription Management", styles['SectionTitle']))

    story.append(Paragraph(
        "ClubOps offers flexible subscription plans to match your club's needs. "
        "Upgrade or downgrade at any time with prorated billing.",
        styles['ManualBody']
    ))

    add_screenshot(story, "07-subscription.png", "Figure 8.1: Subscription Plans Comparison", styles)

    story.append(Paragraph("8.1 Subscription Tiers", styles['SubSection']))

    tier_data = [
        ["Plan", "Monthly Price", "Key Features"],
        ["Free", "$0", "Basic dashboard, up to 10 dancers, limited features"],
        ["Basic", "$99", "Full dashboard, unlimited dancers, standard support"],
        ["Pro", "$199", "All features, API access, priority support, analytics"],
        ["Enterprise", "$499", "Multi-location, white-label, dedicated support, SLA"]
    ]

    tier_table = Table(tier_data, colWidths=[1.2*inch, 1.2*inch, 3.6*inch])
    tier_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GOLD),
        ('TEXTCOLOR', (0, 0), (-1, 0), black),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(tier_table)

    story.append(PageBreak())


def build_troubleshooting(story, styles):
    """Build Troubleshooting section"""
    story.append(Paragraph("9. Troubleshooting & Support", styles['SectionTitle']))

    story.append(Paragraph("9.1 Common Issues", styles['SubSection']))

    issues = [
        ("Cannot log in", "Verify email and password. Use 'Forgot Password' if needed. Clear browser cache and cookies."),
        ("Screenshots not displaying", "Ensure stable internet connection. Try refreshing the page (F5 or Cmd+R)."),
        ("Dancer not appearing in queue", "Verify dancer is checked in. Refresh the DJ Queue page."),
        ("VIP booth timer not starting", "Check booth status is 'Available'. End any existing sessions first."),
        ("Revenue not updating", "Wait 1-2 minutes for real-time sync. Check WebSocket connection indicator.")
    ]

    for issue, solution in issues:
        story.append(Paragraph(f"<b>{issue}:</b> {solution}", styles['ManualBody']))
        story.append(Spacer(1, 0.1*inch))

    story.append(Paragraph("9.2 Getting Support", styles['SubSection']))
    support = [
        "• Email: support@clubops.com (24-48 hour response)",
        "• Live Chat: Available in-app (Pro/Enterprise plans)",
        "• Phone: Available for Enterprise customers",
        "• Knowledge Base: https://docs.clubops.com"
    ]
    for item in support:
        story.append(Paragraph(item, styles['BulletItem']))

    story.append(PageBreak())


def build_quick_reference(story, styles):
    """Build Quick Reference section"""
    story.append(Paragraph("10. Quick Reference", styles['SectionTitle']))

    story.append(Paragraph("10.1 Keyboard Shortcuts", styles['SubSection']))

    shortcuts_data = [
        ["Action", "Windows/Linux", "macOS"],
        ["Search dancers", "Ctrl + F", "Cmd + F"],
        ["Add new dancer", "Ctrl + N", "Cmd + N"],
        ["Refresh page", "F5", "Cmd + R"],
        ["Open settings", "Ctrl + ,", "Cmd + ,"],
        ["Log out", "Ctrl + Shift + Q", "Cmd + Shift + Q"]
    ]

    shortcuts_table = Table(shortcuts_data, colWidths=[2*inch, 2*inch, 2*inch])
    shortcuts_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), GOLD),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(shortcuts_table)

    story.append(Spacer(1, 0.2*inch))

    story.append(Paragraph("10.2 User Roles & Permissions", styles['SubSection']))

    roles_data = [
        ["Role", "Key Permissions"],
        ["Owner", "Full access - all features, settings, billing"],
        ["Manager", "Operations management - dancers, booths, revenue view"],
        ["DJ", "Queue management - stage rotation, music player"],
        ["Door Staff", "Check-in management - dancer arrival/departure"],
        ["VIP Host", "Booth management - sessions, customer service"]
    ]

    roles_table = Table(roles_data, colWidths=[1.5*inch, 4.5*inch])
    roles_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), GOLD),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(roles_table)


def generate_pdf():
    """Generate the operations manual PDF"""
    print("🚀 Starting ClubOps Operations Manual PDF generation...")
    print(f"📁 Screenshot directory: {SCREENSHOT_DIR}")
    print(f"📄 Output file: {OUTPUT_FILE}")

    # Create document
    doc = SimpleDocTemplate(
        OUTPUT_FILE,
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch
    )

    # Create styles
    styles = create_styles()
    story = []

    # Build all sections
    print("📝 Building cover page...")
    build_cover_page(story, styles)

    print("📝 Building Getting Started section...")
    build_getting_started(story, styles)

    print("📝 Building Dashboard section...")
    build_dashboard(story, styles)

    print("📝 Building Dancer Management section...")
    build_dancer_management(story, styles)

    print("📝 Building DJ Queue section...")
    build_dj_queue(story, styles)

    print("📝 Building VIP Booths section...")
    build_vip_booths(story, styles)

    print("📝 Building Revenue section...")
    build_revenue(story, styles)

    print("📝 Building Settings section...")
    build_settings(story, styles)

    print("📝 Building Subscription section...")
    build_subscription(story, styles)

    print("📝 Building Troubleshooting section...")
    build_troubleshooting(story, styles)

    print("📝 Building Quick Reference section...")
    build_quick_reference(story, styles)

    # Generate PDF
    print("🔨 Generating PDF document...")
    doc.build(story)

    # Report results
    file_size = os.path.getsize(OUTPUT_FILE)
    print(f"\n✅ PDF generated successfully!")
    print(f"📄 File: {OUTPUT_FILE}")
    print(f"📊 Size: {file_size / 1024:.1f} KB ({file_size / (1024*1024):.2f} MB)")
    print(f"📅 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    try:
        generate_pdf()
    except Exception as e:
        print(f"\n❌ Error generating PDF: {str(e)}")
        import traceback
        traceback.print_exc()
