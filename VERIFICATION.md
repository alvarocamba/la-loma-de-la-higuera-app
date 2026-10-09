# Verificación — 9 de octubre de 2026

Recorrido: palabra del grupo → selección de familia → gasto → transacción Firestore → actualización en el otro dispositivo.

- 9 pruebas unitarias aprobadas: acceso, validación y cálculos.
- Navegador local: alta, edición, subconjunto, error sin participantes, filtros, pago/anulación, borrado, JSON/restauración y persistencia.
- 15 vistas revisadas a 375, 768 y 1440 px, sin desbordamiento horizontal. Capturas revisadas en móvil y escritorio.
- Firestore real, en un viaje aleatorio de prueba distinto del familiar: inicialización simultánea, dos altas concurrentes, edición, borrado, pagos y anulación sincronizados en dos sesiones independientes.
- Desconexión: escritura bloqueada; recuperación de conexión y recarga verificadas.
- Sin excepciones JavaScript en los recorridos probados.
- Revisión manual en Chrome: palabra del grupo, elección Camba-Ceci, siete familias, 26 personas y estado «Sincronizado · Firebase».
- Reglas comprobadas vía REST: denegadas lectura sin sesión, listado de viajes, borrado y escritura con esquema inválido.
- Firebase: reglas compiladas y publicadas; base europea; facturación desactivada.

El viaje familiar se mantiene sin gastos de ejemplo. Los registros de prueba se crean en un documento independiente y se eliminan después de verificar.
