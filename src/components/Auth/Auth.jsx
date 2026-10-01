import { useState } from "react";
import "./Auth.css";
import { setUser } from "../../store/userStore";
import { useTranslation } from "../../i18n";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";

const API_URL = "http://localhost:3001/api/auth";

export default function Auth({ onAuthenticated }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetNotice, setResetNotice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/${mode === "login" ? "login" : "register"}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: mode === "register" ? name : undefined,
            email,
            password,
          }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        const errorKeys = {
          "Informe um e-mail válido.": "invalidEmail",
          "A senha deve ter pelo menos 8 caracteres.": "shortPassword",
          "Informe seu nome para continuar.": "missingName",
          "Já existe uma conta com este e-mail.": "existingAccount",
          "E-mail ou senha incorretos.": "invalidLogin",
        };
        throw new Error(t(errorKeys[data.message] || "genericError"));
      }

      const nextUser = data.user;
      setUser(nextUser);
      onAuthenticated?.(nextUser);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <LanguageSwitcher className="auth-language-switcher" />
      <section className="auth-card">
        <p className="auth-brand">A</p>
        <p className="auth-eyebrow">AURORA INVEST</p>
        <h1>{mode === "login" ? t("loginWelcome") : t("createAccount")}</h1>
        <p className="auth-description">
          {mode === "login"
            ? t("loginDescription")
            : t("registerDescription")}
        </p>
        <form onSubmit={submit}>
          {mode === "register" && (
            <label>
              {t("name")}
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
          )}

          <label>
            {t("email")}
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            {t("password")}
            <input
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength="8"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {mode === "login" && (
            <button
              className="auth-forgot-password"
              type="button"
              onClick={() => setResetNotice(true)}
            >
              {t("forgotPassword")}
            </button>
          )}
          {resetNotice && mode === "login" && (
            <p className="auth-reset-notice" role="status">
              {t("passwordResetUnavailable")}
            </p>
          )}
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? t("wait")
              : mode === "login"
                ? t("login")
                : t("register")}
          </button>
        </form>
        <button
          className="auth-switch"
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
            setResetNotice(false);
          }}
        >
          {mode === "login"
            ? t("registerPrompt")
            : t("loginPrompt")}
        </button>
      </section>
    </main>
  );
}
