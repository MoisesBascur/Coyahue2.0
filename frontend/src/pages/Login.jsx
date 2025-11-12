import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Importamos el hook de redirección
import axios from 'axios'; // 2. Importamos axios para llamar a la API
import './Login.css';

// 3. Usamos la ruta desde la carpeta 'public' 
// (Asegúrate que tu logo esté en 'frontend/public/logo-coyahue.png' o ajusta la ruta)
const logoCoyahue = '/public/slidelogo.png'; 

export const Login = () => {
    const [correo, setCorreo] = useState('');
    const [contraseña, setContraseña] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate(); // 4. Inicializamos el hook

    const handleLogin = async (e) => { // 5. Hacemos la función 'async'
        e.preventDefault();
        setError('');

        try {
            // 6. ¡Llamada real a la API de Django!
            // Asegúrate de que tu backend (Django) esté corriendo en el puerto 8000
            const response = await axios.post('http://127.0.0.1:8000/api/login/', {
                correo: correo,
                contraseña: contraseña
            });

            // 7. Si la API responde bien, guardamos el token y redirigimos
            if (response.data.token) {
                localStorage.setItem('authToken', response.data.token); // Guardamos el token en el navegador
                navigate('/menu'); // <-- ¡Redirección al Menú!
            }

        } catch (err) {
            // 8. Si la API da error (ej. 401 Unauthorized)
            setError('Error al Iniciar Sesion. Comprueba tus datos.');
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
                            <label htmlFor="correo">Correo</label>
                            <input 
                                type="email" 
                                id="correo"
                                placeholder="Placeholder"
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