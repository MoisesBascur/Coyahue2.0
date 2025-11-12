import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios'; // 1. Importa axios
import '../pages/Menu.css'; 
const logoCoyahue = '/public/.png'; 
// 2. Importa un avatar por defecto
const defaultAvatar = '/assets/avataradmin.jpg'; // Asume que pondrás una imagen en 'public/assets/'

// --- Componente de la Barra Lateral ---
// 3. Ahora acepta 'user' como prop
const Sidebar = ({ user }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/login');
    };

    // 4. Determina el nombre y la foto a mostrar
    const displayName = user ? `${user.nombres} ${user.apellidos}` : 'Cargando...';
    const displayPicture = user?.perfil?.foto_url || defaultAvatar;

    return (
        <div className="sidebar-container">
            <div className="sidebar-logo">
                <img src={logoCoyahue} alt="Grupo Coyahue" style={{ width: '150px' }}/>
            </div>
            
            {/* --- SECCIÓN DE PERFIL ACTUALIZADA --- */}
            <div className="sidebar-profile">
                {/* 5. Muestra la imagen de perfil */}
                <img src={displayPicture} alt="Perfil" className="profile-avatar-img" />
                {/* 6. Muestra el nombre real */}
                <span className="profile-name">{displayName}</span>
            </div>
            {/* --- FIN SECCIÓN ACTUALIZADA --- */}

            <nav className="sidebar-nav">
                <ul>
                    <li><NavLink to="/menu">Menu</NavLink></li>
                    <li><NavLink to="/dashboard">Dashboard</NavLink></li>
                    <li><NavLink to="/calendario">Calendario</NavLink></li>
                    <li><NavLink to="/usuarios">Usuarios</NavLink></li>
                    <li><NavLink to="/inventario">Inventario</NavLink></li>
                    <li><NavLink to="/perfil">Perfil</NavLink></li>
                </ul>
                
                <div className="sidebar-logout">
                    <button onClick={handleLogout} className="logout-btn">
                        Cerrar Sesión
                    </button>
                </div>
            </nav>
        </div>
    );
}

// --- El Layout Principal ---
export const AppLayout = () => {
  // 7. Estado para guardar los datos del usuario
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  // 8. useEffect para cargar los datos del usuario UNA VEZ
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login'); // Si no hay token, no deberíamos estar aquí
        return;
      }
      
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/perfil/', {
          headers: { 'Authorization': `Token ${token}` }
        });
        setUserData(response.data); // Guarda los datos del usuario
      } catch (error) {
        console.error("Error al cargar datos de usuario para el layout:", error);
        // Si el token es inválido, podría redirigir al login
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('authToken');
            navigate('/login');
        }
      }
    };

    fetchUserProfile();
  }, [navigate]); // Se ejecuta solo una vez

  return (
    <div className="app-layout">
        {/* 9. Pasa los datos del usuario al Sidebar */}
        <Sidebar user={userData} />
        <main className="main-content">
            <Outlet /> 
        </main>
    </div>
  );
};