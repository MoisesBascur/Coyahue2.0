import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EquipoEdit.css';

export const EquipoCrear = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    
    const [tipos, setTipos] = useState([]);
    const [estados, setEstados] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [usuarios, setUsuarios] = useState([]);

    const [formData, setFormData] = useState({
        nro_serie: '', marca: '', modelo: '', fecha_compra: '',
        procesador: '', ram: '', almacenamiento: '',
        tipo_id: '', estado_id: '', proveedor_id: '', usuario_id: '', rut_asociado: '',
        factura: null
    });

    // --- FUNCIÓN AUXILIAR PARA EXTRAER DATOS ---
    // Si la respuesta tiene paginación (.results), devuelve eso. Si no, devuelve la data directa.
    const getData = (response) => {
        if (response.data && response.data.results) {
            return response.data.results;
        }
        return response.data;
    };

    useEffect(() => {
        const fetchOpciones = async () => {
            const token = localStorage.getItem('authToken');
            try {
                const [resTipos, resEstados, resProv, resUsers] = await Promise.all([
                    axios.get('http://127.0.0.1:8000/api/tipos-equipo/', { headers: { 'Authorization': `Token ${token}` } }),
                    axios.get('http://127.0.0.1:8000/api/estados/', { headers: { 'Authorization': `Token ${token}` } }),
                    axios.get('http://127.0.0.1:8000/api/proveedores/', { headers: { 'Authorization': `Token ${token}` } }),
                    axios.get('http://127.0.0.1:8000/api/usuarios/', { headers: { 'Authorization': `Token ${token}` } })
                ]);

                // Usamos la función auxiliar aquí para evitar el crash
                setTipos(getData(resTipos));
                setEstados(getData(resEstados));
                setProveedores(getData(resProv));
                setUsuarios(getData(resUsers));

            } catch (err) { 
                console.error(err); 
                setError("Error al cargar las opciones. Verifica tu conexión."); 
            }
        };
        fetchOpciones();
    }, []);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        
        if (name === 'usuario_id') {
            const usuario = usuarios.find(u => u.id === parseInt(value));
            setFormData(prev => ({
                ...prev, 
                usuario_id: value, 
                rut_asociado: usuario?.perfil?.rut || ''
            }));
        } else if (name === 'factura') {
            const file = files[0];
            if (file) {
                if (file.type !== 'application/pdf') {
                    alert('Solo se permiten archivos PDF.');
                    e.target.value = null;
                    return;
                }
                setFormData(prev => ({ ...prev, factura: file }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('authToken');
        
        const dataToSend = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== '') {
                dataToSend.append(key, formData[key]);
            }
        });

        try {
            await axios.post('http://127.0.0.1:8000/api/equipos/', dataToSend, {
                headers: { 
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'multipart/form-data' 
                }
            });
            navigate('/inventario');
        } catch (err) {
            console.error("Error creando equipo", err.response?.data);
            setError("Error al crear equipo. Verifica los datos.");
        }
    };

    return (
        <div className="edit-form-container">
            <h1>Registrar Nuevo Equipo</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <form onSubmit={handleSubmit}>
                <div className="perfil-form-grid">
                    <div className="form-column">
                        <div className="form-group">
                            <label>Número de Serie *</label>
                            <input type="text" name="nro_serie" value={formData.nro_serie} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Marca *</label>
                            <input type="text" name="marca" value={formData.marca} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Procesador</label>
                            <input type="text" name="procesador" placeholder="Ej: Intel i7" value={formData.procesador} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Almacenamiento</label>
                            <input type="text" name="almacenamiento" placeholder="Ej: 512GB SSD" value={formData.almacenamiento} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Fecha de Compra</label>
                            <input type="date" name="fecha_compra" value={formData.fecha_compra} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-column">
                        <div className="form-group">
                            <label>Modelo *</label>
                            <input type="text" name="modelo" value={formData.modelo} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Tipo de Equipo *</label>
                            <select name="tipo_id" value={formData.tipo_id} onChange={handleChange} required style={{width:'100%', padding:'10px'}}>
                                <option value="">-- Seleccionar Tipo --</option>
                                {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre_tipo}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Memoria RAM</label>
                            <input type="text" name="ram" placeholder="Ej: 16GB" value={formData.ram} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Estado *</label>
                            <select name="estado_id" value={formData.estado_id} onChange={handleChange} required style={{width:'100%', padding:'10px'}}>
                                <option value="">-- Seleccionar Estado --</option>
                                {estados.map(e => <option key={e.id} value={e.id}>{e.nombre_estado}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Proveedor</label>
                            <select name="proveedor_id" value={formData.proveedor_id} onChange={handleChange} style={{width:'100%', padding:'10px'}}>
                                <option value="">-- Seleccionar Proveedor --</option>
                                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre_proveedor}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                
                <div className="form-group" style={{marginTop: '15px'}}>
                    <label>Adjuntar Factura (Solo PDF)</label>
                    <input 
                        type="file" 
                        name="factura" 
                        accept="application/pdf" 
                        onChange={handleChange} 
                        style={{padding: '6px'}}
                    />
                </div>

                <hr style={{margin: '20px 0', border: '0', borderTop: '1px solid #eee'}}/>
                
                <h3>Asignación Inicial (Opcional)</h3>
                <div className="perfil-form-grid">
                    <div className="form-column">
                        <div className="form-group">
                            <label>Usuario Responsable</label>
                            <select name="usuario_id" value={formData.usuario_id} onChange={handleChange} style={{width:'100%', padding:'10px'}}>
                                <option value="">-- Sin Asignar --</option>
                                {usuarios.map(u => (
                                    <option key={u.id} value={u.id}>{u.nombres} {u.apellidos} ({u.username})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-column">
                        <div className="form-group">
                            <label>RUT Asociado (Automático)</label>
                            <input type="text" value={formData.rut_asociado} readOnly disabled style={{backgroundColor: '#f0f0f0'}} />
                        </div>
                    </div>
                </div>

                <button type="submit" className="save-button">Registrar Equipo</button>
            </form>
        </div>
    );
};