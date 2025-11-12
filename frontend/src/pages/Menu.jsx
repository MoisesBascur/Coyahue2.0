import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Menu.css'; 

export const Menu = () => {
    const [actividades, setActividades] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActividades = async () => {
            const token = localStorage.getItem('authToken');
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/actividades/', {
                    headers: { 'Authorization': `Token ${token}` }
                });
                const data = response.data.results || response.data;
                setActividades(Array.isArray(data) ? data : []);
                setLoading(false);
            } catch (err) {
                console.error("Error cargando actividades", err);
                setLoading(false);
            }
        };
        fetchActividades();
    }, []);

    const getByStatus = (status) => {
        if (!Array.isArray(actividades)) return [];
        return actividades.filter(item => item.etiqueta === status);
    };

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) return 'Hoy';
        return date.toLocaleDateString('es-CL');
    };

    if (loading) return <p style={{padding: '24px'}}>Cargando tablero...</p>;

    return (
        <div className="menu-container"> {/* Usamos un div envolvente si es necesario, o directo el layout */}
            <header className="main-header">
                <h1>Tablero de Trabajo</h1>
                <div className="main-searchbar-container">
                    <input type="search" placeholder="Buscar tarea..." className="main-searchbar" />
                </div>
            </header>

            {/* Usamos tu clase original: menu-columns-container */}
            <div className="menu-columns-container">
                
                {/* COLUMNA 1: TAREAS (Por Hacer) */}
                <div className="menu-column">
                    <h3>Por Hacer ({getByStatus('pendiente').length})</h3>
                    
                    {getByStatus('pendiente').map(item => (
                        <div key={item.id} className="menu-card">
                            <span className="card-tag pending">Pendiente</span>
                            <h4 style={{margin: '8px 0', color: '#333'}}>{item.titulo}</h4>
                            <p style={{fontSize: '13px', color: '#666'}}>{item.descripcion}</p>
                            <span className="card-date">{formatDate(item.fecha)}</span>
                        </div>
                    ))}
                    <button className="new-task-btn">+ Nueva Tarea</button>
                </div>

                {/* COLUMNA 2: IMPORTANTES (Urgente) */}
                {/* Agregamos la clase 'col-urgent' para el texto rojo */}
                <div className="menu-column col-urgent">
                    <h3>Importantes ({getByStatus('urgente').length})</h3>
                    
                    {getByStatus('urgente').map(item => (
                        <div key={item.id} className="menu-card">
                            <span className="card-tag urgent">Urgente</span>
                            <h4 style={{margin: '8px 0', color: '#333'}}>{item.titulo}</h4>
                            <p style={{fontSize: '13px', color: '#666'}}>{item.descripcion}</p>
                            <span className="card-date">{formatDate(item.fecha)}</span>
                        </div>
                    ))}
                </div>

                {/* COLUMNA 3: COMPLETADAS (Hecho) */}
                {/* Agregamos la clase 'col-done' para el texto verde */}
                <div className="menu-column col-done">
                    <h3>Completadas ({getByStatus('hecho').length})</h3>
                    
                    {getByStatus('hecho').map(item => (
                        <div key={item.id} className="menu-card">
                            <span className="card-tag done">Hecho</span>
                            {/* Tachamos el texto visualmente */}
                            <div style={{textDecoration: 'line-through', opacity: 0.7}}>
                                <h4 style={{margin: '8px 0', color: '#333'}}>{item.titulo}</h4>
                                <p style={{fontSize: '13px', color: '#666'}}>{item.descripcion}</p>
                            </div>
                            <span className="card-date">Finalizado: {formatDate(item.fecha)}</span>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};