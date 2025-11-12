import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// 1. Usaremos un CSS dedicado para el perfil
import './Perfil.css'; 
// 2. Importamos una imagen genérica para el avatar (puedes cambiarla)
import userAvatar from '../assets/avataradmin.jpg'; // Asume que tienes un avatar en src/assets/

export const Perfil = () => {
    const navigate = useNavigate();

    // Estado para los datos del perfil
    const [perfilData, setPerfilData] = useState({
        username: '',
        email: '',
        nombres: '',
        apellidos: '',
        perfil: { // 3. Estado anidado para los datos del perfil
            rut: '',
            area: '',
            ocupacion: ''
        }
    });
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Cargar datos del perfil cuando la página carga
    useEffect(() => {
        const fetchPerfil = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                navigate('/login'); // Si no hay token, fuera
                return;
            }
            
            try {
                // 4. Llama a la API de perfil
                const response = await axios.get(`http://127.0.0.1:8000/api/perfil/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                
                // 5. Rellena el estado con los datos (incluyendo los anidados)
                setPerfilData(response.data);
                setLoading(false);

            } catch (err) {
                console.error("Error cargando el perfil", err);
                setError('No se pudo cargar el perfil.');
                setLoading(false);
            }
        };
        fetchPerfil();
    }, [navigate]); // El 'navigate' es una dependencia del hook

    if (loading) return <p>Cargando perfil...</p>;

    return (
        <div className="perfil-container">
            <header className="main-header">
                <h1>Perfil del Usuario</h1>
            </header>
            
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {/* --- SECCIÓN SUPERIOR (Foto y Ocupación) --- */}
            <div className="perfil-header-card">
                <div className="perfil-foto">
                    <img src={userAvatar} alt="Foto de perfil" />
                </div>
                <div className="perfil-info-principal">
                    <label>Ocupación:</label>
                    {/* 6. Muestra la ocupación (o N/A si está vacía) */}
                    <p>{perfilData.perfil?.ocupacion || 'No especificada'}</p>
                </div>
            </div>

            {/* --- SECCIÓN INFERIOR (Detalles del Perfil) --- */}
            <div className="perfil-details-card">
                <h3>Perfil de Usuario</h3>
                <div className="perfil-form-grid">
                    
                    {/* Columna Izquierda */}
                    <div className="form-column">
                        <div className="form-group-readonly">
                            <label>Nombres</label>
                            <input type="text" value={perfilData.nombres} readOnly disabled />
                        </div>
                        <div className="form-group-readonly">
                            <label>Correo (Contacto)</label>
                            <input type="email" value={perfilData.email} readOnly disabled />
                        </div>
                        <div className="form-group-readonly">
                            <label>Área</label>
                            <input type="text" value={perfilData.perfil?.area || ''} readOnly disabled />
                        </div>
                    </div>
                    
                    {/* Columna Derecha */}
                    <div className="form-column">
                        <div className="form-group-readonly">
                            <label>Apellidos</label>
                            <input type="text" value={perfilData.apellidos} readOnly disabled />
                        </div>
                         <div className="form-group-readonly">
                            <label>RUT</label>
                            <input type="text" value={perfilData.perfil?.rut || ''} readOnly disabled />
                        </div>
                        <div className="form-group-readonly">
                            <label>Ocupación</label>
                            <input type="text" value={perfilData.perfil?.ocupacion || ''} readOnly disabled />
                        </div>
                    </div>
                </div>

                {/* Campo Username (ocupa todo el ancho) */}
                <div className="form-group-readonly">
                    <label>Username (para Login)</label>
                    <input type="text" value={perfilData.username} readOnly disabled />
                </div>
            </div>
        </div>
    );
};