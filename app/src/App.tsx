import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Inventario from './pages/Inventario'
import Riparazioni from './pages/Riparazioni'
import Modulistica from './pages/Modulistica'
import Supporto from './pages/Supporto'
import QRGenerator from './pages/QRGenerator'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/riparazioni" element={<Riparazioni />} />
        <Route path="/modulistica" element={<Modulistica />} />
        <Route path="/supporto" element={<Supporto />} />
        <Route path="/qr-pvr" element={<QRGenerator />} />
      </Routes>
    </Layout>
  )
}
