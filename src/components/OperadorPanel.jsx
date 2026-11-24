import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './AdminPanel.css';

const ATRACCIONES_DISPONIBLES = [
  { id: 'trampoline', nombre: 'Trampoline Park', duracionMinutos: 60 },
  { id: 'bowling', nombre: 'Bowling', duracionMinutos: 45 },
  { id: 'tirolesa', nombre: 'Tirolesa Extrema', duracionMinutos: 15 },
  { id: 'lasertag', nombre: 'Láser Tag', duracionMinutos: 15 },
];

const STORAGE_KEY_SESIONES_ATRACCION = 'xtremefun_operador_sesiones_v1';
const STORAGE_KEY_CLIENTES = 'xtremefun_clientes_registrados_v1';
const STORAGE_KEY_CLIENTE_SESION = 'xtremefun_cliente_sesion_v1';

const formatearTiempo = (segundosTotales) => {
  const s = Math.max(0, segundosTotales);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const generarSiguienteManilla = (sesionesEnAtraccion, momentoActual) => {
  const usadas = new Set(
    sesionesEnAtraccion
      .filter((s) => s.expiraEn > momentoActual)
      .map((s) => {
        const match = String(s.manilla).match(/(\d+)/);
        return match ? Number(match[1]) : null;
      })
      .filter((n) => n !== null)
  );

  let numero = 1;
  while (usadas.has(numero)) {
    numero += 1;
  }
  return `M-${String(numero).padStart(2, '0')}`;
};

const separarNombreApellidos = (nombreCompleto = '') => {
  const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean);
  if (partes.length <= 1) {
    return { nombre: partes[0] || 'Cliente', apellidos: '' };
  }
  return {
    nombre: partes[0],
    apellidos: partes.slice(1).join(' '),
  };
};

const leerMenoresDeCliente = (clienteVenta) => {
  if (!clienteVenta) return [];
  const ciBuscado = String(clienteVenta.ci || '').trim();
  const emailBuscado = String(clienteVenta.email || '').trim().toLowerCase();

  try {
    const sesionRaw = localStorage.getItem(STORAGE_KEY_CLIENTE_SESION);
    if (sesionRaw) {
      const sesion = JSON.parse(sesionRaw);
      const coincideSesion =
        (ciBuscado && ciBuscado !== 'No especificado' && String(sesion.ci || '').trim() === ciBuscado) ||
        (emailBuscado && String(sesion.email || '').trim().toLowerCase() === emailBuscado);
      if (coincideSesion && Array.isArray(sesion.menores) && sesion.menores.length > 0) {
        return sesion.menores;
      }
    }
  } catch {
    // Ignorar errores de lectura
  }

  try {
    const listaRaw = localStorage.getItem(STORAGE_KEY_CLIENTES);
    if (listaRaw) {
      const lista = JSON.parse(listaRaw);
      const match = lista.find(
        (c) =>
          (ciBuscado && ciBuscado !== 'No especificado' && String(c.ci || '').trim() === ciBuscado) ||
          (emailBuscado && String(c.email || '').trim().toLowerCase() === emailBuscado)
      );
      if (match && Array.isArray(match.menores)) {
        return match.menores;
      }
    }
  } catch {
    // Ignorar errores de lectura
  }

  return Array.isArray(clienteVenta.menores) ? clienteVenta.menores : [];
};

