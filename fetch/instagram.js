import axios from 'axios';
import EmbedHolder from '../model/embed.js';
import fs from 'fs/promises';

const INSTAGRAM_API_BASE = 'https://www.instagram.com/graphql/query/';

async function login(username, password) {
    // Implement login logic here
    // This would involve making a POST request to Instagram's login endpoint
    // and storing the session cookies for future requests
}

async function getInstagramData(url) {
    try {
        const postId = url.match(/\/(p|reel)\/([^\/]+)/)?.[2];
        if (!postId) {
            throw new Error('Invalid Instagram URL');
        }

        const data = await getPostData(postId);

        // Extract media URLs
        let mediaUrls = [];
        if (data.is_video) {
            mediaUrls.push(data.video_url);
        } else if (data.edge_sidecar_to_children) {
            mediaUrls = data.edge_sidecar_to_children.edges.map(edge => 
                edge.node.is_video ? edge.node.video_url : edge.node.display_url
            );
        } else {
            mediaUrls.push(data.display_url);
        }

        // Extract text content (caption)
        const textContent = data.edge_media_to_caption?.edges[0]?.node.text || '';

        return new EmbedHolder(mediaUrls, textContent);
    } catch (error) {
        console.error('An error occurred:', error.message);
        return new EmbedHolder();
    }
}

async function getPostData(postId) {
    const query_hash = process.env.INSTAGRAM_QUERY_HASH; // Use environment variable
    if (!query_hash) {
        throw new Error('INSTAGRAM_QUERY_HASH environment variable is not set');
    }

    const variables = JSON.stringify({
        shortcode: postId,
    });

    const response = await axios.get(`${INSTAGRAM_API_BASE}?query_hash=${query_hash}&variables=${variables}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
        }
    });

    return response.data.data.shortcode_media;
}

export { getInstagramData, login };
