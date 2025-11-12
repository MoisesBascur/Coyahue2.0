import React from 'react';
import './Menu.css'; // Sigue usando el mismo CSS

export const Menu = () => {
    return (
        <>
            {/* --- Contenido Principal --- */}
            <header className="main-header">
                <h1>Menu</h1>
                <input type="search" placeholder="Search" className="main-searchbar" />
            </header>
            
            <div className="menu-columns-container">
                {/* Columna 1: Tareas */}
                <div className="menu-column">
                    {/* ... tu contenido de Tareas ... */}
                </div>
                {/* Columna 2: Notificaciones */}
                <div className="menu-column">
                    {/* ... tu contenido de Notificaciones ... */}
                </div>
                {/* Columna 3: Noticias */}
                <div className="menu-column">
                    {/* ... tu contenido de Noticias ... */}
                </div>
            </div>
        </>
    );
};