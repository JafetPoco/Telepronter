import json
import re
import os

def parsear_letra(archivo_txt):
    """Convierte un archivo .txt con marcadores a JSON"""
    
    with open(archivo_txt, 'r', encoding='utf-8') as f:
        lineas = f.readlines()
    
    # Extraer título (primera línea que empieza con #)
    titulo = "Canción sin título"
    for linea in lineas:
        if linea.startswith('#'):
            titulo = linea[1:].strip()
            titulo = titulo.upper()
            break
    
    # Limpiar líneas vacías y marcadores
    letra_plana = []
    coros = {}
    coro_actual = None
    contador_lineas = 0
    dentro_coro = False
    dentro_puente = False
    
    for i, linea in enumerate(lineas):
        linea = linea.rstrip('\n')
        
        # Saltar línea de título
        if linea.startswith('#'):
            letra_plana.append(titulo)
            contador_lineas += 1
            continue
        
        # Detectar inicio de coro
        if '[CORO]' in linea.upper() and not dentro_coro:
            coro_actual = 'principal'
            dentro_coro = True
            coros[coro_actual] = {'inicio': contador_lineas, 'fin': None}
            continue
        
        # Detectar inicio de bridge/puente
        if '[PUENTE]' in linea.upper() and not dentro_puente:
            coro_actual = 'puente'
            dentro_puente = True
            coros[coro_actual] = {'inicio': contador_lineas, 'fin': None}
            continue
        
        # Detectar fin de sección
        if '[/CORO]' in linea.upper() and dentro_coro:
            coros['principal']['fin'] = contador_lineas - 1
            dentro_coro = False
            coro_actual = None
            continue
        
        if '[/PUENTE]' in linea.upper() and dentro_puente:
            coros['puente']['fin'] = contador_lineas - 1
            dentro_puente = False
            coro_actual = None
            continue
        
        # Si es una línea vacía, saltar
        if not linea.strip():
            continue
        
        # Agregar línea normal
        letra_plana.append(linea.replace("/","<br>").strip())
        
        # Si estamos dentro de un coro y no hay [/CHORUS], actualizar fin automáticamente
        if dentro_coro and coro_actual:
            coros[coro_actual]['fin'] = contador_lineas
        
        contador_lineas += 1
    
    # Limpiar coros que no se cerraron correctamente
    coros = {k: v for k, v in coros.items() if v['fin'] is not None}
    
    return {
        "id": None,  # Se asignará después
        "titulo": titulo,
        "letra": letra_plana,
        "coros": coros
    }

def procesar_carpeta(carpeta_entrada, archivo_salida):
    """Procesa todos los .txt de una carpeta y genera un JSON"""
    canciones = []
    id_counter = 1
    
    for archivo in os.listdir(carpeta_entrada):
        if archivo.endswith('.txt'):
            ruta = os.path.join(carpeta_entrada, archivo)
            cancion = parsear_letra(ruta)
            cancion['id'] = id_counter
            canciones.append(cancion)
            print(f"✅ Procesado: {cancion['titulo']}")
            id_counter += 1
    
    with open(archivo_salida, 'w', encoding='utf-8') as f:
        json.dump(canciones, f, indent=2, ensure_ascii=False)
    
    print(f"\n📁 Generado {archivo_salida} con {len(canciones)} canciones")

# Ejecutar
if __name__ == "__main__":
    procesar_carpeta("letras", "./data/canciones.json")
