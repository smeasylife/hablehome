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

export async function searchItems(keyword: string): Promise<ItemListResponse[]> {
  const response = await apiClient.get<ItemListResponse[]>("/items/search", {
    params: { keyword },
  });

  return response.data;
}

export async function createReview(itemId: number, payload: ReviewRequest): Promise<void> {
  await apiClient.post(`/${itemId}/review`, payload);
}

export async function likeItem(itemId: number): Promise<void> {
  await apiClient.post(`/${itemId}/like`);
}

export async function unlikeItem(itemId: number): Promise<void> {
  await apiClient.delete(`/${itemId}/like`);
}
