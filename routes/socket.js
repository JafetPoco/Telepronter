//const cancionService = require('../services/cancionService');
const scraperService = require('./../services/scraperService');
const fs = require('node:fs');


// Estado del teleprompter
let estado = {
  cancionActual: 0,
  lineaActual: 0,
  canciones: [],
  modoPantalla: 'letras'
};

// Cargar canciones desde archivo
const cancionesPath = './data/canciones.json';
if (fs.existsSync(cancionesPath)) {
  estado.canciones = JSON.parse(fs.readFileSync(cancionesPath, 'utf8'));
}

function configurarSockets(io) {
    // WebSocket
    io.on('connection', (socket) => {
        console.log('Cliente conectado:', socket.id);

        // Enviar estado actual al conectar
        socket.emit('estado-inicial', estado);

        // Siguiente línea
        socket.on('siguiente-linea', () => {
            const cancion = estado.canciones[estado.cancionActual];
            if (!cancion) return;

            estado.modoPantalla = 'letras';
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
            const cancion = estado.canciones[estado.cancionActual];
            if (!cancion) return;

            estado.modoPantalla = 'letras';
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
                estado.modoPantalla = 'letras';
                io.emit('actualizar-estado', estado);
            }
        });

        // Reiniciar canción actual
        socket.on('reset', () => {
            estado.lineaActual = 0;
            estado.modoPantalla = 'letras';
            io.emit('actualizar-estado', estado);
        });

        //Ir Coro
        socket.on('ir-al-coro', () => {
            const cancion = estado.canciones[estado.cancionActual];
            if (!cancion) return;

            estado.modoPantalla = 'letras';
            if (cancion.coros) {
                estado.lineaActual = cancion.coros.principal.inicio;
            }

            io.emit('actualizar-estado', estado);
        })

        // Vista principal
        socket.on('mostrar-vista-principal', () => {
            estado.modoPantalla = 'principal';
            io.emit('actualizar-estado', estado);
        });

        socket.on('buscar-letra', async (data) => {
            const { artista, cancion } = data;

            if (!artista || !cancion) {
                socket.emit('resultado-busqueda', {
                    exito: false,
                    mensaje: 'Faltan datos',
                    resultados: []
                });
                return;
            }

            try {
                const resultado = await scraperService.buscarLetra(artista, cancion);
                socket.emit('resultado-busqueda', resultado);
            } catch (error) {
                socket.emit('resultado-busqueda', {
                    exito: false,
                    mensaje: 'Error al buscar: ' + error.message,
                    resultados: []
                });
            }
        });

        socket.on('extraer-letra', async (link) => {
            if (!link) {
                socket.emit('resultado-busqueda', {
                    exito: false,
                    mensaje: 'Ingresa un link válido para buscar',
                    resultados: []
                });
                return;
            }

            try {
                const resultado = await scraperService.extraerLetra(link);
                socket.emit('resultado-busqueda', resultado);
            } catch (error) {
                socket.emit('resultado-busqueda', {
                    exito: false,
                    mensaje: 'Error al buscar: ' + error.message,
                    resultados: []
                });
            }
        });

    });
}

module.exports = configurarSockets;