# Feature Specification: Sistema de Analisis y Postulacion Multi-sitio para Ganar Proyectos

**Feature Branch**: `[001-project-analysis]`  
**Created**: 2026-05-04  
**Status**: Draft  
**Input**: User description: "Quiero un sistema que analice las paginas de proyecto como postule a proyecto y gane las postulaciones segun como son las reglas del sitios cada sitio tiene reglas de postulacion a proyectos"

## Clarifications

### Session 2026-05-04

- Q: ¿Qué modelo de autenticación se requiere para operar en distintos sitios? → A: Múltiples logins por sitio con reglas de asignación por perfil/cuenta.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ingesta de Ofertas como Fuente Primaria (Priority: P1)

Como operador de AutoApply Hub, quiero que el sistema ingiera y normalice ofertas desde paginas/listados de proyectos de cada sitio para tener un backlog accionable y comparable.

**Why this priority**: Sin una fuente primaria de ofertas confiable no existe base para analizar ni postular; bloquea todo el objetivo de victoria.

**Independent Test**: Puede probarse de forma independiente al cargar una muestra de ofertas desde dos sitios distintos y verificar que se almacenan sin perder informacion clave del anuncio.

**Acceptance Scenarios**:

1. **Given** que existen ofertas publicadas en multiples sitios, **When** se ejecuta la ingesta, **Then** el sistema registra cada oferta con identificador de origen, fecha y atributos principales del proyecto.
2. **Given** que una oferta ya fue ingerida antes, **When** se detecta nuevamente en una corrida posterior, **Then** el sistema evita duplicarla y conserva trazabilidad de actualizacion.

---

### User Story 2 - Analisis Multi-sitio por Reglas de Postulacion (Priority: P1)

Como operador, quiero que cada oferta sea analizada segun reglas especificas del sitio para estimar probabilidad de ganar y definir si conviene postular.

**Why this priority**: Es la capacidad central para convertir datos en decisiones de alto impacto sobre tasa de adjudicacion.

**Independent Test**: Puede validarse con un conjunto de ofertas de prueba donde cada sitio tiene reglas distintas y confirmar que el resultado de analisis cambia segun dichas reglas.

**Acceptance Scenarios**:

1. **Given** una oferta con metadatos completos, **When** se aplica el motor de analisis del sitio correspondiente, **Then** se genera una puntuacion de oportunidad y una explicacion resumida de por que postular o descartar.
2. **Given** que una regla de un sitio cambia, **When** se actualiza el catalogo de reglas, **Then** el sistema reevalua las ofertas pendientes bajo la nueva logica.

---

### User Story 3 - Estrategia de Postulacion por Sitio y Costo Minimo (Priority: P1)

Como operador, quiero que el sistema proponga una estrategia de postulacion por sitio (mensaje, timing, precio) orientada a maximizar victoria con costo minimo.

**Why this priority**: Conecta directamente los principios de Objetivo de Victoria y Costo Minimo en decisiones concretas de cada postulacion.

**Independent Test**: Se prueba ejecutando la generacion de estrategia para una oferta elegible y verificando que la propuesta respeta reglas del sitio, presupuesto objetivo y umbral minimo de costo.

**Acceptance Scenarios**:

1. **Given** una oferta apta para postular, **When** se genera estrategia, **Then** el sistema produce una recomendacion de precio y enfoque de propuesta alineados a reglas del sitio y objetivo de adjudicacion.
2. **Given** que el modo por defecto es simulacion, **When** se programa una postulacion, **Then** el sistema la marca como simulada salvo activacion explicita de envio real.
3. **Given** que existen multiples cuentas por sitio, **When** se prepara una postulacion, **Then** el sistema selecciona el perfil de login segun reglas de asignacion vigentes para ese sitio.

---

### User Story 4 - Seguimiento de Resultados y Aprendizaje Continuo (Priority: P2)

Como operador, quiero monitorear resultados de postulaciones (ganada, rechazada, sin respuesta) para retroalimentar reglas y mejorar la tasa de exito futura.

**Why this priority**: Permite mejora sostenida del sistema y evita repetir estrategias ineficaces.

**Independent Test**: Puede evaluarse registrando resultados reales/simulados de una tanda de postulaciones y verificando que se ajustan recomendaciones futuras con base en desempeño historico.

**Acceptance Scenarios**:

1. **Given** postulaciones con resultado conocido, **When** se ejecuta el ciclo de aprendizaje, **Then** el sistema actualiza señales de calidad y priorizacion para futuras oportunidades similares.
2. **Given** una oferta perdida por incumplimiento de regla del sitio, **When** se analiza el resultado, **Then** el sistema registra la causa y previene repetir el mismo tipo de error.

### Edge Cases

