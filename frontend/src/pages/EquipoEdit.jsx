import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './InsumosCrear.css'; // Usamos el CSS Unificado para coherencia visual

export const EquipoEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    // Listas para los selectores
    const [tipos, setTipos] = useState([]);
    const [estados, setEstados] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [usuarios, setUsuarios] = useState([]);

    const [formData, setFormData] = useState({
        nro_serie: '', marca: '', modelo: '', fecha_compra: '', warranty_end_date: '',
        procesador: '', ram: '', almacenamiento: '',
        tipo_id: '', estado_id: '', proveedor_id: '', usuario_id: '', 
        rut_asociado: '', sucursal_nombre: '', factura: null
    });

    // Lógica de visibilidad (Specs)
    const tipoSeleccionado = tipos.find(t => t.id == formData.tipo_id);
    const nombreTipo = tipoSeleccionado ? tipoSeleccionado.nombre_tipo.toLowerCase() : '';
    const palabrasClaveSpecs = ['notebook', 'pc', 'computador', 'celular', 'tablet', 'all in one', 'servidor', 'laptop', 'escritorio'];
    const mostrarSpecs = palabrasClaveSpecs.some(palabra => nombreTipo.includes(palabra));

    // Helper
    const getData = (res) => res.data.results || res.data;

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('authToken');
            try {
                // Carga paralela de listas y equipo
                const [resTipos, resEstados, resProv, resUsers, resSuc, resEquipo] = await Promise.all([
                    api.get('/api/tipos-equipo/', { headers: { 'Authorization': `Token ${token}` } }),
                    api.get('/api/estados/', { headers: { 'Authorization': `Token ${token}` } }),
                    api.get('/api/proveedores/', { headers: { 'Authorization': `Token ${token}` } }),
                    api.get('/api/usuarios/', { headers: { 'Authorization': `Token ${token}` } }),
                    api.get('/api/sucursales/', { headers: { 'Authorization': `Token ${token}` } }),
                    api.get(`/api/equipos/${id}/`, { headers: { 'Authorization': `Token ${token}` } })
                ]);

                setTipos(getData(resTipos));
                setEstados(getData(resEstados));
                setProveedores(getData(resProv));
                setUsuarios(getData(resUsers));
                setSucursales(getData(resSuc));

                const data = resEquipo.data;

                setFormData({
                    nro_serie: data.nro_serie || '',
                    marca: data.marca || '',
                    modelo: data.modelo || '',
                    fecha_compra: data.fecha_compra || '',
                    warranty_end_date: data.warranty_end_date || '',
                    procesador: data.procesador || '',
                    ram: data.ram || '',
                    almacenamiento: data.almacenamiento || '',
                    tipo_id: data.id_tipo_equipo?.id || '',
                    estado_id: data.id_estado?.id || '',
                    proveedor_id: data.id_proveedor?.id || '',
                    usuario_id: data.id_usuario_responsable?.id || '',
                    rut_asociado: data.rut_asociado || '',
                    sucursal_nombre: data.id_sucursal?.nombre || '',
                    factura: null 
                });
                setLoading(false);
            } catch (err) {
                console.error("Error cargando datos", err);
                setError('Error al cargar los datos del equipo.');
                setLoading(false);
            }
        };
        fetchData();
    }, [id]); 

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'usuario_id') {
            const usuario = usuarios.find(u => u.id === parseInt(value));
            setFormData(prev => ({
                ...prev, usuario_id: value, rut_asociado: usuario?.perfil?.rut || ''
            }));
        } else if (name === 'factura') {
            const file = files[0];
            if (file && file.type !== 'application/pdf') {
                alert('Solo se permiten archivos PDF.');
                e.target.value = null;
                return;
            }
            setFormData(prev => ({ ...prev, factura: file }));
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
            await api.patch(`/api/equipos/${id}/`, dataToSend, {
                headers: { 
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            navigate('/inventario');
        } catch (err) {
            console.error("Error al guardar:", err.response?.data);
            setError("Error al actualizar el equipo. Revisa los datos.");
        }
    };

    if (loading) return <div className="loading-container">Cargando equipo...</div>;

    return (
        /* USAMOS LAS CLASES DE INSUMOSCREAR PARA QUE SE VEA IGUAL */
        <div className="insumo-crear-container">
            <div className="insumo-card">
                <h2>Editar Equipo</h2>
                <p className="form-subtitle">Actualizar información del activo (ID: {id})</p>
                
                {error && <div className="alert-error">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="perfil-form-grid">
                        {/* Columna 1 */}
                        <div className="form-column">
                            <div className="form-group">
                                <label>Número de Serie</label>
                                <input type="text" name="nro_serie" value={formData.nro_serie} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Marca</label>
                                <input type="text" name="marca" value={formData.marca} onChange={handleChange} required />
                            </div>
                            
                            {/* SPECS CONDICIONALES */}
                            {mostrarSpecs && (
                                <>
                                    <div className="form-group" style={{animation: 'fadeIn 0.5s'}}>
                                        <label>Procesador</label>
                                        <input type="text" name="procesador" value={formData.procesador} onChange={handleChange} />
                                    </div>
                                    <div className="form-group" style={{animation: 'fadeIn 0.5s'}}>
                                        <label>Almacenamiento</label>
                                        <input type="text" name="almacenamiento" value={formData.almacenamiento} onChange={handleChange} />
                                    </div>
                                </>
                            )}

                            <div className="form-group">
                                <label>Fecha de Compra</label>
                                <input type="date" name="fecha_compra" value={formData.fecha_compra} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Fin de garantía</label>
                                <input type="date" name="warranty_end_date" value={formData.warranty_end_date} onChange={handleChange} />
                            </div>
                        </div>

                        {/* Columna 2 */}
                        <div className="form-column">
                            <div className="form-group">
                                <label>Modelo</label>
                                <input type="text" name="modelo" value={formData.modelo} onChange={handleChange} required />
                            </div>
                            
                            <div className="form-group">
                                <label>Tipo de Equipo</label>
                                <select name="tipo_id" value={formData.tipo_id} onChange={handleChange} required style={{width:'100%', padding:'12px'}}>
                                    <option value="">-- Seleccionar --</option>
                                    {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre_tipo}</option>)}
                                </select>
                            </div>

                            {mostrarSpecs && (
                                <div className="form-group" style={{animation: 'fadeIn 0.5s'}}>
                                    <label>Memoria RAM</label>
                                    <input type="text" name="ram" value={formData.ram} onChange={handleChange} />
                                </div>
                            )}

                            <div className="form-group">
                                <label>Estado</label>
                                <select name="estado_id" value={formData.estado_id} onChange={handleChange} required style={{width:'100%', padding:'12px'}}>
                                    <option value="">-- Seleccionar --</option>
                                    {estados.map(e => <option key={e.id} value={e.id}>{e.nombre_estado}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Proveedor</label>
                                <select name="proveedor_id" value={formData.proveedor_id} onChange={handleChange} style={{width:'100%', padding:'12px'}}>
                                    <option value="">-- Seleccionar --</option>
                                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre_proveedor}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Sucursal</label>
                                <input type="text" name="sucursal_nombre" list="sucursales-list" placeholder="Ej: Sucursal Centro" value={formData.sucursal_nombre} onChange={handleChange} />
                                <datalist id="sucursales-list">
                                    {sucursales.map(s => <option key={s.id} value={s.nombre} />)}
                                </datalist>
                            </div>
                        </div>
                    </div>

                    {/* Actualizar Factura */}
                    <div className="form-group" style={{marginTop: '15px'}}>
                        <label>Actualizar Factura (PDF) - <small>Dejar vacío para mantener la actual</small></label>
                        <input type="file" name="factura" accept="application/pdf" onChange={handleChange} style={{padding: '8px'}} />
                    </div>

                    <hr style={{margin: '30px 0', border: '0', borderTop: '1px solid var(--border-color)'}}/>
                    
                    <h3>Asignación de Usuario</h3>
                    <div className="perfil-form-grid">
                        <div className="form-column">
                            <div className="form-group">
                                <label>Usuario Responsable</label>
                                <select name="usuario_id" value={formData.usuario_id} onChange={handleChange} style={{width:'100%', padding:'12px'}}>
                                    <option value="">-- Sin Asignar --</option>
                                    {usuarios.map(u => (
                                        <option key={u.id} value={u.id}>{u.nombres} {u.apellidos} ({u.username})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-column">
                            <div className="form-group">
                                <label>RUT Asociado</label>
                                <input type="text" value={formData.rut_asociado} readOnly disabled style={{backgroundColor: 'var(--bg-input)', cursor: 'not-allowed'}} />
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => navigate('/inventario')}>Cancelar</button>
                        <button type="submit" className="btn-save">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    );
};