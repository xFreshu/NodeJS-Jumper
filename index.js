const { chromium } = require('playwright');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

(async () => {
    try {
        // Upewnij się, że katalog dumps istnieje
        if (!fs.existsSync('dumps')) {
            fs.mkdirSync('dumps', { recursive: true });
        }

        console.log('🚀 Uruchamianie przeglądarki...');
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        console.log('🌐 Otwieranie strony...');
        await page.goto('https://manifest.plstrefa.pl/', { waitUntil: 'domcontentloaded' });

        // Zapisz stronę logowania do HTML
        const loginHtml = await page.content();
        fs.writeFileSync(path.join('dumps', 'login.html'), loginHtml);
        console.log('✅ Zapisano HTML strony logowania do dumps/login.html');

        console.log('📸 Robienie zrzutu przed logowaniem...');
        await page.screenshot({ path: 'assets/before-login.png', fullPage: true });

        console.log('📝 Wypełnianie formularza logowania...');
        await page.fill('input[name="user_name"]', process.env.LOGIN);
        await page.fill('input[name="user_password"]', process.env.PASSWORD);

        console.log('🔐 Logowanie...');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
            page.click('text=Zaloguj')
        ]);

        console.log('⏳ Odczekanie 5 sekund po zalogowaniu...');
        await page.waitForTimeout(5000);

        // Zapisz stronę po zalogowaniu do HTML
        const afterLoginHtml = await page.content();
        fs.writeFileSync(path.join('dumps', 'after-login.html'), afterLoginHtml);
        console.log('✅ Zapisano HTML po zalogowaniu do dumps/after-login.html');

        console.log('📸 Robienie zrzutu po zalogowaniu...');
        await page.screenshot({ path: 'assets/after-login.png', fullPage: true });

        console.log('➡️ Przechodzenie do strony /planowka...');
        await page.goto('https://manifest.plstrefa.pl/planowka', { waitUntil: 'domcontentloaded' });

        console.log('⏳ Odczekanie 2 sekund na /planowka...');
        await page.waitForTimeout(2000);

        // Zapisz stronę /planowka do HTML
        const planowkaHtml = await page.content();
        fs.writeFileSync(path.join('dumps', 'planowka.html'), planowkaHtml);
        console.log('✅ Zapisano HTML strony planowki do dumps/planowka.html');

        const screenshotPath = 'assets/planowka.png';
        console.log('📸 Robienie zrzutu na /planowka...');
        await page.screenshot({ path: screenshotPath, fullPage: true });

        await browser.close();
        console.log('✅ Zrzut ekranu zapisany!');

        console.log('🚀 Wysyłanie zdjęcia na Imgur...');

        const imageBuffer = fs.readFileSync(screenshotPath);

        const imgurResponse = await axios.post('https://api.imgur.com/3/image', imageBuffer, {
            headers: {
                Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
                'Content-Type': 'application/octet-stream'
            }
        });

        if (!imgurResponse.data.success) {
            console.error('❌ Upload na Imgur nie powiódł się:', imgurResponse.data);
            return;
        }

        const imageUrl = imgurResponse.data.data.link;
        console.log('✅ Zdjęcie wrzucone na Imgur:', imageUrl);

        console.log('🚀 Wysyłanie powiadomienia na Slacka...');

        const slackResponse = await axios.post('https://slack.com/api/chat.postMessage', {
            channel: process.env.SLACK_CHANNEL_ID,
            text: `🚨 Nowy zrzut ekranu z planówki: ${imageUrl}`
        }, {
            headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }
        });

        console.log('➡️ Odpowiedź od Slacka:', slackResponse.data);

        if (slackResponse.data.ok) {
            console.log('✅ Wiadomość została wysłana na Slacka!');
        } else {
            console.error('❌ Wysyłka wiadomości na Slacka nie powiodła się! Błąd:', slackResponse.data.error);
        }

    } catch (err) {
        console.error('❗️ Wystąpił błąd:', err);
    }
})();
