const { chromium } = require('playwright');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

(async () => {
    try {
        if (!fs.existsSync('dumps')) {
            fs.mkdirSync('dumps', { recursive: true });
        }

        if (!fs.existsSync('assets')) {
            fs.mkdirSync('assets', { recursive: true });
        }

        console.log('🚀 Uruchamianie przeglądarki...');
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        console.log('🌐 Otwieranie strony...');
        await page.goto('https://manifest.plstrefa.pl/', { waitUntil: 'domcontentloaded' });

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

        const afterLoginHtml = await page.content();
        fs.writeFileSync(path.join('dumps', 'after-login.html'), afterLoginHtml);
        console.log('✅ Zapisano HTML po zalogowaniu do dumps/after-login.html');

        console.log('📸 Robienie zrzutu po zalogowaniu...');
        await page.screenshot({ path: 'assets/after-login.png', fullPage: true });

        console.log('➡️ Przechodzenie do strony /planowka...');
        await page.goto('https://manifest.plstrefa.pl/planowka', { waitUntil: 'domcontentloaded' });

        console.log('⏳ Odczekanie 2 sekund na /planowka...');
        await page.waitForTimeout(2000);

        const planowkaHtml = await page.content();
        fs.writeFileSync(path.join('dumps', 'planowka.html'), planowkaHtml);
        console.log('✅ Zapisano HTML strony planowki do dumps/planowka.html');

        console.log('🔍 Szukanie PAJĄK ANDRZEJ w tabelach...');

        const wyloty = await page.evaluate(() => {
            const znalezioneWyloty = [];

            const tables = Array.from(document.querySelectorAll('table'));

            tables.forEach(table => {
                const rows = Array.from(table.querySelectorAll('tr'));
                const zawieraPajaka = rows.some(row => row.innerText.includes('PAJĄK ANDRZEJ'));

                if (zawieraPajaka) {
                    // idziemy w górę DOM szukając p z "Wylot X"
                    let prev = table.previousElementSibling;
                    let znalezionyWylot = null;

                    while (prev && prev.tagName !== 'BODY') {
                        if (prev.tagName === 'P' && prev.innerText.match(/Wylot\s+\d+/i)) {
                            const match = prev.innerText.match(/Wylot\s+(\d+)/i);
                            if (match) {
                                znalezionyWylot = match[1];
                            }
                            break;
                        }
                        prev = prev.previousElementSibling;
                    }

                    if (znalezionyWylot) {
                        znalezioneWyloty.push(znalezionyWylot);
                    }
                }
            });

            return znalezioneWyloty;
        });

        if (wyloty.length > 0) {
            console.log(`✅ Znaleziono PAJĄK ANDRZEJ w wylotach: ${wyloty.join(', ')}`);

            const screenshotPath = 'assets/planowka-found.png';
            console.log('📸 Robienie zrzutu planówki (znaleziono PAJĄK ANDRZEJ)...');
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
                text: `🚨 Znaleziono PAJĄK ANDRZEJ w wylotach: ${wyloty.join(', ')}\nZrzut ekranu: ${imageUrl}`
            }, {
                headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }
            });

            console.log('➡️ Odpowiedź od Slacka:', slackResponse.data);

            if (slackResponse.data.ok) {
                console.log('✅ Wiadomość została wysłana na Slacka!');
            } else {
                console.error('❌ Wysyłka wiadomości na Slacka nie powiodła się! Błąd:', slackResponse.data.error);
            }
        } else {
            console.log('❌ PAJĄK ANDRZEJ nie znaleziony w żadnym wylocie.');
            await browser.close();
        }

    } catch (err) {
        console.error('❗️ Wystąpił błąd:', err);
    }
})();
