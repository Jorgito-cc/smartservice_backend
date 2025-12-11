const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Sequelize, DataTypes } = require('sequelize');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Crear instancia Sequelize con el proxy público de Railway
const sequelize = new Sequelize(
  process.env.PGDATABASE || process.env.DB_NAME,
  process.env.PGUSER || process.env.DB_USER,
  process.env.PGPASSWORD || process.env.DB_PASS,
  {
    host: process.env.PGHOST || process.env.DB_HOST,
    port: process.env.PGPORT || process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
  }
);

console.log(`Conectando a: ${process.env.PGHOST || process.env.DB_HOST}:${process.env.PGPORT || process.env.DB_PORT}`);

function toPascalCase(name) {
  return name
    .split(/[_-]/)
    .map((p) => {
      // remover plural simple final 's'
      const base = p.endsWith('s') ? p.slice(0, -1) : p;
      return base.charAt(0).toUpperCase() + base.slice(1);
    })
    .join('');
}

function normalizeValue(v) {
  if (v === undefined || v === null) return null;
  if (typeof v !== 'string') return v;
  const t = v.trim();
  if (t === '') return null;
  // JSON arrays/objects - deserializar correctamente
  if ((t.startsWith('[') && t.endsWith(']')) || (t.startsWith('{') && t.endsWith('}'))) {
    try {
      // Primero intentar parsear como está
      let obj = JSON.parse(t);
      // Re-serializar para garantizar formato limpio
      return JSON.stringify(obj);
    } catch (e) {
      // Si falla, intentar "reparar" escapes mal formados
      try {
        // Caso: CSV tiene [\"/path\"] o similares con escapes
        // Reemplazar \" con " si es necesario
        const repaired = t.replace(/\\"/g, '"').replace(/\\\//g, '/');
        let obj = JSON.parse(repaired);
        return JSON.stringify(obj);
      } catch (e2) {
        // Si aún falla, devolverlo como string
        return t;
      }
    }
  }
  // booleans
  if (t.toLowerCase() === 'true') return true;
  if (t.toLowerCase() === 'false') return false;
  // numbers
  if (!Number.isNaN(Number(t))) return Number(t);
  return t;
}

// Mapeo de nombres de archivo CSV a nombres reales de tabla en la BD
const csvTableMapping = {
  'usuarios': 'usuario',
  'tecnicos': 'tecnico',
  'especialidades': 'especialidad',
  'categorias': 'categoria',
  'zonas': 'zona',
  'adminstr': 'admin',
  'clientes': 'cliente',
  'solicitudes': 'solicitud_servicio',
  'ofertas': 'oferta_tecnico',
  'servicios': 'servicio_asignado',
  'pagos': 'pago_servicio',
  'calificaciones': 'calificacion',
  'incidencias': 'incidencia',
  'chats': 'chat_mensaje',
  'notificaciones': 'notificacion',
  'auditorias': 'auditoria_log'
};

function getTableName(csvFilename) {
  const base = csvFilename.replace('.csv', '');
  // Si existe mapping explícito, usarlo; si no, usar el nombre del archivo
  return csvTableMapping[base] || base;
}

async function importCSV(tableName, filePath) {
  return new Promise((resolve, reject) => {
    const records = [];

    fs.createReadStream(filePath)
      .pipe(csv({ skipLines: 0 }))
      .on('data', (row) => {
        const r = {};
        Object.keys(row).forEach((k) => {
          r[k.trim()] = normalizeValue(row[k]);
        });
        records.push(r);
      })
      .on('end', async () => {
        try {
          if (records.length === 0) {
            console.log(`ℹ No hay filas en ${filePath}`);
            return resolve();
          }

          // Usar raw query con VALUES literal para evitar problemas de parámetros
          const columns = Object.keys(records[0]);
          const columnList = columns.join(', ');
          
          // Construir VALUES con literals SQL para cada fila
          const valuesList = records.map((record, rowIdx) => {
            return '(' + columns.map((col) => {
              const val = record[col];
              if (val === null || val === undefined) {
                return 'NULL';
              } else if (typeof val === 'boolean') {
                return val ? 'TRUE' : 'FALSE';
              } else if (typeof val === 'number') {
                return val.toString();
              } else if (typeof val === 'string') {
                // Detectar si es JSON (comienza con [ o {)
                if ((val.startsWith('[') && val.endsWith(']')) || (val.startsWith('{') && val.endsWith('}'))) {
                  // Es JSON string - escapar comillas simples para SQL y castear a ::json en PostgreSQL
                  const escaped = val.replace(/'/g, "''");
                  return `'${escaped}'::json`;
                } else {
                  // String normal - escapar comillas simples
                  const escaped = val.replace(/'/g, "''");
                  return `'${escaped}'`;
                }
              } else {
                // Fallback para otros tipos
                return `'${String(val).replace(/'/g, "''")}'`;
              }
            }).join(', ') + ')';
          }).join(', ');

          const query = `INSERT INTO ${tableName} (${columnList}) VALUES ${valuesList} ON CONFLICT DO NOTHING`;
          
          try {
            await sequelize.query(query);
            console.log(`✔ Insertado: ${records.length} filas en ${tableName}`);
          } catch (bulkErr) {
            // Si falla la inserción masiva, intentar fila por fila para recuperar lo máximo posible
            console.warn(`⚠️  Reintentando inserción fila por fila en ${tableName}...`);
            let successCount = 0;
            for (const record of records) {
              try {
                const singleValueList = '(' + columns.map((col) => {
                  const val = record[col];
                  if (val === null || val === undefined) {
                    return 'NULL';
                  } else if (typeof val === 'boolean') {
                    return val ? 'TRUE' : 'FALSE';
                  } else if (typeof val === 'number') {
                    return val.toString();
                  } else if (typeof val === 'string') {
                    if ((val.startsWith('[') && val.endsWith(']')) || (val.startsWith('{') && val.endsWith('}'))) {
                      const escaped = val.replace(/'/g, "''");
                      return `'${escaped}'::json`;
                    } else {
                      const escaped = val.replace(/'/g, "''");
                      return `'${escaped}'`;
                    }
                  } else {
                    return `'${String(val).replace(/'/g, "''")}'`;
                  }
                }).join(', ') + ')';
                
                const singleQuery = `INSERT INTO ${tableName} (${columnList}) VALUES ${singleValueList} ON CONFLICT DO NOTHING`;
                await sequelize.query(singleQuery);
                successCount++;
              } catch (rowErr) {
                // Log pero continúa
                console.warn(`   Fila omitida (${Object.values(record).slice(0, 2).join(', ')})`);
              }
            }
            console.log(`✔ Insertado: ${successCount}/${records.length} filas en ${tableName}`);
          }

          resolve();
        } catch (err) {
          console.error(`❌ Error al insertar en ${tableName}:`, err.message || err);
          reject(err);
        }
      })
      .on('error', (err) => reject(err));
  });
}

async function runSeed() {
  try {
    console.log('🚀 Iniciando importación de CSV…');

    try {
      await sequelize.authenticate();
      console.log('🔌 Conexión a la base de datos OK');
    } catch (e) {
      console.error('❌ No se pudo autenticar con la DB:', e.message);
      process.exit(1);
    }

    // Deshabilitar triggers (foreign keys) temporalmente
    await sequelize.query('ALTER TABLE tecnico_especialidad DISABLE TRIGGER ALL');
    await sequelize.query('ALTER TABLE tecnico_zona DISABLE TRIGGER ALL');
    await sequelize.query('ALTER TABLE tecnico_ubicacion DISABLE TRIGGER ALL');
    await sequelize.query('ALTER TABLE oferta_tecnico DISABLE TRIGGER ALL');
    await sequelize.query('ALTER TABLE servicio_asignado DISABLE TRIGGER ALL');
    await sequelize.query('ALTER TABLE pago_servicio DISABLE TRIGGER ALL');
    await sequelize.query('ALTER TABLE calificacion DISABLE TRIGGER ALL');
    await sequelize.query('ALTER TABLE chat_mensaje DISABLE TRIGGER ALL');
    await sequelize.query('ALTER TABLE notificacion DISABLE TRIGGER ALL');
    await sequelize.query('ALTER TABLE auditoria_log DISABLE TRIGGER ALL');
    await sequelize.query('ALTER TABLE incidencia DISABLE TRIGGER ALL');
    console.log('⚙️ Foreign key constraints deshabilitadas temporalmente');

    const folder = path.join(__dirname, '..', 'data_templates');
    const files = fs.readdirSync(folder).filter((f) => f.endsWith('.csv'));

    // Orden preferente para respetar foreign keys
    const preferredOrder = [
      'usuarios',
      'admin',
      'cliente',
      'categoria',
      'especialidades',
      'zona',
      'tecnicos',
      'tecnico_especialidad',
      'tecnico_zona',
      'tecnico_ubicacion',
      'solicitudes',
      'oferta_tecnico',
      'servicio_asignado',
      'pago_servicio',
      'calificacion',
      'chat_mensaje',
      'notificacion',
      'auditoria_log',
      'incidencia'
    ];

    // sort files by preferredOrder (files not listed go last, kept alphabetical)
    files.sort((a, b) => {
      const aBase = a.replace('.csv', '');
      const bBase = b.replace('.csv', '');
      const ai = preferredOrder.indexOf(aBase);
      const bi = preferredOrder.indexOf(bBase);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

    for (const file of files) {
      const base = file.replace('.csv', '');
      const tableName = getTableName(file);
      const filePath = path.join(folder, file);
      console.log(`📥 Importando ${file} → tabla ${tableName}`);
      await importCSV(tableName, filePath);
    }

    // Re-habilitar triggers
    await sequelize.query('ALTER TABLE tecnico_especialidad ENABLE TRIGGER ALL');
    await sequelize.query('ALTER TABLE tecnico_zona ENABLE TRIGGER ALL');
    await sequelize.query('ALTER TABLE tecnico_ubicacion ENABLE TRIGGER ALL');
    await sequelize.query('ALTER TABLE oferta_tecnico ENABLE TRIGGER ALL');
    await sequelize.query('ALTER TABLE servicio_asignado ENABLE TRIGGER ALL');
    await sequelize.query('ALTER TABLE pago_servicio ENABLE TRIGGER ALL');
    await sequelize.query('ALTER TABLE calificacion ENABLE TRIGGER ALL');
    await sequelize.query('ALTER TABLE chat_mensaje ENABLE TRIGGER ALL');
    await sequelize.query('ALTER TABLE notificacion ENABLE TRIGGER ALL');
    await sequelize.query('ALTER TABLE auditoria_log ENABLE TRIGGER ALL');
    await sequelize.query('ALTER TABLE incidencia ENABLE TRIGGER ALL');
    console.log('✅ Foreign key constraints re-habilitadas');

    console.log('🎉 IMPORTACIÓN COMPLETA');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error general:', err);
    process.exit(1);
  }
}

runSeed();
