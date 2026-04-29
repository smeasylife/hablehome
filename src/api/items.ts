import { apiClient } from "./client";
import type { ItemDetailResponse, ItemListResponse, ReviewRequest } from "../types/item";

export async function getItems(page = 0): Promise<ItemListResponse[]> {
  const response = await apiClient.get<ItemListResponse[]>("/items", {
    params: { page },
  });

  return response.data;
}

export async function getItem(itemId: number): Promise<ItemDetailResponse> {
  const response = await apiClient.get<ItemDetailResponse>(`/items/${itemId}`);

  return response.data;
}

export async function createReview(itemId: number, payload: ReviewRequest): Promise<void> {
  await apiClient.post(`/${itemId}/review`, payload);
}
