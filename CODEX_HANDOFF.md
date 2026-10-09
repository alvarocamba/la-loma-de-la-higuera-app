# Estado actualizado — 9 de octubre de 2026

La integración descrita como pendiente en el traspaso original está completada. Consulta README.md para el funcionamiento actual y VERIFICATION.md para las pruebas. Se añadió acceso mediante palabra del grupo a petición del usuario. La configuración pública de Firebase y la invitación cifrada ya están preparadas. Nunca publiques la palabra ni el identificador descifrado del viaje.

---

# Traspaso para Codex Work local

## Objetivo

Terminar y publicar una web tipo Splitwise para el puente en **La Loma de la Higuera**. Debe tener:

1. Una portada de acceso en la que el usuario elige su familia.
2. Un dashboard moderno con gasto total, gasto pendiente, últimos gastos y saldos por familia.
3. Alta, edición y borrado de gastos.
4. En cada gasto: concepto, importe, fecha, categoría, familia que pagó y familias entre las que se divide.
5. Reparto por defecto a partes iguales entre las familias seleccionadas. Mantener como opción secundaria el reparto según el número de personas.
6. Cálculo de saldos y propuesta de transferencias para dejar las cuentas a cero.
7. Registro y anulación de pagos realizados.
8. Exportación JSON/CSV e importación de una copia JSON.
9. Sincronización en tiempo real entre móviles mediante Firebase.
10. Diseño responsive, especialmente cuidado en móvil.

## Familias iniciales

Están definidas en `public/families.mjs`:

- Jaime-Vio: Jaime, Vio, Jaime, Mateo y Gonzalo (5).
- Camba-Ceci: Álvaro, Ceci, Adrián y Lucía (4).
- Sanjo-Anita: Anita, Álvaro, Pablo y Diego (4).
- Pedro-Marta: Pedro y Marta (2).
- Polo-Laura: Fer Polo, Laura, Martina y Dani (4).
- Felix-Ines: Félix, Inés, Félix y Marco (4).
- Rafa-Maria: Rafa, María e Inés (3).

Total: 7 familias y 26 personas.

## Estado real del código

El proyecto es HTML/CSS/JavaScript sin build y sin dependencias locales. Está pensado para publicarse como contenido estático.

- `public/core.mjs`: cálculo de repartos, saldos y transferencias. Está probado y funcionaba en la primera versión.
- `tests/core.test.mjs`: pruebas unitarias del cálculo.
- `public/app.mjs`: lógica funcional de la primera interfaz. Incluye modo local, Firebase, gastos, familias, pagos, importación y exportación.
- `public/index.html` y `public/style.css`: rediseño moderno en curso, con portada y dashboard.
- `public/families.mjs`: las siete familias solicitadas.
- `firestore.rules`: reglas para el documento compartido del viaje.
- `firebase.json` y `.firebaserc`: Hosting y reglas configurados para `la-loma-de-la-higuera-app`.
- `public/firebase-config.json`: vacío a propósito; hay que obtener la configuración pública de la app web en Firebase.

**Atención:** el rediseño está a medio integrar. `index.html` y `style.css` ya contienen la nueva estructura, pero `app.mjs` sigue correspondiendo en gran parte a la primera interfaz. No se debe desplegar todavía. Hay que conectar todos los nuevos elementos y probar el flujo completo.

## Trabajo prioritario

1. Actualizar `app.mjs` para importar `initialState` desde `families.mjs` y sembrar las siete familias cuando el viaje todavía no tenga datos.
2. Implementar la portada:
   - llenar `#accessFamily`;
   - guardar la familia elegida en `localStorage`;
   - mostrar `#app` y ocultar `#access` al entrar;
   - permitir cambiar de familia desde `#profile` y `#exit`;
   - la selección identifica visualmente al usuario, pero no restringe qué familia puede pagar un gasto.
3. Adaptar `render()` a los nuevos elementos:
   - `#recentExpenses`, `#overviewBalances`, `#categorySummary`;
   - contadores, personas, gasto filtrado y resumen del grupo;
   - tarjetas de familias con sus integrantes;
   - filtros por categoría y pagador.
