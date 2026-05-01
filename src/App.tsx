import { Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { CartPage } from "./pages/CartPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { MyPage } from "./pages/MyPage";
import { OrderPage } from "./pages/OrderPage";
import { PaymentResultPage } from "./pages/PaymentResultPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";

export default function App() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Header />
      <main className="pt-[73px]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/items/:itemId" element={<ProductDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/order" element={<OrderPage />} />
          <Route path="/payment/success" element={<PaymentResultPage status="success" />} />
          <Route path="/payment/fail" element={<PaymentResultPage status="fail" />} />
          <Route path="/payment/cancel" element={<PaymentResultPage status="cancel" />} />
          <Route path="/cart" element={<CartPage />} />
        </Routes>
      </main>
    </div>
  );
}
