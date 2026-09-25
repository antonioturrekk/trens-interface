<?php
require 'auth.php';

$usuario = usuarioLogado();

$mensagem = $_SESSION['mensagem'] ?? '';
unset($_SESSION['mensagem']);

$resultado = $conexao->query('SELECT * FROM trens ORDER BY prefixo_trem');
?>
<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Frota Ferroviária</title>
    <link rel="stylesheet" href="style.css">
</head>

<body>

    <header>
        <div class="cabecalho-esquerda">
            <span class="marca">Frota Ferroviária</span>
            <nav>
                <a href="index.php" class="ativo">Trens</a>
                <a href="painel.php">Painel</a>
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
        <div class="cabecalho-pagina">
            <h1>Gestão da Frota</h1>
            <a href="formulario.php" class="botao botao-primario">+ Novo Trem</a>
        </div>

        <?php if ($mensagem !== ''): ?>
            <div class="aviso aviso-sucesso"><?= htmlspecialchars($mensagem) ?></div>
        <?php endif; ?>

        <table>
            <thead>
                <tr>
                    <th>Prefixo</th>
                    <th>Modelo</th>
                    <th>Ano</th>
                    <th>Capacidade (t)</th>
                    <th>Situação</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                <?php if (!$resultado || $resultado->num_rows === 0): ?>
                    <tr>
                        <td colspan="6" class="vazio">Nenhum comboio registado na frota.</td>
                    </tr>
                <?php else: ?>
                    <?php while ($trem = $resultado->fetch_assoc()): ?>
                        <tr>
                            <td><strong><?= htmlspecialchars($trem['prefixo_trem']) ?></strong></td>
                            <td><?= htmlspecialchars($trem['modelo_trem']) ?></td>
                            <td><?= (int) $trem['ano_fabricacao'] ?></td>
                            <td><?= number_format((float) $trem['capacidade_toneladas'], 2, ',', '.') ?> t</td>
                            <td>
                                <span class="badge badge-<?= htmlspecialchars($trem['situacao_trem']) ?>">
                                    <?= htmlspecialchars($trem['situacao_trem']) ?>
                                </span>
                            </td>
                            <td>
                                <a href="formulario.php?id=<?= (int) $trem['id_trem'] ?>" class="botao-link">Editar</a>
                            </td>
                        </tr>
                    <?php endwhile; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </main>

</body>

</html>
