const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class LetrasScraper {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.cancionesPath = path.join(this.dataDir, 'canciones.json');
    }

    async extraerLetra(url) {
        try {
            const urlFinal = typeof url === 'string' ? url.trim() : '';

            if (!urlFinal) {
                return {
                    exito: false,
                    mensaje: 'No se recibió una URL válida'
                };
            }

            const response = await axios.get(urlFinal, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                },
                timeout: 15000
            });

            if (response.status === 200) {
                const letra = this.extraerLetrasCom(response.data);

                if (letra && letra.length > 50) {
                    return {
                        exito: true,
                        titulo: this.extraerTituloDeUrl(urlFinal),
                        letra: letra,
                        fuente: new URL(urlFinal).hostname
                    };
                }
            }

            return {
                exito: false,
                mensaje: 'No se pudo acceder a la búsqueda'
            };
        } catch (error) {
            console.error('Error al extraer:', error);
            return {
                exito: false,
                mensaje: 'Error al Estraer: ' + error.message
            };
        }
    }

    extraerTituloDeUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const partes = pathname.split('/').filter(Boolean);
            
            if (partes.length >= 2) {
                // Tomar la última parte de la URL y reemplazar guiones por espacios
                const titulo = partes[partes.length - 1].replace(/-/g, ' ');
                // Decodificar caracteres especiales y capitalizar
                return decodeURIComponent(titulo).replace(/\b\w/g, l => l.toUpperCase());
            }
            return 'Título no disponible';
        } catch (error) {
            console.error('Error al extraer título de URL:', error);
            return 'Título no disponible';
        }
    }

    // Buscar letra en diferentes fuentes
    async buscarLetra(artista, cancion) {
        try {
            // Limpiar texto para URL
            const artistaClean = artista.toLowerCase().trim().replace(/\s+/g, '-');
            const cancionClean = cancion.toLowerCase().trim().replace(/\s+/g, '-');

            // Fuentes de búsqueda
            const fuentes = [
                {
                    url: `https://www.letras.com/${artistaClean}/${cancionClean}/`,
                    extractor: this.extraerLetrasCom.bind(this)
                }
            ];

            for (const fuente of fuentes) {
                try {
                    const response = await axios.get(fuente.url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                        },
                        timeout: 10000
                    });

                    if (response.status === 200) {
                        const letra = fuente.extractor(response.data);
                        if (letra && letra.length > 50) {
                            return {
                                exito: true,
                                titulo: cancion,
                                letra: letra,
                                fuente: new URL(fuente.url).hostname
                            };
                        }
                    }
                } catch (error) {
                    console.log(`❌ Error en ${fuente.url}: ${error.message}`);
                    continue;
                }
            }

            return {
                exito: false,
                mensaje: 'No se encontró la letra en ninguna fuente'
            };
        } catch (error) {
            console.error('Error en búsqueda:', error);
            return {
                exito: false,
                mensaje: 'Error al buscar la letra'
            };
        }
    }

    // Extractor para letras.com
    extraerLetrasCom(html) {
        const $ = cheerio.load(html);
        let letra = '';

        $('.lyric-original, .letra, .lyrics, .cnt-letra p').each((i, el) => {
            const texto = $(el).html() || '';
            if (texto && texto.length > 10) {
                letra += texto.replace(/<br\s*\/?>/gi, '\n') + '\n';
            }
        });

        return this.limpiarLetra(letra);
    }

    // Limpiar la letra
    limpiarLetra(letra) {
        return letra
            .replace(/\r/g, '')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<p[^>]*>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<div[^>]*>/gi, '\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/\[[^\]]*\]/g, '')
            .replace(/\s*\n\s*/g, '\n')
            .trim();
    }

    // Procesar letra para el teleprompter
    procesarLetraParaTeleprompter(letra, artista, cancion) {
        // Dividir en líneas
        const lineas = letra.split('\n').filter(line => line.trim().length > 0);

        // Crear estructura para el teleprompter
        return {
            titulo: cancion,
            artista: artista,
            letra: lineas,
            // Detectar posibles coros (opcional)
            coros: this.detectarCoros(lineas)
        };
    }

    // Detectar coros (versión simple)
    detectarCoros(lineas) {
        // Buscar patrones de repetición
        const coros = {
            principal: {
                inicio: 0,
                fin: 0
            }
        };

        // Si hay más de 3 líneas, buscar el coro en la posición 1/3 de la canción
        if (lineas.length > 10) {
            const inicioCoro = Math.floor(lineas.length * 0.3);
            const finCoro = Math.floor(lineas.length * 0.5);
            coros.principal.inicio = inicioCoro;
            coros.principal.fin = finCoro;
        }

        return coros;
    }

    // Guardar canción en el archivo JSON
    async guardarCancion(artista, cancion, letra) {
        try {
            // Asegurar que el directorio data existe
            await fs.mkdir(this.dataDir, { recursive: true });

            // Procesar letra para el teleprompter
            const cancionData = this.procesarLetraParaTeleprompter(letra, artista, cancion);

            // Cargar canciones existentes
            let canciones = [];
            try {
                const data = await fs.readFile(this.cancionesPath, 'utf8');
                canciones = JSON.parse(data);
            } catch (error) {
                // Archivo no existe, comenzar con array vacío
            }

            // Verificar si la canción ya existe
            const exists = canciones.some(c =>
                c.titulo.toLowerCase() === cancion.toLowerCase() &&
                c.artista.toLowerCase() === artista.toLowerCase()
            );

            if (exists) {
                return {
                    exito: false,
                    mensaje: 'La canción ya existe en el teleprompter'
                };
            }

            // Agregar nueva canción
            canciones.push(cancionData);

            // Guardar archivo
            await fs.writeFile(this.cancionesPath, JSON.stringify(canciones, null, 2), 'utf8');

            return {
                exito: true,
                mensaje: 'Canción agregada exitosamente',
                cancion: cancionData,
                index: canciones.length - 1
            };
        } catch (error) {
            console.error('Error guardando canción:', error);
            return {
                exito: false,
                mensaje: 'Error al guardar la canción'
            };
        }
    }

    // Buscar y guardar en un solo paso
    async buscarYGuardar(artista, cancion) {
        // Buscar la letra
        const resultado = await this.buscarLetra(artista, cancion);

        if (!resultado.exito) {
            return resultado;
        }

        // Guardar la canción
        const guardado = await this.guardarCancion(
            resultado.artista,
            resultado.cancion,
            resultado.letra
        );

        return {
            ...resultado,
            ...guardado
        };
    }
}

module.exports = LetrasScraper;