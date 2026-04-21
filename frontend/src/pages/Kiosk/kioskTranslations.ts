// --- Kiosk Multi-Language Translation System ---

export type KioskLanguage = 'English' | 'Filipino' | 'Chinese' | 'Korean';

interface TranslationStrings {
  // Splash / Landing
  splashHeadline1: string;
  splashHeadline2: string;
  splashHeadline3: string;
  splashSubtitle: string;
  splashCTA: string;
  splashSignatureFlavors: string;
  splashOrganicTeaBase: string;
  splashOrderingHours: string;

  // Order Type
  orderTypeTitle1: string;
  orderTypeTitle2: string;
  orderTypeSubtitle: string;
  eatHere: string;
  takeOut: string;
  restart: string;

  // Menu
  categories: string;
  pickYourVibe: string;
  allMenu: string;
  searchPlaceholder: string;
  pickYourHappiness1: string;
  pickYourHappiness2: string;
  menuSubtitle: string;
  bestseller: string;
  freshDescription: string;
  quickAdd: string;
  recommendedForYou: string;
  searchResults: string;
  noItemsFound: string;
  cancelOrder: string;

  // Cart
  myOrder: string;
  yourTrayEmpty: string;
  sugar: string;
  totalAmount: string;
  checkout: string;
  processing: string;
  clearOrder: string;
  item: string;
  items: string;

  // Customization
  selectSugar: string;
  addToppings: string;
  addToTray: string;
  total: string;

  // Mix & Match
  chooseYourDrink: string;
  customizeYourCombo: string;
  customizeDrink: string;
  loadingCollection: string;
  noDrinksAvailable: string;
  selectSugarLevel: string;
  drinkOptions: string;
  iceLevel: string;
  pearlPreference: string;
  extraToppings: string;
  backToSelection: string;
  comboTotal: string;
  bundleTotal: string;
  addOns: string;

  // Confirm
  confirmTitle1: string;
  confirmTitle2: string;
  proceedToCounter: string;
  yourTicketNumber: string;
  totalDue: string;
  newOrder: string;

  // Branch Selector
  kioskSetup: string;
  selectBranchDevice: string;
  searchBranchPlaceholder: string;
  active: string;
  selected: string;
  noAddressProvided: string;
  selectBranch: string;
  noBranchesFound: string;
  confirmBranch: string;
  confirmBranchMessage: string;
  cancel: string;
  confirm: string;

  // Error & Loading
  orderFailed: string;
  orderFailedMessage: string;
  tryAgain: string;
  processingLoader: string;

  // Admin
  accessControl: string;
  enterAdminPin: string;
  incorrectPin: string;
  clear: string;
  exit: string;
  adminSettings: string;
  expoMode: string;
  expoModeDesc: string;
  enabled: string;
  disabled: string;
  selectExpoItems: string;
  expoItemsDesc: string;
  searchExpoPlaceholder: string;
  all: string;
  noItemsLoaded: string;
  resetLocation: string;
  unbindDevice: string;
  resetNow: string;
  closeSettings: string;
  // Bundle Configuration
  bundleConfigTitle: string;
  bundleItemStep: string;
  nextItem: string;
  confirmBundle: string;
}

type TranslationMap = Record<KioskLanguage, TranslationStrings>;

