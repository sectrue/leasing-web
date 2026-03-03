# Leasing Web - Contesto di lavoro

Data: 2026-03-03

## Stato progetto
- App web con backend Fastify + Prisma (MariaDB) e frontend React (Vite + Tailwind).
- Autenticazione JWT + endpoint base `auth/login`, `auth/me`.
- DB MariaDB su `192.168.0.17` (VPN necessaria); NAS allegati su `\\192.168.0.17\Leasing`.

## Backend (principali endpoint)
- Health:
  - `GET /health`
- Auth:
  - `POST /auth/login`
  - `GET /auth/me`
- Pratiche:
  - `GET /pratiche` (paginato, filtri: q, sabatini, status, praticaId, leasing, broker)
  - `GET /pratiche/:id`
  - `POST /pratiche`
  - `PUT /pratiche/:id`
- KPI/Stats:
  - `GET /kpi`
  - `GET /stats/monthly`
- Mezzi (leasing_contracts):
  - `GET /pratiche/:id/mezzi`
  - `POST /pratiche/:id/mezzi`
  - `GET /mezzi` (lista globale, paginata, filtri q, praticaId)
  - `GET /mezzi/:id`
  - `PUT /mezzi/:id`
  - `DELETE /mezzi/:id`
- Allegati pratiche:
  - `GET /pratiche/:id/attachments`
  - `POST /pratiche/:id/attachments`
  - `DELETE /pratiche/attachments/:id`
  - `GET /pratiche/attachments/:id/download`
- Filtri:
  - `GET /filters/pratiche`
  - `GET /filters/leasing`
  - `GET /filters/brokers`

## Logica mezzi
- Mezzo = record `leasing_contracts`.
- `importo_finanziato` calcolato: `importo + pratica_40 + importo_allestimento_materiale`.
- `importo_contratto = importo_finanziato`.
- Mezzo può essere collegato a pratica via `pratica_id`.

## Frontend (architettura)
- Refactor effettuato: App.tsx ora orchestration.
- Nuovi file:
  - `src/types.ts`
  - `src/lib/api.ts`, `src/lib/format.ts`
  - Hooks: `useAuth`, `usePratiche`, `useMezzi`, `usePraticaForm`, `useStats`
  - Pages: `DashboardPage`, `PratichePage`, `MezziPage`, `StatistichePage`
  - Components: `LoginCard`, `MezziModal`, `MezzoFormModal`, `PraticaFormModal`

## UI / Layout
- Dashboard solo KPI (card 3 per riga) + alert promemoria.
- Pratiche:
  - Ricerca con campo grande + 4 filtri in riga (tutte pratiche, pratica specifica, leasing, broker).
  - Tabella pratiche paginata.
  - Pulsante `Nuova pratica` (modal).
  - Pulsanti riga: `Mezzi`, `Stampa`, `Modifica`.
  - Toolbar: pulsante `Stampa tutte`.
- Mezzi:
  - Lista globale (pagina `Mezzi`).
  - Modal mezzi per pratica con `Nuovo mezzo`, `Modifica`, `Elimina`.
  - Form mezzo calcola live importo finanziato.
- Login:
  - Top bar visibile; card quadrata centrata con distanza dal top (padding inline).

## Pratica form (modal)
- Sezioni: Dati base, Date e durata, Note, Sabatini, Allegati.
- Allegati:
  - Drag&Drop + input file.
  - Lista con nome, data upload, preview immagini, Apri/Elimina.
- Note pratica salvate in DB.

## Filtri pratiche
- Filtri live con debounce.
- No pulsante "Applica filtri".

## Note operative
- Se VPN non attiva, login fallisce (DB irraggiungibile).
- Frontend usa `VITE_API_URL`.

## Config / Env
- Backend `.env` (esempio):
  - `DATABASE_URL="mysql://root:Master10%21@192.168.0.17:3306/leasingdb"`
  - `JWT_SECRET="change_this_in_prod"`
  - `NAS_ATTACHMENTS="\\\\192.168.0.17\\Leasing\\Allegati\\"`
  - `NAS_PRINTS="\\\\192.168.0.17\\Leasing\\Stampe\\"`
  - `APP_PORT=3001`
- Frontend `.env`:
  - `VITE_API_URL=http://localhost:3001` (o IP remoto)

## Avvio locale
- Backend:
  - `cd backend`
  - `npm run dev` → http://localhost:3001/health
- Frontend:
  - `cd frontend`
  - `npm run dev` → http://localhost:5173

