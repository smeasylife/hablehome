import { ArrowLeft, PackageCheck } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { addPurchasedProduct } from "../data/localPurchases";
import { getCurrentSession } from "../data/localSession";

const currencyFormatter = new Intl.NumberFormat("ko-KR");

function toNumber(value: string | null) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function OrderPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const itemId = searchParams.get("itemId");
  const name = searchParams.get("name") ?? "선택한 상품";
  const color = searchParams.get("color") ?? "-";
  const size = searchParams.get("size") ?? "-";
  const quantity = Math.max(1, toNumber(searchParams.get("quantity")));
  const price = toNumber(searchParams.get("price"));
  const couponName = searchParams.get("couponName") ?? "쿠폰 선택 안 함";
  const couponDiscount = toNumber(searchParams.get("couponDiscount"));
  const points = toNumber(searchParams.get("points"));
  const total = toNumber(searchParams.get("total"));
  const subtotal = price * quantity;
  const [session] = [getCurrentSession()];

  const completePurchase = () => {
    if (!itemId) {
      return;
    }

    if (!session) {
      navigate(`/login?redirect=${encodeURIComponent(`/order?${searchParams.toString()}`)}`);
      return;
    }

    addPurchasedProduct({
      memberId: session.memberId,
      itemId: toNumber(itemId),
      name,
      color,
      size,
      quantity,
      price,
    });
    navigate("/mypage");
  };

  if (!itemId) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-3xl flex-col items-center justify-center px-4 text-center">
        <p className="text-sm font-medium text-muted">주문서</p>
        <h1 className="mt-2 text-3xl font-semibold">주문할 상품이 없습니다.</h1>
        <Link
          to="/"
          className="mt-8 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white"
        >
          메인으로 돌아가기
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <Link
        to={`/items/${itemId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
      >
        <ArrowLeft size={16} />
        상품으로 돌아가기
      </Link>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="text-sm font-medium text-muted">주문서</p>
          <h1 className="mt-2 text-[28px] font-semibold leading-tight text-ink sm:text-[34px]">
            주문 정보를 확인해 주세요
          </h1>

          <section className="mt-8 rounded-md border border-hairline p-5">
            <div className="flex items-start gap-3">
              <PackageCheck size={22} className="mt-1 shrink-0 text-accent" />
              <div>
                <h2 className="text-lg font-semibold text-ink">{name}</h2>
                <p className="mt-2 text-sm text-muted">
                  색상 {color} · 사이즈 {size} · 수량 {quantity}개
                </p>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-md border border-hairline p-5">
            <h2 className="text-lg font-semibold text-ink">배송 정보</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                className="h-12 rounded-md border border-hairline px-4 text-sm outline-none focus:border-ink"
                placeholder="받는 분"
              />
              <input
                className="h-12 rounded-md border border-hairline px-4 text-sm outline-none focus:border-ink"
                placeholder="연락처"
              />
              <input
                className="h-12 rounded-md border border-hairline px-4 text-sm outline-none focus:border-ink sm:col-span-2"
                placeholder="주소"
              />
              <input
                className="h-12 rounded-md border border-hairline px-4 text-sm outline-none focus:border-ink sm:col-span-2"
                placeholder="배송 요청사항"
              />
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-md border border-hairline p-5 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold text-ink">결제 요약</h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">상품 금액</span>
              <span className="font-medium text-ink">
                {currencyFormatter.format(subtotal)}원
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{couponName}</span>
              <span className="font-medium text-ink">
                -{currencyFormatter.format(couponDiscount)}원
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">포인트 사용</span>
              <span className="font-medium text-ink">
                -{currencyFormatter.format(points)}원
              </span>
            </div>
            <div className="flex justify-between border-t border-hairline pt-4 text-base">
              <span className="font-semibold text-ink">총 결제 금액</span>
              <span className="font-semibold text-accent">
                {currencyFormatter.format(total)}원
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={completePurchase}
            className="mt-6 h-12 w-full rounded-md bg-ink px-5 text-sm font-semibold text-white"
          >
            {session ? "결제하기" : "로그인 후 결제하기"}
          </button>
        </aside>
      </div>
    </section>
  );
}
