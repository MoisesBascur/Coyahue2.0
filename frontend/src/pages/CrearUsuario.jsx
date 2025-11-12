import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CrearUsuario.css'; 

export const CrearUsuario = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [tipoCuenta, setTipoCuenta] = useState('empleado');

    const [formData, setFormData] = useState({
        username: '', email: '', password: '', nombres: '', apellidos: '',
        estado: true, rut: '', area: '', ocupacion: '', foto: null 
    });

    // --- FUNCIÓN FORMATEADORA DE RUT ---
    const formatRut = (rut) => {
        // 1. Eliminar todo lo que no sea número o K
        let value = rut.replace(/[^0-9kK]/g, '');
        
        // 2. Si es muy corto, devolver tal cual
        if (value.length <= 1) return value;

        // 3. Separar cuerpo y dígito verificador
        const cuerpo = value.slice(0, -1);
        const dv = value.slice(-1).toUpperCase();

        // 4. Formatear el cuerpo con puntos (Miles)
        const cuerpoFormateado = cuerpo.split('').reverse().reduce((acc, char, i) => {
            return char + (i > 0 && i % 3 === 0 ? '.' : '') + acc;
        }, '');

        return `${cuerpoFormateado}-${dv}`;
    };

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'file') {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else if (name === 'rut') {
            // --- APLICAR FORMATO AL RUT ---
            setFormData(prev => ({ ...prev, [name]: formatRut(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); 
        const token = localStorage.getItem('authToken');

        const requierePassword = tipoCuenta === 'ti' || tipoCuenta === 'admin';
        if (requierePassword && (!formData.password || formData.password.length < 8)) {
            setError('Para cuentas de TI o Admin, la contraseña debe tener mín. 8 caracteres.');
            return;
        }

        const dataToSend = new FormData();
        
        dataToSend.append('nombres', formData.nombres);
        dataToSend.append('apellidos', formData.apellidos);
        dataToSend.append('username', formData.username);
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
            console.error("Error:", err.response?.data);
            // Manejo de errores más específico
            const data = err.response?.data;
            if (data?.rut) setError(`Error en RUT: ${data.rut[0]}`);
            else if (data?.username) setError(`Error: El correo de Login ya existe.`);
            else setError('Error al crear el usuario. Verifica los campos.');
        }
    };

    return (
        <div className="edit-form-container"> 
            <h1>Crear Nuevo Usuario</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                
                <div className="form-group" style={{marginBottom: '20px', padding: '15px', background: '#f0f4ff', borderRadius: '8px', border: '1px solid #d0d7de'}}>
                    <label style={{color: '#333', fontSize: '16px'}}>Tipo de Cuenta:</label>
                    <div style={{display: 'flex', gap: '20px', marginTop: '10px'}}>
                        <label style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'}}>
                            <input type="radio" name="tipoCuenta" value="empleado" checked={tipoCuenta === 'empleado'} onChange={(e) => setTipoCuenta(e.target.value)} />
                            <span>🔒 <strong>Empleado</strong> (Sin acceso al sistema)</span>
                        </label>
                        <label style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'}}>
                            <input type="radio" name="tipoCuenta" value="ti" checked={tipoCuenta === 'ti'} onChange={(e) => setTipoCuenta(e.target.value)} />
                            <span>🛡️ <strong>Soporte TI</strong> (Gestión Inventario)</span>
                        </label>
                        <label style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'}}>
                            <input type="radio" name="tipoCuenta" value="admin" checked={tipoCuenta === 'admin'} onChange={(e) => setTipoCuenta(e.target.value)} />
                            <span>🔑 <strong>Administrador</strong> (Acceso Total)</span>
                        </label>
                    </div>
                </div>

                <div className="perfil-form-grid"> 
                    <div className="form-column">
                        <div className="form-group"><label>Nombres *</label><input type="text" name="nombres" value={formData.nombres} onChange={handleChange} required /></div>
                        <div className="form-group"><label>Correo (Login/ID) *</label><input type="email" name="username" value={formData.username} onChange={handleChange} required /></div>
                        
                        {/* INPUT DE RUT AUTOMATIZADO */}
                        <div className="form-group"><label>RUT</label><input type="text" name="rut" value={formData.rut} onChange={handleChange} placeholder="12.345.678-9" maxLength={12}/></div>
                        
                        <div className="form-group"><label>Ocupación</label><input type="text" name="ocupacion" value={formData.ocupacion} onChange={handleChange} /></div>
                    </div>
                    <div className="form-column">
                        <div className="form-group"><label>Apellidos *</label><input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} required /></div>
                        <div className="form-group"><label>Email (Contacto)</label><input type="email" name="email" value={formData.email} onChange={handleChange} /></div>
                        <div className="form-group"><label>Área</label><input type="text" name="area" value={formData.area} onChange={handleChange} /></div>
                        
                        {tipoCuenta !== 'empleado' && (
                            <div className="form-group" style={{background: '#fff3e0', padding: '10px', borderRadius: '4px', border: '1px solid #ffe0b2'}}>
                                <label style={{color: '#e65100'}}>Contraseña de Acceso *</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="form-group" style={{marginTop: '15px'}}>
                    <label>Foto de Perfil</label>
                    <input type="file" name="foto" accept="image/*" onChange={handleChange} style={{padding:'6px'}}/>
                </div>

                <button type="submit" className="save-button">
                    {tipoCuenta === 'empleado' ? 'Registrar Empleado' : 'Crear Usuario de Sistema'}
                </button>
            </form>
        </div>
    );
};