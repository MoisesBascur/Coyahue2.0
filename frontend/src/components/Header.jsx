import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css'; // Mantenemos el CSS del Header

const Header = ({ user }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    
    // --- Lógica de Notificaciones ELIMINADA ---

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/login');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        console.log("Buscando:", searchTerm);
        // Aquí podrías redirigir a una página de búsqueda global
    };

    // --- Lógica de Notificaciones ELIMINADA (fetchNotifications, useEffects) ---

    // Foto de perfil
    const profileImage = user?.perfil?.foto_perfil 
    ? (user.perfil.foto_perfil.startsWith('http') 
        ? user.perfil.foto_perfil 
        : user.perfil.foto_perfil)
    : '/assets/default-avatar.png';

    // --- Variables de Notificación ELIMINADAS (unreadCount, etc.) ---

    return (
        <header className="main-header">
            {/* Barra de búsqueda */}
            <form className="search-form" onSubmit={handleSearch}>
                <input
                    type="search"
                    placeholder="Buscar en el sistema..."
                    className="main-searchbar"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </form>

            <div className="user-controls">

                {/* --- SECCIÓN NOTIFICACIONES ELIMINADA --- */}
                {/* Ahora el Sidebar se encarga de esto. */}
                
                {/* Info Usuario */}
                <div className="user-info">
                    <div className="user-details">
                        <span className="user-name">{user?.nombres || user?.username || 'Usuario'}</span>
                    </div>
                    <img
                        src={profileImage}
                        alt="Perfil"
                        className="user-avatar"
                        onError={(e) => e.target.src = '/assets/default-avatar.png'}
                    />
                </div>
                
                <button onClick={handleLogout} className="btn-logout">Salir</button>
            </div>
        </header>
    );
};

export default Header;