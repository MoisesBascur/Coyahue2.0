import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Usuarios.css'; // Usaremos el CSS unificado
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Search, PencilSquare } from 'react-bootstrap-icons';

export const Usuarios = () => {
    const [usuarios, setUsuarios] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Paginación
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    
    const navigate = useNavigate(); 

    const fetchUsuarios = async (url) => {
        setLoading(true); 
        try {
            const token = localStorage.getItem('authToken');
            if (!token) { navigate('/login'); return; }

            // URL por defecto con paginación de 10
            const endpoint = url || 'http://127.0.0.1:8000/api/usuarios/?page_size=10';

            const response = await axios.get(endpoint, {
                headers: { 'Authorization': `Token ${token}` }
            });
            
            if (response.data.results) {
                setUsuarios(response.data.results);
                setNextPage(response.data.next);
                setPrevPage(response.data.previous);
                setTotalCount(response.data.count);
            } else {
                setUsuarios(response.data);
            }

        } catch (err) {
            console.error("Error detallado al cargar usuarios:", err);
            setError('Error al cargar la lista de usuarios.');
        } finally {
            setLoading(false); 
        }
    };

    useEffect(() => {
        fetchUsuarios();
    }, []); 

    const handleEditClick = (id) => navigate(`/usuarios/${id}`);
    const handleCreateClick = () => navigate('/usuarios/nuevo');

    const formatRol = (isStaff) => isStaff ? 'Administrador' : 'Usuario Estándar';

    // Helper para fecha bonita
    const formatUltimoAcceso = (fecha) => {
        if (!fecha) return 'Nunca';
        const d = new Date(fecha);
        return d.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); 
    };

    // Filtro local
    const usuariosFiltrados = usuarios.filter(usuario => {
        const term = searchTerm.toLowerCase();
        const texto = `
            ${usuario.nombres} ${usuario.apellidos} 
            ${usuario.username} ${usuario.email} 
            ${usuario.perfil?.rut || ''} ${usuario.perfil?.ocupacion || ''}
        `.toLowerCase();
        return texto.includes(term);
    });

    if (loading) return <div className="users-loading">Cargando usuarios...</div>;
    if (error) return <div className="users-error">{error}</div>;

    return (
        /* CLASE CLAVE: users-isolated-scope */
        <div className="users-page-container users-isolated-scope">
            
            <header className="users-header">
                <h2>Gestión de Usuarios</h2>
                <div className="header-actions">
                    <div className="search-bar-container">
                        <Search className="search-icon" />
                        <input 
                            type="search" 
                            placeholder="Buscar usuario..." 
                            className="users-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={handleCreateClick} className="create-user-btn">
                        <PlusCircle style={{marginRight: 6}}/> Crear Usuario
                    </button>
                </div>
            </header>

            <div className="users-table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Nombres</th>
                            <th>Apellidos</th>
                            <th>Rol</th>
                            <th>Último Acceso</th>
                            <th>Estado</th>
                            <th className="text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuariosFiltrados.map(usuario => (
                            <tr key={usuario.id}>
                                <td style={{fontWeight: '600'}}>{usuario.nombres}</td>
                                <td>{usuario.apellidos}</td>
                                <td>
                                    <span className={`rol-badge ${usuario.rol ? 'rol-admin' : 'rol-user'}`}>
                                        {formatRol(usuario.rol)}
                                    </span>
                                </td>
                                <td style={{fontSize:'0.9rem', color:'var(--usr-text-sec)'}}>
                                    {formatUltimoAcceso(usuario.ultimo_acceso)}
                                </td>
                                <td>
                                    <span className={`status-dot ${usuario.estado ? 'active' : 'inactive'}`}></span>
                                    {usuario.estado ? 'Activo' : 'Suspendido'}
                                </td>
                                <td className="text-center">
                                    <button onClick={() => handleEditClick(usuario.id)} className="btn-action-edit" title="Editar">
                                        <PencilSquare />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {usuariosFiltrados.length === 0 && (
                            <tr>
                                <td colSpan="6" className="empty-state">No se encontraron usuarios.</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* --- PAGINACIÓN --- */}
                <div className="pagination-container">
                    <button 
                        onClick={() => prevPage && fetchUsuarios(prevPage)} 
                        disabled={!prevPage}
                        className="btn-pagination"
                    >
                        &larr; Anterior
                    </button>
                    
                    <span className="pagination-info">
                        Viendo {usuarios.length} de {totalCount} usuarios
                    </span>

                    <button 
                        onClick={() => nextPage && fetchUsuarios(nextPage)} 
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