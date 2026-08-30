import React from "react";
import "./Sidebar.css";
import Menu from "../Menu/Menu";
const menus = [
  { icon: "fi fi-rr-home", label: "Visão geral", active: true },
  { icon: "fi fi-rr-globe", label: "Mercados" },
  { icon: "fi fi-rr-list", label: "Ordens" },
  { icon: "fi fi-rr-history", label: "Histórico" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <div className="brand" aria-label="Aurora">
          A
        </div>
        <nav className="sidebar-nav">
          {menus.map((menu) => (
            <button
              key={menu.label}
              className={`sidebar-menu-item ${menu.active ? "active" : ""}`}
              aria-label={menu.label}
              title={menu.label}
            >
              <i className={menu.icon}></i>
              <span className="sidebar-menu-label">{menu.label}</span>
            </button>
          ))}
        </nav>
      </div>
      <Menu className="profile" />
    </aside>
  );
}
