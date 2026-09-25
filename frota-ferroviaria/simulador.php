<?php
require 'auth.php';

$usuario = usuarioLogado();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $tremId     = (int) $_POST['trem_id'];
    $quantidade = (int) $_POST['quantidade'];

    if ($tremId > 0 && $quantidade >= 1 && $quantidade <= 200) {
        $sql = 'INSERT INTO leitura_sensor (fk_id_trem, data_hora, velocidade_kmh, temperatura_motor_c, consumo_litros_hora, vibracao_mm_s) VALUES (?, ?, ?, ?, ?, ?)';
        $comando = $conexao->prepare($sql);

        $momento = time() - ($quantidade * 300);

        for ($i = 0; $i < $quantidade; $i++) {
            $momento += 300;

            $dataHora    = date('Y-m-d H:i:s', $momento);
            $velocidade  = rand(0, 9000) / 100;      // 0.00 a 90.00 km/h
            $temperatura = rand(6000, 11500) / 100;  // 60.00 a 115.00 °C
            $consumo     = rand(2000, 9000) / 100;   // 20.00 a 90.00 L/h
            $vibracao    = rand(50, 900) / 100;      // 0.50 a 9.00 mm/s

            $comando->bind_param('isdddd', $tremId, $dataHora, $velocidade, $temperatura, $consumo, $vibracao);
            $comando->execute();
        }

        $comando->close();
        $_SESSION['mensagem'] = "{$quantidade} leituras geradas com sucesso!";
        header('Location: simulador.php');
        exit;
    }
}

$trens = $conexao->query('SELECT id_trem, prefixo_trem, modelo_trem FROM trens ORDER BY prefixo_trem');
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Simulador de Telemetria IoT</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <div class="cabecalho-esquerda">
            <span class="marca">Frota Ferroviária</span>
            <nav>
                <a href="index.php">Trens</a>
                <a href="painel.php">Painel</a>
                <a href="leituras.php">Leituras</a>
                <a href="simulador.php" class="ativo">Simulador</a>
                <a href="consumir_api.php">API</a>
            </nav>
        </div>
        <div class="usuario-area">
            <span class="usuario-nome">Olá, <?= htmlspecialchars($usuario['nome']) ?></span>
            <a href="logout.php" class="link-sair">Sair</a>
        </div>
    </header>

    <main class="container">
        <h1>Simulador de Leituras IoT</h1>
        
        <?php if (!empty($_SESSION['mensagem'])): ?>
            <p class="aviso"><?= htmlspecialchars($_SESSION['mensagem']); unset($_SESSION['mensagem']); ?></p>
        <?php endif; ?>

        <form method="post" class="formulario">
            <div class="campo">
                <label for="trem_id">Trem</label>
                <select id="trem_id" name="trem_id" required>
                    <option value="">Selecione um trem...</option>
                    <?php while ($trem = $trens->fetch_assoc()): ?>
                        <option value="<?= $trem['id_trem'] ?>">
                            <?= htmlspecialchars($trem['prefixo_trem']) ?> - <?= htmlspecialchars($trem['modelo_trem']) ?>
                        </option>
                    <?php endwhile; ?>
                </select>
            </div>

            <div class="campo">
                <label for="quantidade">Quantidade de leituras (intervalos de 5 min)</label>
                <input type="number" id="quantidade" name="quantidade" min="1" max="200" value="50" required>
            </div>

            <button type="submit" class="botao botao-primario">Gerar dados fictícios</button>
        </form>
    </main>
</body>
</html>
