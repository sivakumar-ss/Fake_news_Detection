import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { USE_SAMPLE_DATA } from '../services/api'
import DemoBanner from './DemoBanner'
import Footer from './Footer'
import Navbar from './Navbar'

export default function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navbar />
      {USE_SAMPLE_DATA && <DemoBanner />}
      <main id="main-content" className="site-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
