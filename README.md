# Leasing Web

## Prerequisiti
- Node.js installato
- Accesso a MariaDB `leasingdb` (192.168.0.17)
- Accesso NAS `\\192.168.0.17\Leasing\`

## Backend
```
cd backend
npm run dev
```
Server: http://localhost:3001/health

## Frontend
```
cd frontend
npm run dev
```
App: http://localhost:5173

## Note
- Prisma configurato in `backend\.env`.
- `prisma db pull` già eseguito.
