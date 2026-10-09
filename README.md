# La Loma · Nuestro viaje, a cuentas

Aplicación en español para compartir los gastos de siete familias y 26 viajeros. HTML, CSS y módulos JavaScript; no necesita compilación ni dependencias en producción.

## Uso

1. Abre la web e introduce la palabra del grupo.
2. Elige tu familia. Esta elección personaliza el panel, pero permite registrar gastos pagados por cualquier familia.
3. Añade concepto, importe, fecha, categoría, pagador y participantes. El reparto predeterminado es igual entre familias; opcionalmente puede ponderarse por personas.
4. Consulta saldos y registra las transferencias **después de realizarlas**. El registro no envía dinero. Puedes anularlo.
5. Comparte la dirección de la web y, por separado, la palabra. Todos entran al mismo viaje.
6. En «Ubicaciones» encontrarás la casa y el punto de acceso, con enlaces para verlos en Google Maps o pedir indicaciones. También hay un acceso desde el resumen.
7. En «Compartir y copias» puedes descargar JSON/CSV, restaurar JSON y cerrar sesión.

Los importes se guardan en céntimos enteros. Las siete familias iniciales y sus integrantes se conservan; se pueden añadir familias adicionales. El reparto histórico no cambia al editar el número de personas de una familia adicional.

## Acceso y límites

La experiencia de acceso sigue la de Laponia: palabra de grupo, selección de familia y panel. La palabra no aparece en el código ni se envía a Firebase. `access-config.json` contiene una invitación cifrada con AES-GCM; la clave se deriva con PBKDF2-SHA-256 y 600.000 iteraciones. La invitación revela un identificador aleatorio de viaje de 192 bits únicamente al desbloquearla.

El identificador actúa como una capacidad de acceso: Firebase exige sesión anónima y conocer ese identificador. Las reglas impiden listar o borrar documentos de viajes. Todos los participantes pueden leer y editar; no existen roles ni protección frente a un participante malintencionado. El cifrado de la invitación no cifra los gastos en Firestore. Una palabra fácil puede adivinarse mediante intentos fuera de línea; este sistema es para un grupo de confianza, no para datos sensibles.

La sesión se recuerda en la pestaña durante 12 horas y el botón «Cerrar sesión» elimina el acceso guardado. Quien ya haya obtenido el identificador puede conservarlo: cambiar solo la palabra no revoca accesos anteriores. Para revocarlos hay que migrar los datos a un viaje nuevo y dejar de permitir el acceso al anterior.

## Firebase y sincronización

- Proyecto: `la-loma-de-la-higuera-app`.
- Plan Spark, facturación desactivada.
- Firestore Standard `(default)`, región `europe-west1`.
- Authentication anónima y Hosting estático.
- Configuración web pública en `public/firebase-config.json`; no contiene credenciales administrativas.

El arranque y cada modificación usan transacciones. Dos dispositivos que abren por primera vez el viaje no sobrescriben la inicialización del otro. Las escrituras leen el estado actual y los cambios llegan mediante un listener en tiempo real. Sin conexión, la app muestra los datos ya recibidos y bloquea las escrituras; no cambia silenciosamente a datos locales. El modo local existe únicamente cuando la configuración Firebase está vacía.

La restauración sustituye todo el viaje, con confirmación. La validación comprueba fechas, categorías, referencias, duplicados, límites, participantes y suma exacta de los repartos. Límites: 50 familias, 1.000 gastos, 1.000 pagos y 750 kB de datos. Conviene exportar copias periódicamente; Spark no aporta aquí copias automáticas.

## Desarrollo y pruebas

Requiere Node.js moderno y Python 3 para el servidor opcional:

```sh
python3 -m http.server 8080 --directory public
node --test tests/*.test.mjs
node --check public/app.mjs
```

Las pruebas unitarias cubren acceso cifrado, rechazo de palabras incorrectas, validación de copias, conservación de céntimos, subconjuntos y liquidación de saldos. La prueba de navegador necesita Playwright instalado como herramienta de desarrollo:

```sh
npm install --no-save playwright
node tests/browser.cjs
```

El recorrido de navegador usa un viaje local aislado y comprueba acceso, errores, altas, edición, borrado, filtros, pagos, anulación, exportación, restauración, persistencia y tamaños 375/768/1440 px. No añade gastos al viaje real.

## Configurar o cambiar la palabra

`scripts/create-access.mjs` recibe `LOMA_ACCESS_PASSWORD` por entorno y conserva el viaje existente. Para cambiarla, también necesita `LOMA_OLD_PASSWORD`. No guarda ni imprime las palabras. Introduce estas variables mediante un mecanismo local seguro y ejecuta:

```sh
node scripts/create-access.mjs
```

No regeneres la invitación con otro identificador si quieres conservar las cuentas. Consulta arriba las limitaciones de revocación.

## Publicación

```sh
firebase login
firebase deploy --only hosting,firestore:rules --project la-loma-de-la-higuera-app
```

Antes de publicar, ejecutar las pruebas, confirmar Authentication anónima, comprobar que la configuración apunta al proyecto correcto y verificar el mismo viaje en dos sesiones. No activar Blaze, Functions ni facturación.
