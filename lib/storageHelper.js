import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase";

/**
 * Determina si una URL pertenece a Firebase Storage
 */
export const esUrlFirebaseStorage = (url) => {
  return typeof url === 'string' && url.includes('firebasestorage.googleapis.com');
};

/**
 * Determina si una cadena es una imagen en base64 Data URL
 */
export const esDataUrl = (url) => {
  return typeof url === 'string' && url.startsWith('data:image/');
};

/**
 * Convierte un Data URL (base64) a un objeto Blob
 */
export const dataUrlToBlob = (dataUrl) => {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const partes = dataUrl.split(',');
  if (partes.length < 2) return null;
  
  const mimeMatch = partes[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/webp';
  const byteString = atob(partes[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([ab], { type: mime });
};

/**
 * Comprime y optimiza una imagen mediante HTML5 Canvas asegurando un tamaño ligero (< 180KB)
 * mientras preserva alta definición (hasta 1600px Full HD) para esquemas y placas.
 * 
 * @param {File|Blob} file Archivo de imagen original
 * @param {number} maxDim Dimensión máxima (ancho o alto, por defecto 1600)
 * @param {number} maxBytes Tamaño máximo objetivo en bytes (por defecto 180 KB)
 * @returns {Promise<{ blob: Blob, dataUrl: string, width: number, height: number, sizeKB: number }>}
 */
export const optimizarYComprimirImagen = (file, maxDim = 1600, maxBytes = 180 * 1024) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No se proporcionó ningún archivo de imagen.'));
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      let origW = img.naturalWidth || img.width || 1024;
      let origH = img.naturalHeight || img.height || 1024;

      // Escalar dimensiones si superan maxDim
      let targetW = origW;
      let targetH = origH;
      if (targetW > maxDim || targetH > maxDim) {
        if (targetW > targetH) {
          targetH = Math.round((targetH * maxDim) / targetW);
          targetW = maxDim;
        } else {
          targetW = Math.round((targetW * maxDim) / targetH);
          targetH = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetW, targetH);

      // Algoritmo de compresión adaptativo:
      // Probamos calidades descendentes en WebP hasta que el tamaño esté por debajo de maxBytes
      const calidades = [0.80, 0.68, 0.55, 0.45];
      let mejorBlob = null;
      let mejorDataUrl = null;

      for (const q of calidades) {
        let testDataUrl = canvas.toDataURL('image/webp', q);
        // Fallback a JPEG si el navegador no soporta codificación WebP
        if (!testDataUrl.startsWith('data:image/webp')) {
          testDataUrl = canvas.toDataURL('image/jpeg', q);
        }

        const testBlob = dataUrlToBlob(testDataUrl);
        mejorBlob = testBlob;
        mejorDataUrl = testDataUrl;

        if (testBlob && testBlob.size <= maxBytes) {
          break; // Cumple el objetivo de tamaño
        }
      }

      // Si aún supera el tamaño con calidad 0.45, escalamos dimensiones a un 75%
      if (mejorBlob && mejorBlob.size > maxBytes && targetW > 900) {
        const miniCanvas = document.createElement('canvas');
        const factor = 0.72;
        miniCanvas.width = Math.round(targetW * factor);
        miniCanvas.height = Math.round(targetH * factor);
        const miniCtx = miniCanvas.getContext('2d');
        miniCtx.imageSmoothingEnabled = true;
        miniCtx.imageSmoothingQuality = 'high';
        miniCtx.drawImage(canvas, 0, 0, miniCanvas.width, miniCanvas.height);

        let finalDataUrl = miniCanvas.toDataURL('image/webp', 0.58);
        if (!finalDataUrl.startsWith('data:image/webp')) {
          finalDataUrl = miniCanvas.toDataURL('image/jpeg', 0.58);
        }
        mejorBlob = dataUrlToBlob(finalDataUrl);
        mejorDataUrl = finalDataUrl;
        targetW = miniCanvas.width;
        targetH = miniCanvas.height;
      }

      resolve({
        blob: mejorBlob,
        dataUrl: mejorDataUrl,
        width: targetW,
        height: targetH,
        sizeKB: mejorBlob ? Math.round(mejorBlob.size / 1024) : 0
      });
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo leer la imagen proporcionada: ' + (err?.message || 'Error desconocido')));
    };

    img.src = objectUrl;
  });
};

