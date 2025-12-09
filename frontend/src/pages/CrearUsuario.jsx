import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CrearUsuario.css'; // ¡REUTILIZAMOS EL CSS PROFESIONAL!

export const CrearUsuario = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [tipoCuenta, setTipoCuenta] = useState('empleado');
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        username: '', email: '', password: '', nombres: '', apellidos: '',
        estado: true, rut: '', area: '', ocupacion: '', foto: null 
    });

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

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === 'checkbox') setFormData(prev => ({ ...prev, [name]: checked }));
        else if (type === 'file') setFormData(prev => ({ ...prev, [name]: files[0] }));
        else if (name === 'rut') setFormData(prev => ({ ...prev, [name]: formatRut(value) }));
        else setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); 
        setLoading(true);

        const token = localStorage.getItem('authToken');
        const requierePassword = tipoCuenta === 'ti' || tipoCuenta === 'admin';

        if (requierePassword && (!formData.password || formData.password.length < 8)) {
            setError('Para cuentas de TI o Admin, la contraseña debe tener mín. 8 caracteres.');
            setLoading(false);
            return;
        }

        const dataToSend = new FormData();
        dataToSend.append('nombres', formData.nombres);
        dataToSend.append('apellidos', formData.apellidos);
        dataToSend.append('username', formData.username.trim()); 
        dataToSend.append('email', formData.email);
        dataToSend.append('rut', formData.rut);
        dataToSend.append('area', formData.area);
        dataToSend.append('ocupacion', formData.ocupacion);
        if(formData.foto) dataToSend.append('foto', formData.foto);
        dataToSend.append('estado', formData.estado);

        if (tipoCuenta === 'admin') {
            dataToSend.append('rol', 'true');
            dataToSend.append('password', formData.password);
        } else if (tipoCuenta === 'ti') {
            dataToSend.append('rol', 'false');
            dataToSend.append('password', formData.password);
        } else {
            dataToSend.append('rol', 'false');
        }

        try {
            await axios.post('http://127.0.0.1:8000/api/usuarios/', dataToSend, {
                headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            navigate('/usuarios');
        } catch (err) {
            console.error("Error servidor:", err.response);
            if (err.response && err.response.data) {
                const data = err.response.data;
                if (data.username) setError(`Usuario: ${data.username[0]}`);
                else if (data.email) setError(`Email: ${data.email[0]}`);
                else if (data.rut) setError(`RUT: ${data.rut[0]}`);
                else if (data.password) setError(`Contraseña: ${data.password[0]}`);
                else setError('Error de validación. Revisa los datos.');
            } else {
                setError('Error de conexión con el servidor.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="insumo-crear-container"> {/* Usamos el contenedor unificado */}
            <div className="insumo-card">
                <h2>Crear Nuevo Usuario</h2>
                <p className="form-subtitle">Registra empleados o usuarios del sistema.</p>
                
                {error && <div className="alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    
                    {/* SELECCIÓN DE TIPO DE CUENTA (Estilo Tarjetas) */}
                    <div className="account-type-selector">
                        <label className={`type-option ${tipoCuenta === 'empleado' ? 'selected' : ''}`}>
                            <input type="radio" name="tipoCuenta" value="empleado" checked={tipoCuenta === 'empleado'} onChange={(e) => setTipoCuenta(e.target.value)} />
                            <span className="icon">🔒</span>
                            <div className="text">
                                <strong>Empleado</strong>
                                <small>Sin acceso al sistema</small>
                            </div>
                        </label>
                        <label className={`type-option ${tipoCuenta === 'ti' ? 'selected' : ''}`}>
                            <input type="radio" name="tipoCuenta" value="ti" checked={tipoCuenta === 'ti'} onChange={(e) => setTipoCuenta(e.target.value)} />
                            <span className="icon">🛡️</span>
                            <div className="text">
                                <strong>Soporte TI</strong>
                                <small>Gestión de Inventario</small>
                            </div>
                        </label>
                        <label className={`type-option ${tipoCuenta === 'admin' ? 'selected' : ''}`}>
                            <input type="radio" name="tipoCuenta" value="admin" checked={tipoCuenta === 'admin'} onChange={(e) => setTipoCuenta(e.target.value)} />
                            <span className="icon">🔑</span>
                            <div className="text">
                                <strong>Admin</strong>
                                <small>Acceso Total</small>
                            </div>
                        </label>
                    </div>

                    <div className="form-grid"> 
                        <div className="form-group">
                            <label>Nombres *</label>
                            <input type="text" name="nombres" value={formData.nombres} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Apellidos *</label>
                            <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} required />
                        </div>
                        
                        <div className="form-group">
                            <label>Correo (Login) *</label>
                            <input type="email" name="username" value={formData.username} onChange={handleChange} required placeholder="ej: jdoe@coyahue.cl" />
                        </div>

                        <div className="form-group">
                            <label>Email de Contacto</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} />
                        </div>
                        
                        <div className="form-group">
                            <label>RUT</label>
                            <input type="text" name="rut" value={formData.rut} onChange={handleChange} placeholder="12.345.678-9" maxLength={12}/>
                        </div>
                        
                        <div className="form-group">
                            <label>Área / Departamento</label>
                            <input type="text" name="area" value={formData.area} onChange={handleChange} />
                        </div>

                        <div className="form-group">
                            <label>Cargo / Ocupación</label>
                            <input type="text" name="ocupacion" value={formData.ocupacion} onChange={handleChange} />
                        </div>

                        {/* PASSWORD SOLO SI NO ES EMPLEADO */}
                        {tipoCuenta !== 'empleado' && (
                            <div className="form-group password-group">
                                <label>Contraseña de Acceso *</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                            </div>
                        )}
                    </div>
                    
                    <div className="form-group full-width">
                        <label>Foto de Perfil</label>
                        <input type="file" name="foto" accept="image/*" onChange={handleChange} className="file-input"/>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => navigate('/usuarios')}>Cancelar</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? 'Guardando...' : (tipoCuenta === 'empleado' ? 'Registrar Empleado' : 'Crear Usuario')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};