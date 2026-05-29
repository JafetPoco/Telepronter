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
  connectionStatus.textContent = '✅ Conectado';
  connectionStatus.style.color = 'rgba(100, 255, 100, 0.8)';
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

// Manejo de desconexión
socket.on('disconnect', () => {
  connectionStatus.textContent = '⚠️ Desconectado';
  connectionStatus.style.color = 'rgba(255, 100, 100, 0.8)';
  lyricDisplay.textContent = 'Esperando conexión...';
});

socket.on('connect', () => {
  connectionStatus.textContent = '✅ Conectado';
  connectionStatus.style.color = 'rgba(100, 255, 100, 0.8)';
});
