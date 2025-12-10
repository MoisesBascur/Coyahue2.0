import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { PersonCircle, Briefcase, Envelope, PersonVcard } from 'react-bootstrap-icons';
import './Perfil.css'; // Importamos el nuevo CSS unificado

const defaultAvatar = 'https://via.placeholder.com/150'; // O tu imagen por defecto local

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
                const response = await api.get('/api/perfil/', {
                    headers: { 'Authorization': `Token ${token}` }
                });
                setPerfilData(response.data);
            } catch (err) {
                console.error("Error cargando el perfil", err);
                setError('No se pudo cargar la información del perfil.');
            } finally {
                setLoading(false);
            }
        };
        fetchPerfil();
    }, [navigate]); 

    if (loading) return <div className="perfil-loading">Cargando perfil...</div>;

    // Lógica de foto
    let displayPicture = defaultAvatar;
    if (perfilData.perfil?.foto) {
        displayPicture = perfilData.perfil.foto.startsWith('http') 
            ? perfilData.perfil.foto 
            : perfilData.perfil.foto;
    }

    // Nombre completo seguro
    const fullName = `${perfilData.nombres || ''} ${perfilData.apellidos || ''}`.trim() || perfilData.username;

    return (
        /* CLASE CLAVE: perfil-isolated-scope para proteger el diseño */
        <div className="perfil-page-container perfil-isolated-scope">
            
            <header className="perfil-header">
                <h2>Mi Perfil</h2>
            </header>
            
            {error && <div className="alert-error">{error}</div>}

            <div className="perfil-content-grid">
                
                {/* --- TARJETA 1: RESUMEN (IZQUIERDA) --- */}
                <div className="perfil-card summary-card">
                    <div className="avatar-wrapper">
                        <img src={displayPicture} alt="Foto de perfil" className="profile-img" />
                    </div>
                    <h3 className="profile-name">{fullName}</h3>
                    <p className="profile-role">{perfilData.perfil?.ocupacion || 'Sin cargo definido'}</p>
                    <div className="profile-status">
                        <span className="status-badge status-active">Activo</span>
                    </div>
                </div>

                {/* --- TARJETA 2: DETALLES (DERECHA) --- */}
                <div className="perfil-card details-card">
                    <div className="card-header-title">
                        <h3>Información Personal</h3>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label><PersonVcard className="icon"/> RUT</label>
                            <input type="text" value={perfilData.perfil?.rut || ''} readOnly disabled />
                        </div>
                        <div className="form-group">
                            <label><Envelope className="icon"/> Correo Electrónico</label>
                            <input type="email" value={perfilData.email} readOnly disabled />
                        </div>
                        <div className="form-group">
                            <label><Briefcase className="icon"/> Área / Departamento</label>
                            <input type="text" value={perfilData.perfil?.area || ''} readOnly disabled />
                        </div>
                        <div className="form-group">
                            <label><PersonCircle className="icon"/> Usuario de Sistema</label>
                            <input type="text" value={perfilData.username} readOnly disabled />
                        </div>
                    </div>
                </div>

                {/* --- TARJETA 3: MIS EQUIPOS (ABAJO) --- */}
                <div className="perfil-card full-width-card">
                    <div className="card-header-title">
                        <h3>Mis Equipos Asignados ({perfilData.equipos_asignados?.length || 0})</h3>
                    </div>
                    
                    <div className="table-wrapper">
                        {perfilData.equipos_asignados && perfilData.equipos_asignados.length > 0 ? (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Serie</th>
                                        <th>Marca / Modelo</th>
                                        <th>Tipo</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {perfilData.equipos_asignados.map(eq => (
                                        <tr key={eq.id}>
                                            <td className="font-mono">{eq.nro_serie}</td>
                                            <td><strong>{eq.marca}</strong> {eq.modelo}</td>
                                            <td>{eq.tipo || 'Equipo'}</td>
                                            <td>
                                                <span className={`status-badge ${
                                                    eq.estado === 'Activo' ? 'status-active' : 'status-inactive'
                                                }`}>
                                                    {eq.estado || 'Asignado'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state">No tienes equipos asignados actualmente.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};