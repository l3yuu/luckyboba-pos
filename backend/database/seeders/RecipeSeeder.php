<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Recipe;
use App\Models\RecipeItem;
use App\Models\RawMaterial;

class RecipeSeeder extends Seeder
{
    private array $packSizes = [
        'BLACK BOBA PEARL'     => 900,
        'MINI WHITE PEARL'     => 1000,
        'BLACK TEA LEAVES'     => 3200,
        'NDC POWDER'           => 1000,
        'GROUND COFFEE'        => 1000,
        'BUNGEE SYRUP'         => 1000,
        'CHEESE MOUSSE POWDER' => 1000,
        'ALL CHEESES'          => 1000,
        'CRUSHED OREO'         => 1000,
        'MILO POWDER'          => 1000,
        'COCONUT JELLY'        => 3500,
        'COFFEE JELLY'         => 3500,
        'PUDDING POWDER'       => 1000,
        'MIXED FRUIT JELLY'    => 3500,
        'MILK FOAM POWDER'     => 1000,
        'GREEN TEA BAG'        => 1,
        'GREEN TEA LOOSE'      => 500,
    ];

    public function run(): void
    {
        // ----------------------------------------------------------------
        // 1. UPSERT RAW MATERIALS
        // ----------------------------------------------------------------
        $rawMaterials = [
            ['name' => 'BLACK BOBA PEARL',     'unit' => 'g',   'category' => 'ingredient'],
            ['name' => 'MINI WHITE PEARL',      'unit' => 'g',   'category' => 'ingredient'],
            ['name' => 'BLACK TEA LEAVES',      'unit' => 'ml',  'category' => 'ingredient'],
            ['name' => 'NDC POWDER',            'unit' => 'g',   'category' => 'ingredient'],
            ['name' => 'GROUND COFFEE',         'unit' => 'g',   'category' => 'ingredient'],
            ['name' => 'BUNGEE SYRUP',          'unit' => 'ml',  'category' => 'ingredient'],
            ['name' => 'CHEESE MOUSSE POWDER',  'unit' => 'g',   'category' => 'ingredient'],
            ['name' => 'ALL CHEESES',           'unit' => 'g',   'category' => 'ingredient'],
            ['name' => 'CRUSHED OREO',          'unit' => 'g',   'category' => 'ingredient'],
            ['name' => 'MILO POWDER',           'unit' => 'g',   'category' => 'ingredient'],
            ['name' => 'COCONUT JELLY',         'unit' => 'g',   'category' => 'ingredient'],
            ['name' => 'COFFEE JELLY',          'unit' => 'g',   'category' => 'ingredient'],
            ['name' => 'PUDDING POWDER',        'unit' => 'g',   'category' => 'ingredient'],
            ['name' => 'MIXED FRUIT JELLY',     'unit' => 'g',   'category' => 'ingredient'],
            ['name' => 'MILK FOAM POWDER',      'unit' => 'g',   'category' => 'ingredient'],
            ['name' => 'GREEN TEA BAG',         'unit' => 'pcs', 'category' => 'ingredient'],
            ['name' => 'GREEN TEA LOOSE',       'unit' => 'g',   'category' => 'ingredient'],
        ];

        foreach ($rawMaterials as $data) {
            RawMaterial::firstOrCreate(
                ['name' => $data['name']],
                [
                    'unit'            => $data['unit'],
                    'category'        => $data['category'],
                    'current_stock'   => 0,
                    'reorder_level'   => 0,
                    'is_intermediate' => false,
                ]
            );
        }

        $rm = RawMaterial::pluck('id', 'name');

        $frac = function (string $material, float $amount) use ($rm): array {
            return [
                'raw_material_id' => $rm[$material],
                'quantity'        => round($amount / $this->packSizes[$material], 8),
                'unit'            => 'pack',
            ];
        };

        // ----------------------------------------------------------------
        // SIZE REFERENCE
        // ----------------------------------------------------------------
        // Classic Milk Tea  → JR (one size only)
        // Flavored MT / CC / RSC / Iced Coffee / Green Tea / Okinawa → SM / SL
        // Coffee Frappe / Frappe Series → UM (8oz) / UL (12oz)
        // Hot Coffee / Hot Drinks → PCM / PCL
        //
        // INGREDIENT AMOUNTS PER CUP:
        // BLACK TEA LEAVES: SM/JR=220ml, SL=260ml | half-base SM=110ml, SL=150ml | extra SM=190ml, SL=220ml
        // NDC POWDER:       SM/JR=41.25g, SL=48.75g | half SM=20.63g, SL=28.13g | extra SM=35.63g, SL=41.25g
        // BLACK BOBA PEARL: SM/JR=28.125g, SL=33.75g
        // MINI WHITE PEARL: SM/JR=8.11g, SL=9.73g
        // ALL CHEESES:      SM=45g, SL=55g
        // CHEESE MOUSSE:    SM=3.33g, SL=5g
        // CRUSHED OREO:     classic+oreo SM=10g SL=15g | C&C MT SM=5g SL=10g | C&C Frappe=20g both
        // PUDDING POWDER:   SM=5.56g, SL=8.33g
        // MILO POWDER:      SM=10g, SL=15g
        // GREEN TEA LOOSE:  SM=5g, SL=6g | GREEN TEA BAG=1 both
        // GROUND COFFEE:    hot PCM=10.45g, PCL=15g | iced SM=8.64g, SL=10.45g | frappe UM=4.55g, UL=6.36g
        // BUNGEE SYRUP:     60ml both frappe sizes

        // ----------------------------------------------------------------
        // 2. RECIPE DEFINITIONS [menu_item_id, size_label, name, ingredients]
        // ----------------------------------------------------------------
        $recipes = [

            // ============================================================
            // CLASSIC MILK TEA — JR only
            // ============================================================
            [66, 'JR', 'CLASSIC M. TEA', [
                $frac('BLACK TEA LEAVES', 220), $frac('NDC POWDER', 41.25),
            ]],
            [67, 'JR', 'CLASSIC PEARL M. TEA', [
                $frac('BLACK TEA LEAVES', 220), $frac('NDC POWDER', 41.25),
                $frac('BLACK BOBA PEARL', 28.125),
            ]],
            [68, 'JR', 'CLASSIC BUDDY M. TEA', [
                $frac('BLACK TEA LEAVES', 220), $frac('NDC POWDER', 41.25),
                $frac('MINI WHITE PEARL', 8.11),
            ]],
            [69, 'JR', 'CLASSIC DUO M. TEA', [
                $frac('BLACK TEA LEAVES', 220), $frac('NDC POWDER', 41.25),
                $frac('BLACK BOBA PEARL', 28.125), $frac('MINI WHITE PEARL', 8.11),
            ]],
            [70, 'JR', 'CLASSIC CRM. CHEESE', [
                $frac('BLACK TEA LEAVES', 110), $frac('NDC POWDER', 20.63),
                $frac('ALL CHEESES', 45),
            ]],
            [71, 'JR', 'CLASSIC C. CAKE M. TEA', [
                $frac('BLACK TEA LEAVES', 110), $frac('NDC POWDER', 20.63),
                $frac('ALL CHEESES', 45),
            ]],
            [72, 'JR', 'CLASSIC RSC M. TEA', [
                $frac('BLACK TEA LEAVES', 110), $frac('NDC POWDER', 20.63),
                $frac('ALL CHEESES', 45),
            ]],
            [73, 'JR', 'CLASSIC M. TEA + OREO', [
                $frac('BLACK TEA LEAVES', 220), $frac('NDC POWDER', 41.25),
                $frac('CRUSHED OREO', 10),
            ]],
            [74, 'JR', 'CLASSIC M. TEA + PUDDING', [
                $frac('BLACK TEA LEAVES', 220), $frac('NDC POWDER', 41.25),
                $frac('PUDDING POWDER', 5.56),
            ]],
            [75, 'JR', 'CL PUDDING + B.PEARL', [
                $frac('BLACK TEA LEAVES', 220), $frac('NDC POWDER', 41.25),
                $frac('PUDDING POWDER', 5.56), $frac('BLACK BOBA PEARL', 28.125),
            ]],
            [76, 'JR', 'CL PUDDING + MWP', [
                $frac('BLACK TEA LEAVES', 220), $frac('NDC POWDER', 41.25),
                $frac('PUDDING POWDER', 5.56), $frac('MINI WHITE PEARL', 8.11),
            ]],

            // ============================================================
            // COFFEE FRAPPE — UM / UL
            // ============================================================
            [77,  'UM', 'MOCHA FRP UM',              [$frac('GROUND COFFEE', 4.55), $frac('BUNGEE SYRUP', 60)]],
            [78,  'UL', 'MOCHA FRP UL',              [$frac('GROUND COFFEE', 6.36), $frac('BUNGEE SYRUP', 60)]],
            [79,  'UM', 'VANILLA FRP UM',            [$frac('GROUND COFFEE', 4.55), $frac('BUNGEE SYRUP', 60)]],
            [80,  'UL', 'VANILLA FRP UL',            [$frac('GROUND COFFEE', 6.36), $frac('BUNGEE SYRUP', 60)]],
            [81,  'UM', 'JAVA CHIP FRP UM',          [$frac('GROUND COFFEE', 4.55), $frac('BUNGEE SYRUP', 60)]],
            [82,  'UL', 'JAVA CHIP FRP UL',          [$frac('GROUND COFFEE', 6.36), $frac('BUNGEE SYRUP', 60)]],
            [83,  'UM', 'TOFFEE CARAMEL FRP UM',     [$frac('GROUND COFFEE', 4.55), $frac('BUNGEE SYRUP', 60)]],
            [84,  'UL', 'TOFFEE CARAMEL FRP UL',     [$frac('GROUND COFFEE', 6.36), $frac('BUNGEE SYRUP', 60)]],
            [85,  'UM', 'CARAMEL MACCHIATO FRP UM',  [$frac('GROUND COFFEE', 4.55), $frac('BUNGEE SYRUP', 60)]],
            [86,  'UL', 'CARAMEL MACCHIATO FRP UL',  [$frac('GROUND COFFEE', 6.36), $frac('BUNGEE SYRUP', 60)]],

            // ============================================================
            // CREAM CHEESE MILK TEA — SM / SL (half base)
            // ============================================================
            ...array_map(fn($p) => [$p[0], 'SM', $p[2].' MT+CC SM', [
                $frac('BLACK TEA LEAVES', 110), $frac('NDC POWDER', 20.63), $frac('ALL CHEESES', 45),
            ]], [[93,94,'BELGIAN'],[95,96,'RED VELVET'],[97,98,'HERSHEYS'],[99,100,'SALTED CARAMEL'],
                 [101,102,'VANILLA'],[103,104,'OKINAWA'],[105,106,'TARO'],[107,108,'MATCHA'],
                 [109,110,'CHOCO HAZELNUT'],[111,112,'BLUEBERRY']]),
            ...array_map(fn($p) => [$p[1], 'SL', $p[2].' MT+CC SL', [
                $frac('BLACK TEA LEAVES', 150), $frac('NDC POWDER', 28.13), $frac('ALL CHEESES', 55),
            ]], [[93,94,'BELGIAN'],[95,96,'RED VELVET'],[97,98,'HERSHEYS'],[99,100,'SALTED CARAMEL'],
                 [101,102,'VANILLA'],[103,104,'OKINAWA'],[105,106,'TARO'],[107,108,'MATCHA'],
                 [109,110,'CHOCO HAZELNUT'],[111,112,'BLUEBERRY']]),

            // ============================================================
            // FLAVORED MILK TEA — SM / SL (full base)
            // ============================================================
            ...array_map(fn($p) => [$p[0], 'SM', $p[2].' FMT SM', [
                $frac('BLACK TEA LEAVES', 220), $frac('NDC POWDER', 41.25),
            ]], [[113,114,'MATCHA'],[115,116,'TARO'],[117,118,'SALTED CARAMEL'],[119,120,'WINTERMELON'],
                 [121,122,'JAVA CHIP'],[123,124,'OKINAWA'],[125,126,'VANILLA'],[127,128,"HERSHEY'S"],
                 [129,130,'MOCHA'],[131,132,'BELGIAN'],[133,134,'MANGO'],[135,136,'AVOCADO'],
                 [137,138,'RED VELVET'],[139,140,'CARAMEL MACCH'],[141,142,'COOKIES & CREAM'],
                 [143,144,'STRAWBERRY'],[145,146,'BLUEBERRY'],[147,148,'DARK CHOCOLATE'],
                 [149,150,'CHOCO HAZELNUT'],[151,152,'TOFFEE CARAMEL']]),
            ...array_map(fn($p) => [$p[1], 'SL', $p[2].' FMT SL', [
                $frac('BLACK TEA LEAVES', 260), $frac('NDC POWDER', 48.75),
            ]], [[113,114,'MATCHA'],[115,116,'TARO'],[117,118,'SALTED CARAMEL'],[119,120,'WINTERMELON'],
                 [121,122,'JAVA CHIP'],[123,124,'OKINAWA'],[125,126,'VANILLA'],[127,128,"HERSHEY'S"],
                 [129,130,'MOCHA'],[131,132,'BELGIAN'],[133,134,'MANGO'],[135,136,'AVOCADO'],
                 [137,138,'RED VELVET'],[139,140,'CARAMEL MACCH'],[141,142,'COOKIES & CREAM'],
                 [143,144,'STRAWBERRY'],[145,146,'BLUEBERRY'],[147,148,'DARK CHOCOLATE'],
                 [149,150,'CHOCO HAZELNUT'],[151,152,'TOFFEE CARAMEL']]),

            // Cookies & Cream MT — add oreo on top
            [141, 'SM', 'COOKIES & CREAM MT SM', [
                $frac('BLACK TEA LEAVES', 220), $frac('NDC POWDER', 41.25), $frac('CRUSHED OREO', 5),
            ]],
            [142, 'SL', 'COOKIES & CREAM MT SL', [
                $frac('BLACK TEA LEAVES', 260), $frac('NDC POWDER', 48.75), $frac('CRUSHED OREO', 10),
            ]],

            // ============================================================
            // FRAPPE SERIES — UM / UL
            // ============================================================
            ...array_map(fn($p) => [$p[0], 'UM', $p[2].' FRAPPE UM', [
                $frac('GROUND COFFEE', 4.55), $frac('BUNGEE SYRUP', 60),
            ]], [[155,156,'TARO'],[157,158,'RED VELVET'],[159,160,'CHOCO HAZELNUT'],
                 [161,162,'SALTED CARAMEL'],[163,164,'DARK CHOCOLATE'],[167,168,'BELGIAN'],[169,170,'HERSHEYS']]),
            ...array_map(fn($p) => [$p[1], 'UL', $p[2].' FRAPPE UL', [
                $frac('GROUND COFFEE', 6.36), $frac('BUNGEE SYRUP', 60),
            ]], [[155,156,'TARO'],[157,158,'RED VELVET'],[159,160,'CHOCO HAZELNUT'],
                 [161,162,'SALTED CARAMEL'],[163,164,'DARK CHOCOLATE'],[167,168,'BELGIAN'],[169,170,'HERSHEYS']]),
            [165, 'UM', 'COOKIES & CREAM FRAPPE UM', [
                $frac('GROUND COFFEE', 4.55), $frac('BUNGEE SYRUP', 60), $frac('CRUSHED OREO', 20),
            ]],
            [166, 'UL', 'COOKIES & CREAM FRAPPE UL', [
                $frac('GROUND COFFEE', 6.36), $frac('BUNGEE SYRUP', 60), $frac('CRUSHED OREO', 20),
            ]],

            // ============================================================
            // GREEN TEA SERIES — SM / SL
            // ============================================================
            ...array_map(fn($p) => [$p[0], 'SM', $p[2].' GT SM', [
                $frac('GREEN TEA LOOSE', 5), $frac('GREEN TEA BAG', 1),
            ]], [[191,192,'PASSION FRUIT'],[193,194,'LEMON CHIA'],[195,196,'HONEY LEMON'],
                 [197,198,'WINTERMELON'],[199,200,'LEMON CUCUMBER'],[201,202,'LYCHEE']]),
            ...array_map(fn($p) => [$p[1], 'SL', $p[2].' GT SL', [
                $frac('GREEN TEA LOOSE', 6), $frac('GREEN TEA BAG', 1),
            ]], [[191,192,'PASSION FRUIT'],[193,194,'LEMON CHIA'],[195,196,'HONEY LEMON'],
                 [197,198,'WINTERMELON'],[199,200,'LEMON CUCUMBER'],[201,202,'LYCHEE']]),

            // ============================================================
            // HOT COFFEE & HOT DRINKS — PCM / PCL
            // ============================================================
            [203,'PCM','DARK ROAST COFFEE PCM',        [$frac('GROUND COFFEE', 10.45)]],
            [204,'PCL','DARK ROAST COFFEE PCL',        [$frac('GROUND COFFEE', 15)]],
            [205,'PCM','HOT CARAMEL MACCHIATO PCM',    [$frac('GROUND COFFEE', 10.45)]],
            [206,'PCL','HOT CARAMEL MACCHIATO PCL',    [$frac('GROUND COFFEE', 15)]],
            [207,'PCM','HOT MOCHA PCM',                [$frac('GROUND COFFEE', 10.45)]],
            [208,'PCL','HOT MOCHA PCL',                [$frac('GROUND COFFEE', 15)]],
            [209,'PCM','HOT CHOCOLATE PCM',            [$frac('GROUND COFFEE', 10.45)]],
            [210,'PCL','HOT CHOCOLATE PCL',            [$frac('GROUND COFFEE', 15)]],
            [211,'PCM','HOT RED VELVET PCM',           [$frac('GROUND COFFEE', 10.45)]],
            [212,'PCL','HOT RED VELVET PCL',           [$frac('GROUND COFFEE', 15)]],
            [213,'PCM','HOT MATCHA PCM',               [$frac('GROUND COFFEE', 10.45)]],
            [214,'PCL','HOT MATCHA PCL',               [$frac('GROUND COFFEE', 15)]],

            // ============================================================
            // ICED COFFEE — SM / SL
            // ============================================================
            [215,'SM','ICED COFFEE SM',                [$frac('GROUND COFFEE', 10.45)]],
            [216,'SL','ICED MOCHA SL',                 [$frac('GROUND COFFEE', 8.64)]],
            [217,'SM','ICED VANILLA COFFEE SM',        [$frac('GROUND COFFEE', 8.64)]],
            [218,'SL','ICED VANILLA COFFEE SL',        [$frac('GROUND COFFEE', 10.45)]],
            [219,'SM','ICED MOCHA COFFEE SM',          [$frac('GROUND COFFEE', 8.64)]],
            [220,'SL','ICED MOCHA COFFEE SL',          [$frac('GROUND COFFEE', 10.45)]],
            [221,'SM','ICED TOF CARAMEL COFFEE SM',    [$frac('GROUND COFFEE', 8.64)]],
            [222,'SL','ICED TOF CARAMEL COFFEE SL',    [$frac('GROUND COFFEE', 10.45)]],
            [223,'SM','ICED JAVA CHIP COFFEE SM',      [$frac('GROUND COFFEE', 8.64)]],
            [224,'SL','ICED JAVA CHIP COFFEE SL',      [$frac('GROUND COFFEE', 10.45)]],
            [225,'SM','ICED CARAMEL MACCH COFFEE SM',  [$frac('GROUND COFFEE', 8.64)]],
            [226,'SL','ICED CARAMEL MACCH COFFEE SL',  [$frac('GROUND COFFEE', 10.45)]],

            // ============================================================
            // OKINAWA BROWN SUGAR — SM / SL (extra base)
            // ============================================================
            [234,'SM','OKINAWA BROWN SUGAR SM', [
                $frac('BLACK TEA LEAVES', 190), $frac('NDC POWDER', 35.63),
            ]],
            [235,'SL','OKINAWA BROWN SUGAR SL', [
                $frac('BLACK TEA LEAVES', 220), $frac('NDC POWDER', 41.25),
            ]],
            [236,'SM','OK BROWN SUGAR CHEESE MOUSSE SM', [
                $frac('BLACK TEA LEAVES', 190), $frac('NDC POWDER', 35.63),
                $frac('CHEESE MOUSSE POWDER', 3.33),
            ]],
            [237,'SL','OK BROWN SUGAR CHEESE MOUSSE SL', [
                $frac('BLACK TEA LEAVES', 220), $frac('NDC POWDER', 41.25),
                $frac('CHEESE MOUSSE POWDER', 5),
            ]],
            [238,'SM','OK BROWN SUGAR CM + MILO SM', [
                $frac('BLACK TEA LEAVES', 190), $frac('NDC POWDER', 35.63),
                $frac('CHEESE MOUSSE POWDER', 3.33), $frac('MILO POWDER', 10),
            ]],
            [239,'SL','OK BROWN SUGAR CM + MILO SL', [
                $frac('BLACK TEA LEAVES', 220), $frac('NDC POWDER', 41.25),
                $frac('CHEESE MOUSSE POWDER', 5), $frac('MILO POWDER', 15),
            ]],

            // ============================================================
            // ROCK SALT & CHEESE — SM / SL (half base)
            // ============================================================
            ...array_map(fn($p) => [$p[0], 'SM', $p[2].' RSC SM', [
                $frac('BLACK TEA LEAVES', 110), $frac('NDC POWDER', 20.63), $frac('ALL CHEESES', 45),
            ]], [[254,255,'WINTERMELON'],[256,257,'MANGO'],[258,259,'AVOCADO'],
                 [260,261,'SALTED CARAMEL'],[262,263,'DARK CHOCOLATE'],[264,265,'VANILLA']]),
            ...array_map(fn($p) => [$p[1], 'SL', $p[2].' RSC SL', [
                $frac('BLACK TEA LEAVES', 150), $frac('NDC POWDER', 28.13), $frac('ALL CHEESES', 55),
            ]], [[254,255,'WINTERMELON'],[256,257,'MANGO'],[258,259,'AVOCADO'],
                 [260,261,'SALTED CARAMEL'],[262,263,'DARK CHOCOLATE'],[264,265,'VANILLA']]),

        ]; // end $recipes

        // ----------------------------------------------------------------
        // 3. PERSIST RECIPES + RECIPE ITEMS
        // ----------------------------------------------------------------
        foreach ($recipes as [$menuItemId, $size, $name, $ingredients]) {
            $recipe = Recipe::firstOrCreate(
                ['menu_item_id' => $menuItemId, 'size' => $size],
                ['name' => $name, 'is_active' => true]
            );

            foreach ($ingredients as $ingredient) {
                RecipeItem::updateOrCreate(
                    [
                        'recipe_id'       => $recipe->id,
                        'raw_material_id' => $ingredient['raw_material_id'],
                    ],
                    [
                        'quantity' => $ingredient['quantity'],
                        'unit'     => $ingredient['unit'],
                    ]
                );
            }
        }

        $this->command->info('RecipeSeeder complete: ' . count($recipes) . ' recipes seeded.');
    }
}