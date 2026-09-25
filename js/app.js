/* =========================================================
   FasTrain — Lógica de aplicação & Navegação Single Page
   ========================================================= */

const NAV_ITEMS = [
  { screen:'home',          label:'Início',      icon:'home' },
  { screen:'profile',       label:'Perfil',      icon:'user' },
  { screen:'trains',        label:'Trens',       icon:'train' },
  { screen:'sensors',       label:'Sensores',    icon:'sensor' },
  { screen:'trips',         label:'Mapa',        icon:'map' },
  { screen:'notifications', label:'Notificações',icon:'bell' }
];

const INTERNAL_SCREENS = ['home','profile','trains','sensors','trips','notifications','train-detail'];

function go(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('screen-' + screenId);
  if(target) { target.classList.add('active'); }
  closeSidebar();
  window.scrollTo({top: 0, behavior: 'instant'});
  if(INTERNAL_SCREENS.includes(screenId)) renderShellFor(screenId);
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  btn.innerHTML = showing ? ICONS.eyeOff : ICONS.eye;
}

function paintStaticIcons() {
  document.querySelectorAll('[data-icon]').forEach(el => {
    const name = el.dataset.icon;
    if(ICONS[name]) el.innerHTML = ICONS[name];
  });
}

function buildSidebar(activeScreen) {
  return `
    <div class="sidebar-logo">
      <img src="assets/logo-light.png" alt="FasTrain" style="filter:brightness(0) invert(1);width:30px" />
      FasTrain
    </div>
    ${NAV_ITEMS.map(item => `
      <button class="nav-item ${item.screen === activeScreen ? 'active' : ''}" onclick="go('${item.screen}')">
        ${item.label}${ICONS[item.icon]}
      </button>
    `).join('')}
    <div class="sidebar-settings">${ICONS.settings}</div>
  `;
}

function openSidebar() {
  document.querySelectorAll('.sidebar').forEach(s => s.classList.add('open'));
  document.querySelectorAll('.sidebar-overlay').forEach(o => o.classList.add('show'));
}

function closeSidebar() {
  document.querySelectorAll('.sidebar').forEach(s => s.classList.remove('open'));
  document.querySelectorAll('.sidebar-overlay').forEach(o => o.classList.remove('show'));
}

function buildTopbar(showBell) {
  return `
    <button class="hamburger" onclick="openSidebar()" aria-label="Abrir menu">
      <span></span><span></span><span></span>
    </button>
    <div class="search-box">
      ${ICONS.search}
      <input type="text" placeholder="Pesquisar..." />
    </div>
    <div class="topbar-spacer"></div>
    ${showBell ? `
    <button class="icon-btn" onclick="go('notifications')" aria-label="Notificações">
      ${ICONS.bell}${NOTIFICATIONS.length ? '<span class="dot"></span>' : ''}
    </button>` : ''}
    <button class="icon-btn" onclick="go('profile')" aria-label="Perfil">${ICONS.user}</button>
  `;
}

function renderShellFor(screenId) {
  const root = document.getElementById('shell-' + screenId);
  if(!root) return;
  const sidebarSlot = root.querySelector('.js-sidebar');
  const topbarSlot = root.querySelector('.js-topbar');
  if(sidebarSlot) sidebarSlot.innerHTML = buildSidebar(screenId === 'train-detail' ? 'trips' : screenId);
  if(topbarSlot) topbarSlot.innerHTML = buildTopbar(screenId !== 'notifications');
}

