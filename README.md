# Library Management System — Web Version (Node.js + Express + MySQL)

আপনার C কনসোল প্রোগ্রামের মতোই ফিচার (Signup/Login role-select, Borrow/Return/Renew,
Fines, Reservations, Teacher Requests, Admin Settings/Reports) — কিন্তু এবার ব্রাউজারে।

## ফোল্ডার স্ট্রাকচার
```
library-app/
  backend/
    public/    -> Plain HTML/CSS/JS UI (backend থেকেই সার্ভ হয়)
    ...        -> Node.js + Express API + MySQL
```
(⚠️ আপডেট: আগে `frontend/` আলাদা top-level ফোল্ডার ছিল, কিন্তু Railway-তে Root Directory
`/backend` সেট করা থাকায় সেই বাইরের ফোল্ডারটা build-এ অন্তর্ভুক্ত হচ্ছিল না — deploy করা লিংকে
404 দেখাচ্ছিল। তাই frontend-কে `backend/public`-এ সরিয়ে আনা হয়েছে।)

## ধাপ ১ — MySQL Database বানানো
```bash
mysql -u root -p < backend/schema.sql
```
এটা `library_system` নামে database এবং সব টেবিল (users, books, loans,
reservations, book_requests, settings) বানাবে।

## ধাপ ২ — Backend সেটআপ
```bash
cd backend
cp .env.example .env
# .env ফাইলে আপনার MySQL password এবং একটা JWT_SECRET বসান
npm install
npm run dev      # অথবা: npm start
```
সার্ভার চালু হবে: `http://localhost:5000`

## ধাপ ৩ — Frontend দেখা
আলাদা কিছু করতে হবে না — Express-ই `frontend/` ফোল্ডার সার্ভ করে।
ব্রাউজারে যান: **http://localhost:5000**

## ব্যবহার
1. প্রথমে **Sign Up** ট্যাব থেকে একটা account বানান (Gmail + demo OTP verify + strong password)।
2. **Sign In** ট্যাবে গিয়ে role বেছে নিন (Student / Teacher / Librarian / Admin) — role account-এ
   স্থায়ীভাবে সেভ থাকে না, প্রতিবার login-এর সময় বেছে নিতে হয় (আপনার C কোডের মতোই)।
3. Role অনুযায়ী আলাদা ড্যাশবোর্ড দেখতে পাবেন।

## নতুন যোগ করা ফিচার (আপডেট ২ — সম্পূর্ণ ১:১ মিল)
- Borrow/Return/Reserve/Request-এ এখন ম্যানুয়াল তারিখ দেওয়া যায় (future date নিষেধ) — আগে শুধু "আজকের তারিখ" হার্ডকোড ছিল
- Admin-এর জন্য আলাদা "System Summary" মেনু (Reports থেকে আলাদা), মূল কোডের `viewSystemSummary()`-এর সাথে মিলিয়ে
- Librarian/Admin এখন নতুন ইউজার add করার সময় Gmail OTP verify করে, মূল কোডের `signUpUser()` reuse করার আচরণের সাথে মিলিয়ে
- Admin Settings-এ "Full System Dump" (.txt) — মূল কোডের `LibrarySystem.txt`-এর মতো readable dump, একটা ব্যতিক্রম সহ: password এখানে `[encrypted]` দেখায়, প্লেইনটেক্সট না (কারণ এই অ্যাপ কখনো প্লেইনটেক্সট পাসওয়ার্ড সেভ করে না, শুধু bcrypt hash রাখে) — বাকি সব ফিল্ড হুবহু আছে

## নতুন যোগ করা ফিচার (আপডেট ১)
- Reset password-এ এখন Gmail OTP verify করতে হয় (আগে বাদ ছিল)
- Login-এর পর Student/Teacher-এর ড্যাশবোর্ডে overdue/due-soon বইয়ের warning ব্যানার
- Librarian/Admin এখন সরাসরি নতুন user account বানাতে ও username/Gmail দিয়ে search করতে পারবে
- Reports পেজ থেকে `.txt` রিপোর্ট ফাইল ডাউনলোড করা যায়
- Admin Settings পেজে Backup (JSON ডাউনলোড) ও Restore (JSON আপলোড) বাটন
- নিরাপত্তা fix: Borrow/Renew/Reserve/Request API এখন backend-এও শুধু সঠিক role (Student/Teacher, প্রযোজ্যক্ষেত্রে Librarian) থেকেই কল করা যায় — আগে শুধু frontend মেনু দিয়ে লুকানো ছিল, সরাসরি API কল করলে বাইপাস করা যেত

## গুরুত্বপূর্ণ নোট
- Password bcrypt দিয়ে hash করে রাখা হয় (আপনার C কোডে plaintext-ও সেভ হতো, ওয়েব ভার্সনে
  সেটা নিরাপত্তার জন্য বাদ দেওয়া হয়েছে)।
