// frontend/src/pages/EquipoEdit.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './InsumosCrear.css'; // Clase base para el layout

// --- HELPER PARA OBTENER URL ABSOLUTA ---
const getFileUrl = (url) => {
    if (!url) return null;
    // Si viene de S3 (https://...), se usa tal cual
    if (url.startsWith('http')) return url;
    
    // Si es relativa (/media/...), devolvemos solo la ruta.
    // El navegador la buscará automáticamente en el servidor actual.
    return url; 
};
// ----------------------------------------


export const EquipoEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);

    // Lista de tipos de equipo que deben mostrar SPECS
    const SPECS_REQUERIDOS = ['notebook', 'pc escritorio', 'celular'];
    
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
        rut_asociado: '', sucursal_nombre: '', factura: null, sucursal_id: '',
        current_factura_url: null
    });

    // Lógica de visibilidad (Specs)
    const tipoSeleccionado = tipos.find(t => t.id == formData.tipo_id);
    const nombreTipo = tipoSeleccionado ? tipoSeleccionado.nombre_tipo.toLowerCase() : '';
    const mostrarSpecs = SPECS_REQUERIDOS.includes(nombreTipo);

    // Helper
    const getData = (res) => res.data.results || res.data;
    const BASE_URL = '/api/';
    const token = localStorage.getItem('authToken');

    useEffect(() => {
        const fetchData = async () => {
            
            try {
                const config = { headers: { 'Authorization': `Token ${token}` } };
                
                const [resTipos, resEstados, resProv, resUsers, resSuc, resEquipo] = await Promise.all([
                    api.get(`${BASE_URL}tipos-equipo/`, config),
                    api.get(`${BASE_URL}estados/`, config),
                    api.get(`${BASE_URL}proveedores/`, config),
                    api.get(`${BASE_URL}usuarios/`, config),
                    api.get(`${BASE_URL}sucursales/`, config),
                    api.get(`${BASE_URL}equipos/${id}/`, config)
                ]); 

                setTipos(getData(resTipos));
                setEstados(getData(resEstados));
                setProveedores(getData(resProv));
                setUsuarios(getData(resUsers));
                setSucursales(getData(resSuc));

                // Mapear datos del equipo
                const data = resEquipo.data;
                
                let rut = data.rut_asociado || '';
                if (data.id_usuario_responsable?.id) {
                    const user = getData(resUsers).find(u => u.id === data.id_usuario_responsable.id);
                    rut = user?.perfil?.rut || data.rut_asociado || '';
                }

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
                    rut_asociado: rut,
                    sucursal_id: data.id_sucursal?.id || '',
                    sucursal_nombre: data.id_sucursal?.nombre || '',
                    current_factura_url: data.factura || null,
                    factura: null
                });
                
                setLoading(false);
            } catch (err) {
                console.error("Error cargando datos:", err);
                setError('Error al cargar los datos del equipo o las listas de selección.');
                setLoading(false);
            }
        };
        fetchData();
    }, [id, token]); 
    
    const handleChange = (e) => {
        const { name, value, files } = e.target;
        
        if (name === 'usuario_id') {
            const usuario = usuarios.find(u => u.id === parseInt(value));
            setFormData(prev => ({
                ...prev, usuario_id: value, rut_asociado: usuario?.perfil?.rut || ''
            }));
        } 
        else if (name === 'factura') {
            const file = files[0];
            if (file && file.type !== 'application/pdf') {
                alert('Solo se permiten archivos PDF.');
                e.target.value = null;
                return;
            }
            setFormData(prev => ({ ...prev, factura: file }));
        } 
        else if (name === 'sucursal_nombre') {
             const sucursal = sucursales.find(s => s.nombre === value);
             setFormData(prev => ({ 
                 ...prev, 
                 sucursal_nombre: value,
                 sucursal_id: sucursal ? sucursal.id : '' 
             }));
        }
        else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setError('');

        
        // 🛑 CORRECCIÓN CLAVE: No enviar la fecha si está vacía, permitiendo que Django use NULL.
        const fechaCompra = formData.fecha_compra;
        const fechaGarantia = formData.warranty_end_date;
        
        const dataToSend = new FormData();
        
        // Mapeo de datos para envío
        const fieldsToMap = {
            nro_serie: formData.nro_serie,
            marca: formData.marca,
            modelo: formData.modelo,
            // 🛑 Excluimos las fechas para manejo manual al final 
            // fecha_compra: fechaCompra,
            // warranty_end_date: fechaGarantia,
            rut_asociado: formData.rut_asociado,
            
            // Especificaciones condicionales
            procesador: mostrarSpecs ? formData.procesador : '',
            ram: mostrarSpecs ? formData.ram : '',
            almacenamiento: mostrarSpecs ? formData.almacenamiento : '',

            // Foreign Keys (usando el ID)
            id_tipo_equipo: formData.tipo_id,
            id_estado: formData.estado_id,
            id_proveedor: formData.proveedor_id,
            id_usuario_responsable: formData.usuario_id,
            id_sucursal: formData.sucursal_id, 
        };

        // Rellenar FormData
        Object.keys(fieldsToMap).forEach(key => {
            const value = fieldsToMap[key];
            
            // Solo añadir si no es null, vacío, o undefined
            if (value !== null && value !== '' && value !== undefined) {
                dataToSend.append(key, value);
            }
        });

        // 🛑 AÑADIR FECHAS SOLAMENTE SI NO ESTÁN VACÍAS
        if (fechaCompra) dataToSend.append('fecha_compra', fechaCompra);
        if (fechaGarantia) dataToSend.append('warranty_end_date', fechaGarantia);
        
        // Añadir el archivo al final
        if (formData.factura) {
             dataToSend.append('factura', formData.factura);
        }
        
        try {
            await api.patch(`${BASE_URL}equipos/${id}/`, dataToSend, {
                headers: { 
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'multipart/form-data' 
                }
            });
            navigate('/inventario');
        } catch (err) {
            console.error("Error al guardar:", err.response?.data);
            setError("Error al actualizar el equipo. Revisa los datos.");
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loading) return <div className="loading-container">Cargando equipo...</div>;

    return (
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
                                <input 
                                    type="text" 
                                    name="sucursal_nombre" 
                                    list="sucursales-list" 
                                    placeholder="Ej: Sucursal Centro" 
                                    value={formData.sucursal_nombre} 
                                    onChange={handleChange} 
                                />
                                <datalist id="sucursales-list">
                                    {sucursales.map(s => <option key={s.id} value={s.nombre} />)}
                                </datalist>
                            </div>
                        </div>
                    </div>

                    {/* Actualizar Factura */}
                    <div className="form-group" style={{marginTop: '15px'}}>
                        <label>Actualizar Factura (PDF) - <small>Dejar vacío para mantener la actual</small></label>
                        {formData.current_factura_url && (
                            <p style={{marginTop: '-5px', marginBottom: '5px', fontSize: '0.9em'}}>
                                <a href={getFileUrl(formData.current_factura_url)} target="_blank" rel="noreferrer" style={{color: '#ff8c00'}}>
                                    Ver factura actual
                                </a>
                            </p>
                        )}
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
                                        <option key={u.id} value={u.id}>{u.username} ({u.nombres || ''} {u.apellidos || ''})</option>
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
                        <button type="submit" className="btn-save" disabled={submitLoading}>
                            {submitLoading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};