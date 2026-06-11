# DAO Dent — Endpoints y flujo de roles

## Roles

No existe tabla `roles`: el rol vive como columna `role VARCHAR(20)` en `users`
(`UserRole` enum: `ADMIN` | `DOCTOR`). Solo usuarios con cuenta en `users` pueden
iniciar sesión — **pacientes no tienen cuenta ni login**, son solo registros en
`patients` gestionados por el personal de la clínica.

| Rol      | Login | Tabla de perfil      | Notas                                         |
|----------|-------|----------------------|-----------------------------------------------|
| ADMIN    | sí    | `users`              | Acceso total, único rol que puede borrar      |
| DOCTOR   | sí    | `users` + `doctors`  | `doctors.user_id` enlaza con `users.id`       |
| Paciente | no    | `patients`           | Sin cuenta; gestionado por ADMIN/DOCTOR       |

Guard de autenticación: `JwtAuthGuard`. Guard de rol: `RolesGuard` +
decorador `@Roles('ADMIN')`. Casi todo requiere `JwtAuthGuard`; solo borrar
(`DELETE`) en `patients`, `clinical-histories`, `odontogramas` y `treatments`
exige rol `ADMIN`. Los doctores ven datos de pacientes "recortados" (sin PII)
en `GET /patients`.

## Flujo típico de uso (orden recomendado para probar)

1. **Login** → `POST /auth/login` con email/password de un ADMIN o DOCTOR. Devuelve
   `accessToken` + `refreshToken`. Usar `Authorization: Bearer <accessToken>`
   en el resto de llamadas.
2. **Crear/gestionar doctores** (ADMIN) → `POST /doctors`
3. **Registrar paciente** → `POST /patients`
4. **Programar cita** → `POST /appointments`
5. **Crear historia clínica** del paciente → `POST /clinical-histories`
6. **Crear odontograma** ligado a la historia → `POST /odontogramas`
7. **Crear plan de tratamiento** ligado a la historia → `POST /treatments`
8. Consultar historial completo del paciente con los `GET` filtrados por `patientId`

## Endpoints

### Auth (`/auth`) — público
| Método | Ruta             | Guard          | Descripción                          |
|--------|------------------|----------------|--------------------------------------|
| POST   | `/auth/login`    | LocalAuthGuard | Login con email/password → JWT       |
| POST   | `/auth/refresh`  | —              | Renueva accessToken con refreshToken |
| POST   | `/auth/logout`   | JwtAuthGuard   | Cierra sesión                        |

### Users (`/users`) — solo ADMIN
| Método | Ruta         | Descripción              |
|--------|--------------|--------------------------|
| POST   | `/users`     | Crear usuario (admin/doctor) |
| GET    | `/users`     | Listar usuarios          |
| GET    | `/users/:id` | Obtener usuario          |
| PATCH  | `/users/:id` | Actualizar usuario       |
| DELETE | `/users/:id` | Eliminar usuario         |

### Doctors (`/doctors`) — JwtAuthGuard (+ ADMIN para crear/editar/eliminar)
| Método | Ruta           | Descripción                  |
|--------|----------------|-------------------------------|
| POST   | `/doctors`     | Crear perfil doctor — **ADMIN** |
| GET    | `/doctors`     | Listar doctores                |
| GET    | `/doctors/:id` | Obtener doctor                 |
| PATCH  | `/doctors/:id` | Actualizar doctor — **ADMIN**  |
| DELETE | `/doctors/:id` | Eliminar doctor — **ADMIN**    |

### Patients (`/patients`) — JwtAuthGuard (+ ADMIN para borrar)
| Método | Ruta                    | Descripción                                          |
|--------|-------------------------|------------------------------------------------------|
| POST   | `/patients`             | Crear paciente                                       |
| GET    | `/patients?search=...`  | Listar/buscar (DOCTOR ve datos recortados sin PII)   |
| GET    | `/patients/:id`         | Obtener paciente (idem recorte para DOCTOR)          |
| PATCH  | `/patients/:id`         | Actualizar paciente                                  |
| DELETE | `/patients/:id`         | Eliminar paciente — **ADMIN**                        |

### Appointments (`/appointments`) — JwtAuthGuard
| Método | Ruta                                          | Descripción                         |
|--------|-----------------------------------------------|-------------------------------------|
| POST   | `/appointments`                               | Crear cita                          |
| GET    | `/appointments?patientId=&doctorId=&from=&to=`| Listar citas con filtros            |
| GET    | `/appointments/:id`                           | Obtener cita                        |
| PATCH  | `/appointments/:id`                           | Actualizar cita (estado, horario)   |
| DELETE | `/appointments/:id`                           | Eliminar cita                       |

Estados: `SCHEDULED`, `CONFIRMED`, `CANCELLED`, `COMPLETED`.

### Clinical Histories (`/clinical-histories`) — JwtAuthGuard (+ ADMIN para borrar)
| Método | Ruta                                | Descripción                          |
|--------|-------------------------------------|--------------------------------------|
| POST   | `/clinical-histories`               | Crear historia clínica (NTS 150)     |
| GET    | `/clinical-histories?patientId=...` | Listar historias de un paciente      |
| GET    | `/clinical-histories/:id`           | Obtener historia clínica             |
| PATCH  | `/clinical-histories/:id`           | Actualizar historia clínica          |
| DELETE | `/clinical-histories/:id`           | Eliminar — **ADMIN**                 |

### Odontogramas (`/odontogramas`) — JwtAuthGuard (+ ADMIN para borrar)
| Método | Ruta                                                       | Descripción                         |
|--------|------------------------------------------------------------|-------------------------------------|
| POST   | `/odontogramas`                                            | Crear odontograma (FDI, JSONB)      |
| GET    | `/odontogramas?patientId=...&clinicalHistoryId=...`        | Listar (= historial por paciente)   |
| GET    | `/odontogramas/:id`                                        | Obtener odontograma                 |
| PATCH  | `/odontogramas/:id`                                        | Actualizar odontograma              |
| DELETE | `/odontogramas/:id`                                        | Eliminar — **ADMIN**                |

`tipo`: `INICIAL` | `EVOLUCION`. Un paciente puede tener múltiples odontogramas
(historial completo vía `GET /odontogramas?patientId=...`, ordenado por fecha).

### Treatments (`/treatments`) — JwtAuthGuard (+ ADMIN para borrar)
| Método | Ruta                                          | Descripción                            |
|--------|------------------------------------------------|---------------------------------------|
| POST   | `/treatments`                                 | Crear plan de tratamiento              |
| GET    | `/treatments?patientId=...&status=...`        | Listar tratamientos (filtros opc.)     |
| GET    | `/treatments/:id`                             | Obtener tratamiento                    |
| PATCH  | `/treatments/:id`                             | Actualizar (progreso, pagos, estado)   |
| DELETE | `/treatments/:id`                             | Eliminar — **ADMIN**                   |

`status`: `PROGRAMADO` | `EN_PROGRESO` | `COMPLETADO` | `PAUSADO`.
`remaining` (saldo pendiente) no se almacena: se calcula como `cost - paid`.
