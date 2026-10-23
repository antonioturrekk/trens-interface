/* =========================================================
   FasTrain — App shell / autenticação / dados / renderização
   ========================================================= */

const NAV_ITEMS = [
  { screen: 'home', label: 'Início', icon: 'home' },
  { screen: 'trains', label: 'Frota', icon: 'train' },
  { screen: 'sensors', label: 'Sensores', icon: 'sensor' },
  { screen: 'trips', label: 'Mapa', icon: 'map' },
  { screen: 'notifications', label: 'Notificações', icon: 'bell' },
  { screen: 'profile', label: 'Perfil', icon: 'user' },
];

const INTERNAL_SCREENS = ['home', 'profile', 'trains', 'sensors', 'trips', 'notifications', 'train-detail'];

const BREADCRUMB_MAP = {
  home: { icon: 'grid', section: 'Início', current: 'Resumo geral' },
  trains: { icon: 'train', section: 'Frota', current: 'Lista de trens' },
  sensors: { icon: 'sensor', section: 'Sensores', current: 'Leituras' },
  trips: { icon: 'map', section: 'Mapa', current: 'Trens em trânsito' },
  'train-detail': { icon: 'map', section: 'Mapa', current: 'Detalhe do trem' },
  notifications: { icon: 'bell', section: 'Notificações', current: 'Lista' },
  profile: { icon: 'user', section: 'Perfil', current: 'Minha conta' },
};

const SENSOR_DEFS = [
  { key: 'velocidade_kmh', label: 'Velocidade', unit: 'km/h', icon: 'gauge', matchWord: 'velocidade' },
  { key: 'temperatura_motor_c', label: 'Temperatura do motor', unit: '°C', icon: 'therm', matchWord: 'temperatura' },
  { key: 'consumo_litros_hora', label: 'Consumo', unit: 'L/h', icon: 'bolt', matchWord: 'consumo' },
  { key: 'vibracao_mm_s', label: 'Vibração', unit: 'mm/s', icon: 'vib', matchWord: 'vibra' },
];

const state = {
  user: null,
  trens: [],
  leituras: [],
  sensores: [],
  loadingData: false,
  loadError: null,
  sensorsPage: 0,
};

let currentScreen = null;
let tripsView = 'list';
let tripsPage = 1;
const TRIPS_PER_PAGE = 5;

