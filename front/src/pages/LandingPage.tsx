import { Link } from "react-router-dom";
import { Dumbbell, TrendingUp, Users, Calendar, Sun, Moon } from "lucide-react";
import { useTheme } from "../App";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-80 transition-all border border-border"
      aria-label="Toggle theme"
    >
      {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
};

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold tracking-tight">StrongerNotes</span>
        </div>
        <nav className="flex items-center gap-4 md:gap-8">
          <div className="hidden md:flex items-center gap-8 mr-4">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
            <a href="#about" className="text-sm font-medium hover:text-primary transition-colors">About</a>
          </div>
          <ThemeToggle />
          {localStorage.getItem("token") ? (
            <Link to="/dashboard" className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-all">
              Dashboard
            </Link>
          ) : (
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-all">
              Sign In
            </Link>
          )}
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-6 py-20 md:py-32 text-center max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight">
            Scientific precision for <br />
            <span className="text-primary">your workout evolution</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-secondary-foreground mb-10 leading-relaxed opacity-90">
            Log every set, track your progress with data-driven charts, and engineer your training routines like a professional.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-primary-foreground bg-primary rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20">
              Get Started Free
            </Link>
            <a href="#features" className="w-full sm:w-auto px-8 py-4 text-lg font-semibold bg-secondary text-secondary-foreground border border-border rounded-xl hover:opacity-80 transition-all">
              Explore Features
            </a>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-6 py-24 bg-card border-y border-border">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center p-6 group">
              <div className="w-16 h-16 bg-primary/10 flex items-center justify-center rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Progress Tracking</h3>
              <p className="text-secondary-foreground opacity-80">Analyze detailed charts of weight and rep evolution for every exercise in your library.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 group">
              <div className="w-16 h-16 bg-primary/10 flex items-center justify-center rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Planned Routines</h3>
              <p className="text-secondary-foreground opacity-80">Create and manage customized training sheets with an intuitive, science-based interface.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 group">
              <div className="w-16 h-16 bg-primary/10 flex items-center justify-center rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Complete History</h3>
              <p className="text-secondary-foreground opacity-80">Never lose track of your achievements with a permanent digital record of your training journey.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-12 bg-background border-t border-border text-center">
        <div className="flex items-center justify-center gap-2 mb-6 opacity-60">
          <Dumbbell className="w-6 h-6 text-primary" />
          <span className="text-lg font-bold">StrongerNotes</span>
        </div>
        <p className="text-secondary-foreground text-sm opacity-60">
          &copy; {new Date().getFullYear()} StrongerNotes. Engineering stronger athletes.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
