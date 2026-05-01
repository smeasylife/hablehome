import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { getOrder } from "../api/orders";

type PaymentResultPageProps = {
  status: "success" | "fail" | "cancel";
};

const titleMap = {
  success: "결제 요청이 완료되었습니다",
  fail: "결제를 완료하지 못했습니다",
  cancel: "결제가 취소되었습니다",
};

const IconMap = {
  success: CheckCircle2,
  fail: XCircle,
  cancel: AlertTriangle,
};

const currencyFormatter = new Intl.NumberFormat("ko-KR");

export function PaymentResultPage({ status }: PaymentResultPageProps) {
  const [searchParams] = useSearchParams();
  const orderId = Number(searchParams.get("orderId"));
  const isValidOrderId = Number.isInteger(orderId) && orderId > 0;
  const Icon = IconMap[status];

  const { data: order, isError, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId),
    enabled: isValidOrderId,
  });

  return (
    <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-3xl flex-col items-center justify-center px-4 py-12 text-center">
      <Icon
        size={42}
        className={status === "success" ? "text-accent" : "text-muted"}
      />
      <p className="mt-5 text-sm font-medium text-muted">Payment</p>
      <h1 className="mt-2 text-3xl font-semibold text-ink">{titleMap[status]}</h1>

      {isLoading ? (
        <p className="mt-4 text-sm text-muted">주문 정보를 확인하는 중입니다.</p>
      ) : null}
      {!isValidOrderId || isError ? (
        <p className="mt-4 text-sm leading-6 text-muted">
          주문 정보를 불러오지 못했습니다. 마이페이지 또는 장바구니에서 다시 확인해 주세요.
        </p>
      ) : null}
      {order ? (
        <div className="mt-8 w-full rounded-md border border-hairline p-5 text-left">
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-muted">주문번호</span>
            <span className="font-medium text-ink">{order.orderNumber}</span>
          </div>
          <div className="mt-3 flex justify-between gap-4 text-sm">
            <span className="text-muted">주문 상태</span>
            <span className="font-medium text-ink">{order.status}</span>
          </div>
          <div className="mt-3 flex justify-between gap-4 text-sm">
            <span className="text-muted">결제 금액</span>
            <span className="font-semibold text-accent">
              {currencyFormatter.format(order.amount.paymentAmount)}원
            </span>
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="inline-flex h-11 items-center justify-center rounded-md border border-hairline px-5 text-sm font-semibold text-ink"
        >
          쇼핑 계속하기
        </Link>
        <Link
          to="/mypage"
          className="inline-flex h-11 items-center justify-center rounded-md bg-ink px-5 text-sm font-semibold text-white"
        >
          마이페이지
        </Link>
      </div>
    </section>
  );
}
