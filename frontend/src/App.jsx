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
// 1. Importar Auditoria
import { Auditoria } from './pages/Auditoria'; 

import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Ruta pública */}
                <Route path="/login" element={<Login />} />
                
                {/* Rutas Protegidas */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                        <Route path="/menu" element={<Menu />} />
                        
                        <Route path="/inventario" element={<Inventario />} />
                        <Route path="/inventario/nuevo" element={<EquipoCrear />} />
                        <Route path="/inventario/:id" element={<EquipoEdit />} />
                        
                        <Route path="/perfil" element={<Perfil />} />
                        
                        <Route path="/usuarios" element={<Usuarios />} />
                        <Route path="/usuarios/nuevo" element={<CrearUsuario />} />
                        <Route path="/usuarios/:id" element={<EditarUsuario />} />

                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/calendario" element={<Calendario />} />
                        
                        
                        <Route path="/auditoria" element={<Auditoria />} />
                    </Route>
                </Route> 

                {/* Ruta por defecto (si no encuentra la ruta, manda al login) */}
                <Route path="/*" element={<Navigate to="/login" />} /> 
            </Routes>
        </BrowserRouter>
    );
}

export default App;