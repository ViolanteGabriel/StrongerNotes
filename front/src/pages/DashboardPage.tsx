import { useNavigate } from "react-router-dom";
import { Dumbbell, LogOut, LayoutDashboard, PlusCircle, History, TrendingUp } from "lucide-react";
import { useTheme } from "../App";
import { Sun, Moon } from "lucide-react";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-80 transition-all border border-border"
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-2 border-b border-border">
          <Dumbbell className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold tracking-tight">StrongerNotes</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-primary/10 text-primary font-bold">
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-secondary transition-colors text-secondary-foreground">
            <PlusCircle size={20} />
            New Workout
          </button>
          <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-secondary transition-colors text-secondary-foreground">
            <History size={20} />
            History
          </button>
          <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-secondary transition-colors text-secondary-foreground">
            <TrendingUp size={20} />
            Progress
          </button>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-3 mb-4">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
              {user.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">{user.name}</p>
              <p className="text-xs text-secondary-foreground opacity-60 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-colors text-secondary-foreground"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-20 bg-card border-b border-border flex items-center justify-between px-8">
          <h2 className="text-xl font-bold">Training Dashboard</h2>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="md:hidden w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
              {user.name?.charAt(0) || "U"}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto w-full">
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold mb-2">Welcome back, {user.name}!</h1>
            <p className="text-secondary-foreground opacity-70 text-lg">Ready for another scientific session?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
              <p className="text-sm text-secondary-foreground mb-1 uppercase tracking-wider font-semibold opacity-60">Total Sessions</p>
              <h3 className="text-4xl font-black">0</h3>
            </div>
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
              <p className="text-sm text-secondary-foreground mb-1 uppercase tracking-wider font-semibold opacity-60">Volume (kg)</p>
              <h3 className="text-4xl font-black">0</h3>
            </div>
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
              <p className="text-sm text-secondary-foreground mb-1 uppercase tracking-wider font-semibold opacity-60">Next PR</p>
              <h3 className="text-4xl font-black text-primary">--</h3>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Recent Activities</h3>
              <button className="text-primary font-bold hover:underline">View All</button>
            </div>
            <div className="bg-card rounded-2xl border border-border border-dashed p-12 text-center">
              <p className="text-secondary-foreground opacity-50 mb-6">No workouts registered yet.</p>
              <button className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all inline-flex items-center gap-2">
                <PlusCircle size={18} />
                Start First Workout
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
