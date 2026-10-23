<?php

session_start();

require '../conexao.php';
require 'resposta.php';

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'OPTIONS') {
    responderJson(200, ['ok' => true]);
}

function usuarioPublico($usuario)
{
    return [
        'id_usuario'    => (int) $usuario['id_usuario'],
        'nome_usuario'  => $usuario['nome_usuario'],
        'email_usuario' => $usuario['email_usuario'],
        'tipo_usuario'  => $usuario['tipo_usuario'],
        'cnpj_usuario'  => $usuario['cnpj_usuario'],
    ];
}

if ($metodo === 'GET') {
    $acao = $_GET['action'] ?? '';

    if ($acao === 'me') {
        if (!isset($_SESSION['id_usuario'])) {
            responderErro(401, 'Nao autenticado.');
        }

        $stmt = $conexao->prepare('SELECT * FROM usuarios WHERE id_usuario = ?');
        $stmt->bind_param('i', $_SESSION['id_usuario']);
        $stmt->execute();
        $usuario = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$usuario) {
            session_destroy();
            responderErro(401, 'Sessao invalida.');
        }

        responderJson(200, ['usuario' => usuarioPublico($usuario)]);
    }

    responderErro(400, 'Acao invalida. Use ?action=me.');
}

if ($metodo === 'POST') {
    $dados = lerCorpoJson();
    $acao = $dados['action'] ?? '';

    if ($acao === 'register') {
        $tipo = $dados['tipo_usuario'] ?? 'pessoa';
        $nome = trim($dados['nome_usuario'] ?? '');
        $email = trim(strtolower($dados['email_usuario'] ?? ''));
        $senha = (string) ($dados['senha'] ?? '');
        $confirmar = (string) ($dados['confirmar_senha'] ?? '');
        $cnpj = trim($dados['cnpj_usuario'] ?? '');

        $erros = [];

        if (!in_array($tipo, ['pessoa', 'empresa'], true)) {
            $erros[] = 'Tipo de cadastro invalido.';
        }

        if ($nome === '') {
            $erros[] = 'Informe o nome.';
        }

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $erros[] = 'Informe um e-mail valido.';
        }

        if (strlen($senha) < 6) {
            $erros[] = 'A senha deve ter pelo menos 6 caracteres.';
        }

        if ($senha !== $confirmar) {
            $erros[] = 'As senhas nao coincidem.';
        }

        if ($tipo === 'empresa' && $cnpj === '') {
            $erros[] = 'Informe o CNPJ.';
        }

        if (count($erros) > 0) {
            responderJson(422, ['erros' => $erros]);
        }

        $stmt = $conexao->prepare('SELECT id_usuario FROM usuarios WHERE email_usuario = ?');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $existe = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if ($existe) {
            responderJson(422, ['erros' => ['Ja existe uma conta com esse e-mail.']]);
        }

        $hash = password_hash($senha, PASSWORD_DEFAULT);
        $cnpjValor = $tipo === 'empresa' ? $cnpj : null;

        $stmt = $conexao->prepare('INSERT INTO usuarios (nome_usuario, email_usuario, senha_hash, tipo_usuario, cnpj_usuario) VALUES (?, ?, ?, ?, ?)');
        $stmt->bind_param('sssss', $nome, $email, $hash, $tipo, $cnpjValor);

        if (!$stmt->execute()) {
            $stmt->close();
            responderErro(500, 'Nao foi possivel criar a conta.');
        }

        $id = $conexao->insert_id;
        $stmt->close();

        $stmt = $conexao->prepare('SELECT * FROM usuarios WHERE id_usuario = ?');
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $usuario = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        $_SESSION['id_usuario'] = $usuario['id_usuario'];

        responderJson(201, ['usuario' => usuarioPublico($usuario)]);
    }

    if ($acao === 'login') {
        $email = trim(strtolower($dados['email'] ?? ''));
        $senha = (string) ($dados['senha'] ?? '');

        if ($email === '' || $senha === '') {
            responderJson(422, ['erros' => ['Informe e-mail e senha.']]);
        }

        $stmt = $conexao->prepare('SELECT * FROM usuarios WHERE email_usuario = ?');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $usuario = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$usuario || !password_verify($senha, $usuario['senha_hash'])) {
            responderErro(401, 'E-mail ou senha invalidos.');
        }

        $_SESSION['id_usuario'] = $usuario['id_usuario'];

        responderJson(200, ['usuario' => usuarioPublico($usuario)]);
    }

    if ($acao === 'logout') {
        $_SESSION = [];
        session_destroy();

        responderJson(200, ['ok' => true]);
    }

    responderErro(400, 'Acao invalida. Use action=register, login ou logout.');
}

responderErro(405, 'Metodo ' . $metodo . ' nao permitido neste recurso.');
