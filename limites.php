<?php

$limiteVelocidade  = 80.00;
$limiteTemperatura = 105.00;
$limiteConsumo     = 75.00;
$limiteVibracao    = 7.00;

function classificarLeitura($leitura, $limiteVelocidade, $limiteTemperatura, $limiteConsumo, $limiteVibracao)
{
    $falhas = [];

    if ($leitura['velocidade_kmh'] > $limiteVelocidade) {
        $falhas[] = 'Velocidade acima do limite';
    }

    if ($leitura['temperatura_motor_c'] > $limiteTemperatura) {
        $falhas[] = 'Temperatura do motor acima do limite';
    }

    if ($leitura['consumo_litros_hora'] > $limiteConsumo) {
        $falhas[] = 'Consumo acima do limite';
    }

    if ($leitura['vibracao_mm_s'] > $limiteVibracao) {
        $falhas[] = 'Vibracao acima do limite';
    }

    return $falhas;
}
