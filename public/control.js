// control.js - Versión corregida
const socket = io();
let canciones = [];
let cancionActual = 0;
let lineaActual = 0;

// Elementos DOM
const currentSongEl = document.getElementById('currentSong');
const currentLineEl = document.getElementById('currentLine');
const progressEl = document.getElementById('progress');
const percentageEl = document.getElementById('percentage');
const progressFill = document.getElementById('progressFill');
const songListEl = document.getElementById('songList');
const connectionStatus = document.getElementById('connectionStatus');
const searchInput = document.getElementById('searchSongs');
const songCountEl = document.getElementById('songCount');

// Botones
document.getElementById('btnPrev').onclick = () => {
    socket.emit('anterior-linea');
    showToast('◀ Línea anterior');
};

document.getElementById('btnNext').onclick = () => {
    socket.emit('siguiente-linea');
    showToast('▶ Línea siguiente');
};

document.getElementById('btnCoro').onclick = () => {
    socket.emit('ir-al-coro');
    showToast('🎵 Saltando al coro');
};

document.getElementById('btnReset').onclick = () => {
    socket.emit('reset');
    showToast('⟳ Canción reiniciada');
};

// Atajos de teclado
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowLeft': 
            document.getElementById('btnPrev').click();
            break;
        case 'ArrowRight': 
            document.getElementById('btnNext').click();
            break;
        case 'c':
        case 'C': 
            document.getElementById('btnCoro').click();
            break;
        case 'r':
        case 'R': 
            document.getElementById('btnReset').click();
            break;
    }
});

// Búsqueda en tiempo real
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        renderizarLista(searchTerm);
    });
}

// Socket events
socket.on('estado-inicial', (estado) => {
    console.log('Estado inicial recibido:', estado);
    canciones = estado.canciones;
    cancionActual = estado.cancionActual;
    lineaActual = estado.lineaActual;
    
    actualizarUI();
    renderizarLista();
    updateConnectionStatus(true);
    
    if (songCountEl) {
        songCountEl.textContent = `${canciones.length} ${canciones.length === 1 ? 'canción' : 'canciones'}`;
    }
});

socket.on('actualizar-estado', (estado) => {
    console.log('Estado actualizado:', estado);
    canciones = estado.canciones;
    cancionActual = estado.cancionActual;
    lineaActual = estado.lineaActual;
    
    actualizarUI();
    renderizarLista();
});

socket.on('disconnect', () => {
    updateConnectionStatus(false);
    showToast('❌ Desconectado del servidor', 'error');
});

socket.on('connect', () => {
    updateConnectionStatus(true);
    showToast('✅ Reconectado al servidor', 'success');
});

function actualizarUI() {
    if (!canciones.length || cancionActual >= canciones.length) {
        // Actualizar elementos con valores por defecto
        const titleElement = document.querySelector('.value');
        if (titleElement) titleElement.textContent = 'Cargando...';
        currentLineEl.textContent = 'Esperando datos...';
        progressEl.textContent = 'Línea 0 de 0';
        if (percentageEl) percentageEl.textContent = '0%';
        if (progressFill) progressFill.style.width = '0%';
        return;
    }
    
    const cancion = canciones[cancionActual];
    const linea = cancion.letra[lineaActual] || '...';
    const totalLineas = cancion.letra.length;
    const progreso = ((lineaActual + 1) / totalLineas) * 100;
    
    // Actualizar elementos de forma segura
    const titleElement = document.querySelector('.value');
    if (titleElement) titleElement.textContent = cancion.titulo;
    
    if (currentLineEl) currentLineEl.textContent = linea;
    if (progressEl) progressEl.textContent = `Línea ${lineaActual + 1} de ${totalLineas}`;
    if (percentageEl) percentageEl.textContent = `${Math.round(progreso)}%`;
    if (progressFill) progressFill.style.width = `${progreso}%`;
}

function renderizarLista(searchTerm = '') {
    if (!songListEl) return;
    
    if (!canciones.length) {
        songListEl.innerHTML = '<div style="text-align: center; padding: 40px;">📭 No hay canciones disponibles</div>';
        return;
    }
    
    let filtradas = canciones;
    if (searchTerm) {
        filtradas = canciones.filter(cancion => 
            cancion.titulo.toLowerCase().includes(searchTerm)
        );
    }
    
    if (filtradas.length === 0) {
        songListEl.innerHTML = '<div style="text-align: center; padding: 40px;">🔍 No se encontraron canciones</div>';
        return;
    }
    
    songListEl.innerHTML = filtradas.map((cancion, idx) => {
        const originalIndex = canciones.findIndex(c => c.id === cancion.id);
        const isActive = originalIndex === cancionActual;
        
        return `
            <div class="song-item ${isActive ? 'active' : ''}" data-index="${originalIndex}">
                <div class="song-info-detail">
                    <div class="song-title-item">${escapeHtml(cancion.titulo)}</div>
                    <div class="song-meta">${cancion.letra.length} líneas</div>
                </div>
                <div class="song-status">
                    ${isActive ? '<span class="playing-icon">▶</span>' : ''}
                </div>
            </div>
        `;
    }).join('');
    
    // Agregar eventos a cada canción
    document.querySelectorAll('.song-item').forEach(el => {
        el.onclick = () => {
            const index = parseInt(el.dataset.index);
            if (!isNaN(index) && index !== cancionActual) {
                socket.emit('cambiar-cancion', index);
                showToast(`📀 Cambiando a: ${canciones[index].titulo}`);
            }
        };
    });
}

function updateConnectionStatus(connected) {
    if (!connectionStatus) return;
    
    if (connected) {
        connectionStatus.classList.add('connected');
        const span = connectionStatus.querySelector('span');
        if (span) span.textContent = 'Conectado';
    } else {
        connectionStatus.classList.remove('connected');
        const span = connectionStatus.querySelector('span');
        if (span) span.textContent = 'Desconectado';
    }
}

// Helper para escapar HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

let toastTimeout;
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// Verificar conexión inicial
setTimeout(() => {
    if (canciones.length === 0) {
        console.log('Esperando datos del servidor...');
        showToast('Conectando al servidor...', 'info');
    }
}, 1000);
