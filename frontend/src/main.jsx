
import ReactDOM from "react-dom/client";
import App from "./App";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <CartProvider>
      <App />
      <Toaster
  position="top-center"
  toastOptions={{
    duration: 2500,
    style: {
      background: "#16a34a",
      color: "white",
      fontWeight: "500",
      borderRadius: "10px",
      padding: "10px 16px",
    },
  }}
/>

    </CartProvider>
  </AuthProvider>
);
