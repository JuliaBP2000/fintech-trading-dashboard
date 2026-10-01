import React from "react";
import "./Sidebar.css";
import Menu from "../Menu/Menu";
import { useTranslation } from "../../i18n";

export default function Sidebar({
  isOpen,
  isPinned,
  isCompact,
  onOpen,
  onClose,
  onTogglePinned,
}) {
  const { t } = useTranslation();
  const menus = [
    { icon: "fi fi-rr-home", label: t("navOverview"), active: true },
  ];

  return (
    <>
      {isOpen && isCompact && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label={t("close")}
          onClick={onClose}
        />
      )}
      <aside
        className={`sidebar ${isOpen ? "is-open" : "is-closed"}`}
        id="main-sidebar"
        aria-label={t("mainNavigation")}
        aria-hidden={!isOpen}
      >
        <div className="sidebar-content">
          <div className="sidebar-header">
            <div className="brand" aria-label="Aurora">
              <i className="fi fi-rr-sparkles" aria-hidden="true" />
              Aurora
            </div>
            <div className="sidebar-controls">
              <button
                className={`sidebar-control ${isPinned ? "is-active" : ""}`}
                type="button"
                aria-label={t(isPinned ? "unpinSidebar" : "pinSidebar")}
                aria-pressed={isPinned}
                title={t(isPinned ? "unpinSidebar" : "pinSidebar")}
                onClick={onTogglePinned}
              >
                <i className="fi fi-rr-thumbtack" aria-hidden="true" />
              </button>
              <button
                className="sidebar-control"
                type="button"
                aria-label={t("closeSidebar")}
                title={t("closeSidebar")}
                onClick={onClose}
              >
                <i className="fi fi-rr-angle-small-left" aria-hidden="true" />
              </button>
            </div>
          </div>
          <nav className="sidebar-nav">
            {menus.map((menu) => (
              <button
                key={menu.label}
                className={`sidebar-menu-item ${menu.active ? "active" : ""}`}
                aria-label={menu.label}
                title={menu.label}
              >
                <i className={menu.icon} aria-hidden="true" />
                <span className="sidebar-menu-label">{menu.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <Menu className="profile" />
      </aside>
      <button
        className={`sidebar-open-trigger ${isOpen ? "is-hidden" : ""}`}
        type="button"
        aria-label={t("openSidebar")}
        aria-controls="main-sidebar"
        aria-expanded={isOpen}
        aria-hidden={isOpen}
        tabIndex={isOpen ? -1 : 0}
        title={t("openSidebar")}
        onClick={onOpen}
      >
        <i className="fi fi-rr-menu-burger" aria-hidden="true" />
      </button>
    </>
  );
}
