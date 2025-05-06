const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    console.log('🚀 Uruchamianie przeglądarki...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('🌐 Ładowanie strony...');
    await page.goto('https://manifest.plstrefa.pl/', { waitUntil: 'domcontentloaded' });

    // 👉 Jeśli logowanie będzie potrzebne, dodaj tutaj page.fill i page.click

    console.log('⏳ Czekanie na załadowanie strony...');
    await page.waitForTimeout(3000); // Czas na załadowanie dynamicznych danych

    const html = await page.content();
    fs.writeFileSync('page.html', html);

    console.log('✅ Zapisano HTML do pliku: page.html');

    await browser.close();
})();
