import { useState } from 'react';
import TopNavbar from '../TopNavbar';

// Updated Mock Data: Barcodes fixed to AO1-AO20 and AB1-AB7
const MOCK_MENU_DATA = [
  // --- ADD ONS SINKERS (AO1 - AO20) ---
  { id: 1, name: "Mini White Marshmallow", barcode: "AO1", category: "Add Ons Sinkers", unitCost: 20.70, sellingPrice: 15.00, totalCost: 0.00 },
  { id: 2, name: "Premium Rocksalt & Cheesecake", barcode: "AO2", category: "Add Ons Sinkers", unitCost: 0.00, sellingPrice: 25.00, totalCost: 0.00 },
  { id: 3, name: "Premium Cream Cheese", barcode: "AO3", category: "Add Ons Sinkers", unitCost: 0.00, sellingPrice: 25.00, totalCost: 0.00 },
  { id: 4, name: "Premium Cheese Cake", barcode: "AO4", category: "Add Ons Sinkers", unitCost: 0.00, sellingPrice: 25.00, totalCost: 0.00 },
  { id: 5, name: "Black Boba Pearl", barcode: "AO5", category: "Add Ons Sinkers", unitCost: 0.00, sellingPrice: 15.00, totalCost: 0.00 },
  { id: 6, name: "Mini White Pearl", barcode: "AO6", category: "Add Ons Sinkers", unitCost: 0.00, sellingPrice: 15.00, totalCost: 0.00 },
  { id: 7, name: "Crushed Oreo", barcode: "AO7", category: "Add Ons Sinkers", unitCost: 0.00, sellingPrice: 20.00, totalCost: 0.00 },
  { id: 8, name: "Nata Jelly", barcode: "AO8", category: "Add Ons Sinkers", unitCost: 0.00, sellingPrice: 15.00, totalCost: 0.00 },
  { id: 9, name: "Coffee Jelly", barcode: "AO9", category: "Add Ons Sinkers", unitCost: 0.00, sellingPrice: 15.00, totalCost: 0.00 },
  { id: 10, name: "Mixed Fruit Jelly", barcode: "AO10", category: "Add Ons Sinkers", unitCost: 0.00, sellingPrice: 15.00, totalCost: 0.00 },
  { id: 11, name: "Chia Seeds", barcode: "AO11", category: "Add Ons Sinkers", unitCost: 0.00, sellingPrice: 20.00, totalCost: 0.00 },
  { id: 12, name: "Non Dairy Milk", barcode: "AO12", category: "Add Ons Sinkers", unitCost: 0.00, sellingPrice: 20.00, totalCost: 0.00 },
  { id: 13, name: "Milo", barcode: "AO13", category: "Add Ons Sinkers", unitCost: 0.00, sellingPrice: 20.00, totalCost: 0.00 },
  { id: 14, name: "Whip Cream", barcode: "AO14", category: "Add Ons Sinkers", unitCost: 0.00, sellingPrice: 20.00, totalCost: 0.00 },
  { id: 15, name: "Cheese Mousse", barcode: "AO15", category: "Add Ons Sinkers", unitCost: 0.00, sellingPrice: 25.00, totalCost: 0.00 },
  { id: 16, name: "Coffee Shot", barcode: "AO16", category: "Add Ons Sinkers", unitCost: 0.00, sellingPrice: 20.00, totalCost: 0.00 },
  { id: 17, name: "Sugar Sachet", barcode: "AO17", category: "Add Ons Sinkers", unitCost: 0.00, sellingPrice: 5.00, totalCost: 0.00 },
  { id: 18, name: "Creamer Sachet", barcode: "AO18", category: "Add Ons Sinkers", unitCost: 0.00, sellingPrice: 5.00, totalCost: 0.00 },
  { id: 19, name: "Sticky Rice", barcode: "AO19", category: "Add Ons Sinkers", unitCost: 0.00, sellingPrice: 20.00, totalCost: 0.00 },
  { id: 20, name: "Egg Pudding", barcode: "AO20", category: "Add Ons Sinkers", unitCost: 0.00, sellingPrice: 20.00, totalCost: 0.00 },

  // --- AFFORDA-BOWLS ---
  { id: 21, name: "AFFORD-SIOMAI + RICE", barcode: "AB1", category: "AFFORDA-BOWLS", unitCost: 26.86, sellingPrice: 59.00, totalCost: 0.00 },
  { id: 22, name: "AFFORD-HOTDOG + RICE", barcode: "AB2", category: "AFFORDA-BOWLS", unitCost: 23.49, sellingPrice: 59.00, totalCost: 0.00 },
  { id: 23, name: "AFFORD-CHIC WINGS + RICE", barcode: "AB3", category: "AFFORDA-BOWLS", unitCost: 33.86, sellingPrice: 69.00, totalCost: 0.00 },
  { id: 24, name: "AFFORD-CHIC POPPERS + RICE", barcode: "AB4", category: "AFFORDA-BOWLS", unitCost: 41.89, sellingPrice: 69.00, totalCost: 0.00 },
  { id: 25, name: "AFFORD-SHANGHAI + RICE", barcode: "AB5", category: "AFFORDA-BOWLS", unitCost: 48.72, sellingPrice: 69.00, totalCost: 0.00 },
  { id: 26, name: "AFFORD-CHICK TONKATSU + RICE", barcode: "AB6", category: "AFFORDA-BOWLS", unitCost: 40.86, sellingPrice: 79.00, totalCost: 0.00 },
  { id: 27, name: "AFFORD-LONGGA RICE + EGG", barcode: "AB7", category: "AFFORDA-BOWLS", unitCost: 34.68, sellingPrice: 79.00, totalCost: 0.00 },

  // --- ALA CARTE SNACKS ---
  { id: 28, name: "Chicken Twister Wrap", barcode: "ACS1", category: "ALA CARTE SNACKS", unitCost: 0.00, sellingPrice: 85.00, totalCost: 0.00 },
  { id: 29, name: "Chicken Poppers Snack", barcode: "ACS2", category: "ALA CARTE SNACKS", unitCost: 0.00, sellingPrice: 99.00, totalCost: 0.00 },
  { id: 30, name: "Spaghetti", barcode: "ACS3", category: "ALA CARTE SNACKS", unitCost: 0.00, sellingPrice: 75.00, totalCost: 0.00 },
  { id: 31, name: "Thick Coated Fries", barcode: "ACS4", category: "ALA CARTE SNACKS", unitCost: 0.00, sellingPrice: 99.00, totalCost: 0.00 },
  { id: 32, name: "Cheesy Nachos", barcode: "ACS5", category: "ALA CARTE SNACKS", unitCost: 0.00, sellingPrice: 180.00, totalCost: 0.00 },
  { id: 33, name: "Bottled Mineral Water", barcode: "BTL1", category: "ALA CARTE SNACKS", unitCost: 0.00, sellingPrice: 25.00, totalCost: 0.00 },
  { id: 34, name: "Rice", barcode: "RCE", category: "ALA CARTE SNACKS", unitCost: 0.00, sellingPrice: 20.00, totalCost: 0.00 },

  // --- ALL DAY MEALS (ADM1 - ADM5) ---
  { id: 35, name: "SPICY TAPA ALL DAY MEAL", barcode: "ADM1", category: "ALL DAY MEALS", unitCost: 0.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 36, name: "TONKATSU ALL DAY MEAL", barcode: "ADM2", category: "ALL DAY MEALS", unitCost: 0.00, sellingPrice: 120.00, totalCost: 0.00 },
  { id: 37, name: "3PCS CHICK WINGS ALL DAY MEAL", barcode: "ADM3", category: "ALL DAY MEALS", unitCost: 0.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 38, name: "LONGGANISA ALL DAY MEAL", barcode: "ADM4", category: "ALL DAY MEALS", unitCost: 0.00, sellingPrice: 100.00, totalCost: 0.00 },
  { id: 39, name: "CHICKEN POPPERS ALL DAY MEAL", barcode: "ADM5", category: "ALL DAY MEALS", unitCost: 0.00, sellingPrice: 135.00, totalCost: 0.00 },

  // --- CARD (CRD1 - CRD2) ---
  { id: 40, name: "LUCKY CARD", barcode: "LC1", category: "CARD", unitCost: 0.00, sellingPrice: 150.00, totalCost: 0.00 },
  { id: 41, name: "LUCKY CARD CHRISTMAS EDITION", barcode: "LCCS", category: "CARD", unitCost: 0.00, sellingPrice: 150.00, totalCost: 0.00 },

  // --- CHEESECAKE MILK TEA (CCMM1 - CCMM12) ---
  { id: 42, name: "OKINAWA M. TEA + C.CAKE", barcode: "CCMM1", category: "CHEESECAKE MILK TEA", unitCost: 0.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 43, name: "CHOC HZELNT + C.CAKE", barcode: "CCMM2", category: "CHEESECAKE MILK TEA", unitCost: 0.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 44, name: "STRAWBERRY M. TEA + C.CAKE", barcode: "CCMM3", category: "CHEESECAKE MILK TEA", unitCost: 0.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 45, name: "SALTED CARAMEL M. TEA + C.CAKE", barcode: "CCMM4", category: "CHEESECAKE MILK TEA", unitCost: 0.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 46, name: "VANILLA M. TEA + C.CAKE", barcode: "CCMM5", category: "CHEESECAKE MILK TEA", unitCost: 0.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 47, name: "TARO M. TEA + C.CAKE", barcode: "CCMM6", category: "CHEESECAKE MILK TEA", unitCost: 0.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 48, name: "VANILLA M. TEA + C.CAKE", barcode: "CCMM7", category: "CHEESECAKE MILK TEA", unitCost: 0.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 49, name: "MANGO M. TEA + C.CAKE", barcode: "CCMM8", category: "CHEESECAKE MILK TEA", unitCost: 0.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 50, name: "BBERRY M. TEA + C.CAKE", barcode: "CCMM9", category: "CHEESECAKE MILK TEA", unitCost: 0.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 51, name: "MATCHA M. TEA + C.CAKE", barcode: "CCMM10", category: "CHEESECAKE MILK TEA", unitCost: 0.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 52, name: "COOKIES & CREAM M. TEA + C.CAKE", barcode: "CCMM11", category: "CHEESECAKE MILK TEA", unitCost: 0.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 53, name: "BELGIAN M. TEA + C.CAKE", barcode: "CCMM12", category: "CHEESECAKE MILK TEA", unitCost: 0.00, sellingPrice: 115.00, totalCost: 0.00 },

  // --- CHEESECAKE MILK TEA LARGE (CCML1 - CCML12) ---
  { id: 54, name: "OKINAWA M. TEA + C.CAKE (L)", barcode: "CCML1", category: "CHEESECAKE MILK TEA", unitCost: 0.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 55, name: "CHOC HZELNT + C.CAKE (L)", barcode: "CCML2", category: "CHEESECAKE MILK TEA", unitCost: 0.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 56, name: "STRAWBERRY M. TEA + C.CAKE (L)", barcode: "CCML3", category: "CHEESECAKE MILK TEA", unitCost: 0.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 57, name: "SALTED CARAMEL M. TEA + C.CAKE (L)", barcode: "CCML4", category: "CHEESECAKE MILK TEA", unitCost: 0.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 58, name: "VANILLA M. TEA + C.CAKE (L)", barcode: "CCML5", category: "CHEESECAKE MILK TEA", unitCost: 0.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 59, name: "TARO M. TEA + C.CAKE (L)", barcode: "CCML6", category: "CHEESECAKE MILK TEA", unitCost: 0.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 60, name: "VANILLA M. TEA + C.CAKE (L)", barcode: "CCML7", category: "CHEESECAKE MILK TEA", unitCost: 0.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 61, name: "MANGO M. TEA + C.CAKE (L)", barcode: "CCML8", category: "CHEESECAKE MILK TEA", unitCost: 0.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 62, name: "BBERRY M. TEA + C.CAKE (L)", barcode: "CCML9", category: "CHEESECAKE MILK TEA", unitCost: 0.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 63, name: "MATCHA M. TEA + C.CAKE (L)", barcode: "CCML10", category: "CHEESECAKE MILK TEA", unitCost: 0.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 64, name: "COOKIES & CREAM M. TEA + C.CAKE (L)", barcode: "CCML11", category: "CHEESECAKE MILK TEA", unitCost: 0.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 65, name: "BELGIAN M. TEA + C.CAKE (L)", barcode: "CCML12", category: "CHEESECAKE MILK TEA", unitCost: 0.00, sellingPrice: 135.00, totalCost: 0.00 },

  // 3 PCS (3CW1 - 3CW6) - ₱100.00
  { id: 66, name: "BUFFALO (3PCS)", barcode: "3CW1", category: "CHICKEN WINGS", unitCost: 0.00, sellingPrice: 100.00, totalCost: 0.00 },
  { id: 67, name: "GARLIC PARMESAN (3PCS)", barcode: "3CW2", category: "CHICKEN WINGS", unitCost: 0.00, sellingPrice: 100.00, totalCost: 0.00 },
  { id: 68, name: "SWEET CHILI (3PCS)", barcode: "3CW3", category: "CHICKEN WINGS", unitCost: 0.00, sellingPrice: 100.00, totalCost: 0.00 },
  { id: 69, name: "TERIYAKI (3PCS)", barcode: "3CW4", category: "CHICKEN WINGS", unitCost: 0.00, sellingPrice: 100.00, totalCost: 0.00 },
  { id: 70, name: "SOY GARLIC (3PCS)", barcode: "3CW5", category: "CHICKEN WINGS", unitCost: 0.00, sellingPrice: 100.00, totalCost: 0.00 },
  { id: 71, name: "SALTED EGG (3PCS)", barcode: "3CW6", category: "CHICKEN WINGS", unitCost: 0.00, sellingPrice: 100.00, totalCost: 0.00 },

  // 4 PCS (4CW1 - 4CW6) - ₱120.00
  { id: 72, name: "BUFFALO (4PCS)", barcode: "4CW1", category: "CHICKEN WINGS", unitCost: 0.00, sellingPrice: 120.00, totalCost: 0.00 },
  { id: 73, name: "GARLIC PARMESAN (4PCS)", barcode: "4CW2", category: "CHICKEN WINGS", unitCost: 0.00, sellingPrice: 120.00, totalCost: 0.00 },
  { id: 74, name: "SWEET CHILI (4PCS)", barcode: "4CW3", category: "CHICKEN WINGS", unitCost: 0.00, sellingPrice: 120.00, totalCost: 0.00 },
  { id: 75, name: "TERIYAKI (4PCS)", barcode: "4CW4", category: "CHICKEN WINGS", unitCost: 0.00, sellingPrice: 120.00, totalCost: 0.00 },
  { id: 76, name: "SOY GARLIC (4PCS)", barcode: "4CW5", category: "CHICKEN WINGS", unitCost: 0.00, sellingPrice: 120.00, totalCost: 0.00 },
  { id: 77, name: "SALTED EGG (4PCS)", barcode: "4CW6", category: "CHICKEN WINGS", unitCost: 0.00, sellingPrice: 120.00, totalCost: 0.00 },

  // 6 PCS (6CW1 - 6CW6) - ₱195.00
  { id: 78, name: "BUFFALO (6PCS)", barcode: "6CW1", category: "CHICKEN WINGS", unitCost: 0.00, sellingPrice: 195.00, totalCost: 0.00 },
  { id: 79, name: "GARLIC PARMESAN (6PCS)", barcode: "6CW2", category: "CHICKEN WINGS", unitCost: 0.00, sellingPrice: 195.00, totalCost: 0.00 },
  { id: 80, name: "SWEET CHILI (6PCS)", barcode: "6CW3", category: "CHICKEN WINGS", unitCost: 0.00, sellingPrice: 195.00, totalCost: 0.00 },
  { id: 81, name: "TERIYAKI (6PCS)", barcode: "6CW4", category: "CHICKEN WINGS", unitCost: 0.00, sellingPrice: 195.00, totalCost: 0.00 },
  { id: 82, name: "SOY GARLIC (6PCS)", barcode: "6CW5", category: "CHICKEN WINGS", unitCost: 0.00, sellingPrice: 195.00, totalCost: 0.00 },
  { id: 83, name: "SALTED EGG (6PCS)", barcode: "6CW6", category: "CHICKEN WINGS", unitCost: 0.00, sellingPrice: 195.00, totalCost: 0.00 },

  // 12 PCS (12CW1 - 12CW6) - ₱390.00
  { id: 84, name: "BUFFALO (12PCS)", barcode: "12CW1", category: "CHICKEN WINGS", unitCost: 0.00, sellingPrice: 390.00, totalCost: 0.00 },
  { id: 85, name: "GARLIC PARMESAN (12PCS)", barcode: "12CW2", category: "CHICKEN WINGS", unitCost: 0.00, sellingPrice: 390.00, totalCost: 0.00 },
  { id: 86, name: "SWEET CHILI (12PCS)", barcode: "12CW3", category: "CHICKEN WINGS", unitCost: 0.00, sellingPrice: 390.00, totalCost: 0.00 },
  { id: 87, name: "TERIYAKI (12PCS)", barcode: "12CW4", category: "CHICKEN WINGS", unitCost: 0.00, sellingPrice: 390.00, totalCost: 0.00 },
  { id: 88, name: "SOY GARLIC (12PCS)", barcode: "12CW5", category: "CHICKEN WINGS", unitCost: 0.00, sellingPrice: 390.00, totalCost: 0.00 },
  { id: 89, name: "SALTED EGG (12PCS)", barcode: "12CW6", category: "CHICKEN WINGS", unitCost: 0.00, sellingPrice: 390.00, totalCost: 0.00 },

  // --- CLASSIC MILKTEA MEDIUM (CMM1 - CMM11) ---
  { id: 90, name: "CLASSIC M. TEA", barcode: "CMM1", category: "CLASSIC MILKTEA", unitCost: 0.00, sellingPrice: 70.00, totalCost: 0.00 },
  { id: 91, name: "CLASSIC PEARL M. TEA", barcode: "CMM2", category: "CLASSIC MILKTEA", unitCost: 0.00, sellingPrice: 70.00, totalCost: 0.00 },
  { id: 92, name: "CLASSIC BUDDY M. TEA", barcode: "CMM3", category: "CLASSIC MILKTEA", unitCost: 0.00, sellingPrice: 105.00, totalCost: 0.00 },
  { id: 93, name: "CLASSIC DUO M. TEA", barcode: "CMM4", category: "CLASSIC MILKTEA", unitCost: 0.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 94, name: "CLASSIC CRM. CHEESE", barcode: "CMM5", category: "CLASSIC MILKTEA", unitCost: 0.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 95, name: "CLASSIC C. CAKE M. TEA", barcode: "CMM6", category: "CLASSIC MILKTEA", unitCost: 0.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 96, name: "CLASSIC RSC M. TEA", barcode: "CMM7", category: "CLASSIC MILKTEA", unitCost: 0.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 97, name: "CLASSIC M. TEA + OREO", barcode: "CMM8", category: "CLASSIC MILKTEA", unitCost: 0.00, sellingPrice: 85.00, totalCost: 0.00 },
  { id: 98, name: "CLASSIC M. TEA + PUDDING", barcode: "CMM9", category: "CLASSIC MILKTEA", unitCost: 0.00, sellingPrice: 95.00, totalCost: 0.00 },
  { id: 99, name: "CL PUDDING + B.PEARL", barcode: "CMM10", category: "CLASSIC MILKTEA", unitCost: 0.00, sellingPrice: 110.00, totalCost: 0.00 },
  { id: 100, name: "CL PUDDING + MWP", barcode: "CMM11", category: "CLASSIC MILKTEA", unitCost: 0.00, sellingPrice: 110.00, totalCost: 0.00 },

  // --- CLASSIC MILKTEA LARGE (CML1 - CML11) ---
  { id: 101, name: "CLASSIC M. TEA (L)", barcode: "CML1", category: "CLASSIC MILKTEA", unitCost: 0.00, sellingPrice: 90.00, totalCost: 0.00 },
  { id: 102, name: "CLASSIC PEARL M. TEA (L)", barcode: "CML2", category: "CLASSIC MILKTEA", unitCost: 0.00, sellingPrice: 90.00, totalCost: 0.00 },
  { id: 103, name: "CLASSIC BUDDY M. TEA (L)", barcode: "CML3", category: "CLASSIC MILKTEA", unitCost: 0.00, sellingPrice: 125.00, totalCost: 0.00 },
  { id: 104, name: "CLASSIC DUO M. TEA (L)", barcode: "CML4", category: "CLASSIC MILKTEA", unitCost: 0.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 105, name: "CLASSIC CRM. CHEESE (L)", barcode: "CML5", category: "CLASSIC MILKTEA", unitCost: 0.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 106, name: "CLASSIC C. CAKE M. TEA (L)", barcode: "CML6", category: "CLASSIC MILKTEA", unitCost: 0.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 107, name: "CLASSIC RSC M. TEA (L)", barcode: "CML7", category: "CLASSIC MILKTEA", unitCost: 0.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 108, name: "CLASSIC M. TEA + OREO (L)", barcode: "CML8", category: "CLASSIC MILKTEA", unitCost: 0.00, sellingPrice: 105.00, totalCost: 0.00 },
  { id: 109, name: "CLASSIC M. TEA + PUDDING (L)", barcode: "CML9", category: "CLASSIC MILKTEA", unitCost: 0.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 110, name: "CL PUDDING + B.PEARL (L)", barcode: "CML10", category: "CLASSIC MILKTEA", unitCost: 0.00, sellingPrice: 130.00, totalCost: 0.00 },
  { id: 111, name: "CL PUDDING + MWP (L)", barcode: "CML11", category: "CLASSIC MILKTEA", unitCost: 0.00, sellingPrice: 130.00, totalCost: 0.00 },

  // --- COFFEE FRAPPE MEDIUM (CFM1 - CFM5) ---
  { id: 112, name: "MOCHA FRP", barcode: "CFM1", category: "COFFEE FRAPPE", unitCost: 0.00, sellingPrice: 125.00, totalCost: 0.00 },
  { id: 113, name: "VANILLA FRP", barcode: "CFM2", category: "COFFEE FRAPPE", unitCost: 0.00, sellingPrice: 125.00, totalCost: 0.00 },
  { id: 114, name: "JAVA CHIP FRP", barcode: "CFM3", category: "COFFEE FRAPPE", unitCost: 0.00, sellingPrice: 125.00, totalCost: 0.00 },
  { id: 115, name: "TOFFEE CARAMEL FRP", barcode: "CFM4", category: "COFFEE FRAPPE", unitCost: 0.00, sellingPrice: 125.00, totalCost: 0.00 },
  { id: 116, name: "CARAMEL MACCHIATO FRP", barcode: "CFM5", category: "COFFEE FRAPPE", unitCost: 56.00, sellingPrice: 125.00, totalCost: 0.00 },

  // --- COFFEE FRAPPE LARGE (CFL1 - CFL5) ---
  { id: 117, name: "MOCHA FRP (L)", barcode: "CFL1", category: "COFFEE FRAPPE", unitCost: 0.00, sellingPrice: 145.00, totalCost: 0.00 },
  { id: 118, name: "VANILLA FRP (L)", barcode: "CFL2", category: "COFFEE FRAPPE", unitCost: 0.00, sellingPrice: 145.00, totalCost: 0.00 },
  { id: 119, name: "JAVA CHIP FRP (L)", barcode: "CFL3", category: "COFFEE FRAPPE", unitCost: 0.00, sellingPrice: 145.00, totalCost: 0.00 },
  { id: 120, name: "TOFFEE CARAMEL FRP (L)", barcode: "CFL4", category: "COFFEE FRAPPE", unitCost: 0.00, sellingPrice: 145.00, totalCost: 0.00 },
  { id: 121, name: "CARAMEL MACCHIATO FRP (L)", barcode: "CFL5", category: "COFFEE FRAPPE", unitCost: 0.00, sellingPrice: 145.00, totalCost: 0.00 },
];

