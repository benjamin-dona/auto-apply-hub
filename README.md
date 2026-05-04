AutoApply Hub — README
AutoApply Hub — MVP para búsqueda y postulación automática a proyectos freelance y licitaciones públicas en Chile. Implementación orientada a TypeScript, desplegable en Docker y Railway, con modo simulación por defecto y prácticas de scraping ético.

1. Overview
Qué hace  
AutoApply Hub busca ofertas en Workana y Mercado Público, normaliza datos, filtra por lenguajes y skills, genera propuestas desde plantillas y registra intentos para análisis y aprendizaje. El MVP prioriza bajo costo, despliegue rápido y seguridad.

Alcance MVP

Ingesta: Mercado Público API y scraper controlado para Workana.

Matching: reglas por lenguaje y skills.

Postulación: modo simulate por defecto; envío real solo con flag explícito.

ML: modelo ligero para estimar probabilidad de éxito y explicaciones con SHAP cuando haya datos suficientes.

2. Quickstart
Requisitos
Docker y Docker Compose

Node.js para desarrollo local

Cuenta Railway opcional para deploy

Archivos clave
Dockerfile multi-stage

docker-compose.yml para desarrollo local

.env.example con variables de entorno

src/ con servicios TypeScript: ingestor, matcher, applier, worker

Dockerfile ejemplo
dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --production
USER node
CMD ["node", "dist/index.js"]
docker-compose ejemplo
yaml
version: "3.8"
services:
  app:
    build: .
    env_file: .env
    ports:
      - "3000:3000"
    depends_on:
      - db
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: autoapply
      POSTGRES_USER: autoapply
      POSTGRES_PASSWORD: changeme
    volumes:
      - db-data:/var/lib/postgresql/data
volumes:
  db-data:
Variables de entorno ejemplo
Código
NODE_ENV=production
PORT=3000
APP_HOST=0.0.0.0

DATABASE_URL=postgresql://autoapply:changeme@db:5432/autoapply

SCRAPER_USER_AGENT=AutoApplyHubBot/1.0 +contact@example.com
SCRAPER_RATE_LIMIT=1
SCRAPER_MAX_RETRIES=3

MERCADOPUBLICO_API_KEY=
WORKANA_USERNAME=
WORKANA_PASSWORD=

DEFAULT_SIMULATE=true
Nota No commitear .env con credenciales reales.

3. Architecture
Componentes

Ingestor TypeScript que consume Mercado Público API y ejecuta scraper para Workana; normaliza a esquema común.

Scheduler cron jobs para ingest y matching.

Matcher reglas por lenguaje y skills, calcula puntaje de ajuste.

Applier genera propuesta desde plantilla; --simulate guarda intento; --auto-apply envía si está habilitado.

Storage PostgreSQL para metadata, S3-compatible para documentos, Elasticsearch opcional para búsqueda full-text.

ML Service offline para entrenar modelos y exponer explicaciones SHAP.

API mínima para listar ofertas, ver intentos y recomendaciones.

Flujo

Ingestor normaliza y guarda oferta.

Scheduler ejecuta matcher y selecciona ofertas.

Applier genera propuesta y registra intento en DB.

Dataset de intentos alimenta ML para explicar rechazos.

4. Scraper Policy y Motor de Postulación
Reglas obligatorias

Comprobar robots.txt antes de scrapear cada dominio.

Identificación clara con SCRAPER_USER_AGENT y contacto.

Rate limiting por dominio: 1 a 2 requests por segundo por defecto.

Backoff exponencial ante 429 y 5xx.

Modo simulación por defecto; no enviar postulaciones reales sin revisión.

Logs de requests y respuestas sin almacenar credenciales.

Priorizar APIs oficiales cuando existan.

Técnicas para reducir bloqueos

Cachear resultados por un periodo configurable.

Preferir requests directas sobre headless browser salvo necesidad.

Evitar rotación de IP que viole TOS.

Plantillas de propuesta

Parametrizar por nombre, skills, experiencia, precio y adjuntos.

Versionar plantillas y registrar cuál se usó en cada intento.

Flags de ejecución

--simulate default status simulated.

--dry-run muestra payload.

--auto-apply envía postulaciones reales solo con consentimiento y credenciales válidas.

Ejemplo de intento registrado

json
{
  "offer_id": "workana-12345",
  "user_id": "freelancer-1",
  "template_id": "tpl-v1",
  "price": 350,
  "cover_letter": "Texto generado...",
  "status": "simulated",
  "response": null,
  "timestamp": "2026-05-04T10:00:00Z"
}
5. Database ML y Explainability
Esquema mínimo Postgres

sql
CREATE TABLE offers (
  id TEXT PRIMARY KEY,
  source TEXT,
  title TEXT,
  description TEXT,
  skills TEXT[],
  budget_min NUMERIC,
  budget_max NUMERIC,
  posted_at TIMESTAMP,
  raw_json JSONB
);

CREATE TABLE attempts (
  id SERIAL PRIMARY KEY,
  offer_id TEXT REFERENCES offers(id),
  user_id TEXT,
  template_id TEXT,
  price NUMERIC,
  cover_letter TEXT,
  status TEXT,
  response_json JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE labels (
  attempt_id INT REFERENCES attempts(id),
  result BOOLEAN,
  reason TEXT,
  labeled_at TIMESTAMP DEFAULT now()
);
Features sugeridas para ML

match_score

price_ratio oferta vs propuesta

skills_overlap

proposal_length

response_time

Modelo inicial

Logistic regression o XGBoost ligero.

Usar SHAP para explicar predicciones.

Activar ML cuando haya aproximadamente 500 intentos etiquetados; antes usar reglas heurísticas.

6. Deployment Security y Contribución
Despliegue económico

Railway recomendado para MVP por deploy rápido y planes hobby.

Configurar deploy automático desde GitHub con Dockerfile.

Monitorizar uso y migrar DB a VPS si los costos suben.

CI pipeline sugerido

Lint ESLint, build TypeScript, tests unitarios.

Docker build en CI y push a registry si aplica.

Deploy automático en merge a main.

Healthcheck

Endpoint /health que valide DB y cola de jobs.

Seguridad

No hardcodear secrets; usar env vars o vault.

Cifrar backups y restringir accesos.

Minimizar datos personales almacenados.

Auditar logs de intentos y cambios de configuración.

Contribución

PR checklist: lint y tests pasan, Docker build exitoso, .env.example actualizado, migraciones documentadas, scraping incluye robots.txt check y rate limiting.

PR template breve: resumen, cambios principales, cómo probar, notas de seguridad.

7. Riesgos Mitigaciones y Próximos Pasos
Riesgos principales

Bloqueos o violación de TOS por scraping.

Costos crecientes en Railway.

Datos insuficientes para ML.

Mitigaciones

Priorizar APIs oficiales y modo simulación.

Monitorizar uso y mover infra si es necesario.

Empezar con reglas heurísticas y registrar todo para etiquetado.

Tareas inmediatas

Conector Mercado Público y normalizador.

Scraper Workana en modo simulación con robots.txt y rate limiter.

Matcher y plantillas de propuesta.

Recolectar intentos y preparar pipeline ML.

Desplegar en Railway con healthcheck.

Fin del README  
Este README está listo para pegar en el repositorio. Incluye ejemplos de Dockerfile, docker-compose, .env.example, esquema DB y checklist operativo.