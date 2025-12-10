import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Search, Trash, PencilSquare } from 'react-bootstrap-icons';
import './Insumos.css';

// URL base de tu backend
const API_URL = '/api'; 

export const Insumos = () => {
    const [insumos, setInsumos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    
    // Simulación de usuario administrador
    const esAdmin = true; 

    // --- Carga de datos ---
    useEffect(() => {
        const fetchInsumos = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) { 
                navigate('/login'); 
                return; 
            }
            try {
                const response = await api.get(`${API_URL}/insumos/`, { 
                    headers: { 'Authorization': `Token ${token}` }
                });
                setInsumos(response.data.results || response.data); 
            } catch (error) {
                console.error("Error al cargar insumos:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInsumos();
    }, [navigate]);

    // --- Filtrado de datos ---
    const filteredInsumos = insumos.filter(insumo => 
        insumo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        insumo.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="insumos-loading">Cargando Insumos...</div>;

    return (
        /* AQUÍ ESTÁ LA CLAVE: Agregamos "insumos-isolated-scope" para proteger el diseño */
        <div className="insumos-page-container insumos-isolated-scope">
            
            <header className="insumos-header">
                <h2>Gestión de Insumos</h2>
                <div className="header-actions">
                    <div className="search-bar-container">
                        <Search className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="insumos-search-input"
                        />
                    </div>
                    {esAdmin && (
                        <button 
                            className="create-insumo-btn"
                            onClick={() => navigate('/insumos/nuevo')}
                        >
                            <PlusCircle style={{ marginRight: '8px', fontSize: '1.1rem' }} /> Nuevo Insumo
                        </button>
                    )}
                </div>
            </header>

            {/* --- TABLA DE INSUMOS --- */}
            <div className="insumos-table-wrapper">
                {filteredInsumos.length === 0 ? (
                    <div className="empty-state">No se encontraron insumos coincidentes.</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Nombre</th>
                                <th>Stock Actual</th>
                                <th>Unidad</th>
                                <th>Ubicación</th>
                                {esAdmin && <th className="text-center">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInsumos.map(insumo => (
                                <tr key={insumo.id}>
                                    <td><strong>{insumo.codigo}</strong></td>
                                    <td>{insumo.nombre}</td>
                                    <td>
                                        <span className={insumo.stock_actual <= insumo.stock_minimo ? 'low-stock' : ''}>
                                            {insumo.stock_actual}
                                        </span>
                                    </td>
                                    <td>{insumo.unidad_medida}</td>
                                    <td>{insumo.ubicacion || '-'}</td>
                                    {esAdmin && (
                                        <td className="action-buttons text-center">
                                            <button 
                                                className="btn-icon btn-edit" 
                                                onClick={() => navigate(`/insumos/${insumo.id}`)}
                                                title="Editar"
                                            >
                                                <PencilSquare />
                                            </button>
                                            <button 
                                                className="btn-icon btn-delete" 
                                                onClick={() => console.log('Eliminar', insumo.id)}
                                                title="Eliminar"
                                            >
                                                <Trash />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};