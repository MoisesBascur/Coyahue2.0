// frontend/src/pages/Calendario.jsx (SOLUCIÓN FINAL ASEGURADA CONTRA BLUR)

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es';
import api from '../api';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendario.css';
import Modal from 'react-modal'; 

// CLAVE: Configurar el elemento raíz para react-modal
Modal.setAppElement('#root'); 

const locales = { 'es': es };

const localizer = dateFnsLocalizer({
    format, parse, startOfWeek, getDay, locales,
});

const BASE_URL = '/api/';

// --- HELPER PARA OBTENER URL ABSOLUTA ---
const getFileUrl = (url) => {
    if (!url) return null;
    // Si viene de S3 (https://...), se usa tal cual
    if (url.startsWith('http')) return url;
    
    // Si es local (/media/...), devolvemos solo la ruta.
    // El navegador la buscará automáticamente en el servidor actual.
    return url; 
};
// ----------------------------------------

// 🛑 HELPER PARA FORZAR EL COLOR Y OPACIDAD (Anula el gris tenue en modo oscuro)
const getForcedTextStyle = () => {
    const isDarkMode = document.body.classList.contains('dark') || document.body.classList.contains('dark-mode');
    
    // Si estamos en modo oscuro, forzamos texto blanco (#e0e0e0) para máxima legibilidad.
    // Si estamos en modo claro, forzamos texto oscuro (var(--cal-text) de tu CSS).
    const forcedColor = isDarkMode ? '#e0e0e0' : 'var(--cal-text)';

    return {
        color: forcedColor,
        opacity: 1, 
        filter: 'none',
        // Aseguramos que los párrafos internos sean opacos
        '--text-primary': forcedColor // Puede ayudar si el modal hereda estilos del root
    };
};


