/**
 * Parsea la letra de una canción desde texto plano
 * @param {string} texto - El texto de la letra
 * @returns {Object|null} - Objeto con la letra parseada
 */
function parsearLetra(titulo, texto) {
    if (!texto || typeof texto !== 'string') {
        return null;
    }

    // Dividir el texto en líneas
    const lineas = texto.split('\n');
    const letraParseada = [];
    let coroInicio = null;
    let coroFin = null;
    let dentroDeCoro = false;

    letraParseada.push(titulo.toUpperCase());
    lineas.forEach((linea, index) => {
        let lineaProcesada = linea.trim();
        
        // Si la línea está vacía, la saltamos
        if (lineaProcesada === '') return;

        // Detectar [CORO]
        if (lineaProcesada.toUpperCase().includes('[CORO]')) {
            dentroDeCoro = true;
            coroInicio = letraParseada.length;
            lineaProcesada = lineaProcesada.replace(/\[CORO\]/i, '').trim();
            if (lineaProcesada === '') return;
        }

        // Detectar [/CORO]
        if (lineaProcesada.toUpperCase().includes('[/CORO]')) {
            dentroDeCoro = false;
            coroFin = letraParseada.length - 1;
            lineaProcesada = lineaProcesada.replace(/\[\/CORO\]/i, '').trim();
            if (lineaProcesada === '') return;
        }

        // Reemplazar / por <br>
        lineaProcesada = lineaProcesada.replace(/\//g, '<br>');

        // Si la línea tiene contenido, la agregamos
        if (lineaProcesada) {
            letraParseada.push(lineaProcesada);
        }
    });

    // Si no hay líneas, retornar null
    if (letraParseada.length === 0) {
        return null;
    }

    // Crear objeto coro
    let coros = {};
    if (coroInicio !== null && coroFin !== null && coroInicio <= coroFin) {
        coros = {
            principal: {
                inicio: coroInicio,
                fin: coroFin
            }
        };
    }

    return {
        id: Date.now(),
        titulo: titulo.toUpperCase() || 'Sin título',
        letra: letraParseada,
        coros: coros
    };
}

/**
 * Extrae el título de una URL
 * @param {string} url - La URL de la canción
 * @returns {string} - El título extraído
 */
function extraerTituloDeUrl(url) {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const partes = pathname.split('/').filter(Boolean);
        
        if (partes.length >= 2) {
            const titulo = partes[partes.length - 1].replace(/-/g, ' ');
            return decodeURIComponent(titulo).replace(/\b\w/g, l => l.toUpperCase());
        }
        return 'Título no disponible';
    } catch (error) {
        console.error('Error al extraer título de URL:', error);
        return 'Título no disponible';
    }
}

module.exports = {
    parsearLetra,
    extraerTituloDeUrl
};