/* Telas principais */
function renderHome() {
  const alerts = NOTIFICATIONS.slice(0,3);
  return `
    <div class="stat-panel">
      <div style="width:100%">
        <h2>Operating System</h2>
        <div style="display:flex;gap:24px;flex-wrap:wrap;align-items:center;justify-content:space-between">
          <ul class="stat-list">
            <li>${TRAINS.length} Assets</li>
            <li>${TRAINS.filter(t=>t.status==='manutencao').length} Maintenance</li>
            <li>23 Lines</li>
            <li>${NOTIFICATIONS.length} Alerts</li>
          </ul>
          <svg class="donut" width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="45" fill="none" stroke="#2c2c2c" stroke-width="18"/>
            <circle cx="60" cy="60" r="45" fill="none" stroke="#c92a2a" stroke-width="18"
              stroke-dasharray="155 283" stroke-dashoffset="0" transform="rotate(-90 60 60)"/>
            <circle cx="60" cy="60" r="45" fill="none" stroke="#8a8a8a" stroke-width="18"
              stroke-dasharray="70 283" stroke-dashoffset="-155" transform="rotate(-90 60 60)"/>
            <circle cx="60" cy="60" r="45" fill="none" stroke="#e0a12b" stroke-width="18"
              stroke-dasharray="40 283" stroke-dashoffset="-225" transform="rotate(-90 60 60)"/>
          </svg>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="mini-card">
        <strong>Trains</strong>
        <div class="num">${TRAINS.filter(t=>t.status==='ativo').length} ativos</div>
        <a href="#" onclick="go('trains');return false;">View trains</a>
      </div>
      <div class="mini-card">
        <strong>Sensors</strong>
        <div class="num">98% online</div>
        <a href="#" onclick="go('sensors');return false;">View sensors</a>
      </div>
    </div>

    <div class="alert-panel">
      ${alerts.length ? alerts.map(a => `
        <div class="alert-row">${ICONS.alert} ${a.id}${a.msg.split('.')[0]}</div>
      `).join('') : '<div class="alert-row">Nenhum alerta no momento</div>'}
    </div>

    <button class="btn btn-primary btn-see-all" onclick="go('sensors')">See All</button>
  `;
}

let tripsView = 'list';
function setTripsView(v) { tripsView = v; renderTrips(); }

function renderTrips() {
  const container = document.getElementById('trips-body');
  if(!container) return;
  container.innerHTML = `
    <div class="toggle-pill">
      <button class="${tripsView==='list'?'active':''}" onclick="setTripsView('list')">List</button>
      <button class="${tripsView==='maps'?'active':''}" onclick="setTripsView('maps')">Maps</button>
    </div>
    ${tripsView === 'list' ? renderTripsList() : renderTripsMap()}
  `;
}

function renderTripsList() {
  return TRAINS.map(t => `
    <div class="trip-card">
      <span class="trip-time">${t.time}</span>
      <div style="width:100%;display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-top:8px">
        <a href="#" class="trip-id" style="color:#fff" onclick="openTrainDetail('${t.id}');return false;">${t.id}</a>
        <div class="trip-route">
          <span>${t.from}<br><small>${t.fromUF}</small></span>
          <div class="trip-thumb"></div>
          <span style="text-align:right">${t.to}<br><small>${t.toUF}</small></span>
        </div>
        <span class="status-pill ${statusClass(t.status)}">${statusLabel(t.status)}</span>
      </div>
    </div>
  `).join('');
}

function renderTripsMap() {
  const t = TRAINS[0];
  return `
    <div class="map-card">
      <div class="map-card-head">${ICONS.map} General lines</div>
      <div class="map-svg-wrap">${routeSvg()}</div>
      <div class="route-chip-row">
        <span class="route-chip">${t.from} ${t.fromUF}</span>
        ${ICONS.chevrons}
        <span class="route-chip">${t.to} ${t.toUF}</span>
      </div>
    </div>
  `;
}

function openTrainDetail(id) {
  const t = TRAINS.find(x => x.id === id) || TRAINS[0];
  document.getElementById('train-detail-body').innerHTML = `
    <div class="split-layout">
      <div class="map-card">
        <div class="map-card-head">
          <button onclick="go('trips')" style="color:#fff">${ICONS.arrowLeft}</button>
          ${t.id}
        </div>
        <div class="map-svg-wrap">${routeSvg()}</div>
      </div>
      <div class="side-panel">
        <div class="city">${t.from}<br><small>${t.fromUF}</small></div>
        <div>${ICONS.chevrons}${ICONS.chevrons}${ICONS.chevrons}</div>
        <div class="city">${t.to}<br><small>${t.toUF}</small></div>
        <span class="status-pill ${statusClass(t.status)}">${statusLabel(t.status)}</span>
      </div>
    </div>
  `;
  go('train-detail');
}

function routeSvg() {
  return `
  <svg viewBox="0 0 400 260" width="100%" height="auto">
    <path d="M40 40 L160 40 L220 100 L220 160 L160 220" fill="none" stroke="#2f9e44" stroke-width="4"/>
    <path d="M160 220 L260 220 L320 160" fill="none" stroke="#e0a12b" stroke-width="4"/>
    <path d="M220 100 L320 100 L360 60" fill="none" stroke="#5c7cfa" stroke-width="4"/>
    <circle cx="160" cy="40" r="6" fill="#404040"/>
    <circle cx="220" cy="100" r="6" fill="#404040"/>
    <circle cx="160" cy="220" r="6" fill="#404040"/>
    <circle cx="220" cy="160" r="9" fill="#c92a2a" stroke="#fff" stroke-width="2"/>
  </svg>`;
}

