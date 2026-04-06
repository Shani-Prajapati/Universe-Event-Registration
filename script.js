/* ============================================================
   UniVerse — College Event Registration System
   script.js  (Frontend JavaScript)
   
   All API calls go to the Node.js + Express backend (server.js)
   which connects to MySQL database.
   ============================================================ */

const API = 'http://localhost:3000/api';  // Change to your server URL in production

// ── EVENT DATA (loaded from backend on page load) ──
let EVENTS = [];
let currentFilter = 'all';
let currentUser = null;   // Set after login
let currentEventId = null;

// ============================================================
// ON PAGE LOAD
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  loadEvents();
  checkSession();
});

// ============================================================
// LOAD EVENTS FROM BACKEND (GET /api/events)
// ============================================================
async function loadEvents() {
  try {
    const res = await fetch(`${API}/events`);
    const data = await res.json();
    if (data.success) {
      EVENTS = data.events;
      renderEvents('all');
    }
  } catch (err) {
    // Fallback to static data if backend not running
    console.warn('Backend not reachable. Using static data.');
    EVENTS = STATIC_EVENTS;
    renderEvents('all');
  }
}

// ============================================================
// RENDER EVENT CARDS
// ============================================================
function renderEvents(filter) {
  const grid = document.getElementById('eventsGrid');
  const filtered = filter === 'all' ? EVENTS : EVENTS.filter(e => e.category === filter);

  grid.innerHTML = filtered.map(ev => {
    const pct = Math.round((ev.filled_seats / ev.max_seats) * 100);
    const nearFull = pct >= 90;
    const fillColor = nearFull ? '#ff6b6b' : pct >= 60 ? '#ffd166' : '#06d6a0';
    const badges = ev.badges ? JSON.parse(ev.badges) : [];

    return `
    <div class="event-card" data-id="${ev.id}" data-category="${ev.category}">
      <div class="card-banner">
        <div class="card-banner-bg" style="background:linear-gradient(135deg,${ev.color}15,${ev.color}05)">${ev.icon}</div>
        <div class="card-banner-overlay"></div>
        <div class="card-badges">
          ${badges.map(b => `<span class="badge" style="background:${b.color};color:${b.text};border:1px solid ${b.color}">${b.label}</span>`).join('')}
        </div>
      </div>
      <div class="card-body">
        <div class="card-meta">
          <span class="meta-item">📅 ${ev.event_date}</span>
          <span class="meta-item">📍 ${ev.venue}</span>
        </div>
        <div class="card-title">${ev.title}</div>
        <div class="card-desc">${ev.description}</div>
        <div class="card-footer">
          <div class="seats-bar">
            <div class="seats-label">${ev.filled_seats}/${ev.max_seats} seats filled</div>
            <div class="seats-track">
              <div class="seats-fill" style="width:${pct}%;background:${fillColor}"></div>
            </div>
          </div>
          <button class="btn-register"
            style="background:${ev.color}; color:#fff; box-shadow:0 0 16px ${ev.color}40; position:relative; z-index:99;"
            onclick="openRegisterModal(${ev.id})">
            ${nearFull ? '⚡ Last Spots' : 'Register'}
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function filterEvents(cat, btn) {
  currentFilter = cat;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderEvents(cat);
}

// ============================================================
// MODAL HELPERS
// ============================================================
function openModal(id)  { document.getElementById(id).classList.add('open'); }

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  if (id === 'registerModal') {
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('successState').classList.remove('show');
    ['regName', 'regMobile', 'regCollegeId'].forEach(f => {
      const el = document.getElementById(f);
      if (el) el.value = '';
    });
    const dept = document.getElementById('regDept');
    if (dept) dept.selectedIndex = 0;
  }
}

function switchModal(from, to) {
  closeModal(from);
  setTimeout(() => openModal(to), 150);
}

// Close modal on background click
document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', e => {
    if (e.target === el) closeModal(el.id);
  });
});

// ============================================================
// AUTH — LOGIN  →  POST /api/auth/login
// ============================================================
async function doLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) { showToast('⚠️', 'Please fill all fields'); return; }

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.success) {
      currentUser = data.user;
      closeModal('loginModal');
      updateAuthUI();
      showToast('✓', `Welcome back, ${currentUser.full_name.split(' ')[0]}!`);
    } else {
      showToast('❌', data.message || 'Invalid email or password');
    }
  } catch (err) {
    showToast('❌', 'Cannot reach server. Is it running?');
  }
}

// ============================================================
// AUTH — SIGNUP  →  POST /api/auth/signup
// ============================================================
async function doSignup() {
  const first      = document.getElementById('signupFirst').value.trim();
  const last       = document.getElementById('signupLast').value.trim();
  const email      = document.getElementById('signupEmail').value.trim();
  const college_id = document.getElementById('signupCollegeId').value.trim();
  const password   = document.getElementById('signupPassword').value;

  if (!first || !last || !email || !college_id || !password) {
    showToast('⚠️', 'Please fill all fields'); return;
  }
  if (!college_id.match(/^KU\d{4}[A-Z]\d{4}$/)) {
    showToast('⚠️', 'Invalid College ID (e.g. KU2507U0210)'); return;
  }
  if (password.length < 8) {
    showToast('⚠️', 'Password must be at least 8 characters'); return;
  }

  try {
    const res = await fetch(`${API}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: `${first} ${last}`, email, college_id, password })
    });
    const data = await res.json();

    if (data.success) {
      currentUser = data.user;
      closeModal('signupModal');
      updateAuthUI();
      showToast('🎉', `Welcome to UniVerse, ${first}!`);
    } else {
      showToast('❌', data.message || 'Signup failed');
    }
  } catch (err) {
    showToast('❌', 'Cannot reach server. Is it running?');
  }
}

