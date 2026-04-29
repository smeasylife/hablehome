import { mockProducts } from "./mockProducts";

const LOCAL_PURCHASES_KEY = "shopping-mall-purchases";

export type PurchasedProduct = {
  purchaseId: string;
  memberId: number;
  itemId: number;
  name: string;
  pictureUrl: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
  purchasedAt: string;
  reviewed: boolean;
};

export type PurchasePayload = {
  memberId: number;
  itemId: number;
  name: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
};

function readPurchases() {
  if (typeof window === "undefined") {
    return [] as PurchasedProduct[];
  }

  const rawPurchases = window.localStorage.getItem(LOCAL_PURCHASES_KEY);
  if (!rawPurchases) {
    return [] as PurchasedProduct[];
  }

  try {
    return JSON.parse(rawPurchases) as PurchasedProduct[];
  } catch {
    return [] as PurchasedProduct[];
  }
}

function writePurchases(purchases: PurchasedProduct[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCAL_PURCHASES_KEY, JSON.stringify(purchases));
}

export function getPurchasedProducts(memberId: number) {
  return readPurchases()
    .filter((purchase) => purchase.memberId === memberId)
    .sort((left, right) => right.purchasedAt.localeCompare(left.purchasedAt));
}

export function addPurchasedProduct(payload: PurchasePayload) {
  const pictureUrl =
    mockProducts.find((product) => product.id === payload.itemId)?.pictureUrl ?? "";
  const purchases = readPurchases();

  purchases.unshift({
    purchaseId: `${payload.memberId}-${payload.itemId}-${Date.now()}`,
    memberId: payload.memberId,
    itemId: payload.itemId,
    name: payload.name,
    pictureUrl,
    color: payload.color,
    size: payload.size,
    quantity: payload.quantity,
    price: payload.price,
    purchasedAt: new Date().toISOString(),
    reviewed: false,
  });

  writePurchases(purchases);
}

export function markPurchaseReviewed(purchaseId: string) {
  const purchases = readPurchases().map((purchase) =>
    purchase.purchaseId === purchaseId ? { ...purchase, reviewed: true } : purchase,
  );

  writePurchases(purchases);
}
