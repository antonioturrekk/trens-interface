<?php

require '../conexao.php';
require 'resposta.php';

$metodo = $_SERVER['REQUEST_METHOD'];

$situacoes = [
    'ativo' => 'Ativo',
    'manutencao' => 'Em manutenção',
    'inativo' => 'Inativo'
];

if ($metodo === 'OPTIONS') {
    responderJson(200, ['ok' => true]);
}

if ($metodo === 'GET') {
    $id = (int) ($_GET['id'] ?? 0);

    if ($id > 0) {
        $stmt = $conexao->prepare('SELECT * FROM trens WHERE id_trem = ?');
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $trem = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$trem) {
            responderErro(404, 'Trem nao encontrado.');
        }

        responderJson(200, $trem);
    }

    $resultado = $conexao->query('SELECT * FROM trens ORDER BY prefixo_trem');

    $trens = [];

    while ($linha = $resultado->fetch_assoc()) {
        $trens[] = $linha;
    }

    responderJson(200, [
        'total' => count($trens),
        'trens' => $trens
    ]);
}

if ($metodo === 'POST') {
    $dados = lerCorpoJson();

    $prefixo = trim($dados['prefixo_trem'] ?? '');
    $modelo = trim($dados['modelo_trem'] ?? '');
    $ano_fabricacao = trim((string) ($dados['ano_fabricacao'] ?? ''));
    $capacidade_toneladas = trim((string) ($dados['capacidade_toneladas'] ?? ''));
    $situacao = $dados['situacao_trem'] ?? 'ativo';

    $erros = [];

    if ($prefixo === '') {
        $erros[] = 'Informe o prefixo do trem.';
    }

    if ($modelo === '') {
        $erros[] = 'Informe o modelo do trem.';
    }

    if (!is_numeric($ano_fabricacao) || $ano_fabricacao < 1900 || $ano_fabricacao > 2100) {
        $erros[] = 'Informe um ano de fabricacao entre 1900 e 2100.';
    }

    if (!is_numeric($capacidade_toneladas) || $capacidade_toneladas <= 0) {
        $erros[] = 'Informe uma capacidade maior que zero.';
    }

    if (!isset($situacoes[$situacao])) {
        $erros[] = 'Selecione uma situacao valida.';
    }

    if (count($erros) > 0) {
        responderJson(422, ['erros' => $erros]);
    }

    $ano = (int) $ano_fabricacao;
    $capacidade = (float) $capacidade_toneladas;

    $stmt = $conexao->prepare('INSERT INTO trens (prefixo_trem, modelo_trem, ano_fabricacao, capacidade_toneladas, situacao_trem) VALUES (?, ?, ?, ?, ?)');
    $stmt->bind_param('ssids', $prefixo, $modelo, $ano, $capacidade, $situacao);

    if (!$stmt->execute()) {
        $stmt->close();
        responderErro(500, 'Nao foi possivel cadastrar o trem.');
    }

    $id = $conexao->insert_id;
    $stmt->close();

    $stmt = $conexao->prepare('SELECT * FROM trens WHERE id_trem = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $trem = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    responderJson(201, $trem);
}

if ($metodo === 'PUT') {
    $dados = lerCorpoJson();

    $id = (int) ($_GET['id'] ?? ($dados['id_trem'] ?? 0));

    if ($id <= 0) {
        responderErro(400, 'Informe o identificador do trem.');
    }

    $stmt = $conexao->prepare('SELECT id_trem FROM trens WHERE id_trem = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $existe = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$existe) {
        responderErro(404, 'Trem nao encontrado.');
    }

    $prefixo = trim($dados['prefixo_trem'] ?? '');
    $modelo = trim($dados['modelo_trem'] ?? '');
    $ano_fabricacao = trim((string) ($dados['ano_fabricacao'] ?? ''));
    $capacidade_toneladas = trim((string) ($dados['capacidade_toneladas'] ?? ''));
    $situacao = $dados['situacao_trem'] ?? '';

    $erros = [];

    if ($prefixo === '') {
        $erros[] = 'Informe o prefixo do trem.';
    }

    if ($modelo === '') {
        $erros[] = 'Informe o modelo do trem.';
    }

    if (!is_numeric($ano_fabricacao) || $ano_fabricacao < 1900 || $ano_fabricacao > 2100) {
        $erros[] = 'Informe um ano de fabricacao entre 1900 e 2100.';
    }

    if (!is_numeric($capacidade_toneladas) || $capacidade_toneladas <= 0) {
        $erros[] = 'Informe uma capacidade maior que zero.';
    }

    if (!isset($situacoes[$situacao])) {
        $erros[] = 'Selecione uma situacao valida.';
    }

    if (count($erros) > 0) {
        responderJson(422, ['erros' => $erros]);
    }

    $ano = (int) $ano_fabricacao;
    $capacidade = (float) $capacidade_toneladas;

    $stmt = $conexao->prepare('UPDATE trens SET prefixo_trem = ?, modelo_trem = ?, ano_fabricacao = ?, capacidade_toneladas = ?, situacao_trem = ? WHERE id_trem = ?');
    $stmt->bind_param('ssidsi', $prefixo, $modelo, $ano, $capacidade, $situacao, $id);

    if (!$stmt->execute()) {
        $stmt->close();
        responderErro(500, 'Nao foi possivel atualizar o trem.');
    }

    $stmt->close();

    $stmt = $conexao->prepare('SELECT * FROM trens WHERE id_trem = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $trem = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    responderJson(200, $trem);
}

if ($metodo === 'DELETE') {
    $dados = lerCorpoJson();

    $id = (int) ($_GET['id'] ?? ($dados['id_trem'] ?? 0));

    if ($id <= 0) {
        responderErro(400, 'Informe o identificador do trem.');
    }

    $stmt = $conexao->prepare('SELECT id_trem FROM trens WHERE id_trem = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $existe = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$existe) {
        responderErro(404, 'Trem nao encontrado.');
    }

    $stmt = $conexao->prepare('DELETE FROM trens WHERE id_trem = ?');
    $stmt->bind_param('i', $id);

    if (!$stmt->execute()) {
        $stmt->close();
        responderErro(500, 'Nao foi possivel excluir o trem.');
    }

    $stmt->close();

    responderJson(200, ['mensagem' => 'Trem excluido com sucesso.']);
}

responderErro(405, 'Metodo ' . $metodo . ' nao permitido neste recurso.');