/**
 * Comprime un Data URL (base64) existente para que no supere un presupuesto estricto (ej: 130KB)
 * en caso de que quede guardado directamente en Firestore.
 */
export const comprimirDataUrlDeEmergencia = (dataUrl, maxBytes = 130 * 1024) => {
  return new Promise((resolve) => {
    if (!esDataUrl(dataUrl)) return resolve(dataUrl);
    const blob = dataUrlToBlob(dataUrl);
    if (!blob || blob.size <= maxBytes) return resolve(dataUrl);

    optimizarYComprimirImagen(blob, 1280, maxBytes)
      .then(res => resolve(res.dataUrl))
      .catch(() => resolve(dataUrl));
  });
};

/**
 * Envuelve una promesa con un tiempo de espera límite (timeout).
 * Si el servidor o Firebase Storage no responde en 'ms' milisegundos, cancela y rechaza.
 */
export const withTimeout = (promise, ms = 6500, errorMsg = 'Tiempo de espera agotado') => {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(errorMsg));
      }, ms);
      // Limpiar timer si la promesa resuelve antes
      promise.finally(() => clearTimeout(timer));
    })
  ]);
};

/**
 * Sube un Blob o Archivo a Firebase Storage y retorna la URL pública de descarga.
 * Protegido con timeout estricto de 6.5 segundos para evitar cuelgues de red.
 * 
 * @param {Blob|File} archivoOBlob 
 * @param {string} rutaDestino Ruta en el Storage (ej: 'boardview/samsung_a12/placa_cara_a_123.webp')
 * @returns {Promise<string>} URL de descarga pública
 */
export const subirImagenStorage = async (archivoOBlob, rutaDestino) => {
  if (!archivoOBlob) throw new Error('No se proporcionó ningún archivo para subir.');
  if (!rutaDestino) throw new Error('Ruta de almacenamiento no especificada.');

  try {
    const storageRef = ref(storage, rutaDestino);
    const contentType = archivoOBlob.type || 'image/webp';
    
    // Subir con timeout máximo de 6.5 segundos
    await withTimeout(
      uploadBytes(storageRef, archivoOBlob, {
        contentType,
        cacheControl: 'public,max-age=31536000'
      }),
      6500,
      'Firebase Storage no respondió en 6.5s. Verifique reglas y conexión.'
    );

    const downloadUrl = await withTimeout(
      getDownloadURL(storageRef),
      4000,
      'No se pudo obtener la URL de descarga en 4s.'
    );
    return downloadUrl;
  } catch (error) {
    console.warn('Error/Timeout al subir a Firebase Storage:', error?.message || error);
    throw error;
  }
};

/**
 * Elimina una imagen de Firebase Storage de forma segura.
 * Si la URL no es de Firebase Storage (ej: PostImages, predeterminada, dataURL), no hace nada.
 * 
 * @param {string} urlOPath URL pública o ruta en el Storage
 * @returns {Promise<boolean>} true si se eliminó o no requería eliminación
 */
export const eliminarImagenStorage = async (urlOPath) => {
  if (!urlOPath || typeof urlOPath !== 'string') return true;
  if (!esUrlFirebaseStorage(urlOPath)) return true;

  try {
    const storageRef = ref(storage, urlOPath);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    // Si el archivo ya no existía (storage/object-not-found), no es un error fatal
    if (error?.code === 'storage/object-not-found') {
      return true;
    }
    console.warn('Advertencia al eliminar archivo de Firebase Storage:', error);
    return false;
  }
};

