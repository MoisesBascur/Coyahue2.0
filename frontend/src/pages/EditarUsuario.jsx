import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './InsumosCrear.css'; // Usamos el CSS unificado para mantener el diseño

export const EditarUsuario = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    
    // Estado del formulario
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', nombres: '', apellidos: '',
        rol: false, estado: true,
        rut: '', area: '', ocupacion: '', foto: null
    });

    // Formateador de RUT
    const formatRut = (rut) => {
        let value = rut.replace(/[^0-9kK]/g, '');
        if (value.length <= 1) return value;
        const cuerpo = value.slice(0, -1);
        const dv = value.slice(-1).toUpperCase();
        const cuerpoFormateado = cuerpo.split('').reverse().reduce((acc, char, i) => {
            return char + (i > 0 && i % 3 === 0 ? '.' : '') + acc;
        }, '');
        return `${cuerpoFormateado}-${dv}`;
    };

    // Cargar datos del usuario
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
                    password: '', // Contraseña vacía por seguridad
                    nombres: data.nombres,
                    apellidos: data.apellidos,
                    rol: data.rol,
                    estado: data.estado,
                    rut: data.perfil?.rut || '',
                    area: data.perfil?.area || '',
                    ocupacion: data.perfil?.ocupacion || '',
                    foto: null 
                });
            } catch (err) {
                console.error(err);
                setError('No se pudieron cargar los datos del usuario.');
            } finally {
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
            setFormData(prev => ({ ...prev, [name]: formatRut(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); 
        setLoading(true);
        const token = localStorage.getItem('authToken');

        const dataToSend = new FormData();
        
        // Agregar campos solo si tienen valor (excepto booleanos que siempre van)
        Object.keys(formData).forEach(key => {
            if (key === 'password' && formData[key] === '') return; // No enviar pass vacía
            if (key === 'foto' && formData[key] === null) return;
            
            if (formData[key] !== null) {
                dataToSend.append(key, formData[key]);
            }
        });

        if (formData.password && formData.password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            setLoading(false);
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
            else setError('Error al actualizar usuario. Verifique los datos.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-container">Cargando datos del usuario...</div>;

    return (
        /* USAMOS LAS CLASES DE INSUMOSCREAR PARA QUE SE VEA IGUAL */
        <div className="insumo-crear-container"> 
            <div className="insumo-card">
                <h2>Editar Usuario</h2>
                <p className="form-subtitle">Modificar datos personales y permisos.</p>
                
                {error && <div className="alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-grid"> 
                        <div className="form-group">
                            <label>Nombres</label>
                            <input type="text" name="nombres" value={formData.nombres} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Apellidos</label>
                            <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} required />
                        </div>
                        
                        <div className="form-group">
                            <label>Correo (Login)</label>
                            <input type="email" name="username" value={formData.username} onChange={handleChange} required />
                        </div>

                        <div className="form-group">
                            <label>Email de Contacto</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} />
                        </div>
                        
                        <div className="form-group">
                            <label>RUT</label>
                            <input type="text" name="rut" value={formData.rut} onChange={handleChange} placeholder="12.345.678-9" maxLength={12} />
                        </div>
                        
                        <div className="form-group">
                            <label>Área / Departamento</label>
                            <input type="text" name="area" value={formData.area} onChange={handleChange} />
                        </div>

                        <div className="form-group">
                            <label>Cargo / Ocupación</label>
                            <input type="text" name="ocupacion" value={formData.ocupacion} onChange={handleChange} />
                        </div>

                        <div className="form-group password-group">
                            <label>Nueva Contraseña (Opcional)</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Dejar en blanco para mantener actual" />
                        </div>
                    </div>
                    
                    <div className="form-group full-width" style={{marginTop: '15px'}}>
                        <label>Actualizar Foto</label>
                        <input type="file" name="foto" accept="image/*" onChange={handleChange} className="file-input" style={{padding:'8px'}}/>
                    </div>

                    {/* SECCIÓN DE PERMISOS (Checkboxes Bonitos) */}
                    <div className="account-type-selector" style={{marginTop: '25px'}}>
                        <label className={`type-option ${formData.rol ? 'selected' : ''}`}>
                            <input type="checkbox" name="rol" checked={formData.rol} onChange={handleChange} />
                            <span className="icon">🔑</span>
                            <div className="text">
                                <strong>Administrador</strong>
                                <small>Acceso total al sistema</small>
                            </div>
                        </label>

                        <label className={`type-option ${formData.estado ? 'selected' : ''}`}>
                            <input type="checkbox" name="estado" checked={formData.estado} onChange={handleChange} />
                            <span className="icon">✅</span>
                            <div className="text">
                                <strong>Usuario Activo</strong>
                                <small>Permitir acceso</small>
                            </div>
                        </label>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => navigate('/usuarios')}>Cancelar</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};