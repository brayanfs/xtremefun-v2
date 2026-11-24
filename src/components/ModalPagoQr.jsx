import { useState } from 'react';

const generarMatrizQr = (texto, tamano = 17) => {
  let hash = 2166136261;
  for (let i = 0; i < texto.length; i += 1) {
    hash ^= texto.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const matriz = Array.from({ length: tamano }, () => Array(tamano).fill(false));

  const dibujarPatronEsquina = (filaInicio, colInicio) => {
    for (let r = 0; r < 7; r += 1) {
      for (let c = 0; c < 7; c += 1) {
        const esBorde = r === 0 || r === 6 || c === 0 || c === 6;
        const esCentro = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matriz[filaInicio + r][colInicio + c] = esBorde || esCentro;
      }
    }
  };

  dibujarPatronEsquina(0, 0);
  dibujarPatronEsquina(0, tamano - 7);
  dibujarPatronEsquina(tamano - 7, 0);

  let estado = hash >>> 0;
  for (let r = 0; r < tamano; r += 1) {
    for (let c = 0; c < tamano; c += 1) {
      const enEsquinaSupIzq = r < 8 && c < 8;
      const enEsquinaSupDer = r < 8 && c >= tamano - 8;
      const enEsquinaInfIzq = r >= tamano - 8 && c < 8;
      if (enEsquinaSupIzq || enEsquinaSupDer || enEsquinaInfIzq) continue;

      estado = (Math.imul(1664525, estado) + 1013904223) >>> 0;
      matriz[r][c] = ((estado >>> ((r + c) % 8)) & 1) === 1;
    }
  }

  return matriz;
};

export const QrVisual = ({ valor, size = 156, color = '#2c3e50' }) => {
  const matriz = generarMatrizQr(valor || 'XTREMEFUN', 17);
  const celdas = matriz.length;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#ffffff',
        padding: '0.85rem',
        borderRadius: '14px',
        border: '2px solid #e2e8f0',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${celdas} ${celdas}`}
        role="img"
        aria-label={`Código QR ${valor}`}
        style={{ shapeRendering: 'crispEdges', display: 'block' }}
      >
        <rect width={celdas} height={celdas} fill="#ffffff" />
        {matriz.map((fila, r) =>
          fila.map((activo, c) =>
            activo ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill={color} /> : null
          )
        )}
      </svg>
      <span
        style={{
          marginTop: '0.5rem',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: 'var(--text-dark)',
          letterSpacing: '0.5px',
          wordBreak: 'break-all',
        }}
      >
        {valor}
      </span>
    </div>
  );
};

export const imprimirFacturaOperacion = (operacion) => {
  if (!operacion) return;
  const ventana = window.open('', '_blank', 'width=620,height=720');
  if (!ventana) {
    window.print();
    return;
  }

  const filasItems = (operacion.items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${item.cantidad}x ${item.nombre}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">Bs. ${item.precio}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">Bs. ${item.precio * item.cantidad}</td>
      </tr>`
    )
    .join('');

  ventana.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Factura ${operacion.codigoVenta}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 28px; color: #2c3e50; }
        h1 { margin: 0 0 4px 0; font-size: 24px; }
        .sub { color: #64748b; font-size: 13px; margin-bottom: 18px; }
        .box { background: #f8fafc; padding: 14px; border-radius: 10px; margin-bottom: 18px; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 14px; }
        th { text-align: left; border-bottom: 2px solid #2c3e50; padding: 8px; }
        th:nth-child(2), th:nth-child(3) { text-align: right; }
        .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 10px; }
      </style>
    </head>
    <body>
      <h1>XtremeFun Megacenter — Factura / Recibo</h1>
      <div class="sub">Código de Venta: <strong>${operacion.codigoVenta}</strong> • Fecha: ${operacion.fechaCompra || operacion.fechaHora || ''}</div>
      <div class="box">
        <div><strong>Cliente:</strong> ${operacion.cliente?.nombre || 'Cliente'}</div>
        <div><strong>CI:</strong> ${operacion.cliente?.ci || 'No especificado'}</div>
        <div><strong>Correo:</strong> ${operacion.cliente?.email || 'No especificado'}</div>
        <div><strong>Tipo:</strong> ${operacion.tipo === 'comida' ? 'Comida y Bebidas' : `Atracciones (QR: ${operacion.codigoIngresoQr || ''})`}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Concepto</th>
            <th>Unitario</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${filasItems}
        </tbody>
      </table>
      <div class="total">Total: Bs. ${operacion.montoPagado || operacion.montoTotal}</div>
      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `);
  ventana.document.close();
};

const ModalPagoQr = ({ operacion, onCerrar, onConfirmarValidacionPago }) => {
  const [montoIngresado, setMontoIngresado] = useState(
    String(operacion?.montoTotal ?? 0)
  );
  const [errorValidacion, setErrorValidacion] = useState('');
  const [copiado, setCopiado] = useState(false);

  if (!operacion) return null;

  const mostrarDirecto =
    operacion.estadoPago === 'validado' || Boolean(operacion.mostrarFacturaDirecta);
  const codigoQrProvisional = `PAY-PROV-${operacion.codigoVenta}`;
  const totalMostrado = operacion.montoPagado || operacion.montoTotal;

  const handleValidarPago = () => {
    setErrorValidacion('');
    const pagado = Number(montoIngresado);
    const totalRequerido = Number(operacion.montoTotal);

    if (Number.isNaN(pagado) || pagado < totalRequerido) {
      setErrorValidacion(
        `El monto pagado (Bs. ${Number.isNaN(pagado) ? 0 : pagado}) no cubre el total requerido de Bs. ${totalRequerido}.`
      );
      return;
    }

    onConfirmarValidacionPago(operacion.codigoVenta, pagado);
  };

  const copiarCodigo = async (texto) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }} onClick={onCerrar}>
      <div
        className="modal-content"
        style={{ maxWidth: '520px', maxHeight: '92vh', overflowY: 'auto', textAlign: 'left' }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="close-btn" onClick={onCerrar}>
          &times;
        </span>

        {!mostrarDirecto ? (
          <>
            <h3 style={{ textAlign: 'center' }}>QR Provisional de Pago</h3>
            <p style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '0.88rem' }}>
              Código de Venta: <strong>{operacion.codigoVenta}</strong> • Total a pagar:{' '}
              <strong>Bs. {operacion.montoTotal}</strong>
            </p>

            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <QrVisual valor={codigoQrProvisional} size={150} color="#2c3e50" />
            </div>

            <div
              style={{
                background: 'var(--bg-color)',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                fontSize: '0.84rem',
                marginBottom: '1rem',
              }}
            >
              <div>
                <strong>Cliente:</strong> {operacion.cliente?.nombre} (CI: {operacion.cliente?.ci})
              </div>
              <div>
                <strong>Detalle:</strong>{' '}
                {(operacion.items || []).map((i) => `${i.cantidad}x ${i.nombre}`).join(', ')}
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '0.75rem' }}>
              <label>Monto pagado verificado (Bs.)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={montoIngresado}
                onChange={(e) => setMontoIngresado(e.target.value)}
              />
            </div>

            {errorValidacion && (
              <div
                style={{
                  backgroundColor: '#fff5f5',
                  border: '1px solid #feb2b2',
                  color: '#c53030',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  fontSize: '0.83rem',
                  marginBottom: '0.85rem',
                }}
              >
                {errorValidacion}
              </div>
            )}

            <button
              type="button"
              className="btn-primary btn-full"
              style={{ marginTop: 0 }}
              onClick={handleValidarPago}
            >
              Validar pago
            </button>
          </>
        ) : operacion.tipo === 'atracciones' ? (
          <>
            <h3 style={{ textAlign: 'center' }}>QR de Ingreso y Factura — Atracciones</h3>

            <div
              style={{
                backgroundColor: '#e8f8ef',
                border: '1px solid #27ae60',
                color: '#145a32',
                padding: '0.7rem 1rem',
                borderRadius: '12px',
                fontSize: '0.86rem',
                fontWeight: 600,
                textAlign: 'center',
                marginBottom: '1rem',
              }}
            >
              ✅ ¡Listo! Tu QR de ingreso y factura están generados para usar en atracciones.
            </div>

            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <QrVisual valor={operacion.codigoIngresoQr} size={150} color="#1d4ed8" />
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                  onClick={() => copiarCodigo(operacion.codigoIngresoQr)}
                >
                  {copiado ? '¡Copiado!' : 'Copiar QR de ingreso'}
                </button>
              </div>
            </div>

            <div
              style={{
                background: 'var(--bg-color)',
                padding: '0.9rem 1rem',
                borderRadius: '14px',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <strong>Código Venta:</strong>
                <span>{operacion.codigoVenta}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <strong>Fecha de compra:</strong>
                <span>{operacion.fechaCompra}</span>
              </div>
              <div style={{ marginBottom: '0.35rem' }}>
                <strong>Cliente:</strong> {operacion.cliente?.nombre} (CI: {operacion.cliente?.ci})
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Correo:</strong> {operacion.cliente?.email}
              </div>

              <hr style={{ border: 'none', borderTop: '1px dashed #cbd5e0', margin: '0.5rem 0' }} />
              {(operacion.items || []).map((item) => (
                <div
                  key={item.id}
                  style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}
                >
                  <span>
                    {item.cantidad}x {item.nombre}
                  </span>
                  <strong>Bs. {item.precio * item.cantidad}</strong>
                </div>
              ))}

              <div style={{ marginTop: '0.5rem' }}>
                <strong>Pases por atracción:</strong>
                <ul style={{ marginTop: '0.3rem', paddingLeft: '1.2rem' }}>
                  {(operacion.pasesPorAtraccion || []).map((p) => (
                    <li key={p.atraccionId}>
                      {p.nombre}: <strong>{p.restantes}</strong> de {p.total} pases disponibles
                    </li>
                  ))}
                </ul>
              </div>

              <hr style={{ border: 'none', borderTop: '1px dashed #cbd5e0', margin: '0.5rem 0' }} />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1rem',
                  fontWeight: 700,
                }}
              >
                <span>Total:</span>
                <span>Bs. {totalMostrado}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => imprimirFacturaOperacion(operacion)}
              >
                🖨️ Imprimir / Guardar factura
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 1, marginTop: 0 }}
                onClick={onCerrar}
              >
                Listo
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 style={{ textAlign: 'center' }}>Factura de Pedido — Comida</h3>

            <div
              style={{
                backgroundColor: '#e8f8ef',
                border: '1px solid #27ae60',
                color: '#145a32',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                fontSize: '0.88rem',
                fontWeight: 600,
                textAlign: 'center',
                marginBottom: '1rem',
              }}
            >
              ✅ ¡Listo! Ya puedes ir a pedir al mostrador con esta factura.
            </div>

            <div
              style={{
                background: 'var(--bg-color)',
                padding: '1rem',
                borderRadius: '14px',
                fontSize: '0.86rem',
                marginBottom: '1rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <strong>Código Venta:</strong>
                <span>{operacion.codigoVenta}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <strong>QR Comida:</strong>
                <span>{operacion.codigoComidaQr || `COM-${operacion.codigoVenta}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <strong>Fecha de compra:</strong>
                <span>{operacion.fechaCompra}</span>
              </div>
              <div style={{ marginBottom: '0.4rem' }}>
                <strong>Cliente:</strong> {operacion.cliente?.nombre} (CI: {operacion.cliente?.ci})
              </div>
              <div style={{ marginBottom: '0.6rem' }}>
                <strong>Correo:</strong> {operacion.cliente?.email}
              </div>
              <hr style={{ border: 'none', borderTop: '1px dashed #cbd5e0', margin: '0.5rem 0' }} />
              {(operacion.items || []).map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.35rem',
                  }}
                >
                  <span>
                    {item.cantidad}x {item.nombre}
                  </span>
                  <strong>Bs. {item.precio * item.cantidad}</strong>
                </div>
              ))}
              <hr style={{ border: 'none', borderTop: '1px dashed #cbd5e0', margin: '0.5rem 0' }} />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1rem',
                  fontWeight: 700,
                }}
              >
                <span>Total:</span>
                <span>Bs. {totalMostrado}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => imprimirFacturaOperacion(operacion)}
              >
                🖨️ Imprimir / Guardar factura
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 1, marginTop: 0 }}
                onClick={onCerrar}
              >
                Ir al mostrador
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ModalPagoQr;