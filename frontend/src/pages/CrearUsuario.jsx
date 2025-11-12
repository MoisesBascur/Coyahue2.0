import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CrearUsuario.css'; 

export const CrearUsuario = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    
    const [formData, setFormData] = useState({
        username: '',      
        email: '',         
        password: '',
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

        if (formData.password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        try {
            await axios.post('http://127.0.0.1:8000/api/usuarios/', formData, {
                headers: { 'Authorization': `Token ${token}` }
            });
            
            navigate('/usuarios');

        } catch (err) {
            // --- MANEJO DE ERRORES MEJORADO ---
            console.error("Error al crear el usuario:", err.response?.data);
            
            if (err.response && err.response.data) {
                const data = err.response.data;
                // Intenta encontrar un error específico de la API
                if (data.username) {
                    setError(`Error de Correo (Login): ${data.username[0]}`);
                } else if (data.email) {
                    setError(`Error de Email (Contacto): ${data.email[0]}`);
                } else if (data.non_field_errors) {
                    setError(data.non_field_errors[0]);
                } else {
                    // Si no, muestra el genérico
                    setError('Error al crear el usuario. Revisa los campos.');
                }
            } else {
                // Si no hay 'err.response' es un error de red
                setError('Error de conexión. No se pudo crear el usuario.');
            }
        }
    };

    return (
        <div className="edit-form-container"> 
            <h1>Creación de Usuario</h1>
            
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <form onSubmit={handleSubmit}>
                <div className="perfil-form-grid"> 
                    
                    {/* Columna Izquierda */}
                    <div className="form-column">
                        <div className="form-group">
                            <label htmlFor="nombres">Nombres</label>
                            <input type="text" name="nombres" id="nombres" value={formData.nombres} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="username">Correo (para Login)</label>
                            <input type="email" name="username" id="username" value={formData.username} onChange={handleChange} required />
                        </div>
                         <div className="form-group">
                            <label htmlFor="rut">RUT</label>
                            <input type="text" name="rut" id="rut" value={formData.perfil.rut} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="ocupacion">Ocupación</label>
                            <input type="text" name="ocupacion" id="ocupacion" value={formData.perfil.ocupacion} onChange={handleChange} />
                        </div>
                    </div>
                    
                    {/* Columna Derecha */}
                    <div className="form-column">
                        <div className="form-group">
                            <label htmlFor="apellidos">Apellidos</label>
                            <input type="text" name="apellidos" id="apellidos" value={formData.apellidos} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email (de contacto)</label>
                            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="area">Área</label>
                            <input type="text" name="area" id="area" value={formData.perfil.area} onChange={handleChange} />
                        </div>
                         <div className="form-group">
                            <label htmlFor="password">Contraseña (min. 8 caracteres)</label>
                            <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required />
                        </div>
                    </div>
                </div>

                {/* Checkboxes (abajo) */}
                <div className="form-group-checkboxes">
                    <div className="checkbox-wrapper">
                        <input type="checkbox" name="rol" id="rol" checked={formData.rol} onChange={handleChange} />
                        <label htmlFor="rol">¿Es Administrador? (Rol)</label>
                    </div>
                    <div className="checkbox-wrapper">
                        <input type="checkbox" name="estado" id="estado" checked={formData.estado} onChange={handleChange} />
                        <label htmlFor="estado">¿Está Activo? (Estado)</label>
                    </div>
                </div>
                
                <button type="submit" className="save-button">Crear Usuario</button>
            </form>
        </div>
    );
};