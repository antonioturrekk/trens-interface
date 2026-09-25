<?php
require '../conexao.php';
require 'resposta.php';

$metodo = $_SERVER['REQUEST_METHOD'];
$situacoes = ['ativo' => 'Ativo', 'manutencao' => 'Em manutenção', 'inativo' => 'Inativo'];

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
            responderErro(404, 'Trem não encontrado.');
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
    $modelo  = trim($dados['modelo_trem'] ?? '');
    $ano     = (int) ($dados['ano_fabricacao'] ?? 0);
    $capacidade = (float) ($dados['capacidade_toneladas'] ?? 0);
    $situacao   = $dados['situacao_trem'] ?? 'ativo';

    if ($prefixo === '' || $modelo === '' || $ano < 1900 || $capacidade <= 0 || !isset($situacoes[$situacao])) {
        responderJson(422, ['erro' => 'Dados inválidos para cadastro do trem.']);
    }

    $stmt = $conexao->prepare('INSERT INTO trens (prefixo_trem, modelo_trem, ano_fabricacao, capacidade_toneladas, situacao_trem) VALUES (?, ?, ?, ?, ?)');
    $stmt->bind_param('ssids', $prefixo, $modelo, $ano, $capacidade, $situacao);

    if (!$stmt->execute()) {
        responderErro(500, 'Não foi possível cadastrar o trem.');
    }

    $id = $conexao->insert_id;
    $stmt->close();

    responderJson(201, ['id_trem' => $id, 'mensagem' => 'Trem cadastrado com sucesso.']);
}

if ($metodo === 'DELETE') {
    $id = (int) ($_GET['id'] ?? 0);

    if ($id <= 0) {
        responderErro(400, 'Identificador inválido.');
    }

    $stmt = $conexao->prepare('DELETE FROM trens WHERE id_trem = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    
    if ($stmt->affected_rows === 0) {
        responderErro(404, 'Trem não encontrado.');
    }

    $stmt->close();
    responderJson(200, ['mensagem' => 'Trem excluído com sucesso.']);
}

responderErro(405, 'Método não permitido.');