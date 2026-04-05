import type {
  Accessory,
  Expense,
  IncomeExpenseReport,
  Job,
  Laptop,
  Purchase,
  PurchasePayment,
  ReportPeriod,
  Selling,
  ShopUser,
} from "../types/domain";
import { apiJson, apiVoid } from "./apiClient";

export function listJobs() {
  return apiJson<Job[]>("/jobs", { method: "GET" });
}

export function createJob(body: Record<string, string | boolean | null | undefined>) {
  return apiJson<Job>("/jobs", { method: "POST", body: JSON.stringify(body) });
}

export function deleteJob(id: string) {
  return apiVoid(`/jobs/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function updateJob(id: string, body: Record<string, string | boolean | null | undefined>) {
  return apiJson<Job>(`/jobs/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) });
}

export function listLaptops() {
  return apiJson<Laptop[]>("/laptops", { method: "GET" });
}

type Jsonish = string | number | boolean | undefined | null;

export function createLaptop(body: Record<string, Jsonish>) {
  return apiJson<Laptop>("/laptops", { method: "POST", body: JSON.stringify(body) });
}

export function deleteLaptop(id: string) {
  return apiVoid(`/laptops/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function updateLaptop(id: string, body: Record<string, Jsonish>) {
  return apiJson<Laptop>(`/laptops/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) });
}

export function listAccessories() {
  return apiJson<Accessory[]>("/accessories", { method: "GET" });
}

export function createAccessory(body: Record<string, Jsonish>) {
  return apiJson<Accessory>("/accessories", { method: "POST", body: JSON.stringify(body) });
}

export function deleteAccessory(id: string) {
  return apiVoid(`/accessories/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function updateAccessory(id: string, body: Record<string, Jsonish>) {
  return apiJson<Accessory>(`/accessories/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) });
}

export function listSellings() {
  return apiJson<Selling[]>("/sellings", { method: "GET" });
}

export function createSelling(body: Record<string, string | null | undefined>) {
  return apiJson<Selling>("/sellings", { method: "POST", body: JSON.stringify(body) });
}

export function deleteSelling(id: string) {
  return apiVoid(`/sellings/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function updateSelling(id: string, body: Record<string, string | null | undefined>) {
  return apiJson<Selling>(`/sellings/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) });
}

export function listPurchases() {
  return apiJson<Purchase[]>("/purchases", { method: "GET" });
}

export function createPurchase(body: Record<string, string | null | undefined>) {
  return apiJson<Purchase>("/purchases", { method: "POST", body: JSON.stringify(body) });
}

export function updatePurchase(id: string, body: Record<string, string | null | undefined>) {
  return apiJson<Purchase>(`/purchases/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) });
}

export function deletePurchase(id: string) {
  return apiVoid(`/purchases/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function createPurchasePayment(body: Record<string, string | null | undefined>) {
  return apiJson<PurchasePayment>("/purchase-payments", { method: "POST", body: JSON.stringify(body) });
}

export function deletePurchasePayment(id: string) {
  return apiVoid(`/purchase-payments/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function listExpenses() {
  return apiJson<Expense[]>("/expenses", { method: "GET" });
}

export function createExpense(body: { description: string; amount: string; user_id: string }) {
  return apiJson<Expense>("/expenses", { method: "POST", body: JSON.stringify(body) });
}

export function deleteExpense(id: string) {
  return apiVoid(`/expenses/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function updateExpense(id: string, body: { description?: string; amount?: string; user_id?: string }) {
  return apiJson<Expense>(`/expenses/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) });
}

export function incomeExpenseReport(params: { period: ReportPeriod; date: string }) {
  const q = new URLSearchParams({ period: params.period, date: params.date });
  return apiJson<IncomeExpenseReport>(`/reports/income-expense?${q}`, { method: "GET" });
}

export function listUsers() {
  return apiJson<ShopUser[]>("/users", { method: "GET" });
}

export function createUser(body: {
  email: string;
  password: string;
  fullName?: string | null;
  role?: string;
}) {
  return apiJson<ShopUser>("/users", { method: "POST", body: JSON.stringify(body) });
}

export function updateUser(
  id: string,
  body: { email?: string; password?: string; fullName?: string | null; role?: string },
) {
  return apiJson<ShopUser>(`/users/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) });
}

export function deleteUser(id: string) {
  return apiVoid(`/users/${encodeURIComponent(id)}`, { method: "DELETE" });
}
