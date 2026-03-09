<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Recipe;
use App\Models\RecipeItem;
use App\Models\RawMaterial;

class RecipeSeeder extends Seeder
{
    /**
     * Raw material pack sizes (used to convert per-cup amounts to pack fractions).
     */
    private array $packSizes = [
        'BLACK BOBA PEARL'    => 900,
        'MINI WHITE PEARL'    => 1000,
        'BLACK TEA LEAVES'    => 3200,   // ml per batch → batches per pack not applicable; stored as ml fraction of 3200ml batch
        'NDC POWDER'          => 1000,
        'GROUND COFFEE'       => 1000,
        'BUNGEE SYRUP'        => 1000,
        'CHEESE MOUSSE POWDER'=> 1000,
        'ALL CHEESES'         => 1000,
        'CRUSHED OREO'        => 1000,
        'MILO POWDER'         => 1000,
        'COCONUT JELLY'       => 3500,
        'COFFEE JELLY'        => 3500,
        'PUDDING POWDER'      => 1000,
        'MIXED FRUIT JELLY'   => 3500,
        'MILK FOAM POWDER'    => 1000,
        'GREEN TEA BAG'       => 1,      // pcs — fraction = cups per pack (1 bag per cup → 1/1 = 1.0)
        'GREEN TEA LOOSE'     => 500,
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

        foreach ($rawMaterials as $rm) {
            RawMaterial::firstOrCreate(
                ['name' => $rm['name']],
                [
                    'unit'          => $rm['unit'],
                    'category'      => $rm['category'],
                    'current_stock' => 0,
                    'reorder_level' => 0,
                    'is_intermediate' => false,
                ]
            );
        }

        // Cache all IDs by name for quick lookup
        $rm = RawMaterial::pluck('id', 'name');

        // ----------------------------------------------------------------
        // Helper: convert actual amount → pack fraction, rounded to 8dp
        // ----------------------------------------------------------------
        $frac = function (string $material, float $amount) use ($rm): array {
            $packSize = $this->packSizes[$material];
            return [
                'raw_material_id' => $rm[$material],
                'quantity'        => round($amount / $packSize, 8),
                'unit'            => 'pack',
            ];
        };

        // ----------------------------------------------------------------
        // 2. RECIPE DEFINITIONS
        // Each entry: [menu_item_id, size, display_name, [ingredients]]
        // ----------------------------------------------------------------

        // --- Milk Tea base notes ---
        // BLACK TEA LEAVES amounts are per-cup usage from a 3200ml batch.
        // Classic base (full):  M=220ml, L=260ml
        // Half base:            M=110ml, L=150ml
        // Extra base:           M=190ml, L=220ml

        $recipes = [

            // ============================================================
            // CLASSIC MILK TEA (no pearls, no toppings)
            // ============================================================
            [66, 'M', 'CLASSIC M. TEA', [
                $frac('BLACK TEA LEAVES', 220),
                $frac('NDC POWDER', 41.25),
            ]],
            [66, 'L', 'CLASSIC M. TEA', [
                $frac('BLACK TEA LEAVES', 260),
                $frac('NDC POWDER', 48.75),
            ]],

            // ============================================================
            // CLASSIC PEARL MILK TEA (+ Black Boba)
            // ============================================================
            [67, 'M', 'CLASSIC PEARL M. TEA', [
                $frac('BLACK TEA LEAVES', 220),
                $frac('NDC POWDER', 41.25),
                $frac('BLACK BOBA PEARL', 28.125),
            ]],
            [67, 'L', 'CLASSIC PEARL M. TEA', [
                $frac('BLACK TEA LEAVES', 260),
                $frac('NDC POWDER', 48.75),
                $frac('BLACK BOBA PEARL', 33.75),
            ]],

            // ============================================================
            // CLASSIC BUDDY MILK TEA (+ Mini White Pearl)
            // ============================================================
            [68, 'M', 'CLASSIC BUDDY M. TEA', [
                $frac('BLACK TEA LEAVES', 220),
                $frac('NDC POWDER', 41.25),
                $frac('MINI WHITE PEARL', 8.11),
            ]],
            [68, 'L', 'CLASSIC BUDDY M. TEA', [
                $frac('BLACK TEA LEAVES', 260),
                $frac('NDC POWDER', 48.75),
                $frac('MINI WHITE PEARL', 9.73),
            ]],

            // ============================================================
            // CLASSIC DUO MILK TEA (Black Boba + Mini White Pearl)
            // ============================================================
            [69, 'M', 'CLASSIC DUO M. TEA', [
                $frac('BLACK TEA LEAVES', 220),
                $frac('NDC POWDER', 41.25),
                $frac('BLACK BOBA PEARL', 28.125),
                $frac('MINI WHITE PEARL', 8.11),
            ]],
            [69, 'L', 'CLASSIC DUO M. TEA', [
                $frac('BLACK TEA LEAVES', 260),
                $frac('NDC POWDER', 48.75),
                $frac('BLACK BOBA PEARL', 33.75),
                $frac('MINI WHITE PEARL', 9.73),
            ]],

            // ============================================================
            // CLASSIC CREAM CHEESE MILK TEA
            // ============================================================
            [70, 'M', 'CLASSIC CRM. CHEESE', [
                $frac('BLACK TEA LEAVES', 110),
                $frac('NDC POWDER', 20.63),
                $frac('ALL CHEESES', 45),
            ]],
            [70, 'L', 'CLASSIC CRM. CHEESE', [
                $frac('BLACK TEA LEAVES', 150),
                $frac('NDC POWDER', 28.13),
                $frac('ALL CHEESES', 55),
            ]],

            // ============================================================
            // CLASSIC CHEESECAKE MILK TEA
            // ============================================================
            [71, 'M', 'CLASSIC C. CAKE M. TEA', [
                $frac('BLACK TEA LEAVES', 110),
                $frac('NDC POWDER', 20.63),
                $frac('ALL CHEESES', 45),
            ]],
            [71, 'L', 'CLASSIC C. CAKE M. TEA', [
                $frac('BLACK TEA LEAVES', 150),
                $frac('NDC POWDER', 28.13),
                $frac('ALL CHEESES', 55),
            ]],

            // ============================================================
            // CLASSIC RSC MILK TEA
            // ============================================================
            [72, 'M', 'CLASSIC RSC M. TEA', [
                $frac('BLACK TEA LEAVES', 110),
                $frac('NDC POWDER', 20.63),
                $frac('ALL CHEESES', 45),
            ]],
            [72, 'L', 'CLASSIC RSC M. TEA', [
                $frac('BLACK TEA LEAVES', 150),
                $frac('NDC POWDER', 28.13),
                $frac('ALL CHEESES', 55),
            ]],

            // ============================================================
            // CLASSIC MILK TEA + OREO
            // ============================================================
            [73, 'M', 'CLASSIC M. TEA + OREO', [
                $frac('BLACK TEA LEAVES', 220),
                $frac('NDC POWDER', 41.25),
                $frac('CRUSHED OREO', 10),
            ]],
            [73, 'L', 'CLASSIC M. TEA + OREO', [
                $frac('BLACK TEA LEAVES', 260),
                $frac('NDC POWDER', 48.75),
                $frac('CRUSHED OREO', 15),
            ]],

            // ============================================================
            // CLASSIC MILK TEA + PUDDING
            // ============================================================
            [74, 'M', 'CLASSIC M. TEA + PUDDING', [
                $frac('BLACK TEA LEAVES', 220),
                $frac('NDC POWDER', 41.25),
                $frac('PUDDING POWDER', 5.56),
            ]],
            [74, 'L', 'CLASSIC M. TEA + PUDDING', [
                $frac('BLACK TEA LEAVES', 260),
                $frac('NDC POWDER', 48.75),
                $frac('PUDDING POWDER', 8.33),
            ]],

            // ============================================================
            // CLASSIC PUDDING + BLACK BOBA PEARL
            // ============================================================
            [75, 'M', 'CL PUDDING + B.PEARL', [
                $frac('BLACK TEA LEAVES', 220),
                $frac('NDC POWDER', 41.25),
                $frac('PUDDING POWDER', 5.56),
                $frac('BLACK BOBA PEARL', 28.125),
            ]],
            [75, 'L', 'CL PUDDING + B.PEARL', [
                $frac('BLACK TEA LEAVES', 260),
                $frac('NDC POWDER', 48.75),
                $frac('PUDDING POWDER', 8.33),
                $frac('BLACK BOBA PEARL', 33.75),
            ]],

            // ============================================================
            // CLASSIC PUDDING + MINI WHITE PEARL
            // ============================================================
            [76, 'M', 'CL PUDDING + MWP', [
                $frac('BLACK TEA LEAVES', 220),
                $frac('NDC POWDER', 41.25),
                $frac('PUDDING POWDER', 5.56),
                $frac('MINI WHITE PEARL', 8.11),
            ]],
            [76, 'L', 'CL PUDDING + MWP', [
                $frac('BLACK TEA LEAVES', 260),
                $frac('NDC POWDER', 48.75),
                $frac('PUDDING POWDER', 8.33),
                $frac('MINI WHITE PEARL', 9.73),
            ]],

            // ============================================================
            // FRAPPES (8oz = M slot, 12oz = L slot)
            // Base: BUNGEE SYRUP 60ml + flavored GROUND COFFEE
            // ============================================================
            // MOCHA FRAPPE
            [77, 'M', 'MOCHA FRP 8oz', [
                $frac('GROUND COFFEE', 4.55),
                $frac('BUNGEE SYRUP', 60),
            ]],
            [78, 'L', 'MOCHA FRP 12oz', [
                $frac('GROUND COFFEE', 6.36),
                $frac('BUNGEE SYRUP', 60),
            ]],
            // VANILLA FRAPPE
            [79, 'M', 'VANILLA FRP 8oz', [
                $frac('GROUND COFFEE', 4.55),
                $frac('BUNGEE SYRUP', 60),
            ]],
            [80, 'L', 'VANILLA FRP 12oz', [
                $frac('GROUND COFFEE', 6.36),
                $frac('BUNGEE SYRUP', 60),
            ]],
            // JAVA CHIP FRAPPE
            [81, 'M', 'JAVA CHIP FRP 8oz', [
                $frac('GROUND COFFEE', 4.55),
                $frac('BUNGEE SYRUP', 60),
            ]],
            [82, 'L', 'JAVA CHIP FRP 12oz', [
                $frac('GROUND COFFEE', 6.36),
                $frac('BUNGEE SYRUP', 60),
            ]],
            // TOFFEE CARAMEL FRAPPE
            [83, 'M', 'TOFFEE CARAMEL FRP 8oz', [
                $frac('GROUND COFFEE', 4.55),
                $frac('BUNGEE SYRUP', 60),
            ]],
            [84, 'L', 'TOFFEE CARAMEL FRP 12oz', [
                $frac('GROUND COFFEE', 6.36),
                $frac('BUNGEE SYRUP', 60),
            ]],
            // CARAMEL MACCHIATO FRAPPE
            [85, 'M', 'CARAMEL MACCHIATO FRP 8oz', [
                $frac('GROUND COFFEE', 4.55),
                $frac('BUNGEE SYRUP', 60),
            ]],
            [86, 'L', 'CARAMEL MACCHIATO FRP 12oz', [
                $frac('GROUND COFFEE', 6.36),
                $frac('BUNGEE SYRUP', 60),
            ]],

            // ============================================================
            // FLAVORED MT + CREAM CHEESE (IDs 93–112, pairs M+L)
            // Half-base: M=110ml tea, L=150ml tea; cream cheese NDC+ALL CHEESES
            // Belgian=93/94, Red Velvet=95/96, Hersheys=97/98,
            // Salted Caramel=99/100, Vanilla=101/102, Okinawa=103/104,
            // Taro=105/106, Matcha=107/108, Choco Hazelnut=109/110, Blueberry=111/112
            // ============================================================
            ...array_map(fn($pair) => [
                $pair[0], 'M', $pair[2] . ' MT + CRM CHEESE M', [
                    $frac('BLACK TEA LEAVES', 110),
                    $frac('NDC POWDER', 20.63),
                    $frac('ALL CHEESES', 45),
                ]
            ], [
                [93, 94, 'BELGIAN'],
                [95, 96, 'RED VELVET'],
                [97, 98, 'HERSHEYS'],
                [99, 100, 'SALTED CARAMEL'],
                [101, 102, 'VANILLA'],
                [103, 104, 'OKINAWA'],
                [105, 106, 'TARO'],
                [107, 108, 'MATCHA'],
                [109, 110, 'CHOCO HAZELNUT'],
                [111, 112, 'BLUEBERRY'],
            ]),
            ...array_map(fn($pair) => [
                $pair[1], 'L', $pair[2] . ' MT + CRM CHEESE L', [
                    $frac('BLACK TEA LEAVES', 150),
                    $frac('NDC POWDER', 28.13),
                    $frac('ALL CHEESES', 55),
                ]
            ], [
                [93, 94, 'BELGIAN'],
                [95, 96, 'RED VELVET'],
                [97, 98, 'HERSHEYS'],
                [99, 100, 'SALTED CARAMEL'],
                [101, 102, 'VANILLA'],
                [103, 104, 'OKINAWA'],
                [105, 106, 'TARO'],
                [107, 108, 'MATCHA'],
                [109, 110, 'CHOCO HAZELNUT'],
                [111, 112, 'BLUEBERRY'],
            ]),

            // ============================================================
            // FLAVORED MILK TEA (IDs 113–152, pairs M+L)
            // Full base: M=220ml, L=260ml
            // Matcha=113/114, Taro=115/116, Salted Caramel=117/118,
            // Wintermelon=119/120, Java Chip=121/122, Okinawa=123/124,
            // Vanilla=125/126, Hershey's=127/128, Mocha=129/130,
            // Belgian=131/132, Mango=133/134, Avocado=135/136,
            // Red Velvet=137/138, Caramel Macch=139/140,
            // Cookies & Cream=141/142, Strawberry=143/144,
            // Blueberry=145/146, Dark Chocolate=147/148,
            // Choco Hazelnut=149/150, Toffee Caramel=151/152
            // ============================================================
            ...array_map(fn($pair) => [
                $pair[0], 'M', $pair[2] . ' FLAVORED MT M', [
                    $frac('BLACK TEA LEAVES', 220),
                    $frac('NDC POWDER', 41.25),
                ]
            ], [
                [113, 114, 'MATCHA'], [115, 116, 'TARO'], [117, 118, 'SALTED CARAMEL'],
                [119, 120, 'WINTERMELON'], [121, 122, 'JAVA CHIP'], [123, 124, 'OKINAWA'],
                [125, 126, 'VANILLA'], [127, 128, "HERSHEY'S"], [129, 130, 'MOCHA'],
                [131, 132, 'BELGIAN'], [133, 134, 'MANGO'], [135, 136, 'AVOCADO'],
                [137, 138, 'RED VELVET'], [139, 140, 'CARAMEL MACCH'],
                [141, 142, 'COOKIES & CREAM'], [143, 144, 'STRAWBERRY'],
                [145, 146, 'BLUEBERRY'], [147, 148, 'DARK CHOCOLATE'],
                [149, 150, 'CHOCO HAZELNUT'], [151, 152, 'TOFFEE CARAMEL'],
            ]),
            ...array_map(fn($pair) => [
                $pair[1], 'L', $pair[2] . ' FLAVORED MT L', [
                    $frac('BLACK TEA LEAVES', 260),
                    $frac('NDC POWDER', 48.75),
                ]
            ], [
                [113, 114, 'MATCHA'], [115, 116, 'TARO'], [117, 118, 'SALTED CARAMEL'],
                [119, 120, 'WINTERMELON'], [121, 122, 'JAVA CHIP'], [123, 124, 'OKINAWA'],
                [125, 126, 'VANILLA'], [127, 128, "HERSHEY'S"], [129, 130, 'MOCHA'],
                [131, 132, 'BELGIAN'], [133, 134, 'MANGO'], [135, 136, 'AVOCADO'],
                [137, 138, 'RED VELVET'], [139, 140, 'CARAMEL MACCH'],
                [141, 142, 'COOKIES & CREAM'], [143, 144, 'STRAWBERRY'],
                [145, 146, 'BLUEBERRY'], [147, 148, 'DARK CHOCOLATE'],
                [149, 150, 'CHOCO HAZELNUT'], [151, 152, 'TOFFEE CARAMEL'],
            ]),

            // Cookies & Cream MT gets extra oreo
            [141, 'M', 'COOKIES & CREAM MT M', [
                $frac('BLACK TEA LEAVES', 220),
                $frac('NDC POWDER', 41.25),
                $frac('CRUSHED OREO', 5),
            ]],
            [142, 'L', 'COOKIES & CREAM MT L', [
                $frac('BLACK TEA LEAVES', 260),
                $frac('NDC POWDER', 48.75),
                $frac('CRUSHED OREO', 10),
            ]],

            // ============================================================
            // FLAVORED FRAPPES (IDs 155–170, pairs M=8oz / L=12oz)
            // Base: BUNGEE SYRUP 60ml + GROUND COFFEE
            // Taro=155/156, Red Velvet=157/158, Choco Hazelnut=159/160,
            // Salted Caramel=161/162, Dark Chocolate=163/164,
            // Cookies & Cream=165/166, Belgian=167/168, Hersheys=169/170
            // ============================================================
            ...array_map(fn($pair) => [
                $pair[0], 'M', $pair[2] . ' FRAPPE 8oz', [
                    $frac('GROUND COFFEE', 4.55),
                    $frac('BUNGEE SYRUP', 60),
                ]
            ], [
                [155, 156, 'TARO'], [157, 158, 'RED VELVET'],
                [159, 160, 'CHOCO HAZELNUT'], [161, 162, 'SALTED CARAMEL'],
                [163, 164, 'DARK CHOCOLATE'], [167, 168, 'BELGIAN'],
                [169, 170, 'HERSHEYS'],
            ]),
            ...array_map(fn($pair) => [
                $pair[1], 'L', $pair[2] . ' FRAPPE 12oz', [
                    $frac('GROUND COFFEE', 6.36),
                    $frac('BUNGEE SYRUP', 60),
                ]
            ], [
                [155, 156, 'TARO'], [157, 158, 'RED VELVET'],
                [159, 160, 'CHOCO HAZELNUT'], [161, 162, 'SALTED CARAMEL'],
                [163, 164, 'DARK CHOCOLATE'], [167, 168, 'BELGIAN'],
                [169, 170, 'HERSHEYS'],
            ]),
            // Cookies & Cream Frappe + Oreo
            [165, 'M', 'COOKIES & CREAM FRAPPE 8oz', [
                $frac('GROUND COFFEE', 4.55),
                $frac('BUNGEE SYRUP', 60),
                $frac('CRUSHED OREO', 20),
            ]],
            [166, 'L', 'COOKIES & CREAM FRAPPE 12oz', [
                $frac('GROUND COFFEE', 6.36),
                $frac('BUNGEE SYRUP', 60),
                $frac('CRUSHED OREO', 20),
            ]],

            // ============================================================
            // GREEN TEA SERIES (IDs 191–202, pairs M+L)
            // Passion Fruit=191/192, Lemon Chia=193/194, Honey Lemon=195/196,
            // Wintermelon=197/198, Lemon Cucumber=199/200, Lychee=201/202
            // ============================================================
            ...array_map(fn($pair) => [
                $pair[0], 'M', $pair[2] . ' GREEN TEA M', [
                    $frac('GREEN TEA LOOSE', 5),
                    $frac('GREEN TEA BAG', 1),
                ]
            ], [
                [191, 192, 'PASSION FRUIT'], [193, 194, 'LEMON CHIA'],
                [195, 196, 'HONEY LEMON'], [197, 198, 'WINTERMELON'],
                [199, 200, 'LEMON CUCUMBER'], [201, 202, 'LYCHEE'],
            ]),
            ...array_map(fn($pair) => [
                $pair[1], 'L', $pair[2] . ' GREEN TEA L', [
                    $frac('GREEN TEA LOOSE', 6),
                    $frac('GREEN TEA BAG', 1),
                ]
            ], [
                [191, 192, 'PASSION FRUIT'], [193, 194, 'LEMON CHIA'],
                [195, 196, 'HONEY LEMON'], [197, 198, 'WINTERMELON'],
                [199, 200, 'LEMON CUCUMBER'], [201, 202, 'LYCHEE'],
            ]),

            // ============================================================
            // HOT COFFEE / DRINKS (IDs 203–214)
            // ============================================================
            [203, 'M', 'DARK ROAST COFFEE', [
                $frac('GROUND COFFEE', 10.45),
            ]],
            [204, 'L', 'DARK ROAST COFFEE L', [
                $frac('GROUND COFFEE', 15),
            ]],
            [205, 'M', 'HOT CARAMEL MACCHIATO M', [
                $frac('GROUND COFFEE', 10.45),
            ]],
            [206, 'L', 'HOT CARAMEL MACCHIATO L', [
                $frac('GROUND COFFEE', 15),
            ]],
            [207, 'M', 'HOT MOCHA M', [
                $frac('GROUND COFFEE', 10.45),
            ]],
            [208, 'L', 'HOT MOCHA L', [
                $frac('GROUND COFFEE', 15),
            ]],
            [209, 'M', 'HOT CHOCOLATE M', [
                $frac('GROUND COFFEE', 10.45),
            ]],
            [210, 'L', 'HOT CHOCOLATE L', [
                $frac('GROUND COFFEE', 15),
            ]],
            [211, 'M', 'HOT RED VELVET M', [
                $frac('GROUND COFFEE', 10.45),
            ]],
            [212, 'L', 'HOT RED VELVET L', [
                $frac('GROUND COFFEE', 15),
            ]],
            [213, 'M', 'HOT MATCHA M', [
                $frac('GROUND COFFEE', 10.45),
            ]],
            [214, 'L', 'HOT MATCHA L', [
                $frac('GROUND COFFEE', 15),
            ]],

            // ============================================================
            // ICED COFFEE SERIES (IDs 215–226)
            // ============================================================
            [215, 'M', 'ICED COFFEE', [
                $frac('GROUND COFFEE', 10.45),
            ]],
            [216, 'M', 'ICED MOCHA', [
                $frac('GROUND COFFEE', 8.64),
            ]],
            [217, 'M', 'ICED VANILLA COFFEE M', [
                $frac('GROUND COFFEE', 8.64),
            ]],
            [218, 'L', 'ICED VANILLA COFFEE L', [
                $frac('GROUND COFFEE', 10.45),
            ]],
            [219, 'M', 'ICED MOCHA COFFEE M', [
                $frac('GROUND COFFEE', 8.64),
            ]],
            [220, 'L', 'ICED MOCHA COFFEE L', [
                $frac('GROUND COFFEE', 10.45),
            ]],
            [221, 'M', 'ICED TOF CARAMEL COFFEE M', [
                $frac('GROUND COFFEE', 8.64),
            ]],
            [222, 'L', 'ICED TOF CARAMEL COFFEE L', [
                $frac('GROUND COFFEE', 10.45),
            ]],
            [223, 'M', 'ICED JAVA CHIP COFFEE M', [
                $frac('GROUND COFFEE', 8.64),
            ]],
            [224, 'L', 'ICED JAVA CHIP COFFEE L', [
                $frac('GROUND COFFEE', 10.45),
            ]],
            [225, 'M', 'ICED CARAMEL MACCH COFFEE M', [
                $frac('GROUND COFFEE', 8.64),
            ]],
            [226, 'L', 'ICED CARAMEL MACCH COFFEE L', [
                $frac('GROUND COFFEE', 10.45),
            ]],

            // ============================================================
            // OKINAWA BROWN SUGAR (IDs 234–239)
            // ============================================================
            [234, 'M', 'OKINAWA BROWN SUGAR M', [
                $frac('BLACK TEA LEAVES', 190),
                $frac('NDC POWDER', 35.63),
            ]],
            [235, 'L', 'OKINAWA BROWN SUGAR L', [
                $frac('BLACK TEA LEAVES', 220),
                $frac('NDC POWDER', 41.25),
            ]],
            // OK Brown Sugar + Cheese Mousse
            [236, 'M', 'OK BROWN SUGAR CHEESE MOUSSE M', [
                $frac('BLACK TEA LEAVES', 190),
                $frac('NDC POWDER', 35.63),
                $frac('CHEESE MOUSSE POWDER', 3.33),
            ]],
            [237, 'L', 'OK BROWN SUGAR CHEESE MOUSSE L', [
                $frac('BLACK TEA LEAVES', 220),
                $frac('NDC POWDER', 41.25),
                $frac('CHEESE MOUSSE POWDER', 5),
            ]],
            // OK Brown Sugar + Cheese Mousse + Milo
            [238, 'M', 'OK BROWN SUGAR CHEESE MOUSSE + MILO M', [
                $frac('BLACK TEA LEAVES', 190),
                $frac('NDC POWDER', 35.63),
                $frac('CHEESE MOUSSE POWDER', 3.33),
                $frac('MILO POWDER', 10),
            ]],
            [239, 'L', 'OK BROWN SUGAR CHEESE MOUSSE + MILO L', [
                $frac('BLACK TEA LEAVES', 220),
                $frac('NDC POWDER', 41.25),
                $frac('CHEESE MOUSSE POWDER', 5),
                $frac('MILO POWDER', 15),
            ]],

            // ============================================================
            // RSC SERIES (IDs 254–265, pairs M+L)
            // Wmelon=254/255, Mango=256/257, Avocado=258/259,
            // Salted Caramel=260/261, Dark Chocolate=262/263, Vanilla=264/265
            // ============================================================
            ...array_map(fn($pair) => [
                $pair[0], 'M', $pair[2] . ' RSC M', [
                    $frac('BLACK TEA LEAVES', 110),
                    $frac('NDC POWDER', 20.63),
                    $frac('ALL CHEESES', 45),
                ]
            ], [
                [254, 255, 'WINTERMELON'], [256, 257, 'MANGO'],
                [258, 259, 'AVOCADO'], [260, 261, 'SALTED CARAMEL'],
                [262, 263, 'DARK CHOCOLATE'], [264, 265, 'VANILLA'],
            ]),
            ...array_map(fn($pair) => [
                $pair[1], 'L', $pair[2] . ' RSC L', [
                    $frac('BLACK TEA LEAVES', 150),
                    $frac('NDC POWDER', 28.13),
                    $frac('ALL CHEESES', 55),
                ]
            ], [
                [254, 255, 'WINTERMELON'], [256, 257, 'MANGO'],
                [258, 259, 'AVOCADO'], [260, 261, 'SALTED CARAMEL'],
                [262, 263, 'DARK CHOCOLATE'], [264, 265, 'VANILLA'],
            ]),

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