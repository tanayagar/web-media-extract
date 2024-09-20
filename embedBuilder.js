import { AttachmentBuilder } from 'discord.js';
import axios from 'axios';

async function createMessage(embedHolder) {
  let content = '';
  const attachments = [];

  // Include text if present, in a quote block
  if (embedHolder.textContent) {
    content = `> ${embedHolder.textContent.replace(/\n/g, '\n> ')}`;
  }

  // Include all images
  if (embedHolder.URLs.length > 0) {
    for (const mediaUrl of embedHolder.URLs) {
      try {
        const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        const fileName = `media${getFileExtension(mediaUrl)}`;
        const attachment = new AttachmentBuilder(buffer, { name: fileName });
        attachments.push(attachment);
      } catch (error) {
        console.error(`Error fetching image ${mediaUrl}:`, error);
      }
    }

  }

  return { content, files: attachments };
}

function getFileExtension(url) {
  const match = url.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/);
  return match ? `.${match[1]}` : '';
}

export { createMessage };
