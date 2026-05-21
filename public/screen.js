const socket = io();
let canciones = [];

// Elementos DOM
const lyricDisplay = document.getElementById('lyricDisplay');
const songInfo = document.getElementById('songInfo');
const connectionStatus = document.getElementById('connectionStatus');

// Estado inicial
socket.on('estado-inicial', (estado) => {
  canciones = estado.canciones;
  actualizarPantalla(estado);
  connectionStatus.textContent = '✅ Conectado';
  connectionStatus.style.color = 'rgba(100, 255, 100, 0.8)';
});

// Actualización desde el control
socket.on('actualizar-estado', (estado) => {
  actualizarPantalla(estado);
});

function actualizarPantalla(estado) {
  const cancion = estado.canciones[estado.cancionActual];
  const linea = cancion.letra[estado.lineaActual];

  lyricDisplay.innerHTML = linea;
  songInfo.textContent = `${cancion.titulo} • ${estado.lineaActual + 1}/${cancion.letra.length}`;

  // Reanimar efecto
  lyricDisplay.style.animation = 'none';
  lyricDisplay.offsetHeight; // Forzar reflow
  lyricDisplay.style.animation = 'fadeSlideUp 0.5s ease-out';
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
