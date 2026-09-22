DROP DATABASE IF EXISTS frota_ferroviaria;

CREATE DATABASE frota_ferroviaria;

USE frota_ferroviaria;

DROP TABLE IF EXISTS leitura_sensor;

DROP TABLE IF EXISTS trens;

CREATE TABLE trens (
    id_trem INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    prefixo_trem VARCHAR(20) NOT NULL,
    modelo_trem VARCHAR(80) NOT NULL,
    ano_fabricacao YEAR NOT NULL,
    capacidade_toneladas DECIMAL(8, 2) NOT NULL,
    situacao_trem ENUM(
        'ativo',
        'manutencao',
        'inativo'
    ) NOT NULL DEFAULT 'ativo'
);

CREATE TABLE leitura_sensor (
    id_leitura INT NOT NULL AUTO_INCREMENT,
    fk_id_trem INT NOT NULL,
    data_hora DATETIME NOT NULL,
    velocidade_kmh DECIMAL(6, 2) NOT NULL,
    temperatura_motor_c DECIMAL(6, 2) NOT NULL,
    consumo_litros_hora DECIMAL(6, 2) NOT NULL,
    vibracao_mm_s DECIMAL(6, 2) NOT NULL,
    PRIMARY KEY (id_leitura),
    CONSTRAINT fk_leitura_trem FOREIGN KEY (fk_id_trem) REFERENCES trens (id_trem) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX ix_leitura_trem ON leitura_sensor (fk_id_trem);

CREATE INDEX ix_leitura_data ON leitura_sensor (data_hora);

INSERT INTO
    trens (
        prefixo_trem,
        modelo_trem,
        ano_fabricacao,
        capacidade_toneladas,
        situacao_trem
    )
VALUES (
        'LOC-1001',
        'GE AC44i',
        2014,
        6200.00,
        'ativo'
    ),
    (
        'LOC-1002',
        'EMD SD70ACe',
        2011,
        5800.50,
        'manutencao'
    ),
    (
        'LOC-1003',
        'GE Dash 9',
        2006,
        5400.00,
        'ativo'
    ),
    (
        'AUT-2001',
        'Automotriz VLI',
        2019,
        900.00,
        'ativo'
    ),
    (
        'LOC-1004',
        'EMD GT46AC',
        1999,
        5100.75,
        'inativo'
    );