import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './InsumosCrear.css'; // Usamos el CSS Unificado para coherencia visual

export const EquipoCrear = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Estados para los selectores
    const [tipos, setTipos] = useState([]);
    const [estados, setEstados] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [usuarios, setUsuarios] = useState([]);

    const [formData, setFormData] = useState({
        nro_serie: '', marca: '', modelo: '', fecha_compra: '',
        procesador: '', ram: '', almacenamiento: '',
        tipo_id: '', estado_id: '', proveedor_id: '', usuario_id: '', 
        rut_asociado: '', sucursal_nombre: '', warranty_end_date: '',
        factura: null
    });

    // --- LÓGICA DE VISIBILIDAD (SPECS) ---
    const tipoSeleccionado = tipos.find(t => t.id == formData.tipo_id);
    const nombreTipo = tipoSeleccionado ? tipoSeleccionado.nombre_tipo.toLowerCase() : '';
    const palabrasClaveSpecs = ['notebook', 'pc', 'computador', 'celular', 'tablet', 'all in one', 'servidor', 'laptop', 'escritorio'];
    const mostrarSpecs = palabrasClaveSpecs.some(palabra => nombreTipo.includes(palabra));

    // Helper para extraer datos
    const getData = (response) => {
        if (response.data && response.data.results) return response.data.results;
        return response.data;
    };

    useEffect(() => {
        const fetchOpciones = async () => {
            const token = localStorage.getItem('authToken');
            try {
                const [resTipos, resEstados, resProv, resUsers, resSuc] = await Promise.all([
                    api.get('/api/tipos-equipo/', { headers: { 'Authorization': `Token ${token}` } }),
                    api.get('/api/estados/', { headers: { 'Authorization': `Token ${token}` } }),
                    api.get('/api/proveedores/', { headers: { 'Authorization': `Token ${token}` } }),
                    api.get('/api/usuarios/', { headers: { 'Authorization': `Token ${token}` } }),
                    api.get('/api/sucursales/', { headers: { 'Authorization': `Token ${token}` } })
                ]);

                setTipos(getData(resTipos));
                setEstados(getData(resEstados));
                setProveedores(getData(resProv));
                setUsuarios(getData(resUsers));
                setSucursales(getData(resSuc));
            } catch (err) { 
                console.error(err); 
                setError("Error al cargar las listas. Revisa tu conexión."); 
            }
        };
        fetchOpciones();
    }, []);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        
        // 🚨 CLAVE: Limpiar el error cuando el usuario comienza a escribir
        if (error) {
            setError('');
        }

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
        setLoading(true);
        setError('');
        
        const token = localStorage.getItem('authToken');
        const dataToSend = new FormData();

        // 1. Campos Obligatorios
        dataToSend.append('nro_serie', formData.nro_serie);
        dataToSend.append('marca', formData.marca);
        dataToSend.append('modelo', formData.modelo);
        dataToSend.append('tipo_id', formData.tipo_id);
        dataToSend.append('estado_id', formData.estado_id);

        // 2. Fechas
        if (formData.fecha_compra) dataToSend.append('fecha_compra', formData.fecha_compra);
        if (formData.warranty_end_date) dataToSend.append('warranty_end_date', formData.warranty_end_date);

        // 3. Opcionales
        if (formData.proveedor_id) dataToSend.append('proveedor_id', formData.proveedor_id);
        if (formData.usuario_id) dataToSend.append('usuario_id', formData.usuario_id);
        if (formData.sucursal_nombre) dataToSend.append('sucursal_nombre', formData.sucursal_nombre);
        if (formData.rut_asociado) dataToSend.append('rut_asociado', formData.rut_asociado);

        // 4. Especificaciones
        if (mostrarSpecs) {
            if (formData.procesador) dataToSend.append('procesador', formData.procesador);
            if (formData.ram) dataToSend.append('ram', formData.ram);
            if (formData.almacenamiento) dataToSend.append('almacenamiento', formData.almacenamiento);
        }

        // 5. Archivo
        if (formData.factura instanceof File) {
            dataToSend.append('factura', formData.factura);
        }

        try {
            await api.post('/api/equipos/', dataToSend, {
                headers: { 
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'multipart/form-data' 
                }
            });
            // Sin alerta, redirige directo
            navigate('/inventario');
        } catch (err) {
            // 🚨 MEJORA CLAVE EN EL MANEJO DE ERRORES: Mostrar el error específico del backend
            console.error("Error detallado:", JSON.stringify(err.response?.data, null, 2));
            
            let errorMessage = "Error desconocido al intentar registrar el equipo.";

            if (err.response?.data) {
                const data = err.response.data;
                if (data.nro_serie && data.nro_serie[0].includes('already exists')) {
                    errorMessage = "Error: El Número de Serie ingresado ya existe en el sistema. Por favor, ingrese uno único.";
                } else {
                    // Muestra un error más genérico si no es el de nro_serie
                    errorMessage = `Error de validación: ${JSON.stringify(data)}`;
                }
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        /* USAMOS LAS CLASES DE INSUMOS PARA QUE SE VEA IGUAL */
        <div className="insumo-crear-container">
            <div className="insumo-card">
                <h2>Registrar Nuevo Equipo</h2>
                <p className="form-subtitle">Ingresa los datos del nuevo activo tecnológico.</p>
                
                {/* Muestra el error de forma clara */}
                {error && <div className="alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        {/* COLUMNA IZQUIERDA */}
                        <div className="form-group">
                            <label>Número de Serie *</label>
                            <input type="text" name="nro_serie" value={formData.nro_serie} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Marca *</label>
                            <input type="text" name="marca" value={formData.marca} onChange={handleChange} required />
                        </div>
                        
                        {/* --- RENDERIZADO CONDICIONAL: PROCESADOR Y ALMACENAMIENTO --- */}
                        {mostrarSpecs && (
                            <>
                                <div className="form-group" style={{ animation: 'fadeIn 0.5s' }}>
                                    <label>Procesador</label>
                                    <input type="text" name="procesador" placeholder="Ej: Intel i7" value={formData.procesador} onChange={handleChange} />
                                </div>
                                <div className="form-group" style={{ animation: 'fadeIn 0.5s' }}>
                                    <label>Almacenamiento</label>
                                    <input type="text" name="almacenamiento" placeholder="Ej: 512GB SSD" value={formData.almacenamiento} onChange={handleChange} />
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label>Fecha de Compra</label>
                            <input type="date" name="fecha_compra" value={formData.fecha_compra} onChange={handleChange} />
                        </div>
                        
                        <div className="form-group">
                            <label>Proveedor</label>
                            <select name="proveedor_id" value={formData.proveedor_id} onChange={handleChange}>
                                <option value="">-- Seleccionar Proveedor --</option>
                                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre_proveedor}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA */}
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Modelo *</label>
                            <input type="text" name="modelo" value={formData.modelo} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Tipo de Equipo *</label>
                            <select name="tipo_id" value={formData.tipo_id} onChange={handleChange} required>
                                <option value="">-- Seleccionar Tipo --</option>
                                {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre_tipo}</option>)}
                            </select>
                        </div>

                        {/* --- RENDERIZADO CONDICIONAL: RAM --- */}
                        {mostrarSpecs && (
                            <div className="form-group" style={{ animation: 'fadeIn 0.5s' }}>
                                <label>Memoria RAM</label>
                                <input type="text" name="ram" placeholder="Ej: 16GB" value={formData.ram} onChange={handleChange} />
                            </div>
                        )}

                        <div className="form-group">
                            <label>Estado *</label>
                            <select name="estado_id" value={formData.estado_id} onChange={handleChange} required>
                                <option value="">-- Seleccionar Estado --</option>
                                {estados.map(e => <option key={e.id} value={e.id}>{e.nombre_estado}</option>)}
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>Garantía Hasta</label>
                            <input type="date" name="warranty_end_date" value={formData.warranty_end_date} onChange={handleChange} />
                        </div>

                        <div className="form-group">
                            <label>Sucursal</label>
                            <input type="text" name="sucursal_nombre" list="sucursales-list" placeholder="Ej: Sucursal Centro" value={formData.sucursal_nombre} onChange={handleChange} />
                            <datalist id="sucursales-list">
                                {sucursales.map(s => <option key={s.id} value={s.nombre} />)}
                            </datalist>
                        </div>
                    </div>
                    
                    {/* Archivo */}
                    <div className="form-group" style={{marginTop: '15px'}}>
                        <label>Adjuntar Factura (Solo PDF)</label>
                        <input type="file" name="factura" accept="application/pdf" onChange={handleChange} style={{padding: '6px'}} />
                    </div>

                    <hr style={{margin: '30px 0', border: '0', borderTop: '1px solid var(--border-color)'}}/>
                    
                    <h3>Asignación Inicial (Opcional)</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Usuario Responsable</label>
                            <select name="usuario_id" value={formData.usuario_id} onChange={handleChange}>
                                <option value="">-- Sin Asignar --</option>
                                {usuarios.map(u => (
                                    <option key={u.id} value={u.id}>{u.nombres} {u.apellidos} ({u.username})</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>RUT Asociado (Automático)</label>
                            <input type="text" value={formData.rut_asociado} readOnly disabled style={{backgroundColor: 'var(--bg-input)', cursor: 'not-allowed'}} />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => navigate('/inventario')}>Cancelar</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? 'Guardando...' : 'Registrar Equipo'}
                        </button>
                    </div>
                </form>
                
            </div>
        </div>
    );
};

export default EquipoCrear;