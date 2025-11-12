import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import '../pages/Menu.css'; 

// 1. AÑADIMOS ArrowLeftCircle A LOS IMPORTS
import { 
    HouseDoor, 
    Speedometer2, 
    Calendar3, 
    People, 
    BoxSeam, 
    PersonCircle, 
    JournalText,
    ArrowLeftCircle // <-- NUEVO
} from 'react-bootstrap-icons';

const logoCoyahue = '/logo-coyahue.png'; 
const defaultAvatar = '/assets/default-avatar.png'; 

const Sidebar = ({ user }) => {
    const navigate = useNavigate();
    const handleLogout = () => { localStorage.removeItem('authToken'); navigate('/login'); };

    const displayName = user ? `${user.nombres} ${user.apellidos}` : 'Cargando...';
    
    let displayPicture = defaultAvatar;
    if (user?.perfil?.foto) {
        displayPicture = user.perfil.foto.startsWith('http') 
            ? user.perfil.foto 
            : `http://127.0.0.1:8000${user.perfil.foto}`;
    }

    const esAdmin = user?.es_admin === true;

    // (Nota: Idealmente, deberíamos mover este 'iconStyle' a CSS también en una refactorización futura, 
    // pero por ahora nos centramos en el Logout)
    const iconStyle = { marginRight: '10px', fontSize: '18px', marginTop: '-2px' };

    return (
        <div className="sidebar-container">
            <div className="sidebar-logo">
                <img src={logoCoyahue} alt="Grupo Coyahue" style={{ width: '150px' }}/>
            </div>
            <div className="sidebar-profile">
                <img src={displayPicture} alt="Perfil" className="profile-avatar-img" />
                <div>
                    <span className="profile-name">{displayName}</span>
                    <div style={{fontSize: '11px', color: '#777', marginTop: '2px'}}>
                        {esAdmin ? 'Administrador' : 'Equipo TI'}
                    </div>
                </div>
            </div>
            <nav className="sidebar-nav">
                <ul>
                    <li><NavLink to="/menu"><HouseDoor style={iconStyle} /> Menú</NavLink></li>
                    <li><NavLink to="/dashboard"><Speedometer2 style={iconStyle} /> Dashboard</NavLink></li>
                    <li><NavLink to="/calendario"><Calendar3 style={iconStyle} /> Calendario</NavLink></li>
                    
                    {esAdmin && (
                        <>
                            <li><NavLink to="/usuarios"><People style={iconStyle} /> Gestión Usuarios</NavLink></li>
                            <li><NavLink to="/auditoria"><JournalText style={iconStyle} /> Auditoría</NavLink></li>
                        </>
                    )}

                    <li><NavLink to="/inventario"><BoxSeam style={iconStyle} /> Inventario</NavLink></li>
                    <li><NavLink to="/perfil"><PersonCircle style={iconStyle} /> Mi Perfil</NavLink></li>
                </ul>
                
                <div className="sidebar-logout">
                    <button onClick={handleLogout} className="logout-btn">
                        {/* 2. USAMOS EL NUEVO ICONO CON CLASE CSS */}
                        <ArrowLeftCircle className="logout-icon" /> Cerrar Sesión
                    </button>
                </div>
            </nav>
        </div>
    );
}

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
      } catch (error) {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('authToken');
            navigate('/login');
        }
      }
    };
    fetchUserProfile();
  }, [navigate]);

  return (
    <div className="app-layout">
        <Sidebar user={userData} />
        <main className="main-content"><Outlet /></main>
    </div>
  );
};