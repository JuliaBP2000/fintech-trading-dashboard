import { useEffect } from "react";
import "./App.css";
import Auth from "./components/Auth/Auth";
import Sidebar from "./components/sidebar/Sidebar";
import Dashboard from "./components/Dashboard/Dashboard";
import { loadUser, setUser, useUserStore } from "./store/userStore";

function App() {
  const { user, isLoading, hasLoaded } = useUserStore();

  useEffect(() => {
    if (!hasLoaded) {
      loadUser();
    }
  }, [hasLoaded]);

  if (isLoading && !user)
    return <main className="app-loading">Carregando...</main>;
  if (!user) return <Auth onAuthenticated={(nextUser) => setUser(nextUser)} />;

  return (
    <div className="app">
      <Sidebar />
      <Dashboard />
    </div>
  );
}

export default App;