const guardarMenorEnCuentaCliente = (clienteVenta, nuevoMenor) => {
  if (!clienteVenta) return;
  const ciBuscado = String(clienteVenta.ci || '').trim();
  const emailBuscado = String(clienteVenta.email || '').trim().toLowerCase();

  const coincide = (persona) => {
    if (!persona) return false;
    const mismoCi =
      ciBuscado &&
      ciBuscado !== 'No especificado' &&
      String(persona.ci || '').trim() === ciBuscado;
    const mismoEmail =
      emailBuscado &&
      String(persona.email || '').trim().toLowerCase() === emailBuscado;
    return mismoCi || mismoEmail;
  };

  try {
    const sesionRaw = localStorage.getItem(STORAGE_KEY_CLIENTE_SESION);
    if (sesionRaw) {
      const sesion = JSON.parse(sesionRaw);
      if (coincide(sesion)) {
        const actuales = Array.isArray(sesion.menores) ? sesion.menores : [];
        localStorage.setItem(
          STORAGE_KEY_CLIENTE_SESION,
          JSON.stringify({ ...sesion, menores: [...actuales, nuevoMenor] })
        );
      }
    }
  } catch {
    // Ignorar errores de escritura
  }

  try {
    const listaRaw = localStorage.getItem(STORAGE_KEY_CLIENTES);
    if (listaRaw) {
      const lista = JSON.parse(listaRaw);
      const actualizada = lista.map((cli) => {
        if (!coincide(cli)) return cli;
        const actuales = Array.isArray(cli.menores) ? cli.menores : [];
        return { ...cli, menores: [...actuales, nuevoMenor] };
      });
      localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(actualizada));
    }
  } catch {
    // Ignorar errores de escritura
  }
};

