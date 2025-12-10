import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { ClockHistory, Person, Activity, Database, FileText } from 'react-bootstrap-icons';
import './Auditoria.css'; // Importamos el nuevo diseño unificado

export const Auditoria = () => {
    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Estados de Paginación
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    
    const navigate = useNavigate();

    const fetchAuditoria = async (url) => {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        if (!token) { navigate('/login'); return; }

        try {
            // URL base con paginación de 10 si es la primera carga
            const endpoint = url || '/api/auditoria/?page_size=10';

            const response = await api.get(endpoint, {
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
        // Formato más limpio
        return new Date(isoString).toLocaleString('es-CL', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    // Helper para colores de acción
    const getActionClass = (accion) => {
        if (!accion) return '';
        const act = accion.toLowerCase();
        if (act.includes('crear') || act.includes('alta')) return 'status-active'; // Verde
        if (act.includes('eliminar') || act.includes('baja')) return 'status-inactive'; // Rojo
        if (act.includes('modificar') || act.includes('editar')) return 'status-warning'; // Naranja/Azul
        return '';
    };

    if (loading) return <div className="auditoria-loading">Cargando registros...</div>;
    if (error) return <div className="auditoria-error">{error}</div>;

    return (
        /* CLASE CLAVE: auditoria-isolated-scope */
        <div className="auditoria-page-container auditoria-isolated-scope">
            
            <header className="auditoria-header">
                <h2><ClockHistory style={{marginRight: 10}}/> Registro de Auditoría</h2>
            </header>

            <div className="auditoria-table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th><ClockHistory className="th-icon"/> Fecha y Hora</th>
                            <th><Person className="th-icon"/> Usuario</th>
                            <th><Activity className="th-icon"/> Acción</th>
                            <th><Database className="th-icon"/> Modelo</th>
                            <th><FileText className="th-icon"/> Detalle</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registros.map(log => (
                            <tr key={log.id}>
                                <td className="font-mono text-sm">{formatDate(log.fecha)}</td>
                                <td style={{fontWeight: '600'}}>{log.usuario_nombre}</td>
                                <td>
                                    <span className={`status-badge ${getActionClass(log.accion)}`}>
                                        {log.accion}
                                    </span>
                                </td>
                                <td className="text-muted">{log.modelo_afectado}</td>
                                <td className="audit-details">{log.detalle}</td>
                            </tr>
                        ))}
                        {registros.length === 0 && (
                            <tr>
                                <td colSpan="5" className="empty-state">No hay registros de auditoría.</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* --- CONTROLES DE PAGINACIÓN --- */}
                <div className="pagination-container">
                    <button 
                        onClick={() => prevPage && fetchAuditoria(prevPage)} 
                        disabled={!prevPage}
                        className="btn-pagination"
                    >
                        &larr; Anterior
                    </button>
                    
                    <span className="pagination-info">
                        Viendo {registros.length} de {totalCount} registros
                    </span>

                    <button 
                        onClick={() => nextPage && fetchAuditoria(nextPage)} 
                        disabled={!nextPage}
                        className="btn-pagination"
                    >
                        Siguiente &rarr;
                    </button>
                </div>
            </div>
        </div>
    );
};