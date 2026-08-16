//const { parsearLetra, extraerTituloDeUrl } = require('../utils/letraParser');
const fs = require('node:fs');
const path = require('node:path');

// Ruta del archivo JSON
const CANCIONES_PATH = process.env.CANCIONES_PATH || path.join(__dirname, '../data/canciones.json');

class CancionService {
    constructor() {
        this.canciones = [];
        this.cargarCanciones();
    }

    // Carga las canciones desde el archivo JSON
    cargarCanciones() {
        try {
            // Asegurar que el directorio existe
            const dir = path.dirname(CANCIONES_PATH);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            if (fs.existsSync(CANCIONES_PATH)) {
                const data = fs.readFileSync(CANCIONES_PATH, 'utf8');
                this.canciones = JSON.parse(data);
                console.log(`✅ ${this.canciones.length} canciones cargadas`);
            } else {
                this.canciones = [];
                this.guardarCanciones();
                console.log('📁 Archivo de canciones creado');
            }
        } catch (error) {
            console.error('❌ Error al cargar canciones:', error);
            this.canciones = [];
        }
        return this.canciones;
    }

    // Guarda las canciones en el archivo JSON
    guardarCanciones() {
        try {
            const dir = path.dirname(CANCIONES_PATH);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(CANCIONES_PATH, JSON.stringify(this.canciones, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error('❌ Error al guardar canciones:', error);
            return false;
        }
    }

    // Obtiene todas las canciones
    obtenerTodas() {
        return this.canciones;
    }

    // Obtiene una canción por ID
    obtenerPorId(id) {
        return this.canciones.find(c => c.id === id) || null;
    }

    // Obtiene una canción por índice (para el teleprompter)
    obtenerPorIndice(index) {
        return this.canciones[index] || null;
    }

    // Elimina una canción por ID
    eliminarPorId(id) {
        const index = this.canciones.findIndex(c => c.id === id);
        if (index === -1) {
            return {
                exito: false,
                mensaje: 'Canción no encontrada'
            };
        }

        const cancionEliminada = this.canciones[index];
        this.canciones.splice(index, 1);

        if (this.guardarCanciones()) {
            return {
                exito: true,
                mensaje: `Canción "${cancionEliminada.titulo}" eliminada`,
                cancion: cancionEliminada
            };
        } else {
            return {
                exito: false,
                mensaje: 'Error al guardar los cambios'
            };
        }
    }

    // Busca canciones por título
    buscarPorTitulo(busqueda) {
        if (!busqueda) return this.canciones;
        const termino = busqueda.toLowerCase();
        return this.canciones.filter(c => 
            c.titulo.toLowerCase().includes(termino)
        );
    }

    // Recarga las canciones desde el archivo (útil si se modificó externamente)
    recargar() {
        return this.cargarCanciones();
    }
}

// Exportar una instancia única (singleton)
module.exports = new CancionService();