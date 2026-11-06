import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import About from './pages/About'
import Analyze from './pages/Analyze'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import HistoryDetail from './pages/HistoryDetail'
import Home from './pages/Home'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="analyze" element={<Analyze />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="history" element={<History />} />
        <Route path="history/:id" element={<HistoryDetail />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
