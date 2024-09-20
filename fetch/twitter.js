import puppeteer from 'puppeteer';

async function getTweetData(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36"
    )

    let tweetResultData = null;

    // Intercept network requests
    await page.setRequestInterception(true);
    page.on('request', async (request) => {
        if (request.isInterceptResolutionHandled()) return;
        if (request.url().includes('client-event.json')) {
            request.abort();
        } else if (request.url().includes('TweetResultByRestId')) {
            console.log("graphql query found")
            request.continue();
        } else {
            request.continue();
        }
    });

    page.on("response", async (response) => {
        const request = response.request();
        if (request.url().includes('TweetResultByRestId')) {
            try {
                const json = await response.json();
                tweetResultData = json;
                const media = tweetResultData.data.tweetResult.result.legacy.entities.media;
                if (media && media.length > 0) {
                    media.forEach(item => {
                        console.log(item.media_url_https);
                    });
                }
            } catch (error) {
                console.log("Unable to get response body:", error.message);
            }
        }
    });

    // Navigate to the URL that triggers the tweet data request
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait for the specific request to be made
    await page.waitForRequest(
        (request) => request.url().includes('TweetResultByRestId'),
        { timeout: 30000 }
    );

    await browser.close();
    if (tweetResultData != nil) {
        const tweetData = tweetResultData;
        console.log(tweetData)
        await browser.close();
        return tweetData;
    } else {
        await browser.close();
        throw new Error('Tweet data request not found');
    }
}

export { getTweetData };