- Login token (JWT) ব্রাউজারের localStorage-এ সেভ থাকে; প্রতিটা API কলের সাথে পাঠানো হয়।
- OTP এখনো demo/simulate করা (কোনো real ইমেইল পাঠানো হয় না) — কোডে কমেন্ট আছে ঠিক কোথায়
  real email service (SendGrid/Nodemailer ইত্যাদি) বসাবেন।
- Backup/Restore এখানে বাদ দেওয়া হয়েছে কারণ MySQL-এ সেটা `mysqldump` দিয়ে যেকোনো সময় করা যায়:
  ```bash
  mysqldump -u root -p library_system > backup.sql
  mysql -u root -p library_system < backup.sql
  ```

## পাবলিক লিংক বানানো (যেকেউ URL দিয়ে ঢুকতে পারবে)

লোকাল কম্পিউটারে `localhost:5000` শুধু আপনার নিজের ব্রাউজারেই কাজ করে — অন্য কাউকে দিলে সে
ঢুকতে পারবে না। যেকাউকে দেওয়ার মতো একটা লিংক পেতে হলে প্রজেক্টটা একটা হোস্টিং সার্ভিসে
ডিপ্লয় করতে হবে। সবচেয়ে সহজ উপায় **Railway** (Node.js + MySQL দুটোই এক জায়গায় সাপোর্ট করে,
কার্ড ছাড়াই ফ্রি ট্রায়াল দিয়ে শুরু করা যায়):

1. **GitHub-এ কোড তুলুন** — এই zip ফাইলটা extract করে একটা নতুন GitHub রিপোতে push করুন
   (`git init`, `git add .`, `git commit`, তারপর GitHub-এ রিপো বানিয়ে push)।

2. **Railway-তে অ্যাকাউন্ট খুলুন** — railway.app -এ গিয়ে GitHub দিয়ে সাইন ইন করুন।

3. **নতুন Project বানান** → "Deploy from GitHub repo" → আপনার রিপোটা সিলেক্ট করুন।
   - Settings-এ গিয়ে **Root Directory** সেট করুন `backend` (কারণ backend/frontend দুটো
     একই রিপোতে, কিন্তু সার্ভার চলবে backend ফোল্ডার থেকে)।
   - Start command: `npm start`

4. **MySQL যোগ করুন** — একই Project-এ "+ New" → "Database" → "Add MySQL"। Railway নিজে থেকেই
   একটা MySQL ইন্সট্যান্স বানিয়ে দেবে এবং connection variables (host, port, user, password,
   database) জেনারেট করবে।

5. **Environment Variables সেট করুন** — আপনার Node service-এর Variables ট্যাবে গিয়ে বসান:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — এগুলো MySQL service-এর
     Variables ট্যাব থেকে কপি করুন (Railway-তে এগুলো সাধারণত `MYSQLHOST`, `MYSQLPORT`,
     `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE` নামে থাকে — শুধু নাম মিলিয়ে reference
     করুন বা নিজের নামে কপি করুন)
   - `JWT_SECRET` — একটা লম্বা random string
   - `JWT_EXPIRES_IN=8h`

6. **Schema আপলোড করুন** — Railway-র MySQL service থেকে "Connect" বাটনে ক্লিক করে একটা
   connection command/URL পাবেন। লোকাল টার্মিনাল থেকে:
   ```bash
   mysql -h <MYSQLHOST> -P <MYSQLPORT> -u <MYSQLUSER> -p<MYSQLPASSWORD> <MYSQLDATABASE> < backend/schema.sql
   ```

7. **Deploy হয়ে গেলে** Railway আপনাকে একটা পাবলিক URL দেবে, যেমন:
   `https://your-app-name.up.railway.app`
   এটাই সেই লিংক — এটা যাকে দেবেন, সে ব্রাউজারে খুলে সরাসরি সাইন আপ/লগইন করতে পারবে।

**বিকল্প:** Render.com-ও একইভাবে কাজ করে (Web Service + সাথে PostgreSQL ফ্রি — MySQL চাইলে
Aiven বা PlanetScale-এর মতো আলাদা managed MySQL জুড়ে দিতে হবে)।

> ফ্রি টিয়ারের শর্ত (credit limit, spin-down ইত্যাদি) মাঝে মাঝে বদলায়, তাই ডিপ্লয়ের আগে
> Railway/Render-এর বর্তমান pricing পেজ একবার চেক করে নেবেন।

## API সংক্ষেপে
- `POST /api/auth/signup`, `/login`, `/reset-password`, `/send-otp`, `/verify-otp`
- `GET/POST/PUT/DELETE /api/books`
- `POST /api/loans/borrow`, `/:id/return`, `/:id/renew`, `GET /mine`, `/history`, `/fines`
- `GET/POST/DELETE /api/reservations`
- `GET/POST /api/requests`, `/:id/approve`, `/:id/reject`
- `GET/PUT /api/users` (Librarian/Admin)
- `GET/PUT /api/settings` (Admin)
- `GET /api/reports/summary`