const OperadorPanel = ({
  empleadoActual,
  volverAlInicio,
  ventasValidadas = [],
  onConsumirPaseAtraccion,
  sesionesActivas: sesionesActivasProp,
  onActualizarSesiones: onActualizarSesionesProp,
}) => {
  const [atraccionActiva, setAtraccionActiva] = useState(ATRACCIONES_DISPONIBLES[0].id);

  const [sesionesLocales, setSesionesLocales] = useState(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY_SESIONES_ATRACCION);
      if (guardado) return JSON.parse(guardado);
    } catch {
      // Ignorar errores de almacenamiento
    }
    const ahora = Date.now();
    return [
      {
        id: 'SES-1',
        atraccionId: 'trampoline',
        codigoQr: 'ING-DEMO-01',
        codigoVenta: 'VTA-DEMO-01',
        manilla: 'M-01',
        nombre: 'Andrés',
        apellidos: 'Gutiérrez León',
        expiraEn: ahora + 115 * 1000,
      },
      {
        id: 'SES-2',
        atraccionId: 'trampoline',
        codigoQr: 'ING-DEMO-02',
        codigoVenta: 'VTA-DEMO-02',
        manilla: 'M-02',
        nombre: 'Valeria',
        apellidos: 'Ríos Mendoza',
        expiraEn: ahora + 38 * 60 * 1000,
      },
    ];
  });

  const controladoPorPadre =
    Array.isArray(sesionesActivasProp) && typeof onActualizarSesionesProp === 'function';

  const sesionesActivas = controladoPorPadre ? sesionesActivasProp : sesionesLocales;

  const actualizarSesiones = useCallback(
    (actualizador) => {
      if (controladoPorPadre) {
        onActualizarSesionesProp((prev) =>
          typeof actualizador === 'function' ? actualizador(prev || []) : actualizador
        );
      } else {
        setSesionesLocales((prev) =>
          typeof actualizador === 'function' ? actualizador(prev || []) : actualizador
        );
      }
    },
    [controladoPorPadre, onActualizarSesionesProp]
  );

  const [ahora, setAhora] = useState(Date.now());
  const [mensajeError, setMensajeError] = useState('');

  // Escáner QR y cuadro de asignación de beneficiario (titular o hijo/niño)
  const [escanerAbierto, setEscanerAbierto] = useState(false);
  const [codigoEscaneoInput, setCodigoEscaneoInput] = useState('');
  const [errorEscaneo, setErrorEscaneo] = useState('');
  const [camaraActiva, setCamaraActiva] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [ventaEscaneada, setVentaEscaneada] = useState(null);
  const [menoresDisponibles, setMenoresDisponibles] = useState([]);
  const [nuevoMenorNombre, setNuevoMenorNombre] = useState('');
  const [nuevoMenorCi, setNuevoMenorCi] = useState('');
  const [nuevoMenorEdad, setNuevoMenorEdad] = useState('');
  const [duracionAsignacion, setDuracionAsignacion] = useState(60);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setAhora(Date.now());
    }, 1000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (controladoPorPadre) return;
    try {
      localStorage.setItem(STORAGE_KEY_SESIONES_ATRACCION, JSON.stringify(sesionesLocales));
    } catch {
      // Ignorar errores de almacenamiento
    }
  }, [controladoPorPadre, sesionesLocales]);

  const detenerCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCamaraActiva(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const iniciarCamara = async () => {
    setErrorEscaneo('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorEscaneo('La cámara no está disponible en este navegador. Selecciona o escribe el código QR.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setCamaraActiva(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setErrorEscaneo('No se pudo acceder a la cámara. Puedes seleccionar o ingresar el código QR manualmente.');
    }
  };

  const infoAtraccion = ATRACCIONES_DISPONIBLES.find((a) => a.id === atraccionActiva);

  const ventasConPasesParaAtraccion = useMemo(() => {
    return ventasValidadas.filter((v) => {
      if (v.tipo !== 'atracciones' || v.estadoPago !== 'validado') return false;
      const pase = (v.pasesPorAtraccion || []).find((p) => p.atraccionId === atraccionActiva);
      return pase && pase.restantes > 0;
    });
  }, [ventasValidadas, atraccionActiva]);

  const buscarVentaPorCodigo = (codigo) => {
    const limpio = String(codigo || '').trim().toUpperCase();
    if (!limpio) return null;
    return ventasValidadas.find(
      (v) =>
        v.tipo === 'atracciones' &&
        (String(v.codigoIngresoQr || '').toUpperCase() === limpio ||
          String(v.codigoVenta || '').toUpperCase() === limpio)
    );
  };

  const abrirEscanerQr = () => {
    setErrorEscaneo('');
    setCodigoEscaneoInput('');
    setEscanerAbierto(true);
  };

  const cerrarEscanerQr = () => {
    detenerCamara();
    setEscanerAbierto(false);
  };

  const procesarCodigoQrEscaneado = (codigoOverride) => {
    setErrorEscaneo('');
    setMensajeError('');

    const objetivo = (codigoOverride ?? codigoEscaneoInput).trim().toUpperCase();
    if (!objetivo) {
      setErrorEscaneo('Ingresa o selecciona un código QR válido.');
      return;
    }

    const venta = buscarVentaPorCodigo(objetivo);
    if (!venta) {
      setErrorEscaneo(`El código "${objetivo}" no corresponde a una compra registrada.`);
      return;
    }

    if (venta.estadoPago !== 'validado') {
      setErrorEscaneo(`El pago de la venta ${venta.codigoVenta} aún no está validado.`);
      return;
    }

    const paseAtraccion = (venta.pasesPorAtraccion || []).find(
      (p) => p.atraccionId === atraccionActiva
    );

    if (!paseAtraccion || paseAtraccion.restantes <= 0) {
      setErrorEscaneo(
        `No hay pases disponibles para ${infoAtraccion?.nombre} en la venta ${venta.codigoVenta}.`
      );
      return;
    }

    const menores = leerMenoresDeCliente(venta.cliente);
    setMenoresDisponibles(menores);
    setDuracionAsignacion(paseAtraccion.minutos || infoAtraccion?.duracionMinutos || 30);
    setVentaEscaneada(venta);
    setNuevoMenorNombre('');
    setNuevoMenorCi('');
    setNuevoMenorEdad('');
    detenerCamara();
    setEscanerAbierto(false);
  };

  const handleAgregarMenorEnCuadro = (e) => {
    e.preventDefault();
    if (!nuevoMenorNombre.trim() || !nuevoMenorCi.trim() || !nuevoMenorEdad) return;

    const creado = {
      id: `MEN-${Date.now()}`,
      nombreCompleto: nuevoMenorNombre.trim(),
      ci: nuevoMenorCi.trim(),
      edad: Number(nuevoMenorEdad),
    };

    guardarMenorEnCuentaCliente(ventaEscaneada?.cliente, creado);
    setMenoresDisponibles((prev) => [...prev, creado]);
    setNuevoMenorNombre('');
    setNuevoMenorCi('');
    setNuevoMenorEdad('');
  };

  const asignarPaseYManillaAPersona = (nombreCompletoPersona) => {
    if (!ventaEscaneada) return;
    setMensajeError('');

    const paseAtraccion = (ventaEscaneada.pasesPorAtraccion || []).find(
      (p) => p.atraccionId === atraccionActiva
    );

    if (!paseAtraccion || paseAtraccion.restantes <= 0) {
      setMensajeError(
        `Ya no quedan pases disponibles para ${infoAtraccion?.nombre} en la venta ${ventaEscaneada.codigoVenta}.`
      );
      return;
    }

    if (onConsumirPaseAtraccion) {
      onConsumirPaseAtraccion(ventaEscaneada.codigoVenta, atraccionActiva);
    }

    const { nombre, apellidos } = separarNombreApellidos(nombreCompletoPersona);
    const sesionesEnPuesto = sesionesActivas.filter((s) => s.atraccionId === atraccionActiva);
    const manillaAsignada = generarSiguienteManilla(sesionesEnPuesto, Date.now());
    const minutosAsignados = Number(duracionAsignacion) || paseAtraccion.minutos || 30;

    const nuevaSesion = {
      id: `SES-${Date.now()}`,
      atraccionId: atraccionActiva,
      codigoQr: ventaEscaneada.codigoIngresoQr || ventaEscaneada.codigoVenta,
      codigoVenta: ventaEscaneada.codigoVenta,
      manilla: manillaAsignada,
      nombre,
      apellidos,
      expiraEn: Date.now() + minutosAsignados * 60 * 1000,
    };

    actualizarSesiones((prev) => [nuevaSesion, ...prev]);

    const restantesDespuesDeUso = paseAtraccion.restantes - 1;
    if (restantesDespuesDeUso > 0) {
      setVentaEscaneada((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          pasesPorAtraccion: (prev.pasesPorAtraccion || []).map((p) =>
            p.atraccionId === atraccionActiva ? { ...p, restantes: restantesDespuesDeUso } : p
          ),
        };
      });
    } else {
      setVentaEscaneada(null);
    }
  };

  const proximaManillaAutomatica = useMemo(() => {
    const enPuesto = sesionesActivas.filter((s) => s.atraccionId === atraccionActiva);
    return generarSiguienteManilla(enPuesto, ahora);
  }, [sesionesActivas, atraccionActiva, ahora]);

  const cambiarAtraccion = (nuevoId) => {
    setAtraccionActiva(nuevoId);
    const encontrada = ATRACCIONES_DISPONIBLES.find((a) => a.id === nuevoId);
    if (encontrada) {
      setDuracionAsignacion(encontrada.duracionMinutos);
    }
    setVentaEscaneada(null);
    setMensajeError('');
  };

  const finalizarSalidaCliente = (idSesion) => {
    actualizarSesiones((prev) => prev.filter((s) => s.id !== idSesion));
  };

  const clientesEnAtraccion = sesionesActivas
    .filter((s) => s.atraccionId === atraccionActiva)
    .map((s) => {
      const segundosRestantes = Math.ceil((s.expiraEn - ahora) / 1000);
      return {
        ...s,
        segundosRestantes,
        porConcluir: segundosRestantes > 0 && segundosRestantes <= 120,
        concluido: segundosRestantes <= 0,
      };
    });

  const alertasCriticas = clientesEnAtraccion.filter((c) => c.porConcluir || c.concluido);
  const paseVentaEscaneada = ventaEscaneada
    ? (ventaEscaneada.pasesPorAtraccion || []).find((p) => p.atraccionId === atraccionActiva)
    : null;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h2>
            Control de <span className="highlight">Atracciones</span>
          </h2>
          <p>
            Operador: <strong>{empleadoActual?.nombre} {empleadoActual?.apellidos}</strong> • CI:{' '}
            {empleadoActual?.ci} • Código: {empleadoActual?.codigo}
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={volverAlInicio}>
          Cerrar Sesión / Salir
        </button>
      </div>

      {/* Selector de Atracción */}
      <div
        style={{
          background: 'var(--white)',
          padding: '1.25rem 1.5rem',
          borderRadius: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--secondary)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Puesto asignado actualmente
            </span>
            <h3 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.9rem', margin: 0 }}>
              🎮 {infoAtraccion?.nombre}
            </h3>
          </div>
          <button type="button" className="btn-primary" style={{ marginTop: 0 }} onClick={abrirEscanerQr}>
            📷 Escanear código QR
          </button>
        </div>

        <div className="admin-tabs" style={{ marginBottom: 0 }}>
          {ATRACCIONES_DISPONIBLES.map((atr) => {
            const conteo = sesionesActivas.filter((s) => s.atraccionId === atr.id).length;
            return (
              <button
                key={atr.id}
                type="button"
                className={`tab-btn ${atraccionActiva === atr.id ? 'activo' : ''}`}
                onClick={() => cambiarAtraccion(atr.id)}
              >
                {atr.nombre} ({conteo})
              </button>
            );
          })}
        </div>
      </div>

      {/* CUADRO DE ASIGNACIÓN TRAS ESCANEAR QR: TITULAR + NIÑOS/HIJOS A CARGO */}
      {ventaEscaneada && (
        <div
          style={{
            background: '#ffffff',
            border: '2px solid var(--primary)',
            borderRadius: '20px',
            padding: '1.35rem 1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '0.75rem',
            }}
          >
            <div>
              <h3 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.85rem', margin: 0 }}>
                Asignar Pase y Manilla ({proximaManillaAutomatica}) — {infoAtraccion?.nombre}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: 0 }}>
                QR: <strong>{ventaEscaneada.codigoIngresoQr}</strong> • Venta:{' '}
                <strong>{ventaEscaneada.codigoVenta}</strong> • Pases disponibles aquí:{' '}
                <strong>{paseVentaEscaneada?.restantes ?? 0}</strong>
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
              onClick={() => setVentaEscaneada(null)}
            >
              Cerrar cuadro
            </button>
          </div>

          <div style={{ marginBottom: '1rem', maxWidth: '220px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Tiempo del pase (minutos)</label>
              <input
                type="number"
                min="1"
                max="180"
                value={duracionAsignacion}
                onChange={(e) => setDuracionAsignacion(e.target.value)}
              />
            </div>
          </div>

          {/* 1. Titular de la cuenta al inicio */}
          <div
            style={{
              background: 'var(--bg-color)',
              padding: '0.9rem 1.1rem',
              borderRadius: '14px',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)' }}>
                TITULAR DE LA CUENTA
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                {ventaEscaneada.cliente?.nombre || 'Titular'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                CI: {ventaEscaneada.cliente?.ci || 'No especificado'}
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: 0, padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              onClick={() =>
                asignarPaseYManillaAPersona(ventaEscaneada.cliente?.nombre || 'Titular')
              }
            >
              Asignar a {ventaEscaneada.cliente?.nombre || 'Titular'}
            </button>
          </div>

          {/* 2. Niños o hijos a su cargo con su edad */}
          <div style={{ marginBottom: '1rem' }}>
            <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.92rem' }}>
              Niños o hijos a su cargo:
            </strong>

            {menoresDisponibles.length === 0 ? (
              <div
                style={{
                  background: '#fffdf5',
                  border: '1px dashed #f59e0b',
                  borderRadius: '12px',
                  padding: '0.9rem 1rem',
                  fontSize: '0.86rem',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '0.6rem' }}>
                  Este titular no tiene niños registrados. Rellena los datos para registrarlo:
                </div>

                <form onSubmit={handleAgregarMenorEnCuadro}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: '0.75rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label>Nombre completo del niño</label>
                      <input
                        type="text"
                        placeholder="Ej: Lucas Pérez"
                        value={nuevoMenorNombre}
                        onChange={(e) => setNuevoMenorNombre(e.target.value)}
                        required
                      />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label>CI</label>
                      <input
                        type="text"
                        placeholder="Ej: 1122334"
                        value={nuevoMenorCi}
                        onChange={(e) => setNuevoMenorCi(e.target.value)}
                        required
                      />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label>Edad</label>
                      <input
                        type="number"
                        min="1"
                        max="17"
                        placeholder="Ej: 8"
                        value={nuevoMenorEdad}
                        onChange={(e) => setNuevoMenorEdad(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ marginTop: 0, padding: '0.45rem 1rem', fontSize: '0.84rem' }}
                  >
                    Guardar niño y mostrar para asignar
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {menoresDisponibles.map((menor) => (
                  <div
                    key={menor.id}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.6rem',
                    }}
                  >
                    <div>
                      <strong>{menor.nombreCompleto}</strong> •{' '}
                      <span>
                        Edad: <strong>{menor.edad} años</strong>
                      </span>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                        CI: {menor.ci}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-primary"
                      style={{ marginTop: 0, padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}
                      onClick={() => asignarPaseYManillaAPersona(menor.nombreCompleto)}
                    >
                      Usar pase con {menor.nombreCompleto}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ALERTA DE TIEMPO FALTANDO 2 MINUTOS */}
      {alertasCriticas.length > 0 && (
        <div
          style={{
            backgroundColor: '#fff5f5',
            border: '2px solid #e74c3c',
            borderRadius: '18px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            boxShadow: '0 8px 20px rgba(231, 76, 60, 0.15)',
          }}
        >
          <strong style={{ color: '#c0392b', display: 'block', marginBottom: '0.5rem', fontSize: '1rem' }}>
            ⚠️ ALERTA DE TIEMPO EN {infoAtraccion?.nombre.toUpperCase()}
          </strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {alertasCriticas.map((c) => (
              <div
                key={c.id}
                style={{
                  backgroundColor: '#ffffff',
                  padding: '0.6rem 0.9rem',
                  borderRadius: '10px',
                  borderLeft: '4px solid #e74c3c',
                  fontSize: '0.92rem',
                  color: '#2c3e50',
                }}
              >
                {c.concluido ? (
                  <>
                    🔴 El tiempo del cliente <strong>{c.nombre} {c.apellidos}</strong> con{' '}
                    <strong>manilla N° {c.manilla}</strong> <strong>ha concluido</strong>.
                  </>
                ) : (
                  <>
                    ⏰ El tiempo del cliente <strong>{c.nombre} {c.apellidos}</strong> con{' '}
                    <strong>manilla N° {c.manilla}</strong> está por concluir (queda{' '}
                    <strong>{formatearTiempo(c.segundosRestantes)}</strong>).
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {mensajeError && (
        <div
          style={{
            backgroundColor: '#fff5f5',
            border: '1px solid #feb2b2',
            color: '#c53030',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            fontSize: '0.88rem',
            marginBottom: '1.25rem',
          }}
        >
          {mensajeError}
        </div>
      )}

      {/* CUADRO DE CONTROL EN TIEMPO REAL DE LA ATRACCIÓN */}
      <div className="admin-content" style={{ minHeight: 'auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <h3 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.8rem' }}>
            Control en Tiempo Real — {infoAtraccion?.nombre} ({clientesEnAtraccion.length})
          </h3>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>
            Alerta automática cuando falten 2:00 minutos
          </span>
        </div>

        {clientesEnAtraccion.length === 0 ? (
          <p style={{ color: 'var(--text-light)', padding: '1.5rem 0', textAlign: 'center' }}>
            No hay clientes registrados actualmente en {infoAtraccion?.nombre}. Usa &quot;Escanear código QR&quot; para iniciar un pase.
          </p>
        ) : (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>N° Manilla</th>
                  <th>Nombre del Cliente</th>
                  <th>Apellidos</th>
                  <th>QR / Código Venta</th>
                  <th>Tiempo Restante</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {clientesEnAtraccion.map((cliente) => (
                  <tr
                    key={cliente.id}
                    className={cliente.porConcluir || cliente.concluido ? 'alerta-stock' : ''}
                  >
                    <td>
                      <strong
                        style={{
                          background: 'var(--primary)',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '8px',
                        }}
                      >
                        {cliente.manilla}
                      </strong>
                    </td>
                    <td>{cliente.nombre}</td>
                    <td>{cliente.apellidos}</td>
                    <td>{cliente.codigoQr}</td>
                    <td>
                      <strong
                        style={{
                          fontSize: '1.05rem',
                          color:
                            cliente.porConcluir || cliente.concluido
                              ? '#e74c3c'
                              : 'var(--text-dark)',
                        }}
                      >
                        {formatearTiempo(cliente.segundosRestantes)}
                      </strong>
                    </td>
                    <td>
                      {cliente.concluido && (
                        <span className="badge-alerta">🔴 Tiempo concluido</span>
                      )}
                      {cliente.porConcluir && (
                        <span className="badge-alerta">⚠️ Por concluir (menos de 2 min)</span>
                      )}
                      {!cliente.porConcluir && !cliente.concluido && (
                        <span className="badge-ok">✅ En juego</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => finalizarSalidaCliente(cliente.id)}
                      >
                        Liberar Manilla
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL PARA ESCANEAR CÓDIGO QR */}
      {escanerAbierto && (
        <div className="modal-overlay" style={{ zIndex: 2200 }} onClick={cerrarEscanerQr}>
          <div
            className="modal-content"
            style={{ maxWidth: '480px', textAlign: 'left' }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="close-btn" onClick={cerrarEscanerQr}>
              &times;
            </span>
            <h3 style={{ textAlign: 'center' }}>Escanear Código QR</h3>
            <p style={{ textAlign: 'center', fontSize: '0.86rem', marginBottom: '1rem' }}>
              Escanea el QR de ingreso o selecciona un ticket validado para{' '}
              <strong>{infoAtraccion?.nombre}</strong>.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.9rem' }}>
              {!camaraActiva ? (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                  onClick={iniciarCamara}
                >
                  🎥 Activar cámara
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                  onClick={detenerCamara}
                >
                  ⏹ Detener cámara
                </button>
              )}
            </div>

            {camaraActiva && (
              <div style={{ marginBottom: '0.9rem', textAlign: 'center' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{
                    width: '100%',
                    maxHeight: '220px',
                    borderRadius: '12px',
                    background: '#000',
                  }}
                />
              </div>
            )}

            <div className="input-group" style={{ marginBottom: '0.75rem' }}>
              <label>Código QR o Código de Venta</label>
              <input
                type="text"
                placeholder="Ej: ING-VTA-123456 o VTA-123456"
                value={codigoEscaneoInput}
                onChange={(e) => setCodigoEscaneoInput(e.target.value)}
              />
            </div>

            {ventasConPasesParaAtraccion.length > 0 && (
              <div style={{ marginBottom: '0.9rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                  Tickets validados con pases disponibles ({infoAtraccion?.nombre}):
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {ventasConPasesParaAtraccion.map((v) => {
                    const pase = (v.pasesPorAtraccion || []).find(
                      (p) => p.atraccionId === atraccionActiva
                    );
                    const codigo = v.codigoIngresoQr || v.codigoVenta;
                    return (
                      <button
                        key={v.codigoVenta}
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.76rem' }}
                        onClick={() => procesarCodigoQrEscaneado(codigo)}
                      >
                        {codigo} ({pase?.restantes} pase/s)
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {errorEscaneo && (
              <p style={{ color: '#c53030', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                {errorEscaneo}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.84rem' }}
                onClick={cerrarEscanerQr}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ marginTop: 0, padding: '0.45rem 1rem', fontSize: '0.84rem' }}
                onClick={() => procesarCodigoQrEscaneado()}
              >
                Buscar Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperadorPanel;