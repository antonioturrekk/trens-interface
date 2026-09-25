<?php

require 'auth.php';
require 'limites.php';

$usuario = usuarioLogado();

$sqlResumo = 'SELECT t.id_trem,
                     t.prefixo_trem,
                     t.modelo_trem,
                     t.situacao_trem,
                     COUNT(l.id_leitura)                  AS total_leituras,
                     AVG(l.velocidade_kmh)        AS media_velocidade,
                     MAX(l.velocidade_kmh)        AS maior_velocidade,
                     AVG(l.temperatura_motor_c)   AS media_temperatura,
                     MAX(l.temperatura_motor_c)   AS maior_temperatura,
                     AVG(l.consumo_litros_hora)   AS media_consumo,
                     MAX(l.vibracao_mm_s)         AS maior_vibracao
                FROM trens t
                LEFT JOIN leitura_sensor l ON l.fk_id_trem = t.id_trem
            GROUP BY t.id_trem, t.prefixo_trem, t.modelo_trem, t.situacao_trem
            ORDER BY t.prefixo_trem';

$resumo = $conexao->query($sqlResumo);

$sqlAlertas = 'SELECT l.*, t.prefixo_trem
                 FROM leitura_sensor l
                 INNER JOIN trens t ON t.id_trem = l.fk_id_trem
                WHERE l.velocidade_kmh      > ?
                   OR l.temperatura_motor_c > ?
                   OR l.consumo_litros_hora > ?
                   OR l.vibracao_mm_s       > ?
             ORDER BY l.data_hora DESC
                LIMIT 15';

$comando = $conexao->prepare($sqlAlertas);
$comando->bind_param('dddd', $limiteVelocidade, $limiteTemperatura, $limiteConsumo, $limiteVibracao);
$comando->execute();
$alertas = $comando->get_result();

$totalLeituras = $conexao->query('SELECT COUNT(*) AS total FROM leitura_sensor')->fetch_assoc()['total'];

?>
<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Painel de monitoramento</title>
    <link rel="stylesheet" href="style.css">
</head>

<body>

    <header>
        <div class="cabecalho-esquerda">
            <span class="marca">Frota Ferroviária</span>
            <nav>
                <a href="index.php">Trens</a>
                <a href="painel.php" class="ativo">Painel</a>
                <a href="leituras.php">Leituras</a>
                <a href="simulador.php">Simulador</a>
                <a href="consumir_api.php">API</a>
            </nav>
        </div>
        <div class="usuario-area">
            <span class="usuario-nome">Olá, <?= htmlspecialchars($usuario['nome']) ?></span>
            <a href="logout.php" class="link-sair">Sair</a>
        </div>
    </header>

    <main>
        <h1>Painel de monitoramento</h1>
        <p class="apoio">
            Total de <?= (int) $totalLeituras ?> leituras registradas.
            Limites: velocidade <?= $limiteVelocidade ?> km/h, temperatura <?= $limiteTemperatura ?> C,
            consumo <?= $limiteConsumo ?> L/h, vibração <?= $limiteVibracao ?> mm/s.
        </p>

        <h2>Resumo por trem</h2>

        <table>
            <thead>
                <tr>
                    <th>Trem</th>
                    <th>Leituras</th>
                    <th>Velocidade média</th>
                    <th>Maior velocidade</th>
                    <th>Temperatura média</th>
                    <th>Maior temperatura</th>
                </tr>
            </thead>
            <tbody>
                <?php while ($linha = $resumo->fetch_assoc()): ?>
                    <tr>
                        <td><?= htmlspecialchars($linha['prefixo_trem']) ?></td>
                        <td><?= (int) $linha['total_leituras'] ?></td>
                        <td>
                            <?php if ($linha['total_leituras'] > 0): ?>
                                <?= number_format((float) $linha['media_velocidade'], 2, ',', '.') ?> km/h
                            <?php else: ?>
                                &mdash;
                            <?php endif; ?>
                        </td>
                        <td class="<?= $linha['maior_velocidade'] > $limiteVelocidade ? 'acima' : '' ?>">
                            <?php if ($linha['total_leituras'] > 0): ?>
                                <?= number_format((float) $linha['maior_velocidade'], 2, ',', '.') ?> km/h
                            <?php else: ?>
                                &mdash;
                            <?php endif; ?>
                        </td>
                        <td>
                            <?php if ($linha['total_leituras'] > 0): ?>
                                <?= number_format((float) $linha['media_temperatura'], 2, ',', '.') ?> C
                            <?php else: ?>
                                &mdash;
                            <?php endif; ?>
                        </td>
                        <td class="<?= $linha['maior_temperatura'] > $limiteTemperatura ? 'acima' : '' ?>">
                            <?php if ($linha['total_leituras'] > 0): ?>
                                <?= number_format((float) $linha['maior_temperatura'], 2, ',', '.') ?> C
                            <?php else: ?>
                                &mdash;
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endwhile; ?>
            </tbody>
        </table>

        <h2>Velocidade média por trem</h2>

        <div class="grafico">
            <?php
            $resumo->data_seek(0);
            while ($linha = $resumo->fetch_assoc()):
                if ($linha['total_leituras'] == 0) {
                    continue;
                }

                $media    = (float) $linha['media_velocidade'];
                $largura  = ($media / 120) * 100;

                if ($largura > 100) {
                    $largura = 100;
                }
            ?>
                <div class="barra-linha">
                    <span class="barra-rotulo"><?= htmlspecialchars($linha['prefixo_trem']) ?></span>
                    <span class="barra-trilho">
                        <span class="barra-preenchida" style="width: <?= number_format($largura, 2, '.', '') ?>%"></span>
                    </span>
                    <span class="barra-valor"><?= number_format($media, 1, ',', '.') ?> km/h</span>
                </div>
            <?php endwhile; ?>
        </div>

        <h2>Últimos alertas</h2>

        <?php if ($alertas->num_rows === 0): ?>
            <p class="vazio">Nenhuma leitura ultrapassou os limites definidos.</p>
        <?php else: ?>
            <table>
                <thead>
                    <tr>
                        <th>Data e hora</th>
                        <th>Trem</th>
                        <th>Falhas identificadas</th>
                    </tr>
                </thead>
                <tbody>
                    <?php while ($leitura = $alertas->fetch_assoc()): ?>
                        <?php
                        $falhas = classificarLeitura(
                            $leitura,
                            $limiteVelocidade,
                            $limiteTemperatura,
                            $limiteConsumo,
                            $limiteVibracao
                        );
                        ?>
                        <tr>
                            <td><?= date('d/m/Y H:i', strtotime($leitura['data_hora'])) ?></td>
                            <td><?= htmlspecialchars($leitura['prefixo_trem']) ?></td>
                            <td><?= htmlspecialchars(implode(' · ', $falhas)) ?></td>
                        </tr>
                    <?php endwhile; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </main>

</body>

</html>
