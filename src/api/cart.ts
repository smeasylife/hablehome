import { apiClient } from "./client";
import type { CartItemRequest, CartItemResponse } from "../types/cart";

export async function addCartItem(
  itemId: number,
  payload?: CartItemRequest,
): Promise<void> {
  await apiClient.post(`/${itemId}/cart`, payload ?? {});
}

export async function getCartItems(): Promise<CartItemResponse[]> {
  const response = await apiClient.get<CartItemResponse[]>("/cart");

  return response.data;
}

export async function removeSelectedCartItems(cartIds: number[]): Promise<void> {
  await apiClient.delete("/cart", {
    data: { cartIds },
  });
}
