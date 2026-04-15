/**
 * Import all ClubFlow markdown documents to Notion
 * Run this with: node import-all-notion-docs.js
 */

const fs = require('fs');
const path = require('path');

// Document mapping
const documents = [
  { pageId: "2dc9b13e-2dea-8106-ab4c-c36ef9140c96", filePath: "marketing/content/linkedin-article-ideas.md" },
  { pageId: "2dc9b13e-2dea-8110-a9bb-d7cbaa937e17", filePath: "docs/SECURITY_DASHBOARD_GUIDE.md" },
  { pageId: "2dc9b13e-2dea-8117-9c0b-c99b498b62c8", filePath: "documentation/ClubOps-UI-Documentation.md" },
  { pageId: "2dc9b13e-2dea-8119-bd32-e6f2709d3e03", filePath: "marketing/sales-materials/entertainer-import-template.md" },
  { pageId: "2dc9b13e-2dea-8120-86d5-eb6d46f18543", filePath: "marketing/sales-materials/demo-script.md" },
  { pageId: "2dc9b13e-2dea-8144-998e-d1a8f1fc225f", filePath: "marketing/tracking/lead-database-template.md" },
  { pageId: "2dc9b13e-2dea-8161-b974-d54f86b3c2bd", filePath: "docs/PATRON_COUNT_WEBHOOK_API.md" },
  { pageId: "2dc9b13e-2dea-8167-95ad-c978719fc37b", filePath: "docs/CSV_IMPORT_FEATURE_SPEC.md" },
  { pageId: "2dc9b13e-2dea-816e-8ba0-c33adb9ebf4e", filePath: "marketing/sales-materials/onboarding-decision-tree.md" },
  { pageId: "2dc9b13e-2dea-8171-a4a8-faf035e84eba", filePath: "marketing/QUICK-START-GUIDE.md" },
  { pageId: "2dc9b13e-2dea-817d-8b8a-cfee3128f822", filePath: "docs/CLUB_ONBOARDING.md" },
  { pageId: "2dc9b13e-2dea-818a-b745-c57cbb2053c8", filePath: "marketing/case-studies/case-study-template.md" },
  { pageId: "2dc9b13e-2dea-8192-9cc4-d8fe32ad1c26", filePath: "C:/Users/tonyt/.claude/plans/agile-enchanting-turtle.md" },
  { pageId: "2dc9b13e-2dea-819b-877f-ecb94930f1a8", filePath: "marketing/sales-materials/fast-onboarding-process.md" },
  { pageId: "2dc9b13e-2dea-81a5-be9d-f0022bb5ed7c", filePath: "docs/CUSTOMER_ONBOARDING_QUESTIONNAIRE.md" },
  { pageId: "2dc9b13e-2dea-81ab-a21b-dbb322898e90", filePath: "docs/CUSTOMER_ONBOARDING_CHECKLIST.md" },
  { pageId: "2dc9b13e-2dea-81ad-9091-ee34da80e412", filePath: "marketing/LEAD-GENERATION-RESOURCES.md" },
  { pageId: "2dc9b13e-2dea-81ad-9598-f3e78085ce21", filePath: "documentation/PRICING-STRATEGY.md" },
  { pageId: "2dc9b13e-2dea-81bb-bdd6-f343f445714c", filePath: "marketing/email-templates/", skip: true },
  { pageId: "2dc9b13e-2dea-81ea-aa54-ff0da174375c", filePath: "README.md" },
  { pageId: "2dc9b13e-2dea-81ef-87a3-cbf292c23361", filePath: "docs/ANOMALY_DETECTION_TECHNICAL.md" }
];

/**
 * Convert markdown to Notion blocks
 */
function markdownToNotionBlocks(content) {
  const lines = content.split('\n');
  const blocks = [];

  for (let line of lines) {
    // Skip merge conflict markers
    if (line.match(/^(<{7}|={7}|>{7})/)) continue;

    // Skip empty lines
    if (!line.trim()) continue;

    // Headings
    if (line.startsWith('# ')) {
      blocks.push({
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: line.substring(2) } }]
        }
      });
    }
    else if (line.match(/^#{2,6}\s/)) {
      blocks.push({
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: line.replace(/^#+\s/, '') } }]
        }
      });
    }
    // Bullet points
    else if (line.match(/^[\s]*[-*+]\s/)) {
      blocks.push({
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: line.replace(/^[\s]*[-*+]\s/, '') } }]
        }
      });
    }
    // Regular paragraphs
    else if (line.trim()) {
      blocks.push({
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: line } }]
        }
      });
    }

    // Notion has a 100 block limit per request
    if (blocks.length >= 90) break;
  }

  return blocks;
}

// Generate the MCP commands to run
console.log('=== NOTION IMPORT COMMANDS ===\n');
console.log('Copy and paste these commands into Claude:\n');

documents.forEach((doc, index) => {
  if (doc.skip) {
    console.log(`\n${index + 1}. SKIP: ${doc.filePath} (directory, not file)\n`);
    return;
  }

  const absolutePath = doc.filePath.startsWith('C:')
    ? doc.filePath
    : path.join('c:\\Users\\tonyt\\clubflow', doc.filePath);

  console.log(`${index + 1}. For ${doc.filePath}:`);
  console.log(`   Page ID: ${doc.pageId}`);
  console.log(`   File: ${absolutePath}`);
  console.log('');
});

console.log('\n=== SUMMARY ===');
console.log(`Total documents: ${documents.length}`);
console.log(`To import: ${documents.filter(d => !d.skip).length}`);
console.log(`To skip: ${documents.filter(d => d.skip).length}`);
