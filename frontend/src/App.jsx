import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import VerifiedSuccess from "./pages/VerifiedSuccess";
import ProtectedRoute from "./components/ProtectedRoute";
import ResetPassword from "./pages/auth/ResetPassword";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import ErrorBoundary from "./components/ErrorBoundary";
import Header from "./components/Header";
import PublicHeader from "./components/PublicHeader";
import Home from "./pages/Home";
import Deals from "./pages/Deals";
import PublicHome from "./pages/PublicHome";
import Account from "./pages/Account";
import Checkout from "./pages/Checkout"; // ✅ added
import { useAuth } from "./contexts/AuthContext";
import PaymentSuccess from "./pages/PaymentSuccess";   // ✅ new
import PaymentFailed from "./pages/PaymentFailed"; 
import Orders from "./pages/Orders";  
import MenuItemDetail from "./pages/MenuItemDetail";
import Favorites from "./pages/Favorites";
import RefundPolicy from "./pages/RefundPolicy";

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("tuna_theme") === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("tuna_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("tuna_theme", "light");
    }
  }, [darkMode]);

  const { isLoggedIn } = useAuth();

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
          {isLoggedIn ? (
            <Header darkMode={darkMode} setDarkMode={setDarkMode} />
          ) : (
            <PublicHeader darkMode={darkMode} setDarkMode={setDarkMode} />
          )}

          <main className="flex-grow p-6 sm:p-8 max-w-7xl w-full mx-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <Routes>
                <Route path="/policies/refund" element={<RefundPolicy />} />
                <Route path="/menu/:id" element={<MenuItemDetail />} />
<Route path="/favorites" element={<Favorites />} />
                <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>}/>
                <Route path="/payment/success" element={<PaymentSuccess />} />
<Route path="/payment/failed" element={<PaymentFailed />} />
                <Route path="/" element={<PublicHome />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/verified-success" element={<VerifiedSuccess />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/account" element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                } />
                <Route path="/home" element={<Home />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/deals" element={<Deals />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
