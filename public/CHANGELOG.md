# Changelog

Todas las mejoras notables de este proyecto serán documentadas en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto se adhiere al [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- **Carga inicial** ahora muestra paquetes de los últimos 45 días correctamente
- **Filtros avanzados** con mejor funcionalidad de tarima y cliente

### Mejorado
- **Timeout de búsqueda** aumentado a 800ms para mejor experiencia
- **Indicadores de carga** más claros durante búsquedas
- **Cancelación de peticiones** para evitar resultados desactualizados

## [1.0.0] - 2025-01-01

### Agregado
- **Sistema de gestión de almacén (WMS)** inicial
- **Módulo Pre-Registro** para registro rápido de paquetes
- **Módulo Recibidor de Miami** para gestión de paquetes
- **Autenticación Firebase** con roles de usuario
- **Integración MySQL** con base de datos Drupal existente
- **Interfaz responsive** con Tailwind CSS y shadcn/ui
- **Dashboard principal** con métricas básicas
- **Gestión de paquetes** completa
- **Sistema de roles** (super_admin, manager, pending)
- **Filtros avanzados** y búsqueda
- **Modo batch** para procesamiento masivo
- **Escaneo de códigos de barras**
- **Integración IA** para reconocimiento de contenido
- **Exportación de datos** en múltiples formatos

---

## Tipos de cambios
- **Agregado** para nuevas funcionalidades
- **Cambiado** para cambios en funcionalidades existentes
- **Obsoleto** para funcionalidades que serán removidas pronto
- **Removido** para funcionalidades removidas
- **Corregido** para correcciones de bugs
- **Seguridad** para vulnerabilidades