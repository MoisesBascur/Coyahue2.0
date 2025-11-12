import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es'; // Idioma español
import axios from 'axios';
import 'react-big-calendar/lib/css/react-big-calendar.css'; // Estilos por defecto
import './Calendario.css'; // Nuestros estilos personalizados

const locales = {
    'es': es,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

export const Calendario = () => {
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReservas = async () => {
            const token = localStorage.getItem('authToken');
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/reservas/', {
                    headers: { 'Authorization': `Token ${token}` }
                });
                
                // Transformar datos de la API al formato del calendario
                const eventosFormateados = response.data.map(reserva => ({
                    title: `${reserva.equipo_data.marca} ${reserva.equipo_data.modelo} - ${reserva.usuario_data.username}`,
                    start: new Date(reserva.fecha_inicio),
                    end: new Date(reserva.fecha_fin),
                    allDay: false,
                    resource: reserva
                }));

                setEventos(eventosFormateados);
                setLoading(false);
            } catch (err) {
                console.error("Error cargando reservas:", err);
                setLoading(false);
            }
        };
        fetchReservas();
    }, []);

    if (loading) return <p>Cargando calendario...</p>;

    return (
        <div className="calendario-page">
            <header className="main-header">
                <h1>Calendario de Reservas</h1>
                {/* Aquí podrías poner un botón para "Nueva Reserva" */}
            </header>
            
            <div className="calendario-container">
                <Calendar
                    localizer={localizer}
                    events={eventos}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 600 }}
                    culture='es'
                    messages={{
                        next: "Sig",
                        previous: "Ant",
                        today: "Hoy",
                        month: "Mes",
                        week: "Semana",
                        day: "Día"
                    }}
                />
            </div>
        </div>
    );
};