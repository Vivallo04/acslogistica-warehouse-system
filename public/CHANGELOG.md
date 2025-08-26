# ¿Qué hay de nuevo?

Todas las mejoras y novedades del Sistema de Gestión de Almacén serán documentadas aquí.

## [0.3.12] - 22 de agosto de 2025

### 🔧 Correcciones
- **Búsqueda de tracking mejorada**: Ahora usa los últimos 6 dígitos para coincidencias parciales, haciendo la búsqueda más rápida y precisa
- **Prevención robusta de CI duplicados**: Sistema mejorado con reintentos y verificación para prevenir duplicación de números CI entre WMS y Drupal
- **Corrección de contenido persistente**: Se corrigió el problema donde el contenido del paquete anterior aparecía después de procesar

### ✨ Mejoras
- **Mejor manejo de conflictos CI**: El sistema ahora detecta y resuelve automáticamente conflictos de numeración CI con reintentos inteligentes
- **Búsqueda más eficiente**: Las coincidencias parciales ahora se enfocan en los últimos dígitos del tracking para mejor rendimiento
- **Experiencia de usuario mejorada**: Los campos del formulario ahora se limpian correctamente después de cada procesamiento exitoso

## [0.3.11] - 20 de agosto de 2025

### 🔧 Correcciones
- **Preservación de selección de tarima**: Se corrigió el problema donde el número de tarima se borraba al escanear un tracking que encontraba un paquete existente


### ✨ Mejoras
- **Opciones de tarima extendidas**: Ahora incluye tanto las tarimas de hoy como las de mañana para facilitar la planificación avanzada
- **Mejor experiencia de usuario**: La selección de tarima se mantiene durante las búsquedas de tracking para evitar pérdida de datos

## [0.3.10] - 19 de agosto de 2025

### 🔧 Correcciones críticas
- **Eliminación DEFINITIVA de CI duplicados**: Se implementó un sistema de reserva atómica que maneja secuencias no consecutivas y gaps en numeración

## [0.3.9] - 19 de agosto de 2025

### ✨ Mejoras de flujo de trabajo
- **Enfoque automático en campo peso**: Después de procesar un paquete, el campo peso se enfoca automáticamente para entrada rápida de datos

## [0.3.8] - 19 de agosto de 2025

### 🔧 Correcciones críticas
- **Peso visible en Drupal para todos los paquetes**: Se corrigió el problema donde el peso no aparecía en las vistas de Drupal para paquetes creados desde el backend API
- **Campo de unidad de peso completado**: Ahora todos los paquetes incluyen tanto el número del peso como la unidad (kg) para renderizado correcto en Drupal
- **Compatibilidad completa con campo Weight de Drupal**: Los paquetes creados por el API ahora son indistinguibles de los creados directamente en Drupal

## [0.3.7] - 15 de agosto de 2025

### 🔧 Correcciones críticas
- **Paquetes sin usuario ahora visibles**: Se corrigió el problema donde los paquetes sin "creado por" no aparecían en el Recibidor de Miami
- **Inclusión completa de paquetes**: Todos los paquetes ahora se muestran, incluyendo aquellos sin usuario asignado (uid = 0 o NULL)

## [0.3.6] - 15 de agosto de 2025

### 🔧 Correcciones críticas
- **Peso y datos visibles en Drupal**: Se corrigió el problema donde el peso y otros campos no aparecían en las vistas de Drupal
- **Fechas visibles en Drupal**: Se corrigió el problema donde las fechas de creación no aparecían en las vistas de Drupal
- **Visibilidad completa en Drupal**: Todos los campos (peso, tracking, tarima, contenido) ahora se muestran correctamente en las vistas de Drupal

## [0.3.5] - 14 de agosto de 2025

### 🆕 Nuevas funciones
- **Búsqueda automática de paquetes prealertados**: El sistema ahora busca automáticamente si un paquete ya existe antes de crear uno nuevo
- **Actualización inteligente de contenido**: El contenido prealertado se preserva y solo se actualiza si estaba vacío
- **Notificaciones específicas por acción**: Diferentes mensajes según si el paquete es nuevo, actualizado o cambió de estado

### ✨ Mejoras
- **Procesamiento más inteligente**: El sistema detecta automáticamente paquetes prealertados y los actualiza en lugar de crear duplicados
- **Mejor manejo de tracking duplicado**: Ahora puedes actualizar paquetes con el mismo número de tracking sin errores
- **Mensajes más claros**: Las notificaciones indican exactamente qué pasó con cada paquete (nuevo, actualizado o cambio de estado)
### 🔧 Correcciones
- **Tracking idéntico permitido**: Se corrigió el error que impedía actualizar paquetes con el mismo número de tracking
- **Preservación de contenido**: El contenido prealertado ya no se sobrescribe al actualizar el paquete
- **Actualización selectiva**: Solo se actualizan los campos necesarios, preservando la información existente

## [0.3.4] - 14 de agosto de 2025

### 🔧 Correcciones críticas
- **Números CI únicos garantizados**: Se corrigió un problema crítico donde el sistema podía generar números CI duplicados cuando varias personas procesaban paquetes al mismo tiempo
- **Sincronización perfecta con Drupal**: El sistema ahora está completamente sincronizado con Drupal para evitar conflictos de numeración
- **Peso mínimo automático**: Si ingresas un peso menor a 0.0950 kg, el sistema automáticamente lo corrige al mínimo permitido

### ✨ Mejoras
- **Generación de CI más confiable**: El sistema ahora usa un método más robusto que garantiza que cada paquete tenga un número único
- **Validación de peso mejorada**: El campo de peso ahora valida y normaliza automáticamente cuando ingresas 4 decimales
- **Mayor estabilidad**: Se eliminaron condiciones de carrera que podían causar errores al procesar paquetes simultáneamente

