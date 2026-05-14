import { apiClient } from "./client";
import type { PromoBannerResponse } from "../types/banner";

export async function getPromoBanners(): Promise<PromoBannerResponse[]> {
  const response = await apiClient.get<PromoBannerResponse[]>("/promo-banners");

  return response.data;
}
