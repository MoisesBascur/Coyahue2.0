import React from 'react';
import { Download, XCircle } from 'react-bootstrap-icons'; 

const QRGeneratorModal = ({ show, onClose, equipment }) => {
    if (!show || !equipment) return null;

    // 1. GENERAR LA URL DEL QR (AÑADIMOS ?layout=qr)
    const baseUrl = window.location.origin; 
    // Añadir el parámetro de consulta para que el Layout sepa que debe ocultar el Sidebar
    const dataParaQR = `${baseUrl}/inventario/ficha/${equipment.id}?layout=qr`;
    
    // API para generar imagen QR
    const qrImageUrl = `https://https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(dataParaQR)}`;

    // 2. FUNCIÓN DE DESCARGA
    const downloadQR = async () => {
        try {
            const image = await fetch(qrImageUrl);
            const imageBlog = await image.blob();
            const imageURL = URL.createObjectURL(imageBlog);

            const link = document.createElement('a');
            link.href = imageURL;
            link.download = `QR_${equipment.nro_serie || 'equipo'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error descargando QR", error);
            alert("No se pudo descargar automáticamente. Haz click derecho en la imagen y 'Guardar como'.");
        }
    };

    // Estilos del Modal
    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)', 
        display: 'flex', justifyContent: 'center', alignItems: 'center', 
        zIndex: 1100, backdropFilter: 'blur(2px)'
    };

    const modalStyle = {
        backgroundColor: 'var(--bg-card, #fff)',
        color: 'var(--text-primary, #333)',
        padding: '30px', borderRadius: '12px',
        width: '90%', maxWidth: '350px',
        textAlign: 'center', position: 'relative',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
    };

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                
                <button 
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: 10, right: 10,
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-secondary, #666)'
                    }}
                >
                    <XCircle size={24} />
                </button>

                <h3 style={{marginTop: 0, marginBottom: '5px'}}>Código QR</h3>
                <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '15px'}}>
                    {equipment.marca} {equipment.modelo} <br/>
                    <strong>S/N: {equipment.nro_serie}</strong>
                </p>

                <div style={{ background: 'white', padding: '10px', borderRadius: '8px', display: 'inline-block', border: '1px solid #eee' }}>
                    <img 
                        src={qrImageUrl} 
                        alt="Código QR" 
                        style={{ display: 'block', width: '200px', height: '200px' }}
                    />
                </div>

                <p style={{fontSize: '0.8rem', color: '#999', margin: '15px 0'}}>
                    Escanea para ver la ficha técnica
                </p>

                <button 
                    onClick={downloadQR}
                    style={{
                        backgroundColor: '#ff8c00', color: 'white', 
                        border: 'none', padding: '10px 20px', 
                        borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        width: '100%'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Download size={18} /> <span>Descargar PNG</span>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default QRGeneratorModal;