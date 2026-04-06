# 🎓 UniVerse — College Event Registration System

> Google Cloud Digital Leader — Capstone Project  
> A full-stack web application for college event registration built with Node.js, Express, and MySQL.
> <p align="center">
  <a href="https://shani-prajapati.github.io/Universe-Event-Registration/" target="_blank">
    <img src="https://img.shields.io/badge/Click%20To%20Open-UniVerse%20Live-00758f?style=for-the-badge&logo=google-cloud&logoColor=white" alt="Click to Open">
  </a>

  &nbsp;&nbsp;&nbsp;&nbsp;

  <a href="#-universe--college-event-registration-system">
    <img src="https://img.shields.io/badge/Show%20UniVerse-Scroll%20to%20Top-34a853?style=for-the-badge&logo=google&logoColor=white" alt="Show UniVerse">
  </a>
</p>

---

## 📁 Project Structure

```
universe-project/
├── index.html          ← Frontend HTML (UI structure)
├── style.css           ← All CSS styles (dark theme)
├── script.js           ← Frontend JavaScript (API calls)
├── server.js           ← Node.js + Express backend (API)
├── database.sql        ← MySQL schema + seed data
├── package.json        ← Node.js dependencies
├── .env                ← Environment variables (DB config)
├── .gitignore
└── README.md
```

---

## ⚙️ Prerequisites

Make sure you have these installed:

- [Node.js](https://nodejs.org/) v18 or higher
- [MySQL](https://dev.mysql.com/downloads/) v8 or higher
- A terminal / command prompt

---

## 🚀 Setup Instructions (Step by Step)

### Step 1 — Clone or Download the Project

```bash
git clone https://github.com/Shani-Prajapati/Universe-Event-Registration.git
cd Universe-Event-Registration
```

### Step 2 — Install Node.js Dependencies

```bash
npm install
```

This installs: `express`, `mysql2`, `bcryptjs`, `cors`, `dotenv`

---

### Step 3 — Set Up MySQL Database

Open MySQL in your terminal:

```bash
mysql -u root -p
```

Then run the SQL file to create the database and tables:

```bash
mysql -u root -p < database.sql
```

This will:
- Create `universe_db` database
- Create `users`, `events`, `registrations` tables
- Insert 9 sample events as seed data

---

### Step 4 — Configure Environment Variables

Open the `.env` file and update your MySQL password:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=universe_db
```

---

### Step 5 — Start the Server

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

You should see:

```
🚀 UniVerse server running at http://localhost:3000
📁 Serving frontend from: Root Directory
✅ MySQL connected successfully
```

---

### Step 6 — Open the App

Open your browser and go to:

```
http://localhost:3000
```

---

## 🗄️ Database Tables

### `users`
| Column | Type | Description |
|---|---|---|
| id | INT | Primary key, auto-increment |
| full_name | VARCHAR(100) | Student's full name |
| email | VARCHAR(150) | Unique login email |
| password_hash | VARCHAR(255) | Bcrypt hashed password |
| college_id | VARCHAR(20) | e.g., KU2507U0210 |
| created_at | TIMESTAMP | Account creation time |

### `events`
| Column | Type | Description |
|---|---|---|
| id | INT | Primary key |
| title | VARCHAR(150) | Event name |
| icon | VARCHAR(10) | Emoji icon |
| category | ENUM | tech / cultural / workshop / sports |
| description | TEXT | Event description |
| event_date | VARCHAR(50) | Date string |
| venue | VARCHAR(200) | Location |
| max_seats | INT | Maximum capacity |

### `registrations`
| Column | Type | Description |
|---|---|---|
| id | INT | Primary key |
| user_id | INT | FK → users.id |
| event_id | INT | FK → events.id |
| full_name | VARCHAR(100) | Name on ticket |
| mobile_number | VARCHAR(15) | Contact number |
| college_id | VARCHAR(20) | College ID |
| department | VARCHAR(100) | Department name |
| ticket_id | VARCHAR(30) | Unique ticket code |
| registered_at | TIMESTAMP | Registration time |

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create new student account |
| POST | `/api/auth/login` | Login with email & password |
| GET | `/api/events` | Get all events with seat counts |
| POST | `/api/registrations` | Register for an event |
| GET | `/api/registrations/:userId` | Get user's registrations |

---

## ☁️ Migration to Google Cloud

To deploy this to Google Cloud Platform:

| Local | Google Cloud Equivalent |
|---|---|
| MySQL on laptop | **Cloud SQL (MySQL)** |
| Node.js `server.js` | **Cloud Run** (containerized) |
| Static files (Root) | Firebase Hosting / Cloud Storage |
| `.env` config | **Secret Manager** |
| Manual scaling | **Auto-scaling via Cloud Run** |

Steps:
1. Push code to GitHub
2. Create Cloud SQL instance (MySQL 8)
3. Deploy `server.js` to Cloud Run with Docker
4. Set environment variables in Cloud Run settings
5. Update the API_URL variable inside script.js to your Cloud Run service URL.

---

## 👨‍💻 Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MySQL (via `mysql2` driver)
- **Security**: `bcryptjs` for password hashing
- **Cloud Target**: Google Cloud Platform

---

## 📌 College ID Format

```
KU  2507  U  0210
↑    ↑    ↑   ↑
Uni Year Dept Roll
```

Example: `KU2507U0210`
