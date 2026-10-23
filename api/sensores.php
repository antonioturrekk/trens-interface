<?php
require '../conexao.php';
require 'resposta.php';

// Cria a tabela de sensores de forma segura caso ainda não exista.
$conexao->query("CREATE TABLE IF NOT EXISTS sensores (
  id_sensor INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nome_sensor VARCHAR(100) NOT NULL,
  tipo_sensor VARCHAR(60) NOT NULL,
  fk_id_trem INT NULL,
  status_sensor ENUM('ativo','manutencao','inativo') NOT NULL DEFAULT 'ativo',
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX ix_sensor_trem (fk_id_trem),
  CONSTRAINT fk_sensor_trem FOREIGN KEY (fk_id_trem) REFERENCES trens(id_trem) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$metodo = $_SERVER['REQUEST_METHOD'];
if ($metodo === 'OPTIONS') responderJson(200, ['ok' => true]);

if ($metodo === 'GET') {
  $sql = "SELECT s.*, t.prefixo_trem FROM sensores s LEFT JOIN trens t ON t.id_trem=s.fk_id_trem ORDER BY s.id_sensor DESC";
  $res = $conexao->query($sql); $sensores = [];
  while ($linha = $res->fetch_assoc()) $sensores[] = $linha;
  responderJson(200, ['sensores' => $sensores, 'total' => count($sensores)]);
}

if ($metodo === 'POST') {
  $dados = lerCorpoJson();
  $nome = trim($dados['nome_sensor'] ?? '');
  $tipo = trim($dados['tipo_sensor'] ?? '');
  $trem = isset($dados['fk_id_trem']) && $dados['fk_id_trem'] !== '' ? (int)$dados['fk_id_trem'] : 0;
  $status = $dados['status_sensor'] ?? 'ativo';
  if ($nome === '' || $tipo === '') responderJson(422, ['erros' => ['Informe o nome e o tipo do sensor.']]);
  if (!in_array($status, ['ativo','manutencao','inativo'], true)) responderJson(422, ['erros' => ['Status inválido.']]);
  if ($trem > 0) {
    $check = $conexao->prepare('SELECT id_trem FROM trens WHERE id_trem=?'); $check->bind_param('i',$trem); $check->execute(); $exists=$check->get_result()->fetch_assoc(); $check->close();
    if (!$exists) responderJson(422, ['erros' => ['O trem selecionado não existe.']]);
    $stmt = $conexao->prepare('INSERT INTO sensores (nome_sensor,tipo_sensor,fk_id_trem,status_sensor) VALUES (?,?,?,?)'); $stmt->bind_param('ssis',$nome,$tipo,$trem,$status);
  } else {
    $stmt = $conexao->prepare('INSERT INTO sensores (nome_sensor,tipo_sensor,fk_id_trem,status_sensor) VALUES (?,?,NULL,?)'); $stmt->bind_param('sss',$nome,$tipo,$status);
  }
  if (!$stmt->execute()) { $stmt->close(); responderErro(500, 'Não foi possível cadastrar o sensor.'); }
  $id = $conexao->insert_id; $stmt->close();
  responderJson(201, ['id_sensor'=>$id,'mensagem'=>'Sensor cadastrado.']);
}

if ($metodo === 'DELETE') {
  $id = (int)($_GET['id'] ?? 0);
  if ($id <= 0) responderErro(400, 'Informe o ID do sensor.');
  $stmt = $conexao->prepare('DELETE FROM sensores WHERE id_sensor=?'); $stmt->bind_param('i',$id); $stmt->execute(); $apagados=$stmt->affected_rows; $stmt->close();
  if (!$apagados) responderErro(404, 'Sensor não encontrado.');
  responderJson(200, ['mensagem'=>'Sensor excluído.']);
}
responderErro(405, 'Método não permitido.');
