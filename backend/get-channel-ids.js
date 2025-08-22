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

async function getChannelIds() {
  console.log('🔍 Getting channel IDs via Slack API...\n');
  
  try {
    // Get all public channels
    const publicResult = await botClient.conversations.list({
      types: 'public_channel',
      exclude_archived: true,
      limit: 1000
    });

    // Get all private channels
    const privateResult = await userClient.conversations.list({
      types: 'private_channel',
      exclude_archived: true,
      limit: 1000
    });

    const allChannels = [
      ...(publicResult.channels || []),
      ...(privateResult.channels || [])
    ];

    console.log(`📊 Found ${allChannels.length} total channels\n`);

    // Search for exact matches
    console.log('🎯 CHANNEL IDS FOUND:');
    const foundChannels = [];
    
    for (const target of targetChannels) {
      const match = allChannels.find(channel => 
        channel.name.toLowerCase() === target.toLowerCase()
      );
      
      if (match) {
        foundChannels.push(match);
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

    // Summary and code output
    console.log('\n📈 SUMMARY:');
    console.log(`Total channels found: ${allChannels.length}`);
    console.log(`Exact matches: ${foundChannels.length}/${targetChannels.length}`);
    
    if (foundChannels.length > 0) {
      console.log('\n✅ CHANNEL IDS TO USE IN CODE:');
      console.log('const monitoredChannelIds: string[] = [');
      foundChannels.forEach(match => {
        console.log(`  '${match.id}', // ${match.name}`);
      });
      console.log('];');
    }

    // Also try to get channels by searching
    console.log('\n🔍 TRYING SEARCH API...');
    for (const target of targetChannels) {
      try {
        const searchResult = await userClient.search.messages({
          query: `in:${target}`,
          count: 1
        });
        
        if (searchResult.messages && searchResult.messages.total > 0) {
          console.log(`✅ Search found messages in: ${target}`);
        } else {
          console.log(`❌ Search found no messages in: ${target}`);
        }
      } catch (searchError) {
        console.log(`❌ Search failed for ${target}: ${searchError.message}`);
      }
    }

  } catch (error) {
    console.error('Error getting channel IDs:', error);
  }
}

getChannelIds();
