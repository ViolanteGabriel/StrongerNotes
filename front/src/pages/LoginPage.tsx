import { useState } from "react";
import { Link } from "react-router-dom";
import { Dumbbell, ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt:", { email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12 transition-colors duration-300">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-secondary-foreground hover:text-primary mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to home
        </Link>
        
        <div className="bg-card p-8 rounded-2xl shadow-xl shadow-black/5 border border-border">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-primary flex items-center justify-center rounded-2xl mb-4 shadow-lg shadow-primary/20">
              <Dumbbell className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-secondary-foreground mt-2 opacity-80">Access your dashboard to keep growing</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-secondary-foreground opacity-50" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none placeholder:text-secondary-foreground/40"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-secondary-foreground opacity-50" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none placeholder:text-secondary-foreground/40"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-secondary-foreground opacity-50 hover:opacity-100 transition-opacity"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="mt-2 text-right">
                <a href="#" className="text-sm font-medium text-primary hover:opacity-80 transition-opacity">
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 px-6 text-primary-foreground bg-primary hover:opacity-90 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
            >
              Sign In
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-border text-center">
            <p className="text-secondary-foreground opacity-80">
              Don't have an account yet?{" "}
              <Link to="/register" className="font-bold text-primary hover:opacity-80 transition-opacity">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