/**
 * Migra un Data URL (base64) existente a Firebase Storage y retorna la nueva URL.
 * 
 * @param {string} dataUrl String en base64
 * @param {string} rutaDestino Ruta en Storage
 * @returns {Promise<string>} Nueva URL en Storage
 */
export const migrarBase64AStorage = async (dataUrl, rutaDestino) => {
  if (!esDataUrl(dataUrl)) return dataUrl;
  
  const blob = dataUrlToBlob(dataUrl);
  if (!blob) return dataUrl;

  try {
    const url = await subirImagenStorage(blob, rutaDestino);
    return url;
  } catch (error) {
    console.warn('Fallo migración lazy de base64 a Storage, conservando dataUrl:', error);
    return dataUrl;
  }
};

/**
 * Escanea un objeto de modelo de Hardware DB y migra automáticamente cualquier
 * imagen que esté guardada como base64 (Data URL) hacia Firebase Storage.
 * Retorna una copia limpia del modelo con URLs ligeras de Storage.
 * 
 * @param {object} modelo Objeto completo del modelo (Samsung, Xiaomi, etc.)
 * @returns {Promise<object>} Modelo con imágenes migradas a URLs de Storage
 */
export const sanitizarYMigrarModeloAStorage = async (modelo) => {
  if (!modelo || typeof modelo !== 'object') return modelo;
  
  // Clonar para no mutar el objeto en curso inesperadamente
  const modClon = { ...modelo };
  const modeloKey = (modClon.marca || 'modelo') + '_' + (modClon.nombre || modClon.id || 'general');
  const sanitizedKey = modeloKey.toLowerCase().replace(/[^a-z0-9_]/g, '_');

  // Si una subida a Storage falla (por reglas o timeout), abortar intentos posteriores
  // para que el guardado en Firestore sea ultra rápido y no se cuelgue la UI.
  let storageFallido = false;

  const intentarMigracion = async (dataUrl, ruta) => {
    if (storageFallido || !esDataUrl(dataUrl)) return dataUrl;
    try {
      return await migrarBase64AStorage(dataUrl, ruta);
    } catch (e) {
      storageFallido = true;
      console.warn('Storage falló o tardó demasiado, conservando dataUrl local:', e?.message || e);
      return dataUrl;
    }
  };

  // 1. Migrar imágenes de Boardview raíz
  if (esDataUrl(modClon.boardviewImagenPlacaCaraA)) {
    modClon.boardviewImagenPlacaCaraA = await intentarMigracion(
      modClon.boardviewImagenPlacaCaraA,
      `boardview/${sanitizedKey}/migrado_cara_a_${Date.now()}.webp`
    );
    modClon.boardviewImagenPlaca = modClon.boardviewImagenPlacaCaraA;
  }
  if (esDataUrl(modClon.boardviewImagenCaraA)) {
    modClon.boardviewImagenCaraA = await intentarMigracion(
      modClon.boardviewImagenCaraA,
      `boardview/${sanitizedKey}/migrado_cara_a_${Date.now()}.webp`
    );
  }
  if (esDataUrl(modClon.boardviewImagenPlacaCaraB)) {
    modClon.boardviewImagenPlacaCaraB = await intentarMigracion(
      modClon.boardviewImagenPlacaCaraB,
      `boardview/${sanitizedKey}/migrado_cara_b_${Date.now()}.webp`
    );
  }
  if (esDataUrl(modClon.boardviewImagenCaraB)) {
    modClon.boardviewImagenCaraB = await intentarMigracion(
      modClon.boardviewImagenCaraB,
      `boardview/${sanitizedKey}/migrado_cara_b_${Date.now()}.webp`
    );
  }
  if (esDataUrl(modClon.boardviewImagenPlaca)) {
    modClon.boardviewImagenPlaca = await intentarMigracion(
      modClon.boardviewImagenPlaca,
      `boardview/${sanitizedKey}/migrado_placa_legacy_${Date.now()}.webp`
    );
  }
  if (esDataUrl(modClon.boardviewImagenEsquema)) {
    modClon.boardviewImagenEsquema = await intentarMigracion(
      modClon.boardviewImagenEsquema,
      `boardview/${sanitizedKey}/migrado_esquema_${Date.now()}.webp`
    );
  }
  if (esDataUrl(modClon.imgPlaca)) {
    modClon.imgPlaca = await intentarMigracion(
      modClon.imgPlaca,
      `boardview/${sanitizedKey}/migrado_img_placa_${Date.now()}.webp`
    );
  }
  if (esDataUrl(modClon.imgEsquema)) {
    modClon.imgEsquema = await intentarMigracion(
      modClon.imgEsquema,
      `boardview/${sanitizedKey}/migrado_img_esquema_${Date.now()}.webp`
    );
  }

  // 2. Migrar mapa de sectores si existen
  if (!storageFallido && modClon.boardviewSectores && typeof modClon.boardviewSectores === 'object') {
    const sectoresActualizados = { ...modClon.boardviewSectores };
    for (const [secKey, secVal] of Object.entries(sectoresActualizados)) {
      if (storageFallido) break;
      if (secVal && typeof secVal === 'object') {
        const secSanitized = secKey.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const secClon = { ...secVal };
        let huboCambioSector = false;

        if (esDataUrl(secClon.imagenCaraA)) {
          secClon.imagenCaraA = await intentarMigracion(
            secClon.imagenCaraA,
            `boardview/${sanitizedKey}/${secSanitized}_cara_a_${Date.now()}.webp`
          );
          huboCambioSector = true;
        }
        if (esDataUrl(secClon.imagenCaraB)) {
          secClon.imagenCaraB = await intentarMigracion(
            secClon.imagenCaraB,
            `boardview/${sanitizedKey}/${secSanitized}_cara_b_${Date.now()}.webp`
          );
          huboCambioSector = true;
        }
        if (esDataUrl(secClon.imagenEsquema)) {
          secClon.imagenEsquema = await intentarMigracion(
            secClon.imagenEsquema,
            `boardview/${sanitizedKey}/${secSanitized}_esquema_${Date.now()}.webp`
          );
          huboCambioSector = true;
        }

        if (huboCambioSector) {
          sectoresActualizados[secKey] = secClon;
        }
      }
    }
    modClon.boardviewSectores = sectoresActualizados;
  }

  // 3. Deduplicación Estricta: Purgar alias redundantes que multiplican el peso
  const deduplicado = deduplicarImagenesModelo(modClon);

  // 4. Presupuesto de Seguridad Firestore: Si el JSON aún supera 650KB, comprimir de emergencia cualquier Base64
  let jsonString = '';
  try {
    jsonString = JSON.stringify(deduplicado);
  } catch (e) {}

  if (jsonString.length > 650_000) {
    console.warn(`⚠️ Tamaño de documento elevado (${Math.round(jsonString.length / 1024)} KB). Aplicando compresión de emergencia para asegurar guardado en Firestore...`);
    if (esDataUrl(deduplicado.boardviewImagenPlacaCaraA)) {
      deduplicado.boardviewImagenPlacaCaraA = await comprimirDataUrlDeEmergencia(deduplicado.boardviewImagenPlacaCaraA, 115 * 1024);
    }
    if (esDataUrl(deduplicado.boardviewImagenPlacaCaraB)) {
      deduplicado.boardviewImagenPlacaCaraB = await comprimirDataUrlDeEmergencia(deduplicado.boardviewImagenPlacaCaraB, 115 * 1024);
    }
    if (esDataUrl(deduplicado.boardviewImagenEsquema)) {
      deduplicado.boardviewImagenEsquema = await comprimirDataUrlDeEmergencia(deduplicado.boardviewImagenEsquema, 115 * 1024);
    }
  }

  return deduplicado;
};

