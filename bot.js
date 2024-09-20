import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { getTweetData } from './fetch/twitter.js';
import { createMessage } from './embedBuilder.js';
import EmbedHolder from './model/embed.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

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
    const embedHolder = new EmbedHolder([url], "saklfjhasdklfjhasfkljasdhf");
    
    try {
      const { content, files } = await createMessage(embedHolder);
      await interaction.reply({ content, files });
    } catch (error) {
      console.error('Error creating message:', error);
      await interaction.reply({ content: 'An error occurred while creating the message. Please try again.', ephemeral: true });
    }
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
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
