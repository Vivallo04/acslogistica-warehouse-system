# Registro de Cambios

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto se adhiere al [Versionado Semántico](https://semver.org/spec/v2.0.0.html).

## [Sin liberar]

## [0.3.0] - 2025-08-08

### Agregado
- Funcionalidad de auto-cola para documentos CI con control de activación del usuario
- Control de activación de auto-cola en el diálogo de configuración de cola de impresión
- Propiedad `autoQueueEnabled` a la interfaz PrintSettings (desactivada por defecto)
- Estilo selectivo `rounded-full` para elementos interactivos
- Aplicado `rounded-full` a todos los botones en el Diálogo de Configuración
- Aplicado `rounded-full` a todos los botones en el Diálogo de Cola de Impresión
- Aplicado `rounded-full` a la navegación de pestañas (TabsList y TabsTrigger) en el Diálogo de Configuración

### Cambiado
- Color del botón "Sin Impresoras" cambiado de rojo a amarillo para mejor UX
- CIDocumentViewer ahora respeta la configuración de auto-cola en lugar de siempre agregar documentos automáticamente
- Gestión de estado de configuración de impresión conectada entre diálogos y página principal
- Los indicadores de estado ahora muestran "Auto-cola desactivada" con insignia "Manual" cuando está desactivado
- Estilo de UI: botones y pestañas ahora tienen esquinas completamente redondeadas manteniendo el estilo limpio de tarjetas/inputs

### Solucionado
- Eliminadas notificaciones toast no deseadas al abrir el Diálogo de Configuración
- Eliminados toasts "JSPrintManager No Detectado" y "Error en Búsqueda" al abrir el diálogo
- Funcionalidad de auto-cola ahora controlada correctamente por la configuración del usuario

### Detalles Técnicos
- Interfaz PrintSettings mejorada con propiedad autoQueueEnabled
- Agregado sistema de callbacks para sincronización de configuraciones de impresión entre componentes
- Servicio de detección de impresoras mejorado para reducir notificaciones innecesarias al usuario
- Componentes actualizados con aplicación selectiva de border-radius

## [0.2.0] - 2025-08-07

### Agregado
- Sistema de impresión automática mejorado con integración JSPrintManager
- Capacidades profesionales de detección y gestión de impresoras
- Gestión de cola de impresión con seguimiento de estado
- Diálogo de configuración de impresora con interfaz de pestañas
- Escaneo de impresoras de red y enumeración de impresoras locales
- Integración directa de descarga de JSPrintManager

### Cambiado
- UI de gestión de impresoras reestructurada con diálogos separados
- Configuración de impresora movida a la sección de configuración principal
- Cola de impresión actualizada para mostrar solo al hacer clic en botón

## [0.1.0] - 2025-08-06

### Agregado
- Configuración inicial del WMS (Sistema de Gestión de Almacén)
- Frontend Next.js 15 con TypeScript
- Integración de base de datos MySQL con sistema Drupal existente
- Funcionalidad de pre-registro de paquetes
- Autenticación Firebase con acceso basado en roles
- Capacidades básicas de impresión
- Generación y visualización de documentos CI

### Características
- Registro de paquetes con soporte de escaneo de código de barras
- Validación de número de seguimiento y prevención de duplicados
- Seguimiento de estado de paquetes a través del flujo de trabajo del almacén
- Capacidades de procesamiento por lotes
- Registro de paquetes en tiempo real
- Integración con estructura de base de datos Drupal

---

## Numeración de Versiones

Este proyecto sigue el versionado semántico:
- **0.x.x**: Versiones de prelanzamiento mientras el sistema está en desarrollo y pruebas
- **1.0.0**: Primera versión estable (planeada después de pruebas exhaustivas y validación)
- **Mayor**: Cambios que rompen compatibilidad o adiciones de características significativas
- **Menor**: Nuevas características, mejoras, cambios que no rompen compatibilidad
- **Parche**: Correcciones de errores y pequeñas mejoras

**Nota**: Actualmente estamos en la fase de desarrollo pre-1.0. La versión 1.0.0 será liberada una vez que el sistema esté completamente probado y validado en el entorno de producción.