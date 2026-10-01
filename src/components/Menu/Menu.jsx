import React, { useEffect, useRef, useState } from "react";
import "./Menu.css";
import UserAccountDialog from "./UserAccountDialog";
import { clearUser, setUser, useUserStore } from "../../store/userStore";
import { useTranslation } from "../../i18n";

export default function Menu({
  items,
  triggerLabel,
  className = "",
}) {
  const { t } = useTranslation();
  const { user } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const menuRef = useRef(null);

  const userName =
    user?.name || (user?.email ? user.email.split("@")[0] : "Usuário");
  const initials = userName.charAt(0).toUpperCase();
  const menuItems = items || [
    { icon: "fi fi-rr-edit", label: t("editAccount"), action: "edit-account" },
    { icon: "fi fi-rr-sign-out-alt", label: t("logout"), danger: true },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleAction(item) {
    if (item.action === "edit-account") {
      setIsOpen(false);
      setIsAccountOpen(true);
      return;
    }

    if (item.danger) {
      try {
        await fetch("http://localhost:3001/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // ignora falha do logout no servidor para manter UX simples
      }

      clearUser();
      window.location.reload();
      return;
    }

    setIsOpen(false);
  }

  return (
    <div className={`user-menu ${className}`.trim()} ref={menuRef}>
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={triggerLabel || t("profile")}
        aria-expanded={isOpen}
      >
        <span className="user-menu-avatar">{initials}</span>
        <span className="user-menu-name">{userName}</span>
      </button>

      {isOpen && (
        <div
          className="user-menu-panel"
          role="menu"
          aria-label={t("userMenu")}
        >
          <div className="user-menu-header">
            <div className="user-menu-avatar large">{initials}</div>
            <div>
              <strong>{userName}</strong>
              <small>{t("personalAccount")}</small>
            </div>
          </div>

          <ul className="user-menu-list">
            {menuItems.map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  className={`user-menu-item ${item.danger ? "danger" : ""}`}
                  onClick={() => handleAction(item)}
                >
                  <i className={item.icon}></i>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {isAccountOpen && (
        <UserAccountDialog
          user={user}
          onClose={() => setIsAccountOpen(false)}
          onUpdated={setUser}
        />
      )}
    </div>
  );
}
