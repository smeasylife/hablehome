export type PromoBannerResponse = {
  id: number;
  largeText: string;
  smallText: string;
  imageUrl: string;
  buttonLabel: string;
  itemId: number | null;
  itemName: string;
  linkUrl: string | null;
  displayOrder: number;
};
