<?php

session_start();

require 'conexao.php';

if (isset($_SESSION['usuario_id'])) {
    header('Location: index.php');
    exit;
}

$email = '';
$erro = '';
$mensagem = $_SESSION['mensagem'] ?? '';
unset($_SESSION['mensagem']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $senha = $_POST['senha'] ?? '';

    if ($email === '' || $senha === '') {
        $erro = 'Informe e-mail e senha.';
    } else {
        $stmt = $conexao->prepare('SELECT id_usuario, nome_usuario, senha_hash FROM usuarios WHERE email = ?');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $usuario = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if ($usuario && password_verify($senha, $usuario['senha_hash'])) {
            session_regenerate_id(true);
            $_SESSION['usuario_id'] = $usuario['id_usuario'];
            $_SESSION['usuario_nome'] = $usuario['nome_usuario'];
            header('Location: index.php');
            exit;
        } else {
            $erro = 'E-mail ou senha inválidos.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Entrar - Frota Ferroviária</title>
    <link rel="stylesheet" href="style.css">
</head>

<body>
    <header>
        <div class="cabecalho-esquerda">
            <span class="marca">Frota Ferroviária</span>
        </div>
    </header>

    <main class="pagina-auth">
        <div class="cartao-auth">
            <h1>Entrar</h1>
            <p class="apoio">Acesse o sistema de gestão da frota.</p>

            <?php if ($mensagem !== ''): ?>
                <div class="aviso aviso-sucesso"><?= htmlspecialchars($mensagem) ?></div>
            <?php endif; ?>

            <?php if ($erro !== ''): ?>
                <div class="aviso aviso-erro"><?= htmlspecialchars($erro) ?></div>
            <?php endif; ?>

            <form method="post" class="formulario">
                <div class="campo">
                    <label for="email">E-mail</label>
                    <input type="email" id="email" name="email" required value="<?= htmlspecialchars($email) ?>">
                </div>

                <div class="campo">
                    <label for="senha">Senha</label>
                    <input type="password" id="senha" name="senha" required>
                </div>

                <div class="acoes">
                    <button type="submit" class="botao botao-primario">Entrar</button>
                </div>
            </form>

            <p class="texto-auth">Ainda não tem conta? <a href="cadastro.php">Cadastre-se</a></p>
        </div>
    </main>
</body>

</html>
