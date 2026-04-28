<?php
$mats = \App\Models\RawMaterial::all(); 
foreach($mats as $m) { 
    if(preg_match('/\((\d+\.?\d*)([a-zA-Z]+)\/([a-zA-Z]+)\)$/i', trim($m->name), $matches)) {
        // e.g. (3.5kg/pk)
        if (is_null($m->purchase_unit)) {
            $m->purchase_unit = strtoupper($matches[3]);
            $m->purchase_to_base_factor = $matches[1];
            $m->save();
            echo "Updated {$m->name}: {$m->purchase_unit} -> {$m->purchase_to_base_factor}\n";
        }
    } elseif(preg_match('/\((\d+)([a-zA-Z]+)\)$/i', trim($m->name), $matches)) {
        // e.g. (1pk)
        if (is_null($m->purchase_unit)) {
            $m->purchase_unit = strtoupper($matches[2]);
            $m->purchase_to_base_factor = $matches[1];
            $m->save();
            echo "Updated {$m->name}: {$m->purchase_unit} -> {$m->purchase_to_base_factor}\n";
        }
    }
}
