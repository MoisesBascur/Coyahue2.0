import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './CrearUsuario.css'; 

export const EditarUsuario = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', nombres: '', apellidos: '',
        rol: false, estado: true,
        rut: '', area: '', ocupacion: '', foto: null
    });

    // --- FUNCIÓN FORMATEADORA DE RUT (AÑADIDA) ---
    const formatRut = (rut) => {
        // Eliminar todo lo que no sea número o K
        let value = rut.replace(/[^0-9kK]/g, '');
        if (value.length <= 1) return value;

        const cuerpo = value.slice(0, -1);
        const dv = value.slice(-1).toUpperCase();

        const cuerpoFormateado = cuerpo.split('').reverse().reduce((acc, char, i) => {
            return char + (i > 0 && i % 3 === 0 ? '.' : '') + acc;
        }, '');

        return `${cuerpoFormateado}-${dv}`;
    };

    useEffect(() => {
        const fetchUsuario = async () => {
            const token = localStorage.getItem('authToken');
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/usuarios/${id}/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                const data = response.data;
                setFormData({
                    username: data.username,
                    email: data.email,
                    password: '',
                    nombres: data.nombres,
                    apellidos: data.apellidos,
                    rol: data.rol,
                    estado: data.estado,
                    rut: data.perfil?.rut || '',
                    area: data.perfil?.area || '',
                    ocupacion: data.perfil?.ocupacion || '',
                    foto: null 
                });
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('No se pudieron cargar los datos.');
                setLoading(false);
            }
        };
        fetchUsuario();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'file') {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else if (name === 'rut') {
            // --- APLICAR FORMATO AL RUT AQUÍ TAMBIÉN ---
            setFormData(prev => ({ ...prev, [name]: formatRut(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); 
        const token = localStorage.getItem('authToken');

        const dataToSend = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'password' && formData[key] === '') return;
            if (key === 'foto' && formData[key] === null) return;
            
            if (formData[key] !== null) {
                dataToSend.append(key, formData[key]);
            }
        });

        if (formData.password && formData.password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        try {
            await axios.patch(`http://127.0.0.1:8000/api/usuarios/${id}/`, dataToSend, {
                headers: { 
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            navigate('/usuarios');
        } catch (err) {
            console.error("Error:", err.response?.data);
            const data = err.response?.data;
            if (data?.rut) setError(`Error en RUT: ${data.rut[0]}`);
            else setError('Error al actualizar usuario.');
        }
    };

    if (loading) return <p className="loading-msg">Cargando...</p>;

    return (
        <div className="edit-form-container"> 
            <h1>Editar Usuario</h1>
            {error && <p className="error-msg">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="perfil-form-grid"> 
                    <div className="form-column">
                        <div className="form-group"><label>Nombres</label><input type="text" name="nombres" value={formData.nombres} onChange={handleChange} required /></div>
                        <div className="form-group"><label>Correo (Login)</label><input type="email" name="username" value={formData.username} onChange={handleChange} required /></div>
                        
                        {/* INPUT RUT CON FORMATO */}
                        <div className="form-group"><label>RUT</label><input type="text" name="rut" value={formData.rut} onChange={handleChange} placeholder="12.345.678-9" maxLength={12} /></div>
                        
                        <div className="form-group"><label>Ocupación</label><input type="text" name="ocupacion" value={formData.ocupacion} onChange={handleChange} /></div>
                        <div className="form-group"><label>Cambiar Foto</label><input type="file" name="foto" accept="image/*" onChange={handleChange} style={{padding:'6px'}}/></div>
                    </div>
                    <div className="form-column">
                        <div className="form-group"><label>Apellidos</label><input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} required /></div>
                        <div className="form-group"><label>Email (Contacto)</label><input type="email" name="email" value={formData.email} onChange={handleChange} /></div>
                        <div className="form-group"><label>Área</label><input type="text" name="area" value={formData.area} onChange={handleChange} /></div>
                        <div className="form-group"><label>Nueva Contraseña (Opcional)</label><input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Dejar en blanco para mantener" /></div>
                    </div>
                </div>
                <div className="form-group-checkboxes">
                    <div className="checkbox-wrapper"><input type="checkbox" name="rol" checked={formData.rol} onChange={handleChange} /><label>¿Es Administrador?</label></div>
                    <div className="checkbox-wrapper"><input type="checkbox" name="estado" checked={formData.estado} onChange={handleChange} /><label>¿Está Activo?</label></div>
                </div>
                <button type="submit" className="save-button">Guardar Cambios</button>
            </form>
        </div>
    );
};