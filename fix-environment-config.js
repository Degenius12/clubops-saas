#!/usr/bin/env node

/**
 * ClubOps SaaS - Environment Configuration Fix Script
 * Updates all environment configurations to use correct production URLs
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

// Configuration
const config = {
  frontendUrl: 'https://frontend-o9bhynpim-tony-telemacques-projects.vercel.app',
  backendUrl: 'https://clubops-backend-qgwp5goeh-tony-telemacques-projects.vercel.app',
  databaseUrl: 'postgresql://neondb_owner:npg_a2IrCUykWc0p@ep-rough-star-adk34eay-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  jwtSecret: 'clubops-super-secure-jwt-key-2024-make-this-very-long-and-random-please'
};

function updateFile(filePath, updateFunction) {
  try {
    if (!fs.existsSync(filePath)) {
      log(`⚠️  File not found: ${filePath}`, colors.yellow);
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const updatedContent = updateFunction(content);
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      log(`✅ Updated: ${filePath}`, colors.green);
      return true;
    } else {
      log(`ℹ️  No changes needed: ${filePath}`, colors.blue);
      return true;
    }
  } catch (error) {
    log(`❌ Error updating ${filePath}: ${error.message}`, colors.red);
    return false;
  }
}

function updateBackendVercelJson(content) {
  try {
    const config_obj = JSON.parse(content);
    
    // Update environment variables
    config_obj.env = {
      "NODE_ENV": "production",
      "CLIENT_URL": config.frontendUrl,
      "FRONTEND_URL": config.frontendUrl,
      "CORS_ORIGIN": config.frontendUrl,
      "JWT_SECRET": config.jwtSecret,
      "DATABASE_URL": config.databaseUrl
    };

    return JSON.stringify(config_obj, null, 2);
  } catch (error) {
    log(`Error parsing backend vercel.json: ${error.message}`, colors.red);
    return content;
  }
}

function updateFrontendConfig(content) {
  // Update any frontend configuration that might reference the backend URL
  return content
    .replace(/https:\/\/clubops-backend-[a-z0-9\-]+\.vercel\.app/g, config.backendUrl)
    .replace(/https:\/\/.*\.vercel\.app\/api/g, `${config.backendUrl}/api`)
    .replace(/localhost:8000/g, config.backendUrl.replace('https://', '').replace('/api', ''));
}

function createEnvFiles() {
  // Create .env file for backend if it doesn't exist
  const backendEnvPath = path.join(__dirname, 'backend', '.env');
  const envContent = `
# ClubOps SaaS - Production Environment Variables
NODE_ENV=production
CLIENT_URL=${config.frontendUrl}
FRONTEND_URL=${config.frontendUrl}
CORS_ORIGIN=${config.frontendUrl}
JWT_SECRET=${config.jwtSecret}
DATABASE_URL=${config.databaseUrl}

# Additional configuration
PORT=8000
SESSION_SECRET=clubops-session-secret-key-2024
BCRYPT_ROUNDS=12

# Email configuration (optional)
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=

# Stripe configuration (when ready)
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
`.trim();

  try {
    fs.writeFileSync(backendEnvPath, envContent, 'utf8');
    log(`✅ Created: ${backendEnvPath}`, colors.green);
  } catch (error) {
    log(`❌ Error creating .env file: ${error.message}`, colors.red);
  }

  // Create .env.production for frontend
  const frontendEnvPath = path.join(__dirname, 'frontend', '.env.production');
  const frontendEnvContent = `
# ClubOps SaaS - Frontend Production Environment
VITE_API_URL=${config.backendUrl}
VITE_FRONTEND_URL=${config.frontendUrl}
VITE_NODE_ENV=production
`.trim();

  try {
    fs.writeFileSync(frontendEnvPath, frontendEnvContent, 'utf8');
    log(`✅ Created: ${frontendEnvPath}`, colors.green);
  } catch (error) {
    log(`❌ Error creating frontend .env.production: ${error.message}`, colors.red);
  }
}

async function main() {
  log(`${colors.bright}${colors.cyan}🔧 ClubOps SaaS - Environment Configuration Fix${colors.reset}`);
  log('================================================');
  
  log(`\n${colors.blue}Configuration to apply:${colors.reset}`);
  log(`Frontend URL: ${config.frontendUrl}`);
  log(`Backend URL:  ${config.backendUrl}`);
  log(`Database:     ${config.databaseUrl.split('@')[1].split('?')[0]}...`);
  
  let successCount = 0;
  let totalUpdates = 0;

  // Update backend vercel.json
  log(`\n${colors.yellow}Updating backend configuration...${colors.reset}`);
  totalUpdates++;
  if (updateFile(path.join(__dirname, 'backend', 'vercel.json'), updateBackendVercelJson)) {
    successCount++;
  }

  // Update any frontend configuration files
  log(`\n${colors.yellow}Checking frontend configuration...${colors.reset}`);
  const frontendConfigFiles = [
    'frontend/src/config.ts',
    'frontend/src/config.js',
    'frontend/src/utils/api.ts',
    'frontend/src/utils/api.js',
    'frontend/vite.config.ts',
    'frontend/vite.config.js'
  ];

  frontendConfigFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      totalUpdates++;
      if (updateFile(fullPath, updateFrontendConfig)) {
        successCount++;
      }
    }
  });

  // Create environment files
  log(`\n${colors.yellow}Creating environment files...${colors.reset}`);
  createEnvFiles();

  // Summary
  log(`\n${colors.bright}${colors.blue}CONFIGURATION UPDATE SUMMARY${colors.reset}`);
  log('=====================================');
  log(`Successful updates: ${successCount}/${totalUpdates}`);
  
  if (successCount === totalUpdates) {
    log(`\n${colors.bright}${colors.green}✅ All configurations updated successfully!${colors.reset}`);
    log(`\n${colors.cyan}Next steps:${colors.reset}`);
    log(`1. Commit these changes to Git`);
    log(`2. Push to trigger Vercel redeploy`);
    log(`3. Run the verification script: node deploy-verify-fix.js`);
    log(`4. Test the application end-to-end`);
  } else {
    log(`\n${colors.bright}${colors.yellow}⚠️  Some updates failed - check errors above${colors.reset}`);
  }

  // Generate git commands
  log(`\n${colors.cyan}Git commands to deploy changes:${colors.reset}`);
  log(`git add .`);
  log(`git commit -m "Fix: Update environment configuration for production deployment"`);
  log(`git push origin main`);
  
  log(`\n${colors.bright}${colors.green}🚀 Configuration fix complete!${colors.reset}`);
}

// Run the fix
main().catch(console.error);