## [0.3.3] - 11 de agosto de 2025

### ✨ Mejoras
- **Sistema de notificaciones mejorado**: Ahora verás una pequeña marca azul cuando hay nuevas funciones disponibles
- **Interfaz más sutil**: Los indicadores visuales son ahora más elegantes y menos intrusivos
- **Mejor experiencia visual**: El sistema usa colores más consistentes en todos los elementos

## [0.3.2] - 11 de agosto de 2025

### 🆕 Nuevas funciones
- **Confirmaciones más claras**: Ahora cuando cambias el estado de paquetes, aparece una ventana de confirmación más fácil de usar en lugar del mensaje simple del navegador
- **Mejor experiencia en móviles**: Todos los mensajes de confirmación se ven perfecto tanto en computadoras como en celulares
- **Colores más consistentes**: Todos los botones y ventanas ahora usan los mismos colores del sistema para una experiencia más unificada

### ✨ Mejoras
- **Navegación más intuitiva**: Los diálogos y ventanas son más fáciles de usar y navegar
- **Mejor rendimiento**: Las ventanas cargan más rápido y responden mejor
- **Confirmaciones más seguras**: Antes de hacer cambios importantes, el sistema te pregunta de manera más clara

## [0.3.1] - 11 de agosto de 2025

### 🆕 Nuevas funciones  
- **Navegación automática inteligente**: Cuando usas la báscula para pesar paquetes, el sistema automáticamente te lleva al siguiente campo para que no tengas que hacer clic
- **Detección de báscula**: El sistema reconoce cuando el peso viene de una báscula profesional y te ayuda a navegar más rápido
- **Instrucciones en español**: Todas las instrucciones de impresión están ahora completamente en español

### ✨ Mejoras
- **Entrada de datos más rápida**: El formulario de pre-registro es más rápido de llenar
- **Mejor flujo de trabajo**: Los campos se enfocan automáticamente para acelerar tu trabajo
- **Interfaz más intuitiva**: Todo está diseñado para ser más fácil de entender y usar

## [0.3.0] - 8 de agosto de 2025  

### 🆕 Nuevas funciones
- **Control de cola de impresión**: Ahora puedes decidir si los documentos se agregan automáticamente a la cola de impresión o si prefieres hacerlo manualmente
- **Configuración personalizable**: Puedes activar o desactivar la impresión automática según tus preferencias
- **Botones más modernos**: Todos los botones tienen un diseño más redondeado y moderno

### ✨ Mejoras  
- **Mejor indicación visual**: Cuando la impresión automática está desactivada, te aparece una etiqueta que dice "Manual"
- **Menos interrupciones**: Eliminamos las notificaciones molestas que aparecían al abrir los diálogos de configuración
- **Control mejorado**: La impresión automática ahora funciona solo cuando tú lo decides

### 🔧 Correcciones
- **Sin notificaciones no deseadas**: Ya no aparecen mensajes innecesarios sobre impresoras cuando abres la configuración
- **Mejor control de impresión**: La cola de impresión funciona correctamente según tu configuración

## [0.2.0] - 7 de agosto de 2025

### 🆕 Nuevas funciones
- **Sistema de impresión profesional**: Integración completa con JSPrintManager para imprimir documentos de manera profesional
- **Detección automática de impresoras**: El sistema encuentra automáticamente todas las impresoras disponibles en tu red
- **Cola de impresión avanzada**: Puedes ver el estado de todos tus documentos en cola y manejarlos individualmente
- **Configuración por pestañas**: Interfaz organizada con pestañas para configurar diferentes aspectos del sistema
- **Descarga directa**: Puedes descargar e instalar JSPrintManager directamente desde la aplicación

### ✨ Mejoras
- **Interfaz reorganizada**: Los diálogos de impresora están mejor organizados y son más fáciles de usar
- **Configuración centralizada**: Todas las opciones de impresora están en un solo lugar
- **Cola visible solo cuando necesites**: La cola de impresión se muestra únicamente cuando haces clic en el botón correspondiente

## [0.1.0] - 6 de agosto de 2025

### 🆕 Sistema inicial
- **Sistema de Gestión de Almacén (WMS)**: Lanzamiento inicial del sistema completo
- **Pre-registro de paquetes**: Módulo para registrar paquetes de manera rápida y eficiente
- **Recibidor de Miami**: Módulo especializado para gestionar paquetes que llegan de Miami
- **Sistema de usuarios**: Control de acceso con diferentes niveles de permisos
- **Integración con base de datos**: Conexión completa con el sistema existente
- **Documentos CI**: Generación automática de documentos de identificación de paquetes

### 🔧 Características principales
- **Escaneo de códigos de barras**: Soporte completo para lectores de códigos
- **Validación inteligente**: Prevención de números de seguimiento duplicados
- **Seguimiento completo**: Control del estado de paquetes en todo el proceso
- **Procesamiento por lotes**: Capacidad de procesar múltiples paquetes a la vez
- **Registro en tiempo real**: Toda la información se guarda instantáneamente

---

## Símbolos utilizados
- 🆕 **Nuevas funciones**: Características completamente nuevas
- ✨ **Mejoras**: Funciones existentes que funcionan mejor  
- 🔧 **Correcciones**: Problemas que fueron solucionados
- ❌ **Removido**: Funciones que ya no están disponibles

## Sobre las versiones
- **0.x.x**: El sistema está en desarrollo y pruebas
- **1.0.0**: Primera versión completamente estable (próximamente)

*Estamos trabajando constantemente para mejorar tu experiencia. ¡Gracias por usar el sistema!*