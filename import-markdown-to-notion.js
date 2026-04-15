/**
 * Import Markdown to Notion
 * Converts markdown files to Notion blocks
 */

const fs = require('fs');
const path = require('path');

// Document mapping from query results
const documents = [
  {
    pageId: "2dc9b13e-2dea-8106-ab4c-c36ef9140c96",
    filePath: "marketing/content/linkedin-article-ideas.md",
    name: "LinkedIn Article Ideas"
  },
  {
    pageId: "2dc9b13e-2dea-8110-a9bb-d7cbaa937e17",
    filePath: "docs/SECURITY_DASHBOARD_GUIDE.md",
    name: "Security Dashboard Guide"
  },
  {
    pageId: "2dc9b13e-2dea-8117-9c0b-c99b498b62c8",
    filePath: "documentation/ClubOps-UI-Documentation.md",
    name: "ClubFlow UI Documentation"
  },
  {
    pageId: "2dc9b13e-2dea-8119-bd32-e6f2709d3e03",
    filePath: "marketing/sales-materials/entertainer-import-template.md",
    name: "Entertainer Import Template"
  },
  {
    pageId: "2dc9b13e-2dea-8120-86d5-eb6d46f18543",
    filePath: "marketing/sales-materials/demo-script.md",
    name: "Demo Script"
  },
  {
    pageId: "2dc9b13e-2dea-8144-998e-d1a8f1fc225f",
    filePath: "marketing/tracking/lead-database-template.md",
    name: "Lead Database Template"
  },
  {
    pageId: "2dc9b13e-2dea-8161-b974-d54f86b3c2bd",
    filePath: "docs/PATRON_COUNT_WEBHOOK_API.md",
    name: "Patron Count Webhook API"
  },
  {
    pageId: "2dc9b13e-2dea-8167-95ad-c978719fc37b",
    filePath: "docs/CSV_IMPORT_FEATURE_SPEC.md",
    name: "CSV Import Feature Spec"
  },
  {
    pageId: "2dc9b13e-2dea-816e-8ba0-c33adb9ebf4e",
    filePath: "marketing/sales-materials/onboarding-decision-tree.md",
    name: "Onboarding Decision Tree"
  },
  {
    pageId: "2dc9b13e-2dea-8171-a4a8-faf035e84eba",
    filePath: "marketing/QUICK-START-GUIDE.md",
    name: "Quick Start Guide"
  },
  {
    pageId: "2dc9b13e-2dea-817d-8b8a-cfee3128f822",
    filePath: "docs/CLUB_ONBOARDING.md",
    name: "Club Onboarding API"
  },
  {
    pageId: "2dc9b13e-2dea-818a-b745-c57cbb2053c8",
    filePath: "marketing/case-studies/case-study-template.md",
    name: "Case Study Template"
  },
  {
    pageId: "2dc9b13e-2dea-8192-9cc4-d8fe32ad1c26",
    filePath: "C:/Users/tonyt/.claude/plans/agile-enchanting-turtle.md",
    name: "Marketing Plan"
  },
  {
    pageId: "2dc9b13e-2dea-819b-877f-ecb94930f1a8",
    filePath: "marketing/sales-materials/fast-onboarding-process.md",
    name: "Fast Onboarding Process"
  },
  {
    pageId: "2dc9b13e-2dea-81a5-be9d-f0022bb5ed7c",
    filePath: "docs/CUSTOMER_ONBOARDING_QUESTIONNAIRE.md",
    name: "Customer Onboarding Questionnaire"
  },
  {
    pageId: "2dc9b13e-2dea-81ab-a21b-dbb322898e90",
    filePath: "docs/CUSTOMER_ONBOARDING_CHECKLIST.md",
    name: "Customer Onboarding Checklist"
  },
  {
    pageId: "2dc9b13e-2dea-81ad-9091-ee34da80e412",
    filePath: "marketing/LEAD-GENERATION-RESOURCES.md",
    name: "Lead Generation Resources"
  },
  {
    pageId: "2dc9b13e-2dea-81ad-9598-f3e78085ce21",
    filePath: "documentation/PRICING-STRATEGY.md",
    name: "Pricing Strategy"
  },
  {
    pageId: "2dc9b13e-2dea-81bb-bdd6-f343f445714c",
    filePath: "marketing/email-templates/",
    name: "Email Templates",
    skip: true
  },
  {
    pageId: "2dc9b13e-2dea-81ea-aa54-ff0da174375c",
    filePath: "README.md",
    name: "README"
  },
  {
    pageId: "2dc9b13e-2dea-81ef-87a3-cbf292c23361",
    filePath: "docs/ANOMALY_DETECTION_TECHNICAL.md",
    name: "Anomaly Detection Technical"
  }
];

/**
 * Convert markdown content to Notion blocks
 * This is a simplified converter focusing on common markdown elements
 */
function convertMarkdownToNotionBlocks(content) {
  const lines = content.split('\n');
  const blocks = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip git merge conflict markers
    if (line.startsWith('<<<<<<<') || line.startsWith('=======') || line.startsWith('>>>>>>>')) {
      continue;
    }

    // Skip empty lines
    if (!line.trim()) {
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      blocks.push({
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            type: 'text',
            text: { content: line.substring(2) }
          }]
        }
      });
    }
    else if (line.startsWith('## ') || line.startsWith('### ') || line.startsWith('#### ')) {
      blocks.push({
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            type: 'text',
            text: { content: line.replace(/^#+\s/, '') }
          }]
        }
      });
    }
    // Bullet points
    else if (line.match(/^[\s]*[-*]\s/)) {
      blocks.push({
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{
            type: 'text',
            text: { content: line.replace(/^[\s]*[-*]\s/, '') }
          }]
        }
      });
    }
    // Regular paragraphs
    else {
      blocks.push({
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            type: 'text',
            text: { content: line }
          }]
        }
      });
    }

    // Limit to 100 blocks per batch
    if (blocks.length >= 90) {
      break;
    }
  }

  return blocks;
}

// Export for use
module.exports = { documents, convertMarkdownToNotionBlocks };

console.log('Markdown to Notion converter ready');
console.log(`Total documents: ${documents.length}`);
console.log(`Documents to import: ${documents.filter(d => !d.skip).length}`);