## Login / Credenziali
- Default seed (se eseguito):
  - `username: admin`
  - `password: Master10`

## Layout / UX note
- Filtri pratiche:
  - Campo cerca grande + 4 select in una riga (Tutte pratiche, Pratica specifica, Leasing, Broker).
  - Filtri live con debounce, senza pulsante “Applica filtri”.
- Paginazione pratiche e mezzi con page size 10/20/50.
- Login:
  - Top bar visibile.
  - Card quadrata con margine top via `paddingTop` inline in App.

## Modali
- Modale Mezzi (per pratica): elenco + azioni `Nuovo`, `Modifica`, `Elimina`.
- Modale Mezzo: form con calcolo live Importo Finanziato/Contratto.
- Modale Pratica: sezioni + allegati con preview e drag&drop.

## Allegati pratiche
- Upload con drag & drop o selezione file.
- Preview immagini inline.
- Pulsanti: Apri (download) + Elimina (con conferma).

## Comportamenti calcolati
- Mezzo: `importo_finanziato = importo + pratica_40 + importo_allestimento_materiale`.
- Importo contratto = importo finanziato.

## Endpoint dettagliati (nota filtri)
- `GET /pratiche`:
  - `q`, `sabatini`, `status`, `praticaId`, `leasing`, `broker`, `page`, `pageSize`
- `GET /mezzi`:
  - `q`, `praticaId`, `page`, `pageSize`

## Noti problemi/attenzioni
- Se VPN staccata → backend non raggiunge DB → login fallisce.
- Preview allegati funziona solo per immagini (altre estensioni: nessuna preview).
## Stampa pratiche (PDF)
- Stampa lato frontend con finestra `window.print()` (browser → Salva in PDF).
- “Stampa tutte” usa i filtri correnti; stampa singola per riga.
- Dati stampa:
  - Pratica: solo campi presenti nel form Pratica.
  - Mezzi: tabella con soli campi presenti nel form Mezzo.

## Mappa DB (tabelle usate)
- `leasing_pratiche`
  - campi: `id`, `nr_pratica`, `nr_ctr`, `leasing`, `broker`, `data_inizio`, `data_fine`, `durata`,
    `importo_rata`, `importo_riscatto`, `pratica_40`, `sabatini`, `importo_sabatini`, `sabatini_data`,
    `created_at`, `updated_at`
- `leasing_contracts` (Mezzi)
  - campi principali: `id`, `pratica_id`, `numero_interno`, `mezzo`, `fornitore`, `descrizione_bene`,
    `allestimento`, `importo`, `importo_allestimento_materiale`, `pratica_40`,
    `importo_finanziato`, `importo_contratto`, `note`
- `leasing_pratiche_attachments`
  - campi: `id`, `pratica_id`, `original_name`, `stored_name`, `stored_path`, `uploaded_at`
- `users`
  - campi: `id`, `username`, `password_hash`, `role`

## Schema UI (per pagina)
- Dashboard:
  - Grid KPI (3 colonne desktop) + alert promemoria.
- Pratiche:
  - Ricerca: input grande + 4 select in riga.
  - Tabella pratiche con paginazione e azioni (Mezzi, Modifica).
  - Modale Pratica (crea/modifica) con sezioni.
- Mezzi:
  - Ricerca mezzi (input + filtro pratica).
  - Tabella mezzi globale.
  - Modale Mezzi per pratica con lista + azioni.
  - Modale Mezzo (crea/modifica) con calcolo importi live.
- Statistiche:
  - KPI avanzati + grafico mensile importi.

## Changelog sintetico
- 2026-02-11:
  - Avviata versione web (backend + frontend).
  - Prisma db pull completato.
- 2026-02-12:
  - Refactor frontend in hooks/components/pages.
  - Implementata gestione pratiche (CRUD + allegati).
  - Implementata gestione mezzi (CRUD + calcolo importi).
  - Dashboard KPI e filtri pratiche/mezzi.
## Aggiornamento 2026-03-03

### Pratiche
- Colonna “Numero contratto” separata da “Numero pratica”.
- Aggiunto `nr_pratica` (opzionale) in DB, API e form.
- Backfill `nr_pratica` (ordine per azienda: più vecchia → più recente).

### Stampa
- Stampa pratiche/mezzi via frontend (HTML + `window.print()`).
- Pulsanti: “Stampa tutte” e “Stampa” per riga.
- Stampa include solo campi presenti nei form.
## File principali
- Backend: `backend/src/index.ts`
- Frontend: `frontend/src/App.tsx` + `src/pages/*` + `src/hooks/*` + `src/components/*`

