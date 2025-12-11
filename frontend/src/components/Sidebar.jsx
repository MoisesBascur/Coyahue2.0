import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../api'; 
import { useTheme } from '../ThemeContext'; 
import './Sidebar.css'; 
import { 
    HouseDoor, Speedometer2, Calendar3, People, BoxSeam, 
    PersonCircle, JournalText, ArrowLeftCircle, MoonStars, Sun,
    Bell, BellFill, XCircle, Tools         
} from 'react-bootstrap-icons';

// Función auxiliar para normalizar la respuesta de la API
const normalize = (resp) => Array.isArray(resp.data) ? resp.data : (Array.isArray(resp.data?.results) ? resp.data.results : []);

export const Sidebar = ({ user }) => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    // --- LÓGICA DE NOTIFICACIONES ---
    const [notificaciones, setNotificaciones] = useState([]);
    const [hayNotificacion, setHayNotificacion] = useState(false);
    const [mostrarPanel, setMostrarPanel] = useState(false);
    const panelRef = useRef(null); 
    const [imgError, setImgError] = useState(false);

    // Función auxiliar para obtener datos de notificación
    const getNotificationData = (notif) => {
        const titulo = notif.titulo || notif.title || notif.nombre || 'Evento del Sistema'; 
        const descripcion = notif.descripcion || notif.description || 'Detalle no disponible';
        const rawDate = notif.fecha || notif.fecha_creacion || notif.due_datetime;
        
        const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString([], {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : 'Sin Fecha/Hora';

        return { titulo, descripcion, formattedDate };
    }

    // 1. Cargar notificaciones
    useEffect(() => {
        const fetchNotificaciones = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            try {
                const response = await api.get('/api/notificaciones/', {
                    headers: { 'Authorization': `Token ${token}` }
                });
                
                const notificacionesArray = normalize(response); 

                if (notificacionesArray.length > 0) {
                    setNotificaciones(notificacionesArray);
                    setHayNotificacion(true);
                } else {
                    setNotificaciones([]);
                    setHayNotificacion(false);
                }
            } catch (error) {
                console.error("Error cargando notificaciones:", error);
                setNotificaciones([]);
                setHayNotificacion(false);
            }
        };

        fetchNotificaciones();
        const intervalo = setInterval(fetchNotificaciones, 15000); 
        return () => clearInterval(intervalo);
    }, []);

    // 2. Cerrar panel al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setMostrarPanel(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [panelRef]);

    const handleLogout = () => { 
        localStorage.removeItem('authToken'); 
        navigate('/login'); 
    };
    
    const displayName = user ? `${user.nombres} ${user.apellidos}` : 'Cargando...';
    const esAdmin = user?.es_admin === true;

    const userPhotoUrl = user?.perfil?.foto 
        ? (user.perfil.foto.startsWith('http') 
            ? user.perfil.foto 
            : user.perfil.foto)
        : null;

    return (
        <div className="sidebar-container">
            <div className="sidebar-logo">
                {/* --- Aqui elimina la etiqueta y deja solo lo que queda ahora ... /> --- */}
                
                <div className="logo-text-container">
                    <span className="logo-grupo">Grupo</span>
                    <span className="logo-coyahue">Coyahue</span>
                </div>
            </div>
            
            <div className="sidebar-profile profile-with-bell"> 
                {userPhotoUrl && !imgError ? (
                    <img src={userPhotoUrl} alt="Perfil" className="profile-avatar-img" onError={() => setImgError(true)} />
                ) : (
                    <PersonCircle size={40} color="#ccc" className="profile-avatar-icon" style={{marginRight:'10px'}} />
                )}
                
                <div className="profile-info-content">
                    <span className="profile-name">{displayName}</span>
                    <div className="profile-role-text">{esAdmin ? 'Administrador' : 'Equipo TI'}</div>
                </div>

                <div ref={panelRef} className="bell-position-container">
                    <button 
                        onClick={() => setMostrarPanel(!mostrarPanel)}
                        title="Notificaciones"
                        className={`notification-bell ${hayNotificacion ? 'has-notification' : ''}`}
                    >
                        <div className="bell-icon-wrapper">
                            {hayNotificacion ? <BellFill size={18} /> : <Bell size={18} className="bell-icon-default" />}
                            {hayNotificacion && <span className="notification-dot"></span>}
                        </div>
                    </button>

                    {mostrarPanel && (
                        <div className="notification-panel">
                            <div className="notif-header">
                                <span>Notificaciones</span>
                                <XCircle onClick={() => setMostrarPanel(false)} style={{cursor: 'pointer'}} />
                            </div>
                            
                            <div className="notif-body">
                                {notificaciones.length > 0 ? (
                                    notificaciones.map((notif) => {
                                        const { titulo, descripcion, formattedDate } = getNotificationData(notif);
                                        return (
                                            <div key={notif.id} className="notif-item" style={{borderBottom:'1px solid var(--sb-border)', padding:'10px'}}>
                                                <div style={{fontWeight:'bold', fontSize:'0.9rem', color: 'var(--sb-text)'}}>
                                                    {titulo}
                                                </div>
                                                <div style={{fontSize:'0.85rem', color:'var(--sb-text-sec)'}}>
                                                    {descripcion}
                                                </div>
                                                <div style={{fontSize:'0.75rem', color:'var(--sb-text-sec)', opacity:'0.7', marginTop:'4px'}}>
                                                    {formattedDate}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="notif-empty">No hay notificaciones nuevas</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    <li><NavLink to="/menu" className={({ isActive }) => isActive ? "active" : ""}><HouseDoor className="nav-icon" /> Menú</NavLink></li>
                    <li><NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}><Speedometer2 className="nav-icon" /> Dashboard</NavLink></li>
                    <li><NavLink to="/calendario" className={({ isActive }) => isActive ? "active" : ""}><Calendar3 className="nav-icon" /> Calendario</NavLink></li>
                    
                    {esAdmin && (
                        <>
                            <li><NavLink to="/usuarios" className={({ isActive }) => isActive ? "active" : ""}><People className="nav-icon" /> Gestión Usuarios</NavLink></li>
                            <li><NavLink to="/auditoria" className={({ isActive }) => isActive ? "active" : ""}><JournalText className="nav-icon" /> Auditoría</NavLink></li>
                        </>
                    )}

                    <li><NavLink to="/inventario" className={({ isActive }) => isActive ? "active" : ""}><BoxSeam className="nav-icon" /> Inventario</NavLink></li>
                    <li><NavLink to="/insumos" className={({ isActive }) => isActive ? "active" : ""}><Tools className="nav-icon" /> Insumos</NavLink></li>
                    <li><NavLink to="/perfil" className={({ isActive }) => isActive ? "active" : ""}><PersonCircle className="nav-icon" /> Mi Perfil</NavLink></li>
                </ul>
                
                <div className="sidebar-footer-actions">
                    <button onClick={toggleTheme} className="theme-toggle-btn" title="Cambiar tema">
                        {theme === 'light' ? <><MoonStars className="nav-icon" /> Modo Oscuro</> : <><Sun className="nav-icon" /> Modo Claro</>}
                    </button>
                
                    <div className="sidebar-logout">
                        <button onClick={handleLogout} className="logout-btn">
                            <ArrowLeftCircle className="logout-icon" /> Cerrar Sesión
                        </button>
                    </div>
                </div>
            </nav>
        </div>
    );
};