const MenuList = () => {
  const [filterName, setFilterName] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Filtering Logic
  const filteredData = MOCK_MENU_DATA.filter(item => {
    const matchesName = item.name.toLowerCase().includes(filterName.toLowerCase()) || 
                        item.barcode.toLowerCase().includes(filterName.toLowerCase());
    const matchesCategory = item.category.toLowerCase().includes(filterCategory.toLowerCase());
    return matchesName && matchesCategory;
  });

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        
        {/* === HEADER SECTION === */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">

        </div>

        {/* === FILTER BAR === */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-200 mb-4">
          <div className="flex flex-col xl:flex-row gap-4 items-end">
            
            {/* Name / Barcode */}
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Name / Barcode</label>
              <input 
                type="text" 
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10"
              />
            </div>

            {/* Category */}
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Category</label>
              <input 
                type="text" 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10"
              />
            </div>

            {/* Filter By */}
            <div className="w-full xl:w-32">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Filter By</label>
              <select className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10 cursor-pointer">
                <option>ACTIVE</option>
                <option>INACTIVE</option>
              </select>
            </div>

            {/* Limit By */}
            <div className="w-full xl:w-24">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Limit By</label>
              <select className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10 cursor-pointer">
                <option>50</option>
                <option>100</option>
                <option>All</option>
              </select>
            </div>

            {/* Type */}
            <div className="w-full xl:w-32">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Type</label>
              <select className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10 cursor-pointer">
                <option>FOOD</option>
                <option>DRINK</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full xl:w-auto">
              <button className="flex-1 xl:flex-none px-6 h-10 bg-[#1e40af] text-white rounded-md font-bold uppercase text-[10px] tracking-widest hover:bg-[#1e3a8a] shadow-sm transition-all flex items-center justify-center min-w-[100px]">
                SEARCH
              </button>
              <button className="flex-1 xl:flex-none px-6 h-10 bg-emerald-500 text-white rounded-md font-bold uppercase text-[10px] tracking-widest hover:bg-emerald-600 shadow-sm transition-all flex items-center justify-center min-w-[100px]">
                ADD ITEM
              </button>
            </div>

          </div>
        </div>

        <div className="flex gap-2">
            <button className="px-6 py-2 bg-[#1e40af] text-white rounded-md font-bold uppercase text-[10px] tracking-widest hover:bg-[#1e3a8a] shadow-sm transition-all">
              PRINT
            </button>
            <button className="px-6 py-2 bg-[#1e40af] text-white rounded-md font-bold uppercase text-[10px] tracking-widest hover:bg-[#1e3a8a] shadow-sm transition-all">
              LIST WITH KITS
            </button>
            <button className="px-6 py-2 bg-[#1e40af] text-white rounded-md font-bold uppercase text-[10px] tracking-widest hover:bg-[#1e3a8a] shadow-sm transition-all">
              LIST W/O KITS
            </button>
          </div>

        {/* === DATA TABLE === */}
        <div className="mt-5 flex-1 bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-zinc-100 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200">Item Name</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200">Barcode</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200">Category</th>
                  {/* Removed Promos Column */}
                  <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-right">Unit Cost</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-right">Selling Price</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredData.map((item, index) => (
                  <tr key={item.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}`}>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700">{item.name}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-500">{item.barcode || '-'}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-500">{item.category}</td>
                    {/* Promos Cell Removed */}
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 text-right">{item.unitCost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 text-right">{item.sellingPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 text-right">{item.totalCost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Footer / Pagination Placeholder */}
          <div className="p-3 bg-zinc-50 border-t border-zinc-200 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Showing {filteredData.length} Items
          </div>
        </div>

      </div>
    </div>
  );
};

export default MenuList;