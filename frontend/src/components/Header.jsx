import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellFill, XCircle } from 'react-bootstrap-icons';
import axios from 'axios';
import './Header.css';

const Header = ({ user }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estados para notificaciones reales
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(true);

    // Referencia para cerrar el menú si haces clic fuera (opcional pero recomendado)
    const dropdownRef = useRef(null);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/login');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        console.log("Buscando:", searchTerm);
    };

    // --- 1. CARGAR NOTIFICACIONES REALES ---
    const fetchNotifications = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            // Asumimos que las notificaciones viven en 'Actividades' o tienes un endpoint específico
            const response = await axios.get('http://127.0.0.1:8000/api/actividades/', {
                headers: { 'Authorization': `Token ${token}` }
            });

            const data = Array.isArray(response.data) ? response.data : response.data.results || [];

            // Filtramos solo las que son tipo 'notificacion' y ordenamos por fecha (más reciente primero)
            const filtered = data
                .filter(item => item.tipo === 'notificacion')
                .sort((a, b) => new Date(b.due_datetime || b.fecha) - new Date(a.due_datetime || a.fecha));

            setNotifications(filtered);
        } catch (error) {
            console.error("Error cargando notificaciones", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        
        // Opcional: Recargar cada 60 segundos para ver si hay nuevas
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    // --- 2. MANEJAR CLIC EN LA CAMPANA ---
    const handleNotificationClick = () => {
        setShowDropdown(!showDropdown);
    };

    // Foto de perfil
    const profileImage = user?.perfil?.foto_perfil 
        ? (user.perfil.foto_perfil.startsWith('http') ? user.perfil.foto_perfil : `http://127.0.0.1:8000${user.perfil.foto_perfil}`)
        : '/assets/default-avatar.png'; 

    const unreadCount = notifications.length; // O puedes filtrar por un campo 'leida' si lo tienes

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

                {/* --- SECCIÓN NOTIFICACIONES --- */}
                <div className="notification-wrapper" ref={dropdownRef}>
                    <button
                        className={`notification-btn ${unreadCount > 0 ? 'has-new' : ''}`}
                        onClick={handleNotificationClick}
                        title="Notificaciones"
                    >
                        {unreadCount > 0 ? <BellFill size={20} /> : <Bell size={20} />}
                        
                        {unreadCount > 0 && (
                            <span className="notification-badge">{unreadCount > 9 ? '+9' : unreadCount}</span>
                        )}
                    </button>

                    {/* --- MENU DESPLEGABLE (DROPDOWN) --- */}
                    {showDropdown && (
                        <div className="notification-dropdown">
                            <div className="dropdown-header">
                                <h4>Notificaciones</h4>
                                <button className="close-btn" onClick={() => setShowDropdown(false)}><XCircle /></button>
                            </div>
                            
                            <div className="dropdown-body">
                                {loading ? (
                                    <p className="notif-empty">Cargando...</p>
                                ) : notifications.length > 0 ? (
                                    notifications.map((notif) => (
                                        <div key={notif.id} className="notif-item">
                                            <div className="notif-icon">📢</div>
                                            <div className="notif-content">
                                                <p className="notif-title">{notif.titulo}</p>
                                                <p className="notif-desc">{notif.descripcion || 'Sin descripción'}</p>
                                                <span className="notif-date">
                                                    {notif.due_datetime 
                                                        ? new Date(notif.due_datetime).toLocaleDateString() 
                                                        : 'Fecha pendiente'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="notif-empty">No tienes notificaciones nuevas.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

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