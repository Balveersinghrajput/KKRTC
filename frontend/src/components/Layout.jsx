import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export function Header() {
  return (
    <div className="top">
      <img src="/logo.svg" alt="KKRTC" />
      <div className="t1">ಕಲ್ಯಾಣ ಕರ್ನಾಟಕ ರಸ್ತೆ ಸಾರಿಗೆ ನಿಗಮ</div>
      <div className="t2">ದೈನಂದಿನ ವಾಹನದ ಸ್ಥಿತಿಗತಿ</div>
    </div>
  );
}
export const Footer = () => <div className="foot">© Copyright 2024 KKRTC | All Rights Reserved</div>;

function Dropdown({ label, children, className }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);
  return (
    <div className="dd" ref={ref}>
      <button className={'caret ' + (open ? 'open' : '') + (className ? ' ' + className : '')}
              onClick={() => setOpen(!open)}>{label}</button>
      {open && <div className="menu show" onClick={() => setOpen(false)}>{children}</div>}
    </div>
  );
}

function SubMenu({ label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sub">
      <button className="caret" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>{label}</button>
      {open && <div className="menu show">{children}</div>}
    </div>
  );
}
export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Header />
      <div className="nav">
        <button className="burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
            <circle cx="8" cy="6" r="2" fill="#c0c8ca" /><circle cx="16" cy="12" r="2" fill="#c0c8ca" /><circle cx="10" cy="18" r="2" fill="#c0c8ca" />
          </svg>
        </button>
        <div className={'navitems' + (open ? ' open' : '')}
             onClick={(e) => { if (e.target.closest('a')) setOpen(false); }}>
          <Link className="home" to="/">Home</Link>
          <Dropdown label="KMPL">
            <Link to="/kmpl/depot">Add Depot KMPL</Link>
            <Link to="/kmpl/vehicle">Add Vehicle KMPL</Link>
          </Dropdown>
          <Dropdown label="Report">
            <SubMenu label="KMPL">
              <Link to="/reports/daily-logsheet">Daily Logsheet Report</Link>
              <Link to="/reports/monthly">Monthly KMPL Report</Link>
              <Link to="/reports/from-to">From-To date KMPL Report</Link>
              <Link to="/reports/from-to-typewise">From-To date KMPL Report Typewise</Link>
              <Link to="/reports/defect">KMPL Defect Report</Link>
            </SubMenu>
          </Dropdown>
        </div>
        <div className="user">
          <span>{user.name}</span>
          <Dropdown label={<span className="avatar"><svg viewBox="0 0 40 40"><rect width="40" height="40" fill="#5bb5e6"/><circle cx="20" cy="15" r="7" fill="#f2b98d"/><path d="M6 40c0-9 6-13 14-13s14 4 14 13z" fill="#1f86c7"/></svg></span>} className="avatarbtn">
            <a href="#" onClick={async (e) => { e.preventDefault(); await logout(); nav('/login'); }}>Logout</a>
          </Dropdown>
        </div>
      </div>
      <Outlet />
      <button className="up" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>&#8963;</button>
      <Footer />
    </>
  );
}
