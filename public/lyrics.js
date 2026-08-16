// ===== FUNCIONALIDAD =====
const socket = io();

// Elementos DOM
const form = document.getElementById('songForm');
const titleInput = document.getElementById('songTitle');
const artistInput = document.getElementById('songArtist');
const lyricsInput = document.getElementById('songLyrics');
const tagsInput = document.getElementById('songTags');
const lineCountSpan = document.getElementById('lineCountNumber');
const previewTitle = document.getElementById('previewTitle');
const previewFirstLine = document.getElementById('previewFirstLine');
const lineNumbersDiv = document.getElementById('lineNumbers');


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

// Actualizar contador de líneas y vista previa en tiempo real
lyricsInput.addEventListener('input', function () {
    const lines = this.value.split('\n').filter(line => line.trim() !== '');
    lineCountSpan.textContent = lines.length;

    // Actualizar vista previa
    const firstLine = lines[0] || 'La letra aparecerá aquí...';
    previewFirstLine.textContent = firstLine;

});

// Actualizar vista previa del título
titleInput.addEventListener('input', function () {
    previewTitle.textContent = this.value || 'Título de la canción';
});


// ==== SCRAPER DE LETRASS ====
function buscarPorNombre() {
    const artista = document.getElementById('artistaBuscar').value.trim();
    const cancion = document.getElementById('cancionBuscar').value.trim();

    if (!artista || !cancion) {
        document.getElementById('resultadoBusqueda').innerHTML =
            '⚠️ Ingresa artista y canción';
        document.getElementById('resultadoBusqueda').className = 'mt-3 text-sm text-yellow-400';
        return;
    }

    socket.emit('buscar-letra', { artista, cancion });
}

function extraerLetra() {
    const input = document.getElementById('linkLetra');
    const link = input ? input.value.trim() : '';

    if (!link) {
        showToast('⚠️ Ingresa un link de letra', 'warning');
        return;
    }

    socket.emit('extraer-letra', link);
    showToast('Buscando letra...', 'info');
}

// Enter para buscar
document.getElementById('cancionBuscar').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') buscarYAgregar();
});

socket.on('resultado-busqueda', (data) => {
    if (data.exito && data.letra) {
        lyricsInput.value = data.letra;
        titleInput.value = data.titulo || '';
    } else {
        console.log('❌ Error al buscar letra:', data.mensaje);
        showToast(`❌ ${data.mensaje}`, 'error');
    }
});

// Sincronizar scroll del textarea con los números de línea
lyricsInput.addEventListener('scroll', function () {
    lineNumbersDiv.scrollTop = this.scrollTop;
});

// ===== GUARDAR CANCIÓN =====
function guardarCancion(event) {
    event.preventDefault();

    const titulo = titleInput.value.trim();
    const artista = artistInput.value.trim();
    const letra = lyricsInput.value.trim();
    const tags = tagsInput.value.trim();

    // Validaciones
    if (!titulo) {
        mostrarToast('❌', 'El título de la canción es obligatorio', 'error');
        titleInput.focus();
        return false;
    }

    if (!letra) {
        mostrarToast('❌', 'La letra de la canción es obligatoria', 'error');
        lyricsInput.focus();
        return false;
    }

    // Dividir la letra en líneas (filtrando líneas vacías)
    const lineas = letra.split('\n').filter(line => line.trim() !== '');

    if (lineas.length === 0) {
        mostrarToast('❌', 'La letra debe tener al menos una línea', 'error');
        lyricsInput.focus();
        return false;
    }

    // Crear objeto canción
    const cancion = {
        id: Date.now(),
        titulo: titulo,
        artista: artista || 'Desconocido',
        letra: lineas,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
        fechaCreacion: new Date().toISOString()
    };

    console.log('📀 Canción guardada:', cancion);

    // Aquí enviarías la canción al servidor vía socket.io
    // socket.emit('agregar-cancion', cancion);

    // Mostrar éxito
    mostrarToast('✅', `"${titulo}" guardada correctamente (${lineas.length} líneas)`, 'success');

    // Efecto visual en el botón
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.classList.add('save-success');
    setTimeout(() => submitBtn.classList.remove('save-success'), 500);

    // Limpiar campos si quieres
    // limpiarFormulario();

    return false;
}

// ===== LIMPIAR FORMULARIO =====
function limpiarFormulario() {
    if (!confirm('¿Estás seguro de que quieres limpiar todos los campos?')) return;

    titleInput.value = '';
    artistInput.value = '';
    lyricsInput.value = '';
    tagsInput.value = '';

    // Resetear contadores y vista previa
    lineCountSpan.textContent = '0';
    previewTitle.textContent = 'Título de la canción';
    previewFirstLine.textContent = 'La letra aparecerá aquí...';
    titleInput.focus();
    mostrarToast('🗑️', 'Formulario limpiado', 'info');
}

// ===== TOAST =====
function mostrarToast(icon, message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastMessage = document.getElementById('toastMessage');

    toastIcon.textContent = icon || 'ℹ️';
    toastMessage.textContent = message;

    // Resetear clase
    toast.className = 'toast fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-sm px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-2xl shadow-black/50 border border-slate-700/50 opacity-0 translate-y-4 pointer-events-none z-50 flex items-center gap-2 sm:gap-3 min-w-[200px] sm:min-w-[280px] justify-center';

    // Forzar reflow
    void toast.offsetWidth;

    toast.classList.add('show');
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(16px)';
    }, 3000);
}

// Atajo de teclado: Ctrl+Enter para guardar
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        form.dispatchEvent(new Event('submit'));
    }
});

console.log('🎵 Editor de canciones listo');