import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import Menu from './pages/Menu';
import { AppLayout } from './components/AppLayout';
import { Inventario } from './pages/Inventario';
import { EquipoEdit } from './pages/EquipoEdit';
import { Perfil } from './pages/Perfil';
import { Usuarios } from './pages/Usuarios';
import { Dashboard } from './pages/Dashboard';
import { CrearUsuario } from './pages/CrearUsuario';
import { EditarUsuario } from './pages/EditarUsuario';
import { Calendario } from './pages/Calendario';
import { EquipoCrear } from './pages/EquipoCrear';
import { Auditoria } from './pages/Auditoria';
import { ProtectedRoute } from './components/ProtectedRoute';
import { EquipoDetalle } from './pages/EquipoDetalle';
import { ThemeProvider } from './ThemeContext';
import { BulkImportPage } from './pages/RENIEX'; 

// IMPORTACIÓN DE COMPONENTES DE INSUMOS
import { Insumos } from './pages/Insumos';
import { InsumoCrear } from './pages/InsumosCrear';
import { InsumoEdit } from './pages/InsumosEdit';

function App() {
    return (
        <ThemeProvider>
            <BrowserRouter>
                <Routes>
                    {/* Ruta pública */}
                    <Route path="/login" element={<Login />} />
                    
                    {/* ---------------------------------------------------- */}
                    {/* 🛑 RUTA DE DETALLE (LECTURA QR): CON LAYOUT CONDICIONAL 🛑 */}
                    {/* Envuelve el componente Detalle directamente con el AppLayout. */}
                    {/* El AppLayout usará la URL (?layout=qr) para ocultar el Sidebar. */}
                    <Route element={<ProtectedRoute />}>
                        <Route 
                            path="/inventario/ficha/:id" 
                            element={<AppLayout isQRLayout={true}><EquipoDetalle /></AppLayout>} 
                        />
                    </Route>
                    {/* ---------------------------------------------------- */}

                    {/* Rutas Protegidas (Con Sidebar por defecto) */}
                    <Route element={<ProtectedRoute />}>
                        {/* El AppLayout aquí funciona como contenedor y pone el Sidebar por defecto */}
                        <Route element={<AppLayout />}> 
                            <Route path="/menu" element={<Menu />} />
                            
                            {/* --- RUTAS DE INVENTARIO (ORDEN CORRECTO) --- */}
                            
                            {/* 1. BULK (Estática) */}
                            <Route path="/inventario/bulk" element={<BulkImportPage />} /> 
                            
                            {/* 2. CREACIÓN (Estática) */}
                            <Route path="/inventario/nuevo" element={<EquipoCrear />} />
                            
                            {/* 3. EDICIÓN (Dinámica: evita que /bulk sea leído como ID) */}
                            <Route path="/inventario/:id" element={<EquipoEdit />} />
                            
                            {/* 4. INVENTARIO BASE (Debe ir AL FINAL de las rutas /inventario/*) */}
                            <Route path="/inventario" element={<Inventario />} />

                            {/* --- RUTAS DE INSUMOS --- */}
                            <Route path="/insumos" element={<Insumos />} />
                            <Route path="/insumos/nuevo" element={<InsumoCrear />} />
                            <Route path="/insumos/:id" element={<InsumoEdit />} />

                            {/* --- RUTAS DE USUARIOS Y PERFIL --- */}
                            <Route path="/perfil" element={<Perfil />} />
                            <Route path="/usuarios" element={<Usuarios />} />
                            <Route path="/usuarios/nuevo" element={<CrearUsuario />} />
                            <Route path="/usuarios/:id" element={<EditarUsuario />} />

                            {/* --- OTRAS VISTAS --- */}
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/calendario" element={<Calendario />} />
                            <Route path="/auditoria" element={<Auditoria />} />
                        </Route>
                    </Route>

                    {/* Ruta por defecto */}
                    <Route path="/*" element={<Navigate to="/login" />} />
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;