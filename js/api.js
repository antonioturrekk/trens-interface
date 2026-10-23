/* =========================================================
   FasTrain — Camada de acesso à API (api/*.php)
   ========================================================= */
const API_BASE = 'api';

async function apiRequest(path, options = {}) {
  let resposta;

  try {
    resposta = await fetch(`${API_BASE}/${path}`, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
  } catch (erroRede) {
    throw new Error('Não foi possível conectar ao servidor. Verifique se o backend PHP está rodando.');
  }

  let dados = null;
  try {
    dados = await resposta.json();
  } catch (e) {
    dados = null;
  }

  if (!resposta.ok) {
    const msg =
      (dados && dados.erro) ||
      (dados && Array.isArray(dados.erros) && dados.erros.join(' ')) ||
      `Erro ${resposta.status} na requisição.`;
    throw new Error(msg);
  }

  return dados;
}

const Api = {
  trens: {
    listar: () => apiRequest('trens.php'),
    obter: (id) => apiRequest(`trens.php?id=${encodeURIComponent(id)}`),
    criar: (dados) => apiRequest('trens.php', { method: 'POST', body: JSON.stringify(dados) }),
    atualizar: (id, dados) =>
      apiRequest(`trens.php?id=${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(dados) }),
    excluir: (id) => apiRequest(`trens.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
  },
  sensores: {
    listar: () => apiRequest('sensores.php'),
    criar: (dados) => apiRequest('sensores.php', { method: 'POST', body: JSON.stringify(dados) }),
    excluir: (id) => apiRequest(`sensores.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
  },
  leituras: {
    listar: (tremId = 0, limite = 200) =>
      apiRequest(`leituras.php?trem_id=${encodeURIComponent(tremId)}&limite=${encodeURIComponent(limite)}`),
    criar: (dados) => apiRequest('leituras.php', { method: 'POST', body: JSON.stringify(dados) }),
    excluir: (id) => apiRequest(`leituras.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
  },
  auth: {
    registrar: (dados) =>
      apiRequest('auth.php', { method: 'POST', body: JSON.stringify({ action: 'register', ...dados }) }),
    login: (email, senha) =>
      apiRequest('auth.php', { method: 'POST', body: JSON.stringify({ action: 'login', email, senha }) }),
    logout: () => apiRequest('auth.php', { method: 'POST', body: JSON.stringify({ action: 'logout' }) }),
    me: () => apiRequest('auth.php?action=me'),
  },
};
