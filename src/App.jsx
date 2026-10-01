import { useEffect, useState } from "react";
import "./App.css";
import Auth from "./components/Auth/Auth";
import Sidebar from "./components/sidebar/Sidebar";
import Dashboard from "./components/Dashboard/Dashboard";
import { loadUser, setUser, useUserStore } from "./store/userStore";
import { LanguageProvider, useTranslation } from "./i18n";

const SIDEBAR_PIN_KEY = "aurora-sidebar-pinned";
const SIDEBAR_MEDIA_QUERY = "(max-width: 700px)";

function readSidebarPinned() {
  try {
    return localStorage.getItem(SIDEBAR_PIN_KEY) === "true";
  } catch {
    return false;
  }
}

function AppContent() {
  const { t } = useTranslation();
  const { user, isLoading, hasLoaded } = useUserStore();
  const [isSidebarPinned, setIsSidebarPinned] = useState(readSidebarPinned);
  const [isCompact, setIsCompact] = useState(() =>
    window.matchMedia(SIDEBAR_MEDIA_QUERY).matches,
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => !window.matchMedia(SIDEBAR_MEDIA_QUERY).matches || readSidebarPinned(),
  );

  useEffect(() => {
    if (!hasLoaded) {
      loadUser();
    }
  }, [hasLoaded]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(SIDEBAR_MEDIA_QUERY);
    const handleViewportChange = (event) => {
      setIsCompact(event.matches);
      if (!isSidebarPinned) setIsSidebarOpen(!event.matches);
    };

    mediaQuery.addEventListener("change", handleViewportChange);
    return () => mediaQuery.removeEventListener("change", handleViewportChange);
  }, [isSidebarPinned]);

  function toggleSidebarPin() {
    const nextPinned = !isSidebarPinned;
    setIsSidebarPinned(nextPinned);
    try {
      localStorage.setItem(SIDEBAR_PIN_KEY, String(nextPinned));
    } catch {
      // Keep the current session usable when browser storage is unavailable.
    }
    if (nextPinned) setIsSidebarOpen(true);
    else if (isCompact) setIsSidebarOpen(false);
  }

  if (isLoading && !user)
    return <main className="app-loading">{t("loading")}</main>;
  if (!user) return <Auth onAuthenticated={(nextUser) => setUser(nextUser)} />;

  return (
    <div className={`app ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar
        isOpen={isSidebarOpen}
        isPinned={isSidebarPinned}
        isCompact={isCompact}
        onOpen={() => setIsSidebarOpen(true)}
        onClose={() => setIsSidebarOpen(false)}
        onTogglePinned={toggleSidebarPin}
      />
      <Dashboard />
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
