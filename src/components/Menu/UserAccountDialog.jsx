import { useEffect, useState } from "react";
import { useTranslation } from "../../i18n";
import "./UserAccountDialog.css";

const API_URL = "http://localhost:3001/api/auth/profile";

export default function UserAccountDialog({ user, onClose, onUpdated }) {
  const { t } = useTranslation();
  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function saveProfile(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const normalizedName = name.trim();
    if (!normalizedName || normalizedName.length > 80) {
      setError(t("invalidProfileName"));
      return;
    }
    if (newPassword && !currentPassword) {
      setError(t("currentPasswordRequired"));
      return;
    }
    if (newPassword && newPassword.length < 8) {
      setError(t("shortPassword"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      return;
    }

    const body = { name: normalizedName };
    if (newPassword) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }

    setIsSaving(true);
    try {
      const response = await fetch(API_URL, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorKeys = {
          "Informe um nome válido.": "invalidProfileName",
          "Informe a senha atual para alterar a senha.": "currentPasswordRequired",
          "A senha deve ter pelo menos 8 caracteres.": "shortPassword",
          "Senha atual incorreta.": "incorrectCurrentPassword",
        };
        throw new Error(t(errorKeys[data.message] || "profileSaveFailed"));
      }

      onUpdated(data.user);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(t("profileUpdated"));
    } catch (saveError) {
      setError(saveError.message || t("profileSaveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="account-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="account-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-dialog-title"
      >
        <header className="account-dialog-header">
          <div>
            <p className="eyebrow">{t("personalAccount")}</p>
            <h2 id="account-dialog-title">{t("editAccount")}</h2>
          </div>
          <button
            className="account-dialog-close"
            type="button"
            aria-label={t("close")}
            onClick={onClose}
          >
            <i className="fi fi-rr-cross-small" aria-hidden="true" />
          </button>
        </header>

        <form className="account-form" onSubmit={saveProfile}>
          <label>
            {t("name")}
            <input
              autoComplete="name"
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label>
            {t("email")}
            <input type="email" value={user?.email || ""} readOnly />
          </label>

          <div className="account-password-heading">
            <h3>{t("changePassword")}</h3>
            <p>{t("passwordChangeOptional")}</p>
          </div>
          <label>
            {t("currentPassword")}
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </label>
          <div className="account-password-row">
            <label>
              {t("newPassword")}
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </label>
            <label>
              {t("confirmPassword")}
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </label>
          </div>

          {error && <p className="account-form-error" role="alert">{error}</p>}
          {success && <p className="account-form-success" role="status">{success}</p>}

          <button className="account-save" type="submit" disabled={isSaving}>
            {isSaving ? t("saving") : t("saveChanges")}
          </button>
        </form>
      </section>
    </div>
  );
}