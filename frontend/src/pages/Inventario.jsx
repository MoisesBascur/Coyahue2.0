import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Inventario.css';
import { useNavigate } from 'react-router-dom';

// --- CORRECCIÓN IMPORTANTE: 'export const' ---
export const Inventario = () => { 
    const [equipos, setEquipos] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState(''); // Estado del buscador
    const navigate = useNavigate(); 

    useEffect(() => {
        const fetchEquipos = async () => {
            setLoading(true); 
            try {
                const token = localStorage.getItem('authToken');
                if (!token) throw new Error('No estás autenticado');

                const response = await axios.get('http://127.0.0.1:8000/api/equipos/', {
                    headers: { 'Authorization': `Token ${token}` }
                });
                
                setEquipos(response.data); 

            } catch (err) {
                console.error("Error detallado al cargar inventario:", err);
                setError('Error al cargar el inventario.');
            } finally {
                setLoading(false); 
            }
        };
        fetchEquipos();
    }, []); 

    const handleEditClick = (id) => {
        navigate(`/inventario/${id}`);
    };

    // --- TU LÓGICA DE FILTRADO (INTEGRADA) ---
    const equiposFiltrados = equipos.filter(equipo => {
        const term = searchTerm.toLowerCase();
        
        // Datos del equipo
        const marca = (equipo.marca || '').toLowerCase();
        const modelo = (equipo.modelo || '').toLowerCase();
        const serie = (equipo.nro_serie || '').toLowerCase();
        const rutEquipo = (equipo.rut_asociado || '').toLowerCase(); 
        
        // Datos del usuario responsable (puede ser null)
        const nombreUsuario = equipo.id_usuario_responsable ? equipo.id_usuario_responsable.username.toLowerCase() : '';
        
        return (
            marca.includes(term) ||
            modelo.includes(term) ||
            serie.includes(term) ||
            rutEquipo.includes(term) || 
            nombreUsuario.includes(term)
        );
    });

    if (loading) return <p>Cargando inventario...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <>
            <header className="main-header">
                <h1>Visualización de Inventario</h1>
                <input 
                    type="search" 
                    placeholder="Buscar por serie, marca, usuario..." 
                    className="main-searchbar"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </header>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>RUT</th>
                            <th>Marca</th>
                            <th>Modelo</th>
                            <th>Número</th>
                            <th>ID</th>
                            <th>Editar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Usamos la lista filtrada aquí */}
                        {equiposFiltrados.map(equipo => (
                            <tr key={equipo.id}>
                                <td>{equipo.id_usuario_responsable ? equipo.id_usuario_responsable.username : 'N/A'}</td> 
                                <td>{equipo.rut_asociado || 'N/A'}</td>
                                
                                <td>{equipo.marca}</td>
                                <td>{equipo.modelo}</td>
                                <td>{equipo.nro_serie}</td>
                                <td>{equipo.id}</td>
                                <td>
                                    <button onClick={() => handleEditClick(equipo.id)}>
                                        ...
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {equiposFiltrados.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>
                                    No se encontraron equipos.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
};