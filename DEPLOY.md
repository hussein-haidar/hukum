# Deployment Guide - HukumKu

## Opsi 1: Vercel (Gratis, Recommended)

### Prasyarat
- Akun GitHub
- Akun Vercel (gratis)

### Langkah-langkah

1. **Push ke GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/hukumku.git
git push -u origin main
```

2. **Deploy ke Vercel**
- Buka https://vercel.com
- Login dengan GitHub
- Klik "New Project"
- Pilih repo `hukumku`
- Environment variables:
  - `GROQ_API_KEY` = (API key Groq kamu)
- Klik "Deploy"

3. **Setup Database (PostgreSQL)**
Vercel tidak support SQLite. Gunakan:
- **Vercel Postgres** (gratis 1GB): Settings > Storage > Create Database
- **Neon** (gratis): https://neon.tech
- **Supabase** (gratis): https://supabase.com

Setelah dapat DATABASE_URL:
```
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
```

Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Lalu run:
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

4. **Set Environment Variables di Vercel**
- `DATABASE_URL` = (dari database provider)
- `GROQ_API_KEY` = (dari Groq console)

### Deployment otomatis
Setelah push ke GitHub, Vercel otomatis build & deploy.

---

## Opsi 2: Railway / Render

### Railway
1. Buka https://railway.app
2. Login dengan GitHub
3. New Project > Deploy from GitHub repo
4. Tambah PostgreSQL plugin
5. Set environment variables

### Render
1. Buka https://render.com
2. New > Web Service
3. Connect GitHub repo
4. Build command: `npm install && npx prisma generate && npx prisma db push && npm run build`
5. Start command: `npm start`
6. Tambah PostgreSQL database

---

## Opsi 3: VPS (DigitalOcean / Linode / etc)

### Setup
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Clone repo
git clone https://github.com/USERNAME/hukumku.git
cd hukumku

# Setup
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts

# Run
pm2 start npm --name "hukumku" -- start
pm2 save
pm2 startup
```

### Nginx Config
```nginx
server {
    listen 80;
    server_name hukumku.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Troubleshooting

### Sync JDIHN/Perpusnas gagal di Vercel
- Vercel Functions punya timeout 10 detik (free) / 60 detik (pro)
- API pemerintah kadang lambat
- Solusi: Gunakan manual import atau setup cron job di VPS

### Database connection error
- Pastikan `DATABASE_URL` benar
- Pastikan IP database di-whitelist (untuk cloud DB)

### Build error
- Run `npx prisma generate` sebelum build
- Pastikan semua dependencies terinstall
