const express = require('express');
const http = require('node:http');
const socketIO = require('socket.io');
const path = require('node:path');
const fs = require('node:fs');
const configurarSockets = require('./routes/socket');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Configurar sockets
configurarSockets(io);

// Servir archivos estáticos
app.use(express.static('public'));
app.use('/videos', express.static('videos'));
app.use(express.static(path.join(__dirname, 'public')));

// Ruta API para buscar (alternativa HTTP)
app.use(express.json());

const networkInterfaces = require('node:os').networkInterfaces();

// Obtener IP local automáticamente
let localIp = 'localhost';
for (const networkInterface of Object.values(networkInterfaces)) {
  for (const config of networkInterface) {
    if (config.family === 'IPv4' && !config.internal) {
      localIp = config.address;
      break;
    }
  }
}

// Iniciar servidor
server.listen(PORT, () => {
  console.log('\n🎤 Teleprompter Live iniciado');
  console.log(`📺 Pantalla: http://localhost:${PORT}/screen.html`);
  console.log(`🎮 Control: http://localhost:${PORT}/control.html`);
  console.log(`📺 Pantalla: http://${localIp}:${PORT}/screen.html`);
  console.log(`🎮 Control: http://${localIp}:${PORT}/control.html`);
  console.log('\nPara usar desde otros dispositivos, usa tu IP local\n');
});
