import React, { useState, useEffect } from 'react';
import api from '../api';
// Importamos los componentes Doughnut (anillo) y Bar (barra)
import { Doughnut, Bar } from 'react-chartjs-2'; 
import { 
    Chart as ChartJS, 
    ArcElement, 
    Tooltip, 
    Legend, 
    // Módulos necesarios para el Gráfico de Barras
    CategoryScale, 
    LinearScale, 
    BarElement, 
    Title 
} from 'chart.js';
import { ExclamationTriangleFill } from 'react-bootstrap-icons'; 
import './Dashboard.css'; 

// Registramos todos los elementos necesarios, incluyendo los de barras
ChartJS.register(
    ArcElement, 
    Tooltip, 
    Legend,
    CategoryScale, 
    LinearScale, 
    BarElement, 
    Title
);

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
    
    // --- ESTADO PARA PROVEEDORES ---
    const [proveedorData, setProveedorData] = useState(null); 
    
    // --- ESTADO PARA ADQUISICIONES ---
    const [adquisicionesData, setAdquisicionesData] = useState(null); 

    const [insumosCriticos, setInsumosCriticos] = useState([]);

    const defaultColors = [
        '#1E88E5', '#43A047', '#FFB300', '#7E57C2', '#e74c3c', '#00ACC1', '#C0CA33', '#F06292'
    ];
    
    // --- OPCIONES DOUGHNUT ---
    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                position: 'right',
                labels: {
                    color: '#888',
                    font: { size: 11 }
                }
            }
        }
    };

    // --- OPCIONES BARRAS (para Proveedores y Adquisiciones) ---
    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                position: 'right',
                labels: {
                    color: '#888',
                    font: { size: 11 }
                }
            },
            title: {
                display: false,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                stacked: true, 
                ticks: { color: '#888' },
                grid: { color: 'rgba(136, 136, 136, 0.2)' }
            },
            x: {
                stacked: true, 
                ticks: { color: '#888' },
                grid: { display: false }
            }
        }
    };


    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem('authToken');
            const config = { headers: { 'Authorization': `Token ${token}` } };

            try {
                const [dashboardRes, insumosRes] = await Promise.allSettled([
                    api.get('/api/dashboard/', config),
                    api.get('/api/insumos/', config)
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
                
                // 3. LÓGICA DE INSUMOS
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

                // 4. Gráfico Equipos en Uso
                setUsoData({
                    labels: ['En Uso', 'Sin Uso'],
                    datasets: [{
                        data: [data.grafico_equipos_uso.en_uso, data.grafico_equipos_uso.sin_uso],
                        backgroundColor: ['#F57F17', '#37474F'],
                        borderWidth: 0,
                    }]
                });

                // 5. Gráfico Stock General
                setStockData({
                    labels: data.grafico_stock_general.map(item => item.tipo),
                    datasets: [{
                        data: data.grafico_stock_general.map(item => item.cantidad),
                        backgroundColor: defaultColors.slice(0, data.grafico_stock_general.length),
                        borderWidth: 0,
                    }]
                });

                // --- 6. Gráfico de Proveedores (BARRA - CORREGIDO) ---
                if (data.grafico_proveedores && data.grafico_proveedores.length > 0) {
                    // Para el gráfico de barras simple (no apilado), usamos un solo dataset
                    // donde los colores se mapean a cada barra.
                    setProveedorData({
                        labels: data.grafico_proveedores.map(item => item.proveedor),
                        datasets: [{
                            label: 'Cantidad', // Etiqueta genérica para el dataset
                            data: data.grafico_proveedores.map(item => item.cantidad),
                            // Mapeamos los colores para que cada barra tenga un color distinto
                            backgroundColor: defaultColors.slice(0, data.grafico_proveedores.length),
                            borderColor: defaultColors.slice(0, data.grafico_proveedores.length).map(c => c + 'FF'),
                            borderWidth: 1,
                        }]
                    });
                } else {
                    setProveedorData(null);
                }
                // ----------------------------------------------------

                // 7. LÓGICA DEL NUEVO GRÁFICO DE ADQUISICIONES (BARRA APILADA)
                if (data.grafico_adquisiciones && data.grafico_adquisiciones.length > 0) {
                    const adquisiciones = data.grafico_adquisiciones;
                    
                    const allYears = [...new Set(adquisiciones.map(item => item.anio))].sort((a, b) => a - b);
                    const allProveedores = [...new Set(adquisiciones.map(item => item.proveedor))];

                    const datasets = allProveedores.map((proveedorName, index) => {
                        const proveedorData = adquisiciones.filter(item => item.proveedor === proveedorName);
                        
                        const counts = allYears.map(year => {
                            const entry = proveedorData.find(item => item.anio === year);
                            return entry ? entry.cantidad : 0;
                        });

                        const color = defaultColors[index % defaultColors.length]; 

                        return {
                            label: proveedorName,
                            data: counts,
                            backgroundColor: color, 
                            borderColor: color,
                            borderWidth: 1,
                        };
                    });

                    setAdquisicionesData({
                        labels: allYears.map(String), 
                        datasets: datasets,
                    });

                } else {
                    setAdquisicionesData(null);
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
                
                {/* 1. Equipos en Uso (DOUGHNUT) */}
                <div className="chart-card">
                    <h4>Estado de Equipos</h4>
                    <div className="chart-wrapper">
                        {usoData && <Doughnut data={usoData} options={doughnutOptions} />}
                    </div>
                </div>

                {/* 2. Distribución por Tipo (DOUGHNUT) */}
                <div className="chart-card">
                    <h4>Distribución por Tipo</h4>
                    <div className="chart-wrapper">
                        {stockData && <Doughnut data={stockData} options={doughnutOptions} />}
                    </div>
                </div>

                {/* 3. Distribución por Proveedor (BARRA - CORREGIDO) */}
                <div className="chart-card chart-bar">
                    <h4>Distribución por Proveedor</h4>
                    <div className="chart-wrapper">
                        {proveedorData ? (
                            // Renderizamos como BAR
                            <Bar data={proveedorData} options={barOptions} />
                        ) : (
                             <p className="no-data">Sin datos de proveedores</p>
                        )}
                    </div>
                </div>
                
                {/* 4. ADQUISICIONES POR AÑO (BARRA APILADA) */}
                <div className="chart-card chart-bar">
                    <h4>Adquisiciones por Año y Proveedor</h4>
                    <div className="chart-wrapper">
                        {adquisicionesData ? (
                            <Bar data={adquisicionesData} options={barOptions} />
                        ) : (
                             <p className="no-data">Sin datos históricos de adquisición.</p>
                        )}
                    </div>
                </div>
                
                {/* 5. STOCK DE INSUMOS (REINSTALADO) */}
                <div className="chart-card">
                    <h4>Stock de Insumos (Top 6)</h4>
                    <div className="chart-wrapper">
                        {insumoData ? (
                            <Doughnut data={insumoData} options={doughnutOptions} />
                        ) : (
                            <p className="no-data">Sin datos de insumos</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};