# Research: Sistema de Analisis y Postulacion Multi-sitio

## Decision 1: Arquitectura por conectores de sitio

- Decision: Implementar conectores por sitio (Mercado Publico API y Workana) con una interfaz comun de ingesta.
- Rationale: Permite adaptar reglas y autenticacion especifica por plataforma sin acoplar todo el sistema a un proveedor.
- Alternatives considered:
  - Un solo scraper generico para todos los sitios: rechazado por baja mantenibilidad y alta fragilidad ante cambios de UI.
  - Solo APIs oficiales: rechazado para MVP porque algunos sitios no cubren todo el flujo.

## Decision 2: Modelo de autenticacion multi-cuenta por sitio

- Decision: Usar multiples cuentas por sitio con reglas de asignacion por perfil/riesgo.
- Rationale: Escala operativa, aislamiento de riesgo por cuenta y mejor distribucion de postulaciones.
- Alternatives considered:
  - Una sola cuenta por sitio: rechazado por cuello de botella y menor resiliencia.
  - Sin login (solo analisis): rechazado porque no habilita objetivo de postulacion real.

## Decision 3: Flujo hibrido para desafios de login (captcha/2FA)

- Decision: Enfrentar desafios de autenticacion con flujo hibrido asistido por operador cuando aplique.
- Rationale: Mantiene cumplimiento legal y reduce riesgo de bloqueo por automatizaciones agresivas.
- Alternatives considered:
  - Bypass automatizado universal: rechazado por riesgo legal/TOS.
  - Bloquear toda postulacion en esos sitios: rechazado por impacto en objetivo de victoria.

## Decision 4: Motor de reglas por sitio versionado

- Decision: Mantener catalogo versionado de `ReglaSitio` y reevaluar ofertas ante cambios.
- Rationale: Cada sitio tiene reglas distintas y cambiantes; versionado da trazabilidad y reproducibilidad.
- Alternatives considered:
  - Reglas hardcodeadas en codigo: rechazado por baja velocidad de cambio y alto riesgo de regressions.
  - Reglas manuales sin versionado: rechazado por falta de auditoria.

## Decision 5: Estrategia de costo minimo guiada por configuracion y datos historicos

- Decision: Calcular precio recomendado con piso por tecnologia y ajuste por probabilidad de exito.
- Rationale: Cumple principio de costo minimo sin sacrificar tasa de adjudicacion.
- Alternatives considered:
  - Precio fijo para todo: rechazado por baja competitividad.
  - Solo optimizacion por ML desde el dia 1: rechazado por falta de datos iniciales.

## Decision 6: Ciclo de aprendizaje incremental

- Decision: Reglas heuristicas al inicio, y activacion de modelo predictivo al acumular datos etiquetados suficientes.
- Rationale: Permite valor temprano y evoluciona a decisiones data-driven con explicabilidad.
- Alternatives considered:
  - ML obligatorio desde inicio: rechazado por cold-start.
  - Solo heuristicas permanentes: rechazado por techo de rendimiento.

## Decision 7: PostgreSQL + Liquibase como base de cambios de datos

- Decision: Gestionar esquema y cambios con Liquibase sobre PostgreSQL, cumpliendo estandares de tipos y constraints.
- Rationale: Versionado auditable de migraciones, rollback explicito y alineacion constitucional.
- Alternatives considered:
  - SQL manual por entorno: rechazado por riesgo operacional y deriva de esquema.
  - ORM auto-sync de esquema: rechazado por falta de control fino en produccion.

## Decision 8: Seguridad y observabilidad

- Decision: Secretos solo por `.env`/vault, logs estructurados sin credenciales, trazabilidad por intento.
- Rationale: Reduce riesgo de fuga y soporta auditoria de decisiones.
- Alternatives considered:
  - Configuraciones inline en codigo: rechazado por violar constitucion.
  - Logging minimo sin contexto: rechazado por baja capacidad de diagnostico.
