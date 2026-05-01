import type { Category } from "../types/item";

export const categories: Category[] = [
  { id: "ALL", label: "전체", categoryNames: [] },
  { id: "NEW", label: "NEW", categoryNames: ["NEW"] },
  { id: "BEST", label: "BEST", categoryNames: ["BEST"] },
  { id: "SALE", label: "SALE", categoryNames: ["SALE"] },
  { id: "SPRING_FALL", label: "봄/가을", categoryNames: ["SPRING", "FALL"] },
  { id: "SUMMER", label: "여름", categoryNames: ["SUMMER"] },
  { id: "WINTER", label: "겨울", categoryNames: ["WINTER"] },
];