## TODO / Prossimi step
- Rifinire ulteriormente pagina Pratiche (UX).
- Migliorare validazioni (client+server) per form pratica/mezzo.
- Statistiche avanzate (grafici reali aggiuntivi).

## Aggiornamento 2026-02-16

### Infrastruttura / operativita
- Confermato uso VS Code Remote SSH verso server aziendale (`leasing-server` / utente `sectrue`).
- Deploy backend via PM2 (`leasing-backend`) e deploy frontend via script `sudo /usr/local/bin/deploy-leasing-frontend`.

### Backend
- Rimossa esposizione del campo `pratica_40` dalle API pratiche (select pubblico dedicato).
- Estesa gestione Sabatini su pratiche con campi stato/scadenze e validazioni stato obbligatorie.
- Aggiunti endpoint Sabatini:
  - `GET/POST /pratiche/:id/sabatini/erogazioni`
  - `PUT/DELETE /sabatini/erogazioni/:id`
  - `GET/POST /pratiche/:id/sabatini/eventi`
  - `PUT/DELETE /sabatini/eventi/:id`
- Aggiunta gestione societa leasing:
  - campo `societa_leasing_id` su `leasing_pratiche`
  - endpoint CRUD `GET/POST/PUT/DELETE /societa-leasing`
  - filtro leasing aggiornato (`/filters/leasing`) con anagrafica societa + valori legacy.
- Migrazioni SQL applicate:
  - `backend/prisma/2026-02-16_sabatini_mvp.sql`
  - `backend/prisma/2026-02-16_societa_leasing_pratiche.sql`

### Frontend
- Modale pratica resa scrollabile e pulsante `Salva pratica` spostato in alto (accanto ad `Annulla`).
- Migliorata chiarezza etichette date in modifica pratica.
- Integrata sezione Sabatini completa (campi, erogazioni, eventi).
- Nuova pagina/tab `Societa Leasing` per creare/modificare/eliminare anagrafiche.
- In `Modifica pratica` aggiunta select societa leasing collegata al nuovo campo `societa_leasing_id`.

### Verifiche effettuate
- Build locali backend/frontend completate con successo.
- Backend su server avviato e healthcheck OK (`GET /health` => `{"ok":true}`).
- Test end-to-end API su server completato con cleanup:
  - login
  - create societa leasing
  - create pratica collegata
  - verifica collegamento e presenza in `/filters/leasing`
  - eliminazione record di test
  - esito: `E2E_OK praticaId=18 companyId=1 filtersContainsCompany=true`

## Aggiornamento 2026-02-16 (Rimozione Campi Date Sabatini)
- Richiesta cliente recepita: rimossi dal form pratica i campi:
  - Data stipula prevista
  - Data stipula effettiva
  - Data consegna prevista
  - Data consegna effettiva
  - Data invio rendicontazione
  - Scadenza rendicontazione
  - Data erogazione prevista
  - Data erogazione effettiva
- Frontend aggiornato:
  - frontend/src/components/PraticaFormModal.tsx
  - frontend/src/hooks/usePraticaForm.ts

## Aggiornamento 2026-02-24 (Contesto operativo reale server)

### Punto critico (evitare perdite di tempo)
- L'utente lavora in SSH su server (`192.168.0.254`) e guarda il frontend **online** su `http://192.168.0.254` (senza porta).
- Il frontend online **NON** e' il Vite dev server (`:5173`) e **NON** legge automaticamente `frontend/src/*`.
- Il sito online e' servito da **Nginx** con root statica in:
  - `/var/www/leasing-web`

### Dev vs Online (distinzione obbligatoria)
- `frontend/src/*` = codice sorgente (modifiche sviluppo)
- `frontend/dist/*` = build prod locale generata da `npm run build`
- `/var/www/leasing-web/*` = build realmente pubblicata online da Nginx
- Quindi: modificare `src` + fare `npm run build` **non basta** per vedere cambi online.
- Serve pubblicare la build con:
  - `rsync -a --delete /home/sectrue/leasing-web/frontend/dist/ /var/www/leasing-web/`

### Processi reali (PM2)
- Backend PM2: `leasing-backend` (esegue `npm start` in `backend/`)
- Frontend PM2: `leasing-frontend` (Vite dev, utile per debug locale su `127.0.0.1:5173`)
- Attenzione: il frontend PM2 su `:5173` non e' quello usato dall'utente per il sito online.

