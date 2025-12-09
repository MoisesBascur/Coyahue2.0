import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Sidebar } from './Sidebar'; 
import './Sidebar.css'; 

export const AppLayout = () => {
    const [userData, setUserData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserProfile = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) { navigate('/login'); return; }
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/perfil/', {
                    headers: { 'Authorization': `Token ${token}` }
                });
                setUserData(response.data); 
            } catch (error) { console.error(error); }
        };
        fetchUserProfile();
    }, [navigate]);

    return (
        <div className="app-layout-wrapper">
            
            {/* 1. Barra Lateral */}
            <Sidebar user={userData} />
            
            {/* 2. Contenido Principal (con margen izquierdo para no taparse) */}
            <main className="layout-content-push">
                <Outlet context={{ user: userData }} />
            </main>
            
        </div>
    );
};