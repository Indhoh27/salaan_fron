import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";
import LoginPage from "./Pages/LoginPage";
import DashboardPage from "./Pages/dashboard_components/DashboardPage";
import Mainpage from "./Pages/dashboard_pages/Mainpage";
import JobsPage from "./Pages/dashboard_pages/JobsPage";
import InventoryPage from "./Pages/dashboard_pages/InventoryPage";
import SalesPage from "./Pages/dashboard_pages/SalesPage";
import BuyingPage from "./Pages/dashboard_pages/BuyingPage";
import LoansPage from "./Pages/dashboard_pages/LoansPage";
import ExpensesPage from "./Pages/dashboard_pages/ExpensesPage";
import ReportsPage from "./Pages/dashboard_pages/ReportsPage";
import SettingsPage from "./Pages/dashboard_pages/SettingsPage";
import UsersPage from "./Pages/dashboard_pages/UsersPage";
import AdminRoute from "./Pages/dashboard_components/AdminRoute";

function RootLayout() {
  return (
    <div>
      <Outlet />
    </div>
  );
}

export default RootLayout;

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <LoginPage /> },
    ],
  },
  {
    path: "/dashboard",
    element: <DashboardPage />,
    children: [
      { index: true, element: <Mainpage /> },
      { path: "jobs", element: <JobsPage /> },
      { path: "inventory", element: <InventoryPage /> },
      { path: "sales", element: <SalesPage /> },
      { path: "buying", element: <BuyingPage /> },
      { path: "loans", element: <LoansPage /> },
      { path: "expenses", element: <ExpensesPage /> },
      { path: "reports", element: <ReportsPage /> },
      {
        path: "users",
        element: (
          <AdminRoute>
            <UsersPage />
          </AdminRoute>
        ),
      },
      { path: "settings", element: <SettingsPage /> },
      { path: "*", element: <Navigate to="/dashboard" replace /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
