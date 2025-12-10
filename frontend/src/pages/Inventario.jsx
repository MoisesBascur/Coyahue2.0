import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { QrCode, Eye, PencilSquare, PlusCircle, Search } from 'react-bootstrap-icons';
import QRGeneratorModal from '../components/QRGeneratorModal';
import './Inventario.css';

// URL Base
const BASE_URL = '/api/equipos/';

export const Inventario = () => {
    const [equipos, setEquipos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estados de Paginación
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);
    const [totalCount, setTotalCount] = useState(0);

    // Modales
    const [infoCardData, setInfoCardData] = useState(null);
    const [qrEquipment, setQrEquipment] = useState(null);
    
    const navigate = useNavigate();

    // Helper para URLs
    const getFileUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return url; 
    };

    // Helper de Colores
    const getStatusClass = (nombreEstado) => {
        if (!nombreEstado) return '';
        const e = nombreEstado.toLowerCase();
        if (e.includes('activo') || e.includes('disponible')) return 'status-active';
        if (e.includes('mantenci') || e.includes('reparaci')) return 'status-warning';
        if (e.includes('baja') || e.includes('inactivo') || e.includes('malo')) return 'status-danger';
        return '';
    };

    // --- FUNCIÓN DE CARGA ---
    const fetchEquipos = async (url) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) { navigate('/login'); return; }

            // AQUÍ ESTÁ EL CAMBIO: page_size=10
            const endpoint = url || `${BASE_URL}?page_size=10&ordering=-id`;

            const response = await api.get(endpoint, {
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
            console.error("Error cargando inventario:", err);
            setError('No se pudo cargar el inventario.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEquipos();
    }, []);

    // Botones de Paginación (Usan la URL que devuelve el backend)
    const handleNext = () => { if (nextPage) fetchEquipos(nextPage); };
    const handlePrev = () => { if (prevPage) fetchEquipos(prevPage); };

    // Filtro Local
    const equiposFiltrados = equipos.filter(eq => {
        const term = searchTerm.toLowerCase();
        const texto = `
            ${eq.marca} ${eq.modelo} ${eq.nro_serie} 
            ${eq.rut_asociado} 
            ${eq.id_usuario_responsable?.username || ''} 
            ${eq.id_sucursal?.nombre || ''}
        `.toLowerCase();
        return texto.includes(term);
    });

    if (loading) return <div className="loading-container"><p className="loading-msg">Cargando...</p></div>;
    if (error) return <div className="error-msg">{error}</div>;

    return (
        <div className="inventario-page-container inventario-isolated-scope">
            
            <header className="inventario-header">
                <h2>Inventario de Equipos</h2>
                <div className="header-actions">
                    <div className="search-bar-container">
                        <Search className="search-icon" />
                        <input 
                            type="search" 
                            placeholder="Buscar en esta página..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="inventario-search-input"
                        />
                    </div>
                    <button onClick={() => navigate('/inventario/nuevo')} className="create-btn">
                        <PlusCircle style={{marginRight: 8}}/> Nuevo Equipo
                    </button>
                </div>
            </header>

            <div className="inventario-table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>RUT</th>
                            <th>Equipo</th>
                            <th>Sucursal</th>
                            <th>Tipo</th>
                            <th>Estado</th>
                            <th className="text-center">QR</th>
                            <th className="text-center">Ver</th>
                            <th className="text-center">Editar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {equiposFiltrados.map(eq => (
                            <tr key={eq.id}>
                                <td>{eq.id_usuario_responsable?.username || <span className="text-muted">N/A</span>}</td>
                                <td>{eq.rut_asociado || '-'}</td>
                                <td style={{fontWeight:'600'}}>{eq.marca} {eq.modelo}</td>
                                <td>{eq.id_sucursal?.nombre || '-'}</td>
                                <td>{eq.id_tipo_equipo?.nombre_tipo || '-'}</td>
                                
                                <td>
                                    <span className={`status-badge ${getStatusClass(eq.id_estado?.nombre_estado)}`}>
                                        {eq.id_estado?.nombre_estado || '-'}
                                    </span>
                                </td>

                                <td className="text-center">
                                    <button className="btn-icon" onClick={() => setQrEquipment(eq)} title="QR">
                                        <QrCode size={18} />
                                    </button>
                                </td>
                                <td className="text-center">
                                    <button className="btn-icon" onClick={() => setInfoCardData(infoCardData?.id === eq.id ? null : eq)} title="Detalles">
                                        <Eye size={18} />
                                    </button>
                                </td>
                                <td className="text-center">
                                    <button className="btn-icon btn-edit" onClick={() => navigate(`/inventario/${eq.id}`)} title="Editar">
                                        <PencilSquare size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {equiposFiltrados.length === 0 && (
                            <tr><td colSpan="9" className="empty-state">No se encontraron equipos.</td></tr>
                        )}
                    </tbody>
                </table>

                {/* --- PAGINACIÓN --- */}
                <div className="pagination-container">
                    <button onClick={handlePrev} disabled={!prevPage} className="btn-pagination">
                        &larr; Anterior
                    </button>
                    
                    <span className="pagination-info">
                        Viendo {equipos.length} de {totalCount} equipos
                    </span>
                    
                    <button onClick={handleNext} disabled={!nextPage} className="btn-pagination">
                        Siguiente &rarr;
                    </button>
                </div>
            </div>

            {/* --- TARJETA FLOTANTE (SPECS) --- */}
            {infoCardData && (
                <>
                    <div className="popover-overlay" onClick={() => setInfoCardData(null)}></div>
                    <div className="specs-floating-card">
                        <div className="specs-header">
                            <h4>Ficha Técnica</h4>
                            <button className="close-specs" onClick={() => setInfoCardData(null)}>&times;</button>
                        </div>
                        <div className="specs-body">
                            <p className="specs-title"><strong>{infoCardData.marca} {infoCardData.modelo}</strong></p>
                            <p className="specs-serial">S/N: {infoCardData.nro_serie}</p>
                            <hr className="specs-separator"/>
                            <ul className="specs-list">
                                <li><span>Procesador:</span> <span>{infoCardData.procesador || '-'}</span></li>
                                <li><span>RAM:</span> <span>{infoCardData.ram || '-'}</span></li>
                                <li><span>Disco:</span> <span>{infoCardData.almacenamiento || '-'}</span></li>
                                <li><span>Garantía:</span> <span>{infoCardData.warranty_end_date || '-'}</span></li>
                            </ul>
                            <div className="specs-footer">
                                {infoCardData.factura ? (
                                    <a href={getFileUrl(infoCardData.factura)} target="_blank" rel="noreferrer" className="btn-invoice-mini">
                                        Ver Factura PDF
                                    </a>
                                ) : <span className="doc-missing">Sin factura</span>}
                            </div>
                        </div>
                    </div>
                </>
            )}

            <QRGeneratorModal 
                show={!!qrEquipment} 
                onClose={() => setQrEquipment(null)} 
                equipment={qrEquipment} 
            />
        </div>
    );
};