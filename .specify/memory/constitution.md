<!--
  Sync Impact Report
  ===================
  Version change: 1.1.0 → 1.2.0
  Modified principles:
    - VII. TypeScript-First: añadido Liquibase como herramienta
      obligatoria de migraciones
  Added sections:
    - Estándares PostgreSQL (nueva sección con mejores prácticas
      de estructura de datos)
    - Integraciones API y Bruno (nueva sección para estructura
      de conexión y validación de APIs)
  Removed sections: N/A
  Modified sections:
    - VII. TypeScript-First: añadido estándar de colecciones Bruno
      para integraciones HTTP
    - Flujo de Desarrollo: integración de validación API con Bruno
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ compatible
    - .specify/templates/spec-template.md ✅ compatible
    - .specify/templates/tasks-template.md ✅ compatible
  Follow-up TODOs: ninguno
-->

# AutoApply Hub Constitution

## Core Principles

### I. Objetivo de Victoria (NON-NEGOTIABLE)

El único objetivo del sistema es **ganar postulaciones** en sitios de
freelance y licitaciones públicas. Cada decisión de diseño, cada
feature y cada optimización DEBE orientarse a maximizar la tasa de
éxito en postulaciones reales.

- Toda funcionalidad DEBE justificarse por su impacto directo o
  indirecto en la probabilidad de ganar una postulación.
- Métricas de éxito: tasa de adjudicación, tiempo de respuesta,
  calidad de propuestas generadas.
- Funcionalidad que no contribuya al objetivo DEBE ser descartada
  o diferida.

### II. Seguridad de Credenciales (NON-NEGOTIABLE)

NINGUNA clave, token, contraseña o credencial DEBE estar
hardcodeada en el código fuente, archivos de configuración
commiteados ni imágenes Docker.

- Todo secreto DEBE cargarse desde variables de entorno (`.env`)
  o un servicio de vault.
- El archivo `.env` DEBE estar en `.gitignore` sin excepciones.
- `.env.example` DEBE existir con valores placeholder, nunca
  credenciales reales.
- CI/CD DEBE usar secrets del proveedor (Railway, GitHub Actions),
  nunca variables inline en scripts.

### III. Scraping Ético

Todo scraping DEBE respetar las políticas del sitio objetivo y
prácticas de scraping responsable.

- DEBE verificar `robots.txt` antes de scrapear cualquier dominio.
- DEBE identificarse con `SCRAPER_USER_AGENT` y email de contacto.
- Rate limiting obligatorio: 1-2 requests/segundo por dominio.
- Backoff exponencial ante respuestas 429 y 5xx.
- DEBE priorizar APIs oficiales (Mercado Público API) sobre
  scraping cuando existan.
- Cachear resultados para reducir requests redundantes.
- Prohibida la rotación de IP que viole TOS de las plataformas.

### IV. Simulación por Defecto

El modo `simulate` es el comportamiento por defecto del sistema.
Postulaciones reales solo se ejecutan con activación explícita.

- `DEFAULT_SIMULATE=true` DEBE ser el valor por defecto.
- Flag `--simulate` registra intento con status `simulated`.
- Flag `--dry-run` muestra payload sin registrar ni enviar.
- Flag `--auto-apply` envía postulaciones reales SOLO con
  consentimiento explícito y credenciales válidas verificadas.
- Todo intento (simulado o real) DEBE registrarse en base de
  datos con timestamp, plantilla usada, precio y resultado.

### V. Costo Mínimo

Las postulaciones DEBEN optimizarse para el menor costo operativo
posible, tanto en precios ofertados como en infraestructura.

- Precios de postulación DEBEN calcularse según la tecnología
  requerida, definida en archivo de configuración o base de datos.
- DEBE existir una tabla o config de tarifas mínimas por
  tecnología/skill que el sistema consulte al generar propuestas.
- Infraestructura DEBE usar tier económico (Railway hobby plan)
  y migrar solo si los costos lo justifican.
- Monitorizar costos de infraestructura mensualmente.

### VI. Aprendizaje Continuo

Si el sistema no gana una postulación, DEBE registrar el resultado,
analizarlo y mejorar sus futuras propuestas.

- Todo intento DEBE registrarse con resultado final (ganado,
  rechazado, sin respuesta) cuando la información esté disponible.
- El dataset de intentos etiquetados alimenta el módulo ML.
- Con <500 intentos etiquetados: usar reglas heurísticas de
  matching (lenguajes, skills, presupuesto).
- Con ≥500 intentos etiquetados: activar modelo predictivo
  (Logistic Regression o XGBoost ligero).
- SHAP DEBE usarse para explicar predicciones y rechazos.
- El ciclo de retroalimentación DEBE ser: intento → resultado →
  etiquetado → reentrenamiento → mejora de propuestas.

### VII. TypeScript-First

Todo el código de producción DEBE ser TypeScript sobre Node.js.
El proyecto DEBE ser containerizado y desplegable en Railway.

- Runtime: Node.js 18+ con TypeScript estricto.
- Build: Dockerfile multi-stage (builder → producción).
- Orquestación local: Docker Compose con PostgreSQL.
- Deploy: Railway con deploy automático desde GitHub en merge
  a `main`.
- Linting: ESLint obligatorio; build DEBE pasar sin errores
  de tipos.
- Estructura: servicios modulares (ingestor, matcher, applier,
  worker, ML service).
- Migraciones de DB DEBEN gestionarse exclusivamente con
  Liquibase (changelogs en formato XML, YAML o SQL).
- Prohibido aplicar DDL manual en producción; toda alteración
  de esquema DEBE pasar por un changelog versionado.
- Cuando exista integración HTTP/API, DEBE mantenerse una
  colección Bruno versionada para documentar requests,
  autenticación y validaciones operativas.

