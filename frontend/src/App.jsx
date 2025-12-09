import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Menu } from './pages/Menu';
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
                    
                    {/* Rutas Protegidas */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<AppLayout />}>
                            <Route path="/menu" element={<Menu />} />
                            
                            {/* --- RUTAS DE INVENTARIO (EQUIPOS) --- */}
                            <Route path="/inventario" element={<Inventario />} />
                            <Route path="/inventario/nuevo" element={<EquipoCrear />} />
                            <Route path="/inventario/ficha/:id" element={<EquipoDetalle />} />
                            <Route path="/inventario/:id" element={<EquipoEdit />} />
                            
                            {/* --- RUTAS DE INSUMOS --- */}
                            <Route path="/insumos" element={<Insumos />} />
                            <Route path="/insumos/nuevo" element={<InsumoCrear />} />
                            <Route path="/insumos/:id" element={<InsumoEdit />} /> {/* <--- 2. RUTA AGREGADA (El :id es la clave) */}

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
