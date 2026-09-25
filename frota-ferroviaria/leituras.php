<?php
session_start();
require 'conexao.php';

$sql = "SELECT l.*, t.prefixo_trem, t.modelo_trem 
        FROM leitura_sensor l 
        INNER JOIN trens t ON l.fk_id_trem = t.id_trem 
        ORDER BY l.data_hora DESC LIMIT 50";
$resultado = $conexao->query($sql);
?>
<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Leituras dos Sensores - Frota Ferroviária</title>
    <link rel="stylesheet" href="style.css">
</head>

<body>

    <header>
        <span class="marca">Frota Ferroviária</span>
        <nav>
            <a href="index.php">Trens</a>
            <a href="painel.php">Painel</a>
            <a href="leituras.php" class="ativo">Leituras</a>
            <a href="simulador.php">Simulador</a>
            <a href="consumir_api.php">API</a>
        </nav>
    </header>

    <main>
        <div class="cabecalho-pagina">
            <h1>Histórico de Leituras</h1>
            <a href="simulador.php" class="botao botao-primario">+ Gerar Leitura</a>
        </div>

        <p class="apoio">Exibindo as últimas 50 leituras de telemetria registadas pelos sensores.</p>

        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Trem</th>
                    <th>Velocidade</th>
                    <th>Temperatura</th>
                    <th>Data e Hora</th>
                </tr>
            </thead>
            <tbody>
                <?php if (!$resultado || $resultado->num_rows === 0): ?>
                    <tr>
                        <td colspan="5" class="vazio">Nenhuma leitura registada. Utilize o simulador para gerar dados.</td>
                    </tr>
                <?php else: ?>
                    <?php while ($leitura = $resultado->fetch_assoc()): ?>
                        <tr>
                            <td>#<?= (int) $leitura['id_leitura'] ?></td>
                            <td><strong><?= htmlspecialchars($leitura['prefixo_trem']) ?></strong> (<?= htmlspecialchars($leitura['modelo_trem']) ?>)</td>
                            <td><?= number_format((float) $leitura['velocidade_kmh'], 1, ',', '.') ?> km/h</td>
                            <td><?= number_format((float) $leitura['temperatura_motor_c'], 1, ',', '.') ?> °C</td>
                            <td><?= date('d/m/Y H:i:s', strtotime($leitura['data_hora'])) ?></td>
                        </tr>
                    <?php endwhile; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </main>

</body>

</html>