/**
 * Pasa el modelo por un filtro que elimina campos legacy duplicados que contengan
 * cadenas Base64 idénticas, y evita duplicar fotos idénticas dentro de cada sector.
 */
export const deduplicarImagenesModelo = (modelo) => {
  if (!modelo || typeof modelo !== 'object') return modelo;
  const mod = { ...modelo };

  // Eliminar duplicados legacy en la raíz si ya existen en Cara A
  if (mod.boardviewImagenPlacaCaraA) {
    if (mod.boardviewImagenPlaca === mod.boardviewImagenPlacaCaraA) {
      delete mod.boardviewImagenPlaca;
    }
    if (mod.imgPlaca === mod.boardviewImagenPlacaCaraA) {
      delete mod.imgPlaca;
    }
  }

  if (mod.boardviewImagenEsquema && mod.imgEsquema === mod.boardviewImagenEsquema) {
    delete mod.imgEsquema;
  }

  // En sectores: Si un sector tiene exactamente la misma foto que la raíz, marcar como herencia
  if (mod.boardviewSectores && typeof mod.boardviewSectores === 'object') {
    const sectoresDeduplicados = {};
    for (const [secKey, secVal] of Object.entries(mod.boardviewSectores)) {
      if (secVal && typeof secVal === 'object') {
        const clonSec = { ...secVal };
        if (clonSec.imagenCaraA && clonSec.imagenCaraA === mod.boardviewImagenPlacaCaraA && esDataUrl(clonSec.imagenCaraA)) {
          clonSec.imagenCaraA = '__HEREDAR_RAIZ__';
        }
        if (clonSec.imagenCaraB && clonSec.imagenCaraB === mod.boardviewImagenPlacaCaraB && esDataUrl(clonSec.imagenCaraB)) {
          clonSec.imagenCaraB = '__HEREDAR_RAIZ__';
        }
        if (clonSec.imagenEsquema && clonSec.imagenEsquema === mod.boardviewImagenEsquema && esDataUrl(clonSec.imagenEsquema)) {
          clonSec.imagenEsquema = '__HEREDAR_RAIZ__';
        }
        sectoresDeduplicados[secKey] = clonSec;
      } else {
        sectoresDeduplicados[secKey] = secVal;
      }
    }
    mod.boardviewSectores = sectoresDeduplicados;
  }

  return mod;
};

