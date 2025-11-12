import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EquipoEdit.css'; 

export const EquipoEdit = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        marca: '',
        modelo: '',
        nro_serie: '',
        rut_asociado: '',
        usuario_id: '' 
    });
    
    const [usuariosDisponibles, setUsuariosDisponibles] = useState([]); 
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('authToken');
            try {
                // 1. Cargar usuarios (incluye nombres y perfil con RUT)
                const usersResponse = await axios.get('http://127.0.0.1:8000/api/usuarios/', {
                    headers: { 'Authorization': `Token ${token}` }
                });
                setUsuariosDisponibles(usersResponse.data);

                // 2. Cargar datos del equipo
                const equipoResponse = await axios.get(`http://127.0.0.1:8000/api/equipos/${id}/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                
                const data = equipoResponse.data;
                
                // Si el equipo ya tiene un usuario, usamos ese RUT, si no, lo dejamos vacío
                // (O usamos el rut_asociado guardado si existe)
                const rutInicial = data.id_usuario_responsable?.perfil?.rut || data.rut_asociado || '';

                setFormData({
                    marca: data.marca,
                    modelo: data.modelo,
                    nro_serie: data.nro_serie,
                    rut_asociado: rutInicial,
                    usuario_id: data.id_usuario_responsable ? data.id_usuario_responsable.id : ''
                });

                setLoading(false);
            } catch (err) {
                console.error("Error cargando datos", err);
                setLoading(false);
            }
        };
        fetchData();
    }, [id]); 

    // --- LÓGICA DE AUTOMATIZACIÓN ---
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Si cambiamos el USUARIO, buscamos su RUT automáticamente
        if (name === 'usuario_id') {
            // 1. Encontrar el objeto usuario completo en la lista
            const usuarioSeleccionado = usuariosDisponibles.find(u => u.id === parseInt(value));
            
            // 2. Extraer el RUT de su perfil (si existe)
            const rutDelUsuario = usuarioSeleccionado?.perfil?.rut || '';

            // 3. Actualizar ambos campos a la vez
            setFormData(prevData => ({
                ...prevData,
                usuario_id: value,
                rut_asociado: rutDelUsuario // <-- ¡Magia! Se rellena solo
            }));
        } else {
            // Comportamiento normal para los otros campos (marca, modelo, etc.)
            setFormData(prevData => ({
                ...prevData,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('authToken');
        
        const dataToSend = {
            ...formData,
            usuario_id: formData.usuario_id === '' ? null : formData.usuario_id
        };

        try {
            await axios.patch(`http://127.0.0.1:8000/api/equipos/${id}/`, dataToSend, {
                headers: { 'Authorization': `Token ${token}` }
            });
            navigate('/inventario');
        } catch (err) {
            console.error("Error al guardar los cambios", err);
            alert("Error al guardar. Revisa la consola.");
        }
    };

    if (loading) return <p>Cargando equipo...</p>;

    return (
        <div className="edit-form-container">
            <h1>Editar Equipo (ID: {id})</h1>
            
            <form onSubmit={handleSubmit}>
                
                {/* --- SELECT DE USUARIO --- */}
                <div className="form-group">
                    <label htmlFor="usuario_id">Asignar Usuario Responsable</label>
                    <select 
                        name="usuario_id" 
                        id="usuario_id" 
                        value={formData.usuario_id} 
                        onChange={handleChange}
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                        <option value="">-- Sin Asignar --</option>
                        {usuariosDisponibles.map(u => (
                            <option key={u.id} value={u.id}>
                                {/* Muestra Nombre y Apellido en lugar del correo */}
                                {u.nombres} {u.apellidos} ({u.perfil?.rut || 'Sin RUT'})
                            </option>
                        ))}
                    </select>
                </div>

                {/* --- CAMPO RUT (BLOQUEADO) --- */}
                <div className="form-group">
                    <label htmlFor="rut_asociado">RUT Asociado (Automático)</label>
                    <input 
                        type="text" 
                        name="rut_asociado" 
                        id="rut_asociado"
                        value={formData.rut_asociado}
                        readOnly  // <-- No se puede escribir
                        disabled  // <-- Se ve gris
                        style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                    />
                    <small style={{color: '#777'}}>Este campo se llena al seleccionar un usuario.</small>
                </div>

                <div className="form-group">
                    <label htmlFor="marca">Marca</label>
                    <input 
                        type="text" 
                        name="marca" 
                        id="marca"
                        value={formData.marca}
                        onChange={handleChange}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="modelo">Modelo</label>
                    <input 
                        type="text" 
                        name="modelo" 
                        id="modelo"
                        value={formData.modelo}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="nro_serie">Número de Serie</label>
                    <input 
                        type="text" 
                        name="nro_serie" 
                        id="nro_serie"
                        value={formData.nro_serie}
                        onChange={handleChange}
                    />
                </div>
                
                <button type="submit" className="save-button">Guardar Cambios</button>
            </form>
        </div>
    );
};