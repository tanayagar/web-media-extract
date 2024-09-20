import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { getTweetData } from './fetch/twitter.js';
import { createMessage } from './embedBuilder.js';
import EmbedHolder from './model/embed.js';
import { getInstagramData } from './fetch/instagram.js';
import fs from 'fs/promises';

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Add this constant near the top of your file
const ADMIN_ROLE_ID = '1211444666583613522';

// Define slash commands
const commands = [
  {
    name: 'hello',
    description: 'Replies with a hello message',
  },
  {
    name: 'embed',
    description: 'Creates an embed from a URL',
    options: [
      {
        name: 'url',
        type: 3, // STRING type
        description: 'The URL to embed',
        required: true,
      }
    ],
  },
  {
    name: 'twitter',
    description: 'Fetches data from a Twitter post',
    options: [
      {
        name: 'url',
        type: 3, // STRING type
        description: 'The Twitter post URL',
        required: true,
      }
    ],
  },
  {
    name: 'instagram',
    description: 'Fetches data from an Instagram post',
    options: [
      {
        name: 'url',
        type: 3, // STRING type
        description: 'The Instagram post URL',
        required: true,
      }
    ],
  },
  {
    name: 'update-query-hash',
    description: 'Updates the Instagram query hash',
    options: [
      {
        name: 'hash',
        type: 3, // STRING type
        description: 'The new query hash',
        required: true,
      }
    ],
  },
];

// Register slash commands
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Handle slash commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'hello') {
    await interaction.reply(`Hello, ${interaction.user.username}!`);
  } else if (commandName === 'embed') {
        const url = interaction.options.getString('url');
    await interaction.deferReply();

    try {
      const embedHolder = await getInstagramData(url);
      
      if (embedHolder.URLs.length > 0 || embedHolder.textContent) {
        const { content, files } = await createMessage(embedHolder);
        await interaction.editReply({ content, files });
      } else {
        await interaction.editReply('No media or text content found in the Instagram post.');
      }
    } catch (error) {
      console.error('Error fetching Instagram data:', error);
      await interaction.editReply({ content: 'An error occurred while fetching the Instagram data. Please try again.' });
    }
    // const url = interaction.options.getString('url');
    // const embedHolder = new EmbedHolder([url], "saklfjhasdklfjhasfkljasdhf");
    
    // try {
    //   const { content, files } = await createMessage(embedHolder);
    //   await interaction.reply({ content, files });
    // } catch (error) {
    //   console.error('Error creating message:', error);
    //   await interaction.reply({ content: 'An error occurred while creating the message. Please try again.', ephemeral: true });
    // }
  } else if (commandName === 'twitter') {
    const url = interaction.options.getString('url');
    await interaction.deferReply(); // Defer the reply as fetching tweet data might take some time

    try {
      const embedHolder = await getTweetData(url);
      
      if (embedHolder.URLs.length > 0 || embedHolder.textContent) {
        const { content, files } = await createMessage(embedHolder);
        await interaction.editReply({ content, files });
      } else {
        await interaction.editReply('No media or text content found in the tweet.');
      }
    } catch (error) {
      console.error('Error fetching tweet data:', error);
      await interaction.editReply({ content: 'An error occurred while fetching the tweet data. Please try again.' });
    }
  } else if (commandName === 'instagram') {
    const url = interaction.options.getString('url');
    await interaction.deferReply();

    try {
      const embedHolder = await getInstagramData(url);
      
      if (embedHolder.URLs.length > 0 || embedHolder.textContent) {
        const { content, files } = await createMessage(embedHolder);
        await interaction.editReply({ content, files });
      } else {
        await interaction.editReply('No media or text content found in the Instagram post.');
      }
    } catch (error) {
      console.error('Error fetching Instagram data:', error);
      await interaction.editReply({ content: 'An error occurred while fetching the Instagram data. Please try again.' });
    }
  } else if (commandName === 'update-query-hash') {
    // Check if the user has the admin role
    if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      return;
    }

    const newHash = interaction.options.getString('hash');
    
    try {
      // Read the current .env file
      let envContent = await fs.readFile('.env', 'utf-8');
      
      // Update or add the INSTAGRAM_QUERY_HASH
      if (envContent.includes('INSTAGRAM_QUERY_HASH=')) {
        envContent = envContent.replace(/INSTAGRAM_QUERY_HASH=.*/, `INSTAGRAM_QUERY_HASH=${newHash}`);
      } else {
        envContent += `\nINSTAGRAM_QUERY_HASH=${newHash}`;
      }
      
      // Write the updated content back to .env
      await fs.writeFile('.env', envContent);
      
      // Update the environment variable in the current process
      process.env.INSTAGRAM_QUERY_HASH = newHash;
      
      await interaction.reply({ content: 'Query hash updated successfully!', ephemeral: true });
    } catch (error) {
      console.error('Error updating query hash:', error);
      await interaction.reply({ content: 'An error occurred while updating the query hash. Please try again.', ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);

export default async function handler(request, response) {
    // This function will be called by Vercel, but we don't need to do anything here
    // as the bot is already running
    response.status(200).json({ status: 'Bot is running' });
  }