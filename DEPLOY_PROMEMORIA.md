# Promemoria deploy

Stato attuale (2026-02-13):
- QNAP TS-431P e' armv7: Prisma non supporta armv7, quindi backend non puo' girare sul QNAP.
- Soluzione scelta: installare Docker Desktop su PC e avviare MySQL in container.

Prossimi passi:
1) Installare Docker Desktop + WSL2, poi riavviare.
2) Verificare Docker: `docker --version`.
3) Avviare MySQL in Docker:
   `docker run -d --name leasing-mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=Master10! -e MYSQL_DATABASE=leasingdb -v leasing-mysql-data:/var/lib/mysql mysql:8.0`
4) Fare dump dal QNAP:
   `mysqldump -h 192.168.0.17 -u root -p leasingdb > /share/CACHEDEV1_DATA/leasingdb.sql`
5) Copiare dump sul PC:
   `scp sectrue@192.168.0.17:/share/CACHEDEV1_DATA/leasingdb.sql C:\Users\marconicolini\source\repos\`
6) Importare nel MySQL locale:
   `docker exec -i leasing-mysql mysql -uroot -pMaster10! leasingdb < C:\Users\marconicolini\source\repos\leasingdb.sql`
7) Aggiornare `backend/.env`:
   `DATABASE_URL="mysql://root:Master10%21@localhost:3306/leasingdb"`

Note:
- Frontend su QNAP non possibile con backend su QNAP; backend va su PC o altro host x86/arm64.
- Se serve tutto online: valutare server x86/arm64 o riscrivere backend senza Prisma.
