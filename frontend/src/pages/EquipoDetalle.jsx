import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Person, Cpu, GeoAlt, FileEarmarkText } from 'react-bootstrap-icons';
import './EquipoDetalle.css'; 

// --- HELPER PARA OBTENER URL ABSOLUTA (Duplicado del Calendario) ---
const getFileUrl = (url) => {
    if (!url) return null;
    // Si ya es absoluta (ej: S3), la usamos tal cual
    if (url.startsWith('http')) return url;
    
    // Si es relativa (ej: /media/archivo.pdf), la devolvemos limpia.
    // El navegador la buscará automáticamente en el dominio actual.
    return url;
};
// -----------------------------------------------------------------


export const EquipoDetalle = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [equipo, setEquipo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEquipo = async () => {
            const token = localStorage.getItem('authToken');
            try {
                const response = await api.get(`/api/equipos/${id}/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                setEquipo(response.data);
            } catch (err) {
                console.error(err);
                setError('No se pudo cargar la información del equipo.');
            } finally {
                setLoading(false);
            }
        };
        fetchEquipo();
    }, [id]);

    if (loading) return <div className="loading-container">Cargando información...</div>;
    if (error) return <div className="error-msg">{error}</div>;
    if (!equipo) return <div className="error-msg">Equipo no encontrado</div>;

    const val = (valor) => valor || <span className="text-na">N/A</span>;

    // Helper de Estado
    const getStatusClass = (estado) => {
        if (!estado) return '';
        const e = estado.toLowerCase();
        if (e.includes('activo') || e.includes('disponible')) return 'status-active';
        if (e.includes('baja') || e.includes('inactivo')) return 'status-inactive';
        return 'status-warning';
    };

    return (
        <div className="detalle-page-container detalle-scope">
            <div className="detalle-wrapper">
                <header className="detalle-header-nav">
                    {/* Botón de volver añadido para usabilidad cuando se ve dentro del sistema */}
                    <button className="btn-back" onClick={() => navigate('/inventario')}>
                        <ArrowLeft size={18}/> Volver
                    </button>
                </header>

                <div className="detalle-card">
                    {/* ENCABEZADO */}
                    <div className="card-top">
                        <div>
                            <h1 className="equipo-title">{equipo.marca} {equipo.modelo}</h1>
                            <p className="equipo-serial">Serie: <strong>{equipo.nro_serie}</strong></p>
                        </div>
                        <div className="status-container">
                            <span className="type-badge">{equipo.id_tipo_equipo?.nombre_tipo || 'Equipo'}</span>
                            <span className={`status-badge ${getStatusClass(equipo.id_estado?.nombre_estado)}`}>
                                {equipo.id_estado?.nombre_estado || 'Sin Estado'}
                            </span>
                        </div>
                    </div>

                    <hr className="divider" />

                    <div className="detalle-grid">
                        {/* COLUMNA 1 */}
                        <div className="detalle-section">
                            <h3><Cpu className="section-icon"/> Especificaciones</h3>
                            <div className="info-row">
                                <span className="label">Procesador</span>
                                <span className="value">{val(equipo.procesador)}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Memoria RAM</span>
                                <span className="value">{val(equipo.ram)}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Almacenamiento</span>
                                <span className="value">{val(equipo.almacenamiento)}</span>
                            </div>
                        </div>

                        {/* COLUMNA 2 */}
                        <div className="detalle-section">
                            <h3><GeoAlt className="section-icon"/> Ubicación</h3>
                            <div className="info-row highlight">
                                <span className="label">Sucursal</span>
                                <span className="value strong">{equipo.id_sucursal?.nombre || 'Sin Asignar'}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Proveedor</span>
                                <span className="value">{equipo.id_proveedor?.nombre_proveedor || 'N/A'}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Fecha Compra</span>
                                <span className="value">{val(equipo.fecha_compra)}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Fin Garantía</span>
                                <span className="value">{val(equipo.warranty_end_date)}</span>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN USUARIO */}
                    <div className="asignacion-section">
                        <h3><Person className="section-icon"/> Responsable Asignado</h3>
                        <div className="user-card-mini">
                            <div className="user-details">
                                <span className="user-email">{equipo.id_usuario_responsable?.email || 'Sin Asignar'}</span>
                                <span className="user-rut">RUT: {val(equipo.rut_asociado)}</span>
                            </div>
                            {equipo.id_usuario_responsable ? (
                                <span className="user-status assigned">Asignado</span>
                            ) : (
                                <span className="user-status unassigned">Disponible</span>
                            )}
                        </div>
                    </div>

                    {/* FACTURA: USAMOS EL HELPER PARA LA URL ABSOLUTA */}
                    {equipo.factura && (
                        <div className="card-footer">
                            <a href={getFileUrl(equipo.factura)} target="_blank" rel="noopener noreferrer" className="btn-invoice">
                                <FileEarmarkText size={18}/> Ver Factura Original (PDF)
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};