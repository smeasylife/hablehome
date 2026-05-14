import type { CartItemResponse } from "../types/cart";
import type { ItemDetailResponse } from "../types/item";

const LOCAL_CART_KEY = "hable-cart-items";

function readStorage(): CartItemResponse[] {
  if (typeof window === "undefined") {
    return [];
  }

  const rawItems = window.localStorage.getItem(LOCAL_CART_KEY);
  if (!rawItems) {
    return [];
  }

  try {
    const items = JSON.parse(rawItems);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function writeStorage(items: CartItemResponse[]) {
  window.localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
}

export function getLocalCartItems() {
  return readStorage();
}

export function addLocalCartItem(product: ItemDetailResponse) {
  const items = readStorage();
  const option = product.options.find((itemOption) => !itemOption.soldOut);

  if (items.some((item) => item.itemId === product.itemId)) {
    return;
  }

  writeStorage([
    {
      cartId: Date.now(),
      itemId: product.itemId,
      name: product.name,
      price: product.price + (option?.additionalPrice ?? 0),
      salePrice: product.salePrice + (option?.additionalPrice ?? 0),
      color: option?.color ?? product.color,
      size: option?.size ?? product.size,
      additionalPrice: option?.additionalPrice ?? 0,
      quantity: 1,
      pictureUrl: product.itemPictures[0]?.url ?? "",
      stockQuantity: option?.stockQuantity ?? 0,
      available: Boolean(option && option.stockQuantity >= 1),
    },
    ...items,
  ]);
}

export function removeLocalCartItems(cartIds: number[]) {
  const selectedIds = new Set(cartIds);
  writeStorage(readStorage().filter((item) => !selectedIds.has(item.cartId)));
}
