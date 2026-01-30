export type Language = 'uz' | 'ru' | 'en';

export const translations = {
  uz: {
    // Common
    app_name: "Ombor Boshqaruvi",
    loading: "Yuklanmoqda...",
    save: "Saqlash",
    cancel: "Bekor qilish",
    delete: "O'chirish",
    edit: "Tahrirlash",
    add: "Qo'shish",
    search: "Qidirish",
    actions: "Amallar",
    status: "Holat",
    active: "Faol",
    inactive: "Nofaol",
    blocked: "Bloklangan",
    unblock: "Blokdan chiqarish",
    block: "Bloklash",
    confirm: "Tasdiqlash",
    back: "Orqaga",
    view: "Ko'rish",
    close: "Yopish",
    yes: "Ha",
    no: "Yo'q",
    
    // Auth
    login: "Kirish",
    logout: "Chiqish",
    email: "Elektron pochta",
    password: "Parol",
    login_title: "Tizimga kirish",
    login_subtitle: "Hisobingizga kiring",
    login_error: "Kirish xatosi",
    invalid_credentials: "Noto'g'ri email yoki parol",
    owner_login: "Egasi sifatida kirish",
    
    // Roles
    owner: "Egasi",
    admin: "Admin",
    user: "Foydalanuvchi",
    
    // Dashboard
    dashboard: "Bosh sahifa",
    statistics: "Statistika",
    total_income: "Umumiy daromad",
    total_tenants: "Jami ijarachilar",
    paid_users: "To'lagan foydalanuvchilar",
    unpaid_users: "To'lamagan foydalanuvchilar",
    this_month: "Bu oy",
    monthly_stats: "Oylik statistika",
    owner_statistics_desc: "Barcha omborlar va adminlar bo'yicha umumiy statistika",
    admin_statistics_desc: "Sizning omborlaringiz bo'yicha statistika",
    payment_summary: "To'lov xulosasi",
    expected: "Kutilayotgan",
    paid: "To'langan",
    unpaid: "To'lanmagan",
    currency: "so'm",
    collection_rate: "Yig'ilish darajasi",
    monthly_income: "Oylik daromad",
    payment_trend: "To'lov tendensiyasi",
    tenants_by_product: "Mahsulot bo'yicha ijarachilar",
    payment_status: "To'lov holati",
    
    // Warehouse
    warehouses: "Omborlar",
    warehouse: "Ombor",
    warehouse_name: "Ombor nomi",
    warehouse_address: "Ombor manzili",
    add_warehouse: "Ombor qo'shish",
    edit_warehouse: "Omborni tahrirlash",
    no_warehouses: "Omborlar topilmadi",
    
    // Admins
    admins: "Adminlar",
    admin_name: "Admin ismi",
    admin_phone: "Telefon raqami",
    admin_email: "Email",
    add_admin: "Admin qo'shish",
    edit_admin: "Adminni tahrirlash",
    admin_blocked: "Admin bloklangan",
    admin_performance: "Admin samaradorligi",
    no_admins: "Adminlar topilmadi",
    
    // Tenants
    tenants: "Ijarachilar",
    tenant_name: "Ijarachi ismi",
    tenant_phone: "Telefon",
    product_type: "Mahsulot turi",
    monthly_rent: "Oylik ijara",
    add_tenant: "Ijarachi qo'shish",
    edit_tenant: "Ijarachini tahrirlash",
    no_tenants: "Ijarachilar topilmadi",
    
    // Payments
    payments: "To'lovlar",
    payment: "To'lov",
    expected_amount: "Kutilgan summa",
    paid_amount: "To'langan summa",
    remaining: "Qoldiq",
    carry_over: "O'tgan qarz",
    payment_date: "To'lov sanasi",
    add_payment: "To'lov qo'shish",
    record_payment: "To'lovni qayd etish",
    unpaid_balance: "To'lanmagan qoldiq",
    
    // Messages
    success: "Muvaffaqiyatli",
    error: "Xato",
    created_successfully: "Muvaffaqiyatli yaratildi",
    updated_successfully: "Muvaffaqiyatli yangilandi",
    deleted_successfully: "Muvaffaqiyatli o'chirildi",
    blocked_successfully: "Muvaffaqiyatli bloklandi",
    unblocked_successfully: "Blokdan muvaffaqiyatli chiqarildi",
    
    // Language
    language: "Til",
    uzbek: "O'zbekcha",
    russian: "Ruscha",
    english: "Inglizcha",
    
    // Months
    months: {
      1: "Yanvar",
      2: "Fevral",
      3: "Mart",
      4: "Aprel",
      5: "May",
      6: "Iyun",
      7: "Iyul",
      8: "Avgust",
      9: "Sentabr",
      10: "Oktabr",
      11: "Noyabr",
      12: "Dekabr",
    },
  },
  
  ru: {
    // Common
    app_name: "Управление складами",
    loading: "Загрузка...",
    save: "Сохранить",
    cancel: "Отмена",
    delete: "Удалить",
    edit: "Редактировать",
    add: "Добавить",
    search: "Поиск",
    actions: "Действия",
    status: "Статус",
    active: "Активен",
    inactive: "Неактивен",
    blocked: "Заблокирован",
    unblock: "Разблокировать",
    block: "Заблокировать",
    confirm: "Подтвердить",
    back: "Назад",
    view: "Просмотр",
    close: "Закрыть",
    yes: "Да",
    no: "Нет",
    
    // Auth
    login: "Войти",
    logout: "Выйти",
    email: "Электронная почта",
    password: "Пароль",
    login_title: "Вход в систему",
    login_subtitle: "Войдите в свой аккаунт",
    login_error: "Ошибка входа",
    invalid_credentials: "Неверный email или пароль",
    owner_login: "Войти как владелец",
    
    // Roles
    owner: "Владелец",
    admin: "Админ",
    user: "Пользователь",
    
    // Dashboard
    dashboard: "Главная",
    statistics: "Статистика",
    total_income: "Общий доход",
    total_tenants: "Всего арендаторов",
    paid_users: "Оплатившие",
    unpaid_users: "Неоплатившие",
    this_month: "Этот месяц",
    monthly_stats: "Месячная статистика",
    owner_statistics_desc: "Общая статистика по всем складам и админам",
    admin_statistics_desc: "Статистика по вашим складам",
    payment_summary: "Сводка платежей",
    expected: "Ожидаемая",
    paid: "Оплачено",
    unpaid: "Не оплачено",
    currency: "сум",
    collection_rate: "Уровень сбора",
    monthly_income: "Ежемесячный доход",
    payment_trend: "Тенденция платежей",
    tenants_by_product: "Арендаторы по продуктам",
    payment_status: "Статус платежа",
    
    // Warehouse
    warehouses: "Склады",
    warehouse: "Склад",
    warehouse_name: "Название склада",
    warehouse_address: "Адрес склада",
    add_warehouse: "Добавить склад",
    edit_warehouse: "Редактировать склад",
    no_warehouses: "Склады не найдены",
    
    // Admins
    admins: "Админы",
    admin_name: "Имя админа",
    admin_phone: "Номер телефона",
    admin_email: "Email",
    add_admin: "Добавить админа",
    edit_admin: "Редактировать админа",
    admin_blocked: "Админ заблокирован",
    admin_performance: "Эффективность админа",
    no_admins: "Админы не найдены",
    
    // Tenants
    tenants: "Арендаторы",
    tenant_name: "Имя арендатора",
    tenant_phone: "Телефон",
    product_type: "Тип продукта",
    monthly_rent: "Месячная аренда",
    add_tenant: "Добавить арендатора",
    edit_tenant: "Редактировать арендатора",
    no_tenants: "Арендаторы не найдены",
    
    // Payments
    payments: "Платежи",
    payment: "Платеж",
    expected_amount: "Ожидаемая сумма",
    paid_amount: "Оплаченная сумма",
    remaining: "Остаток",
    carry_over: "Переходящий долг",
    payment_date: "Дата платежа",
    add_payment: "Добавить платеж",
    record_payment: "Записать платеж",
    unpaid_balance: "Неоплаченный остаток",
    
    // Messages
    success: "Успешно",
    error: "Ошибка",
    created_successfully: "Успешно создано",
    updated_successfully: "Успешно обновлено",
    deleted_successfully: "Успешно удалено",
    blocked_successfully: "Успешно заблокирован",
    unblocked_successfully: "Успешно разблокирован",
    
    // Language
    language: "Язык",
    uzbek: "Узбекский",
    russian: "Русский",
    english: "Английский",
    
    // Months
    months: {
      1: "Январь",
      2: "Февраль",
      3: "Март",
      4: "Апрель",
      5: "Май",
      6: "Июнь",
      7: "Июль",
      8: "Август",
      9: "Сентябрь",
      10: "Октябрь",
      11: "Ноябрь",
      12: "Декабрь",
    },
  },
  
  en: {
    // Common
    app_name: "Warehouse Management",
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    search: "Search",
    actions: "Actions",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    blocked: "Blocked",
    unblock: "Unblock",
    block: "Block",
    confirm: "Confirm",
    back: "Back",
    view: "View",
    close: "Close",
    yes: "Yes",
    no: "No",
    
    // Auth
    login: "Login",
    logout: "Logout",
    email: "Email",
    password: "Password",
    login_title: "Login to System",
    login_subtitle: "Sign in to your account",
    login_error: "Login Error",
    invalid_credentials: "Invalid email or password",
    owner_login: "Login as Owner",
    
    // Roles
    owner: "Owner",
    admin: "Admin",
    user: "User",
    
    // Dashboard
    dashboard: "Dashboard",
    statistics: "Statistics",
    total_income: "Total Income",
    total_tenants: "Total Tenants",
    paid_users: "Paid Users",
    unpaid_users: "Unpaid Users",
    this_month: "This Month",
    monthly_stats: "Monthly Statistics",
    owner_statistics_desc: "Overall statistics for all warehouses and admins",
    admin_statistics_desc: "Statistics for your warehouses",
    payment_summary: "Payment Summary",
    expected: "Expected",
    paid: "Paid",
    unpaid: "Unpaid",
    currency: "UZS",
    collection_rate: "Collection Rate",
    monthly_income: "Monthly Income",
    payment_trend: "Payment Trend",
    tenants_by_product: "Tenants by Product",
    payment_status: "Payment Status",
    
    // Warehouse
    warehouses: "Warehouses",
    warehouse: "Warehouse",
    warehouse_name: "Warehouse Name",
    warehouse_address: "Warehouse Address",
    add_warehouse: "Add Warehouse",
    edit_warehouse: "Edit Warehouse",
    no_warehouses: "No warehouses found",
    
    // Admins
    admins: "Admins",
    admin_name: "Admin Name",
    admin_phone: "Phone Number",
    admin_email: "Email",
    add_admin: "Add Admin",
    edit_admin: "Edit Admin",
    admin_blocked: "Admin is blocked",
    admin_performance: "Admin Performance",
    no_admins: "No admins found",
    
    // Tenants
    tenants: "Tenants",
    tenant_name: "Tenant Name",
    tenant_phone: "Phone",
    product_type: "Product Type",
    monthly_rent: "Monthly Rent",
    add_tenant: "Add Tenant",
    edit_tenant: "Edit Tenant",
    no_tenants: "No tenants found",
    
    // Payments
    payments: "Payments",
    payment: "Payment",
    expected_amount: "Expected Amount",
    paid_amount: "Paid Amount",
    remaining: "Remaining",
    carry_over: "Carry Over Debt",
    payment_date: "Payment Date",
    add_payment: "Add Payment",
    record_payment: "Record Payment",
    unpaid_balance: "Unpaid Balance",
    
    // Messages
    success: "Success",
    error: "Error",
    created_successfully: "Created successfully",
    updated_successfully: "Updated successfully",
    deleted_successfully: "Deleted successfully",
    blocked_successfully: "Blocked successfully",
    unblocked_successfully: "Unblocked successfully",
    
    // Language
    language: "Language",
    uzbek: "Uzbek",
    russian: "Russian",
    english: "English",
    
    // Months
    months: {
      1: "January",
      2: "February",
      3: "March",
      4: "April",
      5: "May",
      6: "June",
      7: "July",
      8: "August",
      9: "September",
      10: "October",
      11: "November",
      12: "December",
    },
  },
} as const;

export type TranslationKey = keyof typeof translations.uz;

export const getTranslation = (lang: Language, key: TranslationKey): string => {
  const value = translations[lang][key];
  if (typeof value === 'string') {
    return value;
  }
  return key;
};

export const getMonthName = (lang: Language, month: number): string => {
  return translations[lang].months[month as keyof typeof translations.uz.months] || '';
};
