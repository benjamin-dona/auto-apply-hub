# Quickstart: Feature 001 Project Analysis

## Objetivo

Levantar el ciclo MVP en 4 planes:
1. login/buscador,
2. analisis,
3. postulacion,
4. resultados.

## Prerrequisitos

- Node.js 18+
- Docker + Docker Compose
- PostgreSQL 15+
- Liquibase CLI o contenedor Liquibase
- Variables en `.env` (sin secretos en codigo)

## Variables minimas

- `DATABASE_URL`
- `DEFAULT_SIMULATE=true`
- `SCRAPER_USER_AGENT`
- `SCRAPER_RATE_LIMIT=1`
- `MERCADOPUBLICO_API_KEY` (si aplica)
- `WORKANA_USERNAME` y `WORKANA_PASSWORD` (referencia a secretos)

## 1) Inicializar base de datos con Liquibase

1. Crear changelog maestro en `db/changelog/db.changelog-master.yaml`.
2. Agregar changesets por entidad base (`oferta_proyecto`, `cuenta_sitio`, `regla_sitio`, `intento_postulacion`, `resultado_postulacion`).
3. Ejecutar:

```bash
liquibase --url="$DATABASE_URL" --changelog-file=db/changelog/db.changelog-master.yaml validate
liquibase --url="$DATABASE_URL" --changelog-file=db/changelog/db.changelog-master.yaml update
```

## 2) Plan login/buscador

1. Configurar cuentas por sitio en `cuenta_sitio`.
2. Definir `regla_asignacion_cuenta` por prioridad.
3. Correr worker de ingesta para ver ofertas disponibles.

Criterio de exito:
- Ofertas visibles y deduplicadas por `(source_site, source_offer_id)`.

## 3) Plan analisis

1. Cargar reglas activas en `regla_sitio`.
2. Ejecutar analisis para ofertas nuevas.
3. Verificar score y razones en `analisis_oferta`.

Criterio de exito:
- Cada oferta analizada tiene puntuacion y explicacion.

## 4) Plan postular

1. Generar estrategia por oferta (`estrategia_postulacion`).
2. Ejecutar envio en modo `simulate`.
3. Verificar intento en `intento_postulacion`.

Criterio de exito:
- Intentos simulados registrados con cuenta asignada y payload.

## 5) Plan resultados

1. Sincronizar resultados desde sitio/API.
2. Registrar outcome y causa en `resultado_postulacion`.
3. Ejecutar rutina de feedback para ajustar scoring.

Criterio de exito:
- Cambios en priorizacion segun resultados historicos.

## Checks rapidos

- `GET /health` retorna 200.
- `POST /offers/ingest` retorna 202.
- `POST /offers/{offerId}/analyze` retorna score/confidence.
- `POST /applications/submit` en `simulate` retorna 200.
- `POST /results/sync` retorna 202.
