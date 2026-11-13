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
  lyricDisplay.style.animation = 'lyricReveal 0.85s cubic-bezier(0.22, 1, 0.36, 1)';
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
  
  if (connected) {
    if (dot) dot.className = 'status-dot connected';
    if (connectionStatus) {
      connectionStatus.className = 'status-indicator connected';
      connectionStatus.setAttribute('aria-label', 'Conectado');
    }
  } else {
    if (dot) dot.className = 'status-dot disconnected';
    if (connectionStatus) {
      connectionStatus.className = 'status-indicator disconnected';
      connectionStatus.setAttribute('aria-label', 'Desconectado');
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