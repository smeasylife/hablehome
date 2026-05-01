import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, PackageCheck, Search, WalletCards } from "lucide-react";
import axios from "axios";
import { createOrder } from "../api/orders";
import { requestPayment } from "../api/payments";
import { useCurrentMember } from "../hooks/useCurrentMember";
import type {
  OrderCreateRequest,
  OrderPageState,
  ShippingAddressRequest,
} from "../types/order";

const currencyFormatter = new Intl.NumberFormat("ko-KR");
const FREE_SHIPPING_THRESHOLD = 50_000;
const DEFAULT_SHIPPING_FEE = 3_000;

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: { zonecode: string; roadAddress: string; jibunAddress: string }) => void;
      }) => { open: () => void };
    };
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    );

    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        resolve();
        return;
      }
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener("error", reject, { once: true });
    document.head.appendChild(script);
  });
}

function normalizeOrderState(value: unknown): OrderPageState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const state = value as Partial<OrderPageState>;
  if (!Array.isArray(state.previewItems) || state.previewItems.length === 0) {
    return null;
  }

  const hasCartIds = Array.isArray(state.cartIds) && state.cartIds.length > 0;
  const hasItems = Array.isArray(state.items) && state.items.length > 0;
  if (hasCartIds === hasItems) {
    return null;
  }

  return state as OrderPageState;
}

