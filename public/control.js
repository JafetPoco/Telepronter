// control.js - Versión CORREGIDA con Tailwind
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

document.getElementById('btnPrincipal').onclick = () => {
    socket.emit('mostrar-vista-principal');
    showToast('🖼️ Mostrando vista principal');
};

document.getElementById('btnReset').onclick = () => {
    socket.emit('reset');
    showToast('⟳ Canción reiniciada');
};

// Atajos de teclado
document.addEventListener('keydown', (e) => {
    switch (e.key) {
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
        case 'v':
        case 'V':
            document.getElementById('btnPrincipal').click();
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
        const titleElement = document.querySelector('#currentSong .text-xl');
        if (titleElement) titleElement.textContent = 'Cargando...';
        if (currentLineEl) currentLineEl.textContent = 'Esperando datos...';
        if (progressEl) progressEl.textContent = 'Línea 0 de 0';
        if (percentageEl) percentageEl.textContent = '0%';
        if (progressFill) progressFill.style.width = '0%';
        return;
    }

    const cancion = canciones[cancionActual];
    const linea = cancion.letra[lineaActual] || '...';
    const totalLineas = cancion.letra.length;
    const progreso = ((lineaActual + 1) / totalLineas) * 100;

    const titleElement = document.querySelector('#currentSong .text-xl');
    if (titleElement) titleElement.textContent = cancion.titulo;

    if (currentLineEl) currentLineEl.textContent = linea;
    if (progressEl) progressEl.textContent = `Línea ${lineaActual + 1} de ${totalLineas}`;
    if (percentageEl) percentageEl.textContent = `${Math.round(progreso)}%`;
    if (progressFill) progressFill.style.width = `${progreso}%`;
}

function renderizarLista(searchTerm = '') {
    if (!songListEl) return;

    if (!canciones.length) {
        songListEl.innerHTML = `
            <div class="text-center py-10 text-slate-500">
                <span class="text-4xl block mb-2">📭</span>
                No hay canciones disponibles
            </div>
        `;
        return;
    }

    let filtradas = canciones;
    if (searchTerm) {
        filtradas = canciones.filter(cancion =>
            cancion.titulo.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    if (filtradas.length === 0) {
        songListEl.innerHTML = `
            <div class="text-center py-10 text-slate-500">
                <span class="text-4xl block mb-2">🔍</span>
                No se encontraron canciones
            </div>
        `;
        return;
    }

    songListEl.innerHTML = filtradas.map((cancion, idx) => {
        const originalIndex = canciones.findIndex(c => c.id === cancion.id);
        const isActive = originalIndex === cancionActual;

        return `
            <div class="song-item ${isActive ? 'active' : ''} rounded-xl p-3 border ${isActive ? 'border-blue-500 bg-gradient-to-r from-blue-500/10 to-purple-500/10' : 'border-transparent hover:bg-slate-800/50'} transition-all duration-200 cursor-pointer" data-index="${originalIndex}">
                <div class="flex items-center justify-between gap-3">
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-semibold ${isActive ? 'text-blue-400' : 'text-slate-300'} truncate">
                            ${escapeHtml(cancion.titulo)}
                        </div>
                        <div class="text-xs ${isActive ? 'text-blue-300/70' : 'text-slate-500'}">
                            ${cancion.letra.length} líneas
                        </div>
                    </div>
                    ${isActive ? '<span class="text-blue-400 text-xs font-bold">▶</span>' : ''}
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.song-item').forEach(el => {
        el.addEventListener('click', () => {
            const index = Number.parseInt(el.dataset.index, 10);
            if (!Number.isNaN(index) && index !== cancionActual) {
                socket.emit('cambiar-cancion', index);
                showToast(`📀 Cambiando a: ${canciones[index].titulo}`);
            }
        });
    });
}

function updateConnectionStatus(connected) {
    if (!connectionStatus) return;

    if (connected) {
        const span = connectionStatus.querySelector('span');
        if (span) span.textContent = 'Conectado';
        const dot = connectionStatus.querySelector('.status-dot');
        if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 status-dot';
    } else {
        const span = connectionStatus.querySelector('span');
        if (span) span.textContent = 'Desconectado';
        const dot = connectionStatus.querySelector('.status-dot');
        if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-red-400 status-dot';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

let toastTimeout;
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    const icon = toast.querySelector('#toastIcon');
    const msg = toast.querySelector('#toastMessage');
    if (icon) {
        if (message.includes('✅')) icon.textContent = '✅';
        else if (message.includes('❌')) icon.textContent = '❌';
        else if (message.includes('◀')) icon.textContent = '◀';
        else if (message.includes('▶')) icon.textContent = '▶';
        else if (message.includes('🎵')) icon.textContent = '🎵';
        else if (message.includes('🖼️')) icon.textContent = '🖼️';
        else if (message.includes('⟳')) icon.textContent = '⟳';
        else if (message.includes('📀')) icon.textContent = '📀';
        else icon.textContent = 'ℹ️';
    }
    if (msg) msg.textContent = message.replace(/[✅❌◀▶🎵🖼️⟳📀]/g, '').trim();

    toast.classList.add('show');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

setTimeout(() => {
    if (canciones.length === 0) {
        console.log('Esperando datos del servidor...');
    }
}, 1000);


