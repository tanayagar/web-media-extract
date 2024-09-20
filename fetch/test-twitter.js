import { getTweetData } from './twitter.js';

async function test() {
  try {
    const url = 'https://x.com/hikeiiz/status/1836634863916466249'; // Replace with a real tweet URL
    const result = await getTweetData(url);
    console.log('Tweet data URL:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();