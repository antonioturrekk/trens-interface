<?php

session_start();

require 'conexao.php';

$id = (int) ($_GET['id'] ?? 0);
$prefixo = '';
$modelo = '';
$ano_fabricacao = '';
$capacidade_toneladas = '';
$situacao = 'ativo';
$situacoes = [
    'ativo' => 'Ativo',
    'manutencao' => 'Em manutenção',
    'inativo' => 'Inativo'
];
$erros = [];

if ($id > 0 && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $conexao->prepare('SELECT * FROM trens WHERE id_trem = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $trem = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$trem) {
        $_SESSION['mensagem'] = "Trem não encontrado.";
        header("Location: index.php");
        exit;
    }

    $prefixo = $trem['prefixo_trem'];
    $modelo = $trem['modelo_trem'];
    $ano_fabricacao = $trem['ano_fabricacao'];
    $capacidade_toneladas = $trem['capacidade_toneladas'];
    $situacao = $trem['situacao_trem'];
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = (int) $_POST['id'];
    $prefixo = trim($_POST['prefixo']);
    $modelo = trim($_POST['modelo']);
    $ano_fabricacao = trim($_POST['ano_fabricacao']);
    $capacidade_toneladas = trim($_POST['capacidade_toneladas']);
    $situacao = $_POST['situacao'];

    if ($prefixo === '') {
        $erros[] = 'Informe o prefixo do trem.';
    }

    if ($modelo === '') {
        $erros[] = 'Informe o modelo do trem.';
    }

    if (!is_numeric($ano_fabricacao) || $ano_fabricacao < 1900 || $ano_fabricacao > 2100) {
        $erros[] = 'Informe um ano de fabricação entre 1900 e 2100.';
    }

    if (!is_numeric($capacidade_toneladas) || $capacidade_toneladas < 0) {
        $erros[] = 'Informe uma capacidade maior que zero.';
    }

    if (!isset($situacoes[$situacao])) {
        $erros[] = 'Selecione uma situação válida.';
    }

    if (count($erros) === 0) {
        $ano = (int) $ano_fabricacao;
        $capacidade = (float) $capacidade_toneladas;

        if ($id > 0) {
            $stmt = $conexao->prepare('UPDATE trens SET prefixo_trem = ?, modelo_trem = ?, ano_fabricacao = ?, capacidade_toneladas = ?, situacao_trem = ? WHERE id_trem = ?');
            $stmt->bind_param('ssidsi', $prefixo, $modelo, $ano, $capacidade, $situacao, $id);

            if ($stmt->execute()) {
                $_SESSION['mensagem'] = 'Trem atualizado com sucesso!';
            } else {
                $_SESSION['mensagem'] = 'Não foi possível realizar a atualização.';
            }
        } else {
            $stmt = $conexao->prepare('INSERT INTO trens (prefixo_trem, modelo_trem, ano_fabricacao, capacidade_toneladas, situacao_trem) VALUES (?, ?, ?, ?, ?)');
            $stmt->bind_param('ssids', $prefixo, $modelo, $ano, $capacidade, $situacao);

            if ($stmt->execute()) {
                $_SESSION['mensagem'] = 'Trem cadastrado com sucesso!';
            } else {
                $_SESSION['mensagem'] = 'Não foi possível realizar o cadastro.';
            }
        }

        $stmt->close();
        header('Location: index.php');
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $id > 0 ? 'Editar trem' : 'Novo trem' ?></title>
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
        </nav>
    </header>

    <main>
        <h1><?= $id > 0 ? 'Editar trem' : 'Novo trem' ?></h1>

        <?php
        if (count($erros) > 0):
        ?>
            <div class="aviso aviso-erro">
                <ul>
                    <?php
                    foreach ($erros as $item):
                    ?>
                        <li><?= htmlspecialchars($item) ?></li>
                    <?php
                    endforeach;
                    ?>
                </ul>
            </div>
        <?php
        endif;
        ?>
    </main>

    <form method="post">
        <input type="hidden" name="id" value="<?= $id ?>">

        <div class="linha">
            <div class="campo">
                <label for="prefixo">Prefixo</label>
                <input type="text" id="prefixo" name="prefixo" maxlength="20" value="<?= htmlspecialchars($prefixo) ?>">
            </div>

            <div class="campo">
                <label for="ano_fabricacao">Ano de fabricação</label>
                <input type="number" id="ano_fabricacao" name="ano_fabricacao" min="1900" max="2100" value="<?= htmlspecialchars($ano_fabricacao) ?>">
            </div>
        </div>

        <div class="campo">
            <label for="modelo">Modelo</label>
            <input type="text" id="modelo" name="modelo" maxlength="80" value="<?= htmlspecialchars($modelo) ?>">
        </div>

        <div class="linha">
            <div class="campo">
                <label for="capacidade_toneladas">Capacidade (t)</label>
                <input type="number" id="capacidade_toneladas" name="capacidade_toneladas" step="0.01" min="0.01" value="<?= htmlspecialchars((string) $capacidade_toneladas) ?>">
            </div>

            <div class="campo">
                <label for="situacao">Situação</label>
                <select id="situacao" name="situacao">
                    <?php
                    foreach ($situacoes as $chave => $rotulo):
                    ?>
                        <option value="<?= $chave ?>" <?= $chave === $situacao ? 'selected' : '' ?>>
                            <?= $rotulo ?>
                        </option>
                    <?php
                    endforeach;
                    ?>
                </select>
            </div>
        </div>

        <div class="acoes">
            <button type="submit" class="botao botao-primario"><?= $id > 0 ? 'Atualizar' : 'Cadastrar' ?></button>
            <a href="index.php" class="botao botao-secundario">Cancelar</a>
        </div>
    </form>
</body>

</html>