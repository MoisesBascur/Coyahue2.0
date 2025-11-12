import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Usuarios.css'; 
import { useNavigate } from 'react-router-dom';

export const Usuarios = () => {
    const [usuarios, setUsuarios] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // 1. Estado para el buscador
    const [searchTerm, setSearchTerm] = useState('');

    // Estados para Paginación
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    
    const navigate = useNavigate(); 

    const fetchUsuarios = async (url = 'http://127.0.0.1:8000/api/usuarios/') => {
        setLoading(true); 
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('No estás autenticado');

            const response = await axios.get(url, {
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

    const handleEditClick = (id) => {
        navigate(`/usuarios/${id}`);
    };

    const handleCreateClick = () => {
        navigate('/usuarios/nuevo');
    };

    const formatRol = (isStaff) => {
        return isStaff ? 'Admin' : 'Usuario';
    };

    const formatEstado = (isActive) => {
        return isActive ? (
            <span className="estado-tag activo">Activo</span>
        ) : (
            <span className="estado-tag suspendido">Suspendido</span>
        );
    };

    const formatUltimoAcceso = (fecha) => {
        if (!fecha) return 'Nunca';
        const d = new Date(fecha);
        return d.toLocaleString('es-CL'); 
    };

    // 2. Lógica de filtrado
    // Filtramos por Nombre, Apellido, Usuario, Correo o RUT
    const usuariosFiltrados = usuarios.filter(usuario => {
        const term = searchTerm.toLowerCase();
        
        const nombre = (usuario.nombres || '').toLowerCase();
        const apellido = (usuario.apellidos || '').toLowerCase();
        const username = (usuario.username || '').toLowerCase();
        const email = (usuario.email || '').toLowerCase();
        const rut = (usuario.perfil?.rut || '').toLowerCase();
        const ocupacion = (usuario.perfil?.ocupacion || '').toLowerCase();

        return (
            nombre.includes(term) ||
            apellido.includes(term) ||
            username.includes(term) ||
            email.includes(term) ||
            rut.includes(term) ||
            ocupacion.includes(term)
        );
    });

    if (loading) return <p className="loading-msg">Cargando usuarios...</p>;
    if (error) return <p className="error-msg">{error}</p>;

    return (
        <>
            <header className="main-header">
                <h1>Gestión de Usuarios</h1>
                <div>
                    {/* 3. Input conectado al estado */}
                    <input 
                        type="search" 
                        placeholder="Buscar por nombre, rut, correo..." 
                        className="main-searchbar"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button onClick={handleCreateClick} className="create-button">
                        Crear Usuario
                    </button>
                </div>
            </header>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nombres</th>
                            <th>Apellidos</th>
                            <th>Rol</th>
                            <th>Último Acceso</th>
                            <th>Estado</th>
                            <th>Editar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* 4. Usamos la lista filtrada para renderizar */}
                        {usuariosFiltrados.map(usuario => (
                            <tr key={usuario.id}>
                                <td>{usuario.nombres}</td>
                                <td>{usuario.apellidos}</td>
                                <td>{formatRol(usuario.rol)}</td>
                                <td>{formatUltimoAcceso(usuario.ultimo_acceso)}</td>
                                <td>{formatEstado(usuario.estado)}</td>
                                <td>
                                    <button onClick={() => handleEditClick(usuario.id)} className="action-btn">
                                        ...
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {usuariosFiltrados.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{textAlign: 'center', padding: '20px', color: '#777'}}>
                                    No se encontraron usuarios.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="pagination-container">
                    <button 
                        onClick={() => prevPage && fetchUsuarios(prevPage)} 
                        disabled={!prevPage}
                        className="btn-pagination"
                    >
                        Anterior
                    </button>
                    
                    <span className="pagination-info">
                        Mostrando {usuarios.length} usuarios
                    </span>

                    <button 
                        onClick={() => nextPage && fetchUsuarios(nextPage)} 
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