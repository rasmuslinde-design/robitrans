# RobiTrans

Monorepo (npm workspaces) ühe-lehelise veebilehe jaoks:

- `apps/web` – React + Vite frontend
- `apps/api` – Node.js (Express) backend + SQLite + SMTP e-mail

## Funktsionaalsus

- Navbar (🚜 RobiTrans OÜ) + nupud: Home, Masinad, Broneerimine, Tehtud tööd
- Hero taustapildiga (tõstuk) + CTA nupud
- Masinate vaade: ainult **2 masinat**
- Broneerimine: kalender vasakul + vorm paremal, kõik väljad kohustuslikud
  - **Nädalavahetusel broneerida ei saa**
  - broneeritud kuupäevad on kalendris märgitud
- Broneerimisel saadetakse e-mail aadressile `bert-robert.polluste@voco.ee` (SMTP seadistusega)
- Admin dashboard: `/admin` – login (admin/qwerty123) + broneeringute tabel

## Seadistamine

### 1) Paigalda sõltuvused

```bash
npm install
```

### 2) API keskkonnamuutujad

Kopeeri `apps/api/.env.example` -> `apps/api/.env` ja täida SMTP andmed.

> Kui SMTP on seadistamata, siis broneering salvestatakse küll andmebaasi, aga e-maili saatmine jäetakse vahele (API vastuses on `mail.skipped=true`).

### 3) Käivita arendusrežiimis

```bash
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:5174
- Admin: http://localhost:5173/admin

## Märkused

- Andmebaas luuakse automaatselt `apps/api/data/robitrans.sqlite`.
- Kuupäevad on unikaalsed (üks broneering päeva kohta) ja API tagastab 409 kui päev on juba broneeritud.
