const { WebClient } = require('@slack/web-api');
require('dotenv').config();

const botToken = process.env.SLACK_BOT_TOKEN;
const userToken = process.env.SLACK_USER_TOKEN;

const botClient = new WebClient(botToken);
const userClient = new WebClient(userToken);

// Known channel IDs
const knownChannels = [
  { name: 'thoughtful-access-voice-ai', id: 'C094CGAPB4K' },
  // Add more as you provide them
];

async function checkSpecificChannels() {
  console.log('🔍 Checking specific channel IDs...\n');
  
  for (const channel of knownChannels) {
    try {
      console.log(`Checking ${channel.name} (${channel.id})...`);
      
      // Try with bot token first
      try {
        const botResult = await botClient.conversations.info({ channel: channel.id });
        console.log(`✅ Bot token access: ${botResult.channel.name} (${botResult.channel.id})`);
      } catch (botError) {
        console.log(`❌ Bot token failed: ${botError.message}`);
      }
      
      // Try with user token
      try {
        const userResult = await userClient.conversations.info({ channel: channel.id });
        console.log(`✅ User token access: ${userResult.channel.name} (${userResult.channel.id})`);
      } catch (userError) {
        console.log(`❌ User token failed: ${userError.message}`);
      }
      
      console.log('---');
      
    } catch (error) {
      console.error(`Error checking ${channel.name}:`, error.message);
    }
  }
}

checkSpecificChannels();