export function OrderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderState = normalizeOrderState(location.state);
  const { data: session, isLoading: isSessionLoading } = useCurrentMember();
  const [address, setAddress] = useState<ShippingAddressRequest>({
    recipientName: "",
    phoneNumber: "",
    zipCode: "",
    address1: "",
    address2: "",
  });
  const [couponIdInput, setCouponIdInput] = useState("");
  const [usedPointInput, setUsedPointInput] = useState("0");
  const [formError, setFormError] = useState("");
  const [postcodeError, setPostcodeError] = useState("");

  const itemTotal = useMemo(
    () =>
      orderState?.previewItems.reduce(
        (total, item) => total + item.unitPrice * item.quantity,
        0,
      ) ?? 0,
    [orderState],
  );
  const estimatedShippingFee =
    itemTotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;
  const estimatedPaymentAmount = itemTotal + estimatedShippingFee;

  const orderMutation = useMutation({
    mutationFn: async (payload: OrderCreateRequest) => {
      const order = await createOrder(payload);

      if (!session) {
        return order;
      }

      const paymentResult = await requestPayment(order, session);
      if (paymentResult === "development-complete") {
        navigate(`/payment/success?orderId=${order.orderId}`, { replace: true });
      }

      return order;
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate(`/login?redirect=${encodeURIComponent("/cart")}`);
        return;
      }

      setFormError(
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "주문 또는 결제 요청을 처리하지 못했습니다.",
      );
    },
  });

  if (isSessionLoading) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-3xl flex-col items-center justify-center px-4 text-center">
        <p className="text-sm text-muted">회원 정보를 확인하는 중입니다.</p>
      </section>
    );
  }

  if (!session) {
    return <Navigate to="/login?redirect=%2Fcart" replace />;
  }

  if (!orderState) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-3xl flex-col items-center justify-center px-4 text-center">
        <p className="text-sm font-medium text-muted">주문서</p>
        <h1 className="mt-2 text-3xl font-semibold">주문할 상품이 없습니다.</h1>
        <Link
          to="/cart"
          className="mt-8 rounded-md bg-ink px-6 py-3 text-sm font-semibold text-white"
        >
          장바구니로 이동
        </Link>
      </section>
    );
  }

  const updateAddress = (field: keyof ShippingAddressRequest, value: string) => {
    setAddress((current) => ({ ...current, [field]: value }));
    setFormError("");
  };

  const openPostcodeSearch = async () => {
    setPostcodeError("");
    try {
      await loadScript("//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js");
      if (!window.daum?.Postcode) {
        throw new Error("Daum Postcode API를 사용할 수 없습니다.");
      }

      new window.daum.Postcode({
        oncomplete: (data) => {
          setAddress((current) => ({
            ...current,
            zipCode: data.zonecode,
            address1: data.roadAddress || data.jibunAddress,
          }));
        },
      }).open();
    } catch {
      setPostcodeError("주소 검색을 열지 못했습니다. 직접 입력해 주세요.");
    }
  };

  const validateAddress = () => {
    if (!address.recipientName.trim()) {
      return "받는 분을 입력해 주세요.";
    }
    if (!address.phoneNumber.trim()) {
      return "연락처를 입력해 주세요.";
    }
    if (!address.zipCode.trim() || !address.address1.trim()) {
      return "주소를 입력해 주세요.";
    }
    return "";
  };

  const submitOrder = () => {
    const validationMessage = validateAddress();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const couponId = couponIdInput.trim() ? Number(couponIdInput) : undefined;
    const usedPoint = Number(usedPointInput.replace(/,/g, ""));

    if (
      couponIdInput.trim() &&
      (couponId === undefined || !Number.isInteger(couponId) || couponId <= 0)
    ) {
      setFormError("쿠폰 ID를 올바르게 입력해 주세요.");
      return;
    }
    if (!Number.isFinite(usedPoint) || usedPoint < 0) {
      setFormError("사용 포인트를 올바르게 입력해 주세요.");
      return;
    }

    orderMutation.mutate({
      cartIds: orderState.cartIds,
      items: orderState.items,
      couponId,
      usedPoint,
      shippingAddress: {
        recipientName: address.recipientName.trim(),
        phoneNumber: address.phoneNumber.trim(),
        zipCode: address.zipCode.trim(),
        address1: address.address1.trim(),
        address2: address.address2?.trim() || undefined,
      },
    });
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <Link
        to="/cart"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
      >
        <ArrowLeft size={16} />
        장바구니로 돌아가기
      </Link>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="text-sm font-medium text-muted">주문서</p>
          <h1 className="mt-2 text-[28px] font-semibold leading-tight text-ink sm:text-[34px]">
            배송지와 결제 정보를 확인해 주세요
          </h1>

          <section className="mt-8 rounded-md border border-hairline p-5">
            <div className="flex items-center gap-2">
              <PackageCheck size={20} className="text-accent" />
              <h2 className="text-lg font-semibold text-ink">주문 상품</h2>
            </div>
            <div className="mt-5 space-y-3">
              {orderState.previewItems.map((item) => (
                <article
                  key={`${item.itemId}-${item.color}-${item.size}`}
                  className="grid grid-cols-[72px_1fr] gap-4"
                >
                  <div className="aspect-square overflow-hidden rounded-md bg-soft">
                    {item.pictureUrl ? (
                      <img
                        src={item.pictureUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <Link
                      to={`/items/${item.itemId}`}
                      className="text-sm font-semibold text-ink"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted">
                      {item.color} / {item.size} · {item.quantity}개
                    </p>
                    <p className="mt-2 text-sm font-medium text-body">
                      {currencyFormatter.format(item.unitPrice * item.quantity)}원
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-md border border-hairline p-5">
            <div className="flex items-center gap-2">
              <MapPin size={20} className="text-accent" />
              <h2 className="text-lg font-semibold text-ink">배송 정보</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                value={address.recipientName}
                onChange={(event) => updateAddress("recipientName", event.target.value)}
                className="h-12 rounded-md border border-hairline px-4 text-sm outline-none focus:border-ink"
                placeholder="받는 분"
              />
              <input
                value={address.phoneNumber}
                onChange={(event) => updateAddress("phoneNumber", event.target.value)}
                className="h-12 rounded-md border border-hairline px-4 text-sm outline-none focus:border-ink"
                placeholder="연락처"
              />
              <div className="flex gap-2 sm:col-span-2">
                <input
                  value={address.zipCode}
                  onChange={(event) => updateAddress("zipCode", event.target.value)}
                  className="h-12 min-w-0 flex-1 rounded-md border border-hairline px-4 text-sm outline-none focus:border-ink"
                  placeholder="우편번호"
                />
                <button
                  type="button"
                  onClick={openPostcodeSearch}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-hairline px-4 text-sm font-semibold text-ink"
                >
                  <Search size={16} />
                  주소 검색
                </button>
              </div>
              <input
                value={address.address1}
                onChange={(event) => updateAddress("address1", event.target.value)}
                className="h-12 rounded-md border border-hairline px-4 text-sm outline-none focus:border-ink sm:col-span-2"
                placeholder="기본 주소"
              />
              <input
                value={address.address2 ?? ""}
                onChange={(event) => updateAddress("address2", event.target.value)}
                className="h-12 rounded-md border border-hairline px-4 text-sm outline-none focus:border-ink sm:col-span-2"
                placeholder="상세 주소"
              />
            </div>
            {postcodeError ? (
              <p className="mt-3 rounded-md bg-soft px-3 py-2 text-sm text-body">
                {postcodeError}
              </p>
            ) : null}
          </section>

          <section className="mt-6 rounded-md border border-hairline p-5">
            <div className="flex items-center gap-2">
              <WalletCards size={20} className="text-accent" />
              <h2 className="text-lg font-semibold text-ink">할인 정보</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                value={couponIdInput}
                onChange={(event) =>
                  setCouponIdInput(event.target.value.replace(/[^\d]/g, ""))
                }
                inputMode="numeric"
                className="h-12 rounded-md border border-hairline px-4 text-sm outline-none focus:border-ink"
                placeholder="쿠폰 ID"
              />
              <input
                value={usedPointInput}
                onChange={(event) =>
                  setUsedPointInput(event.target.value.replace(/[^\d,]/g, ""))
                }
                inputMode="numeric"
                className="h-12 rounded-md border border-hairline px-4 text-sm outline-none focus:border-ink"
                placeholder="사용 포인트"
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
                {currencyFormatter.format(itemTotal)}원
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">예상 배송비</span>
              <span className="font-medium text-ink">
                {estimatedShippingFee === 0
                  ? "무료"
                  : `${currencyFormatter.format(estimatedShippingFee)}원`}
              </span>
            </div>
            <div className="flex justify-between border-t border-hairline pt-4 text-base">
              <span className="font-semibold text-ink">결제 예정 금액</span>
              <span className="font-semibold text-accent">
                {currencyFormatter.format(estimatedPaymentAmount)}원
              </span>
            </div>
          </div>
          {formError ? (
            <p className="mt-4 rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-sm text-accent">
              {formError}
            </p>
          ) : null}
          <button
            type="button"
            onClick={submitOrder}
            disabled={orderMutation.isPending}
            className="mt-6 h-12 w-full rounded-md bg-ink px-5 text-sm font-semibold text-white disabled:bg-muted"
          >
            {orderMutation.isPending ? "처리 중" : "결제하기"}
          </button>
          <p className="mt-3 text-xs leading-5 text-muted">
            최종 금액은 주문 생성 시 서버에서 다시 계산됩니다.
          </p>
        </aside>
      </div>
    </section>
  );
}
