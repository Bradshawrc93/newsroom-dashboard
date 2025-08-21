#!/usr/bin/env node

// Test script for squad configuration system
const fs = require('fs');
const path = require('path');

// Read the squad configuration
const squadConfigPath = path.join(__dirname, '../backend/src/config/squads.ts');
const squadConfigContent = fs.readFileSync(squadConfigPath, 'utf8');

console.log('🧪 Testing Squad Configuration System\n');

// Extract squad configurations from the TypeScript file
const squadMatches = squadConfigContent.match(/id:\s*'([^']+)',\s*name:\s*'([^']+)'/g);
const channelMatches = squadConfigContent.match(/name:\s*'([^']+)',\s*squad:\s*'([^']+)'/g);
const personMatches = squadConfigContent.match(/name:\s*'([^']+)',\s*squad:\s*'([^']+)'/g);

console.log('📊 Squad Configuration Summary:');
console.log('================================');

// Count squads
const squads = new Set();
squadMatches?.forEach(match => {
  const idMatch = match.match(/id:\s*'([^']+)'/);
  const nameMatch = match.match(/name:\s*'([^']+)'/);
  if (idMatch && nameMatch) {
    squads.add(`${nameMatch[1]} (${idMatch[1]})`);
  }
});

console.log(`\n🏢 Total Squads: ${squads.size}`);
squads.forEach(squad => console.log(`  - ${squad}`));

// Count channels
const channels = new Set();
channelMatches?.forEach(match => {
  const nameMatch = match.match(/name:\s*'([^']+)'/);
  const squadMatch = match.match(/squad:\s*'([^']+)'/);
  if (nameMatch && squadMatch) {
    channels.add(`${nameMatch[1]} (${squadMatch[1]})`);
  }
});

console.log(`\n📺 Total Channels: ${channels.size}`);
channels.forEach(channel => console.log(`  - ${channel}`));

// Count people
const people = new Set();
personMatches?.forEach(match => {
  const nameMatch = match.match(/name:\s*'([^']+)'/);
  const squadMatch = match.match(/squad:\s*'([^']+)'/);
  if (nameMatch && squadMatch) {
    people.add(`${nameMatch[1]} (${squadMatch[1]})`);
  }
});

console.log(`\n👥 Total People: ${people.size}`);
people.forEach(person => console.log(`  - ${person}`));

// Check for hierarchy structure
const hasHierarchy = squadConfigContent.includes('parentSquad') || squadConfigContent.includes('subsquads');
console.log(`\n🏗️  Hierarchy Support: ${hasHierarchy ? '✅ Yes' : '❌ No'}`);

// Check for squad types
const squadTypes = {
  'voice': squadConfigContent.includes('voice'),
  'core-rcm': squadConfigContent.includes('core-rcm'),
  'epic': squadConfigContent.includes('epic'),
  'portal-agg': squadConfigContent.includes('portal-agg'),
  'hitl': squadConfigContent.includes('hitl'),
  'customer-facing': squadConfigContent.includes('customer-facing'),
  'thoughthub': squadConfigContent.includes('thoughthub'),
  'developer-efficiency': squadConfigContent.includes('developer-efficiency'),
  'data': squadConfigContent.includes('data'),
  'medical-coding': squadConfigContent.includes('medical-coding'),
  'deep-research': squadConfigContent.includes('deep-research')
};

console.log('\n🎯 Squad Types Found:');
Object.entries(squadTypes).forEach(([squad, found]) => {
  console.log(`  ${found ? '✅' : '❌'} ${squad}`);
});

console.log('\n✅ Squad configuration test completed!');
console.log('\nTo test the API endpoints:');
console.log('1. Start the backend server: npm run dev:backend');
console.log('2. Test the squad endpoints:');
console.log('   - GET /api/squads/hierarchy');
console.log('   - GET /api/squads/stats');
console.log('   - GET /api/squads');
