# Implementación: Sistema Robusto de Imágenes y Firebase Storage en Board View Pro

**Fecha de Implementación:** 9 de Octubre de 2026 - 5:25 PM  
**Ubicación:** `MEJORAS/implementacion-imagenes-storage-boardview-2026-10-09.md`

---

## 1. Resumen de Problemas Resueltos

1. **Error de Límite de Tamaño (1 MB):**
   * *Causa:* Las imágenes subidas se convertían a strings base64 gigantes (`data:image/webp;base64,...`) y se guardaban directamente dentro del documento del modelo en Firestore. Firestore tiene un límite estricto de **1 MB por documento**, provocando fallos al guardar modelos con fotos de alta resolución.
   * *Solución:* Se migró el almacenamiento a **Firebase Storage**, guardando únicamente la URL pública corta (`https://firebasestorage...`) en Firestore.

2. **Falta de Botón para Eliminar Imágenes:**
   * *Causa:* Solo existía el botón "Predet." (para Cara A), pero no existía forma de borrar imágenes personalizadas de Cara B ni de diagramas esquemáticos.
   * *Solución:* Se incorporó el botón **🗑️ Eliminar** tanto en la barra de Placa (Cara A y Cara B) como en la barra de Esquema, con confirmación previa y eliminación física del archivo en la nube.

3. **Dependencia y Riesgo de PostImages:**
   * Al contar con Firebase Storage propio con 5 GB gratuitos (~20,000 imágenes), ya no hay dependencia de servidores externos que puedan caerse o bloquear enlaces.

4. **Migración Transparente de Datos Antiguos ("Lazy Migration"):**
   * Los modelos existentes con imágenes en base64 se detectan y migran automáticamente a Firebase Storage al momento de guardarse, aligerando el documento de ~900 KB a menos de 5 KB sin intervención manual.

---

## 2. Archivos Creados y Modificados

### A. `firebase.js`
* Se importó `getStorage` de `firebase/storage`.
* Se inicializó y exportó la instancia `storage`.

### B. `lib/storageHelper.js` (Nuevo Módulo)
* `optimizarYComprimirImagen(file, maxDim, maxBytes)`: Compresión adaptativa con HTML5 Canvas en formato WebP que garantiza archivos ligeros (< 350 KB) manteniendo resolución nítida de hasta 1920px Full HD.
* `subirImagenStorage(blobOFile, rutaDestino)`: Subida con `uploadBytes` y obtención de URL de descarga pública con caché configurada.
* `eliminarImagenStorage(urlOPath)`: Borrado seguro mediante `deleteObject`, ignorando URLs externas o archivos predeterminados.
* `sanitizarYMigrarModeloAStorage(modelo)`: Escaneo y conversión automática de cualquier imagen base64 encontrada en el modelo a Firebase Storage.

### C. `components/VisorMapeoPCB.js`
* Integración de `optimizarYComprimirImagen` y `subirImagenStorage` en `manejarArchivoImagenPlaca` y `manejarArchivoImagenEsquema`.
* Limpieza automática de la imagen anterior en Storage para evitar archivos huérfanos.
* Incorporación de funciones `eliminarFotoPlaca()` y `eliminarFotoEsquema()`.
* Añadidos botones **🗑️ Eliminar** estilizados en rojo para Cara A, Cara B y Esquemas, con estados de carga (`Subiendo...`, `Borrando...`).

### D. `pages/index.js`
* En `guardarModeloActualDB()`, se conectó `sanitizarYMigrarModeloAStorage()` antes de persistir en Firestore.
* Se agregó validación y advertencia preventiva de tamaño (> 950 KB) ante el límite de Firestore.

---

## 3. Configuración Requerida en la Consola de Firebase

Para que la subida funcione correctamente con tus usuarios autenticados, copia estas reglas en la consola de Firebase:
👉 **Firebase Console ➔ Build ➔ Storage ➔ Pestaña "Rules" (Reglas)**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /boardview/{allPaths=**} {
      // 1. Lectura pública: permite a cualquier técnico ver fotos y esquemas rápidamente
      allow read: if true;

      // 2. Escritura y eliminación: solo usuarios autenticados en Marshall Cell
      allow write, delete: if request.auth != null;
    }
  }
}
```
