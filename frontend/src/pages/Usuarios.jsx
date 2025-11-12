import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Usuarios.css'; 
import { useNavigate } from 'react-router-dom';

export const Usuarios = () => {
    const [usuarios, setUsuarios] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate(); 

    useEffect(() => {
        const fetchUsuarios = async () => {
            setLoading(true); 
            try {
                const token = localStorage.getItem('authToken');
                if (!token) throw new Error('No estás autenticado');

                const response = await axios.get('http://127.0.0.1:8000/api/usuarios/', {
                    headers: { 'Authorization': `Token ${token}` }
                });
                
                setUsuarios(response.data); 

            } catch (err) {
                console.error("Error detallado al cargar usuarios:", err);
                setError('Error al cargar la lista de usuarios.');
            } finally {
                setLoading(false); 
            }
        };

        fetchUsuarios();
    }, []); 

    // --- ACTUALIZADO: Navega a la página de edición ---
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

    if (loading) return <p>Cargando usuarios...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <>
            <header className="main-header">
                <h1>Gestión de Usuarios</h1>
                <div>
                    <input type="search" placeholder="Buscar usuario, correo..." className="main-searchbar" />
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
                        {usuarios.map(usuario => (
                            <tr key={usuario.id}>
                                <td>{usuario.nombres}</td>
                                <td>{usuario.apellidos}</td>
                                <td>{formatRol(usuario.rol)}</td>
                                <td>{formatUltimoAcceso(usuario.ultimo_acceso)}</td>
                                <td>{formatEstado(usuario.estado)}</td>
                                <td>
                                    <button onClick={() => handleEditClick(usuario.id)}>
                                        ...
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};