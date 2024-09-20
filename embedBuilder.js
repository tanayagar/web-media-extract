import { AttachmentBuilder } from 'discord.js';
import { fetchMediaUrls } from './fetch/test.js';
import axios from 'axios';

async function createMessage(embedHolder) {
  let content = '';
  const attachments = [];

  // Include text if present, in a quote block
  if (embedHolder.textContent) {
    content = `> ${embedHolder.textContent.replace(/\n/g, '\n> ')}`;
  }

  // Fetch media for the first URL
  if (embedHolder.URLs.length > 0) {
    const url = embedHolder.URLs[0];
    const mediaUrls = await fetchMediaUrls(url);

    // Always include an image (first media URL)
    if (mediaUrls.length > 0) {
      const mediaUrl = mediaUrls[0];
      const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');
      const fileName = `media${getFileExtension(mediaUrl)}`;
      const attachment = new AttachmentBuilder(buffer, { name: fileName });
      attachments.push(attachment);
    }
  }

  return { content, files: attachments };
}

function getFileExtension(url) {
  const match = url.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/);
  return match ? `.${match[1]}` : '';
}

export { createMessage };
