import type { AuthMember } from "./auth";
import type { OrderResponse } from "../types/order";

type TossPaymentsInstance = {
  requestPayment: (
    method: "카드",
    options: {
      amount: number;
      orderId: string;
      orderName: string;
      customerName?: string;
      customerEmail?: string;
      successUrl: string;
      failUrl: string;
    },
  ) => Promise<void>;
};

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossPaymentsInstance;
  }
}

const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY as string | undefined;

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

export async function requestPayment(order: OrderResponse, member: AuthMember) {
  if (!TOSS_CLIENT_KEY) {
    return "development-complete" as const;
  }

  await loadScript("https://js.tosspayments.com/v1/payment");

  if (!window.TossPayments) {
    throw new Error("TossPayments SDK를 불러오지 못했습니다.");
  }

  const orderName =
    order.items.length === 1
      ? order.items[0].itemName
      : `${order.items[0].itemName} 외 ${order.items.length - 1}건`;
  const origin = window.location.origin;

  await window.TossPayments(TOSS_CLIENT_KEY).requestPayment("카드", {
    amount: order.amount.paymentAmount,
    orderId: order.orderNumber,
    orderName,
    customerName: member.nickname,
    customerEmail: member.email,
    successUrl: `${origin}/payment/success?orderId=${order.orderId}`,
    failUrl: `${origin}/payment/fail?orderId=${order.orderId}`,
  });

  return "sdk-requested" as const;
}
