<?php

require '../conexao.php';

$tremId = (int) ($_GET['id_trem'] ?? 0);

if ($tremId > 0) {
    $sql = 'SELECT t.prefixo_trem, l.data_hora, l.velocidade_kmh, l.temperatura_motor_c,
                   l.consumo_litros_hora, l.vibracao_mm_s
              FROM leitura_sensor l
              INNER JOIN trens t ON t.id_trem = l.fk_id_trem
             WHERE l.fk_id_trem = ?
          ORDER BY l.data_hora';

    $comando = $conexao->prepare($sql);
    $comando->bind_param('i', $tremId);
    $comando->execute();
    $leituras = $comando->get_result();
} else {
    $sql = 'SELECT t.prefixo_trem, l.data_hora, l.velocidade_kmh, l.temperatura_motor_c,
                   l.consumo_litros_hora, l.vibracao_mm_s
              FROM leitura_sensor l
              INNER JOIN trens t ON t.id_trem = l.fk_id_trem
          ORDER BY t.prefixo_trem, l.data_hora';

    $leituras = $conexao->query($sql);
}

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename=leituras.csv');

$saida = fopen('php://output', 'w');

fputcsv($saida, ['Trem', 'Data e hora', 'Velocidade km/h', 'Temperatura C', 'Consumo L/h', 'Vibracao mm/s'], ';');

while ($leitura = $leituras->fetch_assoc()) {
    fputcsv($saida, [
        $leitura['prefixo_trem'],
        $leitura['data_hora'],
        $leitura['velocidade_kmh'],
        $leitura['temperatura_motor_c'],
        $leitura['consumo_litros_hora'],
        $leitura['vibracao_mm_s'],
    ], ';');
}

fclose($saida);
