import { useState } from "react";
import "./Auth.css";
import { setUser } from "../../store/userStore";

const API_URL = "http://localhost:3001/api/auth";

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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

      if (!response.ok)
        throw new Error(data.message || "Não foi possível continuar.");

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
      <section className="auth-card">
        <p className="auth-brand">A</p>
        <p className="auth-eyebrow">AURORA INVEST</p>
        <h1>{mode === "login" ? "Bem-vinda de volta" : "Crie sua conta"}</h1>
        <p className="auth-description">
          {mode === "login"
            ? "Entre para acompanhar seus investimentos."
            : "Comece a organizar seus investimentos em um só lugar."}
        </p>
        <form onSubmit={submit}>
          {mode === "register" && (
            <label>
              Nome
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
            E-mail
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Senha
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
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Aguarde..."
              : mode === "login"
                ? "Entrar"
                : "Criar conta"}
          </button>
        </form>
        <button
          className="auth-switch"
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
        >
          {mode === "login"
            ? "Ainda não tem uma conta? Cadastre-se"
            : "Já tem uma conta? Entre"}
        </button>
      </section>
    </main>
  );
}
