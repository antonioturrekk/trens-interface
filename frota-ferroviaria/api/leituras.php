<?php

require '../conexao.php';
require '../limites.php';
require 'resposta.php';

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'OPTIONS') {
    responderJson(200, ['ok' => true]);
}

if ($metodo === 'GET') {
    $trem_id = (int) ($_GET['trem_id'] ?? 0);
    $limite = (int) ($_GET['limite'] ?? 50);

    if ($limite < 1 || $limite > 500) {
        $limite = 50;
    }

    if ($trem_id > 0) {
        $stmt = $conexao->prepare('SELECT id_trem, prefixo_trem FROM trens WHERE id_trem = ?');
        $stmt->bind_param('i', $trem_id);
        $stmt->execute();
        $trem = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$trem) {
            responderErro(404, 'Trem nao encontrado.');
        }

        $sql = 'SELECT l.*, t.prefixo_trem
                  FROM leitura_sensor l
                  INNER JOIN trens t ON t.id_trem = l.fk_id_trem
                 WHERE l.fk_id_trem = ?
              ORDER BY l.data_hora DESC
                 LIMIT ?';

        $stmt = $conexao->prepare($sql);
        $stmt->bind_param('ii', $trem_id, $limite);
    } else {
        $sql = 'SELECT l.*, t.prefixo_trem
                  FROM leitura_sensor l
                  INNER JOIN trens t ON t.id_trem = l.fk_id_trem
              ORDER BY l.data_hora DESC
                 LIMIT ?';

        $stmt = $conexao->prepare($sql);
        $stmt->bind_param('i', $limite);
    }

    $stmt->execute();
    $resultado = $stmt->get_result();

    $leituras = [];

    while ($linha = $resultado->fetch_assoc()) {
        $falhas = classificarLeitura($linha, $limiteVelocidade, $limiteTemperatura, $limiteConsumo, $limiteVibracao);

        $linha['falhas'] = $falhas;
        $linha['situacao'] = count($falhas) === 0 ? 'normal' : 'alerta';

        $leituras[] = $linha;
    }

    $stmt->close();

    responderJson(200, [
        'total' => count($leituras),
        'limites' => [
            'velocidade_kmh' => $limiteVelocidade,
            'temperatura_motor_c' => $limiteTemperatura,
            'consumo_litros_hora' => $limiteConsumo,
            'vibracao_mm_s' => $limiteVibracao
        ],
        'leituras' => $leituras
    ]);
}

if ($metodo === 'POST') {
    $dados = lerCorpoJson();

    $trem_id = (int) ($dados['fk_id_trem'] ?? 0);
    $velocidade = $dados['velocidade_kmh'] ?? '';
    $temperatura = $dados['temperatura_motor_c'] ?? '';
    $consumo = $dados['consumo_litros_hora'] ?? '';
    $vibracao = $dados['vibracao_mm_s'] ?? '';

    $erros = [];

    if ($trem_id <= 0) {
        $erros[] = 'Informe o identificador do trem.';
    }

    if (!is_numeric($velocidade) || $velocidade < 0) {
        $erros[] = 'Informe a velocidade em km/h.';
    }

    if (!is_numeric($temperatura)) {
        $erros[] = 'Informe a temperatura do motor.';
    }

    if (!is_numeric($consumo) || $consumo < 0) {
        $erros[] = 'Informe o consumo em litros por hora.';
    }

    if (!is_numeric($vibracao) || $vibracao < 0) {
        $erros[] = 'Informe a vibracao em mm/s.';
    }

    if (count($erros) > 0) {
        responderJson(422, ['erros' => $erros]);
    }

    $stmt = $conexao->prepare('SELECT id_trem FROM trens WHERE id_trem = ?');
    $stmt->bind_param('i', $trem_id);
    $stmt->execute();
    $existe = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$existe) {
        responderErro(404, 'Trem nao encontrado. Nenhuma leitura foi gravada.');
    }

    $data_hora = date('Y-m-d H:i:s');
    $velocidade = (float) $velocidade;
    $temperatura = (float) $temperatura;
    $consumo = (float) $consumo;
    $vibracao = (float) $vibracao;

    $sql = 'INSERT INTO leitura_sensor
                (fk_id_trem, data_hora, velocidade_kmh, temperatura_motor_c, consumo_litros_hora, vibracao_mm_s)
            VALUES (?, ?, ?, ?, ?, ?)';

    $stmt = $conexao->prepare($sql);
    $stmt->bind_param('isdddd', $trem_id, $data_hora, $velocidade, $temperatura, $consumo, $vibracao);

    if (!$stmt->execute()) {
        $stmt->close();
        responderErro(500, 'Nao foi possivel gravar a leitura.');
    }

    $id = $conexao->insert_id;
    $stmt->close();

    $stmt = $conexao->prepare('SELECT * FROM leitura_sensor WHERE id_leitura = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $leitura = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $falhas = classificarLeitura($leitura, $limiteVelocidade, $limiteTemperatura, $limiteConsumo, $limiteVibracao);

    $leitura['falhas'] = $falhas;
    $leitura['situacao'] = count($falhas) === 0 ? 'normal' : 'alerta';

    responderJson(201, $leitura);
}

responderErro(405, 'Metodo ' . $metodo . ' nao permitido neste recurso.');