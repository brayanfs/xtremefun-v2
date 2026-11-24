import { useState } from 'react';
import './Cumpleanos.css';

const Cumpleanos = ({ abrirModalGlobal }) => {
  // Estado para el contador del paquete personalizado
  const [cantidadPersonas, setCantidadPersonas] = useState(10);
  const [bonusSeleccionados, setBonusSeleccionados] = useState([]);

  // Lista de paquetes predefinidos
  const paquetes = [
    {
      id: 1,
      nombre: "Paquete Fiesta Básica",
      precio: 1000,
      invitados: 50,
      duracion: "2 horas",
      incluye: ["Acceso a Trampoline Park", "Pastel de cortesía", "Mesa decorada", "1 hora en Bowling"],
      imagen: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=600&auto=format&fit=crop" // Imagen de pastel/fiesta
    },
    {
      id: 2,
      nombre: "Paquete Aventura Extrema",
      precio: 1500,
      invitados: 50,
      duracion: "3 horas",
      incluye: ["Acceso a todas las atracciones", "Pastel de cortesía", "Habitación temática", "Comida para 50 personas"],
      imagen: "https://images.unsplash.com/photo-1574360772545-3b7852c7a4a5?q=80&w=600&auto=format&fit=crop" // Imagen de trampolín
    }
  ];

  // Lista de Bonus para el paquete personalizado
  const opcionesBonus = [
    { id: 'pastel', nombre: 'Pastel de Cortesía', precio: 150, icono: '🎂' },
    { id: 'decoracion', nombre: 'Decoración Temática', precio: 200, icono: '🎈' },
    { id: 'comida', nombre: 'Combo de Comida', precio: 300, icono: '🍕' },
    { id: 'fotografo', nombre: 'Fotógrafo', precio: 250, icono: '📸' },
  ];

  // Funciones para manejar el personalizado
  const aumentarPersonas = () => setCantidadPersonas(prev => prev + 1);
  const disminuirPersonas = () => setCantidadPersonas(prev => (prev > 1 ? prev - 1 : 1));

  const toggleBonus = (id) => {
    if (bonusSeleccionados.includes(id)) {
      setBonusSeleccionados(bonusSeleccionados.filter(item => item !== id));
    } else {
      setBonusSeleccionados([...bonusSeleccionados, id]);
    }
  };

  // Calcular precio del personalizado
  const calcularPrecioPersonalizado = () => {
    let base = cantidadPersonas * 30; // Ejemplo: 30 Bs por persona
    bonusSeleccionados.forEach(bonusId => {
      const bonus = opcionesBonus.find(b => b.id === bonusId);
      if (bonus) base += bonus.precio;
    });
    return base;
  };

  return (
    <div className="cumpleanos-page">
      <div className="cumpleanos-header">
        <h2 className="title">¡Celebra tu <span className="highlight">Cumpleaños</span> con nosotros!</h2>
        <p className="description">Elige uno de nuestros paquetes o arma el tuyo a medida. ¡La diversión está garantizada!</p>
      </div>

      {/* SECCIÓN DE PAQUETES PREDEFINIDOS */}
      <div className="paquetes-grid">
        {paquetes.map((paquete) => (
          <div key={paquete.id} className="paquete-card">
            <img src={paquete.imagen} alt={paquete.nombre} className="paquete-img" />
            <div className="paquete-info">
              <h3>{paquete.nombre}</h3>
              <p className="precio">Bs. {paquete.precio}</p>
              <ul className="lista-incluye">
                <li><strong>{paquete.invitados} invitados</strong> | {paquete.duracion}</li>
                {paquete.incluye.map((item, index) => (
                  <li key={index}>✓ {item}</li>
                ))}
              </ul>
              <button 
                className="btn-primary" 
                onClick={() => abrirModalGlobal('Reservar Paquete', `Estás a punto de reservar el "${paquete.nombre}". Te llevaremos al formulario de pago y reserva de fecha.`)}
              >
                Reservar este Paquete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* SECCIÓN DE PERSONALIZACIÓN */}
      <div className="personalizar-section">
        <h2 className="title">Crea tu <span className="highlight">Paquete Personalizado</span></h2>
        
        <div className="personalizar-container">
          {/* Contador de Personas */}
          <div className="contador-card">
            <h3>Cantidad de Invitados</h3>
            <p className="description">Ajusta el número de personas para tu evento.</p>
            <div className="contador-controls">
              <button className="btn-counter" onClick={disminuirPersonas}>-</button>
              <span className="contador-numero">{cantidadPersonas}</span>
              <button className="btn-counter" onClick={aumentarPersonas}>+</button>
            </div>
            <p className="costo-estimado">Costo base: Bs. {cantidadPersonas * 30}</p>
          </div>

          {/* Bonus con Imágenes */}
          <div className="bonus-card">
            <h3>Agrega un Bonus (Opcional)</h3>
            <div className="bonus-grid">
              {opcionesBonus.map((bonus) => (
                <div 
                  key={bonus.id} 
                  className={`bonus-item ${bonusSeleccionados.includes(bonus.id) ? 'seleccionado' : ''}`}
                  onClick={() => toggleBonus(bonus.id)}
                >
                  {/* Espacio para imagen del bonus */}
                  <div className="bonus-img-placeholder">
                    <span>{bonus.icono}</span>
                  </div>
                  <p>{bonus.nombre}</p>
                  <span className="bonus-precio">+ Bs. {bonus.precio}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen y Botón Final */}
          <div className="resumen-card">
            <h3>Total Estimado</h3>
            <p className="total-precio">Bs. {calcularPrecioPersonalizado()}</p>
            <button 
              className="btn-primary" 
              onClick={() => abrirModalGlobal('Personalizar Evento', `Has configurado un evento para ${cantidadPersonas} personas con ${bonusSeleccionados.length} bonus. Te llevaremos al formulario de confirmación.`)}
            >
              Personalizar y Reservar
            </button>
            <p className="nota">*El precio final puede variar según la fecha y disponibilidad.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cumpleanos;