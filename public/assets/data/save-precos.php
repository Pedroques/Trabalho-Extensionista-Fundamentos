<?php
$input = file_get_contents("php://input");

if ($input) {
    file_put_contents(__DIR__ . "/data/precos.json", $input);
    echo "Preços atualizados com sucesso!";
} else {
    echo "Nenhum dado recebido.";
}