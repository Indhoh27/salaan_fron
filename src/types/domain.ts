/** Shapes returned by the Salaan backend (Prisma field names). */

export type Job = {
  id: string;
  service: string;
  work_details: string | null;
  price: string;
  customer_name: string;
  customer_phone: string;
  device_left: boolean;
  left_at: string | null;
  done_at: string | null;
  has_charger: boolean;
  bag_type: string | null;
  is_completed: boolean;
  payment_status: string;
  payment_method: string;
  user_id: string;
  createdAt: string;
  updatedAt: string;
};

export type Laptop = {
  id: string;
  name: string;
  price: string;
  discount: string;
  ram: string;
  storage: string;
  processor: string;
  /** false after the unit is sold (until marked available again in inventory). */
  is_available?: boolean;
  user_id: string;
  createdAt: string;
  updatedAt: string;
};

export type Accessory = {
  id: string;
  name: string;
  price: string;
  discount: string;
  category: string | null;
  quantity?: number;
  user_id: string;
  createdAt: string;
  updatedAt: string;
};

export type Selling = {
  id: string;
  laptop_id: string | null;
  accessory_id: string | null;
  price: string;
  discount: string;
  payment_status: string;
  payment_method: string;
  customer_name: string;
  customer_phone: string;
  user_id: string;
  createdAt: string;
  updatedAt: string;
};

/** Shop buys stock from a person; pay them over one or more `PurchasePayment` rows. */
export type PurchasePayment = {
  id: string;
  purchase_id: string;
  amount: string;
  payment_method: string | null;
  paid_at: string;
  notes: string | null;
  user_id: string;
  createdAt: string;
  updatedAt: string;
};

export type Purchase = {
  id: string;
  seller_name: string;
  seller_phone: string;
  laptop_name: string | null;
  accessory_name: string | null;
  item_description: string | null;
  agreed_price: string;
  /** PENDING | PARTIAL | PAID | CANCELLED */
  status: string;
  notes: string | null;
  user_id: string;
  createdAt: string;
  updatedAt: string;
  payments?: PurchasePayment[];
};

export type Expense = {
  id: string;
  description: string;
  amount: string;
  user_id: string;
  createdAt: string;
  updatedAt: string;
};

export type ReportPeriod = "daily" | "weekly" | "monthly" | "yearly";

export type IncomeExpenseReport = {
  period: ReportPeriod;
  start: string;
  endExclusive: string;
  income: number;
  expenses: number;
  profit: number;
  incomeBreakdown: { sellings: number; jobs: number };
  expenseBreakdown: { purchasePayments: number; otherExpenses: number };
  breakdown: {
    day: string;
    income: number;
    expense: number;
    profit: number;
    incomeSelling: number;
    incomeJobs: number;
    expensePurchases: number;
    expenseOther: number;
  }[];
};

export type ShopUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  createdAt: string;
};
