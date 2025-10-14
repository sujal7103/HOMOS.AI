#!/usr/bin/env node

/**
 * Environment Validation Script
 * Run this to check if all required environment variables are set
 * Usage: node scripts/validate-env.js
 */

// Load environment variables from .env file
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envLocalPath = path.join(__dirname, '..', '.env.local');

// Try to load .env.local first, then .env
const envFile = fs.existsSync(envLocalPath) ? envLocalPath : 
                fs.existsSync(envPath) ? envPath : null;

if (envFile) {
  const envContent = fs.readFileSync(envFile, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
  console.log(`📁 Loaded environment from: ${path.basename(envFile)}\n`);
} else {
  console.log('⚠️  No .env or .env.local file found\n');
}

const requiredEnvVars = [
  'E2B_API_KEY',
  'OPENAI_API_KEY',
  'INNGEST_EVENT_KEY',
  'DATABASE_URL',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
];

const optionalEnvVars = [
  'E2B_TEMPLATE_ID',
  'INNGEST_SIGNING_KEY',
  'NEXT_PUBLIC_APP_URL',
];

console.log('🔍 Validating environment variables...\n');

let hasErrors = false;
let hasWarnings = false;

// Check required variables
console.log('✅ Required Variables:');
requiredEnvVars.forEach((envVar) => {
  const value = process.env[envVar];
  if (!value) {
    console.log(`   ❌ ${envVar} - NOT SET`);
    hasErrors = true;
  } else if (value.includes('your_') || value.includes('placeholder')) {
    console.log(`   ⚠️  ${envVar} - SET (but looks like a placeholder)`);
    hasWarnings = true;
  } else {
    const maskedValue = value.substring(0, 10) + '...' + value.substring(value.length - 4);
    console.log(`   ✅ ${envVar} - ${maskedValue}`);
  }
});

console.log('\n📋 Optional Variables:');
optionalEnvVars.forEach((envVar) => {
  const value = process.env[envVar];
  if (!value) {
    console.log(`   ⚪ ${envVar} - Not set (using defaults)`);
  } else {
    const maskedValue = value.length > 20 
      ? value.substring(0, 10) + '...' + value.substring(value.length - 4)
      : value;
    console.log(`   ✅ ${envVar} - ${maskedValue}`);
  }
});

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('\n❌ VALIDATION FAILED');
  console.log('Please add the missing environment variables to your .env.local file');
  console.log('\nExample .env.local:');
  console.log(`
E2B_API_KEY=e2b_e80646958f065e314aa6da3d317e5ff4966d8e57
OPENAI_API_KEY=your_openai_or_github_token_here
INNGEST_EVENT_KEY=your_inngest_event_key
DATABASE_URL=your_database_url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
  `);
  process.exit(1);
} else if (hasWarnings) {
  console.log('\n⚠️  VALIDATION PASSED WITH WARNINGS');
  console.log('Some environment variables look like placeholders.');
  console.log('Make sure to replace them with actual values.');
  process.exit(0);
} else {
  console.log('\n✅ ALL ENVIRONMENT VARIABLES ARE SET!');
  console.log('You can now run the agent.');
  process.exit(0);
}
