import puppeteer from 'puppeteer';
import EmbedHolder from '../model/embed.js';
import fs from 'fs/promises';

async function getTweetData(url) {
    let browser;
    try {
        browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setUserAgent(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36"
        );

        let mediaUrls = [];
        let textContent = '';
        let navigationPromise;

        // Intercept network requests
        await page.setRequestInterception(true);
        page.on('request', async (request) => {
            if (request.isInterceptResolutionHandled()) return;
            if (request.url().includes('client-event.json')) {
                request.abort();
            } else {
                request.continue();
            }
        });

        page.on("response", async (response) => {
            const request = response.request();
            if (request.url().includes('TweetResultByRestId')) {
                try {
                    const json = await response.json();
                    
                    // Save JSON to file
                    await fs.writeFile('tweet_data.json', JSON.stringify(json, null, 2));
                    console.log('Tweet data saved to tweet_data.json');

                    const tweetData = json.data.tweetResult.result.legacy;
                    textContent = tweetData.full_text.replace(/(https?:\/\/[^\s]+)/g, '<$1>');
                    
                    const media = tweetData.extended_entities?.media;
                    if (media && media.length > 0) {
                        mediaUrls = [];
                        media.forEach(item => {
                            if (item.type === 'photo') {
                                mediaUrls.push(item.media_url_https);
                            } else if (item.type === 'video') {
                                const variants = item.video_info.variants;
                                const mp4Variants = variants.filter(v => v.content_type === 'video/mp4');
                                if (mp4Variants.length > 0) {
                                    const highestBitrateVariant = mp4Variants.reduce((prev, current) => 
                                        (prev.bitrate > current.bitrate) ? prev : current
                                    );
                                    mediaUrls.push(highestBitrateVariant.url);
                                }
                            }
                        });
                    }
                } catch (error) {
                    console.log("Unable to get response body:", error.message);
                }
            }
        });

        // Navigate to the URL that triggers the tweet data request
        navigationPromise = page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait for the specific request to be made
        await Promise.race([
            page.waitForRequest(
                (request) => request.url().includes('TweetResultByRestId'),
                { timeout: 30000 }
            ),
            navigationPromise
        ]);

        await navigationPromise;

        return new EmbedHolder(mediaUrls, textContent);
    } catch (error) {
        console.error('An error occurred:', error.message);
        return new EmbedHolder();
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

export { getTweetData };
