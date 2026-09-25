<?php

session_start();

require 'conexao.php';

if (isset($_SESSION['usuario_id'])) {
    header('Location: index.php');
    exit;
}

$nome = '';
$email = '';
$erros = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome = trim($_POST['nome'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $senha = $_POST['senha'] ?? '';
    $confirmarSenha = $_POST['confirmar_senha'] ?? '';

    if ($nome === '') {
        $erros[] = 'Informe o seu nome.';
    }

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $erros[] = 'Informe um e-mail válido.';
    }

    if (strlen($senha) < 6) {
        $erros[] = 'A senha deve ter pelo menos 6 caracteres.';
    }

    if ($senha !== $confirmarSenha) {
        $erros[] = 'A confirmação de senha não confere.';
    }

    if (count($erros) === 0) {
        $stmt = $conexao->prepare('SELECT id_usuario FROM usuarios WHERE email = ?');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $existente = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if ($existente) {
            $erros[] = 'Já existe uma conta cadastrada com este e-mail.';
        }
    }

    if (count($erros) === 0) {
        $senhaHash = password_hash($senha, PASSWORD_DEFAULT);

        $stmt = $conexao->prepare('INSERT INTO usuarios (nome_usuario, email, senha_hash) VALUES (?, ?, ?)');
        $stmt->bind_param('sss', $nome, $email, $senhaHash);

        if ($stmt->execute()) {
            $stmt->close();
            $_SESSION['mensagem'] = 'Conta criada com sucesso! Faça login para continuar.';
            header('Location: login.php');
            exit;
        }

        $stmt->close();
        $erros[] = 'Não foi possível concluir o cadastro. Tente novamente.';
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Criar conta - Frota Ferroviária</title>
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
            <h1>Criar conta</h1>
            <p class="apoio">Cadastre-se para acessar o sistema de gestão da frota.</p>

            <?php if (count($erros) > 0): ?>
                <div class="aviso aviso-erro">
                    <ul>
                        <?php foreach ($erros as $item): ?>
                            <li><?= htmlspecialchars($item) ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>

            <form method="post" class="formulario">
                <div class="campo">
                    <label for="nome">Nome</label>
                    <input type="text" id="nome" name="nome" maxlength="100" value="<?= htmlspecialchars($nome) ?>">
                </div>

                <div class="campo">
                    <label for="email">E-mail</label>
                    <input type="email" id="email" name="email" maxlength="150" value="<?= htmlspecialchars($email) ?>">
                </div>

                <div class="linha">
                    <div class="campo">
                        <label for="senha">Senha</label>
                        <input type="password" id="senha" name="senha" minlength="6">
                    </div>

                    <div class="campo">
                        <label for="confirmar_senha">Confirmar senha</label>
                        <input type="password" id="confirmar_senha" name="confirmar_senha" minlength="6">
                    </div>
                </div>

                <div class="acoes">
                    <button type="submit" class="botao botao-primario">Cadastrar</button>
                </div>
            </form>

            <p class="texto-auth">Já tem conta? <a href="login.php">Entrar</a></p>
        </div>
    </main>
</body>

</html>