export const Calendario = () => {
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [connectionError, setConnectionError] = useState(null); 
    
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState(Views.MONTH); 
    
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const normalize = (resp) => Array.isArray(resp.data) ? resp.data : (Array.isArray(resp.data?.results) ? resp.data.results : []);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('authToken');
            try {
                setConnectionError(null);
                
                const results = await Promise.allSettled([
                    api.get(`${BASE_URL}reservas/`, { headers: { 'Authorization': `Token ${token}` } }),
                    api.get(`${BASE_URL}tareas/`, { headers: { 'Authorization': `Token ${token}` } }),
                    api.get(`${BASE_URL}equipos/?all=true`, { headers: { 'Authorization': `Token ${token}` } }),
                ]);

                const reservasData = results[0].status === 'fulfilled' ? normalize(results[0].value) : [];
                const tareasData = results[1].status === 'fulfilled' ? normalize(results[1].value) : [];
                const equiposData = results[2].status === 'fulfilled' ? normalize(results[2].value) : [];

                // Mapeo eventos (Reservas, Tareas, Garantías...)
                const reservasEventos = reservasData.map(reserva => ({
                    id: `R-${reserva.id}`,
                    title: `Reserva: ${reserva.equipo_data.marca} ${reserva.equipo_data.modelo} (${reserva.usuario_data.username})`,
                    start: new Date(reserva.fecha_inicio),
                    end: new Date(reserva.fecha_fin),
                    allDay: true,
                    resource: { tipo: 'reserva', data: reserva } 
                }));

                const tareasEventos = tareasData.map(task => {
                    const dateString = task.due_datetime || task.due_date;
                    if (!dateString) return null;
                    
                    const start = new Date(dateString);
                    const end = new Date(start.getTime() + 60 * 60 * 1000);

                    const taskTitle = task.titulo || task.title || task.nombre || task.descripcion || 'Sin título de tarea';

                    return {
                        id: `T-${task.id}`,
                        title: `Tarea: ${taskTitle}`,
                        start, end, allDay: false,
                        resource: { tipo: 'tarea', data: task } 
                    };
                }).filter(Boolean);

                const garantiasEventos = equiposData
                    .filter(eq => eq.warranty_end_date) 
                    .map(eq => {
                        const start = new Date(eq.warranty_end_date + 'T09:00:00'); 
                        
                        if (isNaN(start.getTime())) {
                            console.error(`❌ ERROR DE FECHA: Garantía ID ${eq.id} tiene fecha inválida: ${eq.warranty_end_date}`);
                            return null;
                        }

                        return {
                            id: `G-${eq.id}`,
                            title: `Vencimiento Garantía: ${eq.marca} ${eq.modelo} (${eq.nro_serie})`,
                            start: start, 
                            end: start, 
                            allDay: true,
                            resource: { tipo: 'garantia', data: eq } 
                        };
                    }).filter(Boolean);

                setEventos([...reservasEventos, ...tareasEventos, ...garantiasEventos]);

            } catch (err) {
                console.error("Error cargando calendario:", err);
                if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
                     setConnectionError("Error de conexión con la API de Django. Asegúrate de que el servidor está corriendo en el puerto 8000.");
                } else {
                     setConnectionError("Error al cargar datos. Revisa el token de autenticación.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const onNavigate = useCallback((newDate) => setDate(newDate), [setDate]);
    const onView = useCallback((newView) => setView(newView), [setView]); 
    
    // 🛑 Modificamos el handler para desactivar el filtro inmediatamente antes de abrir el modal
    const handleSelectEvent = (event) => {
        // SOLUCIÓN PARCHE 1: Inmediatamente antes de abrir, anular el blur del fondo
        const appElement = document.getElementById('root');
        if (appElement) {
             appElement.style.filter = 'none';
             appElement.style.webkitFilter = 'none';
        }
        document.body.classList.remove('react-modal-open'); // A veces la clase react-modal-open activa el blur
        
        setSelectedEvent(event);
        setModalIsOpen(true);
    };
    
    // 🛑 Modificamos el close handler para limpiar el parche después de cerrar
    const handleCloseModal = () => {
        setModalIsOpen(false);
        const appElement = document.getElementById('root');
        if (appElement) {
            // Puedes necesitar restaurar el blur si es usado por otras partes de la app
            // Por ahora, lo dejamos en 'none' para evitar el re-blur
             appElement.style.filter = 'none';
             appElement.style.webkitFilter = 'none';
        }
        document.body.classList.remove('react-modal-open');
    }


    const eventsFiltered = eventos.filter(ev => {
        const tipo = ev.resource?.tipo;
        const data = ev.resource?.data;

        if (tipo === 'tarea' && data?.status === 'completed') {
            return false; 
        }

        if (view === Views.AGENDA) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return (ev.end || ev.start) >= today;
        }

        return true;
    });

    const eventPropGetter = (event) => {
        const tipo = event.resource?.tipo;
        let style = {};

        if (tipo === 'tarea') style = { backgroundColor: '#3788d8', border: 'none' };
        if (tipo === 'garantia') style = { backgroundColor: '#e74c3c', border: 'none' }; 
        if (tipo === 'reserva') style = { backgroundColor: '#F57F17', border: 'none' };

        return { style };
    };

    // Toolbar Personalizada (CustomToolbar)
    const CustomToolbar = (props) => {
        const { label, onNavigate, onView, view } = props;
        return (
            <div className="rbc-toolbar">
                <span className="rbc-btn-group">
                    <button type="button" onClick={() => onNavigate('TODAY')}>Hoy</button>
                    <button type="button" onClick={() => onNavigate('PREV')}>Anterior</button>
                    <button type="button" onClick={() => onNavigate('NEXT')}>Siguiente</button>
                </span>
                <span className="rbc-toolbar-label">{label}</span>
                <span className="rbc-btn-group">
                    <button type="button" className={view === 'month' ? 'rbc-active' : ''} onClick={() => onView('month')}>Mes</button>
                    <button type="button" className={view === 'week' ? 'rbc-active' : ''} onClick={() => onView('week')}>Semana</button>
                    <button type="button" className={view === 'day' ? 'rbc-active' : ''} onClick={() => onView('day')}>Día</button>
                    <button type="button" className={view === 'agenda' ? 'rbc-active' : ''} onClick={() => onView('agenda')}>Agenda</button>
                </span>
            </div>
        );
    };

    if (loading) return <div className="calendario-loading">Cargando calendario...</div>;
    if (connectionError) return <div className="alert-error" style={{margin:'20px'}}>{connectionError}</div>;

    return (
        <div className="calendario-page calendario-isolated-scope">
            <header className="calendario-header">
                <h2>Calendario de Eventos</h2>
            </header>
            
            <div className="calendario-card">
                <Calendar
                    localizer={localizer}
                    events={eventsFiltered}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 650 }}
                    culture='es'
                    views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                    selectable
                    onSelectSlot={(slotInfo) => { setDate(slotInfo.start); setView(Views.DAY); }}
                    onSelectEvent={handleSelectEvent}
                    eventPropGetter={eventPropGetter}
                    date={date}
                    view={view}
                    onNavigate={onNavigate}
                    onView={onView}
                    components={{ toolbar: CustomToolbar }}
                    messages={{
                        month: "Mes", week: "Semana", day: "Día", agenda: "Agenda",
                        date: "Fecha", time: "Hora", event: "Evento",
                        noEventsInRange: "No hay eventos en este rango.",
                        showMore: total => `+ Ver más (${total})`
                    }}
                />
            </div>
            
            {/* Modal de Detalle de Evento */}
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={handleCloseModal} // Usamos el nuevo handler de cierre
                contentLabel="Detalles del Evento"
                className="modal-content"
                overlayClassName="modal-overlay"
            >
                {selectedEvent && (
                    <div className="modal-body">
                        <h3>{selectedEvent.title}</h3>
                        
                        {/* Lógica de Garantía (SOLO GARANTIA - Como fue solicitado) */}
                        {selectedEvent.resource.tipo === 'garantia' && (
                            // 🛑 Aplicamos estilos dinámicos para forzar el color y la opacidad 1
                            <div style={getForcedTextStyle()}> 
                                <p><strong>Tipo:</strong> <span className="tag-garantia">Fin de Garantía</span></p>
                                <p><strong>Equipo:</strong> {selectedEvent.resource.data.marca} {selectedEvent.resource.data.modelo}</p>
                                <p><strong>Nro. Serie:</strong> {selectedEvent.resource.data.nro_serie}</p>
                                <p><strong>Fecha Fin Garantía:</strong> {format(selectedEvent.start, 'dd-MM-yyyy')}</p>
                            </div>
                        )}
                        
                        {/* Lógica de Reserva */}
                        {selectedEvent.resource.tipo === 'reserva' && (
                            <div style={getForcedTextStyle()}>
                                <p><strong>Tipo:</strong> <span className="tag-reserva">Reserva</span></p>
                                <p><strong>Equipo:</strong> {selectedEvent.resource.data.equipo_data.marca} {selectedEvent.resource.data.equipo_data.modelo}</p>
                                <p><strong>Solicitante:</strong> {selectedEvent.resource.data.usuario_data.username}</p>
                                <p><strong>Motivo:</strong> {selectedEvent.resource.data.motivo}</p>
                                <p><strong>Inicio:</strong> {format(selectedEvent.start, 'dd-MM-yyyy HH:mm')}</p>
                                <p><strong>Fin:</strong> {format(selectedEvent.end, 'dd-MM-yyyy HH:mm')}</p>
                            </div>
                        )}

                        {/* Lógica de Tarea */}
                        {selectedEvent.resource.tipo === 'tarea' && (
                             <div style={getForcedTextStyle()}>
                                <p><strong>Tipo:</strong> <span className="tag-tarea">Tarea</span></p>
                                <p><strong>Título:</strong> {selectedEvent.title.replace('Tarea: ', '')}</p> 
                                <p><strong>Asignado a:</strong> {selectedEvent.resource.data.assigned_user_id}</p>
                                <p><strong>Descripción:</strong> {selectedEvent.resource.data.description}</p>
                                {/* Formato de fecha para Tarea */}
                                <p><strong>Vencimiento:</strong> {selectedEvent.resource.data.due_date ? format(new Date(selectedEvent.resource.data.due_date), 'dd-MM-yyyy') : 'N/A'}</p>
                            </div>
                        )}
                        
                        <button className="btn-modal-close" onClick={handleCloseModal}>Cerrar</button>
                    </div>
                )}
            </Modal>
        </div>
    );
};