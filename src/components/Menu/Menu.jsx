import React, { useEffect, useRef, useState } from "react";
import "./Menu.css";
import { clearUser, useUserStore } from "../../store/userStore";

const defaultItems = [
  { icon: "fi fi-rr-user", label: "Meu perfil" },
  { icon: "fi fi-rr-settings-sliders", label: "Configurações" },
  { icon: "fi fi-rr-sign-out-alt", label: "Sair", danger: true },
];

export default function Menu({
  items = defaultItems,
  triggerLabel = "Perfil",
  className = "",
}) {
  const { user } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const userName =
    user?.name || (user?.email ? user.email.split("@")[0] : "Usuário");
  const userRole = "Conta pessoal";
  const initials = userName.charAt(0).toUpperCase();

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
        aria-label={triggerLabel}
        aria-expanded={isOpen}
      >
        <span className="user-menu-avatar">{initials}</span>
        <span className="user-menu-name">{userName}</span>
      </button>

      {isOpen && (
        <div
          className="user-menu-panel"
          role="menu"
          aria-label="Menu do usuário"
        >
          <div className="user-menu-header">
            <div className="user-menu-avatar large">{initials}</div>
            <div>
              <strong>{userName}</strong>
              <small>{userRole}</small>
            </div>
          </div>

          <ul className="user-menu-list">
            {items.map((item) => (
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
    </div>
  );
}
