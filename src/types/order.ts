export type ShippingAddressRequest = {
  recipientName: string;
  phoneNumber: string;
  zipCode: string;
  address1: string;
  address2?: string;
};

export type ShippingAddressResponse = ShippingAddressRequest;

export type OrderItemRequest = {
  itemId: number;
  color?: string;
  size?: string;
  quantity: number;
};

export type OrderCreateRequest = {
  cartIds?: number[];
  items?: OrderItemRequest[];
  couponId?: number;
  usedPoint?: number;
  shippingAddress: ShippingAddressRequest;
};

export type OrderAmountResponse = {
  itemTotalAmount: number;
  shippingFee: number;
  couponDiscountAmount: number;
  pointDiscountAmount: number;
  paymentAmount: number;
};

export type OrderItemResponse = {
  orderItemId: number;
  itemId: number;
  itemName: string;
  color: string;
  size: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
};

export type OrderStatus =
  | "ORDERED"
  | "PAID"
  | "SHIPPING"
  | "DELIVERED"
  | "CANCELED";

export type OrderResponse = {
  orderId: number;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  canceledAt?: string | null;
  shippingAddress: ShippingAddressResponse;
  items: OrderItemResponse[];
  amount: OrderAmountResponse;
};

export type OrderPreviewItem = {
  itemId: number;
  name: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
  pictureUrl?: string;
};

export type OrderPageState = {
  cartIds?: number[];
  items?: OrderItemRequest[];
  previewItems: OrderPreviewItem[];
};
