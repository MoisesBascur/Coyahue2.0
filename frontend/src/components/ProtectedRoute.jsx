import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = () => {
    // 1. Verificamos si existe el token en el almacenamiento
    const token = localStorage.getItem('authToken');

    // 2. Si NO hay token, redirigimos inmediatamente al Login
    // 'replace' evita que el usuario pueda volver atrás con el botón del navegador
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // 3. Si hay token, renderizamos el contenido hijo (las páginas protegidas)
    return <Outlet />;
};