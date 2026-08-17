// ===== FUNCIONALIDAD =====
const socket = io();

// Elementos DOM
const form = document.getElementById('songForm');
const titleInput = document.getElementById('songTitle');
const lyricsInput = document.getElementById('songLyrics');
const lineNumbersDiv = document.getElementById('lineNumbers');

const getInputValue = (input) => input ? input.value.trim() : '';

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

    const titulo = getInputValue(titleInput);
    const letra = getInputValue(lyricsInput);

    // Validaciones
    if (!titulo) {
        mostrarToast('El título de la canción es obligatorio', 'error');
        titleInput.focus();
        return false;
    }

    if (!letra) {
        mostrarToast('La letra de la canción es obligatoria', 'error');
        lyricsInput.focus();
        return false;
    }

    socket.emit('agregar-cancion', titulo, letra);

    // Mostrar éxito
    mostrarToast('✅', `"${titulo}" guardada correctamente`, 'success');

    // Efecto visual en el botón
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.classList.add('save-success');
    setTimeout(() => submitBtn.classList.remove('save-success'), 500);

    return false;
}

// ===== LIMPIAR FORMULARIO =====
function limpiarFormulario() {
    if (!confirm('¿Estás seguro de que quieres limpiar todos los campos?')) return;

    if (titleInput) titleInput.value = '';
    if (lyricsInput) lyricsInput.value = '';

    // Resetear contadores y vista previa
    if (titleInput) titleInput.focus();
    mostrarToast('Formulario limpiado', 'info');
}

// ===== TOAST =====
function mostrarToast(icon, message, type = 'info') {
    showToast(`${icon} ${message}`.trim(), type);
}

// Atajo de teclado: Ctrl+Enter para guardar
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        form.dispatchEvent(new Event('submit'));
    }
});

console.log('🎵 Editor de canciones listo');