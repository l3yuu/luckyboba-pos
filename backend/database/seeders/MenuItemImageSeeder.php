<?php

// FILE: database/seeders/MenuItemImageSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MenuItemImageSeeder extends Seeder
{
    public function run(): void
    {
        // Maps DB item name → exact file path inside storage/app/public/
        // Filenames verified against actual storage folder screenshots.
        $images = [

            // ── Cheese Cake ───────────────────────────────────────────
            'OKINAWA + CHEESECAKE'                    => 'menu/cheese-cake/Okinawa.jpg',
            'SALTED CARAMEL + CHEESECAKE'             => 'menu/cheese-cake/Salted Caramel.jpg',
            'VANILLA + CHEESECAKE'                    => 'menu/cheese-cake/Vanilla.jpg',
            'MANGO + CHEESECAKE'                      => 'menu/cheese-cake/Mango.jpg',
            'STRAWBERRY + CHEESECAKE'                 => 'menu/cheese-cake/Strawberry.png',
            'TARO + CHEESECAKE'                       => 'menu/cheese-cake/Taro.png',
            'CHOCO HAZELNUT + CHEESECAKE'             => 'menu/cheese-cake/Choco Hazelnut.png',
            'COOKIES & CREAM + CHEESECAKE'            => 'menu/cheese-cake/Cookies & Cream.jpg',
            // NOTE: cheese-cake/Blueberry.jpg has no matching DB item yet.

            // ── Coffee Frappe ─────────────────────────────────────────
            'CARAMEL MACCHIATO FRAPPE'                => 'menu/coffee-frappe/Caramel Macchiato.jpg',
            'JAVA CHIP FRAPPE'                        => 'menu/coffee-frappe/Java Chip Coffee Frappe.jpg',
            'MOCHA FRAPPE'                            => 'menu/coffee-frappe/Mocha Coffee Frappe.jpg',
            'TOFFEE CARAMEL FRAPPE'                   => 'menu/coffee-frappe/Toffee Caramel Coffee Frappe.jpg',
            // NOTE: no Vanilla Frappe file in coffee-frappe folder.

            // ── Cream Cheese ──────────────────────────────────────────
            'BELGIAN CHOCO + CREAM CHEESE'            => 'menu/cream-cheese/Belgian Chocolate.png',
            'HERSHEYS + CREAM CHEESE'                 => 'menu/cream-cheese/Hersheys Chocolate.png',
            'MATCHA + CREAM CHEESE'                   => 'menu/cream-cheese/Matcha.png',
            'RED VELVET + CREAM CHEESE'               => 'menu/cream-cheese/Red Velvet.png',
            'SALTED CARAMEL + CREAM CHEESE'           => 'menu/cream-cheese/Salted Caramel.jpg',
            'TARO + CREAM CHEESE'                     => 'menu/cream-cheese/Taro.png',
            'VANILLA + CREAM CHEESE'                  => 'menu/cream-cheese/Vanilla.jpg',

            // ── Flavored Pearl (Milk Tea) ─────────────────────────────
            'AVOCADO MILK TEA'                        => 'menu/flavored-pearl/Avocado Milk Tea.png',
            'BLUEBERRY MILK TEA'                      => 'menu/flavored-pearl/Blueberry Milk Tea.jpg',
            'CHOCO HAZELNUT MILK TEA'                 => 'menu/flavored-pearl/chocolate.png',
            'COOKIES & CREAM MILK TEA'                => 'menu/flavored-pearl/Cookies & Cream Milk Tea.jpg',
            'JAVA CHIP MILK TEA'                      => 'menu/flavored-pearl/Java Chip Milk Tea.png',
            'MANGO MILK TEA'                          => 'menu/flavored-pearl/Mango Milk Tea.jpg',
            'MATCHA MILK TEA'                         => 'menu/flavored-pearl/Matcha Milk Tea.png',
            'MOCHA MILK TEA'                          => 'menu/flavored-pearl/Mocha Milk Tea.png',
            'OKINAWA MILK TEA'                        => 'menu/flavored-pearl/Okinawa Milk Tea.png',
            'RED VELVET MILK TEA'                     => 'menu/flavored-pearl/Red Velvet Milk Tea.jpg',
            'SALTED CARAMEL MILK TEA'                 => 'menu/flavored-pearl/Salted Caramel Milk Tea.png',
            'STRAWBERRY MILK TEA'                     => 'menu/flavored-pearl/Strawberry.jpg',
            'TARO MILK TEA'                           => 'menu/flavored-pearl/taro.png',
            'WINTERMELON MILK TEA'                    => 'menu/flavored-pearl/Wintermelon Milk Tea.png',
            // NOTE: flavored-pearl/Caramel Macchiato Milk Tea.png exists in storage
            //       but 'CARAMEL MACCHIATO MILK TEA' is not in the DB item list.

            // ── Foods ─────────────────────────────────────────────────
            'Chicken Twister Wrap'                    => 'menu/foods/chicken_twister_wrap.png',
            'Chicken Poppers Snack'                   => 'menu/foods/poppers.png',
            'Cheesy Nachos'                           => 'menu/foods/nachos.png',
            'Spaghetti'                               => 'menu/foods/spagh.png',
            'Thick Coated Fries'                      => 'menu/foods/fries.png',
            'AFFORD-HOTDOG + RICE'                    => 'menu/foods/wings_plate.png',
            'AFFORD-SIOMAI + RICE'                    => 'menu/foods/wings_plate.png',
            'AFFORD-SHANGHAI + RICE'                  => 'menu/foods/wings_plate.png',
            'AFFORD-CHIC WINGS + RICE'                => 'menu/foods/wings_plate.png',
            'AFFORD-CHIC POPPERS + RICE'              => 'menu/foods/poppers_plate.png',
            'AFFORD-CHICK TONKATSU + RICE'            => 'menu/foods/tapa_plate.png',
            'AFFORD-LONGGA RICE + EGG'                => 'menu/foods/longga_plate.png',
            'LONGGANISA ALL DAY MEAL'                 => 'menu/foods/longga_plate.png',
            'SPICY TAPA ALL DAY MEAL'                 => 'menu/foods/tapa_plate.png',
            'TONKATSU ALL DAY MEAL'                   => 'menu/foods/tapa_plate.png',
            '3PCS CHICK WINGS ALL DAY MEAL'           => 'menu/foods/wings_plate.png',
            'CHICKEN POPPERS ALL DAY MEAL'            => 'menu/foods/poppers_plate.png',

            // ── Frappes ───────────────────────────────────────────────
            'BELGIAN CHOCO. FRAPPE'                   => 'menu/frappe/Belgian_Chocolate_Frappe.png',
            'COOKIES & CREAM FRAPPE'                  => 'menu/frappe/Cookies&Cream_Frappe.jpg',
            'DARK CHOCOLATE FRAPPE'                   => 'menu/frappe/Dark_Chocolate_Frappe.png',
            'HERSHEYS FRAPPE'                         => 'menu/frappe/Hersheys_Chocolate_Frappe.png',
            'SALTED CARAMEL FRAPPE'                   => 'menu/frappe/Salted_Caramel_Frappe.jpg',
            'TARO FRAPPE'                             => 'menu/frappe/Taro_Frappe.jpg',

            // ── Fruit Soda ────────────────────────────────────────────
            'BERRIES FRUIT SODA'                      => 'menu/fruit-soda/berries.jpg',
            'BLUEBERRY FRUIT SODA'                    => 'menu/fruit-soda/blueberry.jpg',
            'GREEN APPLE FRUIT SODA'                  => 'menu/fruit-soda/green apple.jpg',
            'LEMON FRUIT SODA'                        => 'menu/fruit-soda/lemon.jpg',
            'LYCHEE FRUIT SODA'                       => 'menu/fruit-soda/lychee.jpg',
            'STRAWBERRY FRUIT SODA'                   => 'menu/fruit-soda/strawberry.jpg',
            // NOTE: fruit-soda/passion.jpg exists — no 'PASSION FRUIT SODA' in DB.

            // ── Fruit Tea (Green Tea) ─────────────────────────────────
            'HONEY LEMON GREEN TEA'                   => 'menu/fruit-tea/honey_lemon_green_tea.jpg',
            'LEMON CHIA GREEN TEA'                    => 'menu/fruit-tea/lemon_chia_green_tea.jpg',
            'LEMON CUCUMBER GREEN TEA'                => 'menu/fruit-tea/lemon_cucumber_green_tea.jpg',
            'PASSION FRUIT GREEN TEA'                 => 'menu/fruit-tea/passion_fruit_green_tea.jpg',
            'WINTERMELON GREEN TEA'                   => 'menu/fruit-tea/wintermelon_green_tea.jpg',

            // ── Hot Drinks ────────────────────────────────────────────
            // NOTE: hot-drinks/10.png and 11.png — unknown which menu items these are.
            //       Identify them and add here manually.
            'DARK ROAST COFFEE'                       => 'menu/hot-drinks/dark_roast_coffee.png',
            'HOT CARAMEL MACCHIATO'                   => 'menu/hot-drinks/hot_caramel_macch.png',
            'HOT CHOCOLATE'                           => 'menu/hot-drinks/hot_chocolate.png',
            'HOT MOCHA COFFEE'                        => 'menu/hot-drinks/hot_mocha.png',

            // ── Iced Coffee ───────────────────────────────────────────
            'ICED CARAMEL MACCHIATO'                  => 'menu/iced-coffee/caramel_macchiato.png',
            'ICED COFFEE CLASSIC'                     => 'menu/iced-coffee/Iced Coffee.png',
            'ICED JAVA CHIP COFFEE'                   => 'menu/iced-coffee/java_chip.png',
            'ICED MOCHA COFFEE'                       => 'menu/iced-coffee/mocha.png',
            'ICED VANILLA COFFEE'                     => 'menu/iced-coffee/vanilla.png',

            // ── Lucky Classic ─────────────────────────────────────────
            'CLASSIC BUDDY'                           => 'menu/lucky-classic/classic_buddy.png',
            'CLASSIC CHEESE CAKE'                     => 'menu/lucky-classic/classic_cheesecake.jpg',
            'CLASSIC CREAM CHEESE'                    => 'menu/lucky-classic/classic_cream_cheese_violet.jpg',
            'CLASSIC DUO'                             => 'menu/lucky-classic/classic_duo.png',
            'CLASSIC MILK TEA'                        => 'menu/lucky-classic/classic_pearl_milktea.png',
            'CLASSIC OREO'                            => 'menu/lucky-classic/classic_pearl_milktea.png',
            'CLASSIC PEARL'                           => 'menu/lucky-classic/classic_pearl_milktea.png',
            'CLASSIC PUDDING'                         => 'menu/lucky-classic/classic_pearl_milktea.png',
            'CLASSIC ROCKSALT & CHEESE'               => 'menu/lucky-classic/classic_vanilla.png',

            // ── Nova Series ───────────────────────────────────────────
            'BERRIES NOVA'                            => 'menu/nova/berries_nova.jpg',
            'GREEN APPLE NOVA'                        => 'menu/nova/green_apple_nova.jpg',
            'LYCHEE LEM NOVA'                         => 'menu/nova/lychee_lemon_nova.jpg',
            'MANGO LEMON NOVA'                        => 'menu/nova/mango_lemon_nova.jpg',
            'STRAWBERRY NOVA'                         => 'menu/nova/strawberry_nova.jpg',

            // ── Okinawa Brown Sugar ───────────────────────────────────
            'OKINAWA BROWN SUGAR'                     => 'menu/okinawa-brown-sugar/okinawa_brown_sugar.jpg',
            'OK BROWN SUGAR CHEESE MOUSSE'            => 'menu/okinawa-brown-sugar/okinawa_cheese_mousse.jpg',
            'OK BROWN SUGAR CHEESE MOUSSE + MILO'     => 'menu/okinawa-brown-sugar/okinawa_milo.jpg',

            // ── Rock Salt & Cheese ────────────────────────────────────
            'AVOCADO + ROCK SALT & CHEESE'            => 'menu/rocksalt&cheese/avocado_rsc.jpg',
            'DARK CHOCOLATE + ROCK SALT & CHEESE'     => 'menu/rocksalt&cheese/dark_choco_rsc.jpg',
            'MANGO + ROCK SALT & CHEESE'              => 'menu/rocksalt&cheese/mango_rsc.png',
            'VANILLA + ROCK SALT & CHEESE'            => 'menu/rocksalt&cheese/saltedcaramel_rsc.png',
            'WINTERMELON + ROCK SALT & CHEESE'        => 'menu/rocksalt&cheese/wintermelon_rsc.png',

            // ── Yakult Series ─────────────────────────────────────────
            'GREEN APPLE YAKULT'                      => 'menu/yakult/apple_yakult.png',
            'BLUEBERRY YAKULT'                        => 'menu/yakult/blueberry_yakult.jpg',
            'LYCHEE YAKULT'                           => 'menu/yakult/lychee_yakult.jpg',
            'STRAWBERRY YAKULT'                       => 'menu/yakult/strawberry_yakult.png',

        ];

        $updated = 0;
        $notFound = [];

        foreach ($images as $name => $path) {
            $rows = DB::table('menu_items')
                ->where('name', $name)
                ->update(['image' => $path]);

            if ($rows > 0) {
                $updated += $rows;
            } else {
                $notFound[] = $name;
            }
        }

        $this->command->info("✅ Updated $updated menu item rows with images.");

        if (!empty($notFound)) {
            $this->command->warn("⚠️  These names were not found in the DB:");
            foreach ($notFound as $name) {
                $this->command->line("   - $name");
            }
        }
    }
}