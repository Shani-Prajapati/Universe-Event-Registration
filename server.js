/* ============================================================
   UniVerse — College Event Registration System
   server.js  (Node.js + Express Backend)

   API Routes:
     POST  /api/auth/signup        → Register new user
     POST  /api/auth/login         → Login user
     GET   /api/events             → Get all events
     POST  /api/registrations      → Register for an event
     GET   /api/registrations/:uid → Get registrations by user
   ============================================================ */

const express    = require('express');
const mysql      = require('mysql2/promise');
const bcrypt     = require('bcryptjs');
const cors       = require('cors');
const path       = require('path');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve frontend static files from /public folder
app.use(express.static(path.join(__dirname, 'public')));

// ── DATABASE CONNECTION POOL ────────────────────────────────
const db = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'universe_db',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0
});

// Test DB connection on startup
(async () => {
  try {
    const conn = await db.getConnection();
    console.log('✅ MySQL connected successfully');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('   Make sure MySQL is running and .env is configured correctly.');
  }
})();

// ============================================================
// AUTH ROUTES
// ============================================================

/* ── SIGNUP  ──────────────────────────────────────────────
   POST /api/auth/signup
   Body: { full_name, email, college_id, password }
   SQL:  INSERT INTO users ...
   ─────────────────────────────────────────────────────── */
app.post('/api/auth/signup', async (req, res) => {
  const { full_name, email, college_id, password } = req.body;

  // Validate inputs
  if (!full_name || !email || !college_id || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
  }

  try {
    // Check if email already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Hash password before saving (never store plain text)
    const password_hash = await bcrypt.hash(password, 10);

    // INSERT INTO users
    const [result] = await db.query(
      'INSERT INTO users (full_name, email, college_id, password_hash) VALUES (?, ?, ?, ?)',
      [full_name, email, college_id, password_hash]
    );

    const user = { id: result.insertId, full_name, email, college_id };
    return res.status(201).json({ success: true, user });

  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/* ── LOGIN  ───────────────────────────────────────────────
   POST /api/auth/login
   Body: { email, password }
   SQL:  SELECT * FROM users WHERE email = ?
   ─────────────────────────────────────────────────────── */
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    // Fetch user by email
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const userRow = rows[0];

    // Compare hashed password
    const match = await bcrypt.compare(password, userRow.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Don't send password_hash to frontend
    const user = {
      id:         userRow.id,
      full_name:  userRow.full_name,
      email:      userRow.email,
      college_id: userRow.college_id
    };

    return res.json({ success: true, user });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================
// EVENTS ROUTES
// ============================================================

/* ── GET ALL EVENTS  ──────────────────────────────────────
   GET /api/events
   SQL: SELECT * FROM events
   ─────────────────────────────────────────────────────── */
app.get('/api/events', async (req, res) => {
  try {
    const [events] = await db.query(`
      SELECT 
        e.*,
        COUNT(r.id) AS filled_seats
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      GROUP BY e.id
      ORDER BY e.event_date ASC
    `);

    return res.json({ success: true, events });

  } catch (err) {
    console.error('Get events error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================
// REGISTRATION ROUTES
// ============================================================

/* ── REGISTER FOR EVENT  ──────────────────────────────────
   POST /api/registrations
   Body: { user_id, event_id, full_name, mobile_number, college_id, department }
   SQL:  INSERT INTO registrations ...
   ─────────────────────────────────────────────────────── */
app.post('/api/registrations', async (req, res) => {
  const { user_id, event_id, full_name, mobile_number, college_id, department } = req.body;

  if (!user_id || !event_id || !full_name || !mobile_number || !college_id || !department) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    // Check if event exists and has seats available
    const [eventRows] = await db.query('SELECT * FROM events WHERE id = ?', [event_id]);
    if (eventRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const event = eventRows[0];

    // Count current registrations
    const [[{ count }]] = await db.query(
      'SELECT COUNT(*) AS count FROM registrations WHERE event_id = ?', [event_id]
    );

    if (count >= event.max_seats) {
      return res.status(400).json({ success: false, message: 'Event is fully booked' });
    }

    // Check if user already registered for this event
    const [alreadyReg] = await db.query(
      'SELECT id FROM registrations WHERE user_id = ? AND event_id = ?', [user_id, event_id]
    );
    if (alreadyReg.length > 0) {
      return res.status(409).json({ success: false, message: 'You are already registered for this event' });
    }

    // Generate ticket ID
    const ticket_id = `#TKT-${Date.now().toString(36).toUpperCase().slice(-6)}`;

    // INSERT INTO registrations
    await db.query(
      `INSERT INTO registrations 
        (user_id, event_id, full_name, mobile_number, college_id, department, ticket_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, event_id, full_name, mobile_number, college_id, department, ticket_id]
    );

    return res.status(201).json({ success: true, ticket_id });

  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/* ── GET REGISTRATIONS BY USER  ──────────────────────────
   GET /api/registrations/:userId
   SQL: SELECT * FROM registrations WHERE user_id = ?
   ─────────────────────────────────────────────────────── */
app.get('/api/registrations/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const [rows] = await db.query(`
      SELECT r.*, e.title AS event_title, e.event_date, e.venue, e.icon
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.user_id = ?
      ORDER BY r.registered_at DESC
    `, [userId]);

    return res.json({ success: true, registrations: rows });

  } catch (err) {
    console.error('Get registrations error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── CATCH-ALL: Serve index.html for any other route ────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── START SERVER ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 UniVerse server running at http://localhost:${PORT}`);
  console.log(`📁 Serving frontend from: ./public/`);
  console.log(`🗄️  Connected to MySQL database: ${process.env.DB_NAME || 'universe_db'}\n`);
});
