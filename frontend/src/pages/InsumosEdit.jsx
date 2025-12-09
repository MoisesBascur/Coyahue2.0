import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import './InsumosEdit.css';

export const InsumoEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        nombre: '',
        codigo: '',
        stock_actual: 0,
        stock_minimo: 5,
        unidad_medida: 'Unidad',
        ubicacion: '',
        descripcion: ''
    });

    // 1. Cargar datos del insumo al iniciar
    useEffect(() => {
        const fetchInsumo = async () => {
            const token = localStorage.getItem('authToken');
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/insumos/${id}/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                setFormData(response.data);
            } catch (err) {
                console.error("Error al cargar insumo:", err);
                setError("No se pudo cargar la información del insumo. Puede que no exista.");
            } finally {
                setLoading(false);
            }
        };
        fetchInsumo();
    }, [id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        
        const token = localStorage.getItem('authToken');
        try {
            // Usamos PUT para actualizar el recurso completo
            await axios.put(`http://127.0.0.1:8000/api/insumos/${id}/`, formData, {
                headers: { 'Authorization': `Token ${token}` }
            });
            navigate('/insumos'); // Volver al listado
        } catch (err) {
            console.error(err);
            if (err.response?.data?.codigo) {
                setError("El código ingresado ya está en uso por otro insumo.");
            } else {
                setError("Ocurrió un error al actualizar. Verifique los datos.");
            }
            setSaving(false);
        }
    };

    if (loading) return <div className="loading-container">Cargando datos del insumo...</div>;

    return (
        <div className="insumo-crear-container">
            <div className="insumo-card">
                <h2>Editar Insumo</h2>
                <p className="form-subtitle">Modifique los datos del inventario</p>

                {error && <div className="alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Nombre del Insumo *</label>
                            <input 
                                name="nombre" 
                                value={formData.nombre} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label>Código Interno *</label>
                            <input 
                                name="codigo" 
                                value={formData.codigo} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                    </div>

                    <div className="form-grid three-col">
                        <div className="form-group">
                            <label>Stock Actual</label>
                            <input 
                                type="number" 
                                name="stock_actual" 
                                value={formData.stock_actual} 
                                onChange={handleChange} 
                                min="0" 
                            />
                        </div>
                        <div className="form-group">
                            <label>Stock Mínimo</label>
                            <input 
                                type="number" 
                                name="stock_minimo" 
                                value={formData.stock_minimo} 
                                onChange={handleChange} 
                                min="1" 
                            />
                        </div>
                        <div className="form-group">
                            <label>Unidad de Medida</label>
                            <select name="unidad_medida" value={formData.unidad_medida} onChange={handleChange}>
                                <option value="Unidad">Unidad</option>
                                <option value="Caja">Caja</option>
                                <option value="Paquete">Paquete</option>
                                <option value="Litro">Litro</option>
                                <option value="Rollo">Rollo</option>
                                <option value="Metro">Metro</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Ubicación Física</label>
                        <input 
                            name="ubicacion" 
                            value={formData.ubicacion} 
                            onChange={handleChange} 
                        />
                    </div>

                    <div className="form-group">
                        <label>Descripción / Notas</label>
                        <textarea 
                            name="descripcion" 
                            value={formData.descripcion} 
                            onChange={handleChange} 
                            rows="3" 
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => navigate('/insumos')}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-save" disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
