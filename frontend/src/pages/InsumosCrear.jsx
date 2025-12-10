import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import './InsumosCrear.css';

export const InsumoCrear = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        const token = localStorage.getItem('authToken');
        try {
            await api.post('/api/insumos/', formData, {
                headers: { 'Authorization': `Token ${token}` }
            });
            navigate('/insumos'); // Volver a la lista
        } catch (err) {
            console.error(err);
            // Mensaje de error amigable si el código ya existe
            if (err.response?.data?.codigo) {
                setError("El código ingresado ya existe en otro insumo.");
            } else {
                setError("Error al guardar. Verifique los datos.");
            }
            setLoading(false);
        }
    };

    return (
        <div className="insumo-form-container">
            <div className="form-card">
                <h2>Registrar Nuevo Insumo</h2>
                <p className="form-subtitle">Complete los datos para el control de stock</p>

                {error && <div className="alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Nombre del Insumo *</label>
                            <input name="nombre" value={formData.nombre} onChange={handleChange} required placeholder="Ej: Toner HP 85A" />
                        </div>
                        <div className="form-group">
                            <label>Código Interno *</label>
                            <input name="codigo" value={formData.codigo} onChange={handleChange} required placeholder="Ej: INS-001" />
                        </div>
                    </div>

                    <div className="form-grid three-col">
                        <div className="form-group">
                            <label>Stock Inicial</label>
                            <input type="number" name="stock_actual" value={formData.stock_actual} onChange={handleChange} min="0" />
                        </div>
                        <div className="form-group">
                            <label>Stock Mínimo (Alerta)</label>
                            <input type="number" name="stock_minimo" value={formData.stock_minimo} onChange={handleChange} min="1" />
                        </div>
                        <div className="form-group">
                            <label>Unidad de Medida</label>
                            <select name="unidad_medida" value={formData.unidad_medida} onChange={handleChange}>
                                <option value="Unidad">Unidad</option>
                                <option value="Caja">Caja</option>
                                <option value="Paquete">Paquete</option>
                                <option value="Litro">Litro</option>
                                <option value="Rollo">Rollo</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Ubicación Física</label>
                        <input name="ubicacion" value={formData.ubicacion} onChange={handleChange} placeholder="Ej: Bodega 2, Estante A" />
                    </div>

                    <div className="form-group">
                        <label>Descripción / Notas</label>
                        <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows="3" />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={() => navigate('/insumos')}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Guardando...' : 'Crear Insumo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
