import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send } from "lucide-react";
import { createQuestion } from "../api/questions";
import type { QuestionResponse } from "../types/item";

type ProductQuestionsProps = {
  itemId: number;
  questions: QuestionResponse[];
  formatDate: (value: string) => string;
};

export function ProductQuestions({ itemId, questions, formatDate }: ProductQuestionsProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const createQuestionMutation = useMutation({
    mutationFn: () =>
      createQuestion({
        itemId,
        title: title.trim(),
        content: content.trim(),
      }),
    onSuccess: () => {
      setTitle("");
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["item", itemId] });
    },
  });

  const handleSubmitQuestion = () => {
    if (!title.trim() || !content.trim() || createQuestionMutation.isPending) {
      return;
    }

    createQuestionMutation.mutate();
  };

  return (
    <section className="w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink">문의</h2>
        <span className="text-sm text-muted">{questions.length}개</span>
      </div>

      <div className="mt-5 rounded-md border border-hairline p-5">
        <p className="text-sm font-semibold text-ink">상품 문의 작성</p>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="문의 제목"
          className="mt-3 h-10 w-full rounded-md border border-hairline px-3 text-sm text-ink outline-none focus:border-ink"
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="상품 문의 내용을 입력해 주세요."
          rows={4}
          className="mt-2 w-full resize-none rounded-md border border-hairline px-3 py-2 text-sm leading-6 text-ink outline-none focus:border-ink"
        />
        {createQuestionMutation.isError ? (
          <p className="mt-2 text-xs text-accent">
            문의 등록에 실패했습니다. 내용을 확인해 주세요.
          </p>
        ) : null}
        <button
          type="button"
          onClick={handleSubmitQuestion}
          disabled={!title.trim() || !content.trim() || createQuestionMutation.isPending}
          className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white disabled:bg-muted"
        >
          <Send size={16} />
          {createQuestionMutation.isPending ? "등록 중" : "문의 등록"}
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {questions.length > 0 ? (
          questions.map((question, index) => (
            <div
              key={question.id ?? `${question.createdAt}-${index}`}
              className="rounded-md border border-hairline p-5"
            >
              <div className="flex items-start gap-2">
                <MessageCircle size={16} className="mt-1 shrink-0 text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {question.title ?? "상품 문의"}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-6 text-body">
                    {question.content}
                  </p>
                  <p className="mt-2 text-xs text-muted">{formatDate(question.createdAt)}</p>
                </div>
              </div>
              <p className="mt-3 rounded-md bg-soft p-3 text-sm leading-6 text-body">
                {question.answer ?? "아직 답변이 등록되지 않았습니다."}
              </p>
            </div>
          ))
        ) : (
          <p className="rounded-md border border-hairline p-5 text-sm text-muted">
            아직 등록된 문의가 없습니다.
          </p>
        )}
      </div>
    </section>
  );
}
