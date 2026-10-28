/* =============================================
   LIVETODO – APP LOGIC (v2.1 – Ember Dark + Cloud Backend & Vercel)
   ============================================= */

// ========== DATA STORE ==========
let state = {
  projects: [], clients: [], payments: [], todos: [], plans: [],
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  currentProjectFilter: 'all',
  currentTodoModal: null,
  user: null,
  currency: '₹',
};

let authToken = localStorage.getItem('livetodo_jwt_token') || null;
let cloudSyncTimer = null;
let appConfig = { googleClientId: '', hasDatabase: false };

function loadState() {
  const saved = localStorage.getItem('livetodo_state_v2');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
      state.currentMonth = new Date().getMonth();
      state.currentYear = new Date().getFullYear();
    } catch (e) {
      console.error('Error parsing local state:', e);
    }
  }
}

function saveState(skipCloud = false) {
  // Always persist instantly to localStorage for instantaneous offline/instant UX
  localStorage.setItem('livetodo_state_v2', JSON.stringify({
    projects: state.projects, clients: state.clients,
    payments: state.payments, todos: state.todos,
    plans: state.plans, user: state.user, currency: state.currency,
  }));

  // Trigger cloud sync if user is signed in
  if (!skipCloud && state.user) {
    scheduleCloudSync();
  }
}

// ========== CLOUD STATUS INDICATOR ==========
function setCloudStatus(type, text) {
  const badge = document.getElementById('cloudSyncBadge');
  const textEl = document.getElementById('cloudSyncText');
  if (!badge || !textEl) return;

  badge.className = 'cloud-sync-badge';
  if (type === 'syncing') {
    badge.classList.add('syncing');
  } else if (type === 'offline' || type === 'local') {
    badge.classList.add('offline');
  }

  textEl.textContent = text;
}

// ========== CLOUD BACKEND SYNC ==========
function scheduleCloudSync() {
  setCloudStatus('syncing', 'Syncing...');
  clearTimeout(cloudSyncTimer);
  cloudSyncTimer = setTimeout(performCloudSync, 800);
}

async function performCloudSync() {
  if (!state.user) {
    setCloudStatus('local', 'Local Mode');
    return;
  }

  try {
    const payload = {
      projects: state.projects,
      clients: state.clients,
      payments: state.payments,
      todos: state.todos,
      plans: state.plans,
      currency: state.currency,
      userProfile: {
        name: state.user.name,
        role: state.user.role
      }
    };

    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const res = await fetch('/api/data', {
      method: 'POST',
      headers,
      body: JSON.stringify({ data: payload })
    });

    if (res.ok) {
      const json = await res.json();
      if (json.status === 'no_database') {
        setCloudStatus('local', 'Saved (Local)');
      } else {
        setCloudStatus('synced', 'Cloud Synced');
      }
    } else {
      setCloudStatus('local', 'Saved (Local)');
    }
  } catch (err) {
    // Network / offline fallback
    setCloudStatus('offline', 'Saved Locally');
  }
}

async function fetchCloudData() {
  if (!authToken) return;
  setCloudStatus('syncing', 'Loading Cloud Data...');

  try {
    const res = await fetch('/api/data', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        if (d.projects) state.projects = d.projects;
        if (d.clients) state.clients = d.clients;
        if (d.payments) state.payments = d.payments;
        if (d.todos) state.todos = d.todos;
        if (d.plans) state.plans = d.plans;
        if (d.currency) state.currency = d.currency;
        if (d.userProfile) {
          if (d.userProfile.name) state.user.name = d.userProfile.name;
          if (d.userProfile.role) state.user.role = d.userProfile.role;
        }
        saveState(true);
        setCloudStatus('synced', 'Cloud Synced');
        renderDashboard();
        renderPlanner();
        updateSidebarProfile();
      } else if (json.status === 'no_database') {
        setCloudStatus('local', 'Local Mode');
      } else {
        // New user with empty cloud data, seed starter items
        if (state.projects.length === 0 && state.clients.length === 0) {
          seedDemo();
        }
        setCloudStatus('synced', 'Cloud Synced');
      }
    }
  } catch (err) {
    console.warn('Could not fetch cloud data, using local state:', err);
    setCloudStatus('local', 'Local Mode');
  }
}

