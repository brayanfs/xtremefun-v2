import { useState, useEffect } from 'react';
import './App.css';
import Cumpleanos from './components/Cumpleanos';
import Auth from './components/Auth';
import Comida from './components/Comida';
import Atracciones from './components/Atracciones';
import AdminPanel from './components/AdminPanel';
import OperadorPanel from './components/OperadorPanel';
import AccesoAdmin, { PERSONAL_INICIAL } from './components/AccesoAdmin';
import ModalPagoQr from './components/ModalPagoQr';
import ClienteCuenta from './components/ClienteCuenta';

const STORAGE_KEY_PERSONAL = 'xtremefun_personal_v1';
const STORAGE_KEY_VENTAS = 'xtremefun_ventas_qr_v1';
const STORAGE_KEY_CLIENTE_SESION = 'xtremefun_cliente_sesion_v1';
const STORAGE_KEY_SESIONES_OPERADOR = 'xtremefun_operador_sesiones_v1';

function App() {
  const [vistaActual, setVistaActual] = useState('home');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [infoModal, setInfoModal] = useState({ titulo: '', texto: '', esReserva: false });
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  const [clienteActual, setClienteActual] = useState(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY_CLIENTE_SESION);
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  });

  const [operacionPagoActiva, setOperacionPagoActiva] = useState(null);

  const [ventasValidadas, setVentasValidadas] = useState(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY_VENTAS);
      return guardado ? JSON.parse(guardado) : [];
    } catch {
      return [];
    }
  });

  const [personal, setPersonal] = useState(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY_PERSONAL);
      return guardado ? JSON.parse(guardado) : PERSONAL_INICIAL;
    } catch {
      return PERSONAL_INICIAL;
    }
  });

  const [empleadoAutenticado, setEmpleadoAutenticado] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PERSONAL, JSON.stringify(personal));
    } catch {
      // Ignorar errores de almacenamiento
    }
  }, [personal]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VENTAS, JSON.stringify(ventasValidadas));
    } catch {
      // Ignorar errores de almacenamiento
    }
  }, [ventasValidadas]);

  useEffect(() => {
    try {
      if (clienteActual) {
        localStorage.setItem(STORAGE_KEY_CLIENTE_SESION, JSON.stringify(clienteActual));
      } else {
        localStorage.removeItem(STORAGE_KEY_CLIENTE_SESION);
      }
    } catch {
      // Ignorar errores de almacenamiento
    }
  }, [clienteActual]);

  const navegarA = (vista) => {
    if (vista !== 'admin') {
      setEmpleadoAutenticado(null);
    }
    if (vista === 'mi-perfil' || vista === 'mis-tickets') {
      try {
        const guardado = localStorage.getItem(STORAGE_KEY_CLIENTE_SESION);
        if (guardado) {
          setClienteActual(JSON.parse(guardado));
        }
      } catch {
        // Ignorar errores de almacenamiento
      }
    }
    setVistaActual(vista);
    setMenuMovilAbierto(false);
    setMenuUsuarioAbierto(false);
  };

  const abrirModal = (titulo, texto, esReserva = false) => {
    setInfoModal({ titulo, texto, esReserva });
    setModalAbierto(true);
    setMenuUsuarioAbierto(false);
  };

  const irAlAccesoAdmin = () => {
    setModalAbierto(false);
    setMenuUsuarioAbierto(false);
    setMenuMovilAbierto(false);
    setEmpleadoAutenticado(null);
    setVistaActual('acceso-admin');
  };

  const handleRequiereLoginCliente = () => {
    alert('Ingrese a su cuenta');
    setMenuUsuarioAbierto(false);
    setMenuMovilAbierto(false);
    setVistaActual('login');
  };

  const handleClienteAutenticado = (datosCliente) => {
    const conMenores = {
      ...datosCliente,
      menores: Array.isArray(datosCliente.menores) ? datosCliente.menores : [],
    };
    setClienteActual(conMenores);
    setVistaActual('home');
  };

  const handleCerrarSesionCliente = () => {
    setClienteActual(null);
    setMenuUsuarioAbierto(false);
    if (vistaActual === 'mi-perfil' || vistaActual === 'mis-tickets') {
      setVistaActual('home');
    }
  };

  const handleAgregarMenor = (nuevoMenor) => {
    setClienteActual((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        menores: [...(prev.menores || []), nuevoMenor],
      };
    });
  };

  const handleEliminarMenor = (idMenor) => {
    setClienteActual((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        menores: (prev.menores || []).filter((m) => m.id !== idMenor),
      };
    });
  };

  const handleIniciarPagoQr = (datosOperacion) => {
    const sufijo = Math.floor(100000 + Math.random() * 900000);
    const codigoVenta = `VTA-${sufijo}`;
    const ahoraStr = new Date().toLocaleString('es-BO');
    const validadoDirecto = Boolean(datosOperacion.mostrarFacturaDirecta);

    const nuevaOperacion = {
      ...datosOperacion,
      codigoVenta,
      codigoIngresoQr:
        datosOperacion.tipo === 'atracciones' ? `ING-${codigoVenta}` : null,
      codigoComidaQr:
        datosOperacion.tipo === 'comida' ? `COM-${codigoVenta}` : null,
      cliente: clienteActual,
      fechaCompra: ahoraStr,
      fechaHora: ahoraStr,
      fechaIngreso: null,
      consumido: false,
      fechaConsumo: null,
      estadoPago: validadoDirecto ? 'validado' : 'pendiente',
      montoPagado: validadoDirecto ? Number(datosOperacion.montoTotal) : 0,
    };

    setVentasValidadas((prev) => [nuevaOperacion, ...prev]);
    setOperacionPagoActiva(nuevaOperacion);
  };

  const handleConfirmarValidacionPago = (codigoVenta, montoPagado) => {
    let actualizada = null;
    setVentasValidadas((prev) =>
      prev.map((v) => {
        if (v.codigoVenta === codigoVenta) {
          actualizada = {
            ...v,
            estadoPago: 'validado',
            montoPagado,
          };
          return actualizada;
        }
        return v;
      })
    );

    if (actualizada) {
      setOperacionPagoActiva(actualizada);
    }
  };

  const handleConsumirPaseAtraccion = (codigoVenta, atraccionId) => {
    const ahoraStr = new Date().toLocaleString('es-BO');
    setVentasValidadas((prev) =>
      prev.map((v) => {
        if (v.codigoVenta !== codigoVenta) return v;
        const nuevosPases = (v.pasesPorAtraccion || []).map((p) => {
          if (p.atraccionId !== atraccionId || p.restantes <= 0) return p;
          return { ...p, restantes: p.restantes - 1 };
        });
        return {
          ...v,
          fechaIngreso: v.fechaIngreso || ahoraStr,
          pasesPorAtraccion: nuevosPases,
        };
      })
    );
  };

  const handleConsumirComida = (codigoVenta) => {
    const ahoraStr = new Date().toLocaleString('es-BO');
    setVentasValidadas((prev) =>
      prev.map((v) => {
        if (v.codigoVenta !== codigoVenta) return v;
        return {
          ...v,
          consumido: true,
          fechaConsumo: ahoraStr,
        };
      })
    );
  };

  const handleAgregarSolicitud = (nuevaSolicitud) => {
    setPersonal((prev) => [nuevaSolicitud, ...prev]);
  };

  const generarCodigoUnico = (listaActual) => {
    let codigo = '';
    let existe = true;
    while (existe) {
      const aleatorio = Math.floor(1000 + Math.random() * 9000);
      codigo = `XF-${aleatorio}`;
      existe = listaActual.some((item) => item.codigo === codigo);
    }
    return codigo;
  };

  const handleAprobarSolicitud = (idSolicitud) => {
    const codigoGenerado = generarCodigoUnico(personal);
    setPersonal((prev) =>
      prev.map((emp) =>
        emp.id === idSolicitud
          ? { ...emp, estado: 'aprobado', codigo: codigoGenerado }
          : emp
      )
    );
    return codigoGenerado;
  };

  const handleRechazarSolicitud = (idSolicitud) => {
    setPersonal((prev) =>
      prev.map((emp) =>
        emp.id === idSolicitud
          ? { ...emp, estado: 'rechazado', codigo: '' }
          : emp
      )
    );
  };

  const handleLoginAdminExitoso = (empleado) => {
    setEmpleadoAutenticado(empleado);
    setVistaActual('admin');
  };

  const handleCerrarSesionAdmin = () => {
    setEmpleadoAutenticado(null);
    navegarA('home');
  };

  let sesionesActivasActuales = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESIONES_OPERADOR);
    sesionesActivasActuales = raw ? JSON.parse(raw) : [];
  } catch {
    sesionesActivasActuales = [];
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">
          <button
            type="button"
            className="btn-menu-movil"
            aria-label="Abrir menú de navegación"
            aria-expanded={menuMovilAbierto}
            onClick={() => {
              setMenuMovilAbierto(!menuMovilAbierto);
              setMenuUsuarioAbierto(false);
            }}
          >
            {menuMovilAbierto ? '✕' : '☰'}
          </button>

          <div className="logo" onClick={() => navegarA('home')} style={{ cursor: 'pointer' }}>
            <h1>Xtreme<span>Fun</span></h1>
          </div>
        </div>

        <nav className={`nav ${menuMovilAbierto ? 'nav-open' : ''}`}>
          <button type="button" className="nav-link" onClick={() => navegarA('home')}>Inicio</button>
          <button type="button" className="nav-link" onClick={() => navegarA('atracciones')}>Atracciones</button>
          <button type="button" className="nav-link" onClick={() => navegarA('cumpleanos')}>Cumpleaños</button>
          <button type="button" className="nav-link" onClick={() => navegarA('comida')}>Comida</button>
        </nav>

        <div className="header-actions">
          <button type="button" className="btn-primary btn-cta-header" onClick={() => navegarA('login')}>
            ¡Vamos a jugar! 🚀
          </button>

          <div className="user-menu-container">
            <button
              type="button"
              className="btn-user"
              aria-label="Menú de usuario"
              onClick={() => {
                setMenuUsuarioAbierto(!menuUsuarioAbierto);
                setMenuMovilAbierto(false);
              }}
            >
              👤
            </button>

            {menuUsuarioAbierto && (
              <div className="user-dropdown">
                {clienteActual ? (
                  <>
                    <div className="user-info">
                      <h4>{clienteActual.nombre}</h4>
                      <p>CI: {clienteActual.ci}</p>
                      <p className="email">{clienteActual.email}</p>
                    </div>
                    <hr />
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => navegarA('mi-perfil')}
                    >
                      Mi Perfil
                    </button>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => navegarA('mis-tickets')}
                    >
                      Mis Tickets QR
                    </button>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={handleCerrarSesionCliente}
                    >
                      Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <>
                    <div className="user-info">
                      <h4>No se inició sesión</h4>
                      <p>Inicie sesión para comprar y ver su cuenta.</p>
                    </div>
                    <button
                      type="button"
                      className="dropdown-item"
                      style={{ fontWeight: 600, color: 'var(--text-dark)' }}
                      onClick={() => navegarA('login')}
                    >
                      🔑 Iniciar Sesión
                    </button>
                  </>
                )}

                <hr />
                <button
                  type="button"
                  className="dropdown-item admin-link"
                  onClick={irAlAccesoAdmin}
                >
                  🔐 Panel Administrativo
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {vistaActual === 'home' && (
        <main className="hero">
          <div className="hero-content">
            <p className="subtitle">PARQUE DE DIVERSIÓN • ZONA SUR • LA PAZ</p>
            <h2 className="title">XTREME FUN<br /><span className="highlight">MEGACENTER</span></h2>
            <p className="description">
              Una partida de bowling, saltos en Trampoline Park y una vuelta en los autos chocadores.
            </p>
            <div className="hero-buttons">
              <button type="button" className="btn-primary" onClick={() => navegarA('atracciones')}>
                Ver Atracciones
              </button>
              <button type="button" className="btn-secondary" onClick={() => navegarA('cumpleanos')}>
                Cumpleaños
              </button>
            </div>
          </div>
          <div className="hero-image">
            <img
              src="https://images.unsplash.com/photo-1574360772545-3b7852c7a4a5?q=80&w=800&auto=format&fit=crop"
              alt="Trampoline Park"
            />
            <div className="badge">Nivel 3</div>
          </div>
        </main>
      )}

      {vistaActual === 'atracciones' && (
        <Atracciones
          abrirModalGlobal={abrirModal}
          clienteActual={clienteActual}
          onRequiereLoginCliente={handleRequiereLoginCliente}
          onIniciarPagoQr={handleIniciarPagoQr}
        />
      )}
      {vistaActual === 'cumpleanos' && <Cumpleanos abrirModalGlobal={abrirModal} />}
      {vistaActual === 'comida' && (
        <Comida
          abrirModalGlobal={abrirModal}
          clienteActual={clienteActual}
          onRequiereLoginCliente={handleRequiereLoginCliente}
          onIniciarPagoQr={handleIniciarPagoQr}
        />
      )}
      {vistaActual === 'login' && (
        <Auth
          abrirModalGlobal={abrirModal}
          onClienteAutenticado={handleClienteAutenticado}
        />
      )}

      {vistaActual === 'mi-perfil' && (
        clienteActual ? (
          <ClienteCuenta
            seccionInicial="perfil"
            clienteActual={clienteActual}
            onAgregarMenor={handleAgregarMenor}
            onEliminarMenor={handleEliminarMenor}
            ventasValidadas={ventasValidadas}
            sesionesActivas={sesionesActivasActuales}
            onConsumirComida={handleConsumirComida}
            volverAlInicio={() => navegarA('home')}
          />
        ) : (
          <Auth
            abrirModalGlobal={abrirModal}
            onClienteAutenticado={handleClienteAutenticado}
          />
        )
      )}

      {vistaActual === 'mis-tickets' && (
        clienteActual ? (
          <ClienteCuenta
            seccionInicial="tickets"
            clienteActual={clienteActual}
            onAgregarMenor={handleAgregarMenor}
            onEliminarMenor={handleEliminarMenor}
            ventasValidadas={ventasValidadas}
            sesionesActivas={sesionesActivasActuales}
            onConsumirComida={handleConsumirComida}
            volverAlInicio={() => navegarA('home')}
          />
        ) : (
          <Auth
            abrirModalGlobal={abrirModal}
            onClienteAutenticado={handleClienteAutenticado}
          />
        )
      )}

      {vistaActual === 'acceso-admin' && (
        <AccesoAdmin
          personal={personal}
          onAgregarSolicitud={handleAgregarSolicitud}
          onLoginExitoso={handleLoginAdminExitoso}
          volverAlInicio={() => navegarA('home')}
        />
      )}

      {vistaActual === 'admin' && (
        empleadoAutenticado ? (
          empleadoAutenticado.cargo === 'Operador de Atracciones' ? (
            <OperadorPanel
              empleadoActual={empleadoAutenticado}
              volverAlInicio={handleCerrarSesionAdmin}
              ventasValidadas={ventasValidadas}
              onConsumirPaseAtraccion={handleConsumirPaseAtraccion}
            />
          ) : (
            <AdminPanel
              abrirModalGlobal={abrirModal}
              volverAlInicio={handleCerrarSesionAdmin}
              empleadoActual={empleadoAutenticado}
              personal={personal}
              onAprobarSolicitud={handleAprobarSolicitud}
              onRechazarSolicitud={handleRechazarSolicitud}
            />
          )
        ) : (
          <AccesoAdmin
            personal={personal}
            onAgregarSolicitud={handleAgregarSolicitud}
            onLoginExitoso={handleLoginAdminExitoso}
            volverAlInicio={() => navegarA('home')}
          />
        )
      )}

      {operacionPagoActiva && (
        <ModalPagoQr
          operacion={operacionPagoActiva}
          onCerrar={() => setOperacionPagoActiva(null)}
          onConfirmarValidacionPago={handleConfirmarValidacionPago}
        />
      )}

      {modalAbierto && (
        <div className="modal-overlay" onClick={() => setModalAbierto(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-btn" onClick={() => setModalAbierto(false)}>&times;</span>
            <h3>{infoModal.titulo}</h3>
            <p>{infoModal.texto}</p>
            {infoModal.esReserva ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  if (infoModal.titulo === 'Panel Administrativo') {
                    irAlAccesoAdmin();
                  } else {
                    setModalAbierto(false);
                    navegarA('mis-tickets');
                  }
                }}
              >
                {infoModal.titulo === 'Panel Administrativo' ? 'Continuar al Acceso' : 'Ver mi Ticket QR 📱'}
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={() => setModalAbierto(false)}>
                Entendido
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;