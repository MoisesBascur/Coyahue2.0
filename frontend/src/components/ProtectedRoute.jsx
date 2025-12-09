import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// USAMOS "export const" (NO default) PARA QUE COINCIDA CON APP.JSX
export const ProtectedRoute = () => {
    const token = localStorage.getItem('authToken');

    // Si no hay token, mandar al login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Si hay token, dejar pasar a las rutas hijas
    return <Outlet />;
};