### Deploy frontend online (procedura corretta)
1. `cd /home/sectrue/leasing-web/frontend`
2. `npm run build`
3. `rsync -a --delete /home/sectrue/leasing-web/frontend/dist/ /var/www/leasing-web/`
4. Verifica asset live:
   - `curl -s http://192.168.0.254 | grep -Eo 'index-[A-Za-z0-9_-]+\\.(js|css)'`

### Comando unico consigliato (deploy frontend online)
- Script pronto nel repo:
  - `/home/sectrue/leasing-web/deploy-frontend-online.sh`
- Esegue:
  - build frontend
  - publish con `rsync` su `/var/www/leasing-web`
  - verifica asset pubblicati
  - verifica asset live su `http://192.168.0.254`

### Permessi deploy (soluzione permanente)
- `/var/www/leasing-web` deve essere scrivibile da `sectrue` per permettere deploy automatico senza `sudo`.
- Stato desiderato:
  - owner/gruppo deployabile da `sectrue`
  - Nginx (`www-data`) in sola lettura

### Verifica rapida quando "non vedo le modifiche"
- Controllare asset online correnti:
  - `curl -s http://192.168.0.254 | grep -Eo 'index-[A-Za-z0-9_-]+\\.(js|css)'`
- Confrontarli con asset locali:
  - `ls -1 /home/sectrue/leasing-web/frontend/dist/assets`
- Se diversi => build non pubblicata nella root Nginx (`/var/www/leasing-web`)

### Nota funzionale (Aziende)
- Creazione azienda deve essere visibile nella pagina `Aziende` (sezione `Nuova azienda` con bottone `Aggiungi azienda`).
- Non usare il bottone rapido in header se richiesto di rimuoverlo (stato attuale: rimosso).
  - frontend/src/types.ts
- Backend aggiornato (backend/src/index.ts): rimosse le validazioni che rendevano obbligatorie le date sopra per gli stati Sabatini.
- Applicazione effettuata direttamente su server remoto leasing-server via SSH.
- Deploy eseguito:
  - backend riavviato con PM2
  - frontend build + publish su Nginx completati
- Nota operativa deploy frontend: script aggiornato con path assoluto nel cp per compatibilita con regole sudoers.

## Aggiornamento 2026-02-20 (Multi-azienda)

### Backend
- Introdotto supporto multi-azienda con header obbligatorio `X-Azienda-Id` (accettato anche alias `X-Azienda`) per tutte le API dati.
- Aggiunto endpoint `GET /aziende` (autenticato) per caricare le aziende disponibili lato frontend.
- Applicato scoping per `azienda_id` su:
  - pratiche
  - mezzi
  - allegati pratiche
  - filtri (`/filters/pratiche`, `/filters/leasing`, `/filters/brokers`)
  - KPI / statistiche
  - anagrafica `societa-leasing`
  - Sabatini (`erogazioni`, `eventi`)
- Allegati pratiche salvati su NAS in path separato per azienda (`Azienda_<id>/Pratiche/Pratica_<id>`).

### Database / Migrazione
- Aggiunta tabella `aziende` con seed iniziale (`Azienda 1`, `Azienda 2`).
- Aggiunto campo `azienda_id` (default `1`) e relativi indici alle tabelle:
  - `leasing_pratiche`
  - `leasing_contracts`
  - `leasing_pratiche_attachments`
  - `societa_leasing`
  - `sabatini_erogazioni`
  - `sabatini_eventi`
- Popolamento dati esistenti a `azienda_id = 1`.
- Script SQL: `backend/prisma/2026-02-20_multi_azienda.sql`

### Frontend
- Aggiunto hook `useAziende` per caricare elenco aziende da API e gestire selezione corrente.
- Aggiunto selettore azienda nella top bar (persistenza in `localStorage`).
- Tutti gli hook API principali inviano `X-Azienda-Id` tramite helper centralizzato (`buildAuthHeaders`):
  - `usePratiche`
  - `usePraticaForm`
  - `useMezzi`
  - `useStats`
  - `useLeasingCompanies`
- Le pagine dati vengono caricate solo quando `aziendaId` e' disponibile.

### Note operative
- Login non richiede azienda; la selezione azienda avviene dopo autenticazione.
- In assenza di header azienda sulle API dati il backend risponde con errore `400` (`Azienda mancante`).
- Aggiornare eventuali script/client esterni per inviare `X-Azienda-Id`.
