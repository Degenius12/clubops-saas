/**
 * ClubOps Operations Manual PDF Generator
 * Converts the markdown manual to PDF using Playwright
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const MANUAL_PATH = path.join(__dirname, 'ClubOps_Operations_Manual_v2.md');
const OUTPUT_PATH = path.join(__dirname, 'ClubOps_Operations_Manual.pdf');
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

// Read the markdown file
const markdownContent = fs.readFileSync(MANUAL_PATH, 'utf-8');

// Convert markdown to HTML with proper styling
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ClubOps Operations Manual</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <style>
        @page {
            size: letter;
            margin: 0.75in;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #1a1a1a;
        }

        h1 {
            font-size: 28pt;
            font-weight: bold;
            color: #3B82F6;
            margin-top: 24pt;
            margin-bottom: 12pt;
            page-break-after: avoid;
        }

        h2 {
            font-size: 20pt;
            font-weight: bold;
            color: #8B5CF6;
            margin-top: 20pt;
            margin-bottom: 10pt;
            page-break-after: avoid;
        }

        h3 {
            font-size: 15pt;
            font-weight: bold;
            color: #1a1a1a;
            margin-top: 16pt;
            margin-bottom: 8pt;
            page-break-after: avoid;
        }

        h4 {
            font-size: 13pt;
            font-weight: bold;
            margin-top: 12pt;
            margin-bottom: 6pt;
            page-break-after: avoid;
        }

        p {
            margin-bottom: 10pt;
            text-align: justify;
        }

        ul, ol {
            margin-bottom: 10pt;
            padding-left: 24pt;
        }

        li {
            margin-bottom: 4pt;
        }

        code {
            background-color: #f5f5f5;
            padding: 2pt 4pt;
            border-radius: 3pt;
            font-family: 'Courier New', monospace;
            font-size: 10pt;
        }

        pre {
            background-color: #f5f5f5;
            padding: 12pt;
            border-radius: 6pt;
            overflow-x: auto;
            margin-bottom: 10pt;
        }

        pre code {
            background-color: transparent;
            padding: 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16pt;
        }

        th {
            background-color: #0F172A;
            color: #F59E0B;
            padding: 8pt;
            text-align: left;
            font-weight: bold;
            border: 1px solid #333;
        }

        td {
            padding: 8pt;
            border: 1px solid #ccc;
        }

        tr:nth-child(even) {
            background-color: #f9f9f9;
        }

        img {
            max-width: 100%;
            height: auto;
            margin: 12pt 0;
            border: 1px solid #ddd;
            border-radius: 4pt;
        }

        .cover-page {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            page-break-after: always;
            text-align: center;
        }

        .cover-title {
            font-size: 48pt;
            font-weight: bold;
            color: #F59E0B;
            margin-bottom: 12pt;
        }

        .cover-subtitle {
            font-size: 24pt;
            color: #3B82F6;
            margin-bottom: 48pt;
        }

        .cover-info {
            font-size: 14pt;
            color: #666;
            margin-top: 24pt;
        }

        blockquote {
            border-left: 4pt solid #3B82F6;
            padding-left: 12pt;
            margin: 16pt 0;
            color: #555;
            font-style: italic;
        }

        strong {
            font-weight: 600;
            color: #000;
        }

        .page-break {
            page-break-after: always;
        }

        .no-break {
            page-break-inside: avoid;
        }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>
    <div class="cover-page">
        <div class="cover-title">ClubOps</div>
        <div class="cover-subtitle">Operations Manual</div>
        <div class="cover-info">
            <p>Premium Gentlemen's Club Management Platform</p>
            <p>Version 2.0 | ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            <p style="margin-top: 48pt;">
                <strong>Live Application:</strong> https://clubops-saas-frontend.vercel.app<br>
                <strong>Demo Login:</strong> admin@clubops.com / password
            </p>
        </div>
    </div>

    <div id="content"></div>

    <script>
        // Configure marked options
        marked.setOptions({
            breaks: true,
            gfm: true
        });

        // Convert markdown to HTML
        const markdown = ${JSON.stringify(markdownContent)};
        const html = marked.parse(markdown);

        // Fix image paths to be absolute
        const fixedHtml = html.replace(
            /src="screenshots\\//g,
            'src="file:///${SCREENSHOT_DIR.replace(/\\/g, '/')}/'
        ).replace(
            /src="screenshots\\/mobile\\//g,
            'src="file:///${path.join(SCREENSHOT_DIR, 'mobile').replace(/\\/g, '/')}/'
        );

        document.getElementById('content').innerHTML = fixedHtml;
    </script>
</body>
</html>
`;

async function generatePDF() {
    console.log('🚀 Starting ClubOps Operations Manual PDF generation...');
    console.log(`📁 Manual source: ${MANUAL_PATH}`);
    console.log(`📄 Output file: ${OUTPUT_PATH}`);

    const browser = await chromium.launch({
        headless: true
    });

    try {
        const context = await browser.newContext();
        const page = await context.newPage();

        // Set the HTML content
        console.log('📝 Rendering HTML content...');
        await page.setContent(htmlContent, {
            waitUntil: 'networkidle'
        });

        // Wait for images to load
        await page.waitForTimeout(2000);

        // Generate PDF
        console.log('🔨 Generating PDF document...');
        await page.pdf({
            path: OUTPUT_PATH,
            format: 'Letter',
            margin: {
                top: '0.75in',
                right: '0.75in',
                bottom: '0.75in',
                left: '0.75in'
            },
            printBackground: true,
            preferCSSPageSize: true
        });

        // Get file size
        const stats = fs.statSync(OUTPUT_PATH);
        const fileSizeKB = stats.size / 1024;
        const fileSizeMB = fileSizeKB / 1024;

        console.log('\n✅ PDF generated successfully!');
        console.log(`📄 File: ${OUTPUT_PATH}`);
        console.log(`📊 Size: ${fileSizeKB.toFixed(1)} KB (${fileSizeMB.toFixed(2)} MB)`);
        console.log(`📅 Generated: ${new Date().toLocaleString()}`);

    } catch (error) {
        console.error('\n❌ Error generating PDF:', error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

// Run the generator
generatePDF()
    .then(() => {
        console.log('\n🎉 PDF generation complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 PDF generation failed:', error);
        process.exit(1);
    });
