# Implementation Plan: Sistema de Analisis y Postulacion Multi-sitio para Ganar Proyectos

**Branch**: `001-project-analysis` | **Date**: 2026-05-04 | **Spec**: `/specs/001-project-analysis/spec.md`
**Input**: Feature specification from `/specs/001-project-analysis/spec.md`

## Summary

Implementar un sistema TypeScript/Node.js que haga ciclo completo de postulaciones en 4 planes operativos:
1) login y acceso al buscador por sitio con multiples cuentas,
2) analisis de ofertas por reglas del sitio,
3) postulacion con costo minimo y modo simulacion por defecto,
4) analisis de resultados para aprendizaje continuo.

Se prioriza victoria de postulaciones, cumplimiento de reglas por plataforma y trazabilidad de decisiones para mejorar iterativamente la tasa de adjudicacion.

## Technical Context

**Language/Version**: TypeScript 5.x sobre Node.js 18+  
**Primary Dependencies**: Fastify (API), Zod (validacion), node-cron (scheduler), Axios (HTTP), Pino (logging), PostgreSQL driver (`pg`), Liquibase (migraciones), Playwright (solo cuando no exista API oficial), BullMQ opcional para jobs  
**Storage**: PostgreSQL 15+ (principal), almacenamiento objeto S3-compatible para adjuntos opcional  
**Testing**: Vitest para unit/integration, Supertest para API, contract tests sobre OpenAPI  
**Target Platform**: Linux containers (Docker), despliegue Railway
**Project Type**: Web-service backend + workers  
**Performance Goals**: ingesta <10 min desde deteccion; evaluar 1k ofertas/hora; p95 API interna <300ms para consultas operativas  
**Constraints**: `DEFAULT_SIMULATE=true`; scraping etico (robots.txt, rate limit 1-2 rps por dominio, backoff 429/5xx); no secretos en codigo; Liquibase obligatorio para cambios DB  
**Scale/Scope**: MVP para **Workana** (sitio unico inicial); arquitectura de conectores y catalogo de reglas permite agregar Mercado Publico y otros sitios sin cambios de modelo.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Gate Review

- Objetivo de Victoria: PASS. El plan prioriza scoring de oportunidad, estrategia por sitio y mejora de adjudicacion.
- Seguridad de Credenciales: PASS. Se exige `.env`/secrets manager y exclusion total de credenciales del repo.
- Scraping Etico: PASS. Se define prioridad API oficial, robots.txt, rate-limit y backoff.
- Simulacion por Defecto: PASS. Se mantiene `DEFAULT_SIMULATE=true` y envio real solo explicito.
- Costo Minimo: PASS. Se incluye pricing por tecnologia/perfil y optimizacion de costo por adjudicacion.
- Aprendizaje Continuo: PASS. Se incorpora pipeline de resultados y re-entrenamiento/recalibracion de reglas.
- TypeScript-First + Liquibase: PASS. Stack definido en TypeScript y migraciones mediante Liquibase.
- Estandares PostgreSQL: PASS. Modelo aplica `TIMESTAMPTZ`, `NUMERIC`, PK/FK explicitas y nomenclatura `snake_case`.

### Post-Phase 1 Gate Review

- Gates re-evaluados tras `research.md`, `data-model.md`, `contracts/`, `quickstart.md`: PASS.
- No violaciones activas ni excepciones requeridas.

## Project Structure

### Documentation (this feature)

```text
specs/001-project-analysis/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.yaml
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── api/
│   ├── routes/
│   └── schemas/
├── config/
├── modules/
│   ├── auth/
│   │   ├── site-session.service.ts
│   │   └── account-assignment.service.ts
│   ├── ingestion/
│   │   ├── connectors/
│   │   │   └── workana.connector.ts
│   │   └── offer-normalizer.service.ts
│   ├── analysis/
│   │   ├── rule-catalog.service.ts
│   │   ├── opportunity-scoring.service.ts
│   │   └── strategy-builder.service.ts
│   ├── apply/
│   │   ├── simulate-apply.service.ts
│   │   └── real-apply.service.ts
│   └── results/
│       ├── outcome-ingestion.service.ts
│       └── learning-feedback.service.ts
├── workers/
│   ├── ingest.worker.ts
│   ├── analyze.worker.ts
│   ├── apply.worker.ts
│   └── results.worker.ts
└── lib/

db/
└── changelog/
    ├── db.changelog-master.yaml
    └── changes/

tests/
├── contract/
├── integration/
└── unit/
```

**Structure Decision**: Single backend service + workers en un solo proyecto TypeScript. Esta estructura minimiza costo operativo (constitucion V), facilita trazabilidad end-to-end y soporta extension por sitio mediante conectores y catalogo de reglas.

## Delivery Slices (alineado a solicitud del usuario)

### Plan 1: Loguearse, llegar al buscador y ver postulaciones

- Gestion de multiples cuentas por sitio (`CuentaSitio`) con reglas de asignacion (`ReglaAsignacionCuenta`).
- Inicio de sesion por conector/sitio respetando TOS y controles anti-bloqueo.
- Extraccion de listados de ofertas (API oficial primero, scraper responsable como fallback).
- Persistencia deduplicada y trazabilidad de fuente.

### Plan 2: Analizar las postulaciones

- Motor de reglas por sitio versionado.
- Scoring de oportunidad con explicacion legible.
- Clasificacion de riesgo de rechazo por incumplimiento de formato/plazo/requisito.

### Plan 3: Postular

- Generador de estrategia: mensaje, precio, timing y cuenta seleccionada.
- Ejecucion en modo `simulate` por defecto y `auto-apply` solo explicito.
- Registro exhaustivo de intentos, payloads normalizados y resultado operativo.

### Plan 4: Analizar resultados

- Captura de resultado final: ganada/rechazada/sin respuesta + causa.
- Actualizacion de reglas y pesos de scoring por desempeno historico.
- Tablero de mejora continua: tasa de adjudicacion, costo por victoria, causas recurrentes.

## Complexity Tracking

No se registran violaciones constitucionales que requieran justificacion.
