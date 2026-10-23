<?php

session_start();

require '../conexao.php';
require '../limites.php';

$tremId     = (int) ($_GET['id_trem'] ?? 0);
$somenteFalha = isset($_GET['somente_falha']);

$mensagem = $_SESSION['mensagem'] ?? '';
unset($_SESSION['mensagem']);

$trens = $conexao->query('SELECT id_trem, prefixo_trem, modelo_trem FROM trens ORDER BY prefixo_trem');

if ($tremId > 0) {
    $sql = 'SELECT l.*, t.prefixo_trem, t.modelo_trem
              FROM leitura_sensor l
              INNER JOIN trens t ON t.id_trem = l.fk_id_trem
             WHERE l.fk_id_trem = ?
          ORDER BY l.data_hora DESC
             LIMIT 200';

    $comando = $conexao->prepare($sql);
    $comando->bind_param('i', $tremId);
    $comando->execute();
    $leituras = $comando->get_result();
} else {
    $sql = 'SELECT l.*, t.prefixo_trem, t.modelo_trem
              FROM leitura_sensor l
              INNER JOIN trens t ON t.id_trem = l.fk_id_trem
          ORDER BY l.data_hora DESC
             LIMIT 200';

    $leituras = $conexao->query($sql);
}

?>
<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin · Leituras dos sensores</title>
    <link rel="stylesheet" href="admin.css">
</head>

<body>

    <header>
        <span class="marca">Frota Ferroviária · Admin</span>
        <nav>
            <a href="index.php">Trens</a>
            <a href="painel.php">Painel</a>
            <a href="leituras.php">Leituras</a>
            <a href="simulador.php">Simulador</a>
            <a href="../index.html">Voltar ao app</a>
        </nav>
    </header>

    <main>
        <div class="titulo">
            <h1>Leituras dos sensores</h1>
            <a href="exportar_csv.php?id_trem=<?= $tremId ?>" class="botao botao-secundario">Exportar CSV</a>
        </div>

        <?php if ($mensagem !== ''): ?>
            <p class="aviso"><?= htmlspecialchars($mensagem) ?></p>
        <?php endif; ?>

        <form method="get" class="formulario">
            <div class="linha">
                <div class="campo">
                    <label for="id_trem">Filtrar por trem</label>
                    <select id="id_trem" name="id_trem">
                        <option value="0">Todos os trens</option>
                        <?php while ($trem = $trens->fetch_assoc()): ?>
                            <option value="<?= (int) $trem['id_trem'] ?>" <?= $tremId === (int) $trem['id_trem'] ? 'selected' : '' ?>>
                                <?= htmlspecialchars($trem['prefixo_trem']) ?> - <?= htmlspecialchars($trem['modelo_trem']) ?>
                            </option>
                        <?php endwhile; ?>
                    </select>
                </div>

                <div class="campo">
                    <label for="somente_falha">Exibicao</label>
                    <label class="opcao">
                        <input type="checkbox" id="somente_falha" name="somente_falha" <?= $somenteFalha ? 'checked' : '' ?>>
                        Mostrar somente leituras com falha
                    </label>
                </div>
            </div>

            <div class="acoes">
                <button type="submit" class="botao botao-primario">Filtrar</button>
                <a href="leituras.php" class="botao botao-secundario">Limpar</a>
            </div>
        </form>

        <br>

        <?php if ($leituras->num_rows === 0): ?>
            <p class="vazio">Nenhuma leitura registrada. Use o simulador para gerar leituras.</p>
        <?php else: ?>
            <table>
                <thead>
                    <tr>
                        <th>Data e hora</th>
                        <th>Trem</th>
                        <th>Velocidade</th>
                        <th>Temperatura</th>
                        <th>Consumo</th>
                        <th>Vibração</th>
                        <th>Situação</th>
                    </tr>
                </thead>
                <tbody>
                    <?php while ($leitura = $leituras->fetch_assoc()): ?>
                        <?php
                        $falhas = classificarLeitura(
                            $leitura,
                            $limiteVelocidade,
                            $limiteTemperatura,
                            $limiteConsumo,
                            $limiteVibracao
                        );

                        if ($somenteFalha && count($falhas) === 0) {
                            continue;
                        }
                        ?>
                        <tr>
                            <td><?= date('d/m/Y H:i', strtotime($leitura['data_hora'])) ?></td>
                            <td><?= htmlspecialchars($leitura['prefixo_trem']) ?></td>
                            <td class="<?= $leitura['velocidade_kmh'] > $limiteVelocidade ? 'acima' : '' ?>">
                                <?= number_format((float) $leitura['velocidade_kmh'], 2, ',', '.') ?> km/h
                            </td>
                            <td class="<?= $leitura['temperatura_motor_c'] > $limiteTemperatura ? 'acima' : '' ?>">
                                <?= number_format((float) $leitura['temperatura_motor_c'], 2, ',', '.') ?> C
                            </td>
                            <td class="<?= $leitura['consumo_litros_hora'] > $limiteConsumo ? 'acima' : '' ?>">
                                <?= number_format((float) $leitura['consumo_litros_hora'], 2, ',', '.') ?> L/h
                            </td>
                            <td class="<?= $leitura['vibracao_mm_s'] > $limiteVibracao ? 'acima' : '' ?>">
                                <?= number_format((float) $leitura['vibracao_mm_s'], 2, ',', '.') ?> mm/s
                            </td>
                            <td>
                                <?php if (count($falhas) === 0): ?>
                                    <span class="etiqueta etiqueta-ativo">Normal</span>
                                <?php else: ?>
                                    <span class="etiqueta etiqueta-manutencao"><?= count($falhas) ?> alerta(s)</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endwhile; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </main>

</body>

</html>
