import React from "react";
import { Sun, Moon } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/lib/ThemeContext";

const ESDS_LOGO = "/vite.svg";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  const handleLogoClick = () => {
    const talentSection = document.getElementById('talent-ai-section');
    if (talentSection) {
      talentSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
      <nav className="fixed top-0 left-0 right-0 px-6 py-4 flex items-center justify-between bg-transparent z-[10]">
        <div className="flex items-center gap-4 cursor-pointer" onClick={handleLogoClick}>
          <div className="w-28 h-28 flex items-center justify-center">
            <img src={ESDS_LOGO} alt="ESDS Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        <div className="relative z-[9990] flex items-center gap-4" style={{ isolation: "isolate" }}>
          <div className="hidden md:flex items-center gap-3 text-xs font-mono">
            <Link to="/auth/candidate">Candidate</Link>
            <Link to="/auth/recruiter">Recruiter</Link>
            <Link to="/auth/interviewer">Interviewer</Link>
            <Link to="/auth/admin">Admin</Link>
            <Link to="/auth/ceo-chro">CEO/CHRO</Link>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-primary/10 transition-all"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" style={{ color: "hsl(190,90%,50%,0.7)" }} />
            ) : (
              <Moon className="w-5 h-5" style={{ color: "#003d82" }} />
            )}
          </button>

          <Link className="text-xs font-mono underline" to="/auth/candidate">Login</Link>
        </div>
      </nav>
  );
}