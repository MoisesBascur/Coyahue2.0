import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { Sidebar } from './Sidebar'; 
import './Sidebar.css'; 
// Asegúrate de que este archivo existe y se importa
import './AppLayout.css'; 

// Recibe 'children' y 'isDetallePage' cuando se usa fuera del anidamiento principal.
export const AppLayout = ({ children }) => {
    const [userData, setUserData] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    // 1. Lógica para detectar si la URL es una lectura de QR o si es la ruta de detalle
    const searchParams = new URLSearchParams(location.search);
    const layoutMode = searchParams.get('layout'); // Busca el valor 'qr'
    
    // Determinar si es la página de detalle Y si tiene el flag 'layout=qr'
    // Las rutas de detalle siempre tienen '/inventario/ficha/' o un ID en la URL
    const isDetallePage = location.pathname.includes('/inventario/ficha/');
    
    // 🛑 CLAVE: Ocultar el Sidebar si es la página de detalle Y tiene el flag QR
    const hideSidebar = isDetallePage && layoutMode === 'qr'; 
    
    // Clase CSS condicional
    // Si hideSidebar es true, usa 'layout-content-full'; si no, usa 'layout-content-push'
    const contentClassName = hideSidebar ? "layout-content-full" : "layout-content-push";

    useEffect(() => {
        const fetchUserProfile = async () => {
            const token = localStorage.getItem('authToken');
            
            if (!token) { 
                // Guardamos la ruta COMPLETA (pathname + search)
                navigate('/login', { state: { from: location } }); 
                return; 
            }
            try {
                const response = await api.get('/api/perfil/', {
                    headers: { 'Authorization': `Token ${token}` }
                });
                setUserData(response.data); 
            } catch (error) { 
                console.error(error); 
            }
        };
        fetchUserProfile();
    }, [navigate, location]);

    return (
        <div className="app-layout-wrapper">
            
            {/* 1. Barra Lateral (Oculta si hideSidebar es true) */}
            {!hideSidebar && <Sidebar user={userData} />}
            
            {/* 2. Contenido Principal (usamos children si hay un elemento envuelto, o Outlet si es anidado) */}
            <main className={contentClassName}> 
                {children ? children : <Outlet context={{ user: userData }} />}
            </main>
            
        </div>
    );
};