export const translations: TranslationMap = {
  English: {
    // Splash
    splashHeadline1: 'Freshly',
    splashHeadline2: 'Brewed',
    splashHeadline3: 'Happiness.',
    splashSubtitle: 'Experience the ultimate boba journey',
    splashCTA: 'Tap to Start',
    splashSignatureFlavors: 'Signature Flavors',
    splashOrganicTeaBase: 'Organic Tea Base',
    splashOrderingHours: 'Ordering hours: 10:00 AM - 10:00 PM',

    // Order Type
    orderTypeTitle1: 'How will you enjoy',
    orderTypeTitle2: 'your Boba?',
    orderTypeSubtitle: 'Select your dining preference',
    eatHere: 'Eat Here',
    takeOut: 'Take Out',
    restart: 'Restart',

    // Menu
    categories: 'Categories',
    pickYourVibe: 'Pick your vibe',
    allMenu: 'All Menu',
    searchPlaceholder: 'Search beverages...',
    pickYourHappiness1: 'Pick Your',
    pickYourHappiness2: 'Happiness',
    menuSubtitle: 'The perfect blend of flavor and joy, crafted just for your afternoon boost.',
    bestseller: 'Bestseller',
    freshDescription: 'Freshly crafted with premium ingredients.',
    quickAdd: 'Quick Add',
    recommendedForYou: 'Recommended for You',
    searchResults: 'Search Results',
    noItemsFound: 'No items found',
    cancelOrder: 'Cancel Order',

    // Cart
    myOrder: 'My Order',
    yourTrayEmpty: 'Your tray is empty',
    sugar: 'Sugar',
    totalAmount: 'Total Amount',
    checkout: 'Checkout',
    processing: 'Processing...',
    clearOrder: 'Clear Order',
    item: 'item',
    items: 'items',

    // Customization
    selectSugar: 'Select Sugar',
    addToppings: 'Add Toppings',
    addToTray: 'Add to Tray',
    total: 'Total',

    // Mix & Match
    chooseYourDrink: 'Choose Your Drink',
    customizeYourCombo: 'Customize Your Combo',
    customizeDrink: 'Customize Drink',
    loadingCollection: 'Loading collection...',
    noDrinksAvailable: 'No drinks available for this bundle.',
    selectSugarLevel: 'Select Sugar Level',
    drinkOptions: 'Drink Options',
    iceLevel: 'Ice Level',
    pearlPreference: 'Pearl Preference',
    extraToppings: 'Extra Toppings',
    backToSelection: 'Back to Selection',
    comboTotal: 'Combo Total',
    bundleTotal: 'Bundle Total',
    addOns: 'Add-ons',

    // Confirm
    confirmTitle1: 'Order',
    confirmTitle2: 'Received',
    proceedToCounter: 'Please proceed to counter to pay',
    yourTicketNumber: 'Your Ticket Number',
    totalDue: 'Total Due',
    newOrder: 'New Order',

    // Branch
    kioskSetup: 'Kiosk Setup',
    selectBranchDevice: 'Select the branch for this device',
    searchBranchPlaceholder: 'Search by name or address...',
    active: 'Active',
    selected: 'Selected',
    noAddressProvided: 'No address provided',
    selectBranch: 'Select Branch',
    noBranchesFound: 'No branches found matching your search',
    confirmBranch: 'Confirm Branch',
    confirmBranchMessage: 'This will bind the device to this location.',
    cancel: 'Cancel',
    confirm: 'Confirm',

    // Error
    orderFailed: 'Order Failed',
    orderFailedMessage: 'Failed to place order. Please call staff for assistance.',
    tryAgain: 'Try Again',
    processingLoader: 'Processing...',

    // Admin
    accessControl: 'Access Control',
    enterAdminPin: 'Enter Admin Security PIN to reset Kiosk settings.',
    incorrectPin: 'Incorrect PIN',
    clear: 'Clear',
    exit: 'Exit',
    adminSettings: 'Admin Settings',
    expoMode: 'Expo Mode',
    expoModeDesc: 'Limit the menu to specific items only.',
    enabled: 'Enabled',
    disabled: 'Disabled',
    selectExpoItems: 'Select Expo Items',
    expoItemsDesc: 'Click to toggle items for the Expo.',
    searchExpoPlaceholder: 'Search items to add to Expo...',
    all: 'All',
    noItemsLoaded: 'No items loaded for this branch.',
    resetLocation: 'Reset Location',
    unbindDevice: 'Unbind this device.',
    resetNow: 'Reset Now',
    closeSettings: 'Close Settings',
    bundleConfigTitle: 'Customize Your Bundle',
    bundleItemStep: 'Step',
    nextItem: 'Next Item',
    confirmBundle: 'Confirm Bundle',
  },

  Filipino: {
    // Splash
    splashHeadline1: 'Sariwang',
    splashHeadline2: 'Timpla',
    splashHeadline3: 'ng Saya.',
    splashSubtitle: 'Damhin ang pinakamasarap na boba',
    splashCTA: 'Umorder Na',
    splashSignatureFlavors: 'Espesyal na Lasa',
    splashOrganicTeaBase: 'Organikong Tsaa',
    splashOrderingHours: 'Oras ng pagorder: 10:00 AM - 10:00 PM',

    // Order Type
    orderTypeTitle1: 'Paano mo gustong',
    orderTypeTitle2: 'i-enjoy ang Boba?',
    orderTypeSubtitle: 'Piliin ang iyong kagustuhan',
    eatHere: 'Dito Kain',
    takeOut: 'Take Out',
    restart: 'Ulitin',

    // Menu
    categories: 'Mga Kategorya',
    pickYourVibe: 'Piliin ang iyong gusto',
    allMenu: 'Lahat ng Menu',
    searchPlaceholder: 'Hanapin ang inumin...',
    pickYourHappiness1: 'Piliin ang Iyong',
    pickYourHappiness2: 'Kaligayahan',
    menuSubtitle: 'Perpektong timpla ng lasa at saya, para sa iyong hapon.',
    bestseller: 'Pinakabenta',
    freshDescription: 'Sariwang gawa gamit ang mga premium na sangkap.',
    quickAdd: 'Idagdag',
    recommendedForYou: 'Inirerekomenda para sa Iyo',
    searchResults: 'Resulta ng Paghahanap',
    noItemsFound: 'Walang nahanap na item',
    cancelOrder: 'Kanselahin',

    // Cart
    myOrder: 'Aking Order',
    yourTrayEmpty: 'Walang laman ang iyong tray',
    sugar: 'Asukal',
    totalAmount: 'Kabuuang Halaga',
    checkout: 'Mag-checkout',
    processing: 'Pinoproseso...',
    clearOrder: 'Burahin ang Order',
    item: 'item',
    items: 'items',

    // Customization
    selectSugar: 'Piliin ang Asukal',
    addToppings: 'Magdagdag ng Toppings',
    addToTray: 'Idagdag sa Tray',
    total: 'Kabuuan',

    // Mix & Match
    chooseYourDrink: 'Pumili ng Inumin',
    customizeYourCombo: 'I-customize ang Combo',
    customizeDrink: 'I-customize ang Inumin',
    loadingCollection: 'Nagloload ng koleksyon...',
    noDrinksAvailable: 'Walang available na inumin para sa bundle na ito.',
    selectSugarLevel: 'Piliin ang Antas ng Tamis',
    drinkOptions: 'Mga Pagpipilian sa Inumin',
    iceLevel: 'Antas ng Yelo',
    pearlPreference: 'Pagpipilian ng Pearl',
    extraToppings: 'Karagdagang Toppings',
    backToSelection: 'Bumalik sa Pagpili',
    comboTotal: 'Kabuuan ng Combo',
    bundleTotal: 'Kabuuan ng Bundle',
    addOns: 'Mga Add-on',

    // Confirm
    confirmTitle1: 'Order',
    confirmTitle2: 'Natanggap',
    proceedToCounter: 'Pumunta sa counter para magbayad',
    yourTicketNumber: 'Ang Iyong Ticket Number',
    totalDue: 'Kabuuang Babayaran',
    newOrder: 'Bagong Order',

    // Branch
    kioskSetup: 'Pag-setup ng Kiosk',
    selectBranchDevice: 'Piliin ang branch para sa device na ito',
    searchBranchPlaceholder: 'Maghanap sa pangalan o address...',
    active: 'Aktibo',
    selected: 'Napili',
    noAddressProvided: 'Walang address',
    selectBranch: 'Pumili ng Branch',
    noBranchesFound: 'Walang nahanap na branch',
    confirmBranch: 'Kumpirmahin ang Branch',
    confirmBranchMessage: 'Ito ay mag-bind sa device sa lokasyon na ito.',
    cancel: 'Kanselahin',
    confirm: 'Kumpirmahin',

    // Error
    orderFailed: 'Hindi Na-process',
    orderFailedMessage: 'Hindi nai-submit ang order. Tawagin ang staff.',
    tryAgain: 'Subukan Ulit',
    processingLoader: 'Pinoproseso...',

    // Admin
    accessControl: 'Access Control',
    enterAdminPin: 'Ilagay ang Admin Security PIN para ma-reset ang Kiosk.',
    incorrectPin: 'Maling PIN',
    clear: 'Burahin',
    exit: 'Lumabas',
    adminSettings: 'Admin Settings',
    expoMode: 'Expo Mode',
    expoModeDesc: 'Limitahan ang menu sa mga piling item lang.',
    enabled: 'Naka-enable',
    disabled: 'Naka-disable',
    selectExpoItems: 'Piliin ang Expo Items',
    expoItemsDesc: 'I-click para i-toggle ang mga item para sa Expo.',
    searchExpoPlaceholder: 'Hanapin ang item na idadagdag sa Expo...',
    all: 'Lahat',
    noItemsLoaded: 'Walang naload na item para sa branch.',
    resetLocation: 'I-reset ang Lokasyon',
    unbindDevice: 'I-unbind ang device.',
    resetNow: 'I-reset Ngayon',
    closeSettings: 'Isara ang Settings',
    bundleConfigTitle: 'I-customize ang Iyong Bundle',
    bundleItemStep: 'Hahakbang',
    nextItem: 'Susunod na Item',
    confirmBundle: 'Kumpirmahin ang Bundle',
  },

  Chinese: {
    // Splash
    splashHeadline1: '新鲜',
    splashHeadline2: '现泡',
    splashHeadline3: '好心情。',
    splashSubtitle: '体验极致珍珠奶茶之旅',
    splashCTA: '点击开始',
    splashSignatureFlavors: '招牌风味',
    splashOrganicTeaBase: '有机茶底',
    splashOrderingHours: '营业时间: 10:00 AM - 10:00 PM',

    // Order Type
    orderTypeTitle1: '您想怎样享用',
    orderTypeTitle2: '您的波霸？',
    orderTypeSubtitle: '请选择用餐方式',
    eatHere: '堂食',
    takeOut: '外带',
    restart: '重新开始',

    // Menu
    categories: '分类',
    pickYourVibe: '选择您喜欢的',
    allMenu: '全部菜单',
    searchPlaceholder: '搜索饮品...',
    pickYourHappiness1: '选择您的',
    pickYourHappiness2: '幸福',
    menuSubtitle: '完美的风味与快乐融合，为您的午后注入活力。',
    bestseller: '畅销',
    freshDescription: '新鲜制作，优质原料。',
    quickAdd: '快速添加',
    recommendedForYou: '为您推荐',
    searchResults: '搜索结果',
    noItemsFound: '未找到商品',
    cancelOrder: '取消订单',

    // Cart
    myOrder: '我的订单',
    yourTrayEmpty: '您的托盘是空的',
    sugar: '糖',
    totalAmount: '总金额',
    checkout: '结账',
    processing: '处理中...',
    clearOrder: '清空订单',
    item: '件',
    items: '件',

    // Customization
    selectSugar: '选择甜度',
    addToppings: '添加配料',
    addToTray: '加入托盘',
    total: '合计',

    // Mix & Match
    chooseYourDrink: '选择您的饮品',
    customizeYourCombo: '定制您的套餐',
    customizeDrink: '定制饮品',
    loadingCollection: '正在加载...',
    noDrinksAvailable: '此套餐暂无可选饮品。',
    selectSugarLevel: '选择甜度',
    drinkOptions: '饮品选项',
    iceLevel: '冰量',
    pearlPreference: '珍珠选择',
    extraToppings: '额外配料',
    backToSelection: '返回选择',
    comboTotal: '套餐总计',
    bundleTotal: '组合总计',
    addOns: '加料',

    // Confirm
    confirmTitle1: '订单',
    confirmTitle2: '已接单',
    proceedToCounter: '请前往柜台付款',
    yourTicketNumber: '您的取餐号码',
    totalDue: '应付金额',
    newOrder: '新订单',

    // Branch
    kioskSetup: '自助机设置',
    selectBranchDevice: '请为此设备选择分店',
    searchBranchPlaceholder: '按名称或地址搜索...',
    active: '营业中',
    selected: '已选择',
    noAddressProvided: '未提供地址',
    selectBranch: '选择分店',
    noBranchesFound: '未找到匹配的分店',
    confirmBranch: '确认分店',
    confirmBranchMessage: '此操作将绑定设备至该位置。',
    cancel: '取消',
    confirm: '确认',

    // Error
    orderFailed: '下单失败',
    orderFailedMessage: '订单提交失败，请联系工作人员。',
    tryAgain: '重试',
    processingLoader: '处理中...',

    // Admin
    accessControl: '访问控制',
    enterAdminPin: '请输入管理员PIN码以重置自助机。',
    incorrectPin: 'PIN码错误',
    clear: '清除',
    exit: '退出',
    adminSettings: '管理设置',
    expoMode: '展览模式',
    expoModeDesc: '将菜单限制为指定商品。',
    enabled: '已启用',
    disabled: '已禁用',
    selectExpoItems: '选择展览商品',
    expoItemsDesc: '点击切换展览商品。',
    searchExpoPlaceholder: '搜索商品添加到展览...',
    all: '全部',
    noItemsLoaded: '此分店暂无加载商品。',
    resetLocation: '重置位置',
    unbindDevice: '解绑此设备。',
    resetNow: '立即重置',
    closeSettings: '关闭设置',
    bundleConfigTitle: '定制您的组合',
    bundleItemStep: '第',
    nextItem: '下一件',
    confirmBundle: '确认组合',
  },

  Korean: {
    // Splash
    splashHeadline1: '신선한',
    splashHeadline2: '보바',
    splashHeadline3: '행복.',
    splashSubtitle: '최고의 보바 여행을 경험하세요',
    splashCTA: '터치하여 시작',
    splashSignatureFlavors: '시그니처 맛',
    splashOrganicTeaBase: '유기농 티 베이스',
    splashOrderingHours: '주문 시간: 10:00 AM - 10:00 PM',

    // Order Type
    orderTypeTitle1: '어떻게 즐기시겠어요',
    orderTypeTitle2: '보바를?',
    orderTypeSubtitle: '식사 방법을 선택하세요',
    eatHere: '매장 식사',
    takeOut: '포장',
    restart: '다시 시작',

    // Menu
    categories: '카테고리',
    pickYourVibe: '원하는 것을 선택',
    allMenu: '전체 메뉴',
    searchPlaceholder: '음료 검색...',
    pickYourHappiness1: '당신의',
    pickYourHappiness2: '행복을 선택',
    menuSubtitle: '오후의 활력을 위한 완벽한 맛과 기쁨의 조화.',
    bestseller: '베스트셀러',
    freshDescription: '프리미엄 재료로 신선하게 제조.',
    quickAdd: '빠른 추가',
    recommendedForYou: '추천 메뉴',
    searchResults: '검색 결과',
    noItemsFound: '항목을 찾을 수 없습니다',
    cancelOrder: '주문 취소',

    // Cart
    myOrder: '내 주문',
    yourTrayEmpty: '트레이가 비어 있습니다',
    sugar: '당도',
    totalAmount: '총 금액',
    checkout: '결제',
    processing: '처리 중...',
    clearOrder: '주문 초기화',
    item: '개',
    items: '개',

    // Customization
    selectSugar: '당도 선택',
    addToppings: '토핑 추가',
    addToTray: '트레이에 추가',
    total: '합계',

    // Mix & Match
    chooseYourDrink: '음료 선택',
    customizeYourCombo: '콤보 커스텀',
    customizeDrink: '음료 커스텀',
    loadingCollection: '컬렉션 로딩 중...',
    noDrinksAvailable: '이 번들에 사용 가능한 음료가 없습니다.',
    selectSugarLevel: '당도 선택',
    drinkOptions: '음료 옵션',
    iceLevel: '얼음 양',
    pearlPreference: '펄 선택',
    extraToppings: '추가 토핑',
    backToSelection: '선택으로 돌아가기',
    comboTotal: '콤보 합계',
    bundleTotal: '번들 합계',
    addOns: '추가 옵션',

    // Confirm
    confirmTitle1: '주문이',
    confirmTitle2: '접수되었습니다',
    proceedToCounter: '카운터에서 결제해 주세요',
    yourTicketNumber: '주문 번호',
    totalDue: '결제 금액',
    newOrder: '새 주문',

    // Branch
    kioskSetup: '키오스크 설정',
    selectBranchDevice: '이 장치의 지점을 선택하세요',
    searchBranchPlaceholder: '이름 또는 주소로 검색...',
    active: '영업 중',
    selected: '선택됨',
    noAddressProvided: '주소 미제공',
    selectBranch: '지점 선택',
    noBranchesFound: '검색과 일치하는 지점이 없습니다',
    confirmBranch: '지점 확인',
    confirmBranchMessage: '이 장치를 해당 위치에 연결합니다.',
    cancel: '취소',
    confirm: '확인',

    // Error
    orderFailed: '주문 실패',
    orderFailedMessage: '주문 접수에 실패했습니다. 직원에게 문의하세요.',
    tryAgain: '다시 시도',
    processingLoader: '처리 중...',

    // Admin
    accessControl: '접근 제어',
    enterAdminPin: '키오스크 설정을 초기화하려면 관리 PIN을 입력하세요.',
    incorrectPin: '잘못된 PIN',
    clear: '지우기',
    exit: '나가기',
    adminSettings: '관리 설정',
    expoMode: '전시 모드',
    expoModeDesc: '메뉴를 특정 항목으로 제한합니다.',
    enabled: '활성화',
    disabled: '비활성화',
    selectExpoItems: '전시 항목 선택',
    expoItemsDesc: '전시 항목을 전환하려면 클릭하세요.',
    searchExpoPlaceholder: '전시에 추가할 항목 검색...',
    all: '전체',
    noItemsLoaded: '이 지점에 로드된 항목이 없습니다.',
    resetLocation: '위치 초기화',
    unbindDevice: '이 장치 연결 해제.',
    resetNow: '지금 초기화',
    closeSettings: '설정 닫기',
    bundleConfigTitle: '번들 커스텀',
    bundleItemStep: '단계',
    nextItem: '다음 항목',
    confirmBundle: '번들 확정',
  },
};

export const getTranslations = (lang: KioskLanguage) => translations[lang];
