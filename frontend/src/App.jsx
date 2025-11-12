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
import { Calendario } from './pages/Calendario'; // 1. Importar

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route element={<AppLayout />}>
                    <Route path="/menu" element={<Menu />} />
                    <Route path="/inventario" element={<Inventario />} />
                    <Route path="/inventario/:id" element={<EquipoEdit />} />
                    <Route path="/perfil" element={<Perfil />} />
                    <Route path="/usuarios" element={<Usuarios />} />
                    <Route path="/usuarios/nuevo" element={<CrearUsuario />} />
                    <Route path="/usuarios/:id" element={<EditarUsuario />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/calendario" element={<Calendario />} />
                </Route>

                <Route path="/*" element={<Navigate to="/login" />} /> 
            </Routes>
        </BrowserRouter>
    );
}

export default App;