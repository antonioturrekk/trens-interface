<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Consumindo a API</title>
    <link rel="stylesheet" href="style.css">
</head>

<body>
    <header>
        <span class="marca">Frota Ferroviária</span>
        <nav>
            <a href="index.php">Trens</a>
            <a href="painel.php">Painel</a>
            <a href="leituras.php">Leituras</a>
            <a href="simulador.php">Simulador</a>
            <a href="consumir_api.php">API</a>
        </nav>
    </header>

    <main>
        <h1>Consumindo a API de trens</h1>
        <p class="apoio">
            Esta página não usa PHP para buscar os dados. Ela pede à API por JavaScript e monta a tabela no navegador.
        </p>

        <div class="acoes">
            <button id="botaoCarregar" class="botao botao-primario">Carregar trens</button>
            <button id="botaoLimpar" class="botao botao-secundario">Limpar</button>
        </div>

        <p id="aviso"></p>

        <table id="tabela" style="display: none;">
            <thead>
                <tr>
                    <th>Prefixo</th>
                    <th>Modelo</th>
                    <th>Ano</th>
                    <th>Capacidade</th>
                    <th>Situação</th>
                </tr>
            </thead>
            <tbody id="corpoTabela"></tbody>
        </table>

        <h2>Resposta bruta da API</h2>
        <pre id="bruto"></pre>
    </main>

    <script>
        const botaoCarregar = document.getElementById('botaoCarregar');
        const botaoLimpar = document.getElementById('botaoLimpar');
        const corpoTabela = document.getElementById('corpoTabela');
        const tabela = document.getElementById('tabela');
        const aviso = document.getElementById('aviso');
        const bruto = document.getElementById('bruto');

        async function carregarTrens() {
            aviso.textContent = 'Consultando a API...';

            const resposta = await fetch('api/trens.php');

            if (!resposta.ok) {
                aviso.textContent = 'A API respondeu com erro. Código: ' + resposta.status;
                return;
            }

            const dados = await resposta.json();

            bruto.textContent = JSON.stringify(dados, null, 4);

            if (dados.total === 0) {
                aviso.textContent = 'Nenhum trem cadastrado.';
                return;
            }

            corpoTabela.innerHTML = '';

            for (const trem of dados.trens) {
                const linha = document.createElement('tr');

                linha.innerHTML =
                    '<td>' + trem.prefixo_trem + '</td>' +
                    '<td>' + trem.modelo_trem + '</td>' +
                    '<td>' + trem.ano_fabricacao + '</td>' +
                    '<td>' + trem.capacidade_toneladas + '</td>' +
                    '<td>' + trem.situacao_trem + '</td>';

                corpoTabela.appendChild(linha);
            }

            tabela.style.display = 'table';
            aviso.textContent = dados.total + ' trens recebidos da API.';
        }

        function limpar() {
            corpoTabela.innerHTML = '';
            tabela.style.display = 'none';
            aviso.textContent = '';
            bruto.textContent = '';
        }

        botaoCarregar.addEventListener('click', carregarTrens);
        botaoLimpar.addEventListener('click', limpar);
    </script>
</body>

</html>