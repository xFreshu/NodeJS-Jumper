const { App } = require('@slack/bolt');
const { chromium } = require('playwright');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
require('dotenv').config();

let intervalId = null;
let intervalMinutes = 15;

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true
});

app.event('message', async ({ event, client }) => {
    try {
        const text = event.text?.trim().toLowerCase();
        const channel = event.channel;

        if (!text) return;

        console.log(`💬 Wiadomość od ${event.user}: ${text}`);

        const startMatch = text.match(/^box\s*(\d+)?$/);
        if (startMatch) {
            const requestedMinutes = parseInt(startMatch[1]);
            intervalMinutes = isNaN(requestedMinutes) ? 15 : requestedMinutes;

            if (intervalId) {
                await client.chat.postMessage({
                    channel: channel,
                    text: `🔄 Już działa! Weryfikuję co ${intervalMinutes} minut.`
                });
                return;
            }

            intervalId = setInterval(() => checkPlanowka(channel, client), intervalMinutes * 60 * 1000);
            await client.chat.postMessage({
                channel: channel,
                text: `✅ Startuję weryfikację co ${intervalMinutes} minut.`
            });
            checkPlanowka(channel, client); // uruchom od razu
            return;
        }

        if (text === 'stop') {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
                await client.chat.postMessage({
                    channel: channel,
                    text: '🛑 Baczność kurwa, co jest.'
                });
            } else {
                await client.chat.postMessage({
                    channel: channel,
                    text: 'ℹ️ Weryfikacja nie była uruchomiona.'
                });
            }
        }

    } catch (err) {
        console.error('❗️ Błąd w event handler:', err);
    }
});

async function checkPlanowka(channel, client) {
    console.log('🔍 Sprawdzanie planówki...');

    try {
        if (!fs.existsSync('dumps')) fs.mkdirSync('dumps', { recursive: true });
        if (!fs.existsSync('assets')) fs.mkdirSync('assets', { recursive: true });

        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        await page.goto('https://manifest.plstrefa.pl/', { waitUntil: 'domcontentloaded' });
        await page.fill('input[name="user_name"]', process.env.LOGIN);
        await page.fill('input[name="user_password"]', process.env.PASSWORD);
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
            page.click('text=Zaloguj')
        ]);
        await page.waitForTimeout(5000);
        await page.goto('https://manifest.plstrefa.pl/planowka', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        const planowkaHtml = await page.content();
        fs.writeFileSync(path.join('dumps', 'planowka.html'), planowkaHtml);

        const $ = cheerio.load(planowkaHtml);
        const znalezioneWyloty = [];

        $('p').each((i, p) => {
            const text = $(p).text();
            const match = text.match(/Wylot\s+(\d+)/i);
            if (match) {
                const nrWylotu = match[1];
                const parentDiv = $(p).closest('div');
                const table = parentDiv.nextAll('table').first();
                if (table.length) {
                    const id = `wylot${nrWylotu}`;
                    table.attr('id', id);
                    const tableText = table.text();
                    if (tableText.includes('RUSEK KAMIL')) {
                        znalezioneWyloty.push(id);
                    }
                }
            }
        });

        fs.writeFileSync(path.join('dumps', 'planowka-tagged.html'), $.html(), 'utf-8');

        if (znalezioneWyloty.length > 0) {
            console.log(`🎉 RUSEK KAMIL znaleziony w: ${znalezioneWyloty.join(', ')}`);

            const screenshotPath = 'assets/planowka-found.png';
            await page.screenshot({ path: screenshotPath, fullPage: true });

            const imageBuffer = fs.readFileSync(screenshotPath);
            const imgurResponse = await axios.post('https://api.imgur.com/3/image', imageBuffer, {
                headers: {
                    Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
                    'Content-Type': 'application/octet-stream'
                }
            });

            if (imgurResponse.data.success) {
                const imageUrl = imgurResponse.data.data.link;
                await client.chat.postMessage({
                    channel: channel,
                    text: `🚨 RUSEK KAMIL znaleziony w: ${znalezioneWyloty.join(', ')}\n${imageUrl}`
                });
            } else {
                await client.chat.postMessage({
                    channel: channel,
                    text: `❌ Upload na Imgur nie powiódł się.`
                });
            }
        } else {
            console.log('❌ RUSEK KAMIL nie znaleziony.');
            await client.chat.postMessage({
                channel: channel,
                text: `❌ RUSEK KAMIL nie znaleziony w żadnym wylocie.`
            });
        }

        await browser.close();
    } catch (err) {
        console.error('❗️ Błąd sprawdzania:', err);
        await client.chat.postMessage({
            channel: channel,
            text: `❗️ Błąd sprawdzania: ${err.message}`
        });
    }
}

(async () => {
    await app.start();
    console.log('⚡️ Bot uruchomiony!');
})();