function renderTrains() {
  return `
    ${TRAINS.map(t => `
      <div class="train-row">
        <div class="train-thumb">${ICONS.train}</div>
        <div class="train-id">${t.id}</div>
        <div class="train-route">
          <span>${t.from}<br><small>${t.fromUF}</small></span>${ICONS.chevrons}
          <span>${t.to}<br><small>${t.toUF}</small></span>
        </div>
        <div class="train-meta">
          <span class="status-pill ${statusClass(t.status)}">${statusLabel(t.status)}</span>
          <span class="speed-chip">${t.speed}</span>
        </div>
      </div>
    `).join('')}
    <button class="btn btn-primary" style="max-width:260px;margin:10px auto 0;display:block" onclick="alert('Novo trem')">Add train</button>
  `;
}

function renderSensors() {
  return `
    <div class="filter-row">
      <div class="search-box">${ICONS.search}<input type="text" placeholder="Search sensor..." /></div>
      <button class="btn-filter">${ICONS.settings} Add filter</button>
    </div>
    <div class="sensor-panel">
      ${SENSORS.map(s => `
        <div class="sensor-row">
          <div class="sensor-icon">${ICONS[s.icon]}</div>
          <div class="sensor-info">
            <div class="sid">${s.id} <span class="status-pill ${statusClass(s.status)}">${statusLabel(s.status)}</span></div>
            <div class="sname">${s.name}</div>
            <div class="sloc">${s.loc}</div>
          </div>
          <div class="sensor-value">
            <div class="val">${s.value}</div>
            <div class="when">${s.when}</div>
          </div>
        </div>
      `).join('')}
      <div class="pager-row">
        <button aria-label="Anterior">${ICONS.arrowLeft}</button>
        <button aria-label="Próximo" style="transform:scaleX(-1)">${ICONS.arrowLeft}</button>
      </div>
    </div>
    <button class="fab" onclick="alert('Novo sensor')">${ICONS.plus}</button>
  `;
}

function renderNotifications() {
  if(!NOTIFICATIONS.length) {
    return `<p class="empty-note">Sem mais notificações...</p>`;
  }
  return `
    ${NOTIFICATIONS.map(n => `
      <div class="notif-card">
        <div class="notif-icon">${ICONS.droplet}</div>
        <div class="notif-body">
          <strong>${n.id} <span class="status-pill ${statusClass(n.status)}">${statusLabel(n.status)}</span></strong>
          <p>${n.title}<br><small>${n.loc}</small></p>
          <div class="notif-msg">${n.msg}</div>
        </div>
      </div>
    `).join('')}
    <p class="empty-note">Sem mais notificações...</p>
  `;
}

function renderProfile() {
  return `
    <div class="profile-card">
      <div class="profile-status" style="margin-bottom:16px"><span class="status-dot"></span> Online</div>
      <div class="profile-top">
        <div class="avatar">${ICONS.user}</div>
        <div class="profile-badges">
          <div class="pbtn">Felipe ✎</div>
          <div class="pbtn" style="background:rgba(255,255,255,.18)">felipe@email.com</div>
          <div class="pbtn" style="max-width:120px">Admin 🇧🇷</div>
        </div>
      </div>
      <div class="profile-fields">
        <div class="pf">Name</div>
        <div class="pf">Age</div>
        <div class="pf">Address</div>
        <div class="pf">Sex</div>
      </div>
      <div class="profile-actions">
        <button class="btn btn-outline" style="border-color:#fff">Change</button>
        <button class="btn btn-outline" style="border-color:#fff" onclick="go('landing')">Exit</button>
        <button class="btn btn-danger-outline">Delete account</button>
      </div>
    </div>
  `;
}

/* Inicialização */
document.addEventListener('DOMContentLoaded', () => {
  paintStaticIcons();
  document.getElementById('home-body').innerHTML = renderHome();
  document.getElementById('trains-body').innerHTML = renderTrains();
  document.getElementById('sensors-body').innerHTML = renderSensors();
  document.getElementById('notifications-body').innerHTML = renderNotifications();
  document.getElementById('profile-body').innerHTML = renderProfile();
  renderTrips();

  document.querySelectorAll('form').forEach(f => {
    f.addEventListener('submit', e => {
      e.preventDefault();
      const dest = f.dataset.goto;
      if(dest) go(dest);
    });
  });

  setTimeout(() => {
    if(document.getElementById('screen-splash').classList.contains('active')) {
      go('landing');
    }
  }, 1800);
});