// ========== HELPERS ==========
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function formatCurrency(n) {
  return state.currency + Number(n || 0).toLocaleString('en-IN');
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function catEmoji(cat) {
  return { editing: '✂️', website: '🌐', reels: '🎬', other: '📦' }[cat] || '📦';
}
function catLabel(cat) {
  return { editing: 'Editing', website: 'Website', reels: 'Reels', other: 'Other' }[cat] || cat;
}
function statusLabel(s) {
  return { inprogress: 'In Progress', pending: 'Pending', completed: 'Completed' }[s] || s;
}
function getClientName(id) { return (state.clients.find(c => c.id === id) || {}).name || '—'; }
function getProjectName(id) { return (state.projects.find(p => p.id === id) || {}).name || '—'; }

// ========== EMBER SPARKS ==========
function createSparks() {
  const container = document.getElementById('emberSparks');
  if (!container) return;
  const count = 18;
  for (let i = 0; i < count; i++) {
    const spark = document.createElement('div');
    spark.className = 'spark';
    const left = Math.random() * 100;
    const duration = 4 + Math.random() * 6;
    const delay = Math.random() * 8;
    const drift = (Math.random() - 0.5) * 80;
    const size = 2 + Math.random() * 3;
    const colors = ['#fb923c','#f43f5e','#fbbf24','#f97316'];
    spark.style.cssText = `
      left: ${left}%; width: ${size}px; height: ${size}px;
      --drift: ${drift}px;
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
      background: ${colors[Math.floor(Math.random()*colors.length)]};
    `;
    container.appendChild(spark);
  }
}

// ========== UI HELPERS ==========
function showToast(msg, emoji = '🔥') {
  const toast = document.getElementById('toast');
  toast.textContent = emoji + '  ' + msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

function openModal(id) {
  if (id === 'addProjectModal') populateClientDropdowns('proj-client');
  if (id === 'addPaymentModal') {
    populateClientDropdowns('pay-client');
    populateProjectDropdowns('pay-project');
  }
  if (id === 'profileModal') {
    document.getElementById('edit-name').value = state.user?.name || '';
    document.getElementById('edit-role').value = state.user?.role || '';
    document.getElementById('edit-currency').value = state.currency;
    updateProfileAvatarBig();
  }
  document.getElementById(id).classList.add('open');
}

function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.addEventListener('click', e => {
  if (!e.target.closest('.sidebar-footer') && !e.target.closest('.profile-menu')) {
    document.getElementById('profileMenu')?.classList.remove('open');
  }
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

function populateClientDropdowns(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const firstOpt = sel.options[0];
  sel.innerHTML = '';
  sel.appendChild(firstOpt);
  state.clients.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id; opt.textContent = c.name;
    sel.appendChild(opt);
  });
}
function populateProjectDropdowns(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const firstOpt = sel.options[0];
  sel.innerHTML = '';
  sel.appendChild(firstOpt);
  state.projects.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id; opt.textContent = p.name;
    sel.appendChild(opt);
  });
}

// ========== GOOGLE SIGN IN ==========
async function handleGoogleSignIn(response) {
  showToast('Connecting with Google...', '🔐');

  try {
    // 1. Send token to backend to verify and authenticate
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: response.credential })
    });

    if (res.ok) {
      const data = await res.json();
      authToken = data.token;
      localStorage.setItem('livetodo_jwt_token', authToken);
      state.user = {
        ...data.user,
        role: 'Freelancer',
        signedInWith: 'google'
      };
      saveState(true);
      enterApp();
      await fetchCloudData();
      showToast(`Welcome back, ${state.user.name}!`, '🎉');
      return;
    }
  } catch (e) {
    console.warn('Backend Google Auth failed, falling back to direct client decode:', e);
  }

  // Fallback: decode JWT in client if backend is in static mode
  try {
    const base64Url = response.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));

    state.user = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      given_name: payload.given_name,
      role: 'Freelancer',
      signedInWith: 'google',
    };
    saveState();
    enterApp();
    showToast(`Welcome, ${state.user.name}!`, '🎉');
  } catch (err) {
    console.error('Error decoding credential:', err);
    showToast('Sign in error. Try Demo mode.', '⚠️');
  }
}

function signInAsDemo() {
  state.user = {
    name: 'Freelancer',
    email: 'demo@livetodo.app',
    picture: '',
    given_name: 'Freelancer',
    role: 'Video Editor · Web Developer · Content Creator',
    signedInWith: 'demo',
  };
  saveState(true);
  seedDemo();
  enterApp();
  setCloudStatus('local', 'Demo Mode');
  showToast('Signed in as Demo User!', '🚀');
}

function signOut() {
  if (!confirm('Sign out of LiveToDo?')) return;
  if (typeof google !== 'undefined' && google.accounts) {
    google.accounts.id.disableAutoSelect();
  }
  authToken = null;
  localStorage.removeItem('livetodo_jwt_token');
  state.user = null;
  saveState(true);
  document.getElementById('appContainer').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  showToast('Signed out successfully', '👋');
}

function enterApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appContainer').style.display = 'flex';
  updateSidebarProfile();
  setGreeting();
  renderDashboard();
  renderPlanner();
}

