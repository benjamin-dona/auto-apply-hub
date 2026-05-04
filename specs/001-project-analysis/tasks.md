# Tasks: Sistema de Analisis y Postulacion Multi-sitio para Ganar Proyectos

**Input**: Design documents from `/specs/001-project-analysis/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.yaml, quickstart.md

**Tests**: No se agregan tareas de tests en esta iteración porque la spec no exige enfoque TDD explícito.
**Organization**: Tareas agrupadas por historia de usuario para implementación y validación independiente.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialización del proyecto TypeScript/Node.js y estructura base.

- [ ] T001 Inicializar proyecto Node.js en `package.json`
- [ ] T002 Configurar TypeScript estricto en `tsconfig.json`
- [ ] T003 [P] Configurar scripts base (build/dev/start/lint) en `package.json`
- [ ] T004 [P] Crear estructura inicial de módulos en `src/modules/.gitkeep`
- [ ] T005 [P] Crear estructura de workers en `src/workers/.gitkeep`
- [ ] T006 [P] Configurar variables de entorno base en `.env.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Bases comunes que bloquean todas las historias.

**⚠️ CRITICAL**: Ninguna historia puede iniciar antes de completar esta fase.

- [ ] T007 Configurar changelog maestro de Liquibase en `db/changelog/db.changelog-master.yaml`
- [ ] T008 Crear changeset para entidad `oferta_proyecto` en `db/changelog/changes/001-create-oferta_proyecto.yaml`
- [ ] T009 [P] Crear changeset para entidades de autenticación en `db/changelog/changes/002-create-cuenta-reglas.yaml`
- [ ] T010 [P] Crear changeset para entidades de análisis y estrategia en `db/changelog/changes/003-create-analisis-estrategia.yaml`
- [ ] T011 [P] Crear changeset para entidades de intentos y resultados en `db/changelog/changes/004-create-intentos-resultados.yaml`
- [ ] T011-B [P] Crear changeset para entidad `perfil_operativo` y semilla inicial de tarifas en `db/changelog/changes/005-create-perfil_operativo.yaml`
- [ ] T012 Implementar bootstrap de configuración con validación env en `src/config/env.ts`
- [ ] T013 [P] Implementar logger estructurado con sanitización de secretos en `src/lib/logger.ts`
- [ ] T014 Implementar servidor Fastify y registro de rutas base en `src/api/server.ts`

**Checkpoint**: Fundación lista; US1-US3 pueden avanzar según dependencias funcionales.

---

## Phase 3: User Story 1 - Ingesta de Ofertas como Fuente Primaria (Priority: P1) 🎯 MVP

**Goal**: Ingerir, normalizar y deduplicar ofertas multi-sitio.

**Independent Test**: Ejecutar ingesta sobre dos sitios y confirmar persistencia deduplicada por `(source_site, source_offer_id)`.

### Implementation for User Story 1

- [ ] T015 [P] [US1] Implementar conector Mercado Público en `src/modules/ingestion/connectors/mercadopublico.connector.ts`
- [ ] T016 [P] [US1] Implementar conector Workana con scraping ético en `src/modules/ingestion/connectors/workana.connector.ts`
- [ ] T017 [US1] Implementar normalizador de ofertas multi-sitio en `src/modules/ingestion/offer-normalizer.service.ts`
- [ ] T018 [US1] Implementar repositorio de ofertas y deduplicación en `src/modules/ingestion/offer-repository.ts`
- [ ] T019 [US1] Implementar worker de ingesta programada en `src/workers/ingest.worker.ts`
- [ ] T020 [US1] Exponer endpoint de ingesta `POST /offers/ingest` en `src/api/routes/offers-ingest.route.ts`
- [ ] T021 [US1] Registrar métricas de ingesta y duplicados en `src/modules/ingestion/ingest-metrics.service.ts`

**Checkpoint**: US1 funcional y validable de forma independiente.

---

## Phase 4: User Story 2 - Analisis Multi-sitio por Reglas de Postulacion (Priority: P1)

**Goal**: Analizar ofertas por reglas de cada sitio y generar score explicable.

**Independent Test**: Cargar reglas por sitio y verificar que la misma oferta recibe resultados distintos según plataforma/regla.

