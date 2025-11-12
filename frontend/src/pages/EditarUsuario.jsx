import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './CrearUsuario.css'; // Reutilizamos el mismo CSS

export const EditarUsuario = () => {
    const { id } = useParams(); // Obtenemos el ID de la URL
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        username: '',      
        email: '',         
        password: '',      // Se dejará vacío si no se quiere cambiar
        nombres: '',       
        apellidos: '',     
        rol: false,        
        estado: true,      
        perfil: {
            rut: '',
            area: '',
            ocupacion: ''
        }
    });

    // 1. Cargar datos del usuario al iniciar
    useEffect(() => {
        const fetchUsuario = async () => {
            const token = localStorage.getItem('authToken');
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/usuarios/${id}/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                
                const data = response.data;
                
                // Rellenamos el formulario con los datos recibidos
                setFormData({
                    username: data.username,
                    email: data.email,
                    password: '', // La contraseña no viene del servidor por seguridad
                    nombres: data.nombres,
                    apellidos: data.apellidos,
                    rol: data.rol,
                    estado: data.estado,
                    perfil: {
                        rut: data.perfil?.rut || '',
                        area: data.perfil?.area || '',
                        ocupacion: data.perfil?.ocupacion || ''
                    }
                });
                setLoading(false);

            } catch (err) {
                console.error("Error cargando usuario:", err);
                setError('No se pudieron cargar los datos del usuario.');
                setLoading(false);
            }
        };
        fetchUsuario();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name === 'rut' || name === 'area' || name === 'ocupacion') {
            setFormData(prevData => ({
                ...prevData,
                perfil: {
                    ...prevData.perfil,
                    [name]: value
                }
            }));
        }
        else if (type === 'checkbox') {
            setFormData(prevData => ({
                ...prevData,
                [name]: checked
            }));
        } 
        else {
            setFormData(prevData => ({
                ...prevData,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); 
        const token = localStorage.getItem('authToken');

        // Preparamos los datos para enviar
        const dataToSend = { ...formData };

        // Si el campo contraseña está vacío, lo quitamos para no sobrescribirla
        if (!dataToSend.password) {
            delete dataToSend.password;
        } else if (dataToSend.password.length < 8) {
            setError('Si cambias la contraseña, debe tener al menos 8 caracteres.');
            return;
        }

        try {
            // Usamos PATCH para actualizar
            await axios.patch(`http://127.0.0.1:8000/api/usuarios/${id}/`, dataToSend, {
                headers: { 'Authorization': `Token ${token}` }
            });
            
            navigate('/usuarios');

        } catch (err) {
            console.error("Error al actualizar:", err.response?.data);
            if (err.response && err.response.data && err.response.data.username) {
                setError(`Error: ${err.response.data.username[0]}`); 
            } else {
                setError('Error al actualizar el usuario. Revisa los campos.');
            }
        }
    };

    if (loading) return <p style={{padding: '20px'}}>Cargando datos del usuario...</p>;

    return (
        <div className="edit-form-container"> 
            <h1>Editar Usuario (ID: {id})</h1>
            
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <form onSubmit={handleSubmit}>
                <div className="perfil-form-grid"> 
                    
                    <div className="form-column">
                        <div className="form-group">
                            <label htmlFor="nombres">Nombres</label>
                            <input type="text" name="nombres" value={formData.nombres} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="username">Correo (Login)</label>
                            <input type="email" name="username" value={formData.username} onChange={handleChange} required />
                        </div>
                         <div className="form-group">
                            <label htmlFor="rut">RUT</label>
                            <input type="text" name="rut" value={formData.perfil.rut} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="ocupacion">Ocupación</label>
                            <input type="text" name="ocupacion" value={formData.perfil.ocupacion} onChange={handleChange} />
                        </div>
                    </div>
                    
                    <div className="form-column">
                        <div className="form-group">
                            <label htmlFor="apellidos">Apellidos</label>
                            <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email (Contacto)</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="area">Área</label>
                            <input type="text" name="area" value={formData.perfil.area} onChange={handleChange} />
                        </div>
                         <div className="form-group">
                            <label htmlFor="password">Nueva Contraseña (Opcional)</label>
                            <input 
                                type="password" 
                                name="password" 
                                placeholder="Dejar en blanco para mantener la actual"
                                value={formData.password} 
                                onChange={handleChange} 
                            />
                        </div>
                    </div>
                </div>

                <div className="form-group-checkboxes">
                    <div className="checkbox-wrapper">
                        <input type="checkbox" name="rol" id="rol" checked={formData.rol} onChange={handleChange} />
                        <label htmlFor="rol">¿Es Administrador?</label>
                    </div>
                    <div className="checkbox-wrapper">
                        <input type="checkbox" name="estado" id="estado" checked={formData.estado} onChange={handleChange} />
                        <label htmlFor="estado">¿Está Activo?</label>
                    </div>
                </div>
                
                <button type="submit" className="save-button">Guardar Cambios</button>
            </form>
        </div>
    );
};