-- =========================================
--              TABLAS BASE
-- =========================================

CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password VARCHAR(200) NOT NULL,
    telefono VARCHAR(20),
    foto TEXT,
    estado BOOLEAN DEFAULT TRUE,
    token_real TEXT, -- PARA FIREBASE
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('cliente', 'tecnico', 'admin'))
);

-- =========================================
--           SUBCLASES DE USUARIO
-- =========================================

CREATE TABLE cliente (
    id_cliente INT PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    preferencia TEXT
);

CREATE TABLE tecnico (
    id_tecnico INT PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    descripcion TEXT,
    calificacion_promedio DECIMAL(3,2),
    disponibilidad BOOLEAN DEFAULT TRUE
);

CREATE TABLE admin (
    id_admin INT PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

-- =========================================
--                CATEGORÍA
-- =========================================

CREATE TABLE categoria (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

-- =========================================
--                  ZONA
-- =========================================

CREATE TABLE zona (
    id_zona SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ciudad VARCHAR(100),
    coordenadas TEXT
);

-- =========================================
--             ESPECIALIDAD
-- =========================================

CREATE TABLE especialidad (
    id_especialidad SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    referencias TEXT,
    anio_experiencia INT
);

-- =========================================
--       TABLAS INTERMEDIAS N..M
-- =========================================

CREATE TABLE tecnico_especialidad (
    id_tecnico_especialidad SERIAL PRIMARY KEY,
    id_tecnico INT REFERENCES tecnico(id_tecnico) ON DELETE CASCADE,
    id_especialidad INT REFERENCES especialidad(id_especialidad) ON DELETE CASCADE
);

CREATE TABLE tecnico_zona (
    id_tecnico_zona SERIAL PRIMARY KEY,
    id_tecnico INT REFERENCES tecnico(id_tecnico) ON DELETE CASCADE,
    id_zona INT REFERENCES zona(id_zona) ON DELETE CASCADE
);

-- =========================================
--         SOLICITUD DEL CLIENTE
-- =========================================

CREATE TABLE solicitud_servicio (
    id_solicitud SERIAL PRIMARY KEY,
    id_cliente INT REFERENCES cliente(id_cliente),
    id_categoria INT REFERENCES categoria(id_categoria),
    descripcion TEXT NOT NULL,
    fecha_publicacion TIMESTAMP DEFAULT NOW(),
    ubicacion_texto TEXT,
    lat DECIMAL(10,6),
    lon DECIMAL(10,6),
    estado VARCHAR(30) NOT NULL
        CHECK (estado IN ('pendiente', 'con_ofertas', 'asignado', 'en_proceso', 'completado', 'cancelado'))
);

-- =========================================
--             OFERTA DEL TÉCNICO
-- =========================================

CREATE TABLE oferta_tecnico (
    id_oferta SERIAL PRIMARY KEY,
    id_solicitud INT REFERENCES solicitud_servicio(id_solicitud) ON DELETE CASCADE,
    id_tecnico INT REFERENCES tecnico(id_tecnico) ON DELETE CASCADE,
    precio DECIMAL(10,2) NOT NULL,
    mensaje TEXT,
    fecha_oferta TIMESTAMP DEFAULT NOW(),
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('enviada', 'seleccionada', 'rechazada'))
);

-- =========================================
--           SERVICIO ASIGNADO
-- =========================================

CREATE TABLE servicio_asignado (
    id_servicio SERIAL PRIMARY KEY,
    id_solicitud INT REFERENCES solicitud_servicio(id_solicitud) ON DELETE CASCADE,
    id_oferta INT UNIQUE REFERENCES oferta_tecnico(id_oferta) ON DELETE CASCADE,
    id_tecnico INT REFERENCES tecnico(id_tecnico),
    fecha_asignacion TIMESTAMP DEFAULT NOW(),
    estado VARCHAR(20) NOT NULL 
        CHECK (estado IN ('en_camino', 'en_ejecucion', 'completado'))
);

-- =========================================
--               PAGOS STRIPE
-- =========================================

CREATE TABLE pago_servicio (
    id_pago SERIAL PRIMARY KEY,
    id_servicio INT UNIQUE REFERENCES servicio_asignado(id_servicio) ON DELETE CASCADE,
    stripe_payment_id VARCHAR(200),
    monto_total DECIMAL(10,2),
    comision_empresa DECIMAL(10,2),
    monto_tecnico DECIMAL(10,2),
    estado VARCHAR(20) CHECK (estado IN ('pendiente', 'pagado', 'fallido')),
    fecha_pago TIMESTAMP DEFAULT NOW()
);

-- =========================================
--               CALIFICACIONES
-- =========================================

CREATE TABLE calificacion (
    id_calificacion SERIAL PRIMARY KEY,
    id_servicio INT REFERENCES servicio_asignado(id_servicio) ON DELETE CASCADE,
    id_cliente INT REFERENCES cliente(id_cliente),
    id_tecnico INT REFERENCES tecnico(id_tecnico),
    puntuacion INT CHECK (puntuacion BETWEEN 1 AND 5),
    comentario TEXT,
    fecha TIMESTAMP DEFAULT NOW()
);

-- =========================================
--               INCIDENCIAS
-- =========================================

CREATE TABLE incidencia (
    id_incidencia SERIAL PRIMARY KEY,
    id_servicio INT REFERENCES servicio_asignado(id_servicio) ON DELETE CASCADE,
    id_usuario_reporta INT REFERENCES usuario(id_usuario),
    descripcion TEXT,
    fecha_reporte TIMESTAMP DEFAULT NOW(),
    estado VARCHAR(20) CHECK (estado IN ('pendiente', 'en_revision', 'resuelta'))
);

-- =========================================
--                CHAT MENSAJES
-- =========================================

CREATE TABLE chat_mensaje (
    id_mensaje SERIAL PRIMARY KEY,
    id_servicio INT REFERENCES servicio_asignado(id_servicio) ON DELETE CASCADE,
    emisor_id INT REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    mensaje TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT NOW(),
    leido BOOLEAN DEFAULT FALSE
);

-- =========================================
--              NOTIFICACIONES
-- =========================================

CREATE TABLE notificacion (
    id_notificacion SERIAL PRIMARY KEY,
    id_usuario INT REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    titulo VARCHAR(200),
    cuerpo TEXT,
    fecha_envio TIMESTAMP DEFAULT NOW(),
    leido BOOLEAN DEFAULT FALSE
);

-- =========================================
--               AUDITORÍA
-- =========================================

CREATE TABLE auditoria_log (
    id_log SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuario(id_usuario),
    accion VARCHAR(200),
    fecha TIMESTAMP DEFAULT NOW(),
    detalles TEXT
);


-- 1. Crear tabla tecnico_ubicacion (PostgreSQL)

-- Tu sistema ya tiene zonas, pero un técnico REAL puede moverse.

-- Necesitas una tabla independiente para ENVIAR su ubicación cada cierto tiempo.

-- Aquí está la tabla:

CREATE TABLE tecnico_ubicacion (
    id_ubicacion SERIAL PRIMARY KEY,
    id_tecnico INT REFERENCES tecnico(id_tecnico) ON DELETE CASCADE,
    lat DECIMAL(10,6) NOT NULL,
    lon DECIMAL(10,6) NOT NULL,
    direccion_texto TEXT,
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);