// ============================================================
// AUTH — LOGOUT
// ============================================================
function logout() {
  currentUser = null;
  updateAuthUI();
  showToast('👋', 'Signed out successfully');
}

// ============================================================
// CHECK SESSION (on page load)
// ============================================================
function checkSession() {
  const saved = sessionStorage.getItem('universe_user');
  if (saved) {
    currentUser = JSON.parse(saved);
    updateAuthUI();
  }
}

// ============================================================
// UPDATE NAV UI AFTER AUTH
// ============================================================
function updateAuthUI() {
  const loggedIn = !!currentUser;
  document.getElementById('loginBtn').style.display  = loggedIn ? 'none' : '';
  document.getElementById('signupBtn').style.display = loggedIn ? 'none' : '';
  document.getElementById('logoutBtn').style.display = loggedIn ? '' : 'none';

  const av = document.getElementById('userAvatar');
  av.style.display = loggedIn ? 'flex' : 'none';
  if (loggedIn) {
    const parts = currentUser.full_name.split(' ');
    av.textContent = (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
    sessionStorage.setItem('universe_user', JSON.stringify(currentUser));
  } else {
    sessionStorage.removeItem('universe_user');
  }
}

// ============================================================
// OPEN REGISTER MODAL
// ============================================================
function openRegisterModal(eventId) {
  // This will print a message in your console so we know it clicked!
  console.log("Button clicked! Looking for Event ID:", eventId);

  if (!currentUser) {
    showToast('🔐', 'Please sign in to register for events');
    setTimeout(() => openModal('loginModal'), 800);
    return;
  }

  // Notice the == instead of === here to prevent silent crashes
  const ev = EVENTS.find(e => e.id == eventId); 
  
  if (!ev) {
    console.error("Could not find this event in the database!");
    return; 
  }

  currentEventId = eventId;
  document.getElementById('regEventIcon').textContent = ev.icon;
  document.getElementById('regEventName').textContent = ev.title;
  document.getElementById('regEventDate').textContent = `${ev.event_date} · ${ev.venue}`;
  document.getElementById('regName').value = currentUser.full_name || '';
  
  if (currentUser.college_id) {
     document.getElementById('regCollegeId').value = currentUser.college_id;
  }

  openModal('registerModal');
}
// ============================================================
// SUBMIT REGISTRATION  →  POST /api/registrations
// ============================================================
async function submitRegistration() {
  const full_name    = document.getElementById('regName').value.trim();
  const mobile_number = document.getElementById('regMobile').value.trim();
  const college_id   = document.getElementById('regCollegeId').value.trim();
  const department   = document.getElementById('regDept').value;

  if (!full_name || !mobile_number || !college_id || !department) {
    showToast('⚠️', 'Please fill all required fields'); return;
  }
  if (!mobile_number.replace(/\s/g, '').match(/^(\+91)?[6-9]\d{9}$/)) {
    showToast('⚠️', 'Enter a valid 10-digit mobile number'); return;
  }
  if (!college_id.match(/^KU\d{4}[A-Z]\d{4}$/)) {
    showToast('⚠️', 'Invalid College ID format (e.g. KU2507U0210)'); return;
  }

  try {
    const res = await fetch(`${API}/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser.id,
        event_id: currentEventId,
        full_name,
        mobile_number,
        college_id,
        department
      })
    });
    const data = await res.json();

    if (data.success) {
      document.getElementById('ticketId').textContent = data.ticket_id;
      document.getElementById('registerForm').style.display = 'none';
      document.getElementById('successState').classList.add('show');

      // Update seat count live
      const ev = EVENTS.find(e => e.id === currentEventId);
      if (ev && ev.filled_seats < ev.max_seats) { ev.filled_seats++; renderEvents(currentFilter); }

      showToast('🎟️', 'Registration confirmed!');
    } else {
      showToast('❌', data.message || 'Registration failed');
    }
  } catch (err) {
    showToast('❌', 'Cannot reach server. Is it running?');
  }
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function showToast(icon, msg) {
  const t = document.getElementById('toast');
  document.getElementById('toastIcon').textContent = icon;
  document.getElementById('toastMsg').textContent  = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ============================================================
// STATIC FALLBACK DATA (shown if backend is offline)
// ============================================================
const STATIC_EVENTS = [
  { id:1, icon:'💻', title:'TECH FEST 2025', category:'tech', event_date:'Apr 18–20', venue:'Main Auditorium', description:'Three days of hackathons, coding contests, and tech talks by industry leaders.', color:'#4a9eff', max_seats:120, filled_seats:87, badges: JSON.stringify([{label:'Flagship',color:'rgba(74,158,255,0.2)',text:'#4a9eff'},{label:'Free Entry',color:'rgba(6,214,160,0.15)',text:'#06d6a0'}]) },
  { id:2, icon:'🎭', title:'CULTURAL NITE', category:'cultural', event_date:'Apr 25', venue:'Open Air Theatre', description:'Dance, music, drama, and fashion show — a night to celebrate campus talent.', color:'#ff6b6b', max_seats:300, filled_seats:210, badges: JSON.stringify([{label:'Cultural',color:'rgba(255,107,107,0.2)',text:'#ff6b6b'}]) },
  { id:3, icon:'🤖', title:'AI/ML WORKSHOP', category:'workshop', event_date:'May 3', venue:'CS Lab A-204', description:'Hands-on workshop on Machine Learning fundamentals using Python and TensorFlow.', color:'#ffd166', max_seats:40, filled_seats:38, badges: JSON.stringify([{label:'Workshop',color:'rgba(255,209,102,0.2)',text:'#ffd166'},{label:'Limited',color:'rgba(255,107,107,0.15)',text:'#ff6b6b'}]) },
  { id:4, icon:'⚽', title:'SPORTS MANIA', category:'sports', event_date:'May 10–12', venue:'Sports Complex', description:'Inter-department tournament covering cricket, football, badminton, and more.', color:'#06d6a0', max_seats:200, filled_seats:145, badges: JSON.stringify([{label:'Sports',color:'rgba(6,214,160,0.2)',text:'#06d6a0'}]) },
  { id:5, icon:'🎨', title:'DESIGN JAM', category:'workshop', event_date:'May 7', venue:'Art & Design Studio', description:'UI/UX design sprint — conceptualize and prototype a real product in 6 hours.', color:'#a78bfa', max_seats:35, filled_seats:20, badges: JSON.stringify([{label:'Workshop',color:'rgba(167,139,250,0.2)',text:'#a78bfa'}]) },
  { id:6, icon:'🎵', title:'MUSIC FEST', category:'cultural', event_date:'May 15', venue:'Amphitheatre', description:'Battle of bands, solo performances, and a DJ night to close the semester.', color:'#f97316', max_seats:500, filled_seats:320, badges: JSON.stringify([{label:'Cultural',color:'rgba(249,115,22,0.2)',text:'#f97316'}]) },
  { id:7, icon:'🔐', title:'CYBERSECURITY CTF', category:'tech', event_date:'May 20', venue:'Online + CS Dept', description:'Capture The Flag competition. Test your hacking & security skills.', color:'#4a9eff', max_seats:80, filled_seats:55, badges: JSON.stringify([{label:'Tech',color:'rgba(74,158,255,0.2)',text:'#4a9eff'},{label:'Prizes',color:'rgba(255,209,102,0.15)',text:'#ffd166'}]) },
  { id:8, icon:'🌱', title:'STARTUP PITCH', category:'tech', event_date:'May 22', venue:'Innovation Hub', description:'Pitch your startup idea to real investors. Top 3 ideas get incubation support.', color:'#06d6a0', max_seats:60, filled_seats:44, badges: JSON.stringify([{label:'Tech',color:'rgba(74,158,255,0.2)',text:'#4a9eff'},{label:'Prizes',color:'rgba(6,214,160,0.15)',text:'#06d6a0'}]) },
  { id:9, icon:'📸', title:'PHOTO WALK', category:'cultural', event_date:'May 18', venue:'Campus & City Tour', description:'Guided photography walk around campus and heritage streets with workshops.', color:'#ff6b6b', max_seats:25, filled_seats:18, badges: JSON.stringify([{label:'Cultural',color:'rgba(255,107,107,0.2)',text:'#ff6b6b'}]) },
];