### Implementation for User Story 2

- [ ] T022 [P] [US2] Implementar catálogo versionado de reglas por sitio en `src/modules/analysis/rule-catalog.service.ts`
- [ ] T023 [P] [US2] Implementar validador de cumplimiento de reglas en `src/modules/analysis/rule-compliance.service.ts`
- [ ] T024 [US2] Implementar scoring de oportunidad con confianza en `src/modules/analysis/opportunity-scoring.service.ts`
- [ ] T025 [US2] Implementar ensamblado de razones explicables en `src/modules/analysis/analysis-explainer.service.ts`
- [ ] T025-B [US2] Implementar servicio de auditoría de decisiones (por qué postular/descartar/ajustar precio) en `src/modules/analysis/decision-audit.service.ts`
- [ ] T026 [US2] Implementar worker de análisis de ofertas en `src/workers/analyze.worker.ts`
- [ ] T027 [US2] Exponer endpoint de análisis `POST /offers/{offerId}/analyze` en `src/api/routes/offers-analyze.route.ts`

**Checkpoint**: US2 funcional y validable sin ejecutar postulación.

---

## Phase 5: User Story 3 - Estrategia de Postulacion por Sitio y Costo Minimo (Priority: P1)

**Goal**: Generar estrategia de postulación y ejecutar envíos en modo simulado/real con cuenta asignada.

**Independent Test**: Generar estrategia para oferta elegible, seleccionar cuenta por regla, ejecutar `simulate` y registrar intento.

### Implementation for User Story 3

- [ ] T028 [P] [US3] Implementar servicio de sesiones por sitio en `src/modules/auth/site-session.service.ts`
- [ ] T029 [P] [US3] Implementar asignación de cuenta por regla en `src/modules/auth/account-assignment.service.ts`
- [ ] T030 [US3] Implementar generador de estrategia (precio/timing/mensaje) con consulta a `perfil_operativo` en `src/modules/analysis/strategy-builder.service.ts`
- [ ] T031 [US3] Implementar envío simulado de postulaciones en `src/modules/apply/simulate-apply.service.ts`
- [ ] T031-B [US3] Invocar T023 rule-compliance-check como pre-check en simulate-apply y real-apply antes de cada envío en `src/modules/apply/simulate-apply.service.ts`
- [ ] T032 [US3] Implementar envío real controlado por flag explícito en `src/modules/apply/real-apply.service.ts`
- [ ] T032-B [US3] Implementar política de reintento con backoff exponencial ante fallo temporal en `src/modules/apply/retry-policy.service.ts`
- [ ] T033 [US3] Exponer endpoint `POST /applications/strategy` en `src/api/routes/applications-strategy.route.ts`
- [ ] T034 [US3] Exponer endpoint `POST /applications/submit` con validación de modo en `src/api/routes/applications-submit.route.ts`
- [ ] T034-B [US3] Implementar worker de postulación en `src/workers/apply.worker.ts`

**Checkpoint**: US3 funcional en modo simulación por defecto.

---

## Phase 6: User Story 4 - Seguimiento de Resultados y Aprendizaje Continuo (Priority: P2)

**Goal**: Capturar outcomes y ajustar decisiones futuras.

**Independent Test**: Sincronizar resultados de intentos y comprobar actualización de señales de priorización.

### Implementation for User Story 4

- [ ] T035 [P] [US4] Implementar sincronización de resultados desde sitios en `src/modules/results/outcome-ingestion.service.ts`
- [ ] T036 [P] [US4] Implementar clasificación de causas de fallo en `src/modules/results/failure-reason.service.ts`
- [ ] T037 [US4] Implementar bucle de retroalimentación de reglas y pesos en `src/modules/results/learning-feedback.service.ts`
- [ ] T038 [US4] Implementar actualización de prioridad de oportunidades en `src/modules/results/prioritization-update.service.ts`
- [ ] T039 [US4] Implementar worker de resultados en `src/workers/results.worker.ts`
- [ ] T040 [US4] Exponer endpoint `POST /results/sync` en `src/api/routes/results-sync.route.ts`

