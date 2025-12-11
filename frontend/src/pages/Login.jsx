import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // <--- Importamos useLocation
import api from '../api';
import './Login.css';

const logoCoyahue = '/slidelogo.png';

export const Login = () => {
    const [correo, setCorreo] = useState('');
    const [contraseña, setContraseña] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate(); 
    const location = useLocation(); // <--- Inicializamos useLocation

    // Determina a dónde debe ir el usuario después del login.
    // Si viene de una ruta protegida (como la del QR), usa esa ruta. Si no, usa '/menu'.
    const from = location.state?.from?.pathname || "/menu";
    const search = location.state?.from?.search || ""; // Captura el query string (?layout=qr)

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await api.post('/api/login/', {
                correo: correo.trim(),
                contraseña: contraseña
            });

            if (response.data.token) {
                localStorage.setItem('authToken', response.data.token); 
                
                // --- REDIRECCIÓN CORREGIDA ---
                // Redirige a la ruta original completa (ej: /inventario/ficha/123?layout=qr)
                navigate(`${from}${search}`, { replace: true }); 
                // ------------------------------
            }

        } catch (err) {
            setError(err?.response?.data?.error || 'Error al Iniciar Sesion. Comprueba tus datos.');
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-layout">
                
                {/* --- LADO DEL FORMULARIO --- */}
                <div className="login-form-container">
                    <form onSubmit={handleLogin}>
                        <h2>Log In</h2>
                        
                        <div className="form-group">
                            <label htmlFor="correo">Usuario o Correo</label>
                            <input 
                                type="text" 
                                id="correo"
                                placeholder="usuario o correo"
                                value={correo}
                                onChange={(e) => setCorreo(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="contraseña">Contraseña</label>
                            <input 
                                type="password" 
                                id="contraseña"
                                placeholder="Placeholder"
                                value={contraseña}
                                onChange={(e) => setContraseña(e.target.value)}
                                required
                            />
                            <p className="password-note">Contraseña de minimo 8 caracteres.</p>
                        </div>

                        <button type="submit" className="login-button">Log In</button>

                        {error && <p className="login-error">{error}</p>}
                    
                        <div className="login-logo-mobile">
                            <img src={logoCoyahue} alt="Grupo Coyahue" />
                        </div>
                    </form>
                </div>

                {/* --- LADO DEL LOGO (ESCRITORIO) --- */}
                <div className="login-logo-container">
                    <img src={logoCoyahue} alt="Grupo Coyahue" />
                </div>

            </div>
        </div>
    );
};
