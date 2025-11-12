import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Perfil.css'; 
import './EquipoEdit.css'; // Reutilizamos estructura de formulario

const defaultAvatar = '/assets/default-avatar.png';

export const Perfil = () => {
    const navigate = useNavigate();

    const [perfilData, setPerfilData] = useState({
        username: '',
        email: '',
        nombres: '',
        apellidos: '',
        perfil: { rut: '', area: '', ocupacion: '', foto: null },
        equipos_asignados: []
    });
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPerfil = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                navigate('/login'); 
                return;
            }
            
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/perfil/', {
                    headers: { 'Authorization': `Token ${token}` }
                });
                setPerfilData(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error cargando el perfil", err);
                setError('No se pudo cargar el perfil.');
                setLoading(false);
            }
        };
        fetchPerfil();
    }, [navigate]); 

    if (loading) return <p className="loading-msg">Cargando perfil...</p>;

    // Lógica de foto
    let displayPicture = defaultAvatar;
    if (perfilData.perfil?.foto) {
        displayPicture = perfilData.perfil.foto.startsWith('http') 
            ? perfilData.perfil.foto 
            : `http://127.0.0.1:8000${perfilData.perfil.foto}`;
    }

    return (
        <div className="perfil-container">
            <header className="main-header">
                <h1>Mi Perfil</h1>
            </header>
            
            {error && <p className="error-msg">{error}</p>}

            {/* --- SECCIÓN SUPERIOR --- */}
            <div className="perfil-header-card">
                <div className="perfil-foto">
                    <img src={displayPicture} alt="Foto de perfil" />
                </div>
                <div className="perfil-info-principal">
                    <label>Ocupación:</label>
                    <p>{perfilData.perfil?.ocupacion || 'No especificada'}</p>
                </div>
            </div>

            {/* --- SECCIÓN DETALLES --- */}
            <div className="edit-form-container section-no-top-margin">
                <h3>Información Personal</h3>
                
                <div className="perfil-form-grid">
                    <div className="form-column">
                        <div className="form-group-readonly">
                            <label>Nombres</label>
                            <input type="text" value={perfilData.nombres} readOnly disabled />
                        </div>
                        <div className="form-group-readonly">
                            <label>Correo Institucional </label>
                            <input type="email" value={perfilData.username} readOnly disabled />
                        </div>
                        <div className="form-group-readonly">
                            <label>RUT</label>
                            <input type="text" value={perfilData.perfil?.rut || ''} readOnly disabled />
                        </div>
                    </div>
                    <div className="form-column">
                        <div className="form-group-readonly">
                            <label>Apellidos</label>
                            <input type="text" value={perfilData.apellidos} readOnly disabled />
                        </div>
                        <div className="form-group-readonly">
                            <label>Email (Contacto)</label>
                            <input type="email" value={perfilData.email} readOnly disabled />
                        </div>
                        <div className="form-group-readonly">
                            <label>Área</label>
                            <input type="text" value={perfilData.perfil?.area || ''} readOnly disabled />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN MIS EQUIPOS --- */}
            <div className="edit-form-container section-spaced">
                <h3>Mis Equipos Asignados ({perfilData.equipos_asignados?.length || 0})</h3>
                
                {perfilData.equipos_asignados && perfilData.equipos_asignados.length > 0 ? (
                    <div className="equipos-table-wrapper">
                        <table className="equipos-table">
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Marca / Modelo</th>
                                    <th>Serie</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {perfilData.equipos_asignados.map(eq => (
                                    <tr key={eq.id}>
                                        <td>{eq.tipo}</td>
                                        <td>{eq.marca} {eq.modelo}</td>
                                        <td>{eq.nro_serie}</td>
                                        <td>
                                            <span className={`status-badge ${eq.estado === 'Activo' ? 'status-active' : 'status-inactive'}`}>
                                                {eq.estado}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="empty-msg">No tienes equipos asignados actualmente.</p>
                )}
            </div>
        </div>
    );
};