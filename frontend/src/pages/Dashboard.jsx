import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Doughnut } from 'react-chartjs-2'; // 1. Importa el gráfico de Dona
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js'; // 2. Elementos necesarios de Chart.js
import './Dashboard.css'; // Crearemos este CSS

// 3. Registra los elementos que usará Chart.js
Chart.register(ArcElement, Tooltip, Legend);

export const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [kpis, setKpis] = useState({ total_equipos: 0, total_usuarios: 0, equipos_sin_uso: 0 });
    const [usoData, setUsoData] = useState(null);
    const [stockData, setStockData] = useState(null);

    // Opciones comunes para los gráficos
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
            }
        }
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem('authToken');
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/dashboard/', {
                    headers: { 'Authorization': `Token ${token}` }
                });
                
                const data = response.data;
                
                // 1. Setea los KPIs
                setKpis(data.kpis);

                // 2. Configura los datos para el gráfico "Equipos en Uso"
                setUsoData({
                    labels: ['En Uso', 'Sin Uso'],
                    datasets: [{
                        data: [data.grafico_equipos_uso.en_uso, data.grafico_equipos_uso.sin_uso],
                        backgroundColor: ['#F57F17', '#37474F'], // Naranja y Gris Oscuro
                        borderColor: ['#ffffff', '#ffffff'],
                        borderWidth: 2,
                    }]
                });

                // 3. Configura los datos para el gráfico "Stock General"
                setStockData({
                    labels: data.grafico_stock_general.map(item => item.tipo),
                    datasets: [{
                        data: data.grafico_stock_general.map(item => item.cantidad),
                        backgroundColor: ['#1E88E5', '#43A047', '#FFB300', '#7E57C2'], // Colores variados
                        borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                        borderWidth: 2,
                    }]
                });

                setLoading(false);
            } catch (err) {
                console.error("Error cargando el dashboard:", err);
                setError('No se pudieron cargar los datos del dashboard.');
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return <p>Cargando dashboard...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <>
            <header className="main-header">
                <h1>Dashboard</h1>
            </header>

            {/* --- Sección de KPIs (Tarjetas) --- */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <h2>{kpis.total_equipos}</h2>
                    <p>Equipos Totales</p>
                </div>
                <div className="kpi-card">
                    <h2>{kpis.total_usuarios}</h2>
                    <p>Usuarios</p>
                </div>
                <div className="kpi-card">
                    <h2>{kpis.equipos_sin_uso}</h2>
                    <p>Equipos Sin Uso</p>
                </div>
            </div>

            {/* --- Sección de Gráficos --- */}
            <div className="charts-grid">
                <div className="chart-container">
                    <h3>Equipos en Uso</h3>
                    <div className="chart-wrapper">
                        {usoData && <Doughnut data={usoData} options={chartOptions} />}
                    </div>
                </div>
                <div className="chart-container">
                    <h3>Stock General</h3>
                    <div className="chart-wrapper">
                        {stockData && <Doughnut data={stockData} options={chartOptions} />}
                    </div>
                </div>
            </div>
        </>
    );
};