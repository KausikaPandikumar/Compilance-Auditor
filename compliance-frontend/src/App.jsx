import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{padding:'12px 24px', background:'#0f1117', display:'flex', gap:'20px'}}>
        <Link to="/" style={{color:'#fff', fontSize:'13px'}}>Dashboard</Link>
        <Link to="/upload" style={{color:'#fff', fontSize:'13px'}}>Upload Doc</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard shipmentId={1} />} />
        <Route path="/upload" element={<Upload shipmentId={1} />} />
      </Routes>
    </BrowserRouter>
  )
}