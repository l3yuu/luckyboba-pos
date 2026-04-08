/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOfflineQueue } from '../hooks/useOfflineQueue'
import OfflineQueueBanner from '../components/Cashier/SalesOrderComponents/OfflineQueueBanner'

import {
  type MenuItem, type Category, type CartItem,
  type Bundle, type BundleComponentCustomization,
} from '../types/index';
import { useToast }  from '../hooks/useToast';
import { useAuth }   from '../hooks/useAuth';
import api           from '../services/api';
import { ChevronRight } from 'lucide-react';

import {
  generateORNumber,
  generateQueueNumber,
  generateTerminalNumber,
  getItemSurcharge,
  DrinkIcon,
} from '../components/Cashier/SalesOrderComponents/shared'

import { Header, MenuArea, CartSidebar } from '../components/Cashier/SalesOrderComponents/layout'

import {
  CartItemEditModal,
  ItemSelectionModal,
  BundleModal,
  ComboDrinkModal,
  ConfirmOrderModal,
  CustomerNameModal,
  SuccessModal,
  AddOnModalShell,
  MixAndMatchDrinkModal,
  type ItemPaxAssignments,
} from '../components/Cashier/SalesOrderComponents/modals'

import { ReceiptPrint, KitchenPrint, StickerPrint } from '../components/Cashier/SalesOrderComponents/print'

import OrderTypeModal from '../components/Cashier/OrderTypeModal'

// ── Utility ───────────────────────────────────────────────────────────────────
const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d

// ── Local type ────────────────────────────────────────────────────────────────
interface Discount {
  id: number
  name: string
  amount: number
  type: string
  status: 'ON' | 'OFF'
}

