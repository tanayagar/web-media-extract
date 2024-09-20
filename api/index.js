import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log('Bot is ready!');
});

// Add your bot logic here

client.login(process.env.DISCORD_TOKEN);

export default async function handler(request, response) {
  // This function will be called by Vercel, but we don't need to do anything here
  // as the bot is already running
  response.status(200).json({ status: 'Bot is running' });
}