**Checkpoint**: US4 funcional con mejora incremental basada en outcomes.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Endurecimiento operativo, documentación y validación final.

- [ ] T041 [P] Crear colección Bruno base para integraciones API en `bruno/autoapply/bruno.json` con variables de entorno, flujos de autenticación y ejemplos de respuesta para cada endpoint crítico (`/offers/ingest`, `/offers/{offerId}/analyze`, `/applications/strategy`, `/applications/submit`, `/results/sync`, `/health`)
- [ ] T042 [P] Implementar endpoint de healthcheck en `src/api/routes/health.route.ts`
- [ ] T043 Añadir protección de logs sensibles en respuestas HTTP en `src/api/plugins/redaction.plugin.ts`
- [ ] T044 Validar quickstart end-to-end y ajustar comandos en `specs/001-project-analysis/quickstart.md`
- [ ] T045 Revisar configuración de rate limiting y backoff por dominio en `src/modules/ingestion/scraper-policy.service.ts`
- [ ] T046 Ajustar documentación técnica del módulo de reglas en `README.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias
- **Foundational (Phase 2)**: depende de Setup y bloquea historias
- **US1 (Phase 3)**: depende de Foundational
- **US2 (Phase 4)**: depende de US1 (requiere ofertas ingeridas)
- **US3 (Phase 5)**: depende de US2 (requiere score/reglas para estrategia)
- **US4 (Phase 6)**: depende de US3 (requiere intentos para outcomes)
- **Polish (Phase 7)**: depende de US1-US4

### User Story Dependencies

- **US1**: base de datos de oportunidades para todo el sistema
- **US2**: usa datos de US1 y catálogo de reglas
- **US3**: usa análisis de US2 y autenticación multi-cuenta
- **US4**: usa intentos/resultados de US3 para aprendizaje

### Parallel Opportunities

- Tareas `[P]` de Setup pueden ejecutarse en paralelo
- T008-T011 pueden implementarse en paralelo entre changesets Liquibase
- Dentro de US1, conectores T015 y T016 pueden avanzar en paralelo
- Dentro de US2, catálogo T022 y cumplimiento T023 pueden avanzar en paralelo
- Dentro de US3, sesiones T028 y asignación T029 pueden avanzar en paralelo
- Dentro de US4, ingesta T035 y clasificación T036 pueden avanzar en paralelo

---

## Parallel Example: User Story 1

```bash
# Trabajo paralelo recomendado para US1
Task T015: src/modules/ingestion/connectors/mercadopublico.connector.ts
Task T016: src/modules/ingestion/connectors/workana.connector.ts

# Luego converger en normalización y repositorio
Task T017: src/modules/ingestion/offer-normalizer.service.ts
Task T018: src/modules/ingestion/offer-repository.ts
```

## Parallel Example: User Story 2

```bash
Task T022: src/modules/analysis/rule-catalog.service.ts
Task T023: src/modules/analysis/rule-compliance.service.ts
Task T024: src/modules/analysis/opportunity-scoring.service.ts
```

## Parallel Example: User Story 3

```bash
Task T028: src/modules/auth/site-session.service.ts
Task T029: src/modules/auth/account-assignment.service.ts
Task T030: src/modules/analysis/strategy-builder.service.ts
```

## Parallel Example: User Story 4

```bash
Task T035: src/modules/results/outcome-ingestion.service.ts
Task T036: src/modules/results/failure-reason.service.ts
Task T037: src/modules/results/learning-feedback.service.ts
```

---

## Implementation Strategy

### MVP First

1. Completar Phase 1 y Phase 2
2. Completar US1 (Phase 3) y validar ingesta
3. Completar US2 (Phase 4) y validar scoring por reglas
4. Completar US3 (Phase 5) en modo simulación como MVP operativo

### Incremental Delivery

1. US1: valor inmediato en visibilidad de oportunidades
2. US2: valor en priorización y calidad de decisión
3. US3: valor en ejecución de postulaciones con control de costo
4. US4: valor en mejora continua y aumento de adjudicación

### Team Strategy

1. Equipo A: DB + Liquibase + repositorios
2. Equipo B: conectores + scraping policy
3. Equipo C: análisis + estrategia
4. Equipo D: resultados + feedback loop
