# Data Model: Sistema de Analisis y Postulacion Multi-sitio

## Entidades

### oferta_proyecto

- Purpose: Representa una oferta normalizada desde cualquier sitio.
- Fields:
  - id: text, PK
  - source_site: text, not null
  - source_offer_id: text, not null
  - title: text, not null
  - description: text, not null
  - skills: text[], default '{}'
  - budget_min: numeric(12,2), nullable
  - budget_max: numeric(12,2), nullable
  - currency: text, nullable
  - published_at: timestamptz, not null
  - expires_at: timestamptz, nullable
  - status: text, not null (open, closed, archived)
  - raw_payload: jsonb, not null
  - created_at: timestamptz, not null
  - updated_at: timestamptz, not null
- Indexes:
  - (source_site, source_offer_id) unique
  - (published_at desc)
  - GIN(skills)
- Relationships:
  - 1:N con analisis_oferta
  - 1:N con intento_postulacion

### cuenta_sitio

- Purpose: Cuenta de autenticacion por sitio.
- Fields:
  - id: uuid, PK
  - site: text, not null
  - account_alias: text, not null
  - username_ref: text, not null
  - credential_secret_ref: text, not null
  - status: text, not null (active, suspended, cooldown)
  - last_login_at: timestamptz, nullable
  - health_score: numeric(5,2), not null default 100
  - created_at: timestamptz, not null
  - updated_at: timestamptz, not null
- Indexes:
  - (site, account_alias) unique
  - (site, status)
- Relationships:
  - 1:N con intento_postulacion

### regla_sitio

- Purpose: Regla versionada de postulacion/validacion por plataforma.
- Fields:
  - id: uuid, PK
  - site: text, not null
  - rule_type: text, not null (eligibility, format, timing, pricing)
  - version: int, not null
  - definition: jsonb, not null
  - active: boolean, not null
  - effective_from: timestamptz, not null
  - effective_to: timestamptz, nullable
  - created_at: timestamptz, not null
- Indexes:
  - (site, rule_type, version) unique
  - partial index active=true
- Relationships:
  - N:M logica con analisis_oferta (via metadata de evaluacion)

### regla_asignacion_cuenta

- Purpose: Seleccion de cuenta por sitio y criterio de riesgo/estrategia.
- Fields:
  - id: uuid, PK
  - site: text, not null
  - priority: int, not null
  - condition_expr: jsonb, not null
  - account_site_id: uuid, FK -> cuenta_sitio.id
  - active: boolean, not null
  - created_at: timestamptz, not null
- Indexes:
  - (site, priority)
  - (account_site_id)

### analisis_oferta

- Purpose: Resultado del analisis de oportunidad por oferta.
- Fields:
  - id: uuid, PK
  - offer_id: text, FK -> oferta_proyecto.id
  - site: text, not null
  - score: numeric(5,2), not null
  - confidence: numeric(5,2), not null
  - reasons: jsonb, not null
  - rule_versions: jsonb, not null
  - analyzed_at: timestamptz, not null
- Indexes:
  - (offer_id, analyzed_at desc)
  - (site, score desc)

### estrategia_postulacion

- Purpose: Propuesta de mensaje, precio y timing para competir.
- Fields:
  - id: uuid, PK
  - offer_id: text, FK -> oferta_proyecto.id
  - analysis_id: uuid, FK -> analisis_oferta.id
  - site: text, not null
  - recommended_price: numeric(12,2), not null
  - min_price_floor: numeric(12,2), not null
  - proposal_template_id: text, not null
  - suggested_send_at: timestamptz, not null
  - rationale: jsonb, not null
  - created_at: timestamptz, not null
- Indexes:
  - (offer_id, created_at desc)

### intento_postulacion

- Purpose: Intento simulado o real de envio.
- Fields:
  - id: bigint GENERATED ALWAYS AS IDENTITY, PK
  - offer_id: text, FK -> oferta_proyecto.id
  - strategy_id: uuid, FK -> estrategia_postulacion.id
  - account_site_id: uuid, FK -> cuenta_sitio.id
  - mode: text, not null (simulate, real)
  - status: text, not null (queued, sent, failed, simulated)
  - sent_payload: jsonb, not null
  - response_payload: jsonb, nullable
  - sent_at: timestamptz, nullable
  - created_at: timestamptz, not null
- Indexes:
  - (offer_id, created_at desc)
  - (account_site_id, created_at desc)
  - (status)

### resultado_postulacion

- Purpose: Resultado de negocio y aprendizaje.
- Fields:
  - id: uuid, PK
  - attempt_id: bigint, FK -> intento_postulacion.id
  - outcome: text, not null (won, rejected, no_response)
  - failure_reason: text, nullable
  - outcome_at: timestamptz, not null
  - learned_features: jsonb, nullable
  - created_at: timestamptz, not null
- Indexes:
  - (attempt_id) unique
  - (outcome, outcome_at desc)

### perfil_operativo

- Purpose: Parametros de costo minimo, capacidades y limites de riesgo usados para tomar decisiones de postulacion.
- Fields:
  - id: uuid, PK
  - profile_name: text, not null
  - skill_tag: text, not null
  - min_price_floor: numeric(12,2), not null
  - currency: text, not null default 'USD'
  - risk_threshold: numeric(5,2), not null default 0.3
  - active: boolean, not null default true
  - notes: text, nullable
  - created_at: timestamptz, not null
  - updated_at: timestamptz, not null
- Indexes:
  - (skill_tag) unique where active = true
  - (active)
- Relationships:
  - Consultado por estrategia_postulacion para calcular min_price_floor

## Reglas de validacion

- `recommended_price >= min_price_floor`
- `mode = real` requiere validacion de consentimiento explicito en capa de aplicacion
- `resultado_postulacion` solo puede existir para intentos en estado final
- Para ventanas de tiempo, usar intervalos semiabiertos: `start_at >= x and start_at < y`

## Transiciones de estado

### intento_postulacion.status

- queued -> simulated
- queued -> sent
- queued -> failed
- sent -> failed
- sent -> completed (representado por existencia de resultado_postulacion)

### cuenta_sitio.status

- active -> cooldown
- cooldown -> active
- active -> suspended
- suspended -> active (solo por operador)
