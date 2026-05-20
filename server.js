const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Estado del teleprompter
let estado = {
  cancionActual: 0,
  lineaActual: 0,
  canciones: []
};

// Cargar canciones desde archivo
const cancionesPath = './data/canciones.json';
if (fs.existsSync(cancionesPath)) {
  estado.canciones = JSON.parse(fs.readFileSync(cancionesPath, 'utf8'));
} else {
  // Canciones de ejemplo
  estado.canciones = [
    {
      id: 1,
      titulo: 'Canción de ejemplo 1',
      letra: [
        'Esta es la primera línea',
        'Esta es la segunda línea',
        'Y esta es la tercera línea'
      ]
    },
    {
      id: 2,
      titulo: 'Canción de ejemplo 2',
      letra: [
        'Otro verso inicial',
        'El estribillo pega fuerte',
        'Y cerramos con broche de oro'
      ]
    }
  ];
}

// Guardar canciones
function guardarCanciones() {
  fs.writeFileSync(cancionesPath, JSON.stringify(estado.canciones, null, 2));
}

// WebSocket
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  // Enviar estado actual al conectar
  socket.emit('estado-inicial', estado);
  
  // Siguiente línea
  socket.on('siguiente-linea', () => {
    const cancion = estado.canciones[estado.cancionActual];
    if (estado.lineaActual < cancion.letra.length - 1) {
      estado.lineaActual++;
    } else if (estado.cancionActual < estado.canciones.length - 1) {
      estado.cancionActual++;
      estado.lineaActual = 0;
    }
    io.emit('actualizar-estado', estado);
  });
  
  // Anterior línea
  socket.on('anterior-linea', () => {
    if (estado.lineaActual > 0) {
      estado.lineaActual--;
    } else if (estado.cancionActual > 0) {
      estado.cancionActual--;
      estado.lineaActual = estado.canciones[estado.cancionActual].letra.length - 1;
    }
    io.emit('actualizar-estado', estado);
  });
  
  // Cambiar canción directamente
  socket.on('cambiar-cancion', (index) => {
    if (index >= 0 && index < estado.canciones.length) {
      estado.cancionActual = index;
      estado.lineaActual = 0;
      io.emit('actualizar-estado', estado);
    }
  });
  
  // Reiniciar canción actual
  socket.on('reset', () => {
    estado.lineaActual = 0;
    io.emit('actualizar-estado', estado);
  });

  //Ir Coro
  socket.on('ir-al-coro', () => {
    const cancion = estado.canciones[estado.cancionActual];

    if(cancion.coros){
      estado.lineaActual = cancion.coros.principal.inicio;
    }

    io.emit('actualizar-estado', estado);
  })
});

// Servir archivos estáticos
app.use(express.static('public'));
app.use('/videos', express.static('videos'));

const networkInterfaces = require('os').networkInterfaces();

// Obtener IP local automáticamente
let localIp = 'localhost';
for (const interface of Object.values(networkInterfaces)) {
  for (const config of interface) {
    if (config.family === 'IPv4' && !config.internal) {
      localIp = config.address;
      break;
    }
  }
}

// Iniciar servidor
const PORT = 3000;
server.listen(PORT, () => {
  console.log('\n🎤 Teleprompter Live iniciado');
  console.log(`📺 Pantalla: http://localhost:${PORT}/screen.html`);
  console.log(`🎮 Control: http://localhost:${PORT}/control.html`);
  console.log(`📺 Pantalla: http://${localIp}:${PORT}/screen.html`);
  console.log(`🎮 Control: http://${localIp}:${PORT}/control.html`);
  console.log('\nPara usar desde otros dispositivos, usa tu IP local\n');
});
