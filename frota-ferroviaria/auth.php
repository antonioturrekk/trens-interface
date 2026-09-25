<?php

session_start();

require_once __DIR__ . '/conexao.php';

function exigirLogin()
{
    if (!isset($_SESSION['usuario_id'])) {
        header('Location: login.php');
        exit;
    }
}

function usuarioLogado()
{
    return [
        'id'   => $_SESSION['usuario_id'] ?? null,
        'nome' => $_SESSION['usuario_nome'] ?? null,
    ];
}

exigirLogin();