4. Cambiar el reparto predeterminado de un nuevo gasto de `people` a `equal`.
5. Mantener edición y borrado de gastos, con confirmación clara.
6. Validar que un gasto siempre tenga al menos una familia participante y que la suma de los repartos coincida exactamente con el importe.
7. Revisar el arranque con Firestore vacío. La primera escritura debe crear el viaje con las familias iniciales sin pisar datos introducidos desde otro móvil.
8. Revisar accesibilidad: foco del diálogo, etiquetas, botones de icono, contraste, navegación por teclado y mensajes de error.
9. Comprobar responsive en 375 px, 768 px y escritorio.
10. Actualizar `README.md` cuando el flujo final esté cerrado.

## Firebase

Proyecto: `la-loma-de-la-higuera-app`

Consola: https://console.firebase.google.com/project/la-loma-de-la-higuera-app

La publicación se hará desde el ordenador del usuario. No hay credenciales de Google Cloud en el entorno anterior y no se debe pedir ni guardar una clave privada.

Pasos que aún requieren consola:

1. En Configuración del proyecto, crear o seleccionar una app web.
2. Copiar el objeto público `firebaseConfig` en `public/firebase-config.json` como JSON válido.
3. En Authentication, activar el proveedor **Anónimo**.
4. Crear Cloud Firestore en modo producción, preferiblemente en región europea.
5. Mantener el proyecto en plan **Spark** y no vincular facturación.

Despliegue local:

```bash
npm install -g firebase-tools
firebase login
firebase use la-loma-de-la-higuera-app
firebase deploy --only hosting,firestore:rules
```

Antes de desplegar, comprobar que `firebase-config.json` contiene al menos `apiKey`, `authDomain`, `projectId` y `appId`, y que `projectId` es `la-loma-de-la-higuera-app`.

## GitHub

Repositorio: https://github.com/alvarocamba/la-loma-de-la-higuera-app

La conexión de GitHub del entorno anterior devolvía 404 porque todavía no tenía acceso al repositorio. El usuario indicó que iba a habilitarlo. En local:

1. Clonar el repositorio.
2. Copiar o integrar estos archivos conservando cualquier contenido que ya exista en el repo.
3. Revisar `git status` y el diff completo.
4. Hacer commit solo después de completar las pruebas.
5. Subir a la rama principal si el repositorio está vacío; si ya contiene trabajo, crear una rama y PR.

## Comandos de desarrollo y verificación

```bash
python3 -m http.server 8080 --directory public
node --test tests/core.test.mjs
node --check public/app.mjs
```

Abrir `http://localhost:8080`. El modo local funciona sin Firebase, guardando por navegador. Para verificar la nube, probar el mismo enlace del viaje en dos navegadores o móviles y confirmar que alta, edición, borrado y registro de pagos se sincronizan.

## Criterios de terminado

- La portada permite elegir familia y entrar.
- Las siete familias aparecen desde el primer uso.
- El dashboard refleja los datos reales.
- Se pueden crear, editar y borrar gastos.
- El reparto entre un subconjunto de familias cuadra al céntimo.
- Los saldos suman cero y las transferencias propuestas los dejan a cero.
- Dos dispositivos ven los cambios en tiempo real.
- La importación no admite datos inválidos y la exportación funciona.
- No hay errores en consola.
- Las pruebas pasan.
- El sitio está publicado en Firebase Hosting y el código está en GitHub.

## Prompt recomendado para iniciar Codex Work

> Lee `AGENTS.md` y `CODEX_HANDOFF.md`. Continúa el proyecto desde su estado actual. Termina la integración entre el nuevo `index.html` y `app.mjs`, verifica todos los flujos en escritorio y móvil, corrige lo necesario, actualiza el README y deja el repo listo para commit y despliegue en Firebase. No despliegues hasta que la configuración web de Firebase esté presente y las pruebas hayan pasado. Conserva el plan Spark y no añadas servicios de pago.
