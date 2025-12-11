import React, { useState, useEffect } from 'react';
import api from '../api';
import { useOutletContext } from 'react-router-dom'; 
import { PlusCircle, CheckCircleFill, Clock, Person, ExclamationCircle, CheckCircle } from 'react-bootstrap-icons'; 
import format from 'date-fns/format';
import { es } from 'date-fns/locale';

import './Menu.css';
import './CreateTaskModal.css';

// --- MODAL DE CREACIÓN DE TAREA (Asegura envío con 'title' y 'description') ---
const CreateTaskModal = ({ isVisible, onClose, onCreate, currentUser }) => { 
    const [formData, setFormData] = useState({
        title: '', description: '', due_date: '', due_time: '', is_important: false,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        if (!currentUser || !currentUser.id) { 
            setError("Error: Usuario no identificado. Recarga la página.");
            setLoading(false);
            return;
        }
        
        const token = localStorage.getItem('authToken');
        const due_datetime = (formData.due_date && formData.due_time) 
            ? `${formData.due_date}T${formData.due_time}` : null;
            
        const dataToSend = {
            // CORRECCIÓN FINAL para el error 400: Usamos 'title' y 'description' que pide el Serializer
            title: formData.title,
            description: formData.description,
            is_important: formData.is_important,
            assigned_user_id: currentUser.id, 
            status: 'pending',
            due_datetime,
        };

        try {
            const response = await api.post('/api/tareas/create/', dataToSend, {
                headers: { 'Authorization': `Token ${token}` }
            });
            onCreate(response.data); 
            onClose();
        } catch (err) {
            console.error("Error al crear tarea:", err.response?.data);
            const msg = err.response?.data?.title?.[0] || 'Error desconocido al crear la tarea. Verifica tus datos.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="task-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Nueva Tarea</h3>
                    <button onClick={onClose} className="close-modal">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    {error && <p className="error-msg">{error}</p>}
                    <div className="form-group">
                        <label>Título *</label>
                        <input type="text" name="title" onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Descripción</label>
                        <textarea name="description" onChange={handleChange} />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Fecha Límite</label>
                            <input type="date" name="due_date" onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Hora</label>
                            <input type="time" name="due_time" onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-group checkbox-group">
                        <input type="checkbox" id="is_important" name="is_important" onChange={handleChange} />
                        <label htmlFor="is_important">Marcar como Importante</label>
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Creando...' : 'Crear Tarea'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL: TABLERO ---
const Menu = () => { // Ya no es 'export const Menu'
    const { user: currentUser } = useOutletContext() || {}; 
    
    const [tasks, setTasks] = useState([]); 
    const [users, setUsers] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const isAdmin = currentUser?.es_admin || false; 

    const normalizeData = (response) => {
        if (Array.isArray(response.data)) return response.data;
        if (response.data && Array.isArray(response.data.results)) return response.data.results;
        return [];
    };

    // --- FILTROS Y ORDENAMIENTO ---
    const pendingTasks = tasks.filter(t => t.status === 'pending' && !t.is_important);
    const importantTasks = tasks.filter(t => t.status === 'pending' && t.is_important);
    
    const completedTasks = tasks
        .filter(t => t.status === 'completed')
        .sort((a, b) => {
            const fechaA = new Date(a.completed_at || 0);
            const fechaB = new Date(b.completed_at || 0);
            return fechaB - fechaA; 
        })
        .slice(0, 5);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const config = { headers: { 'Authorization': `Token ${token}` } };
        
        const fetchData = async () => {
            try {
                const results = await Promise.allSettled([
                    api.get('/api/tareas/', config),
                    api.get('/api/usuarios/', config),
                ]);

                if (results[0].status === 'fulfilled') setTasks(normalizeData(results[0].value));
                if (results[1].status === 'fulfilled') setUsers(normalizeData(results[1].value));

            } catch (err) {
                console.error("Error cargando tablero", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCompleteTask = async (taskId) => {
        const token = localStorage.getItem('authToken');
        try {
            const response = await api.patch(`/api/tareas/${taskId}/complete/`, {}, {
                headers: { 'Authorization': `Token ${token}` }
            });
            // Reemplaza la tarea completada con la respuesta actualizada
            setTasks(prev => prev.map(t => t.id === taskId ? response.data : t));
        } catch (err) { console.error(err); }
    };

    const renderTaskCard = (task) => {
        // Usa la lógica robusta de búsqueda de título/descripción
        const taskTitle = task.titulo || task.title || task.nombre || 'Sin título';
        const taskDescription = task.descripcion || task.description || 'Sin descripción'; 
        
        const assignedUser = users.find(u => u.id == task.assigned_user_id);
        const canComplete = (currentUser && task.assigned_user_id == currentUser.id) || (currentUser?.es_admin);
        const isOverdue = task.due_datetime && new Date(task.due_datetime) < new Date() && task.status !== 'completed';

        return (
            <div key={task.id} className={`menu-card ${isOverdue ? 'overdue' : ''} ${task.status === 'completed' ? 'done-card' : ''}`}>
                <div className="card-header">
                    <span className={`card-tag ${task.status === 'completed' ? 'tag-done' : (task.is_important ? 'tag-urgent' : 'tag-pending')}`}>
                        {task.status === 'completed' ? <><CheckCircle/> HECHO</> : (task.is_important ? <><ExclamationCircle/> URGENTE</> : <><Clock/> PENDIENTE</>)}
                    </span>
                </div>
                
                <h4 className="task-title">{taskTitle}</h4>
                <p className="task-description">{taskDescription || 'Sin descripción'}</p>

                <div className="card-footer">
                    <div className="footer-meta">
                        <span className="meta-item"><Person/> {assignedUser ? assignedUser.username : '...'}</span>
                        <span className="meta-item time">
                            {task.due_datetime ? format(new Date(task.due_datetime), 'dd/MM HH:mm', { locale: es }) : ''}
                        </span>
                    </div>

                    {canComplete && task.status !== 'completed' && (
                        <button className="btn-terminate" onClick={() => handleCompleteTask(task.id)}>
                            Marcar como Lista
                        </button>
                    )}
                </div>
            </div>
        );
    };

    if (loading) return <div className="menu-loading">Cargando Tablero...</div>;

    return (
        <div className="menu-page menu-isolated-scope">
            <header className="menu-header">
                <div className="header-content">
                    <h2>Tablero de Trabajo</h2>
                    <p>Gestiona tus tareas y prioridades del día.</p>
                </div>
                {isAdmin && (
                    <button onClick={() => setIsModalOpen(true)} className="btn-new-task">
                        <PlusCircle className="icon-plus" style={{marginRight:6}}/> Nueva Tarea
                    </button>
                )}
            </header>
            
            <div className="menu-columns-container">
                {/* COLUMNA 1: POR HACER */}
                <div className="menu-column col-todo">
                    <div className="col-header header-todo">
                        <h3>Por Hacer</h3>
                        <span className="badge-count">{pendingTasks.length}</span>
                    </div>
                    <div className="cards-list">
                        {pendingTasks.map(renderTaskCard)}
                        {pendingTasks.length === 0 && <div className="empty-zone">No hay tareas pendientes.</div>}
                    </div>
                </div>

                {/* COLUMNA 2: IMPORTANTE */}
                <div className="menu-column col-urgent">
                    <div className="col-header header-urgent">
                        <h3>Importante</h3>
                        <span className="badge-count">{importantTasks.length}</span>
                    </div>
                    <div className="cards-list">
                        {importantTasks.map(renderTaskCard)}
                        {importantTasks.length === 0 && <div className="empty-zone">Todo bajo control.</div>}
                    </div>
                </div>

                {/* COLUMNA 3: COMPLETADAS */}
                <div className="menu-column col-done">
                    <div className="col-header header-done">
                        <h3>Completadas (Recientes)</h3>
                        <span className="badge-count">{completedTasks.length}</span>
                    </div>
                    <div className="cards-list">
                        {completedTasks.map(renderTaskCard)}
                    </div>
                </div>
            </div>

            <CreateTaskModal 
                isVisible={isModalOpen} onClose={() => setIsModalOpen(false)} 
                onCreate={(newTask) => setTasks(prev => [newTask, ...prev])} 
                currentUser={currentUser} 
            />
        </div>
    );
};

// --- CORRECCIÓN CLAVE: Exportación por defecto para evitar el SyntaxError ---
export default Menu;