// ── Component ─────────────────────────────────────────────────────────────────
const SalesOrder = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { user } = useAuth()
  const { enqueue, queueCount, isSyncing, queue, syncNow, remove } = useOfflineQueue()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  const branchId = user?.branch_id ?? null
  const branchName = user?.branch_name ?? localStorage.getItem('lucky_boba_user_branch') ?? 'Main Branch'
  const [vatType, setVatType] = useState<'vat' | 'non_vat'>(
    () => (localStorage.getItem('lucky_boba_user_branch_vat') ?? 'vat') as 'vat' | 'non_vat'
  )

  const handleNavClick = (label: string) => {
    if (label !== 'Home') return
    if (user?.role === 'cashier') navigate('/cashier')
    else if (user?.role === 'branch_manager') navigate('/branch-manager')
    else navigate('/dashboard')
  }

  // ── State ───────────────────────────────────────────────────────────────────

  const [activeCategoryGroup, setActiveCategoryGroup] = useState<string | null>(null);


  const [branchDetails, setBranchDetails] = useState<{
  brand?: string; companyName?: string; storeAddress?: string;
  vatRegTin?: string; minNumber?: string; serialNumber?: string;
  owner_name?: string;
}>({});
  const [orderType, setOrderType] = useState<'dine-in' | 'take-out' | 'delivery' | null>(null);
  const [cashierName, setCashierName] = useState<string>(() =>
    localStorage.getItem('lucky_boba_user_name') ?? 'Admin'
  );
  const [currentDate, setCurrentDate] = useState(new Date());

  //Receipt Footer
  const [posFooter, setPosFooter] = useState<Record<string, string>>({});
  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('pos_cart_cache')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Cash-in gate
  const [menuAvailable, setMenuAvailable] = useState(false)
  const [checkingCashIn, setCheckingCashIn] = useState(true)

  // Menu / category
  const [categories, setCategories] = useState<Category[]>(() => {
    const cached = localStorage.getItem('pos_menu_cache')
    return cached ? JSON.parse(cached) : []
  })
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [categorySize, setCategorySize] = useState<string | null>(null)
  const [isMenuLoading, setIsMenuLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Item selection modal
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [qty, setQty] = useState(1)
  const [remarks, setRemarks] = useState('')
  const [sugarLevel, setSugarLevel] = useState('')
  const [sugarLevels, setSugarLevels] = useState<{ id: number; label: string; value: string }[]>(() => {
    try {
      const c = localStorage.getItem('pos_sugar_levels_cache')
      return c ? JSON.parse(c) : []
    } catch {
      return []
    }
  })
  const [size, setSize] = useState<'M' | 'L' | 'none'>('M')
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])
  const [orderCharge, setOrderCharge] = useState<'grab' | 'panda' | null>(null)
  const [isAddOnModalOpen, setIsAddOnModalOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [isCustomerNameModalOpen, setIsCustomerNameModalOpen] = useState(false)

  // FIX #1 — use branchId in the key so it's always defined at the time
  // syncNextSequence reads it (avoids stale closure on branchId).
  const seqKey    = `last_or_sequence_${branchId ?? 'default'}`
  const queueKey  = `last_queue_sequence_${branchId ?? 'default'}`
  const queueDate = `last_queue_date_${branchId ?? 'default'}`

  // Add-ons data
  const [addOnsData, setAddOnsData] = useState<
    {
      id: number
      name: string
      price: number
      grab_price?: number
      panda_price?: number
      category?: string
    }[]
  >(() => {
    try {
      const c = localStorage.getItem('pos_addons_cache')
      return c ? JSON.parse(c) : []
    } catch {
      return []
    }
  })

  // Bundle state
  const [bundlesData, setBundlesData] = useState<Bundle[]>(() => {
    try {
      const c = localStorage.getItem('pos_bundles_cache')
      return c ? JSON.parse(c) : []
    } catch {
      return []
    }
  })
  const [isBundleModalOpen, setIsBundleModalOpen] = useState(false)
  const [activeBundleItem, setActiveBundleItem] = useState<Bundle | null>(null)
  const [bundleComponentIndex, setBundleComponentIndex] = useState(0)
  const [bundleComponentCustomizations, setBundleComponentCustomizations] = useState<BundleComponentCustomization[]>([])
  const [bundleComponentSugar, setBundleComponentSugar] = useState('')
  const [bundleComponentOptions, setBundleComponentOptions] = useState<string[]>([])
  const [bundleComponentAddOns, setBundleComponentAddOns] = useState<string[]>([])
  const [bundleComponentAddOnModalOpen, setBundleComponentAddOnModalOpen] = useState(false)

  // Cart item editing
  const [editingCartIndex, setEditingCartIndex] = useState<number | null>(null)
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null)
  const [itemDiscountType, setItemDiscountType] = useState<'none' | 'percent' | 'fixed'>('none')
  const [itemDiscountValue, setItemDiscountValue] = useState<number | ''>('')
  const [editingItemDiscountId, setEditingItemDiscountId] = useState<number | null>(null)

  // Combo drink
  const [isCombodrinkModalOpen, setIsCombodrinkModalOpen] = useState(false)
  const [comboDrinkSugar, setComboDrinkSugar] = useState('')
  const [comboDrinkOptions, setComboDrinkOptions] = useState<string[]>([])
  const [comboDrinkAddOns, setComboDrinkAddOns] = useState<string[]>([])
  const [comboDrinkAddOnModalOpen, setComboDrinkAddOnModalOpen] = useState(false)
  const [pendingComboCart, setPendingComboCart] = useState<CartItem | null>(null)

  // Mix & Match state
  const [isMixMatchModalOpen, setIsMixMatchModalOpen] = useState(false)
  const [pendingMixMatchCart, setPendingMixMatchCart] = useState<CartItem | null>(null)
  const [mixMatchDrinkItems, setMixMatchDrinkItems] = useState<MenuItem[]>([])
  const [selectedMixMatchDrink, setSelectedMixMatchDrink] = useState<MenuItem | null>(null)
  const [mixMatchDrinkSugar, setMixMatchDrinkSugar] = useState('')
  const [mixMatchDrinkOptions, setMixMatchDrinkOptions] = useState<string[]>([])
  const [mixMatchDrinkAddOns, setMixMatchDrinkAddOns] = useState<string[]>([])
  const [mixMatchDrinkAddOnOpen, setMixMatchDrinkAddOnOpen] = useState(false)

  // Confirm / payment
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'payment' | 'discount' | 'pax'>('payment')
  const [cashTendered, setCashTendered] = useState<number | ''>('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [referenceNumber, setReferenceNumber] = useState('')

  // Discounts
  const [discountRemarks, setDiscountRemarks] = useState('')
  const [seniorIds, setSeniorIds] = useState<string[]>([])
  const [pwdIds, setPwdIds] = useState<string[]>([])
  const [discounts, setDiscounts] = useState<Discount[]>(() => {
    try {
      const c = localStorage.getItem('pos_discounts_cache')
      const all = c ? JSON.parse(c) : []
      const seen = new Set<string>()
      return all
        .filter((d: Discount) => d.status === 'ON')
        .filter((d: Discount) => {
          const key = `${d.name}-${d.amount}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
    } catch {
      return []
    }
  })

  // ── NEW: per-item per-unit SC/PWD assignments ─────────────────────────────
  const [itemPaxAssignments, setItemPaxAssignments] = useState<ItemPaxAssignments>({})

  // Single promo discount
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null)
  const [selectedDiscounts, setSelectedDiscounts] = useState<Discount[]>([])

  // OR / Queue
  const [orNumber, setOrNumber] = useState(generateORNumber(1))
  const [queueNumber, setQueueNumber] = useState(generateQueueNumber(1))

  // Success / print
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [printTarget, setPrintTarget] = useState<'receipt' | 'stickers' | 'kitchen' | null>(null)
  const [printedReceipt, setPrintedReceipt] = useState(false)
  const [printedKitchen, setPrintedKitchen] = useState(false)
  const [printedStickers, setPrintedStickers] = useState(false)

  // ── Derived values ──────────────────────────────────────────────────────────

  const isDrink = selectedCategory?.type === 'drink' || selectedCategory?.category_type === 'bundle'
  const isWings = selectedCategory?.category_type === 'wings'
  const isOz = selectedCategory?.name === 'HOT DRINKS' || selectedCategory?.name === 'HOT COFFEE'
  const isCombo = selectedCategory?.category_type === 'combo'
  const isWaffleCategory = selectedCategory?.category_type === 'waffle'
  const categoryHasOnlyOneSize = (selectedCategory?.sub_categories?.length ?? 0) <= 1

  const isFoodCategory = selectedCategory?.category_type === 'food' ||
    selectedCategory?.category_type === 'wings';

  const filteredAddOns = addOnsData.filter(a => {
    if (isWaffleCategory) return a.category === 'waffle';
    if (isFoodCategory)   return a.category === 'food';
    return a.category !== 'waffle' && a.category !== 'food';
  });

  const totalCount = cart.reduce((acc, item) => acc + item.qty, 0)

  const grossSubtotal = cart.reduce(
    (acc, item) => acc + (item.originalPrice ?? item.finalPrice) + getItemSurcharge(item),
    0
  )

  const itemDiscountTotal = cart.reduce((acc, item) => {
    if (!item.discountType || item.discountType === 'none') return acc
    if (!item.discountValue || Number(item.discountValue) === 0) return acc
    const discountVal = Number(item.discountValue)
    const discountAmt =
      item.discountType === 'percent'
        ? Number(item.price) * item.qty * (discountVal / 100)
        : Math.min(discountVal, Number(item.price) * item.qty)
    return acc + discountAmt
  }, 0)

  const eligibleForPromo = cart
    .filter(item => !item.discountId)
    .reduce((acc, item) => acc + Number(item.price) * item.qty + getItemSurcharge(item), 0)

  const isVat = vatType === 'vat'

  // ── PAX discount from explicit per-unit assignments ───────────────────────
  const scDiscount = discounts.find(d => d.name.toUpperCase().includes('SENIOR'))
  const pwdDiscount = discounts.find(
    d => d.name.toUpperCase().includes('PWD') || d.name.toUpperCase().includes('DIPLOMAT')
  )
  const scPct = scDiscount ? Number(scDiscount.amount) : 20
  const pwdPct = pwdDiscount ? Number(pwdDiscount.amount) : 20

  let totalPaxDiscount = 0
  let totalVatExemptSales = 0

  cart.forEach((item, cartIndex) => {
    const assignments = itemPaxAssignments[String(cartIndex)] ?? []
    assignments.forEach(assignment => {
      if (assignment === 'none') return
      const unitPrice = Number(item.price)
      const unitVatExcl = isVat ? unitPrice / 1.12 : unitPrice
      const pct = assignment === 'sc' ? scPct : pwdPct
      const discAmt = unitVatExcl * (pct / 100)
      totalPaxDiscount += discAmt
      totalVatExemptSales += unitVatExcl
    })
  })

  totalPaxDiscount = round(totalPaxDiscount)
  totalVatExemptSales = round(totalVatExemptSales)

  const hasPaxDiscount = totalPaxDiscount > 0

  // ── Derived pax counts for backend ───────────────────────────────────────
  const paxSenior = Object.values(itemPaxAssignments)
    .flat()
    .filter(a => a === 'sc').length
  const paxPwd = Object.values(itemPaxAssignments)
    .flat()
    .filter(a => a === 'pwd').length

  // ── Promo discount ────────────────────────────────────────────────────────
  const promoDiscount = selectedDiscount
    ? selectedDiscount.type.includes('Percent')
      ? eligibleForPromo * (Number(selectedDiscount.amount) / 100)
      : Number(selectedDiscount.amount)
    : 0

  const orderLevelDiscount = totalPaxDiscount + promoDiscount

  // ── VAT split ─────────────────────────────────────────────────────────────
  const vatExemptSales = isVat && hasPaxDiscount ? Math.max(0, round(totalVatExemptSales - totalPaxDiscount)) : 0

  const vatableBase = isVat
    ? Math.max(0, round(grossSubtotal - totalVatExemptSales * 1.12 - itemDiscountTotal - promoDiscount))
    : 0
  const vatableSales = isVat ? round(vatableBase / 1.12) : 0
  const vatAmount    = isVat ? round(vatableBase - vatableSales) : 0

  const amtDue = isVat
    ? Math.max(0, round(vatableBase + vatExemptSales))
    : Math.max(0, round(grossSubtotal - itemDiscountTotal - orderLevelDiscount))

  const totalDiscountDisplay = itemDiscountTotal + totalPaxDiscount + promoDiscount
  const change = typeof cashTendered === 'number' ? Math.max(0, cashTendered - amtDue) : 0
  const subtotal = grossSubtotal - itemDiscountTotal

  // ── Sync selectedDiscounts for backend/receipt ────────────────────────────
  useEffect(() => {
    const applied: Discount[] = []
    if (paxSenior > 0 && scDiscount) applied.push(scDiscount)
    if (paxPwd > 0 && pwdDiscount) applied.push(pwdDiscount)
    setSelectedDiscounts(applied)
  }, [paxSenior, paxPwd, scDiscount, pwdDiscount])

  // ── Sticker logic ─────────────────────────────────────────────────────────
  const hasStickers = cart.some(
    item =>
      item.sugarLevel !== undefined ||
      item.size === 'M' ||
      item.size === 'L' ||
      (item.addOns?.some(a => a.toLowerCase().includes('waffle combo')) ?? false) ||
      (item.isBundle && (item.bundleComponents?.length ?? 0) > 0) ||
      (item.remarks?.startsWith('[Drink:') ?? false) ||
      ((orderType === 'take-out' || orderType === 'delivery') &&
        item.sugarLevel === undefined &&
        item.size === 'none' &&
        !item.isBundle &&
        !(item.remarks?.startsWith('[Drink:') ?? false))
  )

  const formattedDate = currentDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
  const formattedTime = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  // FIX #4 — capture current cashierName and branchName values at call time
  // instead of relying on stale closure values inside the handler.
  const logCartAction = (action: string, qty: number, currentCashierName: string = cashierName) => {
    api
      .post('/audit-logs', {
        action: `${action} x${qty}`,
        module: 'sales_order',
        details: `Cashier: ${currentCashierName} | Branch: ${branchName} | ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila', hour12: true })}`,
      })
      .catch(() => {})
  }

  // ── FIX #1 — Define syncNextSequence BEFORE the boot useEffect so it is
  // not in the temporal dead zone when the effect runs on mount. ─────────────
  const syncNextSequence = async () => {
    try {
      const { data } = await api.get('/receipts/next-sequence')
      const serverSeq   = parseInt(data.next_sequence, 10)
      const serverQueue = parseInt(data.next_queue, 10) || 1

      if (!isNaN(serverSeq)) {
        localStorage.setItem(seqKey, String(serverSeq))
        setOrNumber(generateORNumber(serverSeq))

        // ✅ SYNC QUEUE FROM SERVER
        localStorage.setItem(queueKey,  String(serverQueue))
        localStorage.setItem(queueDate, new Date().toDateString())
        setQueueNumber(generateQueueNumber(serverQueue))
      }
    } catch {
      // ── Offline fallback ───────────────────────────────────────────────────
      const lastSeq = parseInt(localStorage.getItem(seqKey) || '0', 10) + 1
      localStorage.setItem(seqKey, String(lastSeq))
      setOrNumber(generateORNumber(lastSeq))

      const today     = new Date().toDateString()
      const savedDate = localStorage.getItem(queueDate)
      const isNewDay  = savedDate !== today

      if (isNewDay) {
        localStorage.setItem(queueKey,  '1')
        localStorage.setItem(queueDate, today)
        setQueueNumber(generateQueueNumber(1))
      } else {
        const lastQueue = parseInt(localStorage.getItem(queueKey) || '1', 10)
        setQueueNumber(generateQueueNumber(lastQueue))
      }
    }
  }

  const fetchMenu = async () => {
    setIsMenuLoading(true)
    try {
      const { data } = await api.get('/menu')
      if (Array.isArray(data)) {
        setCategories(data)
        localStorage.setItem('pos_menu_cache', JSON.stringify(data))
      }
    } catch {
      showToast('Failed to sync menu structure', 'error')
    } finally {
      setIsMenuLoading(false)
    }
  }

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const boot = async () => {
      try {
        const { data } = await api.get('/cash-transactions/status')
        setMenuAvailable(data?.hasCashedIn ?? false)
      } catch {
        setMenuAvailable(false)
      } finally {
        setCheckingCashIn(false)
      }
    }
    boot()
    syncNextSequence()
    fetchMenu()

    if (branchId) {
      api.get(`/branches/${branchId}`).then(({ data }) => {
        const b = data.data ?? data;
        setBranchDetails({
          brand: b.brand, companyName: b.company_name, storeAddress: b.store_address,
          vatRegTin: b.vat_reg_tin, minNumber: b.min_number, serialNumber: b.serial_number, owner_name: b.owner_name,
        });
        if (b.vat_type) {
          setVatType(b.vat_type as 'vat' | 'non_vat');
          localStorage.setItem('lucky_boba_user_branch_vat', b.vat_type);
        }
      }).catch(() => {});
    }

    api
      .get('/payment-settings')
      .then(({ data }) => setPosFooter(data))
      .catch(() => {});

    api
      .get('/discounts')
      .then(({ data }) => {
        localStorage.setItem('pos_discounts_cache', JSON.stringify(data))
        const seen = new Set<string>()
        const unique = data
          .filter((d: Discount) => d.status === 'ON')
          .filter((d: Discount) => {
            const key = `${d.name}-${d.amount}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
        setDiscounts(unique)
      })
      .catch(() => {})

    api
      .get('/add-ons')
      .then(({ data }) => {
        localStorage.setItem('pos_addons_cache', JSON.stringify(data))
        setAddOnsData(data)
      })
      .catch(() => {})

    api
      .get('/sugar-levels')
      .then(({ data }) => {
        const levels = data.data ?? data
        localStorage.setItem('pos_sugar_levels_cache', JSON.stringify(levels))
        setSugarLevels(levels)
      })
      .catch(() => {})

    api
      .get('/bundles')
      .then(({ data }) => {
        localStorage.setItem('pos_bundles_cache', JSON.stringify(data))
        setBundlesData(data)
      })
      .catch(() => {})

    const onCashIn = () => {
      setMenuAvailable(true)
      setCheckingCashIn(false)
    }
    window.addEventListener('cash-in-completed', onCashIn)
    return () => window.removeEventListener('cash-in-completed', onCashIn)
  }, [branchId])

  useEffect(() => {
    api
      .get('/user')
      .then(({ data: u }) => {
        const name = u?.name || u?.username || u?.full_name || u?.display_name
        setCashierName(name?.trim() || 'Admin')
      })
      .catch(() => setCashierName('Admin'))
    const timer = setInterval(() => setCurrentDate(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('pos_cart_cache', JSON.stringify(cart))
    } catch (e) {
      console.warn('Failed to persist cart:', e)
    }
  }, [cart])

  // ── When cart changes, reset assignments for removed items ────────────────
  useEffect(() => {
    setItemPaxAssignments(prev => {
      const updated: ItemPaxAssignments = {}
      cart.forEach((item, i) => {
        const key = String(i)
        const existing = prev[key] ?? []
        const arr = Array(item.qty).fill('none').map((_, ui) => existing[ui] ?? 'none') as ('none'|'sc'|'pwd')[];
        updated[key] = arr;
      });
      return updated;
    });
  }, [cart, cart.length]);

  // ── Sequence helpers ──────────────────────────────────────────────────────

  const terminalNumber = generateTerminalNumber(branchId)

  // ── Category / item navigation ─────────────────────────────────────────────

  const handleCategoryClick = (cat: Category) => {
    setSelectedCategory(cat);
    setCategorySize(null);
    setActiveCategoryGroup(null);
    const catType    = cat.category_type ?? cat.type;
    const isDrinkCat = catType === 'drink' || catType === 'bundle';
    const isWingsCat = catType === 'wings';
    const subCats    = cat.sub_categories ?? [];
    if (!isDrinkCat && !isWingsCat) { setCategorySize('all'); return; }
    if (isWingsCat) return;
    if (subCats.length === 1) { setCategorySize(subCats[0].name); return; }
    if (subCats.length === 0 && cat.cup?.size_l == null) { setCategorySize(cat.cup?.size_m || 'M'); }
  };

  const handleBack = () => {
    if ((isDrink || isWings) && categorySize && !categoryHasOnlyOneSize) {
      setCategorySize(null)
    } else {
      setSelectedCategory(null)
      setCategorySize(null)
    }
  }

  const getFilteredItems = (items: MenuItem[]): MenuItem[] => {
    if (searchQuery) {
      return items.map(item => {
        if (!item.size || item.size === 'none') return item
        const cupM = selectedCategory?.cup?.size_m ?? 'M'
        const cupL = selectedCategory?.cup?.size_l ?? 'L'
        const sizeLabel = item.size === 'L' ? cupL : cupM
        return { ...item, name: `${item.name} (${sizeLabel})` }
      })
    }
    if (!categorySize || categorySize === 'all') return items
    const cupSizeM = selectedCategory?.cup?.size_m || 'M'
    const cupSizeL = selectedCategory?.cup?.size_l || 'L'
    if (isWings) {
      const selectedSub = selectedCategory?.sub_categories?.find(s => s.name === categorySize)
      return selectedSub
        ? items.filter(item => item.sub_category_id === selectedSub.id)
        : items.filter(item => item.size === categorySize)
    }
    const selectedSub = selectedCategory?.sub_categories?.find(s => s.name === categorySize)
    if (selectedSub) {
      return items.filter(item => {
        if (item.sub_category_id != null) return item.sub_category_id === selectedSub.id
        if (categorySize === cupSizeM) return item.size === 'M' || item.size === 'none'
        if (categorySize === cupSizeL) return item.size === 'L' || item.size === 'none'
        return true
      })
    }
    if (categorySize === cupSizeM) return items.filter(i => i.size === 'M' || i.size === 'none')
    if (categorySize === cupSizeL) return items.filter(i => i.size === 'L' || i.size === 'none')
    return items
  }

  const handleItemClick = async (item: MenuItem) => {
    const actualCategory = categories.find(cat => cat.menu_items.some(mi => mi.id === item.id)) ?? selectedCategory

    if (!searchQuery.trim()) {
      setSelectedCategory(actualCategory)
    }

    const catType = actualCategory?.category_type

    if (catType === 'mix_and_match') {
      const categoryId = actualCategory?.id
      let allDrinks: MenuItem[] = []
      if (categoryId) {
        try {
          const token = localStorage.getItem('auth_token') || localStorage.getItem('lucky_boba_token') || ''
          const res = await fetch(`/api/category-drinks?category_id=${categoryId}`, {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          })
          const data = await res.json()
          const poolDrinks: { menu_item_id: number; name: string; size: string; price: number }[] = data.data ?? []
          allDrinks = poolDrinks.map(d => {
            const found = categories.flatMap(c => c.menu_items).find(m => m.id === d.menu_item_id)
            const validSize = (s: string): 'M' | 'L' | 'none' => (s === 'M' || s === 'L' ? s : 'none')
            return found
              ? { ...found, size: validSize(d.size || found.size || 'none') }
              : ({
                  id: d.menu_item_id,
                  name: d.name,
                  price: d.price,
                  size: validSize(d.size),
                  barcode: '',
                  category_id: categoryId,
                } as unknown as MenuItem)
          })
        } catch {
          allDrinks = []
        }
      }
      const newCartItem: CartItem = {
        ...item,
        qty: 1,
        remarks: '',
        charges: { grab: orderCharge === 'grab', panda: orderCharge === 'panda' },
        size: 'none',
        finalPrice: Number(item.price),
      }
      setPendingMixMatchCart(newCartItem)
      setMixMatchDrinkItems(allDrinks)
      setSelectedMixMatchDrink(null)
      setMixMatchDrinkSugar('')
      setMixMatchDrinkOptions([])
      setMixMatchDrinkAddOns([])
      setIsMixMatchModalOpen(true)
      return
    }

    if (catType === 'bundle') {
      const bundle = bundlesData.find(b => b.barcode === item.barcode)
      if (bundle) {
        setActiveBundleItem(bundle)
        setBundleComponentIndex(0)
        setBundleComponentCustomizations([])
        setBundleComponentSugar('')
        setBundleComponentOptions([])
        setBundleComponentAddOns([])
        setOrderCharge(null)
        setIsBundleModalOpen(true)
        return
      }
    }

    setSelectedItem(item)
    setQty(1)
    setRemarks('')
    setSugarLevel('')
    setSelectedOptions([])
    setSelectedAddOns([])
    setIsAddOnModalOpen(false)

    if (item.size === 'M' || item.size === 'L') {
      setSize(item.size)
    } else {
      const cupSizeL = actualCategory?.cup?.size_l || 'L'
      setSize(categorySize === cupSizeL ? 'L' : 'M')
    }

    const isDrinkItem = catType === 'drink' || catType === 'combo'
    if (isDrinkItem) {
      try {
        const { data } = await api.get(`/sugar-levels/by-item/${item.id}`)
        const levels = data.data ?? []
        setSugarLevels(levels)
        setSugarLevel('')
      } catch {
        setSugarLevels([])
        setSugarLevel('')
      }
    } else {
      setSugarLevels([])
      setSugarLevel('')
    }
  }

  // ── Order charge toggle ────────────────────────────────────────────────────

  const toggleOrderCharge = (type: 'grab' | 'panda') => {
    const next = orderCharge === type ? null : type
    setOrderCharge(next)
    setCart(prev => prev.map(item => ({ ...item, charges: { grab: next === 'grab', panda: next === 'panda' } })))
  }

  const toggleBundleOrderCharge = (type: 'grab' | 'panda') => {
    const next = orderCharge === type ? null : type
    setOrderCharge(next)
  }

  // ── Options toggles ────────────────────────────────────────────────────────

  const makeToggleOption = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (opt: string) => {
    setter(prev => {
      const iceOpts = ['NO ICE', '-ICE', '+ICE', 'WARM']
      const pearlOpts = ['NO PRL', 'W/ PRL']
      if (iceOpts.includes(opt)) {
        const rest = prev.filter(o => !iceOpts.includes(o))
        return prev.includes(opt) ? rest : [...rest, opt]
      }
      if (pearlOpts.includes(opt)) {
        const rest = prev.filter(o => !pearlOpts.includes(o))
        return prev.includes(opt) ? rest : [...rest, opt]
      }
      return prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
    })
  }

  const toggleOption = makeToggleOption(setSelectedOptions)
  const toggleComboDrinkOption = makeToggleOption(setComboDrinkOptions)

  const toggleAddOn = (name: string) =>
    setSelectedAddOns(prev => (prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]))

  // ── Cart deduplication ─────────────────────────────────────────────────────

  const isSameCartItem = (a: CartItem, b: CartItem): boolean =>
    a.id === b.id &&
    a.size === b.size &&
    a.cupSizeLabel === b.cupSizeLabel &&
    a.sugarLevel === b.sugarLevel &&
    a.remarks === b.remarks &&
    JSON.stringify(a.options ?? []) === JSON.stringify(b.options ?? []) &&
    JSON.stringify(a.addOns ?? []) === JSON.stringify(b.addOns ?? []) &&
    a.charges.grab === b.charges.grab &&
    a.charges.panda === b.charges.panda

  const mergeIntoCart = (newItem: CartItem) => {
    setCart(prev => {
      const unitPrice = newItem.finalPrice / newItem.qty
      const idx = prev.findIndex(item => isSameCartItem(item, newItem))
      if (idx !== -1) {
        return prev.map((item, i) =>
          i === idx
            ? { ...item, qty: item.qty + newItem.qty, finalPrice: item.finalPrice + unitPrice * newItem.qty }
            : item
        )
      }
      return [...prev, newItem]
    })
  }

  // ── Add to order ───────────────────────────────────────────────────────────

  const addToOrder = () => {
    if (!selectedItem || !selectedCategory) return;
    const isWaffle = selectedCategory?.name?.toLowerCase().includes('waffle');
    let extraCost = 0;
    if (isDrink || isWaffle || isFoodCategory) {
      selectedAddOns.forEach(name => {
        const addon = addOnsData.find(a => a.name === name)
        if (addon) {
          const baseAddonPrice = Number(addon.price)
          if (orderCharge === 'grab' && Number(addon.grab_price ?? 0) > 0)
            extraCost += Number(addon.grab_price) - baseAddonPrice
          else if (orderCharge === 'panda' && Number(addon.panda_price ?? 0) > 0)
            extraCost += Number(addon.panda_price) - baseAddonPrice
          extraCost += baseAddonPrice
        }
      })
    }
    const cartSize: 'M' | 'L' | 'none' = isDrink ? size : 'none'
    const cupSizeLabel = (isDrink || isOz) && categorySize ? categorySize : undefined
    const unitPrice = Number(selectedItem.price) + extraCost
    const newCartItem: CartItem = {
      ...selectedItem,
      name: isWings ? `${selectedItem.name} (${categorySize})` : selectedItem.name,
      qty,
      remarks,
      charges: { grab: orderCharge === 'grab', panda: orderCharge === 'panda' },
      sugarLevel: isDrink ? sugarLevel : undefined,
      size:       cartSize, cupSizeLabel,
      options:    isDrink ? selectedOptions : undefined,
      addOns:     (isDrink || isWaffle || isFoodCategory) ? selectedAddOns : undefined,
      finalPrice: unitPrice * qty,
    }
    if (isCombo) {
      setPendingComboCart(newCartItem)
      setComboDrinkSugar('')
      setComboDrinkOptions([])
      setComboDrinkAddOns([])
      setSelectedItem(null)
      setIsAddOnModalOpen(false)
      setIsCombodrinkModalOpen(true)
      return
    }
    mergeIntoCart(newCartItem)
    setSelectedItem(null)
    setIsAddOnModalOpen(false)
    if (searchQuery.trim()) setSelectedCategory(null)
    logCartAction(newCartItem.name, newCartItem.qty, cashierName)
    showToast(`${selectedItem.name} added to order`, 'success')
  }

  // ── Bundle component confirm ───────────────────────────────────────────────

  const confirmBundleComponent = () => {
    if (!activeBundleItem) return
    const component = activeBundleItem.items[bundleComponentIndex]
    const displayName = component.display_name ?? component.custom_name ?? ''
    const isMilkTea = displayName.toLowerCase().includes('milk tea') || displayName.toLowerCase().includes('m.tea')
    const pearlOpts = ['NO PRL', 'W/ PRL']
    if (isMilkTea && !bundleComponentOptions.some(o => pearlOpts.includes(o))) {
      showToast('Please select NO PRL or W/ PRL', 'warning')
      return
    }
    const customization: BundleComponentCustomization = {
      name: displayName,
      quantity: component.quantity,
      sugarLevel: bundleComponentSugar,
      options: bundleComponentOptions,
      addOns: bundleComponentAddOns,
    }
    const newCustomizations = [...bundleComponentCustomizations, customization]
    if (bundleComponentIndex < activeBundleItem.items.length - 1) {
      setBundleComponentCustomizations(newCustomizations)
      setBundleComponentIndex(i => i + 1)
      setBundleComponentSugar('')
      setBundleComponentOptions([])
      setBundleComponentAddOns([])
      return
    }
    const remarksLines = newCustomizations
      .map(
        (c, i) =>
          `[${i + 1}] ${c.quantity > 1 ? `${c.quantity}x ` : ''}${c.name}: Sugar ${c.sugarLevel}` +
          `${c.options.length ? ' | ' + c.options.join(', ') : ''}` +
          `${c.addOns.length ? ' | +' + c.addOns.join(', ') : ''}`
      )
      .join(' || ')
    const bundleAddOnCost = newCustomizations.reduce((total, c) => {
      return (
        total +
        c.addOns.reduce((sum, addonName) => {
          const addon = addOnsData.find(a => a.name === addonName)
          if (!addon) return sum
          if (orderCharge === 'grab' && Number(addon.grab_price ?? 0) > 0) return sum + Number(addon.grab_price)
          if (orderCharge === 'panda' && Number(addon.panda_price ?? 0) > 0) return sum + Number(addon.panda_price)
          return sum + Number(addon.price)
        }, 0)
      )
    }, 0)
    const matchingMenuItem = categories.flatMap(c => c.menu_items).find(m => m.barcode === activeBundleItem.barcode)
    const cartItem: CartItem = {
      id: activeBundleItem.id,
      category_id: 0,
      name: activeBundleItem.display_name ?? activeBundleItem.name,
      grab_price: Number(activeBundleItem.grab_price || matchingMenuItem?.grab_price || 0),
      panda_price: Number(activeBundleItem.panda_price || matchingMenuItem?.panda_price || 0),
      price: Number(activeBundleItem.price),
      barcode: activeBundleItem.barcode,
      qty: 1,
      size: 'L',
      remarks: remarksLines,
      charges: { grab: orderCharge === 'grab', panda: orderCharge === 'panda' },
      finalPrice: Number(activeBundleItem.price) + bundleAddOnCost,
      isBundle: true,
      bundleId: activeBundleItem.id,
      bundleComponents: newCustomizations,
    }
    mergeIntoCart(cartItem)
    logCartAction(cartItem.name, 1, cashierName)
    setIsBundleModalOpen(false)
    setActiveBundleItem(null)
    showToast(`${activeBundleItem.name} added!`, 'success')
    if (searchQuery.trim()) setSelectedCategory(null)
  }

  // ── Combo drink confirm ────────────────────────────────────────────────────

  const confirmComboDrink = () => {
    if (!pendingComboCart) return
    const isPizzaCombo = selectedCategory?.name?.toUpperCase() === 'PIZZA PEDRICOS COMBO'
    const isClassicPearl = pendingComboCart.name?.toUpperCase().includes('CLASSIC PEARL')
    const pearlOpts = ['NO PRL', 'W/ PRL']
    if (isPizzaCombo && !isClassicPearl && !comboDrinkOptions.some(o => pearlOpts.includes(o))) {
      showToast('Please select NO PRL or W/ PRL', 'warning')
      return
    }
    let addOnExtraCost = 0
    comboDrinkAddOns.forEach(name => {
      const addon = addOnsData.find(a => a.name === name)
      if (addon) {
        if (orderCharge === 'grab' && Number(addon.grab_price ?? 0) > 0) addOnExtraCost += Number(addon.grab_price)
        else if (orderCharge === 'panda' && Number(addon.panda_price ?? 0) > 0)
          addOnExtraCost += Number(addon.panda_price)
        else addOnExtraCost += Number(addon.price)
      }
    })
    const drinkDetails = [
      `Sugar: ${comboDrinkSugar}`,
      ...comboDrinkOptions,
      ...comboDrinkAddOns.map(a => `+${a}`),
    ].join(' | ')
    const drinkLabel =
      isPizzaCombo && !isClassicPearl ? pendingComboCart.name.replace(/^PIZZA \+ /i, '') : 'Classic Pearl'
    const finalItem: CartItem = {
      ...pendingComboCart,
      remarks: `${drinkLabel} [${drinkDetails}]${pendingComboCart.remarks ? ` | Note: ${pendingComboCart.remarks}` : ''}`,
      sugarLevel: comboDrinkSugar,
      options: comboDrinkOptions,
      addOns: comboDrinkAddOns.length > 0 ? comboDrinkAddOns : undefined,
      finalPrice: pendingComboCart.finalPrice + addOnExtraCost * pendingComboCart.qty,
    }
    mergeIntoCart(finalItem)
    logCartAction(finalItem.name, finalItem.qty, cashierName)
    setIsCombodrinkModalOpen(false)
    setPendingComboCart(null)
    showToast(`${finalItem.name} added!`, 'success')
    if (searchQuery.trim()) setSelectedCategory(null)
  }

  // ── Mix & Match confirm ────────────────────────────────────────────────────

  const confirmMixAndMatch = () => {
    if (!pendingMixMatchCart || !selectedMixMatchDrink) return
    let addOnExtraCost = 0
    mixMatchDrinkAddOns.forEach(name => {
      const addon = addOnsData.find(a => a.name === name)
      if (addon) {
        if (orderCharge === 'grab' && Number(addon.grab_price ?? 0) > 0) addOnExtraCost += Number(addon.grab_price)
        else if (orderCharge === 'panda' && Number(addon.panda_price ?? 0) > 0)
          addOnExtraCost += Number(addon.panda_price)
        else addOnExtraCost += Number(addon.price)
      }
    })
    const drinkDetails = [
      `Drink: ${selectedMixMatchDrink.name}`,
      `Sugar: ${mixMatchDrinkSugar}`,
      ...mixMatchDrinkOptions,
      ...mixMatchDrinkAddOns.map(a => `+${a}`),
    ].join(' | ')
    const finalItem: CartItem = {
      ...pendingMixMatchCart,
      remarks: `[${drinkDetails}]`,
      finalPrice: pendingMixMatchCart.finalPrice + addOnExtraCost,
    }
    mergeIntoCart(finalItem)
    logCartAction(finalItem.name, finalItem.qty, cashierName)
    setIsMixMatchModalOpen(false)
    setPendingMixMatchCart(null)
    showToast(`${finalItem.name} + ${selectedMixMatchDrink.name} added!`, 'success')
    if (searchQuery.trim()) setSelectedCategory(null)
  }

  // ── Cart item editing ──────────────────────────────────────────────────────

  const openCartItemEdit = (index: number) => {
    const item = cart[index]
    setEditingCartIndex(index)
    setEditingCartItem({ ...item, finalPrice: item.finalPrice })
    setEditingItemDiscountId(item.discountId ?? null)
    setItemDiscountType(item.discountType ?? 'none')
    setItemDiscountValue(item.discountValue ?? '')
  }

  const closeCartItemEdit = () => {
    setEditingCartIndex(null)
    setEditingCartItem(null)
    setItemDiscountType('none')
    setItemDiscountValue('')
    setEditingItemDiscountId(null)
  }

  const adjustEditQty = (delta: number) => {
    if (!editingCartItem) return
    const newQty = Math.max(1, editingCartItem.qty + delta)
    const originalUnitPrice = (editingCartItem.originalPrice ?? editingCartItem.finalPrice) / editingCartItem.qty
    setEditingCartItem({ ...editingCartItem, qty: newQty, finalPrice: originalUnitPrice * newQty })
  }

  const saveCartItemEdit = () => {
    if (editingCartIndex === null || !editingCartItem) return
    const addOnCostPerUnit = (editingCartItem.addOns ?? []).reduce((sum, addonName) => {
      const addon = addOnsData.find(a => a.name === addonName)
      if (!addon) return sum
      const price =
        editingCartItem.charges?.grab && Number(addon.grab_price ?? 0) > 0
          ? Number(addon.grab_price)
          : editingCartItem.charges?.panda && Number(addon.panda_price ?? 0) > 0
            ? Number(addon.panda_price)
            : Number(addon.price ?? 0)
      return sum + price
    }, 0)
    const drinkUnitPrice = Number(editingCartItem.price ?? 0)
    const qty = Number(editingCartItem.qty ?? 1)
    const discountValNum = Number(itemDiscountValue ?? 0)
    let discountLabel: string | undefined = undefined
    const grossTotal = (drinkUnitPrice + addOnCostPerUnit) * qty
    let totalDiscount = 0
    if (itemDiscountType === 'percent' && discountValNum > 0) {
      totalDiscount = drinkUnitPrice * qty * (discountValNum / 100)
      const d = discounts.find(d => d.id === editingItemDiscountId)
      if (d) discountLabel = `${d.name} (${d.amount}%)`
    } else if (itemDiscountType === 'fixed' && discountValNum > 0) {
      totalDiscount = Math.min(discountValNum, drinkUnitPrice * qty)
      const d = discounts.find(d => d.id === editingItemDiscountId)
      if (d) discountLabel = `${d.name} (-₱${d.amount})`
    }
    const newFinalPrice = Math.max(0, grossTotal - totalDiscount)
    const updated: CartItem = {
      ...editingCartItem,
      finalPrice: newFinalPrice,
      originalPrice: grossTotal,
      discountLabel,
      discountId: editingItemDiscountId,
      discountType: itemDiscountType,
      discountValue: discountValNum,
    }
    setCart(prev => prev.map((item, i) => (i === editingCartIndex ? updated : item)))
    showToast('Item updated', 'success')
    closeCartItemEdit()
  }

  const removeEditingItem = () => {
    if (editingCartIndex === null) return
    const name = cart[editingCartIndex].name
    const qty = cart[editingCartIndex].qty
    setCart(prev => prev.filter((_, i) => i !== editingCartIndex))
    logCartAction(`REMOVED: ${name}`, qty, cashierName)
    showToast(`${name} removed`, 'warning')
    closeCartItemEdit()
  }

  const computeDiscountedTotal = () => {
    if (!editingCartItem) return 0
    const addOnCostPerUnit = (editingCartItem.addOns ?? []).reduce((sum, addonName) => {
      const a = addOnsData.find(x => x.name === addonName)
      if (!a) return sum
      return (
        sum +
        (editingCartItem.charges?.grab && Number(a.grab_price ?? 0) > 0
          ? Number(a.grab_price)
          : editingCartItem.charges?.panda && Number(a.panda_price ?? 0) > 0
            ? Number(a.panda_price)
            : Number(a.price))
      )
    }, 0)
    const drinkUnitPrice = Number(editingCartItem.price)
    const qty = editingCartItem.qty
    const grossTotal = (drinkUnitPrice + addOnCostPerUnit) * qty
    let totalDiscount = 0
    if (itemDiscountType === 'percent' && itemDiscountValue !== '')
      totalDiscount = drinkUnitPrice * qty * (Number(itemDiscountValue) / 100)
    else if (itemDiscountType === 'fixed' && itemDiscountValue !== '')
      totalDiscount = Math.min(Number(itemDiscountValue), drinkUnitPrice * qty)
    return Math.max(0, grossTotal - totalDiscount)
  }

  // ── Confirm order ──────────────────────────────────────────────────────────

  const handleConfirmOrder = () => {
    if (cart.length === 0) return
    setIsConfirmModalOpen(false)
    setCustomerName('')
    setIsCustomerNameModalOpen(true)
  }

  const handleSubmitOrder = async (nameOverride?: string) => {
    setSubmitting(true)

    let scDiscountAmount = 0
    let pwdDiscountAmount = 0
    const diplomatDiscountAmount = 0

    cart.forEach((item, cartIndex) => {
      const assignments = itemPaxAssignments[String(cartIndex)] ?? []
      assignments.forEach(assignment => {
        if (assignment === 'none') return
        const unitPrice = Number(item.price)
        const vatExcl = isVat ? unitPrice / 1.12 : unitPrice
        const pct = assignment === 'sc' ? scPct : pwdPct
        const amt = vatExcl * (pct / 100)
        if (assignment === 'sc') scDiscountAmount += amt
        if (assignment === 'pwd') pwdDiscountAmount += amt
      })
    })

    const otherDiscountAmount = selectedDiscount
      ? selectedDiscount.type.includes('Percent')
        ? eligibleForPromo * (Number(selectedDiscount.amount) / 100)
        : Number(selectedDiscount.amount)
      : 0

    const orderData = {
      si_number: orNumber,
      branch_id: branchId,
      order_type: orderType ?? 'take-out',
      items: cart.map(item => ({
        menu_item_id: item.isBundle ? null : item.id,
        bundle_id: item.isBundle ? Number(item.bundleId) : null,
        bundle_components: item.isBundle ? (item.bundleComponents ?? []) : null,
        name: item.name,
        quantity: item.qty,
        unit_price: Number(item.price),
        total_price: item.finalPrice + getItemSurcharge(item),
        size: item.size !== 'none' ? item.size : null,
        cup_size_label: item.cupSizeLabel ?? null,
        sugar_level: item.sugarLevel || null,
        options: item.options || [],
        add_ons: item.addOns || [],
        remarks: item.remarks || null,
        charges: { grab: item.charges.grab, panda: item.charges.panda },
        discount_id: item.discountId ?? null,
        discount_label: item.discountLabel ?? null,
        discount_type: item.discountType ?? null,
        discount_value: item.discountValue !== '' ? item.discountValue : null,
      })),
      subtotal,
      discount_amount: orderLevelDiscount,
      sc_discount_amount: round(scDiscountAmount),
      pwd_discount_amount: round(pwdDiscountAmount),
      diplomat_discount_amount: round(diplomatDiscountAmount),
      other_discount_amount: otherDiscountAmount,
      discount_id: selectedDiscount?.id ?? null,
      pax_discount_ids: selectedDiscounts.map(d => d.id).join(',') || null,
      total: amtDue,
      cashier_name: cashierName ?? 'Admin',
      payment_method: paymentMethod,
      reference_number: referenceNumber || null,
      discount_remarks: discountRemarks || null,
      vatable_sales: vatableSales,
      vat_amount: vatAmount,
      vat_exempt_sales: vatExemptSales,
      customer_name: nameOverride ?? customerName ?? null,
      cash_tendered: typeof cashTendered === 'number' ? cashTendered : 0,
      pax_senior: paxSenior,
      pax_pwd: paxPwd,
      // FIX #3 — join the arrays to strings to match the backend's expected scalar fields
      senior_id: seniorIds.length > 0 ? seniorIds.join(',') : null,
      pwd_id: pwdIds.length > 0 ? pwdIds.join(',') : null,
    }

    if (navigator.onLine) {
      try {
        await api.post('/sales', orderData);
        localStorage.removeItem('pos_cart_cache');
        const currentSeq = parseInt(orNumber.split('-').pop() ?? '0', 10)
        if (!isNaN(currentSeq)) {
          localStorage.setItem(seqKey, String(currentSeq))
        }

        const currentQueue = parseInt(queueNumber, 10)
        if (!isNaN(currentQueue)) {
          localStorage.setItem(queueKey, String(currentQueue + 1))
          localStorage.setItem(queueDate, new Date().toDateString())
        }
        localStorage.setItem('dashboard_stats_timestamp', '0');
        const today = new Date().toISOString().split('T')[0];
        Promise.all([
          api.get('/dashboard/stats').then(res => {
            localStorage.setItem('dashboard_stats', JSON.stringify(res.data))
            localStorage.setItem('dashboard_stats_timestamp', Date.now().toString())
          }),
          api.get('/inventory'),
          api.get('/receipts/search', { params: { query: '', date: today } }).then(res => {
            const data = Array.isArray(res.data) ? res.data : res.data.data || []
            sessionStorage.setItem('lucky_boba_receipt_cache_results', JSON.stringify(data))
            sessionStorage.setItem('lucky_boba_receipt_cache_query', '')
            sessionStorage.setItem('lucky_boba_receipt_cache_date', today)
          }),
        ]).catch(e => console.error('Failed to fetch fresh data', e))
        setPrintedReceipt(false)
        setPrintedKitchen(false)
        setPrintedStickers(false)
        setIsSuccessModalOpen(true)
        showToast('Order saved successfully!', 'success')
      } catch (err) {
        const axiosErr = err as { response?: { data?: unknown } }
        console.error('422 detail:', axiosErr?.response?.data)
        enqueue(orderData)
        localStorage.removeItem('pos_cart_cache')
        setPrintedReceipt(false)
        setPrintedKitchen(false)
        setPrintedStickers(false)
        setIsSuccessModalOpen(true)
        showToast('Order saved locally — will sync when server is available.', 'warning')
      }
    } else {
      enqueue(orderData)
      const currentSeq = parseInt(orNumber.replace('SI-', ''), 10)
      if (!isNaN(currentSeq)) {
        localStorage.setItem(seqKey, String(currentSeq))
      }
      const currentQueue = parseInt(queueNumber, 10)
      if (!isNaN(currentQueue)) {
        localStorage.setItem(queueKey, String(currentQueue + 1))
        localStorage.setItem(queueDate, new Date().toDateString())
      }
      setPrintedReceipt(false); setPrintedKitchen(false); setPrintedStickers(false)
      setIsSuccessModalOpen(true)
      showToast('Offline — order queued and will sync when connected.', 'warning')
    }

    setSubmitting(false)
  }

  // ── Print handlers ─────────────────────────────────────────────────────────

  const handlePrintReceipt = () => {
    setPrintTarget('receipt')
    setPrintedReceipt(true)
    setTimeout(() => window.print(), 100)
  }
  const handlePrintKitchen = () => {
    setPrintTarget('kitchen')
    setPrintedKitchen(true)
    setTimeout(() => window.print(), 100)
  }
  const handlePrintStickers = () => {
    setPrintTarget('stickers')
    setPrintedStickers(true)
    setTimeout(() => window.print(), 100)
  }

  // ── New order ──────────────────────────────────────────────────────────────

  const handleNewOrder = async () => {
    setCart([])
    localStorage.removeItem('pos_cart_cache')
    setOrderType(null)
    setOrderCharge(null)
    setCashTendered('')
    setPaymentMethod('cash')
    setReferenceNumber('')
    setSelectedDiscount(null)
    setSelectedDiscounts([])
    setItemPaxAssignments({})
    setIsSuccessModalOpen(false)
    setPrintTarget(null)
    setPrintedReceipt(false)
    setPrintedKitchen(false)
    setPrintedStickers(false)
    setSelectedCategory(null)
    setCategorySize(null)
    setDiscountRemarks('')
    setCustomerName('')
    setIsMixMatchModalOpen(false)
    setPendingMixMatchCart(null)
    setSelectedMixMatchDrink(null)
    setMixMatchDrinkSugar('')
    setMixMatchDrinkOptions([])
    setMixMatchDrinkAddOns([])
    setSeniorIds([])
    setPwdIds([])
    await syncNextSequence()
  }

  // ── Filtered categories ────────────────────────────────────────────────────

  const GROUP_TYPES: Record<string, string[]> = {
    drinks:        ['drink'],
    bundles:       ['bundle'],
    food:          ['food', 'combo', 'waffle', 'wings'],
    mix_and_match: ['mix_and_match'],
    others:        ['promo', 'other'],
  };

  const filteredCategories = categories
    .map(cat => {
      const matchedItems = cat.menu_items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      const enrichedItems = searchQuery
        ? matchedItems.map(item => {
            if (!item.size || item.size === 'none') return item
            const cupM = cat.cup?.size_m ?? 'M'
            const cupL = cat.cup?.size_l ?? 'L'
            const sizeLabel = item.size === 'L' ? cupL : cupM
            return { ...item, name: `${item.name} (${sizeLabel})` }
          })
        : matchedItems
      return { ...cat, menu_items: enrichedItems }
    })
    .filter(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || cat.menu_items.length > 0)
    .filter(cat => {
      if (!activeCategoryGroup) return true;
      const allowed = GROUP_TYPES[activeCategoryGroup] ?? [];
      return allowed.includes(cat.category_type ?? cat.type ?? '');
    });

  // ── Loading screen ─────────────────────────────────────────────────────────

  if (checkingCashIn || isMenuLoading)
    return (
      <div className="h-screen flex items-center justify-center font-black text-[#3b2063] bg-[#f4f2fb]">
        <div className="text-center">
          <DrinkIcon className="w-16 h-16 mx-auto mb-4 text-[#3b2063]/30 animate-pulse" />
          <div className="text-sm tracking-widest uppercase opacity-50">Loading...</div>
        </div>
      </div>
    )

  // ── Shared print props ─────────────────────────────────────────────────────

  const printProps = {
    cart,
    branchName,
    orNumber,
    queueNumber,
    cashierName,
    formattedDate,
    formattedTime,
    terminalNumber,
    orderType: orderType ?? 'take-out',
    customerName,
    paxSenior,
    paxPwd,
    // FIX #3 — pass the arrays directly; ReceiptPrint now accepts string[]
    seniorIds,
    pwdIds,
  }

  if (!orderType) {
    return (
      <OrderTypeModal
        onSelect={type => {
          setOrderType(type)
          localStorage.setItem('order_type', type)
        }}
      />
    )
  }

  return (
    <>
      <style>{`
        @media print {
          @page { ${printTarget === 'stickers' ? 'size: 38.5mm 50.8mm;' : 'size: 80mm auto;'} margin: 0 !important; }
          html, body { margin: 0 !important; padding: 0 !important; }
          body * { visibility: hidden; }
          nav, header, aside, button, .print\\:hidden { display: none !important; }
          img { display: block !important; }
          .printable-receipt-container, .printable-receipt-container * { visibility: visible !important; }
          .printable-receipt-container {
            position: static !important;
            width: 100% !important;
            max-width: ${printTarget === 'stickers' ? '38.5mm' : '76mm'} !important;
            margin: 0 !important; padding: 0 !important;
            height: auto !important;
          }
          .receipt-area { width: 66mm !important; margin: 0 auto !important; padding: 2mm 0 !important; box-sizing: border-box !important; color: #000 !important; font-family: Arial, Helvetica, sans-serif !important; font-size: 12px !important; line-height: 1.4 !important; }
          .sticker-area { width: 38.5mm !important; height: 50.8mm !important; padding: 2mm !important; margin: 0 auto !important; box-sizing: border-box !important; color: #000 !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; align-items: center !important; text-align: center !important; font-family: Arial, Helvetica, sans-serif !important; overflow: hidden !important; page-break-after: always !important; break-after: page !important; }
          .queue-stub { page-break-before: always !important; break-before: page !important; }
        }
      `}</style>

      <div className="flex flex-col h-screen w-screen bg-[#f4f2fb] relative overflow-hidden font-sans print:hidden">
        {editingCartItem && editingCartIndex !== null && (
          <CartItemEditModal
            editingCartItem={editingCartItem}
            itemDiscountType={itemDiscountType}
            itemDiscountValue={itemDiscountValue}
            editingItemDiscountId={editingItemDiscountId}
            discounts={discounts}
            computeDiscountedTotal={computeDiscountedTotal}
            onAdjustQty={adjustEditQty}
            onSetDiscountId={setEditingItemDiscountId}
            onSetDiscountType={setItemDiscountType}
            onSetDiscountValue={setItemDiscountValue}
            onSave={saveCartItemEdit}
            onRemove={removeEditingItem}
            onClose={closeCartItemEdit}
          />
        )}

        {selectedItem && !isAddOnModalOpen && !isConfirmModalOpen && !isSuccessModalOpen && (
          <ItemSelectionModal
            selectedItem={selectedItem as unknown as CartItem}
            qty={qty} remarks={remarks} sugarLevel={sugarLevel}
            selectedOptions={selectedOptions} selectedAddOns={selectedAddOns}
            orderCharge={orderCharge} isDrink={isDrink} isCombo={isCombo} isWaffleCategory={isWaffleCategory}
            onQtyChange={setQty} onRemarksChange={setRemarks} onSugarChange={setSugarLevel}
            onToggleOption={toggleOption} onToggleOrderCharge={toggleOrderCharge}
            isFoodCategory={isFoodCategory}
            filteredAddOns={filteredAddOns}
            onOpenAddOns={() => setIsAddOnModalOpen(true)} onAddToOrder={addToOrder}
            onClose={() => {
              setSelectedItem(null)
              setIsAddOnModalOpen(false)
              if (searchQuery.trim()) setSelectedCategory(null)
            }}
            sugarLevels={isDrink ? sugarLevels : []}
          />
        )}

        {isAddOnModalOpen && (
          <AddOnModalShell
            title="Select Add-ons"
            addOns={filteredAddOns}
            selected={selectedAddOns}
            onToggle={toggleAddOn}
            onClose={() => setIsAddOnModalOpen(false)}
            zIndex="z-[110]"
            orderCharge={orderCharge}
          />
        )}

        {isBundleModalOpen &&
          activeBundleItem &&
          (() => {
            const bundleMenuItem = categories
              .flatMap(c => c.menu_items)
              .find(m => m.barcode === activeBundleItem.barcode)
            const bundleGrabPrice = Number(activeBundleItem.grab_price || bundleMenuItem?.grab_price || 0)
            const bundlePandaPrice = Number(activeBundleItem.panda_price || bundleMenuItem?.panda_price || 0)
            return (
              <BundleModal
                activeBundleItem={activeBundleItem}
                bundleComponentIndex={bundleComponentIndex}
                bundleComponentSugar={bundleComponentSugar}
                bundleComponentOptions={bundleComponentOptions}
                bundleComponentAddOns={bundleComponentAddOns}
                sugarLevels={sugarLevels}
                filteredAddOns={filteredAddOns}
                bundleComponentAddOnModalOpen={bundleComponentAddOnModalOpen}
                onSugarChange={setBundleComponentSugar}
                onToggleOption={makeToggleOption(setBundleComponentOptions)}
                onOpenAddOns={() => setBundleComponentAddOnModalOpen(true)}
                onCloseAddOns={() => setBundleComponentAddOnModalOpen(false)}
                onToggleAddOn={name =>
                  setBundleComponentAddOns(prev =>
                    prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
                  )
                }
                onConfirm={confirmBundleComponent}
                onClose={() => {
                  setIsBundleModalOpen(false)
                  setActiveBundleItem(null)
                  if (searchQuery.trim()) setSelectedCategory(null)
                }}
                orderCharge={orderCharge}
                onToggleOrderCharge={toggleBundleOrderCharge}
                bundleGrabPrice={bundleGrabPrice}
                bundlePandaPrice={bundlePandaPrice}
              />
            )
          })()}

        {isCombodrinkModalOpen && pendingComboCart && (
          <ComboDrinkModal
            pendingComboCart={pendingComboCart}
            sugarLevels={sugarLevels}
            comboDrinkSugar={comboDrinkSugar}
            comboDrinkOptions={comboDrinkOptions}
            comboDrinkAddOns={comboDrinkAddOns}
            filteredAddOns={filteredAddOns}
            comboDrinkAddOnModalOpen={comboDrinkAddOnModalOpen}
            onSugarChange={setComboDrinkSugar}
            onToggleOption={toggleComboDrinkOption}
            onOpenAddOns={() => setComboDrinkAddOnModalOpen(true)}
            onCloseAddOns={() => setComboDrinkAddOnModalOpen(false)}
            onToggleAddOn={name =>
              setComboDrinkAddOns(prev => (prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]))
            }
            onConfirm={confirmComboDrink}
            onClose={() => {
              setIsCombodrinkModalOpen(false)
              setPendingComboCart(null)
              if (searchQuery.trim()) setSelectedCategory(null)
            }}
            orderCharge={orderCharge}
          />
        )}

        {isMixMatchModalOpen && pendingMixMatchCart && (
          <MixAndMatchDrinkModal
            pendingMixMatchCart={pendingMixMatchCart}
            drinkItems={mixMatchDrinkItems}
            selectedDrink={selectedMixMatchDrink}
            drinkSugarLevels={sugarLevels}
            drinkSugar={mixMatchDrinkSugar}
            drinkOptions={mixMatchDrinkOptions}
            drinkAddOns={mixMatchDrinkAddOns}
            filteredAddOns={filteredAddOns}
            drinkAddOnModalOpen={mixMatchDrinkAddOnOpen}
            orderCharge={orderCharge}
            onSelectDrink={item => {
              setSelectedMixMatchDrink(item ?? null)
              setMixMatchDrinkSugar('')
              setMixMatchDrinkOptions([])
            }}
            onSugarChange={setMixMatchDrinkSugar}
            onToggleOption={makeToggleOption(setMixMatchDrinkOptions)}
            onOpenAddOns={() => setMixMatchDrinkAddOnOpen(true)}
            onCloseAddOns={() => setMixMatchDrinkAddOnOpen(false)}
            onToggleAddOn={name =>
              setMixMatchDrinkAddOns(prev => (prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]))
            }
            onToggleOrderCharge={toggleOrderCharge}
            onConfirm={confirmMixAndMatch}
            onClose={() => {
              setIsMixMatchModalOpen(false)
              setPendingMixMatchCart(null)
              if (searchQuery.trim()) setSelectedCategory(null)
            }}
          />
        )}

        {isConfirmModalOpen && (
          <ConfirmOrderModal
            cart={cart}
            cashierName={cashierName}
            totalCount={totalCount}
            subtotal={grossSubtotal}
            amtDue={amtDue}
            addOnsData={addOnsData}
            vatableSales={vatableSales}
            vatAmount={vatAmount}
            vatExemptSales={vatExemptSales}
            change={change}
            totalDiscountDisplay={totalDiscountDisplay}
            orderCharge={orderCharge}
            selectedDiscount={selectedDiscount}
            selectedDiscounts={selectedDiscounts}
            paymentMethod={paymentMethod}
            cashTendered={cashTendered}
            referenceNumber={referenceNumber}
            discountRemarks={discountRemarks}
            itemPaxAssignments={itemPaxAssignments}
            seniorIds={seniorIds}
            pwdIds={pwdIds}
            discounts={discounts}
            activeTab={activeTab as 'payment' | 'discount' | 'pax'}
            submitting={submitting}
            onTabChange={t => setActiveTab(t as 'payment' | 'discount' | 'pax')}
            onPaymentMethodChange={setPaymentMethod}
            onCashTenderedChange={setCashTendered}
            onReferenceNumberChange={setReferenceNumber}
            onDiscountChange={setSelectedDiscount}
            onDiscountRemarksChange={setDiscountRemarks}
            onItemPaxAssignmentsChange={setItemPaxAssignments}
            onSeniorIdsChange={setSeniorIds}
            onPwdIdsChange={setPwdIds}
            onEditCartItem={openCartItemEdit}
            onConfirm={handleConfirmOrder}
            onClose={() => setIsConfirmModalOpen(false)}
            vatType={vatType}
          />
        )}

        {isCustomerNameModalOpen && (
          <CustomerNameModal
            customerName={customerName}
            onChange={setCustomerName}
            onSkip={() => {
              setIsCustomerNameModalOpen(false)
              handleSubmitOrder('')
            }}
            onConfirm={() => {
              setIsCustomerNameModalOpen(false)
              handleSubmitOrder(customerName)
            }}
          />
        )}

        {isSuccessModalOpen && (
          <SuccessModal
            orNumber={orNumber}
            hasStickers={hasStickers}
            printedReceipt={printedReceipt}
            printedKitchen={printedKitchen}
            printedStickers={printedStickers}
            onPrintReceipt={handlePrintReceipt}
            onPrintKitchen={handlePrintKitchen}
            onPrintStickers={handlePrintStickers}
            onNewOrder={handleNewOrder}
          />
        )}

        <Header
          branchName={branchName}
          cashierName={cashierName}
          formattedDate={formattedDate}
          formattedTime={formattedTime}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onHomeClick={() => handleNavClick('Home')}
          onRefresh={fetchMenu}
          isRefreshing={isMenuLoading}
        />

        <OfflineQueueBanner
          isOnline={isOnline}
          queue={queue}
          queueCount={queueCount}
          isSyncing={isSyncing}
          syncNow={syncNow}
          remove={remove}
        />

        {/* ── Category nav bar ───────────────────────────────────────────── */}
        <div className="flex flex-col bg-white border-b border-zinc-200 print:hidden z-10 shrink-0">
          <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-none">

            <span
              className={`text-sm font-semibold shrink-0 cursor-pointer transition-colors px-3 py-2 rounded-lg ${
                !selectedCategory
                  ? 'text-[#7c14d4] bg-[#7c14d4]/10'
                  : 'text-zinc-400 hover:text-[#7c14d4] hover:bg-zinc-100'
              }`}
              onClick={() => { setSelectedCategory(null); setCategorySize(null); setActiveCategoryGroup(null); }}
            >
              All
            </span>

            {selectedCategory && (
              <>
                <ChevronRight size={11} className="text-zinc-300 shrink-0" />
                <span
                  className={`text-xs font-semibold shrink-0 px-2 py-1.5 rounded-lg transition-colors ${
                    !categorySize
                      ? 'text-[#3b2063] bg-[#3b2063]/10'
                      : 'text-zinc-400 hover:text-[#3b2063] hover:bg-zinc-100 cursor-pointer'
                  }`}
                  onClick={() => { if (categorySize && !categoryHasOnlyOneSize) setCategorySize(null); }}
                >
                  {selectedCategory.name}
                </span>
              </>
            )}

            {selectedCategory && categorySize && !categoryHasOnlyOneSize && (
              <>
                <ChevronRight size={11} className="text-zinc-300 shrink-0" />
                <span className="text-xs font-bold text-[#3b2063] bg-[#3b2063]/10 px-2 py-1.5 rounded-lg shrink-0">
                  {categorySize}
                </span>
              </>
            )}

            {!selectedCategory && (
              <div className="w-px h-4 bg-zinc-200 mx-1 shrink-0" />
            )}

            {!selectedCategory && [
              { key: 'drinks',        label: 'Drinks' },
              { key: 'bundles',       label: 'Bundles' },
              { key: 'food',          label: 'Food' },
              { key: 'mix_and_match', label: 'Mix & Match' },
              { key: 'others',        label: 'Others' },
            ].map(group => {
              const isActive = activeCategoryGroup === group.key;
              const count = filteredCategories.filter(c =>
                (GROUP_TYPES[group.key] ?? []).includes(c.category_type ?? c.type ?? '')
              ).length;
              if (count === 0) return null;
              return (
                <button
                  key={group.key}
                  onClick={() => setActiveCategoryGroup(isActive ? null : group.key)}
                  className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all border ${
                    isActive
                      ? 'bg-[#3b2063] text-white border-[#3b2063] shadow-sm'
                      : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-[#3b2063]/40 hover:text-[#3b2063] hover:bg-violet-50'
                  }`}
                >
                  <span>{group.label}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/25 text-white' : 'bg-zinc-200 text-zinc-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative z-10">
          <MenuArea
            menuAvailable={menuAvailable}
            selectedCategory={selectedCategory}
            categorySize={categorySize}
            searchQuery={searchQuery}
            filteredCategories={filteredCategories}
            isWings={isWings}
            categoryHasOnlyOneSize={categoryHasOnlyOneSize}
            isDrink={isDrink}
            getFilteredItems={getFilteredItems}
            onCategoryClick={handleCategoryClick}
            onItemClick={handleItemClick}
            onSizeSelect={setCategorySize}
            onBack={handleBack}
          />
          <CartSidebar
            cart={cart}
            cashierName={cashierName}
            orNumber={orNumber}
            terminalNumber={terminalNumber}
            totalCount={totalCount}
            subtotal={subtotal}
            onEditItem={openCartItemEdit}
            onConfirmOrder={() => {
              if (orderCharge === 'grab') setPaymentMethod('grab')
              else if (orderCharge === 'panda') setPaymentMethod('food_panda')
              else setPaymentMethod('cash')
              setIsConfirmModalOpen(true)
            }}
          />
        </div>
      </div>

      {printTarget === 'receipt' && (
        <ReceiptPrint
          {...printProps}
          {...branchDetails}
          ownerName={branchDetails.owner_name}
          vatType={vatType}
          addOnsData={addOnsData}
          orderCharge={orderCharge}
          totalCount={totalCount}
          subtotal={grossSubtotal}
          amtDue={amtDue}
          vatableSales={vatableSales}
          vatAmount={vatAmount}
          vatExemptSales={vatExemptSales}
          change={change}
          cashTendered={cashTendered}
          referenceNumber={referenceNumber}
          paymentMethod={paymentMethod}
          selectedDiscount={selectedDiscount}
          selectedDiscounts={selectedDiscounts}
          totalDiscountDisplay={totalDiscountDisplay}
          itemDiscountTotal={itemDiscountTotal}
          promoDiscount={promoDiscount}
          itemPaxAssignments={itemPaxAssignments}
          posFooter={posFooter}
          receiptFooter={posFooter.receipt_footer}
          businessName={posFooter.business_name}
          businessEmail={posFooter.contact_email}
          businessPhone={posFooter.contact_phone}
          businessAddress={posFooter.address}
        />
      )}
      {printTarget === 'kitchen'  && <KitchenPrint  {...printProps} />}
      {printTarget === 'stickers' && <StickerPrint  {...printProps} customerName={customerName} />}
    </>
  )
}

export default SalesOrder