function updateSidebarProfile() {
  const u = state.user;
  if (!u) return;
  document.getElementById('spName').textContent = u.name || 'Freelancer';
  document.getElementById('spEmail').textContent = u.email || '';

  const avatarImg = document.getElementById('spAvatar');
  const avatarFallback = document.getElementById('spAvatarFallback');

  if (u.picture) {
    avatarImg.src = u.picture;
    avatarImg.style.display = 'block';
    avatarFallback.style.display = 'none';
  } else {
    avatarImg.style.display = 'none';
    avatarFallback.style.display = 'flex';
    avatarFallback.textContent = (u.name || 'F')[0].toUpperCase();
  }
}

function updateProfileAvatarBig() {
  const u = state.user;
  if (!u) return;
  const el = document.getElementById('profileAvatarBig');
  if (u.picture) {
    el.innerHTML = `<img src="${u.picture}" alt="${u.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
  } else {
    el.textContent = (u.name || 'F')[0].toUpperCase();
  }
}

function toggleProfileMenu() {
  document.getElementById('profileMenu').classList.toggle('open');
}

function saveProfile() {
  const name = document.getElementById('edit-name').value.trim();
  const role = document.getElementById('edit-role').value.trim();
  const currency = document.getElementById('edit-currency').value;
  if (name) state.user.name = name;
  if (role) state.user.role = role;
  state.currency = currency;
  saveState();
  updateSidebarProfile();
  closeModal('profileModal');
  showToast('Profile updated!', '✅');
  renderDashboard();
}

// ========== NAVIGATION ==========
function switchView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('view-' + viewName).classList.add('active');
  document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

  if (viewName === 'projects') renderProjects();
  if (viewName === 'clients') renderClients();
  if (viewName === 'payments') renderPayments();
  if (viewName === 'planner') renderPlanner();
  if (viewName === 'todos') renderTodos();
  if (viewName === 'dashboard') renderDashboard();

  document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }

// ========== GREETING ==========
function setGreeting() {
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = state.user?.given_name || state.user?.name || 'Freelancer';
  const greetEl = document.getElementById('greetingText');
  if (greetEl) greetEl.textContent = `${greet}, ${name}! Here's your freelance overview.`;

  const dateEl = document.getElementById('todayDate');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

// ========== DASHBOARD ==========
function renderDashboard() {
  const activeProjects = state.projects.filter(p => p.status !== 'completed').length;
  const pendingPay = state.payments.filter(p => p.status !== 'received').reduce((s, p) => s + Number(p.amount || 0), 0);
  const earnedPay = state.payments.filter(p => p.status === 'received').reduce((s, p) => s + Number(p.amount || 0), 0);

  document.getElementById('stat-projects').textContent = activeProjects;
  document.getElementById('stat-clients').textContent = state.clients.length;
  document.getElementById('stat-pending').textContent = formatCurrency(pendingPay);
  document.getElementById('stat-earned').textContent = formatCurrency(earnedPay);

  const recentEl = document.getElementById('recentProjectsList');
  const recent = [...state.projects].reverse().slice(0, 5);
  if (recent.length === 0) {
    recentEl.innerHTML = '<div class="empty-state">No projects yet. Click <b>+ New Project</b> to start!</div>';
  } else {
    recentEl.innerHTML = recent.map(p => `
      <div class="project-list-item" onclick="viewProjectDetail('${p.id}')">
        <span class="pli-cat-badge">${catEmoji(p.cat)}</span>
        <div class="pli-info">
          <div class="pli-name">${p.name}</div>
          <div class="pli-sub">${getClientName(p.clientId)} · ${p.deadline ? formatDate(p.deadline) : 'No deadline'}</div>
        </div>
        <span class="pli-status status-${p.status}">${statusLabel(p.status)}</span>
      </div>
    `).join('');
  }

  renderDashboardTodos();

  const payEl = document.getElementById('dashboardPaymentList');
  const recentPays = [...state.payments].reverse().slice(0, 5);
  if (recentPays.length === 0) {
    payEl.innerHTML = '<div class="empty-state">No payments recorded yet.</div>';
  } else {
    payEl.innerHTML = recentPays.map(pay => `
      <div class="pay-ov-item">
        <div class="pay-ov-left">
          <span>${catEmoji('other')}</span>
          <div>
            <div class="pay-ov-client">${getClientName(pay.clientId)}</div>
            <div class="pay-ov-proj">${getProjectName(pay.projectId)}</div>
          </div>
        </div>
        <div class="${pay.status === 'received' ? 'pay-received-amt' : 'pay-pending-amt'} pay-ov-amount">
          ${formatCurrency(pay.amount)}
          <span class="pay-status-badge pay-stat-${pay.status}" style="margin-left:8px;">${pay.status}</span>
        </div>
      </div>
    `).join('');
  }
}

function renderDashboardTodos() {
  const todayTodos = state.todos.filter(t => !t.done).slice(0, 7);
  const list = document.getElementById('dashboardTodoList');
  if (!list) return;
  if (todayTodos.length === 0) {
    list.innerHTML = '<div class="empty-state">All caught up! 🎉</div>';
    return;
  }
  list.innerHTML = todayTodos.map(t => buildTodoItem(t, true)).join('');
}

function buildTodoItem(t, dashboard = false) {
  return `
    <div class="todo-item" id="todoitem-${t.id}">
      <div class="todo-check ${t.done ? 'checked' : ''}" onclick="toggleTodo('${t.id}')"></div>
      <span class="priority-dot p-${t.priority || 'medium'}"></span>
      <span class="todo-text ${t.done ? 'done' : ''}">${t.text}</span>
      ${dashboard ? '' : `<span style="font-size:0.72rem;color:var(--text-muted);">${catEmoji(t.cat)}</span>`}
      <button class="todo-del" onclick="deleteTodo('${t.id}')">✕</button>
    </div>
  `;
}

// ========== QUICK TODO ==========
function quickAddTodo(e) { if (e.key === 'Enter') quickAddTodoBtn(); }
function quickAddTodoBtn() {
  const input = document.getElementById('quickTodoInput');
  const text = input.value.trim();
  if (!text) return;
  state.todos.unshift({ id: genId(), text, cat: 'other', priority: 'medium', done: false, createdAt: new Date().toISOString() });
  saveState();
  input.value = '';
  renderDashboardTodos();
  showToast('Task added!', '✅');
}

// ========== PROJECTS ==========
function addProject() {
  const name = document.getElementById('proj-name').value.trim();
  if (!name) { showToast('Enter a project name!', '⚠️'); return; }
  state.projects.push({
    id: genId(), name,
    cat: document.getElementById('proj-cat').value,
    status: document.getElementById('proj-status').value,
    clientId: document.getElementById('proj-client').value,
    budget: document.getElementById('proj-budget').value,
    deadline: document.getElementById('proj-deadline').value,
    desc: document.getElementById('proj-desc').value,
    createdAt: new Date().toISOString(), todos: [], updates: [],
  });
  saveState();
  closeModal('addProjectModal');
  ['proj-name','proj-budget','proj-deadline','proj-desc'].forEach(id => document.getElementById(id).value = '');
  renderProjects(); renderDashboard();
  showToast('Project created!', '🗂️');
}

function deleteProject(id) {
  if (!confirm('Delete this project?')) return;
  state.projects = state.projects.filter(p => p.id !== id);
  saveState(); renderProjects(); renderDashboard();
  showToast('Project deleted', '🗑️');
}

function filterProjects(cat) {
  state.currentProjectFilter = cat;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.toggle('active', t.dataset.cat === cat));
  renderProjects();
}

function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  let projects = [...state.projects].reverse();
  if (state.currentProjectFilter !== 'all') projects = projects.filter(p => p.cat === state.currentProjectFilter);
  if (projects.length === 0) {
    grid.innerHTML = '<div class="empty-state full-width">No projects found. Add a new one!</div>'; return;
  }
  grid.innerHTML = projects.map(p => `
    <div class="project-card cat-${p.cat}" onclick="viewProjectDetail('${p.id}')">
      <div class="pc-top">
        <span class="pc-cat">${catEmoji(p.cat)}</span>
        <span class="pc-status-badge status-${p.status}">${statusLabel(p.status)}</span>
      </div>
      <div class="pc-name">${p.name}</div>
      <div class="pc-client">👤 ${getClientName(p.clientId)} · ${catLabel(p.cat)}</div>
      ${p.desc ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:10px;">${p.desc.substring(0,80)}${p.desc.length>80?'...':''}</div>` : ''}
      <div class="pc-footer">
        <span class="pc-budget">${p.budget ? formatCurrency(p.budget) : '—'}</span>
        <span class="pc-deadline">📅 ${p.deadline ? formatDate(p.deadline) : 'No deadline'}</span>
      </div>
      <div class="pc-actions" onclick="event.stopPropagation()">
        <button class="pc-action-btn btn-edit" onclick="viewProjectDetail('${p.id}')">View Details</button>
        <button class="pc-action-btn btn-delete" onclick="deleteProject('${p.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function viewProjectDetail(id) {
  const p = state.projects.find(p => p.id === id);
  if (!p) return;
  document.getElementById('detailProjectName').textContent = catEmoji(p.cat) + ' ' + p.name;
  document.getElementById('projectDetailBody').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">
      <div class="glass-card" style="padding:14px;">
        <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px;">STATUS</div>
        <span class="pli-status status-${p.status}">${statusLabel(p.status)}</span>
      </div>
      <div class="glass-card" style="padding:14px;">
        <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px;">BUDGET</div>
        <div style="font-size:1.1rem;font-weight:700;color:var(--green);">${p.budget ? formatCurrency(p.budget) : '—'}</div>
      </div>
      <div class="glass-card" style="padding:14px;">
        <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px;">CLIENT</div>
        <div style="font-weight:600;">${getClientName(p.clientId)}</div>
      </div>
      <div class="glass-card" style="padding:14px;">
        <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px;">DEADLINE</div>
        <div style="font-weight:600;">${p.deadline ? formatDate(p.deadline) : 'No deadline'}</div>
      </div>
    </div>
    ${p.desc ? `<div class="glass-card" style="padding:14px;margin-bottom:16px;">
      <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px;">DESCRIPTION</div>
      <div style="font-size:0.9rem;color:var(--text-secondary);">${p.desc}</div>
    </div>` : ''}
    <div class="glass-card" style="padding:16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div style="font-size:0.9rem;font-weight:700;">Project Tasks</div>
        <div style="display:flex;gap:8px;">
          <input type="text" id="proj-todo-input-${id}" placeholder="Add task..." style="padding:6px 10px;font-size:0.82rem;width:180px;" onkeydown="if(event.key==='Enter')addProjectTodo('${id}')" />
          <button class="btn btn-sm btn-primary" onclick="addProjectTodo('${id}')">Add</button>
        </div>
      </div>
      <div id="proj-todo-list-${id}">
        ${(p.todos||[]).length===0
          ? '<div class="empty-state">No tasks yet.</div>'
          : (p.todos||[]).map(t => `
          <div class="todo-item">
            <div class="todo-check ${t.done ? 'checked' : ''}" onclick="toggleProjectTodo('${id}','${t.id}')"></div>
            <span class="todo-text ${t.done ? 'done' : ''}">${t.text}</span>
            <button class="todo-del" onclick="deleteProjectTodo('${id}','${t.id}')">✕</button>
          </div>`).join('')}
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">
      <button class="btn btn-ghost btn-sm" onclick="changeProjectStatus('${id}','inprogress')">In Progress</button>
      <button class="btn btn-ghost btn-sm" onclick="changeProjectStatus('${id}','completed')">Completed</button>
      <button class="btn btn-ghost btn-sm" onclick="changeProjectStatus('${id}','pending')">Pending</button>
    </div>
  `;
  openModal('projectDetailModal');
}

function changeProjectStatus(id, status) {
  const p = state.projects.find(p => p.id === id);
  if (p) { p.status = status; saveState(); viewProjectDetail(id); renderDashboard(); showToast('Status updated!'); }
}

function addProjectTodo(projectId) {
  const input = document.getElementById(`proj-todo-input-${projectId}`);
  const text = input.value.trim();
  if (!text) return;
  const p = state.projects.find(p => p.id === projectId);
  if (!p) return;
  if (!p.todos) p.todos = [];
  p.todos.push({ id: genId(), text, done: false });
  saveState(); input.value = '';
  viewProjectDetail(projectId);
}

function toggleProjectTodo(projectId, todoId) {
  const p = state.projects.find(p => p.id === projectId);
  if (!p) return;
  const t = p.todos.find(t => t.id === todoId);
  if (t) { t.done = !t.done; saveState(); viewProjectDetail(projectId); }
}

function deleteProjectTodo(projectId, todoId) {
  const p = state.projects.find(p => p.id === projectId);
  if (!p) return;
  p.todos = p.todos.filter(t => t.id !== todoId);
  saveState(); viewProjectDetail(projectId);
}

// ========== CLIENTS ==========
function addClient() {
  const name = document.getElementById('client-name').value.trim();
  if (!name) { showToast('Enter a client name!', '⚠️'); return; }
  state.clients.push({
    id: genId(), name,
    platform: document.getElementById('client-platform').value,
    contact: document.getElementById('client-contact').value,
    cat: document.getElementById('client-cat').value,
    notes: document.getElementById('client-notes').value,
    createdAt: new Date().toISOString(),
  });
  saveState(); closeModal('addClientModal');
  ['client-name','client-platform','client-contact','client-notes'].forEach(id => document.getElementById(id).value = '');
  renderClients(); showToast('Client added!', '👤');
}

function deleteClient(id) {
  if (!confirm('Delete this client?')) return;
  state.clients = state.clients.filter(c => c.id !== id);
  saveState(); renderClients(); showToast('Client deleted', '🗑️');
}

function renderClients() {
  const grid = document.getElementById('clientsGrid');
  if (state.clients.length === 0) {
    grid.innerHTML = '<div class="empty-state full-width">No clients yet.</div>'; return;
  }
  grid.innerHTML = state.clients.map(c => {
    const projectCount = state.projects.filter(p => p.clientId === c.id).length;
    const totalPaid = state.payments.filter(p => p.clientId === c.id && p.status === 'received').reduce((s,p) => s + Number(p.amount||0), 0);
    return `
      <div class="client-card">
        <button class="cc-del-btn" onclick="deleteClient('${c.id}')">✕</button>
        <div class="cc-top">
          <div class="cc-avatar">${c.name[0].toUpperCase()}</div>
          <div>
            <div class="cc-name">${c.name}</div>
            <div class="cc-platform">${catEmoji(c.cat)} ${c.platform || 'Direct'}</div>
          </div>
        </div>
        <div class="cc-stats">
          <div class="cc-stat"><div class="cc-stat-val">${projectCount}</div><div class="cc-stat-lbl">Projects</div></div>
          <div class="cc-stat"><div class="cc-stat-val">${formatCurrency(totalPaid)}</div><div class="cc-stat-lbl">Paid</div></div>
        </div>
        ${c.contact ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px;">📞 ${c.contact}</div>` : ''}
        ${c.notes ? `<div class="cc-notes">${c.notes}</div>` : ''}
      </div>
    `;
  }).join('');
}

// ========== PAYMENTS ==========
function addPayment() {
  const amount = document.getElementById('pay-amount').value;
  if (!amount) { showToast('Enter payment amount!', '⚠️'); return; }
  state.payments.push({
    id: genId(),
    clientId: document.getElementById('pay-client').value,
    projectId: document.getElementById('pay-project').value,
    amount,
    status: document.getElementById('pay-status').value,
    due: document.getElementById('pay-due').value,
    notes: document.getElementById('pay-notes').value,
    createdAt: new Date().toISOString(),
  });
  saveState(); closeModal('addPaymentModal');
  ['pay-amount','pay-due','pay-notes'].forEach(id => document.getElementById(id).value = '');
  renderPayments(); renderDashboard();
  showToast('Payment logged!', '💰');
}

function markPaymentReceived(id) {
  const pay = state.payments.find(p => p.id === id);
  if (pay) { pay.status = 'received'; saveState(); renderPayments(); renderDashboard(); showToast('Payment received! 🎉', '✅'); }
}

function deletePayment(id) {
  if (!confirm('Delete this payment?')) return;
  state.payments = state.payments.filter(p => p.id !== id);
  saveState(); renderPayments(); renderDashboard();
  showToast('Payment deleted', '🗑️');
}

function renderPayments() {
  const tbody = document.getElementById('paymentsTableBody');
  if (state.payments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No payments logged yet.</td></tr>';
  } else {
    tbody.innerHTML = [...state.payments].reverse().map(pay => `
      <tr>
        <td><b>${getClientName(pay.clientId)}</b></td>
        <td>${getProjectName(pay.projectId)}</td>
        <td><span style="font-family:'Space Grotesk',sans-serif;font-weight:700;color:${pay.status==='received'?'var(--green)':'var(--amber)'};">${formatCurrency(pay.amount)}</span></td>
        <td><span class="pay-status-badge pay-stat-${pay.status}">${pay.status}</span></td>
        <td>${pay.due ? formatDate(pay.due) : '—'}</td>
        <td>
          ${pay.status !== 'received' ? `<button class="pay-mark-btn" onclick="markPaymentReceived('${pay.id}')">✅ Received</button>` : ''}
          <button class="pay-del-btn" onclick="deletePayment('${pay.id}')">✕</button>
        </td>
      </tr>
    `).join('');
  }
  const pending = state.payments.filter(p => p.status !== 'received').reduce((s,p) => s+Number(p.amount||0),0);
  const received = state.payments.filter(p => p.status === 'received').reduce((s,p) => s+Number(p.amount||0),0);
  const total = state.payments.reduce((s,p) => s+Number(p.amount||0),0);
  document.getElementById('totalPending').textContent = formatCurrency(pending);
  document.getElementById('totalReceived').textContent = formatCurrency(received);
  document.getElementById('totalBilled').textContent = formatCurrency(total);
}

// ========== MONTHLY PLANNER ==========
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function changeMonth(delta) {
  state.currentMonth += delta;
  if (state.currentMonth > 11) { state.currentMonth = 0; state.currentYear++; }
  if (state.currentMonth < 0) { state.currentMonth = 11; state.currentYear--; }
  renderPlanner();
}

function addPlan() {
  const title = document.getElementById('plan-title').value.trim();
  if (!title) { showToast('Enter a plan title!', '⚠️'); return; }
  state.plans.push({
    id: genId(), title,
    week: document.getElementById('plan-week').value,
    cat: document.getElementById('plan-cat').value,
    priority: document.getElementById('plan-priority').value,
    month: state.currentMonth, year: state.currentYear, done: false,
  });
  saveState(); closeModal('addPlanModal');
  document.getElementById('plan-title').value = '';
  renderPlanner(); showToast('Plan added!', '📅');
}

function deletePlan(id) {
  state.plans = state.plans.filter(p => p.id !== id);
  saveState(); renderPlanner();
}

function togglePlan(id) {
  const plan = state.plans.find(p => p.id === id);
  if (plan) { plan.done = !plan.done; saveState(); renderPlanner(); }
}

function renderPlanner() {
  const label = document.getElementById('currentMonthLabel');
  if (label) label.textContent = `${MONTHS[state.currentMonth]} ${state.currentYear}`;
  const monthPlans = state.plans.filter(p => p.month === state.currentMonth && p.year === state.currentYear);
  const grid = document.getElementById('plannerGrid');
  if (!grid) return;
  grid.innerHTML = [1,2,3,4].map(week => {
    const weekPlans = monthPlans.filter(p => Number(p.week) === week);
    return `
      <div class="week-col">
        <div class="week-col-header">🔥 Week ${week}</div>
        ${weekPlans.length === 0
          ? '<div class="empty-state" style="padding:16px;font-size:0.82rem;">Nothing planned yet</div>'
          : weekPlans.map(plan => `
          <div class="plan-item pri-${plan.priority}" style="${plan.done ? 'opacity:0.45;' : ''}">
            <div style="display:flex;align-items:center;gap:8px;">
              <div class="todo-check ${plan.done ? 'checked' : ''}" onclick="togglePlan('${plan.id}')" style="flex-shrink:0;"></div>
              <div class="plan-item-title" style="${plan.done ? 'text-decoration:line-through;color:var(--text-muted)' : ''}">${plan.title}</div>
            </div>
            <div class="plan-item-meta">
              <span class="plan-item-cat">${catEmoji(plan.cat)} ${catLabel(plan.cat)}</span>
              <button class="plan-item-del" onclick="deletePlan('${plan.id}')">✕</button>
            </div>
          </div>`).join('')}
        <button class="add-in-col-btn" onclick="setWeekForPlan(${week})">+ Add</button>
      </div>
    `;
  }).join('');
}

function setWeekForPlan(week) {
  document.getElementById('plan-week').value = week;
  openModal('addPlanModal');
}

// ========== TODOS ==========
function openTodoModal(cat) {
  state.currentTodoModal = cat;
  document.getElementById('todo-cat').value = cat;
  openModal('addTodoModal');
}

function addTodo() {
  const text = document.getElementById('todo-text').value.trim();
  if (!text) { showToast('Enter a task!', '⚠️'); return; }
  state.todos.unshift({
    id: genId(), text,
    cat: document.getElementById('todo-cat').value,
    priority: document.getElementById('todo-priority').value,
    done: false, createdAt: new Date().toISOString(),
  });
  saveState(); closeModal('addTodoModal');
  document.getElementById('todo-text').value = '';
  renderTodos(); renderDashboardTodos();
  showToast('Task added!', '✅');
}

function toggleTodo(id) {
  const t = state.todos.find(t => t.id === id);
  if (t) { t.done = !t.done; saveState(); renderTodos(); renderDashboardTodos(); }
}

function deleteTodo(id) {
  state.todos = state.todos.filter(t => t.id !== id);
  saveState(); renderTodos(); renderDashboardTodos();
  showToast('Task removed', '🗑️');
}

function renderTodos() {
  ['editing','website','reels','other'].forEach(cat => {
    const el = document.getElementById(`todos-${cat}`);
    if (!el) return;
    const catTodos = state.todos.filter(t => t.cat === cat);
    el.innerHTML = catTodos.length === 0
      ? '<div class="empty-state" style="padding:12px;font-size:0.82rem;">No tasks here</div>'
      : catTodos.map(t => buildTodoItem(t)).join('');
  });
}

// ========== DEMO DATA ==========
function seedDemo() {
  if (state.clients.length > 0) return;
  state.clients = [
    { id: 'c1', name: 'Alex Johnson', platform: 'Instagram DM', contact: '+91 98765 43210', cat: 'reels', notes: 'Needs 10 reels/month. Very responsive & prompt payer.' },
    { id: 'c2', name: 'Priya Studios', platform: 'Fiverr', contact: 'priya@studio.com', cat: 'website', notes: 'E-commerce website project. Budget ₹25k.' },
    { id: 'c3', name: 'Rahul Creatives', platform: 'Referral', contact: '+91 87654 32109', cat: 'editing', notes: 'Long-form video editing. Weekly deliveries.' },
  ];
  state.projects = [
    { id: 'p1', name: 'YouTube Reels Pack – Oct', cat: 'reels', status: 'inprogress', clientId: 'c1', budget: 8000, deadline: '2026-10-31', desc: '10 short-form reels for YouTube and Instagram', todos: [{id:'t1',text:'Edit reel 1-3',done:true},{id:'t2',text:'Edit reel 4-7',done:false},{id:'t3',text:'Final review & delivery',done:false}], updates: [] },
    { id: 'p2', name: 'E-Commerce Website', cat: 'website', status: 'pending', clientId: 'c2', budget: 25000, deadline: '2026-11-15', desc: 'Full Shopify store setup with custom design', todos: [{id:'t4',text:'Wireframes approval',done:false},{id:'t5',text:'Homepage design',done:false}], updates: [] },
    { id: 'p3', name: 'Podcast Edit – Episode 42', cat: 'editing', status: 'completed', clientId: 'c3', budget: 5000, deadline: '2026-10-20', desc: '2-hour podcast with captions and color grade', todos: [{id:'t6',text:'Edit audio',done:true},{id:'t7',text:'Add captions',done:true}], updates: [] },
  ];
  state.payments = [
    { id: 'pay1', clientId: 'c1', projectId: 'p1', amount: 8000, status: 'pending', due: '2026-10-31', notes: 'Pay on delivery' },
    { id: 'pay2', clientId: 'c2', projectId: 'p2', amount: 12500, status: 'received', due: '2026-10-15', notes: 'Advance 50%' },
    { id: 'pay3', clientId: 'c3', projectId: 'p3', amount: 5000, status: 'received', due: '2026-10-20', notes: 'Full payment' },
  ];
  state.todos = [
    { id: 'td1', text: 'Edit reels 4-7 for Alex', cat: 'reels', priority: 'high', done: false },
    { id: 'td2', text: 'Send wireframe draft to Priya', cat: 'website', priority: 'high', done: false },
    { id: 'td3', text: 'Color grade podcast footage', cat: 'editing', priority: 'medium', done: false },
    { id: 'td4', text: 'Follow up on invoice with Priya', cat: 'other', priority: 'medium', done: false },
    { id: 'td5', text: 'Plan November reels calendar', cat: 'reels', priority: 'low', done: false },
  ];
  state.plans = [
    { id: 'pl1', title: 'Deliver 5 reels to Alex', week: '1', cat: 'reels', priority: 'high', month: new Date().getMonth(), year: new Date().getFullYear(), done: false },
    { id: 'pl2', title: 'Send Priya website wireframes', week: '1', cat: 'website', priority: 'high', month: new Date().getMonth(), year: new Date().getFullYear(), done: false },
    { id: 'pl3', title: 'Edit 3 long-form videos', week: '2', cat: 'editing', priority: 'medium', month: new Date().getMonth(), year: new Date().getFullYear(), done: false },
    { id: 'pl4', title: 'Deliver remaining 5 reels', week: '3', cat: 'reels', priority: 'high', month: new Date().getMonth(), year: new Date().getFullYear(), done: false },
    { id: 'pl5', title: 'Final website delivery', week: '4', cat: 'website', priority: 'high', month: new Date().getMonth(), year: new Date().getFullYear(), done: false },
  ];
  saveState();
}

// ========== CONFIG LOADER ==========
function initGoogleButton() {
  if (!appConfig.googleClientId || typeof google === 'undefined' || !google.accounts) return;
  if (window.__gInit) return;
  window.__gInit = true;
  google.accounts.id.initialize({
    client_id: appConfig.googleClientId,
    callback: handleGoogleSignIn
  });
  google.accounts.id.renderButton(document.getElementById('gSigninContainer'), {
    type: 'standard', theme: 'filled_black', size: 'large', text: 'signin_with', width: 320
  });
}

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      appConfig = await res.json();
      if (appConfig.googleClientId && typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.initialize({
          client_id: appConfig.googleClientId,
          callback: handleGoogleSignIn,
          auto_prompt: false
        });
        const container = document.getElementById('gSigninContainer');
        if (container) {
          google.accounts.id.renderButton(container, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            width: 320
          });
        }
      }
    }
  } catch (e) {
    // Local / static execution mode
  }
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
  loadState();
  createSparks();
  await loadConfig();

  // Check if already signed in
  if (state.user) {
    enterApp();
    if (authToken) {
      fetchCloudData();
    }
  } else {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
  }
});
