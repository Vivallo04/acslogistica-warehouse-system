# Changelog

Todas las mejoras notables de este proyecto serán documentadas en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto se adhiere al [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-08-07

### Agregado
- **Actualización masiva de paquetes** en Recibidor de Miami
  - Selecciona múltiples paquetes y cambia su estado de una vez
  - Cambiar paquetes de "Vuelo Asignado" a "En Aduana" automáticamente  
  - Botón "Acciones" con opciones para operaciones grupales
  - Solo se actualizan paquetes que tienen el estado correcto
- **Generación automática de documentos CI**
  - Los paquetes procesados generan automáticamente su documento CI
  - Descarga directa de PDFs desde el sistema
  - Integración completa con el servicio de impresión
- **Historial de sesión mejorado**
  - Todos los paquetes procesados se guardan automáticamente en el historial
  - Ver detalles completos de cada paquete registrado
  - Exportar historial de trabajo a archivo CSV

### Mejorado  
- **Experiencia en Recibidor de Miami** más eficiente
  - Interfaz más clara para seleccionar múltiples paquetes
  - Confirmación antes de realizar cambios masivos
  - Contador que muestra cuántos paquetes se pueden actualizar
- **Mensajes de error más claros**
  - Explicaciones específicas cuando algo no se puede procesar
  - Información detallada sobre paquetes que no se pudieron actualizar
  - Recuperación automática si solo algunos paquetes fallan

### Removido
- **Funciones temporalmente deshabilitadas** por mantenimiento del sistema
  - Modo de procesamiento por lotes (Tecla F3)
  - Escaneo rápido de códigos (Tecla F2)  
  - Impresión de etiquetas (Tecla F4)
  - Generación de reportes (Tecla F5)
  - Panel de configuración
  - Sincronización automática de datos

### Corregido
- **Botones ahora muestran texto** correctamente en pantallas pequeñas y grandes
- **Teclas de función F2-F6** completamente desactivadas durante mantenimiento
- **Interfaz más consistente** para elementos que están temporalmente deshabilitados
- **Mejor rendimiento** al cargar y mostrar información de paquetes

## [1.0.2] - 2025-08-05

### Agregado
- **Botón "What's New"** en la barra lateral para mostrar actualizaciones de versiones
- **Campo Peso obligatorio** en el formulario de pre-registro
- **Nuevo orden de campos** en pre-registro: Peso, Casillero, Contenido, Tracking, Tarima

### Mejorado
- **Interfaz de usuario** más intuitiva en el pre-registro
- **Validación mejorada** de formularios
- **Experiencia de usuario** optimizada

## [1.0.1] - 2025-01-07

### Corregido
- **Búsqueda debounced mejorada** con mejor rendimiento y UX
- **Problema de re-renderizado infinito** en filtros de búsqueda
- **Carga inicial** ahora muestra paquetes de los últimos 45 días
- **Filtros avanzados** con mejor funcionalidad de tarima y cliente

### Mejorado
- **Timeout de búsqueda** aumentado a 800ms para mejor experiencia
- **Indicadores de carga** más claros durante búsquedas

## [1.0.0] - 2025-01-01

### Agregado
- **Sistema de gestión de almacén (WMS)** inicial
- **Módulo Pre-Registro** para registro rápido de paquetes
- **Módulo Recibidor de Miami** para gestión de paquetes
- **Autenticación** con roles de usuario
- **Integración** con base de datos Drupal existente
- **Sistema de roles** (super_admin, manager, pending)
- **Filtros avanzados** y búsqueda
- **Modo batch** para procesamiento masivo
- **Escaneo de códigos de barras**

---

## Tipos de cambios
- **Agregado** para nuevas funcionalidades
- **Cambiado** para cambios en funcionalidades existentes
- **Obsoleto** para funcionalidades que serán removidas pronto
- **Removido** para funcionalidades removidas
- **Corregido** para correcciones de bugs
- **Seguridad** para vulnerabilidades