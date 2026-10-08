import {
  BarChart3,
  BellRing,
  BookOpen,
  BrainCircuit,
  CalendarRange,
  CheckCircle2,
  FileCheck2,
  Gauge,
  GraduationCap,
  Library,
  ListChecks,
  PenLine,
  Settings,
  ShieldCheck,
  WifiOff
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { currentStreak } from '../lib/date';
import { useAppState } from '../state/AppState';

const navItems = [
  { to: '/', label: 'Overview', icon: Gauge, end: true },
  { to: '/coach', label: 'Coach', icon: BrainCircuit },
  { to: '/plan', label: 'Study plan', icon: CalendarRange },
  { to: '/practice', label: 'Practice', icon: FileCheck2 },
  { to: '/analytics', label: 'Scoring & analytics', icon: BarChart3 },
  { to: '/mistakes', label: 'Mistake journal', icon: ListChecks },
  { to: '/review', label: 'Knowledge review', icon: CheckCircle2 },
  { to: '/writing', label: 'Writing lab', icon: PenLine },
  { to: '/library', label: 'Library', icon: Library },
  { to: '/sources', label: 'Source register', icon: ShieldCheck },
  { to: '/reminders', label: 'Daily reminders', icon: BellRing },
  { to: '/settings', label: 'Settings', icon: Settings }
] as const;

const bottomItems = [navItems[0], navItems[1], navItems[3], navItems[5], navItems[6]];

export function AppShell() {
  const { state } = useAppState();
  const [online, setOnline] = useState(navigator.onLine);
  const location = useLocation();

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (!location.hash) return;
    // In-app links such as /coach#part1 target a section of a lazily loaded page,
    // so wait a few frames for it to mount before scrolling to it.
    const id = decodeURIComponent(location.hash.slice(1));
    let frame = 0;
    let attempts = 0;
    const seek = () => {
      const target = document.getElementById(id);
      if (target) target.scrollIntoView({ block: 'start' });
      else if (++attempts < 120) frame = window.requestAnimationFrame(seek);
    };
    seek();
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, location.hash]);

  const streak = currentStreak(state.studyDates);

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <NavLink to="/" className="brand" aria-label="AD5 Companion home">
          <span className="brand-mark"><GraduationCap size={24} /></span>
          <span><strong>AD5</strong><small>COMPANION</small></span>
        </NavLink>

        <div className="sidebar-phase">
          <div className="phase-orbit" aria-hidden="true"><span>{streak}</span></div>
          <div><small>STUDY STREAK</small><strong>{streak === 1 ? '1 day' : `${streak} days`}</strong></div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon, ...item }) => (
            <NavLink key={to} to={to} end={'end' in item ? item.end : false} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className={`connection-pill ${online ? '' : 'offline'}`}>
            {online ? <BookOpen size={15} /> : <WifiOff size={15} />}
            <span>{online ? 'Offline pack ready' : 'Working offline'}</span>
          </div>
          <p>Independent study tool<br />Assessment rules checked 13 Aug 2026<br />Part 1 roll-out checked 8 Oct 2026</p>
        </div>
      </aside>

      <header className="mobile-header">
        <NavLink to="/" className="mobile-brand"><span>AD5</span> COMPANION</NavLink>
        <NavLink to="/settings" className="icon-button" aria-label="Settings"><Settings size={20} /></NavLink>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {bottomItems.map(({ to, label, icon: Icon, ...item }) => (
          <NavLink key={to} to={to} end={'end' in item ? item.end : false} className={({ isActive }) => isActive ? 'active' : ''}>
            <Icon size={21} />
            <span>{label === 'Mistake journal' ? 'Mistakes' : label === 'Knowledge review' ? 'Review' : label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
