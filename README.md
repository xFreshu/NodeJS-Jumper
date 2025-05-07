# 📝 Playwright Automation with Slack & Imgur Integration

Ten projekt automatyzuje proces logowania do `https://manifest.plstrefa.pl/`, wykonuje zrzut ekranu strony planówki, zapisuje treść stron w formacie HTML i wysyła powiadomienie na Slacka z linkiem do zrzutu ekranu przesłanego anonimowo na Imgur.

---

## 📦 **Wymagania**

- Node.js (>= v16)
- konto Slack z zarejestrowaną aplikacją (Bot Token OAuth)
- konto Imgur i wygenerowany Client ID (do uploadu anonimowego)
- npm (Node Package Manager)

---

## 🚀 **Jak uruchomić projekt**

1. **Sklonuj repozytorium:**

```bash
git clone https://github.com/twoj-login/twoj-repo.git
cd twoj-repo
```

2. **Zainstaluj zależności:**

```bash
npm install
```

3. **Przygotuj plik `.env` w głównym katalogu projektu.**

Plik `.env` **musi zawierać następujące wartości:**

```env
# Dane logowania do strony manifest.plstrefa.pl
LOGIN=twoj_login
PASSWORD=twoje_haslo

# Token bota Slack (xoxb-...)
SLACK_BOT_TOKEN=xoxb-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# ID kanału Slack (np. C1234567890)
SLACK_CHANNEL_ID=CXXXXXXXXXX

# Client ID aplikacji Imgur (do anonimowego uploadu)
IMGUR_CLIENT_ID=xxxxxxxxxxxxxxxx
```

### 📝 **Skąd wziąć te dane?**

✅ `LOGIN` i `PASSWORD` – login i hasło do strony [https://manifest.plstrefa.pl/](https://manifest.plstrefa.pl/)

✅ `SLACK_BOT_TOKEN` – token bota Slacka (z uprawnieniem `chat:write` → dodajesz w [Slack API](https://api.slack.com/apps) → OAuth & Permissions → Bot Token Scopes → `chat:write`)

✅ `SLACK_CHANNEL_ID` – ID kanału Slack, np. `C01ABCDEF12`
  - znajdziesz go w URL Slacka → `https://app.slack.com/client/TXXXXXXXX/CXXXXXXXX`

✅ `IMGUR_CLIENT_ID` – Client-ID z aplikacji Imgur
  - utworzysz go na [https://api.imgur.com/oauth2/addclient](https://api.imgur.com/oauth2/addclient) wybierając **"Anonymous usage without user authorization"**

---

## 📂 **Co robi aplikacja:**

1. Loguje się na `https://manifest.plstrefa.pl/`
2. Zapisuje stronę logowania do pliku `dumps/login.html`
3. Po zalogowaniu zapisuje stronę do `dumps/after-login.html`
4. Przechodzi na `/planowka`, zapisuje stronę do `dumps/planowka.html`
5. Robi zrzut ekranu `assets/planowka.png`
6. Wysyła zrzut anonimowo na Imgur
7. Wysyła na Slacka wiadomość z linkiem do obrazka z Imgur

---

## 🏁 **Uruchomienie skryptu:**

```bash
node app.js
```

✅ Po uruchomieniu w katalogu pojawią się:

- `assets/before-login.png`
- `assets/after-login.png`
- `assets/planowka.png`
- `dumps/login.html`
- `dumps/after-login.html`
- `dumps/planowka.html`

✅ Na Slacku pojawi się wiadomość z linkiem do obrazka.

---

## ⚠️ **Uwagi:**

- **Nie wrzucaj pliku `.env` do repozytorium publicznego.**
- Jeśli chcesz udostępniać zrzuty poza Slackiem, możesz użyć innych platform niż Imgur.
- Upewnij się, że bot Slack ma uprawnienie `chat:write` i został zaproszony na kanał (`/invite @twojbot`).

---

## 👨‍💻 **Autor**

Projekt przygotowany przez [Twoje Imię]  
Kontakt: [twój email]