## Integraciones API y Bruno

Si una funcionalidad requiere conexión a APIs (internas o externas),
el proyecto DEBE usar Bruno como estándar de estructura operativa
cuando sea necesario para pruebas y validación manual controlada.

- Las colecciones Bruno DEBEN versionarse en el repositorio bajo
  `bruno/` por dominio de integración.
- Cada endpoint crítico DEBE tener request de referencia, variables
  de entorno y ejemplo de respuesta esperada.
- Flujos de autenticación (token, cookies de sesión, renovación)
  DEBEN documentarse en Bruno sin exponer secretos reales.
- Los secretos usados por Bruno DEBEN provenir de `.env` local o
  secret manager; nunca valores hardcodeados.
- Cambios relevantes de contrato API DEBEN reflejarse en Bruno en
  el mismo PR para evitar deriva entre implementación y operación.
- Bruno complementa tests automatizados: no reemplaza pruebas de
  contrato ni pruebas de integración en CI.

## Estándares PostgreSQL

Toda estructura de datos en PostgreSQL DEBE seguir las mejores
prácticas oficiales del proyecto PostgreSQL.

### Nomenclatura

- Nombres de tablas y columnas DEBEN ser `snake_case` en
  minúsculas. Prohibido usar mayúsculas o camelCase.
- Nombres DEBEN ser descriptivos y en inglés.

### Tipos de datos

- Texto: usar `TEXT` por defecto. Prohibido usar `CHAR(n)`.
  Usar `VARCHAR(n)` solo cuando un límite de longitud sea
  requisito explícito del negocio.
- Timestamps: DEBE usarse `TIMESTAMPTZ` (timestamp with time
  zone) para todo campo temporal. Prohibido usar `TIMESTAMP`
  sin timezone, `TIMETZ` y `CURRENT_TIME`.
- Monetario: DEBE usarse `NUMERIC` para valores monetarios.
  Prohibido usar el tipo `MONEY`.
- Identificadores auto-incrementales: DEBE usarse `GENERATED
  ALWAYS AS IDENTITY`. Prohibido usar `SERIAL`.
- Encoding de la base de datos: DEBE ser `UTF-8`. Prohibido
  usar `SQL_ASCII`.

### Índices y constraints

- Toda tabla DEBE tener una PRIMARY KEY explícita.
- Foreign keys DEBEN declararse con `ON DELETE` y `ON UPDATE`
  explícitos.
- Índices DEBEN crearse para columnas usadas frecuentemente
  en `WHERE`, `JOIN` y `ORDER BY`.
- Índices parciales DEBEN considerarse para filtros frecuentes
  con alta selectividad.

### Consultas

- Prohibido usar `NOT IN` con subqueries; usar `NOT EXISTS`.
- Prohibido usar `BETWEEN` con timestamps; usar `>= AND <`.
- Prohibido usar `RULES`; usar `TRIGGERS` si se necesita
  lógica reactiva.
- Prohibido usar herencia de tablas (`INHERITS`); usar
  foreign keys o particionamiento nativo.

### Migraciones

- Toda migración DEBE gestionarse con Liquibase.
- Changelogs DEBEN versionarse en el repositorio bajo
  `db/changelog/`.
- Cada changeset DEBE tener `id` único, `author`, y
  `rollback` definido.
- Prohibido aplicar DDL manual en producción.
- Liquibase DEBE ejecutarse como paso del CI pipeline antes
  del deploy.

### Autenticación DB

- DEBE usarse `scram-sha-256` para autenticación.
- Prohibido usar `trust` en cualquier conexión TCP/IP.

## Seguridad y Configuración

- Variables de entorno gestionadas exclusivamente vía `.env`
  y secrets del proveedor de deploy.
- PostgreSQL como almacenamiento principal; credenciales de
  DB NUNCA en código.
- Logs de requests y respuestas DEBEN excluir credenciales
  y datos sensibles.
- Backups cifrados con acceso restringido.
- Minimizar datos personales almacenados.
- Endpoint `/health` DEBE validar conectividad a DB y cola
  de jobs.
- Auditar logs de intentos de postulación y cambios de
  configuración.

## Flujo de Desarrollo

- Todo PR DEBE pasar: lint ESLint, build TypeScript sin
  errores, tests unitarios, Docker build exitoso.
- `.env.example` DEBE actualizarse si se agregan nuevas
  variables de entorno.
- Migraciones de DB DEBEN implementarse como changelogs
  Liquibase con rollback definido e incluirse en el PR.
- Todo scraper DEBE incluir verificación de `robots.txt`
  y rate limiting.
- Para integraciones API, el PR DEBE actualizar la colección Bruno
  correspondiente cuando cambien endpoints, headers o payloads.
- CI pipeline: lint → build → test → Liquibase validate →
  Docker build → deploy automático en merge a `main`.
- Commits DEBEN seguir Conventional Commits
  (`feat:`, `fix:`, `docs:`, `chore:`).

## Governance

Esta constitución es el documento rector de AutoApply Hub.
Toda decisión de diseño, implementación y operación DEBE
alinearse con los principios aquí definidos.

- Todo PR DEBE verificar cumplimiento con los principios
  antes de aprobar merge.
- Enmiendas a esta constitución requieren: propuesta
  documentada, justificación del cambio, actualización
  de versión semántica y propagación a plantillas afectadas.
- Política de versionado:
  - MAJOR: eliminación o redefinición incompatible de principios.
  - MINOR: nuevos principios o expansión material de guías.
  - PATCH: correcciones de redacción, typos, clarificaciones.
- Revisión de cumplimiento: al menos una vez por sprint o
  ciclo de desarrollo.

**Version**: 1.2.0 | **Ratified**: 2026-05-04 | **Last Amended**: 2026-05-04
