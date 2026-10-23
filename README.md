# FasTrain — Painel de Monitoramento de Frota Ferroviária

Projeto único: front-end (SPA em HTML/CSS/JS puro) consumindo um back-end
PHP + MySQL real, com autenticação de verdade. Visual baseado em painel
administrativo (topo azul, sidebar cinza clara com destaques vermelhos,
tabelas densas).

## Como rodar

1. Suba um MySQL local (ex.: XAMPP, Laragon, ou `mysql` + `apache`/`php -S`).
2. Importe o banco:
   ```
   mysql -u root -p < database/frota_ferroviaria.sql
   ```
3. Confira as credenciais em `conexao.php` (por padrão `root` sem senha, banco
   `frota_ferroviaria`, `localhost`).
4. Suba o servidor PHP a partir da raiz do projeto:
   ```
   php -S localhost:8000
   ```
   (ou aponte o Apache/XAMPP para esta pasta).
5. Acesse `http://localhost:8000/index.html` — essa é a interface principal.
   Crie uma conta (Sign Up) para entrar; os dados de trens e leituras já vêm
   populados pelo `.sql`.

## Estrutura

```
fastrain/
├── index.html              → SPA principal (todas as telas)
├── css/style.css            → design system (topo azul + sidebar + tabelas)
├── js/
│   ├── icons.js              → ícones SVG inline
│   ├── api.js                 → camada fetch para api/*.php
│   └── app.js                  → navegação, autenticação, renderização, modais
├── assets/
│   ├── logo-light.png
│   └── logo-dark.png
├── conexao.php               → conexão MySQL (compartilhada por api/ e admin/)
├── limites.php               → limites usados para classificar leituras em alerta
├── api/                       → API REST em JSON, consumida pelo front-end
│   ├── resposta.php            → helpers de resposta JSON/erro
│   ├── auth.php                 → registro, login, logout, sessão (NOVO)
│   ├── trens.php                → CRUD de trens
│   └── leituras.php             → listagem e criação de leituras de sensores
├── admin/                     → páginas PHP clássicas (CRUD server-side),
│   │                             úteis para depuração/testes sem depender do JS
│   ├── admin.css
│   ├── index.php                → lista/exclui trens
│   ├── formulario.php           → cadastra/edita trem
│   ├── painel.php               → resumo + alertas server-side
│   ├── leituras.php             → lista de leituras com filtro
│   ├── simulador.php            → gera leituras aleatórias (útil p/ testes)
│   ├── exportar_csv.php         → exporta leituras em CSV
│   └── consumir_api.php         → demo simples de fetch à API
└── database/
    └── frota_ferroviaria.sql   → schema + seed (trens, leitura_sensor, usuarios)
```

## Autenticação

Antes não existia usuário nenhum no banco — as telas de login/cadastro do
front-end só navegavam entre telas. Agora:

- Nova tabela `usuarios` (nome, e-mail único, hash de senha com
  `password_hash()`, tipo `pessoa`/`empresa`, CNPJ quando empresa).
- `api/auth.php` implementa `action=register`, `action=login`,
  `action=logout` (POST, JSON) e `action=me` (GET) usando sessão PHP
  (`$_SESSION['id_usuario']`).
- O front-end (`js/app.js`) verifica a sessão ao carregar (`Api.auth.me()`);
  se não houver sessão válida, mostra a tela de login/cadastro. Depois de
  logar, o nome do usuário aparece no topo e na tela de Perfil.
- Senhas nunca trafegam nem ficam salvas em texto puro.

**Nota:** "Esqueci minha senha" e "Trocar senha"/"Excluir conta" no perfil
ainda são placeholders (não implementados) — ficou fora do escopo por ora.

## O que veio do mock e virou real

| Tela (mock antigo)      | Agora                                                              |
|--------------------------|---------------------------------------------------------------------|
| `data.js` (trens fixos)  | `Api.trens.listar()` → `GET api/trens.php`                         |
| `data.js` (sensores)     | Derivado da última leitura de cada trem (`GET api/leituras.php`)   |
| `data.js` (notificações) | Leituras cuja `situacao === 'alerta'` (calculado no back-end)       |
| Login/cadastro decorativos | `api/auth.php` real, com sessão PHP                              |
| "Add train" (alert)      | Modal real → `POST`/`PUT api/trens.php`                            |
| Sensores "+" (alert)     | Modal de leitura manual → `POST api/leituras.php`                  |

Como o banco não tem cidades de origem/destino por trem (só prefixo, modelo,
ano, capacidade e situação), as telas de "trens em trânsito"/mapa mostram
prefixo + modelo + status + última leitura, em vez das rotas fictícias do
mock original. O mapa (SVG) continua ilustrativo — não há dados geográficos
reais no banco.

## Painel `/admin`

As páginas PHP originais (CRUD clássico, sem JS) foram preservadas em
`/admin`, com os `require` ajustados para a nova estrutura de pastas. Serve
como ferramenta de depuração/teste independente do front-end novo — por
exemplo, o simulador (`admin/simulador.php`) é o jeito mais rápido de gerar
massa de leituras para testar o painel.

## Responsivo

- **Mobile (< 900px):** menu hambúrguer abre a sidebar por cima do conteúdo.
- **Desktop (≥ 900px):** sidebar fixa à esquerda, abaixo do topo azul.
