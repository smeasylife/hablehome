import { apiClient } from "./client";
import type { QuestionRequest } from "../types/item";

export async function createQuestion(payload: QuestionRequest): Promise<void> {
  await apiClient.post("/question", payload);
}
