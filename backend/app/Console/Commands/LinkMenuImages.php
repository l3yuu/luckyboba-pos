<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class LinkMenuImages extends Command
{
    protected $signature = 'menu:link-images';
    protected $description = 'Link existing menu images in storage to menu_items table rows';

    // Category name in DB → folder name in storage/app/public/menu/
    private array $categoryFolderMap = [
        'FLAVORED MILK TEA'     => 'flavored-pearl',
        'CHEESECAKE MILK TEA'   => 'cheese-cake',
        'CREAM CHEESE MILK TEA' => 'cream-cheese',
        'COFFEE FRAPPE'         => 'coffee-frappe',
        'FRAPPE SERIES'         => 'frappe',
        'CLASSIC MILKTEA'       => 'lucky-classic',
        'LUCKY CLASSIC'         => 'lucky-classic',
        'LUCKY CLASSIC JR'      => 'lucky-classic',
        'ROCK SALT & CHEESE'    => 'rocksalt&cheese',
        'YAKULT SERIES'         => 'yakult',
        'NOVA SERIES'           => 'nova',
        'FRUIT SODA SERIES'     => 'fruit-soda',
        'GREEN TEA SERIES'      => 'fruit-tea',
        'HOT COFFEE'            => 'hot-drinks',
        'HOT DRINKS'            => 'hot-drinks',
        'ICED COFFEE'           => 'iced-coffee',
        'OKINAWA BROWN SUGAR'   => 'okinawa-brown-sugar',
        'AFFORDA-BOWLS'         => 'foods',
        'ALL DAY MEALS'         => 'foods',
        'ALA CARTE SNACKS'      => 'foods',
        'CHICKEN WINGS'         => 'foods',
        'COMBO MEALS'           => 'foods',
        'MIX & MATCH'           => 'foods',
    ];

    // Exact item-name keyword → image file path (relative to menu/)
    private array $itemImageMap = [
        // ── FLAVORED MILK TEA ──
        'WINTERMELON MILK TEA'       => 'flavored-pearl/Wintermelon Milk Tea.png',
        'RED VELVET MILK TEA'        => 'flavored-pearl/Red Velvet Milk Tea.jpg',
        'AVOCADO MILK TEA'           => 'flavored-pearl/Avocado Milk Tea.png',
        'MANGO MILK TEA'             => 'flavored-pearl/Mango Milk Tea.jpg',
        'TARO MILK TEA'              => 'flavored-pearl/taro.png',
        'BELGIAN MILK TEA'           => 'flavored-pearl/chocolate.png',
        "HERSHEY'S MILK TEA"         => 'flavored-pearl/chocolate.png',
        'SALTED CARAMEL MILK TEA'    => 'flavored-pearl/Salted Caramel Milk Tea.jpg',
        'CHOCO HAZELNUT MILK TEA'    => 'flavored-pearl/chocolate.png',
        'COOKIES & CREAM MILK TEA'   => 'flavored-pearl/Cookies & Cream Milk Tea.jpg',
        'TOFFEE CARAMEL MILK TEA'    => 'flavored-pearl/Salted Caramel Milk Tea.png',
        'VANILLA MILK TEA'           => 'flavored-pearl/Wintermelon Milk Tea.png',
        'BLUEBERRY MILK TEA'         => 'flavored-pearl/Blueberry Milk Tea.jpg',
        'OKINAWA MILK TEA'           => 'flavored-pearl/Okinawa Milk Tea.png',
        'MOCHA MILK TEA'             => 'flavored-pearl/Mocha Milk Tea.png',
        'JAVA CHIP MILK TEA'         => 'flavored-pearl/Java Chip Milk Tea.png',
        'MATCHA MILK TEA'            => 'flavored-pearl/Matcha Milk Tea.png',
        'STRAWBERRY MILK TEA'        => 'flavored-pearl/Strawberry.jpg',
        'DARK CHOCOLATE MILK TEA'    => 'flavored-pearl/chocolate.png',
        'CARAMEL MACCHIATO MILK TEA' => 'flavored-pearl/Caramel Macchiato Milk Tea.png',

        // ── CHEESECAKE MILK TEA ──
        'VANILLA + CHEESECAKE'              => 'cheese-cake/Vanilla.jpg',
        'COOKIES & CREAM + CHEESECAKE'      => 'cheese-cake/Cookies & Cream.jpg',
        'STRAWBERRY + CHEESECAKE'           => 'cheese-cake/Strawberry.png',
        'MANGO + CHEESECAKE'                => 'cheese-cake/Mango.jpg',
        'SALTED CARAMEL + CHEESECAKE'       => 'cheese-cake/Salted Caramel.jpg',
        'OKINAWA + CHEESECAKE'              => 'cheese-cake/Okinawa.jpg',
        'CHOCO HAZELNUT + CHEESECAKE'       => 'cheese-cake/Choco Hazelnut.png',
        'TARO + CHEESECAKE'                 => 'cheese-cake/Taro.png',
        'BELGIAN CHOCO M. TEA + CHEESECAKE' => 'cheese-cake/Choco Hazelnut.png',
        'BLUEBERRY + CHEESECAKE'            => 'cheese-cake/Blueberry.jpg',
        'MATCHA + CHEESECAKE'               => 'cheese-cake/Mango.png',

        // ── CREAM CHEESE MILK TEA ──
        'RED VELVET + CREAM CHEESE'       => 'cream-cheese/Red Velvet.png',
        'TARO + CREAM CHEESE'             => 'cream-cheese/Taro.png',
        'VANILLA + CREAM CHEESE'          => 'cream-cheese/Vanilla.jpg',
        'MATCHA + CREAM CHEESE'           => 'cream-cheese/Matcha.png',
        'BELGIAN CHOCO + CREAM CHEESE'    => 'cream-cheese/Belgian Chocolate.png',
        'SALTED CARAMEL + CREAM CHEESE'   => 'cream-cheese/Salted Caramel.jpg',
        'HERSHEYS + CREAM CHEESE'         => 'cream-cheese/Hersheys Chocolate.png',
        'CHOCO HAZELNUT + CREAM CHEESE'   => 'cream-cheese/Belgian Chocolate.png',
        'OKINAWA + CREAM CHEESE'          => 'cream-cheese/Salted Caramel.jpg',
        'BLUEBERRY + CREAM CHEESE'        => 'cream-cheese/Matcha.png',

        // ── COFFEE FRAPPE ──
        'MOCHA FRAPPE'              => 'coffee-frappe/Mocha Coffee Frappe.jpg',
        'VANILLA FRAPPE'            => 'coffee-frappe/Caramel Macchiato.jpg',
        'JAVA CHIP FRAPPE'          => 'coffee-frappe/Java Chip Coffee Frappe.jpg',
        'TOFFEE CARAMEL FRAPPE'     => 'coffee-frappe/Toffee Caramel Coffee Frappe.jpg',
        'CARAMEL MACCHIATO FRAPPE'  => 'coffee-frappe/Caramel Macchiato.jpg',

        // ── FRAPPE SERIES ──
        'TARO FRAPPE'            => 'frappe/Taro_Frappe.jpg',
        'BELGIAN CHOCO. FRAPPE'  => 'frappe/Belgian_Chocolate_Frappe.png',
        'HERSHEYS FRAPPE'        => 'frappe/Hersheys_Chocolate_Frappe.png',
        'CHOCO HAZELNUT FRAPPE'  => 'frappe/Belgian_Chocolate_Frappe.png',
        'SALTED CARAMEL FRAPPE'  => 'frappe/Salted_Caramel_Frappe.jpg',
        'DARK CHOCOLATE FRAPPE'  => 'frappe/Dark_Chocolate_Frappe.png',
        'COOKIES & CREAM FRAPPE' => 'frappe/Cookies&Cream_Frappe.jpg',
        'RED VELVET FRAPPE'      => 'frappe/Taro_Frappe.jpg',

        // ── CLASSIC MILKTEA ──
        'CLASSIC MILK TEA'             => 'lucky-classic/classic_pearl_milktea.png',
        'CLASSIC PEARL'                => 'lucky-classic/classic_pearl_milktea.png',
        'CLASSIC OREO'                 => 'lucky-classic/classic_pearl_milktea.png',
        'CLASSIC PUDDING'              => 'lucky-classic/classic_pearl_milktea.png',
        'CLASSIC BUDDY'                => 'lucky-classic/classic_buddy.png',
        'CLASSIC DUO'                  => 'lucky-classic/classic_duo.png',
        'CLASSIC CREAM CHEESE'         => 'lucky-classic/classic_cream_cheese_violet.jpg',
        'CLASSIC CHEESE CAKE'          => 'lucky-classic/classic_cheesecake.jpg',
        'CLASSIC ROCKSALT & CHEESE'    => 'lucky-classic/classic_cream_cheese_violet.jpg',
        'CLASSIC M. TEA + OREO'        => 'lucky-classic/classic_pearl_milktea.png',
        'Classic Pudding + Black Pearl Milktea' => 'lucky-classic/classic_pearl_milktea.png',
        'Classic Pudding Mini White Pearl'      => 'lucky-classic/classic_pearl_milktea.png',

        // ── LUCKY CLASSIC JR ──
        'LUCKY CLASSIC OREO'        => 'lucky-classic/classic_pearl_milktea.png',
        'LUCKY CLASSIC BLACK PEARL' => 'lucky-classic/classic_pearl_milktea.png',
        'LUCKY CLASSIC WHITE PEARL' => 'lucky-classic/classic_pearl_milktea.png',
        'LUCKY CLASSIC PUDDING'     => 'lucky-classic/classic_pearl_milktea.png',

        // ── LUCKY CLASSIC (full size) ──
        'CLASSIC PUDDING + BLACK PEARL MILKTEA' => 'lucky-classic/classic_pearl_milktea.png',
        'CLASSIC PUDDING MINI WHITE PEARL'      => 'lucky-classic/classic_pearl_milktea.png',

        // ── ROCK SALT & CHEESE ──
        'VANILLA + ROCK SALT & CHEESE'         => 'rocksalt&cheese/wintermelon_rsc.png',
        'DARK CHOCOLATE + ROCK SALT & CHEESE'  => 'rocksalt&cheese/dark_choco_rsc.jpg',
        'WINTERMELON + ROCK SALT & CHEESE'     => 'rocksalt&cheese/wintermelon_rsc.png',
        'MANGO + ROCK SALT & CHEESE'           => 'rocksalt&cheese/mango_rsc.png',
        'AVOCADO + ROCK SALT & CHEESE'         => 'rocksalt&cheese/avocado_rsc.jpg',
        'SALTED CARAMEL + ROCK SALT & CHEESE'  => 'rocksalt&cheese/saltedcaramel_rsc.png',

        // ── YAKULT SERIES ──
        'GREEN APPLE YAKULT' => 'yakult/apple_yakult.png',
        'LYCHEE YAKULT'      => 'yakult/lychee_yakult.jpg',
        'STRAWBERRY YAKULT'  => 'yakult/strawberry_yakult.png',
        'BLUEBERRY YAKULT'   => 'yakult/blueberry_yakult.jpg',
        'GREEN TEA YAKULT'   => 'yakult/apple_yakult.png',
        'LEMON YAKULT'       => 'yakult/lychee_yakult.jpg',
        'BERRIES YAKULT'     => 'yakult/blueberry_yakult.jpg',

        // ── NOVA SERIES ──
        'BERRIES NOVA'     => 'nova/berries_nova.jpg',
        'MANGO LEMON NOVA' => 'nova/mango_lemon_nova.jpg',
        'LYCHEE LEM NOVA'  => 'nova/lychee_lemon_nova.jpg',
        'STRAWBERRY NOVA'  => 'nova/strawberry_nova.jpg',
        'GREEN APPLE NOVA' => 'nova/green_apple_nova.jpg',

        // ── FRUIT SODA SERIES ──
        'BLUEBERRY FRUIT SODA'   => 'fruit-soda/blueberry.jpg',
        'LYCHEE FRUIT SODA'      => 'fruit-soda/lychee.jpg',
        'BERRIES FRUIT SODA'     => 'fruit-soda/berries.jpg',
        'STRAWBERRY FRUIT SODA'  => 'fruit-soda/strawberry.jpg',
        'GREEN APPLE FRUIT SODA' => 'fruit-soda/green apple.jpg',
        'LEMON FRUIT SODA'       => 'fruit-soda/lemon.jpg',
        'PASSION FRUIT SODA'     => 'fruit-soda/passion.jpg',

        // ── GREEN TEA SERIES ──
        'WINTERMELON GREEN TEA'     => 'fruit-tea/wintermelon_green_tea.jpg',
        'HONEY LEMON GREEN TEA'     => 'fruit-tea/honey_lemon_green_tea.jpg',
        'PASSION FRUIT GREEN TEA'   => 'fruit-tea/passion_fruit_green_tea.jpg',
        'LEMON CUCUMBER GREEN TEA'  => 'fruit-tea/lemon_cucumber_green_tea.jpg',
        'LEMON CHIA GREEN TEA'      => 'fruit-tea/lemon_chia_green_tea.jpg',
        'LYCHEE GREEN TEA'          => 'fruit-tea/honey_lemon_green_tea.jpg',

        // ── HOT COFFEE ──
        'DARK ROAST COFFEE'       => 'hot-drinks/dark_roast_coffee.png',
        'HOT MOCHA COFFEE'        => 'hot-drinks/hot_mocha.png',
        'HOT CARAMEL MACCHIATO'   => 'hot-drinks/hot_caramel_macch.png',

        // ── HOT DRINKS ──
        'HOT RED VELVET'      => 'hot-drinks/11.png',
        'HOT MATCHA'          => 'hot-drinks/10.png',
        'HOT CHOCOLATE'       => 'hot-drinks/hot_chocolate.png',
        'CHOCOLATE SMORES'    => 'hot-drinks/hot_chocolate.png',

        // ── ICED COFFEE ──
        'ICED COFFEE CLASSIC'    => 'iced-coffee/Iced Coffee.png',
        'ICED MOCHA COFFEE'      => 'iced-coffee/mocha.png',
        'ICED VANILLA COFFEE'    => 'iced-coffee/vanilla.png',
        'ICED JAVA CHIP COFFEE'  => 'iced-coffee/java_chip.png',
        'ICED TOFFEE CARAMEL'    => 'iced-coffee/Iced Coffee.png',
        'ICED CARAMEL MACCHIATO' => 'iced-coffee/caramel_macchiato.png',

        // ── OKINAWA BROWN SUGAR ──
        'OKINAWA BROWN SUGAR'                    => 'okinawa-brown-sugar/okinawa_brown_sugar.jpg',
        'OK BROWN SUGAR CHEESE MOUSSE'           => 'okinawa-brown-sugar/okinawa_cheese_mousse.jpg',
        'OK BROWN SUGAR CHEESE MOUSSE + MILO'    => 'okinawa-brown-sugar/okinawa_milo.jpg',

        // ── FOODS ──
        'AFFORD-SIOMAI + RICE'          => 'foods/spagh.png',
        'AFFORD-HOTDOG + RICE'          => 'foods/spagh.png',
        'AFFORD-CHIC WINGS + RICE'      => 'foods/wings_plate.png',
        'AFFORD-CHIC POPPERS + RICE'    => 'foods/poppers_plate.png',
        'AFFORD-SHANGHAI + RICE'        => 'foods/spagh.png',
        'AFFORD-CHICK TONKATSU + RICE'  => 'foods/chicken_tonkatsu.png',
        'AFFORD-LONGGA RICE + EGG'      => 'foods/longga_plate.png',
        'Chicken Twister Wrap'          => 'foods/chicken_twister_wrap.png',
        'Chicken Poppers Snack'         => 'foods/poppers.png',
        'Spaghetti'                     => 'foods/spagh.png',
        'Thick Coated Fries'            => 'foods/fries.png',
        'Cheesy Nachos'                 => 'foods/nachos.png',
        'Hungarian Sausage Meal'        => 'foods/spagh.png',
        'SPICY TAPA ALL DAY MEAL'       => 'foods/tapa_plate.png',
        'TONKATSU ALL DAY MEAL'         => 'foods/chicken_tonkatsu.png',
        '3PCS CHICK WINGS ALL DAY MEAL' => 'foods/wings_plate.png',
        'LONGGANISA ALL DAY MEAL'       => 'foods/longga_plate.png',
        'CHICKEN POPPERS ALL DAY MEAL'  => 'foods/poppers_plate.png',
        'BUFFALO'                       => 'foods/chicken_wings.png',
        'GARLIC PARMESAN'               => 'foods/chicken_wings.png',
        'SWEET CHILI'                   => 'foods/chicken_wings.png',
        'TERIYAKI'                      => 'foods/chicken_wings.png',
        'SOY GARLIC'                    => 'foods/chicken_wings.png',
        'SALTED EGG'                    => 'foods/chicken_wings.png',
    ];

    // Cards image map: card title keyword → card image file
    private array $cardImageMap = [
        'normal'     => 'cards/normal_card.png',
        'student'    => 'cards/student_card.png',
        'birthday'   => 'cards/birthday_card.png',
        'summer'     => 'cards/summer_card.png',
        'valentines' => 'cards/valentines_card.png',
        'valentine'  => 'cards/valentines_card.png',
    ];

    public function handle(): int
    {
        $this->info('🔗 Linking menu images to database records...');
        $this->newLine();

        $updated = 0;
        $skipped = 0;

        // Get all menu items with their categories
        $items = DB::table('menu_items')
            ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
            ->select('menu_items.id', 'menu_items.name', 'menu_items.image', 'categories.name as category')
            ->get();

        foreach ($items as $item) {
            $name = trim($item->name);

            // Try exact name match first
            if (isset($this->itemImageMap[$name])) {
                $imagePath = 'menu/' . $this->itemImageMap[$name];
                if (Storage::disk('public')->exists($imagePath)) {
                    DB::table('menu_items')->where('id', $item->id)->update(['image' => $imagePath]);
                    $updated++;
                    $this->line("  ✅ [{$item->id}] {$name} → {$imagePath}");
                } else {
                    $this->warn("  ⚠️  [{$item->id}] {$name} → file not found: {$imagePath}");
                    $skipped++;
                }
                continue;
            }

            // Try case-insensitive match
            $matched = false;
            foreach ($this->itemImageMap as $key => $path) {
                if (strtolower($key) === strtolower($name)) {
                    $imagePath = 'menu/' . $path;
                    if (Storage::disk('public')->exists($imagePath)) {
                        DB::table('menu_items')->where('id', $item->id)->update(['image' => $imagePath]);
                        $updated++;
                        $this->line("  ✅ [{$item->id}] {$name} → {$imagePath}");
                    }
                    $matched = true;
                    break;
                }
            }
            if ($matched) continue;

            $skipped++;
        }

        $this->newLine();
        $this->info("📊 Menu items: {$updated} updated, {$skipped} skipped (no image match)");

        // ── Now update card images ──────────────────────────────────────────
        $this->newLine();
        $this->info('🃏 Linking card images...');

        $cardUpdated = 0;
        $cards = DB::table('cards')->get();

        foreach ($cards as $card) {
            $title = strtolower(trim($card->title));
            foreach ($this->cardImageMap as $keyword => $imagePath) {
                if (str_contains($title, $keyword)) {
                    if (Storage::disk('public')->exists($imagePath)) {
                        DB::table('cards')->where('id', $card->id)->update(['image' => $imagePath]);
                        $cardUpdated++;
                        $this->line("  ✅ [{$card->id}] {$card->title} → {$imagePath}");
                    }
                    break;
                }
            }
        }

        // If no keyword matched, assign default card image
        $remaining = DB::table('cards')->whereNull('image')->orWhere('image', '')->get();
        foreach ($remaining as $card) {
            if (Storage::disk('public')->exists('cards/normal_card.png')) {
                DB::table('cards')->where('id', $card->id)->update(['image' => 'cards/normal_card.png']);
                $cardUpdated++;
                $this->line("  ✅ [{$card->id}] {$card->title} → cards/normal_card.png (default)");
            }
        }

        $this->newLine();
        $this->info("📊 Cards: {$cardUpdated} updated");
        $this->newLine();
        $this->info('✨ Done! Images are now linked to database records.');

        return self::SUCCESS;
    }
}
