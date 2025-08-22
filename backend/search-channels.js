const { WebClient } = require('@slack/web-api');
require('dotenv').config();

const botToken = process.env.SLACK_BOT_TOKEN;
const userToken = process.env.SLACK_USER_TOKEN;

const botClient = new WebClient(botToken);
const userClient = new WebClient(userToken);

// The channels we're looking for
const targetChannels = [
  'product',
  'core-engineering',
  'thoughtful-access-voice-ai',
  'nox-health',
  'orthofi',
  'thoughtful-epic',
  'portal-aggregator',
  'hitl-squad',
  'thoughthub',
  'dd-worfklow-engine-partnership',
  'reporting-sdk',
  'pathfinder-toolforge-alpha'
];

async function searchChannels() {
  console.log('🔍 Searching for channels...\n');
  
  try {
    // Get all public channels
    const publicResult = await botClient.conversations.list({
      types: 'public_channel',
      exclude_archived: true,
    });

    // Get all private channels
    const privateResult = await userClient.conversations.list({
      types: 'private_channel',
      exclude_archived: true,
    });

    const allChannels = [
      ...(publicResult.channels || []),
      ...(privateResult.channels || [])
    ];

    console.log(`📊 Found ${allChannels.length} total channels\n`);

    // Search for exact matches
    console.log('🎯 EXACT MATCHES:');
    const exactMatches = [];
    for (const target of targetChannels) {
      const match = allChannels.find(channel => 
        channel.name.toLowerCase() === target.toLowerCase()
      );
      if (match) {
        exactMatches.push(match);
        console.log(`✅ ${target} -> ${match.name} (ID: ${match.id})`);
      } else {
        console.log(`❌ ${target} -> NOT FOUND`);
      }
    }

    // Search for partial matches
    console.log('\n🔍 PARTIAL MATCHES:');
    for (const target of targetChannels) {
      const partialMatches = allChannels.filter(channel => 
        channel.name.toLowerCase().includes(target.toLowerCase()) ||
        target.toLowerCase().includes(channel.name.toLowerCase())
      );
      
      if (partialMatches.length > 0) {
        console.log(`\n${target} partial matches:`);
        partialMatches.forEach(match => {
          console.log(`  📝 ${match.name} (ID: ${match.id})`);
        });
      }
    }

    // Show all available channels for reference
    console.log('\n📋 ALL AVAILABLE CHANNELS:');
    allChannels.forEach(channel => {
      console.log(`  ${channel.name} (ID: ${channel.id})`);
    });

    // Summary
    console.log('\n📈 SUMMARY:');
    console.log(`Total channels found: ${allChannels.length}`);
    console.log(`Exact matches: ${exactMatches.length}/${targetChannels.length}`);
    
    if (exactMatches.length > 0) {
      console.log('\n✅ CHANNELS TO USE:');
      exactMatches.forEach(match => {
        console.log(`'${match.name}',`);
      });
    }

  } catch (error) {
    console.error('Error searching channels:', error);
  }
}

searchChannels();
