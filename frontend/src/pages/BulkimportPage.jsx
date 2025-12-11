// frontend/src/pages/BulkImportPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { XCircle, CheckCircleFill, ArrowLeft } from 'react-bootstrap-icons'; 
import './BulkImport.css'; 

// URL Base
const BASE_URL = '/api/';

export const BulkImportPage = () => {
    const navigate = useNavigate();
    
    // Lista de tipos de equipo que deben mostrar SPECS
    const SPECS_REQUERIDOS = ['notebook', 'pc escritorio', 'celular'];

    // Estado inicial del formulario
    const initialFormData = {
        cantidad: 1,
        marca: '',
        modelo: '',
        nro_serie: '', 
        proveedor_id: '',
        tipo_id: '',
        estado_id: '',
        sucursal_id: '',
        fecha_compra: '',
        warranty_end_date: '',
        procesador: '',
        ram: '',
        almacenamiento: '',
        factura: null,
    };

    const [formData, setFormData] = useState(initialFormData);
    
    // Listas para Selects
    const [proveedores, setProveedores] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [estados, setEstados] = useState([]);
    const [sucursales, setSucursales] = useState([]);

    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const token = localStorage.getItem('authToken');

    // --- LÓGICA CONDICIONAL DE SPECS ---
    const tipoSeleccionado = tipos.find(t => t.id == formData.tipo_id);
    const nombreTipo = tipoSeleccionado ? tipoSeleccionado.nombre_tipo.toLowerCase() : '';
    const mostrarSpecs = SPECS_REQUERIDOS.includes(nombreTipo);
    // ----------------------------------

    // Función para cargar los datos de los selects
    const fetchSelectData = useCallback(async () => {
        setLoading(true);
        const config = { headers: { 'Authorization': `Token ${token}` } };
        
        const endpoints = [
            { url: 'proveedores/', setter: setProveedores },
            { url: 'tipos-equipo/', setter: setTipos },
            { url: 'estados/', setter: setEstados },
            { url: 'sucursales/', setter: setSucursales },
        ];

        try {
            await Promise.all(endpoints.map(async ({ url, setter }) => {
                const res = await axios.get(`${BASE_URL}${url}`, config);
                setter(res.data.results || res.data); 
            }));
        } catch (err) {
            console.error("Error cargando selects:", err);
            setError("No se pudieron cargar los datos base (proveedores, tipos, etc.).");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (!token) {
            navigate('/login');
        } else {
            fetchSelectData();
        }
    }, [token, navigate, fetchSelectData]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === 'factura') {
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
        setSubmitLoading(true);
        setError(null);
        setSuccessMsg(null);

        if (!formData.proveedor_id || formData.cantidad < 1) {
            setError("Proveedor y Cantidad (mayor a 0) son obligatorios.");
            setSubmitLoading(false);
            return;
        }

        // 🛑 CORRECCIÓN CLAVE: Definir fechas sin forzar null aún
        const fechaCompra = formData.fecha_compra;
        const fechaGarantia = formData.warranty_end_date;
        // Fin de la Corrección Clave
        
        // Crear FormData para manejar el archivo
        const dataToSend = new FormData();

        // 1. Añadir campos de texto
        Object.keys(formData).forEach(key => {
            // Excluir 'factura', 'fecha_compra' y 'warranty_end_date' para manejarlos al final
            if (key !== 'factura' && key !== 'fecha_compra' && key !== 'warranty_end_date') {
                let value = formData[key];
                
                // Si el tipo no requiere specs, asegurar que los campos de specs sean vacíos
                if (!mostrarSpecs && (key === 'procesador' || key === 'ram' || key === 'almacenamiento')) {
                    value = '';
                }

                if (value !== null && value !== '' && value !== undefined) {
                    dataToSend.append(key, value);
                }
            }
        });
        
        // 🛑 AÑADIR FECHAS SOLAMENTE SI NO ESTÁN VACÍAS (Permitirá que Django use NULL si están vacías)
        if (fechaCompra) dataToSend.append('fecha_compra', fechaCompra);
        if (fechaGarantia) dataToSend.append('warranty_end_date', fechaGarantia);
        
        // 2. Añadir el archivo
        if (formData.factura) {
            dataToSend.append('factura', formData.factura);
        }

        try {
            const config = { 
                headers: { 
                    'Authorization': `Token ${token}`,
                } 
            };
            
            await api.post(`${BASE_URL}equipos/bulk/`, dataToSend, config); 
            
            // Redirección a Inventario
            navigate('/inventario');

        } catch (err) {
            console.error("Error en importación masiva:", err.response?.data);
            let errorMessage = err.response?.data?.error || "Error al crear el lote. Verifique los datos ingresados.";
            
            if (err.response?.data?.nro_serie) {
                errorMessage = `Error de Número de Serie: ${err.response.data.nro_serie[0]}`;
            }

            setError(errorMessage);
        } finally {
            setSubmitLoading(false);
        }
    };
    
    if (loading) return <div className="bulk-loading">Cargando formulario...</div>;
    if (error && !submitLoading) return <div className="bulk-error">{error}</div>;


    return (
        <div className="bulk-import-page">
            <header className="bulk-header">
                <button onClick={() => navigate('/inventario')} className="btn-back">
                    <ArrowLeft size={24} /> Volver a Inventario
                </button>
                <h1>Carga Masiva de Equipos</h1>
            </header>

            <div className="bulk-form-container">
                
                {successMsg && (
                    <div className="bulk-alert success">
                        <CheckCircleFill size={20} /> {successMsg}
                    </div>
                )}
                {error && ( 
                    <div className="bulk-alert danger">
                        <XCircle size={20} /> {error}
                    </div>
                )}
                

                <form onSubmit={handleSubmit} className="bulk-form">
                    
                    {/* SECCIÓN 1: REQUERIDOS */}
                    <fieldset className="form-section required-fields">
                        <legend>Datos Requeridos</legend>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Cantidad de Equipos a Crear</label>
                                <input
                                    type="number"
                                    name="cantidad"
                                    value={formData.cantidad}
                                    onChange={handleChange}
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Proveedor (*)</label>
                                <select
                                    name="proveedor_id"
                                    value={formData.proveedor_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Seleccione Proveedor...</option>
                                    {Array.isArray(proveedores) && proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre_proveedor}</option>)}
                                </select>
                            </div>
                        </div>
                    </fieldset>
                    
                    {/* SECCIÓN 2: PLANTILLA BASE (Opcional) */}
                    <fieldset className="form-section optional-fields">
                        <legend>Plantilla de Datos Comunes</legend>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Nro. Serie Base (Opcional)</label>
                                <input
                                    type="text"
                                    name="nro_serie"
                                    value={formData.nro_serie}
                                    onChange={handleChange}
                                    placeholder="Ej: LENOVO-LGN (se añadirá -1, -2, etc.)"
                                />
                            </div>
                            <div className="form-group">
                                <label>Marca</label>
                                <input type="text" name="marca" value={formData.marca} onChange={handleChange} placeholder="Ej: Lenovo" />
                            </div>
                            <div className="form-group">
                                <label>Modelo</label>
                                <input type="text" name="modelo" value={formData.modelo} onChange={handleChange} placeholder="Ej: Legion 5" />
                            </div>
                        </div>
                    </fieldset>
                    
                    {/* SECCIÓN 3: ASIGNACIÓN Y ESPECIFICACIONES (Opcional) */}
                    <fieldset className="form-section specs-fields">
                        <legend>Asignación y Especificaciones</legend>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Tipo de Equipo</label>
                                <select name="tipo_id" value={formData.tipo_id} onChange={handleChange}>
                                    <option value="">N/A</option>
                                    {Array.isArray(tipos) && tipos.map(t => <option key={t.id} value={t.id}>{t.nombre_tipo}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Estado Inicial</label>
                                <select name="estado_id" value={formData.estado_id} onChange={handleChange}>
                                    <option value="">N/A</option>
                                    {Array.isArray(estados) && estados.map(e => <option key={e.id} value={e.id}>{e.nombre_estado}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Sucursal</label>
                                <select name="sucursal_id" value={formData.sucursal_id} onChange={handleChange}>
                                    <option value="">N/A</option>
                                    {Array.isArray(sucursales) && sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label>Adjuntar Factura (PDF)</label>
                                <input type="file" name="factura" accept="application/pdf" onChange={handleChange} />
                            </div>
                            
                        </div>

                        <h5 className="specs-subtitle">Especificaciones y Fechas</h5>
                        <div className="form-row">
                            
                            {/* CAMPOS CONDICIONALES DE SPECS */}
                            {mostrarSpecs ? (
                                <>
                                    <div className="form-group">
                                        <label>Procesador</label>
                                        <input type="text" name="procesador" value={formData.procesador} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>RAM</label>
                                        <input type="text" name="ram" value={formData.ram} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Almacenamiento</label>
                                        <input type="text" name="almacenamiento" value={formData.almacenamiento} onChange={handleChange} />
                                    </div>
                                </>
                            ) : (
                                // Dejamos campos vacíos para no romper el layout si es necesario
                                <div className="form-group full-width-placeholder">
                                    <p className="text-muted">Especificaciones de hardware no requeridas para este tipo de equipo.</p>
                                </div>
                            )}
                            
                            {/* OTROS CAMPOS DE FECHAS */}
                            <div className="form-group">
                                <label>Fecha de Compra</label>
                                <input type="date" name="fecha_compra" value={formData.fecha_compra} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Fin de Garantía</label>
                                <input type="date" name="warranty_end_date" value={formData.warranty_end_date} onChange={handleChange} />
                            </div>
                        </div>

                    </fieldset>

                    <div className="form-footer">
                        <button type="submit" className="submit-btn" disabled={submitLoading}>
                            {submitLoading ? 'Creando Equipos...' : `Crear ${formData.cantidad} Equipos`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};