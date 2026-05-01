import { apiClient } from "./client";
import type { OrderCreateRequest, OrderResponse } from "../types/order";

export async function createOrder(payload: OrderCreateRequest): Promise<OrderResponse> {
  const response = await apiClient.post<OrderResponse>("/orders", payload);

  return response.data;
}

export async function getOrders(): Promise<OrderResponse[]> {
  const response = await apiClient.get<OrderResponse[]>("/orders");

  return response.data;
}

export async function getOrder(orderId: number): Promise<OrderResponse> {
  const response = await apiClient.get<OrderResponse>(`/orders/${orderId}`);

  return response.data;
}

export async function cancelOrder(orderId: number): Promise<OrderResponse> {
  const response = await apiClient.post<OrderResponse>(`/orders/${orderId}/cancel`);

  return response.data;
}
