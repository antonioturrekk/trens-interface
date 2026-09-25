<?php
function responderJson($codigo, $dados)
{
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    http_response_code($codigo);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function responderErro($codigo, $mensagem)
{
    responderJson($codigo, ['erro' => $mensagem]);
}

function lerCorpoJson()
{
    $corpo = file_get_contents('php://input');
    if ($corpo === '' || $corpo === false) {
        return [];
    }

    $dados = json_decode($corpo, true);
    if ($dados === null) {
        responderErro(400, 'O corpo da requisição não é um JSON válido.');
    }

    return $dados;
}