- Fallo de postulacion por error temporal del sitio durante ventana de cierre; el sistema debe reintentar dentro de politicas permitidas y dejar evidencia del intento.
- Cambio no anunciado en reglas del sitio que invalida una estrategia previamente valida; el sistema debe desactivar temporalmente esa estrategia hasta nueva validacion.
- Ofertas duplicadas entre distintas fuentes o republicadas con cambios menores; el sistema debe consolidar sin perder historial.
- Ofertas con informacion incompleta (presupuesto, plazo o requisitos ambiguos); el sistema debe clasificarlas con menor confianza y evitar envio automatico real.
- Resultados tardios o inexistentes (sin respuesta prolongada); el sistema debe cerrar estado por politica de vencimiento definida y mantenerlo como dato de aprendizaje.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE tratar paginas/listados de ofertas de proyecto como fuente primaria de datos para el ciclo completo de analisis y postulacion; priorizando APIs oficiales cuando existan y aplicando scraping responsable como fallback (ver FR-013).
- **FR-002**: El sistema DEBE identificar para cada oferta su sitio de origen, estado, fecha de publicacion y atributos clave para toma de decision.
- **FR-003**: El sistema DEBE deduplicar ofertas repetidas del mismo sitio y consolidar equivalencias entre sitios cuando describan la misma oportunidad.
- **FR-004**: El sistema DEBE mantener un catalogo versionado de reglas de postulacion por sitio y usarlo en cada evaluacion.
- **FR-005**: El sistema DEBE analizar cada oferta con criterios multi-sitio y producir una puntuacion de oportunidad con justificacion legible para negocio.
- **FR-006**: El sistema DEBE recomendar estrategia de postulacion por sitio incluyendo enfoque de propuesta, rango de precio y momento sugerido de envio.
- **FR-007**: El sistema DEBE priorizar estrategias que maximicen probabilidad de ganar minimizando costo de postulacion, respetando umbrales minimos definidos por capacidad/skill.
- **FR-008**: El sistema DEBE operar en modo simulacion por defecto y requerir habilitacion explicita para postulaciones reales.
- **FR-009**: El sistema DEBE validar cumplimiento de reglas del sitio antes de cada envio para reducir rechazos por formato, tiempos o requisitos.
- **FR-010**: El sistema DEBE registrar cada intento de postulacion (simulado o real), incluyendo estrategia usada, costo ofertado y resultado observado.
- **FR-011**: El sistema DEBE capturar resultados finales (ganada, rechazada, sin respuesta) y causas de fallo cuando esten disponibles.
- **FR-012**: El sistema DEBE ejecutar un bucle de retroalimentacion que ajuste analisis y estrategias futuras segun resultados historicos.
- **FR-013**: El sistema DEBE priorizar el uso de fuentes oficiales cuando existan y aplicar recoleccion responsable en fuentes no oficiales.
- **FR-014**: El sistema DEBE exponer trazabilidad de decisiones para auditoria operativa (por que se postulo, por que se descarto, por que se ajusto precio).
- **FR-015**: El sistema DEBE soportar multiples cuentas de login por cada sitio y seleccionar una cuenta segun reglas de asignacion por perfil.
- **FR-016**: El sistema DEBE registrar que cuenta/perfil de sitio fue usada en cada intento de postulacion para fines de auditoria y aprendizaje.

### Key Entities *(include if feature involves data)*

- **OfertaProyecto**: Oportunidad publicada en un sitio; incluye origen, titulo, descripcion, presupuesto, plazo, skills, fecha y estado.
- **ReglaSitio**: Conjunto de reglas de postulacion vigentes por plataforma; incluye version, condiciones, restricciones y criterios de cumplimiento.
- **AnalisisOferta**: Resultado de evaluar una oferta segun reglas y señales historicas; incluye puntuacion de oportunidad, confianza y razones.
- **EstrategiaPostulacion**: Propuesta concreta para competir en una oferta; incluye posicionamiento, precio recomendado, prioridad y ventana de envio.
- **IntentoPostulacion**: Registro de una accion de postulacion (simulada o real) con estrategia aplicada, momento, costo y estado operativo.
- **ResultadoPostulacion**: Resultado de negocio de una postulacion; incluye estado final, causa y valor de aprendizaje.
- **PerfilOperativo**: Parametros de costo minimo, capacidades y limites de riesgo usados para tomar decisiones.
- **CuentaSitio**: Credenciales y estado operativo de una cuenta en un sitio especifico; incluye sitio, identificador de cuenta, permisos y disponibilidad.
- **ReglaAsignacionCuenta**: Regla que define que cuenta/perfil usar por sitio segun criterios de oferta, riesgo y estrategia.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al menos 95% de las ofertas detectadas en las fuentes configuradas quedan ingeridas y disponibles para analisis en menos de 10 minutos desde su deteccion.
- **SC-002**: Al menos 90% de las postulaciones generadas cumplen reglas del sitio en el primer intento, reduciendo rechazos por incumplimiento formal.
- **SC-003**: La tasa de adjudicacion mejora al menos 20% dentro de los primeros 3 ciclos mensuales frente a la linea base inicial.
- **SC-004**: El costo promedio ofertado por postulacion ganada se reduce al menos 15% sin disminuir la tasa de adjudicacion.
- **SC-005**: Al menos 85% de las decisiones de postular o descartar tienen justificacion trazable y comprensible para revision de negocio.
- **SC-006**: Al menos 80% de las oportunidades similares a casos historicamente ganados reciben prioridad alta en nuevas rondas de analisis.

## Assumptions

- Las plataformas objetivo permiten acceso legitimo a sus ofertas mediante API oficial o consulta responsable de informacion publica.
- El operador define politicas de costo minimo y umbrales de riesgo para habilitar recomendaciones consistentes.
- La activacion de postulaciones reales requiere consentimiento explicito del operador en cada entorno.
- Existe capacidad operativa para registrar resultados de postulacion de forma periodica y alimentar el aprendizaje.
- El alcance de esta feature cubre ingesta, analisis, estrategia y seguimiento; la ejecucion contractual posterior a la adjudicacion esta fuera de alcance.
