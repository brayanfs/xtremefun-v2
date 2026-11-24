// src/services/api.js

// Esta será la URL de tu backend (Node.js, Spring Boot, Laravel, etc.)
const BASE_URL = 'http://localhost:8080/api'; 

export const ApiService = {
    
    // 1. Obtener Atracciones (Tabla Atraccion)
    getAtracciones: async () => {
        try {
            const res = await fetch(`${BASE_URL}/atracciones`);
            return await res.json();
        } catch (error) {
            console.error("Error al cargar atracciones:", error);
            return [];
        }
    },

    // 2. Login de Cliente (Tabla Cliente)
    login: async (email, password) => {
        try {
            const res = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            return await res.json();
        } catch (error) {
            console.error("Error en login:", error);
        }
    },

    // 3. Crear Venta/Ticket (Tabla VentaTicket)
    crearVenta: async (datosVenta) => {
        try {
            const res = await fetch(`${BASE_URL}/ventas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosVenta)
            });
            return await res.json();
        } catch (error) {
            console.error("Error al crear venta:", error);
        }
    }
};