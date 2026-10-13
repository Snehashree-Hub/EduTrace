import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../styles/design-system.css";
import "../styles/layout.css";
import "../styles/components.css";

export default function AppLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const openMenu = () => {
    setMenuOpen(true);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div className="et-app">
      <Sidebar
        collapsed={false}
        mobileOpen={menuOpen}
        onCloseMobile={closeMenu}
      />

      <div className="et-main-area">
        <Topbar onMenuClick={openMenu} />

        <main className="et-page-area">
          <div className="et-page-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
