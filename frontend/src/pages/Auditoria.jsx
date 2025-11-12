import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Auditoria.css'; // Importamos el nuevo CSS dedicado

export const Auditoria = () => {
    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Estados de Paginación
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);
    const [totalCount, setTotalCount] = useState(0);

    const fetchAuditoria = async (url = 'http://127.0.0.1:8000/api/auditoria/') => {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        try {
            const response = await axios.get(url, {
                headers: { 'Authorization': `Token ${token}` }
            });
            
            if (response.data.results) {
                setRegistros(response.data.results);
                setNextPage(response.data.next);
                setPrevPage(response.data.previous);
                setTotalCount(response.data.count);
            } else {
                setRegistros(response.data);
            }
            
        } catch (err) {
            console.error(err);
            setError('No tienes permiso para ver los registros o hubo un error.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditoria();
    }, []);

    const formatDate = (isoString) => {
        if (!isoString) return '-';
        return new Date(isoString).toLocaleString('es-CL');
    };

    if (loading) return <p className="loading-msg">Cargando registros...</p>;
    if (error) return <p className="error-msg">{error}</p>;

    return (
        <>
            <header className="main-header">
                <h1>Registro de Auditoría</h1>
            </header>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Fecha y Hora</th>
                            <th>Usuario</th>
                            <th>Acción</th>
                            <th>Modelo</th>
                            <th>Detalle</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registros.map(log => (
                            <tr key={log.id}>
                                {/* Usamos clases específicas para cada columna */}
                                <td className="audit-date">{formatDate(log.fecha)}</td>
                                <td className="audit-user">{log.usuario_nombre}</td>
                                <td>
                                    <span className={`estado-tag ${
                                        log.accion === 'Crear' ? 'activo' : 
                                        log.accion === 'Eliminar' ? 'suspendido' : 'modificado'
                                    }`}>
                                        {log.accion}
                                    </span>
                                </td>
                                <td>{log.modelo_afectado}</td>
                                <td className="audit-details">{log.detalle}</td>
                            </tr>
                        ))}
                        {registros.length === 0 && (
                            <tr>
                                <td colSpan="5" className="empty-cell">No hay registros aún.</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* --- CONTROLES DE PAGINACIÓN (Clases CSS) --- */}
                <div className="pagination-container">
                    <button 
                        onClick={() => prevPage && fetchAuditoria(prevPage)} 
                        disabled={!prevPage}
                        className="btn-pagination"
                    >
                        Anterior
                    </button>
                    
                    <span className="pagination-info">
                        Mostrando {registros.length} registros
                    </span>

                    <button 
                        onClick={() => nextPage && fetchAuditoria(nextPage)} 
                        disabled={!nextPage}
                        className="btn-pagination"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </>
    );
};