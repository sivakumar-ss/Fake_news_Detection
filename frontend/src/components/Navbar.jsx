import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, ScanSearch, Sparkles, X } from 'lucide-react'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/analyze', label: 'Analyze' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/history', label: 'History' },
  { to: '/about', label: 'About' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <NavLink to="/" className="brand" aria-label="FakeNewsDetect home">
          <span className="brand__mark" aria-hidden="true">
            <ScanSearch size={22} strokeWidth={2.2} />
          </span>
          <span className="brand__name">
            FakeNews<span>Detect</span>
          </span>
        </NavLink>

        <nav
          id="primary-navigation"
          className={`site-nav${open ? ' site-nav--open' : ''}`}
          aria-label="Primary"
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `site-nav__link${isActive ? ' site-nav__link--active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <Link className="btn btn--primary btn--sm site-nav__cta" to="/analyze">
            <Sparkles size={16} aria-hidden="true" />
            Analyze now
          </Link>
        </nav>

        <div className="site-header__actions">
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="primary-navigation"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  )
}
