import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Inventario.css';
import { useNavigate } from 'react-router-dom';

export const Inventario = () => {
    const [equipos, setEquipos] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estados para Paginación
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);
    const [totalCount, setTotalCount] = useState(0);

    // Estado para la tarjeta flotante de detalles
    const [infoCardData, setInfoCardData] = useState(null);
    
    const navigate = useNavigate(); 

    const getFileUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `http://127.0.0.1:8000${url}`;
    };

    const fetchEquipos = async (url = 'http://127.0.0.1:8000/api/equipos/') => {
        setLoading(true); 
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('No estás autenticado');

            const response = await axios.get(url, {
                headers: { 'Authorization': `Token ${token}` }
            });

            if (response.data.results) {
                setEquipos(response.data.results);
                setNextPage(response.data.next);
                setPrevPage(response.data.previous);
                setTotalCount(response.data.count);
            } else {
                setEquipos(response.data);
            }
        } catch (err) {
            console.error(err);
            setError('Error al cargar el inventario.');
        } finally {
            setLoading(false); 
        }
    };

    useEffect(() => {
        fetchEquipos();
    }, []); 

    const handleEditClick = (id) => navigate(`/inventario/${id}`);
    const handleCreateClick = () => navigate('/inventario/nuevo');

    const toggleInfoCard = (equipo) => {
        if (infoCardData && infoCardData.id === equipo.id) {
            setInfoCardData(null);
        } else {
            setInfoCardData(equipo);
        }
    };

    // Funciones de Paginación
    const handleNext = () => { if (nextPage) fetchEquipos(nextPage); };
    const handlePrev = () => { if (prevPage) fetchEquipos(prevPage); };

    const equiposFiltrados = equipos.filter(equipo => {
        const term = searchTerm.toLowerCase();
        const marca = (equipo.marca || '').toLowerCase();
        const modelo = (equipo.modelo || '').toLowerCase();
        const serie = (equipo.nro_serie || '').toLowerCase();
        const rutEquipo = (equipo.rut_asociado || '').toLowerCase(); 
        const nombreUsuario = equipo.id_usuario_responsable ? equipo.id_usuario_responsable.username.toLowerCase() : '';
        
        return (
            marca.includes(term) || modelo.includes(term) ||
            serie.includes(term) || rutEquipo.includes(term) || 
            nombreUsuario.includes(term)
        );
    });

    if (loading) return <p className="loading-msg">Cargando inventario...</p>;
    if (error) return <p className="error-msg">{error}</p>;

    return (
        <>
            <header className="main-header header-wrapper">
                <h1> Gestion de Inventario</h1>
                <div className="header-controls">
                    <input 
                        type="search" 
                        placeholder="Filtrar página actual..." 
                        className="main-searchbar"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button onClick={handleCreateClick} className="btn-nuevo">
                        Nuevo Equipo
                    </button>
                </div>
            </header>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>RUT</th>
                            <th>Marca</th>
                            <th>Modelo</th>
                            <th>Serie</th>
                            <th className="text-center">Specs</th>
                            <th>ID</th>
                            <th>Editar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {equiposFiltrados.map(equipo => (
                            <tr key={equipo.id}>
                                <td>{equipo.id_usuario_responsable ? equipo.id_usuario_responsable.username : 'N/A'}</td> 
                                <td>{equipo.rut_asociado || 'N/A'}</td>
                                <td>{equipo.marca}</td>
                                <td>{equipo.modelo}</td>
                                <td>{equipo.nro_serie}</td>
                                
                                <td className="popover-cell">
                                    <button 
                                        className={`info-btn ${infoCardData?.id === equipo.id ? 'active' : ''}`}
                                        onClick={() => toggleInfoCard(equipo)}
                                        title="Ver Especificaciones y Factura"
                                    >
                                        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="16" x2="12" y2="12"></line>
                                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                        </svg>
                                    </button>
                                </td>

                                <td>{equipo.id}</td>
                                <td>
                                    <button className="btn-action" onClick={() => handleEditClick(equipo.id)}>...</button>
                                </td>
                            </tr>
                        ))}
                        {equiposFiltrados.length === 0 && (
                            <tr>
                                <td colSpan="8" className="empty-cell">
                                    No se encontraron equipos.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="pagination-container">
                    <button onClick={handlePrev} disabled={!prevPage} className="btn-pagination">Anterior</button>
                    <span className="pagination-info">Mostrando {equipos.length} de {totalCount}</span>
                    <button onClick={handleNext} disabled={!nextPage} className="btn-pagination">Siguiente</button>
                </div>
            </div>

            {infoCardData && (
                <>
                    <div className="popover-overlay" onClick={() => setInfoCardData(null)}></div>
                    
                    <div className="specs-floating-card">
                        <div className="specs-header">
                            <h4>Especificaciones Técnicas</h4>
                            <button className="close-specs" onClick={() => setInfoCardData(null)}>&times;</button>
                        </div>
                        <div className="specs-body">
                            <p className="specs-title"><strong>Equipo:</strong> {infoCardData.marca} {infoCardData.modelo}</p>
                            <hr className="specs-separator" />
                            <ul>
                                <li><strong>Procesador:</strong> {infoCardData.procesador || '-'}</li>
                                <li><strong>RAM:</strong> {infoCardData.ram || '-'}</li>
                                <li><strong>Disco:</strong> {infoCardData.almacenamiento || '-'}</li>
                                <li><strong>Fecha:</strong> {infoCardData.fecha_compra || '-'}</li>
                                <li><strong>Prov:</strong> {infoCardData.id_proveedor?.nombre_proveedor || '-'}</li>
                                
                                {infoCardData.factura ? (
                                    <li className="spec-item-doc">
                                        <strong>Documento:</strong> 
                                        <a 
                                            href={getFileUrl(infoCardData.factura)}
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="doc-link"
                                        >
                                            Ver Factura (PDF)
                                        </a>
                                    </li>
                                ) : (
                                    <li className="spec-item-doc">
                                        <strong>Documento:</strong> <span className="doc-missing">No adjunto</span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};