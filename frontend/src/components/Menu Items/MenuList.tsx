import { useState } from 'react';
import TopNavbar from '../TopNavbar';

// Updated Mock Data: Barcodes fixed to AO1-AO20 and AB1-AB7
const MOCK_MENU_DATA = [
  // --- ADD ONS SINKERS (AO1 - AO20) ---
  { id: 1, name: "Mini White Marshmallow", barcode: "AO1", category: "Add Ons Sinkers", unitCost: 4.36, sellingPrice: 15.00, totalCost: 0.00 },
  { id: 2, name: "Premium Rocksalt & Cheesecake", barcode: "AO2", category: "Add Ons Sinkers", unitCost: 20.70, sellingPrice: 25.00, totalCost: 0.00 },
  { id: 3, name: "Premium Cream Cheese", barcode: "AO3", category: "Add Ons Sinkers", unitCost: 21.50, sellingPrice: 25.00, totalCost: 0.00 },
  { id: 4, name: "Premium Cheese Cake", barcode: "AO4", category: "Add Ons Sinkers", unitCost: 23.90, sellingPrice: 25.00, totalCost: 0.00 },
  { id: 5, name: "Black Boba Pearl", barcode: "AO5", category: "Add Ons Sinkers", unitCost: 7.00, sellingPrice: 15.00, totalCost: 0.00 },
  { id: 6, name: "Mini White Pearl", barcode: "AO6", category: "Add Ons Sinkers", unitCost: 2.56, sellingPrice: 15.00, totalCost: 0.00 },
  { id: 7, name: "Crushed Oreo", barcode: "AO7", category: "Add Ons Sinkers", unitCost: 3.63, sellingPrice: 20.00, totalCost: 0.00 },
  { id: 8, name: "Nata Jelly", barcode: "AO8", category: "Add Ons Sinkers", unitCost: 9.33, sellingPrice: 15.00, totalCost: 0.00 },
  { id: 9, name: "Coffee Jelly", barcode: "AO9", category: "Add Ons Sinkers", unitCost: 12.03, sellingPrice: 15.00, totalCost: 0.00 },
  { id: 10, name: "Mixed Fruit Jelly", barcode: "AO10", category: "Add Ons Sinkers", unitCost: 9.33, sellingPrice: 15.00, totalCost: 0.00 },
  { id: 11, name: "Chia Seeds", barcode: "AO11", category: "Add Ons Sinkers", unitCost: 2.59, sellingPrice: 20.00, totalCost: 0.00 },
  { id: 12, name: "Non Dairy Milk", barcode: "AO12", category: "Add Ons Sinkers", unitCost: 2.50, sellingPrice: 20.00, totalCost: 0.00 },
  { id: 13, name: "Milo", barcode: "AO13", category: "Add Ons Sinkers", unitCost: 3.65, sellingPrice: 20.00, totalCost: 0.00 },
  { id: 14, name: "Whip Cream", barcode: "AO14", category: "Add Ons Sinkers", unitCost: 20.00, sellingPrice: 20.00, totalCost: 0.00 },
  { id: 15, name: "Cheese Mousse", barcode: "AO15", category: "Add Ons Sinkers", unitCost: 5.00, sellingPrice: 25.00, totalCost: 0.00 },
  { id: 16, name: "Coffee Shot", barcode: "AO16", category: "Add Ons Sinkers", unitCost: 4.00, sellingPrice: 20.00, totalCost: 0.00 },
  { id: 17, name: "Sugar Sachet", barcode: "AO17", category: "Add Ons Sinkers", unitCost: 1.32, sellingPrice: 5.00, totalCost: 0.00 },
  { id: 18, name: "Creamer Sachet", barcode: "AO18", category: "Add Ons Sinkers", unitCost: 1.75, sellingPrice: 5.00, totalCost: 0.00 },
  { id: 19, name: "Sticky Rice", barcode: "AO19", category: "Add Ons Sinkers", unitCost: 11.00, sellingPrice: 20.00, totalCost: 0.00 },
  { id: 20, name: "Egg Pudding", barcode: "AO20", category: "Add Ons Sinkers", unitCost: 10.00, sellingPrice: 20.00, totalCost: 0.00 },

  // --- AFFORDA-BOWLS ---
  { id: 21, name: "AFFORD-SIOMAI + RICE", barcode: "AB1", category: "AFFORDA-BOWLS", unitCost: 26.86, sellingPrice: 59.00, totalCost: 0.00 },
  { id: 22, name: "AFFORD-HOTDOG + RICE", barcode: "AB2", category: "AFFORDA-BOWLS", unitCost: 23.49, sellingPrice: 59.00, totalCost: 0.00 },
  { id: 23, name: "AFFORD-CHIC WINGS + RICE", barcode: "AB3", category: "AFFORDA-BOWLS", unitCost: 33.86, sellingPrice: 69.00, totalCost: 0.00 },
  { id: 24, name: "AFFORD-CHIC POPPERS + RICE", barcode: "AB4", category: "AFFORDA-BOWLS", unitCost: 41.89, sellingPrice: 69.00, totalCost: 0.00 },
  { id: 25, name: "AFFORD-SHANGHAI + RICE", barcode: "AB5", category: "AFFORDA-BOWLS", unitCost: 48.72, sellingPrice: 69.00, totalCost: 0.00 },
  { id: 26, name: "AFFORD-CHICK TONKATSU + RICE", barcode: "AB6", category: "AFFORDA-BOWLS", unitCost: 40.86, sellingPrice: 79.00, totalCost: 0.00 },
  { id: 27, name: "AFFORD-LONGGA RICE + EGG", barcode: "AB7", category: "AFFORDA-BOWLS", unitCost: 34.68, sellingPrice: 79.00, totalCost: 0.00 },

  // --- ALA CARTE SNACKS ---
  { id: 28, name: "Chicken Twister Wrap", barcode: "ACS1", category: "ALA CARTE SNACKS", unitCost: 45.00, sellingPrice: 85.00, totalCost: 0.00 },
  { id: 29, name: "Chicken Poppers Snack", barcode: "ACS2", category: "ALA CARTE SNACKS", unitCost: 78.10, sellingPrice: 99.00, totalCost: 0.00 },
  { id: 30, name: "Spaghetti", barcode: "ACS3", category: "ALA CARTE SNACKS", unitCost: 35.00, sellingPrice: 75.00, totalCost: 0.00 },
  { id: 31, name: "Thick Coated Fries", barcode: "ACS4", category: "ALA CARTE SNACKS", unitCost: 37.50, sellingPrice: 99.00, totalCost: 0.00 },
  { id: 32, name: "Cheesy Nachos", barcode: "ACS5", category: "ALA CARTE SNACKS", unitCost: 75.00, sellingPrice: 180.00, totalCost: 0.00 },
  { id: 33, name: "Bottled Mineral Water", barcode: "BTL1", category: "ALA CARTE SNACKS", unitCost: 6.00, sellingPrice: 25.00, totalCost: 0.00 },
  { id: 34, name: "Rice", barcode: "RCE", category: "ALA CARTE SNACKS", unitCost: 5.00, sellingPrice: 20.00, totalCost: 0.00 },

  // --- ALL DAY MEALS (ADM1 - ADM5) ---
  { id: 35, name: "SPICY TAPA ALL DAY MEAL", barcode: "ADM1", category: "ALL DAY MEALS", unitCost: 81.50, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 36, name: "TONKATSU ALL DAY MEAL", barcode: "ADM2", category: "ALL DAY MEALS", unitCost: 80.86, sellingPrice: 120.00, totalCost: 0.00 },
  { id: 37, name: "3PCS CHICK WINGS ALL DAY MEAL", barcode: "ADM3", category: "ALL DAY MEALS", unitCost: 92.50, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 38, name: "LONGGANISA ALL DAY MEAL", barcode: "ADM4", category: "ALL DAY MEALS", unitCost: 58.64, sellingPrice: 100.00, totalCost: 0.00 },
  { id: 39, name: "CHICKEN POPPERS ALL DAY MEAL", barcode: "ADM5", category: "ALL DAY MEALS", unitCost: 78.10, sellingPrice: 135.00, totalCost: 0.00 },

  // --- CARD (CRD1 - CRD2) ---
  { id: 40, name: "LUCKY CARD", barcode: "LC1", category: "CARD", unitCost: 65.00, sellingPrice: 150.00, totalCost: 0.00 },
  { id: 41, name: "LUCKY CARD CHRISTMAS EDITION", barcode: "LCCS", category: "CARD", unitCost: 65.00, sellingPrice: 150.00, totalCost: 0.00 },

  // --- CHEESECAKE MILK TEA (CCMM1 - CCMM12) ---
  { id: 42, name: "OKINAWA M. TEA + C.CAKE", barcode: "CCMM1", category: "CHEESECAKE MILK TEA", unitCost: 58.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 43, name: "CHOC HZELNT + C.CAKE", barcode: "CCMM2", category: "CHEESECAKE MILK TEA", unitCost: 53.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 44, name: "STRAWBERRY M. TEA + C.CAKE", barcode: "CCMM3", category: "CHEESECAKE MILK TEA", unitCost: 49.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 45, name: "SALTED CARAMEL M. TEA + C.CAKE", barcode: "CCMM4", category: "CHEESECAKE MILK TEA", unitCost: 54.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 46, name: "VANILLA M. TEA + C.CAKE", barcode: "CCMM5", category: "CHEESECAKE MILK TEA", unitCost: 56.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 47, name: "TARO M. TEA + C.CAKE", barcode: "CCMM6", category: "CHEESECAKE MILK TEA", unitCost: 55.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 49, name: "MANGO M. TEA + C.CAKE", barcode: "CCMM7", category: "CHEESECAKE MILK TEA", unitCost: 48.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 50, name: "BBERRY M. TEA + C.CAKE", barcode: "CCMM8", category: "CHEESECAKE MILK TEA", unitCost: 49.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 51, name: "MATCHA M. TEA + C.CAKE", barcode: "CCMM9", category: "CHEESECAKE MILK TEA", unitCost: 60.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 52, name: "COOKIES & CREAM M. TEA + C.CAKE", barcode: "CCMM10", category: "CHEESECAKE MILK TEA", unitCost: 51.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 53, name: "BELGIAN M. TEA + C.CAKE", barcode: "CCMM11", category: "CHEESECAKE MILK TEA", unitCost: 53.00, sellingPrice: 115.00, totalCost: 0.00 },

  // --- CHEESECAKE MILK TEA LARGE (CCML1 - CCML12) ---
  { id: 54, name: "OKINAWA M. TEA + C.CAKE (L)", barcode: "CCML1", category: "CHEESECAKE MILK TEA", unitCost: 71.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 55, name: "CHOC HZELNT + C.CAKE (L)", barcode: "CCML2", category: "CHEESECAKE MILK TEA", unitCost: 64.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 56, name: "STRAWBERRY M. TEA + C.CAKE (L)", barcode: "CCML3", category: "CHEESECAKE MILK TEA", unitCost: 61.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 57, name: "SALTED CARAMEL M. TEA + C.CAKE (L)", barcode: "CCML4", category: "CHEESECAKE MILK TEA", unitCost: 61.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 58, name: "VANILLA M. TEA + C.CAKE (L)", barcode: "CCML5", category: "CHEESECAKE MILK TEA", unitCost: 71.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 59, name: "TARO M. TEA + C.CAKE (L)", barcode: "CCML6", category: "CHEESECAKE MILK TEA", unitCost: 68.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 61, name: "MANGO M. TEA + C.CAKE (L)", barcode: "CCML7", category: "CHEESECAKE MILK TEA", unitCost: 60.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 62, name: "BBERRY M. TEA + C.CAKE (L)", barcode: "CCML8", category: "CHEESECAKE MILK TEA", unitCost: 61.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 63, name: "MATCHA M. TEA + C.CAKE (L)", barcode: "CCML9", category: "CHEESECAKE MILK TEA", unitCost: 73.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 64, name: "COOKIES & CREAM M. TEA + C.CAKE (L)", barcode: "CCML10", category: "CHEESECAKE MILK TEA", unitCost: 63.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 65, name: "BELGIAN M. TEA + C.CAKE (L)", barcode: "CCML11", category: "CHEESECAKE MILK TEA", unitCost: 65.00, sellingPrice: 135.00, totalCost: 0.00 },

  // 3 PCS (3CW1 - 3CW6) - ₱100.00
  { id: 66, name: "BUFFALO (3PCS)", barcode: "3CW1", category: "CHICKEN WINGS", unitCost: 67.00, sellingPrice: 100.00, totalCost: 0.00 },
  { id: 67, name: "GARLIC PARMESAN (3PCS)", barcode: "3CW2", category: "CHICKEN WINGS", unitCost: 67.00, sellingPrice: 100.00, totalCost: 0.00 },
  { id: 68, name: "SWEET CHILI (3PCS)", barcode: "3CW3", category: "CHICKEN WINGS", unitCost: 67.00, sellingPrice: 100.00, totalCost: 0.00 },
  { id: 69, name: "TERIYAKI (3PCS)", barcode: "3CW4", category: "CHICKEN WINGS", unitCost: 67.00, sellingPrice: 100.00, totalCost: 0.00 },
  { id: 70, name: "SOY GARLIC (3PCS)", barcode: "3CW5", category: "CHICKEN WINGS", unitCost: 67.00, sellingPrice: 100.00, totalCost: 0.00 },
  { id: 71, name: "SALTED EGG (3PCS)", barcode: "3CW6", category: "CHICKEN WINGS", unitCost: 67.00, sellingPrice: 125.55, totalCost: 89.25 },

  // 4 PCS (4CW1 - 4CW6) - ₱120.00
  { id: 72, name: "BUFFALO (4PCS)", barcode: "4CW1", category: "CHICKEN WINGS", unitCost: 89.00, sellingPrice: 120.00, totalCost: 0.00 },
  { id: 73, name: "GARLIC PARMESAN (4PCS)", barcode: "4CW2", category: "CHICKEN WINGS", unitCost: 89.00, sellingPrice: 120.00, totalCost: 0.00 },
  { id: 74, name: "SWEET CHILI (4PCS)", barcode: "4CW3", category: "CHICKEN WINGS", unitCost: 89.00, sellingPrice: 120.00, totalCost: 0.00 },
  { id: 75, name: "TERIYAKI (4PCS)", barcode: "4CW4", category: "CHICKEN WINGS", unitCost: 89.00, sellingPrice: 120.00, totalCost: 0.00 },
  { id: 76, name: "SOY GARLIC (4PCS)", barcode: "4CW5", category: "CHICKEN WINGS", unitCost: 89.00, sellingPrice: 120.00, totalCost: 0.00 },
  { id: 77, name: "SALTED EGG (4PCS)", barcode: "4CW6", category: "CHICKEN WINGS", unitCost: 89.00, sellingPrice: 120.00, totalCost: 0.00 },

  // 6 PCS (6CW1 - 6CW6) - ₱195.00
  { id: 78, name: "BUFFALO (6PCS)", barcode: "6CW1", category: "CHICKEN WINGS", unitCost: 133.00, sellingPrice: 195.00, totalCost: 0.00 },
  { id: 79, name: "GARLIC PARMESAN (6PCS)", barcode: "6CW2", category: "CHICKEN WINGS", unitCost: 133.00, sellingPrice: 195.00, totalCost: 0.00 },
  { id: 80, name: "SWEET CHILI (6PCS)", barcode: "6CW3", category: "CHICKEN WINGS", unitCost: 133.00, sellingPrice: 195.00, totalCost: 0.00 },
  { id: 81, name: "TERIYAKI (6PCS)", barcode: "6CW4", category: "CHICKEN WINGS", unitCost: 133.00, sellingPrice: 195.00, totalCost: 0.00 },
  { id: 82, name: "SOY GARLIC (6PCS)", barcode: "6CW5", category: "CHICKEN WINGS", unitCost: 133.00, sellingPrice: 195.00, totalCost: 0.00 },
  { id: 83, name: "SALTED EGG (6PCS)", barcode: "6CW6", category: "CHICKEN WINGS", unitCost: 133.00, sellingPrice: 195.00, totalCost: 0.00 },

  // 12 PCS (12CW1 - 12CW6) - ₱390.00
  { id: 84, name: "BUFFALO (12PCS)", barcode: "12CW1", category: "CHICKEN WINGS", unitCost: 267.00, sellingPrice: 390.00, totalCost: 0.00 },
  { id: 85, name: "GARLIC PARMESAN (12PCS)", barcode: "12CW2", category: "CHICKEN WINGS", unitCost: 267.00, sellingPrice: 390.00, totalCost: 0.00 },
  { id: 86, name: "SWEET CHILI (12PCS)", barcode: "12CW3", category: "CHICKEN WINGS", unitCost: 267.00, sellingPrice: 390.00, totalCost: 0.00 },
  { id: 87, name: "TERIYAKI (12PCS)", barcode: "12CW4", category: "CHICKEN WINGS", unitCost: 267.00, sellingPrice: 390.00, totalCost: 0.00 },
  { id: 88, name: "SOY GARLIC (12PCS)", barcode: "12CW5", category: "CHICKEN WINGS", unitCost: 267.00, sellingPrice: 390.00, totalCost: 0.00 },
  { id: 89, name: "SALTED EGG (12PCS)", barcode: "12CW6", category: "CHICKEN WINGS", unitCost: 267.00, sellingPrice: 390.00, totalCost: 0.00 },

  // --- CLASSIC MILKTEA MEDIUM (CMM1 - CMM11) ---
  { id: 90, name: "CLASSIC M. TEA", barcode: "CMM1", category: "CLASSIC MILKTEA", unitCost: 26.00, sellingPrice: 70.00, totalCost: 0.00 },
  { id: 91, name: "CLASSIC PEARL M. TEA", barcode: "CMM2", category: "CLASSIC MILKTEA", unitCost: 32.00, sellingPrice: 70.00, totalCost: 0.00 },
  { id: 92, name: "CLASSIC BUDDY M. TEA", barcode: "CMM3", category: "CLASSIC MILKTEA", unitCost: 41.00, sellingPrice: 105.00, totalCost: 0.00 },
  { id: 93, name: "CLASSIC DUO M. TEA", barcode: "CMM4", category: "CLASSIC MILKTEA", unitCost: 34.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 94, name: "CLASSIC CRM. CHEESE", barcode: "CMM5", category: "CLASSIC MILKTEA", unitCost: 47.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 95, name: "CLASSIC C. CAKE M. TEA", barcode: "CMM6", category: "CLASSIC MILKTEA", unitCost: 47.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 96, name: "CLASSIC RSC M. TEA", barcode: "CMM7", category: "CLASSIC MILKTEA", unitCost: 45.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 97, name: "CLASSIC M. TEA + OREO", barcode: "CMM8", category: "CLASSIC MILKTEA", unitCost: 28.00, sellingPrice: 85.00, totalCost: 0.00 },
  { id: 98, name: "CLASSIC M. TEA + PUDDING", barcode: "CMM9", category: "CLASSIC MILKTEA", unitCost: 35.00, sellingPrice: 95.00, totalCost: 0.00 },
  { id: 99, name: "CL PUDDING + B.PEARL", barcode: "CMM10", category: "CLASSIC MILKTEA", unitCost: 35.00, sellingPrice: 110.00, totalCost: 0.00 },
  { id: 100, name: "CL PUDDING + MWP", barcode: "CMM11", category: "CLASSIC MILKTEA", unitCost: 35.00, sellingPrice: 110.00, totalCost: 0.00 },

  // --- CLASSIC MILKTEA LARGE (CML1 - CML11) ---
  { id: 101, name: "CLASSIC M. TEA (L)", barcode: "CML1", category: "CLASSIC MILKTEA", unitCost: 35.00, sellingPrice: 90.00, totalCost: 0.00 },
  { id: 102, name: "CLASSIC PEARL M. TEA (L)", barcode: "CML2", category: "CLASSIC MILKTEA", unitCost: 38.00, sellingPrice: 90.00, totalCost: 0.00 },
  { id: 103, name: "CLASSIC BUDDY M. TEA (L)", barcode: "CML3", category: "CLASSIC MILKTEA", unitCost: 49.00, sellingPrice: 125.00, totalCost: 0.00 },
  { id: 104, name: "CLASSIC DUO M. TEA (L)", barcode: "CML4", category: "CLASSIC MILKTEA", unitCost: 41.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 105, name: "CLASSIC CRM. CHEESE (L)", barcode: "CML5", category: "CLASSIC MILKTEA", unitCost: 57.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 106, name: "CLASSIC C. CAKE M. TEA (L)", barcode: "CML6", category: "CLASSIC MILKTEA", unitCost: 57.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 107, name: "CLASSIC RSC M. TEA (L)", barcode: "CML7", category: "CLASSIC MILKTEA", unitCost: 55.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 108, name: "CLASSIC M. TEA + OREO (L)", barcode: "CML8", category: "CLASSIC MILKTEA", unitCost: 34.00, sellingPrice: 105.00, totalCost: 0.00 },
  { id: 109, name: "CLASSIC M. TEA + PUDDING (L)", barcode: "CML9", category: "CLASSIC MILKTEA", unitCost: 35.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 110, name: "CL PUDDING + B.PEARL (L)", barcode: "CML10", category: "CLASSIC MILKTEA", unitCost: 40.00, sellingPrice: 130.00, totalCost: 0.00 },
  { id: 111, name: "CL PUDDING + MWP (L)", barcode: "CML11", category: "CLASSIC MILKTEA", unitCost: 40.00, sellingPrice: 130.00, totalCost: 0.00 },

  // --- COFFEE FRAPPE MEDIUM (CFM1 - CFM5) ---
  { id: 112, name: "MOCHA FRP", barcode: "CFM1", category: "COFFEE FRAPPE", unitCost: 56.00, sellingPrice: 125.00, totalCost: 0.00 },
  { id: 113, name: "VANILLA FRP", barcode: "CFM2", category: "COFFEE FRAPPE", unitCost: 59.00, sellingPrice: 125.00, totalCost: 0.00 },
  { id: 114, name: "JAVA CHIP FRP", barcode: "CFM3", category: "COFFEE FRAPPE", unitCost: 56.00, sellingPrice: 125.00, totalCost: 0.00 },
  { id: 115, name: "TOFFEE CARAMEL FRP", barcode: "CFM4", category: "COFFEE FRAPPE", unitCost: 59.00, sellingPrice: 125.00, totalCost: 0.00 },
  { id: 116, name: "CARAMEL MACCHIATO FRP", barcode: "CFM5", category: "COFFEE FRAPPE", unitCost: 56.00, sellingPrice: 125.00, totalCost: 0.00 },

  // --- COFFEE FRAPPE LARGE (CFL1 - CFL5) ---
  { id: 117, name: "MOCHA FRP (L)", barcode: "CFL1", category: "COFFEE FRAPPE", unitCost: 59.00, sellingPrice: 145.00, totalCost: 0.00 },
  { id: 118, name: "VANILLA FRP (L)", barcode: "CFL2", category: "COFFEE FRAPPE", unitCost: 63.00, sellingPrice: 145.00, totalCost: 0.00 },
  { id: 119, name: "JAVA CHIP FRP (L)", barcode: "CFL3", category: "COFFEE FRAPPE", unitCost: 63.00, sellingPrice: 145.00, totalCost: 0.00 },
  { id: 120, name: "TOFFEE CARAMEL FRP (L)", barcode: "CFL4", category: "COFFEE FRAPPE", unitCost: 63.00, sellingPrice: 145.00, totalCost: 0.00 },
  { id: 121, name: "CARAMEL MACCHIATO FRP (L)", barcode: "CFL5", category: "COFFEE FRAPPE", unitCost: 60.00, sellingPrice: 145.00, totalCost: 0.00 },

  //-- COMBO MEALS (COM1 - COM12) ---
  { id: 122, name: "THICK COATED FRIES & CLASSIC PEARL (L)", barcode: "COM1", category: "COMBO MEALS -> LARGE", unitCost: 72.41, sellingPrice: 194.00, totalCost: 0.00 },
  { id: 123, name: "CHICKEN TWIST & CLASSIC PEARL (L)", barcode: "COM3", category: "COMBO MEALS -> LARGE", unitCost: 79.91, sellingPrice: 180.00, totalCost: 0.00 },
  { id: 124, name: "SPAGHETTI & CLASSIC PEARL (L)", barcode: "COM5", category: "COMBO MEALS -> LARGE", unitCost: 69.91, sellingPrice: 170.00, totalCost: 0.00 },
  { id: 125, name: "3 PC CHICKEN WINGS & CLASSIC PEARL (L)", barcode: "COM7", category: "COMBO MEALS -> LARGE", unitCost: 101.66, sellingPrice: 185.00, totalCost: 0.00 },
  { id: 126, name: "CHEESY NACHOS & CLASSIC PEARL (L)", barcode: "COM9", category: "COMBO MEALS -> LARGE", unitCost: 125.31, sellingPrice: 265.00, totalCost: 0.00 },
  { id: 127, name: "CHICKEN POPPERS & CLASSIC PEARL (L)", barcode: "COM11", category: "COMBO MEALS -> LARGE", unitCost: 93.01, sellingPrice: 194.00, totalCost: 0.00 },
  { id: 128, name: "THICK COATED FRIES & CLASSIC PEARL (M)", barcode: "COM2", category: "COMBO MEALS -> MEDIUM", unitCost: 65.61, sellingPrice: 174.00, totalCost: 0.00 },
  { id: 129, name: "CHICKEN TWIST & CLASSIC PEARL (M)", barcode: "COM4", category: "COMBO MEALS -> MEDIUM", unitCost: 73.11, sellingPrice: 160.00, totalCost: 0.00 },
  { id: 130, name: "SPAGHETTI & CLASSIC PEARL (M)", barcode: "COM6", category: "COMBO MEALS -> MEDIUM", unitCost: 63.11, sellingPrice: 150.00, totalCost: 0.00 },
  { id: 131, name: "3 PC CHICKEN WINGS & CLASSIC PEARL (M)", barcode: "COM8", category: "COMBO MEALS -> MEDIUM", unitCost: 94.86, sellingPrice: 170.00, totalCost: 0.00 },
  { id: 132, name: "CHICKEN POPPERS & CLASSIC PEARL (M)", barcode: "COM12", category: "COMBO MEALS -> MEDIUM", unitCost: 82.21, sellingPrice: 174.00, totalCost: 0.00 },
  
  //-- CREAM CHEESE M. TEA --//
  { id: 134, name: "BELGIAN CHOCO M.TEA + CRM CHEESE", barcode: "CRMM1", category: "CREAM CHEESE M. TEA", unitCost: 51.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 135, name: "BLUEBERRY + CRM CHEESE", barcode: "BBCC2", category: "CREAM CHEESE M. TEA", unitCost: 47.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 136, name: "CHOCO HAZELNUT + CRM CHEESE", barcode: "CHCML4", category: "CREAM CHEESE M. TEA", unitCost: 50.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 137, name: "HERSHEYS M.TEA + CRM CHEESE", barcode: "CRMM3", category: "CREAM CHEESE M. TEA", unitCost: 52.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 138, name: "MATCHA M.TEA + CRM CHEESE", barcode: "CRMM8", category: "CREAM CHEESE M. TEA", unitCost: 57.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 139, name: "OKINAWA M.TEA + CRM CHEESE", barcode: "CRMM6", category: "CREAM CHEESE M. TEA", unitCost: 56.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 140, name: "RED VELVET M.TEA + CRM CHEESE", barcode: "CRMM2", category: "CREAM CHEESE M. TEA", unitCost: 52.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 141, name: "SALTED CARAMEL M.TEA + CRM CHEESE", barcode: "CCRM4", category: "CREAM CHEESE M. TEA", unitCost: 52.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 142, name: "TARO M.TEA + CRM CHEESE", barcode: "CRMM7", category: "CREAM CHEESE M. TEA", unitCost: 53.00, sellingPrice: 115.00, totalCost: 0.00 },
  { id: 143, name: "VANILLA M.TEA + CRM CHEESE", barcode: "CRMM5", category: "CREAM CHEESE M. TEA", unitCost: 54.00, sellingPrice: 115.00, totalCost: 0.00 },

  { id: 144, name: "BELGIAN CHOCO M.TEA + CRM CHEESE (L)", barcode: "CRML1", category: "CREAM CHEESE M. TEA -> LARGE", unitCost: 63.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 145, name: "BLUEBERRY + CRM CHEESE (L)", barcode: "BBCC1", category: "CREAM CHEESE M. TEA -> LARGE", unitCost: 59.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 146, name: "CHOCO HAZELNUT + CRM CHEESE (L)", barcode: "CCML2", category: "CREAM CHEESE M. TEA -> LARGE", unitCost: 62.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 147, name: "HERSHEYS M.TEA + CRM CHEESE (L)", barcode: "CRML3", category: "CREAM CHEESE M. TEA -> LARGE", unitCost: 64.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 148, name: "MATCHA M.TEA + CRM CHEESE (L)", barcode: "CRML8", category: "CREAM CHEESE M. TEA -> LARGE", unitCost: 71.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 149, name: "OKINAWA M.TEA + CRM CHEESE (L)", barcode: "CRML6", category: "CREAM CHEESE M. TEA -> LARGE", unitCost: 69.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 150, name: "RED VELVET M.TEA + CRM CHEESE (L)", barcode: "CRML2", category: "CREAM CHEESE M. TEA -> LARGE", unitCost: 64.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 150, name: "SALTED CARAMEL M.TEA + CRM CHEESE (L)", barcode: "CRML4", category: "CREAM CHEESE M. TEA -> LARGE", unitCost: 64.00, sellingPrice: 135.55, totalCost: 0.00 },
  { id: 152, name: "TARO M.TEA + CRM CHEESE (L)", barcode: "CRML7", category: "CREAM CHEESE M. TEA -> LARGE", unitCost: 65.00, sellingPrice: 135.00, totalCost: 0.00 },
  { id: 153, name: "VANILLA M.TEA + CRM CHEESE (L)", barcode: "CRML5", category: "CREAM CHEESE M. TEA -> LARGE", unitCost: 68.00, sellingPrice: 135.55, totalCost: 0.00 },

  //-- FLAVORED MILK TEA --// 
  { id: 154, name: "MATCHA M.TEA (L)", barcode: "FLML1", category: "FLAVORED MILK TEA -> LARGE", unitCost: 49.00, sellingPrice: 105.00, totalCost: 0.00 },
  { id: 155, name: "TARO M.TEA (L)", barcode: "FLML2", category: "FLAVORED MILK TEA -> LARGE", unitCost: 44.00, sellingPrice: 105.00, totalCost: 0.00 },
  { id: 156, name: "SALTED CARAMERL M.TEA (L)", barcode: "FLML3", category: "FLAVORED MILK TEA -> LARGE", unitCost: 42.00, sellingPrice: 105.00, totalCost: 0.00 },
  { id: 157, name: "WINTERMELON M.TEA (L)", barcode: "FLML4", category: "FLAVORED MILK TEA -> LARGE", unitCost: 38.00, sellingPrice: 105.00, totalCost: 0.00 },
  { id: 158, name: "JAVA CHIP M.TEA (L)", barcode: "FLML5", category: "FLAVORED MILK TEA -> LARGE", unitCost: 42.00, sellingPrice: 105.00, totalCost: 0.00 },
  { id: 159, name: "OKINAWA M.TEA (L)", barcode: "FLML6", category: "FLAVORED MILK TEA -> LARGE", unitCost: 47.00, sellingPrice: 105.00, totalCost: 0.00 },
  { id: 160, name: "VANILLA M.TEA (L)", barcode: "FLML7", category: "FLAVORED MILK TEA -> LARGE", unitCost: 47.00, sellingPrice: 105.00, totalCost: 0.00 },
  { id: 161, name: "HERSHEYS CHOCO M.TEA (L)", barcode: "FLML8", category: "FLAVORED MILK TEA -> LARGE", unitCost: 43.00, sellingPrice: 105.00, totalCost: 0.00 },
  { id: 162, name: "MOCHI M.TEA (L)", barcode: "FLML9", category: "FLAVORED MILK TEA -> LARGE", unitCost: 39.00, sellingPrice: 105.00, totalCost: 0.00 },
  { id: 163, name: "BELGIAN CHOCO M.TEA (L)", barcode: "FLML10", category: "FLAVORED MILK TEA -> LARGE", unitCost: 41.00, sellingPrice: 105.00, totalCost: 0.00 },
  { id: 164, name: "MANGO M.TEA (L)", barcode: "FLML11", category: "FLAVORED MILK TEA -> LARGE", unitCost: 36.00, sellingPrice: 105.00, totalCost: 0.00 },
  { id: 165, name: "AVOCADO M.TEA (L)", barcode: "FLML12", category: "FLAVORED MILK TEA -> LARGE", unitCost: 40.00, sellingPrice: 105.00, totalCost: 0.00 },
  { id: 166, name: "RED VELVET M.TEA (L)", barcode: "FLML13", category: "FLAVORED MILK TEA -> LARGE", unitCost: 42.00, sellingPrice: 105.00, totalCost: 0.00 },
  { id: 167, name: "CARAMEL MACCH M.TEA (L)", barcode: "FLML14", category: "FLAVORED MILK TEA -> LARGE", unitCost: 40.00, sellingPrice: 105.00, totalCost: 0.00 },
  { id: 168, name: "COOKIES & CREAM M.TEA (L)", barcode: "FLML15", category: "FLAVORED MILK TEA -> LARGE", unitCost: 39.00, sellingPrice: 105.00, totalCost: 0.00 },
  { id: 169, name: "STRAWBERRY M.TEA (L)", barcode: "FLML16", category: "FLAVORED MILK TEA -> LARGE", unitCost: 37.00, sellingPrice: 105.00, totalCost: 0.00 },
  { id: 170, name: "BLUEBERRY M.TEA (L)", barcode: "FLML17", category: "FLAVORED MILK TEA -> LARGE", unitCost: 37.00, sellingPrice: 105.00, totalCost: 0.00 },
  { id: 171, name: "DARK CHOCOLATE M.TEA (L)", barcode: "FLML18", category: "FLAVORED MILK TEA -> LARGE", unitCost: 42.00, sellingPrice: 105.00, totalCost: 0.00 },
  { id: 172, name: "CHOCO HAZELNUT M.TEA (L)", barcode: "FLML19", category: "FLAVORED MILK TEA -> LARGE", unitCost: 40.00, sellingPrice: 105.00, totalCost: 0.00 },
  { id: 173, name: "TOFFEE CARAMEL M.TEA (L)", barcode: "FLML20", category: "FLAVORED MILK TEA -> LARGE", unitCost: 42.00, sellingPrice: 105.00, totalCost: 0.00 },

  { id: 154, name: "MATCHA M.TEA (M)", barcode: "FLMM1", category: "FLAVORED MILK TEA -> MEDIUM", unitCost: 40.00, sellingPrice: 85.00, totalCost: 0.00 },
  { id: 155, name: "TARO M.TEA (M)", barcode: "FLMM2", category: "FLAVORED MILK TEA -> MEDIUM", unitCost: 36.00, sellingPrice: 85.00, totalCost: 0.00 },
  { id: 156, name: "SALTED CARAMERL M.TEA (M)", barcode: "FLMM3", category: "FLAVORED MILK TEA -> MEDIUM", unitCost: 34.00, sellingPrice: 85.00, totalCost: 0.00 },
  { id: 157, name: "WINTERMELON M.TEA (M)", barcode: "FLMM4", category: "FLAVORED MILK TEA -> MEDIUM", unitCost: 31.00, sellingPrice: 85.00, totalCost: 0.00 },
  { id: 158, name: "JAVA CHIP M.TEA (M)", barcode: "FLMM5", category: "FLAVORED MILK TEA -> MEDIUM", unitCost: 34.00, sellingPrice: 85.00, totalCost: 0.00 },
  { id: 159, name: "OKINAWA M.TEA (M)", barcode: "FLMM6", category: "FLAVORED MILK TEA -> MEDIUM", unitCost: 39.00, sellingPrice: 85.55, totalCost: 0.00 },
  { id: 160, name: "VANILLA M.TEA (M)", barcode: "FLMM7", category: "FLAVORED MILK TEA -> MEDIUM", unitCost: 37.00, sellingPrice: 85.55, totalCost: 0.00 },
  { id: 161, name: "HERSHEYS CHOCO M.TEA (M)", barcode: "FLMM8", category: "FLAVORED MILK TEA -> MEDIUM", unitCost: 35.00, sellingPrice: 85.55, totalCost: 0.00 },
  { id: 162, name: "MOCHI M.TEA (M)", barcode: "FLMM9", category: "FLAVORED MILK TEA -> MEDIUM", unitCost: 32.00, sellingPrice: 85.55, totalCost: 0.00 },
  { id: 163, name: "BELGIAN CHOCO M.TEA (M)", barcode: "FLMM10", category: "FLAVORED MILK TEA -> MEDIUM", unitCost: 34.00, sellingPrice: 85.55, totalCost: 0.00 },
  { id: 164, name: "MANGO M.TEA (M)", barcode: "FLMM11", category: "FLAVORED MILK TEA -> MEDIUM", unitCost: 29.00, sellingPrice: 85.00, totalCost: 0.00 },
  { id: 165, name: "AVOCADO M.TEA (M)", barcode: "FLMM12", category: "FLAVORED MILK TEA -> MEDIUM", unitCost: 33.00, sellingPrice: 85.00, totalCost: 0.00 },
  { id: 166, name: "RED VELVET M.TEA (M)", barcode:"FLMM13", category:"FLAVORED MILK TEA -> MEDIUM", unitCost : 34.00 , sellingPrice :85.00 , totalCost :0.00},
  { id: 167, name: "CARAMEL MACCH M.TEA (M)", barcode: "FLMM14", category: "FLAVORED MILK TEA -> MEDIUM", unitCost: 32.00, sellingPrice: 85.00, totalCost: 0.00 },
  { id: 168, name: "COOKIES & CREAM M.TEA (M)", barcode: "FLMM15", category: "FLAVORED MILK TEA -> MEDIUM", unitCost: 32.00, sellingPrice: 85.00, totalCost: 0.00 },
  { id: 169, name: "STRAWBERRY M.TEA (M)", barcode: "FLMM16", category: "FLAVORED MILK TEA -> MEDIUM", unitCost: 30.00, sellingPrice: 85.00, totalCost: 0.00 },
  { id: 170, name: "BLUEBERRY M.TEA (M)", barcode: "FLMM17", category: "FLAVORED MILK TEA -> MEDIUM", unitCost: 30.00, sellingPrice: 85.00, totalCost: 0.00 },
  { id: 171, name: "DARK CHOCOLATE M.TEA (M)", barcode: "FLMM18", category: "FLAVORED MILK TEA -> MEDIUM", unitCost: 34.00, sellingPrice: 85.00, totalCost: 0.00 },
  { id: 172, name: "CHOCO HAZELNUT M.TEA (M)", barcode:"FLMM19", category:"FLAVORED MILK TEA -> MEDIUM", unitCost :33.00 , sellingPrice :85.00 , totalCost :0.00},
  { id: 173, name: "TOFFEE CARAMEL M.TEA (M)", barcode: "FLMM20", category: "FLAVORED MILK TEA -> MEDIUM", unitCost: 34.00, sellingPrice: 85.00, totalCost: 0.00 },
  
//--FP COFFEE BUNDLES --//

  { ID: 174, name: "TOF. CARAMEL ICED COFFEE (L) + DK ROAST COFFEE(L)", barcode: "COF1", category: "FP COFFEE BUNDLE", unitCost: 76.00, sellingPrice: 154.00, totalCost: 0.00 },
  { ID: 175, name: "VANILLA ICED COFFEE (L) + J.CHIP COFFEE FRP(L)", barcode: "COF2", category: "FP COFFEE BUNDLE", unitCost: 108.00, sellingPrice: 250.00, totalCost: 0.00 },

  //-- FP/GF GER 2 CLASSIC MILK TEA BUNDLE --//
  { ID: 176, name: "2 CL BUDDY (L)", barcode: "1M", category: "FP/GF GER 2 CLASSIC", unitCost: 97.00, sellingPrice: 250.00, totalCost: 0.00 },
  { ID: 177, name: "2 CL PEARL M. TEA  (L)", barcode: "2M", category: "FP/GF GER 2 CLASSIC", unitCost: 76.00, sellingPrice: 210.00, totalCost: 0.00 },
  { ID: 178, name: "2 CL DUO (L)", barcode: "GC1", category: "FP/GF GER 2 CLASSIC", unitCost: 81.00, sellingPrice: 250.00, totalCost: 0.00 },
  { ID: 179, name: "2 CLASSIC RSC (L)", barcode: "GC2", category: "FP/GF GER 2 CLASSIC", unitCost: 109.00, sellingPrice: 270.00, totalCost: 0.00 },
  { ID: 180, name: "2 PUDDING M.TEA (L)", barcode: "GC3", category: "FP/GF GER 2 CLASSIC", unitCost: 82.00, sellingPrice: 230.00, totalCost: 0.00 },

  //-- FRAPPE SERIES --//
  { ID: 181, name: "BELGIAN CHOCO. FRAPPE", barcode: "FSM2", category: "FRAPPE SERIES -> MEDIUM ", unitCost: 54.00, sellingPrice: 110.00, totalCost: 0.00 },
  { ID: 182, name: "CHOCO. HAZELNUT", barcode: "FSM5", category: "FRAPPE SERIES -> MEDIUM ", unitCost: 51.00, sellingPrice: 110.00, totalCost: 0.00 },
  { ID: 183, name: "COOKIES & CREAM FRAPPE", barcode: "FSM8", category: "FRAPPE SERIES -> MEDIUM ", unitCost: 49.00, sellingPrice: 110.00, totalCost: 0.00 },
  { ID: 184, name: "DARK CHOCOLATE FRAPPE", barcode: "FSM7", category: "FRAPPE SERIES -> MEDIUM ", unitCost: 53.00, sellingPrice: 110.00, totalCost: 0.00 },
  { ID: 185, name: "HERSHEYS FRAPPE", barcode: "HS2", category: "FRAPPE SERIES -> MEDIUM ", unitCost: 53.00, sellingPrice: 110.00, totalCost: 0.00 },
  { ID: 186, name: "RED VELVET FRAPPE", barcode: "FSM3", category: "FRAPPE SERIES -> MEDIUM ", unitCost: 55.00, sellingPrice: 110.00, totalCost: 0.00 },
  { ID: 187, name: "SALTED CARAMEL FRAPPE", barcode: "FSM6", category: "FRAPPE SERIES -> MEDIUM ", unitCost: 53.00, sellingPrice: 110.00, totalCost: 0.00 },
  { ID: 188, name: "TARO FRAPPE", barcode: "FSM1", category: "FRAPPE SERIES -> MEDIUM ", unitCost: 57.00, sellingPrice: 110.00, totalCost: 0.00 },

  { ID: 189, name: "BELGIAN CHOCO. FRAPPE (L)", barcode: "FSL3", category: "FRAPPE SERIES -> LARGE ", unitCost: 61.00, sellingPrice: 130.00, totalCost: 0.00 },
  { ID: 190, name: "CHOCO. HAZELNUT (L)", barcode: "FSL5", category: "FRAPPE SERIES -> LARGE ", unitCost: 56.00, sellingPrice: 130.00, totalCost: 0.00 },
  { ID: 191, name: "COOKIES & CREAM FRAPPE (L)", barcode: "FSL8", category: "FRAPPE SERIES -> LARGE ", unitCost: 54.00, sellingPrice: 130.00, totalCost: 0.00 },
  { ID: 192, name: "DARK CHOCOLATE FRAPPE (L)", barcode: "FSL7", category: "FRAPPE SERIES -> LARGE ", unitCost: 59.00, sellingPrice: 130.00, totalCost: 0.00 },
  { ID: 193, name: "HERSHEYS FRAPPE (L)", barcode: "HS1", category: "FRAPPE SERIES -> LARGE ", unitCost: 59.00, sellingPrice: 130.00, totalCost: 0.00 },
  { ID: 194, name: "RED VELVET FRAPPE (L)", barcode: "FSL3", category: "FRAPPE SERIES -> LARGE ", unitCost: 61.00, sellingPrice: 130.00, totalCost: 0.00 },
  { ID: 195, name: "SALTED CARAMEL FRAPPE (L)", barcode: "FSL6", category: "FRAPPE SERIES -> LARGE ", unitCost: 59.00, sellingPrice: 130.00, totalCost: 0.00 },
  { ID: 196, name: "TARO FRAPPE (L)", barcode: "FSL1", category: "FRAPPE SERIES -> LARGE ", unitCost: 63.00, sellingPrice: 130.00, totalCost: 0.00 },
];

  
function MenuList() {
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
                className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10" />
            </div>

            {/* Category */}
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Category</label>
              <input
                type="text"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10" />
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
}

export default MenuList;