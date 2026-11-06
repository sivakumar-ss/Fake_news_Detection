import { Link } from 'react-router-dom'
import { GitBranch, ScanSearch, ShieldCheck } from 'lucide-react'

const footerLinks = [
  { to: '/analyze', label: 'Analyze' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/history', label: 'History' },
  { to: '/about', label: 'About & limits' },
]

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <Link to="/" className="brand" aria-label="FakeNewsDetect home">
            <span className="brand__mark" aria-hidden="true">
              <ScanSearch size={20} />
            </span>
            <span className="brand__name">
              FakeNews<span>Detect</span>
            </span>
          </Link>
          <p>
            An AI-assisted media-literacy project. It reads the writing, not the
            facts, and never replaces independent verification.
          </p>
          <span className="site-footer__trust">
            <ShieldCheck size={15} aria-hidden="true" />
            API keys stay on the server
          </span>
        </div>

        <nav className="site-footer__links" aria-label="Footer">
          <h2>Explore</h2>
          {footerLinks.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="site-footer__note">
          <h2>Built with</h2>
          <p>React · Vite · Flask · AI · SQLite</p>
          <p className="site-footer__fineprint">
            Assessment scores are estimates of writing-level signals. They are
            not probabilities that a claim is true.
          </p>
        </div>
      </div>

      <div className="container site-footer__bottom">
        <p>© {new Date().getFullYear()} FakeNewsDetect. All rights reserved.</p>
        <p className="site-footer__meta">
          <GitBranch size={14} aria-hidden="true" />
          Local-first media literacy
        </p>
      </div>
    </footer>
  )
}
