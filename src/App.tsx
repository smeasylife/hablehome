import { Route, Routes } from "react-router-dom";
import { BusinessFooter } from "./components/BusinessFooter";
import { Header } from "./components/Header";
import { CartPage } from "./pages/CartPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { MyPage } from "./pages/MyPage";
import { OrderPage } from "./pages/OrderPage";
import { PaymentResultPage } from "./pages/PaymentResultPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { SearchResultPage } from "./pages/SearchResultPage";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <Header />
      <main className="flex-1 pt-[73px]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultPage />} />
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
      <BusinessFooter />
    </div>
  );
}