/**
 * Rehidrata en memoria un modelo recién leído de Firestore, restableciendo
 * cualquier campo alias heredado o sectores marcados con '__HEREDAR_RAIZ__'.
 */
export const rehidratarImagenesModelo = (modelo) => {
  if (!modelo || typeof modelo !== 'object') return modelo;
  const mod = { ...modelo };

  const caraAPrincipal = mod.boardviewImagenPlacaCaraA || mod.boardviewImagenPlaca || mod.imgPlaca || '';
  if (!mod.boardviewImagenPlacaCaraA && caraAPrincipal) {
    mod.boardviewImagenPlacaCaraA = caraAPrincipal;
  }
  if (!mod.boardviewImagenPlaca && caraAPrincipal) {
    mod.boardviewImagenPlaca = caraAPrincipal;
  }

  if (mod.boardviewSectores && typeof mod.boardviewSectores === 'object') {
    const sectoresRehidratados = {};
    for (const [secKey, secVal] of Object.entries(mod.boardviewSectores)) {
      if (secVal && typeof secVal === 'object') {
        const clonSec = { ...secVal };
        if (clonSec.imagenCaraA === '__HEREDAR_RAIZ__') {
          clonSec.imagenCaraA = caraAPrincipal;
        }
        if (clonSec.imagenCaraB === '__HEREDAR_RAIZ__') {
          clonSec.imagenCaraB = mod.boardviewImagenPlacaCaraB || '';
        }
        if (clonSec.imagenEsquema === '__HEREDAR_RAIZ__') {
          clonSec.imagenEsquema = mod.boardviewImagenEsquema || '';
        }
        sectoresRehidratados[secKey] = clonSec;
      } else {
        sectoresRehidratados[secKey] = secVal;
      }
    }
    mod.boardviewSectores = sectoresRehidratados;
  }

  return mod;
};
