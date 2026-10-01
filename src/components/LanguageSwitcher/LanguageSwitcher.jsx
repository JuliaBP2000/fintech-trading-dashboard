import { useTranslation } from "../../i18n";
import "./LanguageSwitcher.css";

export default function LanguageSwitcher({ className = "" }) {
  const { language, setLanguage, t } = useTranslation();

  return (
    <div
      className={`language-switcher ${className}`.trim()}
      role="group"
      aria-label={t("languageLabel")}
    >
      <button
        type="button"
        aria-pressed={language === "pt-BR"}
        onClick={() => setLanguage("pt-BR")}
      >
        PT
      </button>
      <button
        type="button"
        aria-pressed={language === "en-US"}
        onClick={() => setLanguage("en-US")}
      >
        EN
      </button>
    </div>
  );
}