/* ---------- Helpers ---------- */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function jsStringEscape(str) {
  return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
function formatNumber(n, decimals = 2) {
  const num = Number(n);
  if (isNaN(num)) return '—';
  return num.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function formatDateTime(str) {
  if (!str) return '—';
  const d = new Date(String(str).replace(' ', 'T'));
  if (isNaN(d.getTime())) return str;
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function dataHoraAtual() {
  return new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function statusLabel(s) {
  return s === 'ativo' ? 'Ativo' : s === 'manutencao' ? 'Manutenção' : 'Inativo';
}
function statusClass(s) {
  return s === 'ativo' ? 'status-ativo' : s === 'manutencao' ? 'status-manutencao' : 'status-inativo';
}
function latestLeituraMap() {
  const map = {};
  state.leituras.forEach((l) => {
    if (!map[l.fk_id_trem]) map[l.fk_id_trem] = l;
  });
  return map;
}

/* ---------- Toast ---------- */
let toastTimer = null;
function showToast(msg, type = 'default') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'toast show' + (type === 'error' ? ' toast-error' : type === 'ok' ? ' toast-ok' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

/* ---------- Modal ---------- */
function openModal(html) {
  document.getElementById('modal-box').innerHTML = html;
  document.getElementById('modal-overlay').classList.add('show');
}
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('show');
  document.getElementById('modal-box').innerHTML = '';
}

/* ---------- Navegação ---------- */
function go(screenId) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  const target = document.getElementById('screen-' + screenId);
  if (target) target.classList.add('active');
  closeSidebar();
  window.scrollTo({ top: 0, behavior: 'instant' });
  currentScreen = screenId;
  if (INTERNAL_SCREENS.includes(screenId)) renderShellFor(screenId);
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  btn.innerHTML = showing ? ICONS.eyeOff : ICONS.eye;
}

function paintStaticIcons() {
  document.querySelectorAll('[data-icon]').forEach((el) => {
    const name = el.dataset.icon;
    if (ICONS[name]) el.innerHTML = ICONS[name];
  });
}

/* ---------- Sidebar (mobile off-canvas / desktop fixo) ---------- */
function buildSidebar(activeScreen) {
  return `
    <div class="sidebar-label">Menu de acesso</div>
    ${NAV_ITEMS.map(
      (item) => `
      <button class="nav-item ${item.screen === activeScreen ? 'active' : ''}" onclick="go('${item.screen}')">
        ${ICONS[item.icon]} <span class="nav-item-label">${item.label}</span>
      </button>
    `
    ).join('')}
    <div class="sidebar-footer">
      <div class="sf-name">FasTrain</div>
      <div class="sf-time">${dataHoraAtual()}</div>
    </div>
  `;
}

function openSidebar() {
  document.querySelectorAll('.sidebar').forEach((s) => s.classList.add('open'));
  document.querySelectorAll('.sidebar-overlay').forEach((o) => o.classList.add('show'));
}
function closeSidebar() {
  document.querySelectorAll('.sidebar').forEach((s) => s.classList.remove('open'));
  document.querySelectorAll('.sidebar-overlay').forEach((o) => o.classList.remove('show'));
}

/* ---------- Topbar global ---------- */
function buildTopbar() {
  const alertas = state.leituras.filter((l) => l.situacao === 'alerta').length;
  const nomeExibicao = state.user ? state.user.nome_usuario.split(' ')[0] : '';
  return `
    <button class="hamburger" onclick="openSidebar()" aria-label="Abrir menu"><span></span><span></span><span></span></button>
    <div class="tg-logo"><img src="assets/logo-light.png" alt="FasTrain"/> FasTrain</div>
    <div class="tg-hint">Gerenciamento de frota ferroviária</div>
    <div class="tg-actions">
      <button class="icon-btn" onclick="carregarDados(true)" aria-label="Atualizar dados">${ICONS.refresh}</button>
      <button class="icon-btn" onclick="go('notifications')" aria-label="Notificações">
        ${ICONS.bell}${alertas > 0 ? '<span class="dot"></span>' : ''}
      </button>
      <button class="icon-btn" onclick="go('profile')" aria-label="Perfil">${ICONS.user}</button>
    </div>
    ${state.user ? `<div class="tg-welcome">Bem vindo, <span>${escapeHtml(nomeExibicao)}</span></div>` : ''}
  `;
}

function buildBreadcrumb(screenId) {
  const b = BREADCRUMB_MAP[screenId] || { icon: 'grid', section: 'FasTrain', current: '' };
  return `${ICONS[b.icon]} <b>${b.section}</b>${b.current ? `<span class="bc-sep">›</span><span class="bc-current">${b.current}</span>` : ''}`;
}

function renderShellFor(screenId) {
  const root = document.getElementById('shell-' + screenId);
  if (!root) return;
  const sidebarSlot = root.querySelector('.js-sidebar');
  const topbarSlot = root.querySelector('.js-topbar');
  const breadcrumbSlot = root.querySelector('.js-breadcrumb');
  const activeNav = screenId === 'train-detail' ? 'trips' : screenId;
  if (sidebarSlot) sidebarSlot.innerHTML = buildSidebar(activeNav);
  if (topbarSlot) topbarSlot.innerHTML = buildTopbar();
  if (breadcrumbSlot) breadcrumbSlot.innerHTML = buildBreadcrumb(screenId);
}

/* =========================================================
   Autenticação
   ========================================================= */
function showFieldError(containerId, msg) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = `<p class="form-error">${escapeHtml(msg)}</p>`;
}
function clearFieldError(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = '';
}

async function verificarSessao() {
  try {
    const resp = await Api.auth.me();
    state.user = resp.usuario;
    return true;
  } catch (e) {
    state.user = null;
    return false;
  }
}

function wireAuthForms() {
  document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldError('login-error');
    const btn = document.getElementById('login-submit');
    btn.disabled = true;
    try {
      const email = document.getElementById('login-email').value.trim();
      const senha = document.getElementById('login-pass').value;
      const resp = await Api.auth.login(email, senha);
      state.user = resp.usuario;
      await carregarDados();
      go('home');
    } catch (err) {
      showFieldError('login-error', err.message);
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById('form-signup').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldError('signup-error');
    const btn = document.getElementById('signup-submit');
    btn.disabled = true;
    try {
      const resp = await Api.auth.registrar({
        tipo_usuario: 'pessoa',
        nome_usuario: document.getElementById('signup-nome').value.trim(),
        email_usuario: document.getElementById('signup-email').value.trim(),
        senha: document.getElementById('signup-pass').value,
        confirmar_senha: document.getElementById('signup-pass2').value,
      });
      state.user = resp.usuario;
      await carregarDados();
      go('home');
    } catch (err) {
      showFieldError('signup-error', err.message);
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById('form-signup-company').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldError('signupc-error');
    const btn = document.getElementById('signupc-submit');
    btn.disabled = true;
    try {
      const resp = await Api.auth.registrar({
        tipo_usuario: 'empresa',
        nome_usuario: document.getElementById('signupc-nome').value.trim(),
        email_usuario: document.getElementById('signupc-email').value.trim(),
        cnpj_usuario: document.getElementById('signupc-cnpj').value.trim(),
        senha: document.getElementById('signupc-pass').value,
        confirmar_senha: document.getElementById('signupc-pass2').value,
      });
      state.user = resp.usuario;
      await carregarDados();
      go('home');
    } catch (err) {
      showFieldError('signupc-error', err.message);
    } finally {
      btn.disabled = false;
    }
  });
}

async function sair() {
  try {
    await Api.auth.logout();
  } catch (e) {
    /* ignora falha de rede no logout */
  }
  state.user = null;
  state.trens = [];
  state.leituras = [];
  go('landing');
}

/* =========================================================
   Carregamento de dados (API)
   ========================================================= */
async function carregarDados(mostrarToast = false) {
  state.loadingData = true;
  state.loadError = null;
  renderAll();

  try {
    const [trensResp, leiturasResp, sensoresResp] = await Promise.all([Api.trens.listar(), Api.leituras.listar(0, 300), Api.sensores.listar()]);
    state.trens = trensResp.trens || [];
    state.leituras = leiturasResp.leituras || [];
    state.sensores = sensoresResp.sensores || [];
  } catch (err) {
    state.loadError = err.message;
  }

  state.loadingData = false;
  renderAll();

  if (state.loadError) {
    showToast(state.loadError, 'error');
  } else if (mostrarToast) {
    showToast('Dados atualizados.', 'ok');
  }
}

function renderAll() {
  const home = document.getElementById('home-body');
  if (home) home.innerHTML = renderHome();

  const trains = document.getElementById('trains-body');
  if (trains) trains.innerHTML = renderTrains();

  const sensors = document.getElementById('sensors-body');
  if (sensors) sensors.innerHTML = renderSensors();

  const notifications = document.getElementById('notifications-body');
  if (notifications) notifications.innerHTML = renderNotifications();

  const profile = document.getElementById('profile-body');
  if (profile) profile.innerHTML = renderProfile();

  renderTripsInto();

  if (currentScreen && INTERNAL_SCREENS.includes(currentScreen)) {
    renderShellFor(currentScreen);
  }
}

/* ---------- Estado de carregamento/erro compartilhado ---------- */
function estadoCarregamentoOuErro() {
  if (state.loadingData) return '<p class="loading-note">Carregando dados...</p>';
  if (state.loadError) return `<p class="error-note">${escapeHtml(state.loadError)}</p>`;
  return null;
}

/* ---------- Dashboard (Início) ---------- */
function renderHome() {
  const aviso = estadoCarregamentoOuErro();
  if (aviso) return aviso;

  const trens = state.trens;
  const alertas = state.leituras.filter((l) => l.situacao === 'alerta');

  return `
    <div class="stat-grid">
      <div class="stat-card">
        <div class="num">${trens.length}</div>
        <div class="label">Trens cadastrados</div>
      </div>
      <div class="stat-card accent-warn">
        <div class="num">${trens.filter((t) => t.situacao_trem === 'manutencao').length}</div>
        <div class="label">Em manutenção</div>
      </div>
      <div class="stat-card accent-ok">
        <div class="num">${state.leituras.length}</div>
        <div class="label">Leituras recentes</div>
      </div>
      <div class="stat-card accent-red">
        <div class="num">${alertas.length}</div>
        <div class="label">Alertas ativos</div>
      </div>
    </div>

    <div class="panel">
      <h2>Últimos alertas</h2>
      <div class="alert-panel">
        ${
          alertas.length
            ? alertas
                .slice(0, 6)
                .map(
                  (a) =>
                    `<div class="alert-row">${ICONS.alert} <b>${escapeHtml(a.prefixo_trem)}</b> — ${escapeHtml((a.falhas || []).join(', '))}</div>`
                )
                .join('')
            : '<div class="alert-row">Nenhum alerta no momento.</div>'
        }
      </div>
    </div>

    <button class="btn btn-primary" style="max-width:220px" onclick="go('sensors')">Ver sensores</button>
  `;
}

/* ---------- Frota (gestão de trens) ---------- */
function renderTrains() {
  const aviso = estadoCarregamentoOuErro();
  if (aviso) return aviso;

  const latest = latestLeituraMap();

  return `
    <div class="action-row">
      <button class="btn-chip primary" onclick="abrirModalTrem()">${ICONS.plus} Novo trem</button>
      <button class="btn-chip" onclick="carregarDados(true)">${ICONS.refresh} Atualizar</button>
    </div>
    <div class="panel table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Prefixo</th>
            <th>Modelo</th>
            <th>Ano</th>
            <th>Capacidade</th>
            <th>Situação</th>
            <th>Última leitura</th>
            <th class="col-acoes">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${
            trens_vazio()
              ? `<tr><td colspan="7" class="empty-note">Nenhum trem cadastrado.</td></tr>`
              : state.trens
                  .map((t) => {
                    const l = latest[t.id_trem];
                    return `
              <tr>
                <td><b>${escapeHtml(t.prefixo_trem)}</b></td>
                <td>${escapeHtml(t.modelo_trem)}</td>
                <td>${t.ano_fabricacao}</td>
                <td>${formatNumber(t.capacidade_toneladas)} t</td>
                <td><span class="status-pill ${statusClass(t.situacao_trem)}">${statusLabel(t.situacao_trem)}</span></td>
                <td>${l ? formatNumber(l.velocidade_kmh) + ' km/h' : '—'}</td>
                <td class="col-acoes">
                  <button class="table-icon-btn" onclick="abrirModalTrem(${t.id_trem})" aria-label="Editar">${ICONS.edit}</button>
                  <button class="table-icon-btn danger" onclick="excluirTrem(${t.id_trem}, '${jsStringEscape(t.prefixo_trem)}')" aria-label="Excluir">${ICONS.trash}</button>
                </td>
              </tr>`;
                  })
                  .join('')
          }
        </tbody>
      </table>
    </div>
  `;
}
function trens_vazio() {
  return !state.trens || state.trens.length === 0;
}

function abrirModalTrem(id) {
  const editando = !!id;
  const trem = editando ? state.trens.find((t) => t.id_trem === id) : null;

  openModal(`
    <div class="modal-box-head">
      <h3>${editando ? 'Editar trem' : 'Novo trem'}</h3>
      <button type="button" onclick="closeModal()">${ICONS.close}</button>
    </div>
    <div id="modal-trem-error"></div>
    <form id="form-trem">
      <div class="modal-linha">
        <div class="field">
          <label>Prefixo</label>
          <input type="text" id="mt-prefixo" maxlength="20" value="${trem ? escapeHtml(trem.prefixo_trem) : ''}" required>
        </div>
        <div class="field">
          <label>Ano</label>
          <input type="number" id="mt-ano" min="1900" max="2100" value="${trem ? trem.ano_fabricacao : new Date().getFullYear()}" required>
        </div>
      </div>
      <div class="field">
        <label>Modelo</label>
        <input type="text" id="mt-modelo" maxlength="80" value="${trem ? escapeHtml(trem.modelo_trem) : ''}" required>
      </div>
      <div class="modal-linha">
        <div class="field">
          <label>Capacidade (t)</label>
          <input type="number" step="0.01" min="0.01" id="mt-capacidade" value="${trem ? trem.capacidade_toneladas : ''}" required>
        </div>
        <div class="field">
          <label>Situação</label>
          <select id="mt-situacao">
            <option value="ativo" ${trem && trem.situacao_trem === 'ativo' ? 'selected' : ''}>Ativo</option>
            <option value="manutencao" ${trem && trem.situacao_trem === 'manutencao' ? 'selected' : ''}>Em manutenção</option>
            <option value="inativo" ${trem && trem.situacao_trem === 'inativo' ? 'selected' : ''}>Inativo</option>
          </select>
        </div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost-light" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">${editando ? 'Salvar' : 'Cadastrar'}</button>
      </div>
    </form>
  `);

  document.getElementById('form-trem').addEventListener('submit', async (e) => {
    e.preventDefault();
    const dados = {
      prefixo_trem: document.getElementById('mt-prefixo').value.trim(),
      modelo_trem: document.getElementById('mt-modelo').value.trim(),
      ano_fabricacao: document.getElementById('mt-ano').value,
      capacidade_toneladas: document.getElementById('mt-capacidade').value,
      situacao_trem: document.getElementById('mt-situacao').value,
    };
    try {
      if (editando) {
        await Api.trens.atualizar(id, dados);
        showToast('Trem atualizado.', 'ok');
      } else {
        await Api.trens.criar(dados);
        showToast('Trem cadastrado.', 'ok');
      }
      closeModal();
      await carregarDados();
    } catch (err) {
      showFieldError('modal-trem-error', err.message);
    }
  });
}

async function excluirTrem(id, prefixo) {
  if (!confirm(`Confirma a exclusão do trem ${prefixo}? As leituras associadas também serão apagadas.`)) return;
  try {
    await Api.trens.excluir(id);
    showToast('Trem excluído.', 'ok');
    await carregarDados();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ---------- Sensores ---------- */
function abrirModalSensor() {
  const opcoes = state.trens.map(t => `<option value="${Number(t.id_trem)}">${escapeHtml(t.prefixo_trem)}</option>`).join('');
  openModal(`
    <div class="modal-box-head"><h2>Cadastrar sensor</h2><button class="modal-close" onclick="closeModal()">×</button></div>
    <form id="form-sensor" class="modal-form">
      <label>Nome do sensor<input name="nome_sensor" maxlength="100" required placeholder="Ex.: Sensor de temperatura 01"></label>
      <label>Tipo<select name="tipo_sensor" required><option value="">Selecione</option><option>Temperatura</option><option>Velocidade</option><option>Vibração</option><option>Consumo</option><option>Pressão</option><option>Outro</option></select></label>
      <label>Trem associado<select name="fk_id_trem"><option value="">Nenhum</option>${opcoes}</select></label>
      <label>Status<select name="status_sensor"><option value="ativo">Ativo</option><option value="manutencao">Em manutenção</option><option value="inativo">Inativo</option></select></label>
      <div class="form-actions"><button type="button" class="btn-chip" onclick="closeModal()">Cancelar</button><button type="submit" class="btn-chip primary">Salvar sensor</button></div>
      <p id="sensor-form-error" class="form-error"></p>
    </form>`);
  document.getElementById('form-sensor').addEventListener('submit', async (ev) => {
    ev.preventDefault(); const form = ev.currentTarget; const fd = new FormData(form);
    const dados = Object.fromEntries(fd.entries());
    try { await Api.sensores.criar(dados); closeModal(); showToast('Sensor cadastrado com sucesso.', 'ok'); await carregarDados(); }
    catch (err) { const el=document.getElementById('sensor-form-error'); if(el) el.textContent=err.message; }
  });
}

async function excluirSensor(id, nome) {
  if (!confirm(`Deseja excluir o sensor “${nome}”? Essa ação remove o cadastro do sensor, mas não apaga as leituras históricas dos trens.`)) return;
  try { await Api.sensores.excluir(id); showToast('Sensor excluído.', 'ok'); await carregarDados(); }
  catch (err) { showToast(err.message, 'error'); }
}

async function excluirLeituraSensor(id, prefixo, dataHora) {
  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    showToast('Não foi possível identificar a leitura para excluir.', 'error');
    return;
  }
  const ok = confirm(`Excluir a leitura de ${prefixo} (${formatDateTime(dataHora)})? Isso removerá o registro completo dessa medição, incluindo velocidade, temperatura, consumo e vibração.`);
  if (!ok) return;
  try {
    await Api.leituras.excluir(Number(id));
    showToast('Leitura excluída.', 'ok');
    await carregarDados(true);
  } catch (err) {
    showToast(err.message || 'Não foi possível excluir a leitura.', 'error');
  }
}

function sensorEntries() {
  const latest = latestLeituraMap();
  const entries = [];

  state.trens.forEach((t) => {
    const l = latest[t.id_trem];
    if (!l) return;

    SENSOR_DEFS.forEach((def) => {
      const emAlerta = (l.falhas || []).some((f) => f.toLowerCase().includes(def.matchWord));
      entries.push({
        leituraId: Number(l.id_leitura),
        trainPrefixo: t.prefixo_trem,
        trainId: t.id_trem,
        label: def.label,
        icon: def.icon,
        value: `${formatNumber(l[def.key])} ${def.unit}`,
        when: formatDateTime(l.data_hora),
        alerta: emAlerta,
      });
    });
  });

  return entries;
}

function renderSensors() {
  const aviso = estadoCarregamentoOuErro();
  if (aviso) return aviso;

  const entries = sensorEntries();
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
  if (state.sensorsPage >= totalPages) state.sensorsPage = totalPages - 1;
  if (state.sensorsPage < 0) state.sensorsPage = 0;
  const pageItems = entries.slice(state.sensorsPage * pageSize, state.sensorsPage * pageSize + pageSize);

  return `
    <div class="action-row">
      <button class="btn-chip primary" onclick="abrirModalSensor()">${ICONS.plus} Cadastrar sensor</button>
      <button class="btn-chip" onclick="abrirModalLeitura()">${ICONS.plus} Nova leitura manual</button>
      <button class="btn-chip" onclick="carregarDados(true)">${ICONS.refresh} Atualizar</button>
    </div>
    <div class="panel" style="margin-bottom:16px;">
      <h3 style="margin:0 0 12px;">Sensores cadastrados (${state.sensores.length})</h3>
      ${state.sensores.length ? state.sensores.map((s) => `
        <div class="sensor-row">
          <div class="sensor-icon">${ICONS.sensor || ''}</div>
          <div class="sensor-info">
            <div class="sid">${escapeHtml(s.nome_sensor)}</div>
            <div class="sname">${escapeHtml(s.tipo_sensor)}</div>
            <div class="sloc">${s.prefixo_trem ? 'Trem ' + escapeHtml(s.prefixo_trem) : 'Sem trem associado'} · ${s.status_sensor === 'ativo' ? 'Ativo' : s.status_sensor === 'manutencao' ? 'Em manutenção' : 'Inativo'}</div>
          </div>
          <button class="btn-chip danger" onclick="excluirSensor(${Number(s.id_sensor)}, '${jsStringEscape(s.nome_sensor)}')">${ICONS.trash || 'Excluir'} Excluir</button>
        </div>`).join('') : '<p class="empty-note">Nenhum sensor cadastrado. Use “Cadastrar sensor” para adicionar o primeiro.</p>'}
    </div>
    ${
      entries.length === 0
        ? '<p class="empty-note">Nenhuma leitura registrada ainda. Use "Nova leitura manual" ou o simulador do painel admin.</p>'
        : `
      <div class="panel">
        ${pageItems
          .map(
            (s) => `
          <div class="sensor-row ${s.alerta ? 'alerta' : ''}">
            <div class="sensor-icon">${ICONS[s.icon]}</div>
            <div class="sensor-info">
              <div class="sid">${escapeHtml(s.trainPrefixo)} ${s.alerta ? '<span class="status-pill status-manutencao">Alerta</span>' : ''}</div>
              <div class="sname">${s.label}</div>
              <div class="sloc">Trem #${s.trainId}</div>
            </div>
            <div class="sensor-value">
              <div class="val">${s.value}</div>
              <div class="when">${s.when}</div>
            </div>
            <button class="btn-chip danger" onclick="excluirLeituraSensor(${Number(s.leituraId)}, '${jsStringEscape(s.trainPrefixo)}', '${jsStringEscape(s.when)}')" title="Excluir a leitura completa" aria-label="Excluir leitura">${ICONS.trash || ''} Excluir leitura</button>
          </div>
        `
          )
          .join('')}
        ${
          totalPages > 1
            ? `
        <div style="display:flex;justify-content:center;align-items:center;gap:18px;margin-top:10px;">
          <button class="table-icon-btn" onclick="mudarPaginaSensores(-1)" aria-label="Anterior">${ICONS.arrowLeft}</button>
          <span style="font-size:.78rem;color:var(--muted);font-weight:700;">${state.sensorsPage + 1} / ${totalPages}</span>
          <button class="table-icon-btn" onclick="mudarPaginaSensores(1)" style="transform:scaleX(-1)" aria-label="Próximo">${ICONS.arrowLeft}</button>
        </div>`
            : ''
        }
      </div>`
    }
  `;
}

function mudarPaginaSensores(delta) {
  state.sensorsPage = state.sensorsPage + delta;
  const el = document.getElementById('sensors-body');
  if (el) el.innerHTML = renderSensors();
}

function abrirModalLeitura() {
  if (state.trens.length === 0) {
    showToast('Cadastre um trem antes de registrar leituras.', 'error');
    return;
  }

  openModal(`
    <div class="modal-box-head">
      <h3>Nova leitura manual</h3>
      <button type="button" onclick="closeModal()">${ICONS.close}</button>
    </div>
    <div id="modal-leitura-error"></div>
    <form id="form-leitura">
      <div class="field">
        <label>Trem</label>
        <select id="ml-trem" required>
          <option value="">Selecione</option>
          ${state.trens.map((t) => `<option value="${t.id_trem}">${escapeHtml(t.prefixo_trem)} - ${escapeHtml(t.modelo_trem)}</option>`).join('')}
        </select>
      </div>
      <div class="modal-linha">
        <div class="field"><label>Velocidade (km/h)</label><input type="number" step="0.01" min="0" id="ml-velocidade" required></div>
        <div class="field"><label>Temperatura (°C)</label><input type="number" step="0.01" id="ml-temperatura" required></div>
      </div>
      <div class="modal-linha">
        <div class="field"><label>Consumo (L/h)</label><input type="number" step="0.01" min="0" id="ml-consumo" required></div>
        <div class="field"><label>Vibração (mm/s)</label><input type="number" step="0.01" min="0" id="ml-vibracao" required></div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost-light" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">Registrar</button>
      </div>
    </form>
  `);

  document.getElementById('form-leitura').addEventListener('submit', async (e) => {
    e.preventDefault();
    const dados = {
      fk_id_trem: document.getElementById('ml-trem').value,
      velocidade_kmh: document.getElementById('ml-velocidade').value,
      temperatura_motor_c: document.getElementById('ml-temperatura').value,
      consumo_litros_hora: document.getElementById('ml-consumo').value,
      vibracao_mm_s: document.getElementById('ml-vibracao').value,
    };
    try {
      await Api.leituras.criar(dados);
      showToast('Leitura registrada.', 'ok');
      closeModal();
      await carregarDados();
    } catch (err) {
      showFieldError('modal-leitura-error', err.message);
    }
  });
}

/* ---------- Notificações ---------- */
function gerarNotificacoesSensor() {
  const latest = latestLeituraMap();
  const notificacoes = [];
  const limites = [
    { key: 'velocidade_kmh', label: 'Velocidade', limite: 80, unit: 'km/h', sugestao: 'Verifique o limite operacional e as condições de circulação.' },
    { key: 'temperatura_motor_c', label: 'Temperatura do motor', limite: 105, unit: '°C', sugestao: 'Recomenda-se inspecionar o sistema de arrefecimento e o motor.' },
    { key: 'consumo_litros_hora', label: 'Consumo', limite: 75, unit: 'L/h', sugestao: 'Verifique o consumo e agende uma inspeção se o valor persistir.' },
    { key: 'vibracao_mm_s', label: 'Vibração', limite: 7, unit: 'mm/s', sugestao: 'Recomenda-se inspecionar rodas, rolamentos e componentes mecânicos.' },
  ];

  state.trens.forEach((t) => {
    const l = latest[t.id_trem];
    if (!l) return;
    const falhas = Array.isArray(l.falhas) ? l.falhas : [];
    if (l.situacao === 'alerta' || falhas.length) {
      notificacoes.push({
        tipo: 'alerta', trem: t.prefixo_trem,
        data: l.data_hora,
        titulo: 'Alerta de sensor',
        mensagem: falhas.length ? falhas.join(' · ') : 'Uma leitura foi classificada como alerta. Verifique os sensores.'
      });
    }
    limites.forEach((limite) => {
      const valor = Number(l[limite.key]);
      if (Number.isFinite(valor) && valor > limite.limite && !falhas.some((f) => String(f).toLowerCase().includes(limite.label.toLowerCase().split(' ')[0]))) {
        notificacoes.push({
          tipo: 'manutencao', trem: t.prefixo_trem,
          data: l.data_hora,
          titulo: `Manutenção recomendada: ${limite.label}`,
          mensagem: `Leitura de ${formatNumber(valor)} ${limite.unit} acima do limite de referência (${limite.limite} ${limite.unit}). ${limite.sugestao}`
        });
      }
    });
    if (t.situacao_trem === 'manutencao') {
      notificacoes.push({
        tipo: 'manutencao', trem: t.prefixo_trem,
        data: l.data_hora,
        titulo: 'Trem marcado para manutenção',
        mensagem: 'Confirme a inspeção e registre a liberação do trem após os procedimentos necessários.'
      });
    }
  });

  return notificacoes.slice(0, 30);
}

function renderNotifications() {
  const aviso = estadoCarregamentoOuErro();
  if (aviso) return aviso;

  const notificacoes = gerarNotificacoesSensor();
  if (notificacoes.length === 0) {
    return `<div class="panel"><p class="empty-note">Nenhum alerta identificado. Os sensores estão sem ocorrências registradas nas últimas leituras.</p><p class="empty-note">Dica: registre novas leituras para receber avisos de limites excedidos e sugestões de manutenção.</p></div>`;
  }

  return notificacoes.map((n) => `
    <div class="notif-card ${n.tipo === 'manutencao' ? 'notif-maintenance' : 'notif-alert'}">
      <div class="notif-icon">${ICONS.alert}</div>
      <div class="notif-body">
        <strong>${escapeHtml(n.trem)} <span class="status-pill status-manutencao">${n.tipo === 'manutencao' ? 'Manutenção' : 'Alerta'}</span></strong>
        <p>${escapeHtml(n.titulo)} · ${formatDateTime(n.data)}</p>
        <div class="notif-msg">${escapeHtml(n.mensagem)}</div>
      </div>
    </div>
  `).join('');
}

/* ---------- Trens em trânsito (lista / mapa) ---------- */
function setTripsView(v) {
  tripsView = v;
  renderTripsInto();
}
function setTripsPage(page) {
  tripsPage = Math.max(1, Number(page) || 1);
  renderTripsInto();
}
function renderTripsInto() {
  const el = document.getElementById('trips-body');
  if (el) el.innerHTML = renderTrips();
}
function renderTrips() {
  const aviso = estadoCarregamentoOuErro();
  if (aviso) return aviso;

  return `
    <div class="toggle-pill">
      <button class="${tripsView === 'list' ? 'active' : ''}" onclick="setTripsView('list')">Lista</button>
      <button class="${tripsView === 'maps' ? 'active' : ''}" onclick="setTripsView('maps')">Mapa</button>
    </div>
    ${tripsView === 'list' ? renderTripsList() : renderTripsMap()}
  `;
}
function trainRouteInfo(index) {
  // Cada trem recebe uma linha fixa: vermelho, azul ou amarelo.
  const lines = [
    { name: 'Linha Vermelha', color: '#c92a2a', path: 'M90 90 H410 L530 205 V340 L380 455 H220 V300', stations: ['Estação 1','Estação 2','Estação 3','Estação 4','Estação 5','Estação 6','Estação 7','Estação 8'] },
    { name: 'Linha Verde', color: '#2f9e44', path: 'M90 180 H250 V250 H410', stations: ['Estação 13','Estação 14','Estação 15'] },
    { name: 'Linha Azul', color: '#2479b7', path: 'M530 205 H760 L900 90', stations: ['Estação 4','Estação 9','Estação 12'] },
    { name: 'Linha Amarela', color: '#e0a12b', path: 'M530 340 H760 L900 455', stations: ['Estação 5','Estação 10','Estação 11'] }
  ];
  return lines[index % lines.length];
}
function trainSvgIcon(color) {
  return `<rect x="-19" y="-11" width="38" height="22" rx="6" fill="${color}" stroke="#fff" stroke-width="2.5"/><rect x="-12" y="-6" width="9" height="6" rx="1.5" fill="#fff"/><rect x="3" y="-6" width="9" height="6" rx="1.5" fill="#fff"/><path d="M-13 4H13" stroke="#fff" stroke-width="1.5"/><circle cx="-10" cy="12" r="3" fill="#343b48"/><circle cx="10" cy="12" r="3" fill="#343b48"/>`;
}
function renderTripsMap() {
  if (trens_vazio()) return '<p class="empty-note">Nenhum trem cadastrado para exibir no mapa.</p>';
  const trains = state.trens.map((t, index) => {
    const line = trainRouteInfo(index);
    const moving = String(t.situacao_trem || '').toLowerCase() === 'ativo';
    return `<g class="metro-train-marker" opacity="${moving ? '1' : '.38'}"><g>${trainSvgIcon(line.color)}${moving ? `<animateMotion dur="42s" begin="-${index * 7}s" repeatCount="indefinite" calcMode="paced" path="${line.path}"/>` : ''}</g></g>`;
  }).join('');
  const stationPoints = [{n:1,x:90,y:90,c:'#c92a2a'},{n:2,x:250,y:90,c:'#c92a2a'},{n:3,x:410,y:90,c:'#c92a2a'},{n:4,x:530,y:205,c:'#c92a2a'},{n:5,x:530,y:340,c:'#c92a2a'},{n:6,x:380,y:455,c:'#c92a2a'},{n:7,x:220,y:455,c:'#c92a2a'},{n:8,x:220,y:300,c:'#c92a2a'},{n:9,x:760,y:205,c:'#2479b7'},{n:10,x:760,y:340,c:'#e0a12b'},{n:11,x:900,y:455,c:'#e0a12b'},{n:12,x:900,y:90,c:'#2479b7'},{n:13,x:90,y:180,c:'#2f9e44'},{n:14,x:250,y:250,c:'#2f9e44'},{n:15,x:410,y:250,c:'#2f9e44'}];
  const stations = stationPoints.map(p => { const labelY = [6,7,11].includes(p.n) ? 34 : -25; return `<g transform="translate(${p.x} ${p.y})"><circle r="14" fill="#fff" stroke="${p.c}" stroke-width="5"/><circle r="4" fill="${p.c}"/><text class="metro-station-label" x="0" y="${labelY}" text-anchor="middle" paint-order="stroke" stroke="#f8fafc" stroke-width="5" stroke-linejoin="round">Estação ${p.n}</text></g>`; }).join('');
  return `<div class="rail-map"><div class="rail-map-topline"><span><i class="map-live-dot"></i> Mapa geral — todos os trens</span><span>Posições simuladas</span></div><div class="rail-map-canvas"><svg class="rail-svg" viewBox="0 0 1000 540" width="100%" role="img" aria-label="Mapa de metrô com todos os trens">
  <defs><pattern id="metroGridAll" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0H0V25" fill="none" stroke="#e6eaf0" stroke-width="1"/></pattern></defs><rect width="1000" height="540" rx="12" fill="#f8fafc"/><rect width="1000" height="540" rx="12" fill="url(#metroGridAll)"/>
  <g fill="none" stroke="#fff" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"><path d="M90 90 H410 L530 205 V340 L380 455 H220 V300"/><path d="M530 205 H760 L900 90"/><path d="M530 340 H760 L900 455"/><path d="M90 180 H250 V250 H410"/></g><g fill="none" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"><path d="M90 90 H410 L530 205 V340 L380 455 H220 V300" stroke="#c92a2a"/><path d="M530 205 H760 L900 90" stroke="#2479b7"/><path d="M530 340 H760 L900 455" stroke="#e0a12b"/><path d="M90 180 H250 V250 H410" stroke="#2f9e44"/></g><g fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="3 18" stroke-linecap="round"><path d="M90 90 H410 L530 205 V340 L380 455 H220 V300"/><path d="M530 205 H760 L900 90"/><path d="M530 340 H760 L900 455"/><path d="M90 180 H250 V250 H410"/></g><g font-family="Arial,sans-serif" font-size="16" font-weight="700" fill="#253047">${stations}</g>${trains}</svg></div>
  <div class="rail-map-legend"><span><b class="legend-dot red"></b> Linha vermelha</span><span><b class="legend-dot blue"></b> Linha azul</span><span><b class="legend-dot gold"></b> Linha amarela</span><span><b class="legend-dot green"></b> Linha verde</span><span>🚆 Trens ativos em movimento</span></div>
  <div class="panel map-train-list"><strong>Ver mapa individual</strong><div class="map-train-buttons">${state.trens.map((t, i) => { const line = trainRouteInfo(i); return `<button class="btn btn-outline" onclick="openTrainDetail(${Number(t.id_trem)})"><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${line.color};margin-right:6px"></span>${escapeHtml(t.prefixo_trem)} — ${line.name}</button>`; }).join('')}</div></div></div>`;
}
function renderTripsList() {
  if (trens_vazio()) return '<p class="empty-note">Nenhum trem cadastrado.</p>';
  const latest = latestLeituraMap();
  const stations = ['Estação 1', 'Estação 2', 'Estação 3', 'Estação 4', 'Estação 5', 'Estação 6', 'Estação 7', 'Estação 8'];
  const totalPages = Math.max(1, Math.ceil(state.trens.length / TRIPS_PER_PAGE));
  tripsPage = Math.min(tripsPage, totalPages);
  const start = (tripsPage - 1) * TRIPS_PER_PAGE;
  const visibleTrains = state.trens.slice(start, start + TRIPS_PER_PAGE);
  const cards = visibleTrains.map((t, localIndex) => {
    const index = start + localIndex;
    const l = latest[t.id_trem];
    // Progresso visual ilustrativo e estável por trem; não representa GPS real.
    const progress = (index * 17 + 24) % 86 + 8;
    const stationIndex = Math.min(stations.length - 1, Math.floor(progress / 100 * stations.length));
    const nextIndex = Math.min(stations.length - 1, stationIndex + 1);
    const moving = String(t.situacao_trem).toLowerCase() === 'ativo';
    return `
    <div class="panel train-trip-card">
      <div class="train-trip-head">
        <div class="train-trip-id"><strong>${escapeHtml(t.prefixo_trem)}</strong><span>${escapeHtml(t.modelo_trem)}</span></div>
        <span class="status-pill ${statusClass(t.situacao_trem)}">${statusLabel(t.situacao_trem)}</span>
        <div class="train-trip-reading"><strong>${l ? formatNumber(l.velocidade_kmh) + ' km/h' : '—'}</strong><span>${l ? formatDateTime(l.data_hora) : 'sem leituras'}</span></div>
      </div>
      <div class="trip-card-actions"><button class="btn btn-outline" onclick="openTrainDetail(${Number(t.id_trem)})">Ver mapa individual</button></div>
      <div class="trip-progress-block">
        <div class="trip-progress-title"><span>${moving ? 'Em percurso' : (String(t.situacao_trem).toLowerCase() === 'manutencao' ? 'Em manutenção' : 'Trem parado')}</span><strong>${progress}% do trajeto</strong></div>
        <div class="trip-progress-track"><div class="trip-progress-fill ${moving ? 'is-moving' : ''}" style="width:${progress}%"><span class="trip-progress-train" aria-hidden="true">🚆</span></div></div>
        <div class="trip-station-labels"><span><b>${stations[stationIndex]}</b><small>Estação atual</small></span><span class="trip-next-station"><b>${stations[nextIndex]}</b><small>Próxima estação</small></span></div>
        <div class="trip-station-dots">${stations.map((station, si) => `<span class="trip-station-dot ${si < stationIndex ? 'passed' : ''} ${si === stationIndex ? 'current' : ''}" title="${station}"></span>`).join('')}</div>
      </div>
    </div>`;
  }).join('');
  const tabs = `<div class="trips-pagination" role="navigation" aria-label="Páginas de trens"><span>Trens ${start + 1}–${Math.min(start + TRIPS_PER_PAGE, state.trens.length)} de ${state.trens.length}</span><div>${Array.from({length: totalPages}, (_, i) => `<button class="${tripsPage === i + 1 ? 'active' : ''}" onclick="setTripsPage(${i + 1})" aria-label="Página ${i + 1}">${i + 1}</button>`).join('')}</div></div>`;
  return cards + tabs;
}
function openTrainDetail(id) {
  const index = state.trens.findIndex((x) => Number(x.id_trem) === Number(id));
  const t = state.trens[index];
  if (!t) return;
  const l = latestLeituraMap()[id];
  const line = trainRouteInfo(index);
  const moving = String(t.situacao_trem || '').toLowerCase() === 'ativo';
  const map = routeSvg(line, moving);
  const icon = `<g class="individual-train-marker">${trainSvgIcon(line.color)}${moving ? `<animateMotion dur="42s" repeatCount="indefinite" calcMode="paced" path="${line.path}"/>` : ''}</g>`;
  document.getElementById('train-detail-body').innerHTML = `
    <div class="split-layout">
      <div class="map-card">
        <div class="map-card-head">
          <button onclick="go('trips')" style="color:#fff">${ICONS.arrowLeft}</button>
          ${escapeHtml(t.prefixo_trem)} — ${line.name}
        </div>
        <div class="map-svg-wrap">${map.replace('</svg>', `${icon}</svg>`)}</div>
      </div>
      <div class="side-panel">
        <div class="train-tag">${escapeHtml(t.prefixo_trem)}</div>
        <div style="color:var(--muted);font-weight:700;">${escapeHtml(t.modelo_trem)}</div>
        <span class="status-pill ${statusClass(t.situacao_trem)}">${statusLabel(t.situacao_trem)}</span>
        <div class="profile-fields" style="width:100%;">
          <div class="pf"><span>Linha atribuída</span> ${line.name}</div>
          <div class="pf"><span>Ano</span> ${t.ano_fabricacao}</div>
          <div class="pf"><span>Capacidade</span> ${formatNumber(t.capacidade_toneladas)} t</div>
          <div class="pf"><span>Velocidade individual</span> ${l ? formatNumber(l.velocidade_kmh) + ' km/h' : 'Sem leitura registrada'}</div>
          <div class="pf"><span>Última leitura</span> ${l ? formatDateTime(l.data_hora) : '—'}</div>
        </div>
      </div>
    </div>
  `;
  go('train-detail');
}
function routeSvg(line = trainRouteInfo(0), moving = true) {
  const stations = [
    { n: 1, x: 90, y: 90 }, { n: 2, x: 250, y: 90 }, { n: 3, x: 410, y: 90 },
    { n: 4, x: 530, y: 205 }, { n: 5, x: 530, y: 340 }, { n: 6, x: 380, y: 455 },
    { n: 7, x: 220, y: 455 }, { n: 8, x: 220, y: 300 }, { n: 9, x: 760, y: 205 },
    { n: 10, x: 760, y: 340 }, { n: 11, x: 900, y: 455 }, { n: 12, x: 900, y: 90 }
  ];
  return `
  <div class="rail-map">
    <div class="rail-map-topline"><span><i class="map-live-dot"></i> Mapa operacional</span><span>Simulação de circulação</span></div>
    <div class="rail-map-canvas">
    <svg class="rail-svg" viewBox="0 0 1000 540" width="100%" role="img" aria-label="Mapa de metrô esquemático com três linhas e doze estações">
      <defs>
        <pattern id="metroGrid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0H0V25" fill="none" stroke="#e6eaf0" stroke-width="1"/></pattern>
        <filter id="metroTrainShadow" x="-60%" y="-60%" width="220%" height="220%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity=".22"/></filter>
      </defs>
      <rect width="1000" height="540" rx="12" fill="#f8fafc"/><rect width="1000" height="540" rx="12" fill="url(#metroGrid)"/>
      <g fill="none" stroke="#fff" stroke-width="24" stroke-linecap="round" stroke-linejoin="round">
        <path d="M90 90 H410 L530 205 V340 L380 455 H220 V300"/><path d="M530 205 H760 L900 90"/><path d="M530 340 H760 L900 455"/>
      </g>
      <g fill="none" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">
        <path id="metroLineRed" d="M90 90 H410 L530 205 V340 L380 455 H220 V300" stroke="#c92a2a"/>
        <path id="metroLineBlue" d="M530 205 H760 L900 90" stroke="#2479b7"/>
        <path id="metroLineGold" d="M530 340 H760 L900 455" stroke="#e0a12b"/><path id="metroLineGreen" d="M90 180 H250 V250 H410" stroke="#2f9e44"/>
      </g>
      <g fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="3 18" stroke-linecap="round">
        <path d="M90 90 H410 L530 205 V340 L380 455 H220 V300"/><path d="M530 205 H760 L900 90"/><path d="M530 340 H760 L900 455"/>
      </g>
      <g font-family="Arial,sans-serif" font-size="15" font-weight="700" fill="#253047">
        <g transform="translate(90 90)"><circle r="16" fill="#fff" stroke="#c92a2a" stroke-width="5"/><circle r="5" fill="#c92a2a"/><text x="0" y="-28" text-anchor="middle">Estação 1</text></g>
        <g transform="translate(250 90)"><circle r="16" fill="#fff" stroke="#c92a2a" stroke-width="5"/><circle r="5" fill="#c92a2a"/><text x="0" y="-28" text-anchor="middle">Estação 2</text></g>
        <g transform="translate(410 90)"><circle r="16" fill="#fff" stroke="#c92a2a" stroke-width="5"/><circle r="5" fill="#c92a2a"/><text x="0" y="-28" text-anchor="middle">Estação 3</text></g>
        <g transform="translate(530 205)"><circle r="18" fill="#fff" stroke="#c92a2a" stroke-width="6"/><circle r="6" fill="#c92a2a"/><text x="-22" y="-30" text-anchor="end">Estação 4</text><text x="-22" y="-13" text-anchor="end" font-size="11" fill="#687386">Integração</text></g>
        <g transform="translate(530 340)"><circle r="16" fill="#fff" stroke="#c92a2a" stroke-width="5"/><circle r="5" fill="#c92a2a"/><text x="-25" y="-26" text-anchor="end">Estação 5</text></g>
        <g transform="translate(380 455)"><circle r="16" fill="#fff" stroke="#c92a2a" stroke-width="5"/><circle r="5" fill="#c92a2a"/><text x="0" y="34" text-anchor="middle">Estação 6</text></g>
        <g transform="translate(220 455)"><circle r="16" fill="#fff" stroke="#c92a2a" stroke-width="5"/><circle r="5" fill="#c92a2a"/><text x="0" y="34" text-anchor="middle">Estação 7</text></g>
        <g transform="translate(220 300)"><circle r="16" fill="#fff" stroke="#c92a2a" stroke-width="5"/><circle r="5" fill="#c92a2a"/><text x="-24" y="-25" text-anchor="end">Estação 8</text></g>
        <g transform="translate(760 205)"><circle r="16" fill="#fff" stroke="#2479b7" stroke-width="5"/><circle r="5" fill="#2479b7"/><text x="0" y="-29" text-anchor="middle">Estação 9</text></g>
        <g transform="translate(760 340)"><circle r="16" fill="#fff" stroke="#e0a12b" stroke-width="5"/><circle r="5" fill="#e0a12b"/><text x="0" y="-29" text-anchor="middle">Estação 10</text></g>
        <g transform="translate(900 455)"><circle r="16" fill="#fff" stroke="#e0a12b" stroke-width="5"/><circle r="5" fill="#e0a12b"/><text x="0" y="34" text-anchor="middle">Estação 11</text></g>
        <g transform="translate(900 90)"><circle r="16" fill="#fff" stroke="#2479b7" stroke-width="5"/><circle r="5" fill="#2479b7"/><text x="0" y="-29" text-anchor="middle">Estação 12</text></g>
      </g>

    </svg>
    </div>
    <div class="rail-map-legend"><span><b class="legend-dot red"></b> Linha principal</span><span><b class="legend-dot blue"></b> Ramal Leste</span><span><b class="legend-dot gold"></b> Linha Sul</span><span>🚆 Trem em movimento (simulação)</span></div>
  </div>`;
}

/* ---------- Perfil ---------- */
function renderProfile() {
  if (!state.user) return '<p class="empty-note">Faça login para ver o perfil.</p>';
  const u = state.user;

  return `
    <div class="profile-card">
      <div class="profile-top">
        <div class="avatar">${ICONS.user}</div>
        <div>
          <div class="profile-name">${escapeHtml(u.nome_usuario)}</div>
          <div class="profile-email">${escapeHtml(u.email_usuario)}</div>
          <span class="profile-tag">${u.tipo_usuario === 'empresa' ? 'Empresa' : 'Pessoa'}</span>
        </div>
      </div>
      <div class="profile-fields">
        <div class="pf"><span>Nome</span> ${escapeHtml(u.nome_usuario)}</div>
        <div class="pf"><span>E-mail</span> ${escapeHtml(u.email_usuario)}</div>
        ${u.cnpj_usuario ? `<div class="pf"><span>CNPJ</span> ${escapeHtml(u.cnpj_usuario)}</div>` : ''}
        <div class="pf"><span>Tipo de conta</span> ${u.tipo_usuario === 'empresa' ? 'Empresa' : 'Pessoa física'}</div>
      </div>
      <div class="profile-actions">
        <button class="btn btn-outline" onclick="alert('Funcionalidade em construção.')">Trocar senha</button>
        <button class="btn btn-ghost-light" onclick="sair()">Sair</button>
        <button class="btn btn-danger-outline" onclick="alert('Funcionalidade em construção.')">Excluir conta</button>
      </div>
    </div>
  `;
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  paintStaticIcons();
  wireAuthForms();

  // Atualiza o relógio do menu sem precisar recarregar a página.
  const atualizarRelogio = () => {
    const texto = dataHoraAtual();
    document.querySelectorAll('.sf-time').forEach((el) => { el.textContent = texto; });
  };
  atualizarRelogio();
  setInterval(atualizarRelogio, 1000);

  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });

  const logado = await verificarSessao();
  if (logado) {
    await carregarDados();
  }

  setTimeout(() => {
    if (document.getElementById('screen-splash').classList.contains('active')) {
      go(logado ? 'home' : 'landing');
    }
  }, 1300);
});
