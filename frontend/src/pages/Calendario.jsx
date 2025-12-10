import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es';
import api from '../api';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendario.css'; // Usaremos el nuevo CSS

const locales = { 'es': es };

const localizer = dateFnsLocalizer({
    format, parse, startOfWeek, getDay, locales,
});

export const Calendario = () => {
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState(Views.MONTH); 

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('authToken');
            try {
                const results = await Promise.allSettled([
                    api.get('/api/reservas/', { headers: { 'Authorization': `Token ${token}` } }),
                    api.get('/api/tareas/', { headers: { 'Authorization': `Token ${token}` } }),
                    api.get('/api/actividades/', { headers: { 'Authorization': `Token ${token}` } }),
                    api.get('/api/equipos/?page_size=1000', { headers: { 'Authorization': `Token ${token}` } }),
                ]);

                const normalize = (resp) => Array.isArray(resp.data) ? resp.data : (Array.isArray(resp.data?.results) ? resp.data.results : []);

                const reservasData = results[0].status === 'fulfilled' ? normalize(results[0].value) : [];
                const tareasData = results[1].status === 'fulfilled' ? normalize(results[1].value) : [];
                const actividadesData = results[2].status === 'fulfilled' ? normalize(results[2].value) : [];
                const equiposData = results[3].status === 'fulfilled' ? normalize(results[3].value) : [];

                // Mapeo Reservas
                const reservasEventos = reservasData.map(reserva => ({
                    title: `${reserva.equipo_data.marca} ${reserva.equipo_data.modelo} - ${reserva.usuario_data.username}`,
                    start: new Date(reserva.fecha_inicio),
                    end: new Date(reserva.fecha_fin),
                    allDay: true,
                    resource: { tipo: 'reserva', data: reserva }
                }));

                // Mapeo Tareas
                const tareasEventos = tareasData.map(task => {
                    if (task.due_datetime) {
                        const start = new Date(task.due_datetime);
                        const end = new Date(start.getTime() + 60 * 60 * 1000);
                        return {
                            title: `Tarea: ${task.title}`,
                            start, end, allDay: false,
                            resource: { tipo: 'tarea', data: task }
                        };
                    }
                    if (task.due_date) {
                        const start = new Date(`${task.due_date}T${task.due_time || '09:00:00'}`);
                        const end = new Date(start.getTime() + 60 * 60 * 1000);
                        return {
                            title: `Tarea: ${task.title}`,
                            start, end, allDay: false,
                            resource: { tipo: 'tarea', data: task }
                        };
                    }
                    return null;
                }).filter(Boolean);

                // Mapeo Actividades
                const actividadesEventos = actividadesData
                    .filter(a => a.tipo === 'notificacion' && a.due_datetime)
                    .map(a => {
                        const start = new Date(a.due_datetime);
                        const end = new Date(start.getTime() + 60 * 60 * 1000);
                        return {
                            title: a.titulo,
                            start, end, allDay: false,
                            resource: { tipo: 'actividad', data: a }
                        };
                    });

                // Mapeo Garantías
                const garantiasEventos = equiposData
                    .filter(eq => eq.warranty_end_date) 
                    .map(eq => {
                        const start = new Date(`${eq.warranty_end_date}T09:00:00`); 
                        return {
                            title: `Fin Garantía: ${eq.marca} ${eq.modelo} (${eq.nro_serie})`,
                            start: start, end: start, allDay: true,
                            resource: { tipo: 'garantia', data: eq }
                        };
                    });

                setEventos([...reservasEventos, ...tareasEventos, ...actividadesEventos, ...garantiasEventos]);

            } catch (err) {
                console.error("Error cargando calendario:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const onNavigate = useCallback((newDate) => setDate(newDate), [setDate]);
    const onView = useCallback((newView) => setView(newView), [setView]);

    // Filtrado
    const now = new Date();
    const eventsFiltered = eventos.filter(ev => {
        const tipo = ev.resource?.tipo;
        if (tipo === 'tarea') {
            const t = ev.resource?.data;
            if (t?.status === 'completed') return false; // Ocultar completadas
            return true;
        }
        if (view === Views.AGENDA && tipo === 'actividad') {
            return (ev.end || ev.start) >= now;
        }
        return true;
    });

    const eventPropGetter = (event) => {
        const tipo = event.resource?.tipo;
        let style = {};

        if (tipo === 'tarea') style = { backgroundColor: '#3788d8', border: 'none' };
        if (tipo === 'garantia' || (tipo === 'actividad' && event.title.startsWith('Fin'))) {
            style = { backgroundColor: '#e74c3c', border: 'none' };
        }
        if (tipo === 'reserva') style = { backgroundColor: '#F57F17', border: 'none' };

        return { style };
    };

    // Toolbar Personalizada
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

    return (
        /* CLASE CLAVE: calendario-isolated-scope */
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
        </div>
    );
};