const { chromium } = require('playwright');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

(async () => {
    console.log('🚀 Uruchamianie przeglądarki...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('🌐 Otwieranie strony...');
    await page.goto('https://manifest.plstrefa.pl/', { waitUntil: 'domcontentloaded' });

    console.log('📝 Wypełnianie formularza logowania...');
    await page.fill('input[name="username"]', process.env.LOGIN);
    await page.fill('input[name="password"]', process.env.PASSWORD);

    console.log('🔐 Logowanie...');
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
        page.click('text=Zaloguj')
    ]);

    console.log('⏳ Czekanie na pełne załadowanie...');
    await page.waitForTimeout(2000);

    const html = await page.content();
    fs.writeFileSync('page.html', html);
    console.log('💾 Zapisano HTML do page.html');

    if (html.includes('PUSTY')) {
        console.log('📭 Lista jest pusta.');
    } else {
        console.log('📬 Lista dostępna – wysyłam powiadomienie...');
        await axios.post(process.env.SLACK_WEBHOOK, {
            text: '🚨 Nowa lista dostępna na manifest.plstrefa.pl!',
        });
    }

    await browser.close();
    console.log('✅ Gotowe!');
})();
