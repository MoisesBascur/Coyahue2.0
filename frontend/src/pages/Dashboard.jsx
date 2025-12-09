import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { ExclamationTriangleFill } from 'react-bootstrap-icons'; 
import './Dashboard.css'; 

ChartJS.register(ArcElement, Tooltip, Legend);

export const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // KPIs Generales
    const [kpis, setKpis] = useState({ 
        total_equipos: 0, 
        total_usuarios: 0, 
        equipos_sin_uso: 0,
        total_insumos: 0
    });

    // Datos para los Gráficos
    const [usoData, setUsoData] = useState(null);
    const [stockData, setStockData] = useState(null);
    const [insumoData, setInsumoData] = useState(null);

    const [insumosCriticos, setInsumosCriticos] = useState([]);

    // Opciones del gráfico (para que la leyenda se vea bien en oscuro)
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                position: 'right',
                labels: {
                    color: '#888', // Color adaptable (se puede mejorar con CSS pero ChartJS es canvas)
                    font: { size: 11 }
                }
            }
        }
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem('authToken');
            const config = { headers: { 'Authorization': `Token ${token}` } };

            try {
                const [dashboardRes, insumosRes] = await Promise.allSettled([
                    axios.get('http://127.0.0.1:8000/api/dashboard/', config),
                    axios.get('http://127.0.0.1:8000/api/insumos/', config)
                ]);

                if (dashboardRes.status !== 'fulfilled') {
                    throw dashboardRes.reason;
                }

                const data = dashboardRes.value.data;
                const listaInsumos = insumosRes.status === 'fulfilled'
                    ? (Array.isArray(insumosRes.value.data) ? insumosRes.value.data : insumosRes.value.data.results || [])
                    : [];

                // 1. KPIs
                setKpis({
                    ...data.kpis,
                    total_insumos: listaInsumos.length
                });

                // 2. Alertas Insumos
                const criticos = listaInsumos.filter(i => i.stock_actual <= (i.stock_minimo || 5));
                setInsumosCriticos(criticos);

                // 3. Gráfico Equipos en Uso
                setUsoData({
                    labels: ['En Uso', 'Sin Uso'],
                    datasets: [{
                        data: [data.grafico_equipos_uso.en_uso, data.grafico_equipos_uso.sin_uso],
                        backgroundColor: ['#F57F17', '#37474F'],
                        borderWidth: 0,
                    }]
                });

                // 4. Gráfico Stock General
                setStockData({
                    labels: data.grafico_stock_general.map(item => item.tipo),
                    datasets: [{
                        data: data.grafico_stock_general.map(item => item.cantidad),
                        backgroundColor: ['#1E88E5', '#43A047', '#FFB300', '#7E57C2', '#e74c3c'],
                        borderWidth: 0,
                    }]
                });

                // 5. Gráfico Insumos (Top 6)
                const topInsumos = listaInsumos.slice(0, 6);
                if (topInsumos.length > 0) {
                    setInsumoData({
                        labels: topInsumos.map(i => i.nombre),
                        datasets: [{
                            label: 'Stock',
                            data: topInsumos.map(i => i.stock_actual),
                            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
                            borderWidth: 0,
                        }]
                    });
                } else {
                    setInsumoData(null);
                }

                setLoading(false);
            } catch (err) {
                console.error("Error cargando dashboard:", err);
                setError('No se pudieron cargar los datos del sistema.');
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return <div className="dashboard-loading">Cargando métricas...</div>;
    if (error) return <div className="dashboard-error">{error}</div>;

    return (
        /* CLASE CLAVE: dashboard-isolated-scope */
        <div className="dashboard-page dashboard-isolated-scope">
            
            <header className="dashboard-header">
                <h1>Panel de Control</h1>
                <p>Resumen general del estado del inventario y usuarios.</p>
            </header>

            {/* --- ALERTAS --- */}
            {insumosCriticos.length > 0 && (
                <div className="alert-box warning">
                    <ExclamationTriangleFill size={24} className="alert-icon" />
                    <div>
                        <strong>Atención:</strong> Hay {insumosCriticos.length} insumos con stock crítico.
                    </div>
                </div>
            )}

            {/* --- TARJETAS KPI --- */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <h2>{kpis.total_equipos}</h2>
                    <p>Equipos Totales</p>
                    <div className="kpi-icon-bg">💻</div>
                </div>
                <div className="kpi-card">
                    <h2>{kpis.total_usuarios}</h2>
                    <p>Usuarios</p>
                    <div className="kpi-icon-bg">👥</div>
                </div>
                <div className="kpi-card kpi-alert">
                    <h2>{kpis.equipos_sin_uso}</h2>
                    <p>Equipos Sin Uso</p>
                    <div className="kpi-icon-bg">📦</div>
                </div>
                <div className="kpi-card">
                    <h2>{kpis.total_insumos}</h2>
                    <p>Tipos de Insumos</p>
                    <div className="kpi-icon-bg">🔧</div>
                </div>
            </div>

            {/* --- GRÁFICOS --- */}
            <h3 className="section-title">Análisis Gráfico</h3>
            <div className="charts-grid">
                <div className="chart-card">
                    <h4>Estado de Equipos</h4>
                    <div className="chart-wrapper">
                        {usoData && <Doughnut data={usoData} options={chartOptions} />}
                    </div>
                </div>

                <div className="chart-card">
                    <h4>Distribución por Tipo</h4>
                    <div className="chart-wrapper">
                        {stockData && <Doughnut data={stockData} options={chartOptions} />}
                    </div>
                </div>

                <div className="chart-card">
                    <h4>Stock de Insumos (Top 6)</h4>
                    <div className="chart-wrapper">
                        {insumoData ? (
                            <Doughnut data={insumoData} options={chartOptions} />
                        ) : (
                            <p className="no-data">Sin datos de insumos</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};