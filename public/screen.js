const socket = io();
let canciones = [];
let modoPantalla = 'letras';

// Elementos DOM
const lyricDisplay = document.getElementById('lyricDisplay');
const songInfo = document.getElementById('songInfo');
const connectionStatus = document.getElementById('connectionStatus');
const mainView = document.getElementById('mainView');
const lyricContainer = document.getElementById('lyricContainer');

// Estado inicial
socket.on('estado-inicial', (estado) => {
  canciones = estado.canciones;
  modoPantalla = estado.modoPantalla || 'letras';
  actualizarPantalla(estado);
  updateConnectionStatus(true);
});

// Actualización desde el control
socket.on('actualizar-estado', (estado) => {
  modoPantalla = estado.modoPantalla || 'letras';
  actualizarPantalla(estado);
});

function actualizarPantalla(estado) {
  aplicarModoPantalla(modoPantalla);

  const cancion = estado.canciones[estado.cancionActual];
  if (!cancion) {
    lyricDisplay.textContent = 'Esperando canción...';
    songInfo.textContent = modoPantalla === 'principal' ? 'Vista principal' : 'Sin canción cargada';
    return;
  }

  if (modoPantalla === 'principal') {
    songInfo.textContent = 'Vista principal';
    lyricDisplay.textContent = '';
    return;
  }

  const linea = cancion.letra[estado.lineaActual] || '';

  lyricDisplay.innerHTML = linea;
  songInfo.textContent = `${cancion.titulo} • ${estado.lineaActual + 1}/${cancion.letra.length}`;

  // Reanimar efecto
  lyricDisplay.style.animation = 'none';
  lyricDisplay.getBoundingClientRect();
  lyricDisplay.style.animation = 'fadeSlideUp 0.5s ease-out';
}

function aplicarModoPantalla(modo) {
  const vistaPrincipalActiva = modo === 'principal';

  document.body.dataset.view = vistaPrincipalActiva ? 'principal' : 'letras';
  if (mainView) {
    mainView.classList.toggle('active', vistaPrincipalActiva);
    mainView.setAttribute('aria-hidden', String(!vistaPrincipalActiva));
  }
  if (lyricContainer) {
    lyricContainer.classList.toggle('hidden', vistaPrincipalActiva);
  }
}

function updateConnectionStatus(connected) {
  const dot = connectionStatus?.querySelector('.status-dot');
  const text = connectionStatus?.querySelector('span:last-child');
  
  if (connected) {
    if (dot) dot.className = 'status-dot w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50';
    if (text) text.textContent = 'Conectado';
    if (connectionStatus) {
      connectionStatus.className = 'status-badge fixed top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full shadow-xl shadow-black/30 connected';
    }
  } else {
    if (dot) dot.className = 'status-dot w-2 h-2 rounded-full bg-red-400 shadow-lg shadow-red-400/50';
    if (text) text.textContent = 'Desconectado';
    if (connectionStatus) {
      connectionStatus.className = 'status-badge fixed top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full shadow-xl shadow-black/30 disconnected';
    }
  }
}

// Manejo de desconexión
socket.on('disconnect', () => {
  updateConnectionStatus(false);
  lyricDisplay.textContent = 'Esperando conexión...';
});

socket.on('connect', () => {
  updateConnectionStatus(true);
});