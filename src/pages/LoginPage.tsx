import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  kakaoLogin,
  login,
  sendSignupCode,
  signup,
  verifySignupCode,
} from "../api/auth";
import { clearSession } from "../data/localSession";
import { currentMemberQueryKey } from "../hooks/useCurrentMember";

const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY as
  | string
  | undefined;
const PASSWORD_POLICY_MESSAGE =
  "비밀번호는 8자 이상이며 영문자와 숫자를 포함해야 합니다.";

type Mode = "login" | "signup";

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const hasHandledKakaoCode = useRef(false);

  const normalizedEmail = email.trim();
  const normalizedNickname = nickname.trim();
  const isCurrentEmailVerified =
    isEmailVerified && verifiedEmail === normalizedEmail;
  const passwordsMatch = password.length > 0 && password === passwordConfirm;
  const isPasswordValid = isValidSignupPassword(password);

  const timerLabel = useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = String(secondsLeft % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [secondsLeft]);

  const redirectPath = searchParams.get("redirect") ?? searchParams.get("state") ?? "/mypage";
  const kakaoRedirectUri =
    typeof window === "undefined" ? "" : `${window.location.origin}/login`;

  function finishLogin(member: Awaited<ReturnType<typeof login>>) {
    clearSession();
    queryClient.setQueryData(currentMemberQueryKey, member);
    queryClient.invalidateQueries({ queryKey: ["items"] });
    queryClient.invalidateQueries({ queryKey: ["item"] });
    navigate(redirectPath, { replace: true });
  }

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code || hasHandledKakaoCode.current) {
      return;
    }
    hasHandledKakaoCode.current = true;

    kakaoLogin({ code, redirectUri: kakaoRedirectUri })
      .then((member) => {
        window.history.replaceState({}, "", "/login");
        finishLogin(member);
      })
      .catch((caughtError) =>
        setError(getRequestErrorMessage(caughtError, "카카오 로그인 처리에 실패했습니다.")),
      );
  }, [kakaoRedirectUri, navigate, redirectPath]);

  useEffect(() => {
    if (!secondsLeft || isEmailVerified) {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [secondsLeft, isEmailVerified]);

  async function handleSendCode() {
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const responseMessage = await sendSignupCode(normalizedEmail);
      setIsCodeSent(true);
      setIsEmailVerified(false);
      setVerifiedEmail("");
      setSecondsLeft(300);
      setVerificationCode("");
      setMessage(`${responseMessage}. 메일함에서 6자리 인증번호를 확인해 주세요.`);
    } catch (caughtError) {
      setError(
        getRequestErrorMessage(
          caughtError,
          "인증 번호 전송 응답이 지연되고 있습니다. 메일함을 확인해 주세요.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyCode() {
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const responseMessage = await verifySignupCode({
        email: normalizedEmail,
        code: verificationCode,
      });
      setIsEmailVerified(true);
      setVerifiedEmail(normalizedEmail);
      setSecondsLeft(0);
      setMessage(responseMessage);
    } catch (caughtError) {
      setError(
        getRequestErrorMessage(
          caughtError,
          "인증 번호가 올바르지 않거나 만료되었습니다.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!normalizedNickname || !normalizedEmail || !password || !phoneNumber) {
      setError("회원가입 정보를 모두 입력해 주세요.");
      return;
    }

    if (!isPasswordValid) {
      setError(PASSWORD_POLICY_MESSAGE);
      return;
    }

    if (!passwordsMatch) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (!isCurrentEmailVerified) {
      setError("이메일 인증을 완료해 주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({
        nickname: normalizedNickname,
        email: normalizedEmail,
        password,
        phoneNumber,
      });
      const member = await login({ email: normalizedEmail, password });
      finishLogin(member);
    } catch (caughtError) {
      setError(getRequestErrorMessage(caughtError, "회원가입에 실패했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const member = await login({ email, password });
      finishLogin(member);
    } catch (caughtError) {
      setError(getRequestErrorMessage(caughtError, "로그인에 실패했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleKakaoLogin() {
    setError("");

    if (!KAKAO_REST_API_KEY) {
      setError("카카오 REST API 키가 설정되지 않았습니다.");
      return;
    }

    const params = new URLSearchParams({
      response_type: "code",
      client_id: KAKAO_REST_API_KEY,
      redirect_uri: kakaoRedirectUri,
      state: redirectPath,
    });
    window.location.href = `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
  }

  return (
    <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-12">
      <div className="hidden lg:block">
        <p className="text-sm font-medium text-muted">Hable Account</p>
        <h1 className="mt-3 max-w-md text-[34px] font-semibold leading-tight text-ink">
          주문과 혜택을 한곳에서 관리하세요
        </h1>
        <div className="mt-8 space-y-4 text-sm text-body">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-soft">
              <Mail size={18} />
            </span>
            이메일 인증 후 안전하게 가입
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-soft">
              <MessageCircle size={18} />
            </span>
            카카오 계정으로 빠른 로그인
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-soft">
              <ShieldCheck size={18} />
            </span>
            쿠폰, 적립금, 장바구니 정보 연동
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[520px]">
        <div className="mb-6 grid grid-cols-2 rounded-full border border-hairline bg-soft p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`h-11 rounded-full text-sm font-semibold ${
              mode === "login" ? "bg-white text-ink shadow-soft" : "text-muted"
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`h-11 rounded-full text-sm font-semibold ${
              mode === "signup" ? "bg-white text-ink shadow-soft" : "text-muted"
            }`}
          >
            회원가입
          </button>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <Field
              label="이메일"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />
            <Field
              label="비밀번호"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
            <button
              type="submit"
              disabled={!email || !password || isSubmitting}
              className="flex h-12 w-full items-center justify-center rounded-full bg-ink text-sm font-semibold text-white disabled:bg-hairline"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "이메일로 로그인"}
            </button>
            <button
              type="button"
              onClick={handleKakaoLogin}
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#FEE500] text-sm font-semibold text-[#191919]"
            >
              <MessageCircle size={18} />
              카카오로 로그인
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <Field label="닉네임" value={nickname} onChange={setNickname} />
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Field
                label="이메일"
                  type="email"
                  value={email}
                  onChange={(value) => {
                    setEmail(value);
                    setIsEmailVerified(false);
                    setVerifiedEmail("");
                    setMessage("");
                  }}
                  autoComplete="email"
                />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={!email || isSubmitting}
                className="h-12 rounded-full border border-ink px-5 text-sm font-semibold disabled:border-hairline disabled:text-muted sm:self-end"
              >
                인증번호 전송
              </button>
            </div>

            {isCodeSent ? (
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Field
                  label={`인증번호 ${isEmailVerified ? "완료" : timerLabel}`}
                  value={verificationCode}
                  onChange={setVerificationCode}
                  inputMode="numeric"
                />
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={
                    !verificationCode ||
                    secondsLeft === 0 ||
                    isEmailVerified ||
                    isSubmitting
                  }
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white disabled:bg-hairline sm:self-end"
                >
                  {isEmailVerified ? <Check size={17} /> : null}
                  인증 확인
                </button>
              </div>
            ) : null}

            <Field
              label="휴대폰 번호"
              value={phoneNumber}
              onChange={(value) => setPhoneNumber(formatPhoneNumber(value))}
              autoComplete="tel"
              inputMode="tel"
              maxLength={13}
            />
            <Field
              label="비밀번호"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              status={
                password.length === 0
                  ? PASSWORD_POLICY_MESSAGE
                  : isPasswordValid
                    ? "사용 가능한 비밀번호입니다."
                    : PASSWORD_POLICY_MESSAGE
              }
            />
            <Field
              label="비밀번호 확인"
              type="password"
              value={passwordConfirm}
              onChange={setPasswordConfirm}
              autoComplete="new-password"
              status={
                passwordConfirm.length === 0
                  ? ""
                  : passwordsMatch
                    ? "비밀번호가 일치합니다."
                    : "비밀번호가 일치하지 않습니다."
              }
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white disabled:bg-hairline"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "가입하기"}
            </button>
          </form>
        )}

        {message ? (
          <p className="mt-4 rounded-md bg-soft px-4 py-3 text-sm text-body">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function getRequestErrorMessage(error: unknown, fallback: string) {
  if (
    isAxiosError<{ message?: string }>(error) &&
    typeof error.response?.data?.message === "string"
  ) {
    return error.response.data.message;
  }

  return fallback;
}

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function isValidSignupPassword(value: string) {
  return value.length >= 8 && value.length <= 64 && /[A-Za-z]/.test(value) && /\d/.test(value);
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "text" | "email" | "tel";
  maxLength?: number;
  status?: string;
};

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  inputMode,
  maxLength,
  status,
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-muted">
        {label}
      </span>
      <input
        className="h-12 w-full rounded-md border border-hairline bg-white px-4 text-sm text-ink outline-none transition focus:border-ink"
        type={type}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
      {status ? <span className="mt-2 block text-xs text-muted">{status}</span> : null}
    </label>
  );
}
