import { getInstagramData } from './instagram.js';

async function test() {
  try {
    const url = 'https://www.instagram.com/p/C_5wkzJIUGt/'; // Replace with a real Instagram post URL
    const result = await getInstagramData(url);
    console.log('Instagram data:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();