const { Model, DataTypes } = require("sequelize");
const Usuario = require("./usuario");  // Importamos el padre

class Tecnico extends Usuario {
    static initModel(sequelize) {
        
        // Inicializa primero el modelo padre (Usuario)
        super.initModel(sequelize);

        // Ahora agrega SOLO los campos del técnico
        Tecnico.init({
            descripcion: { 
                type: DataTypes.STRING(300),
                allowNull: true
            },
            calificacion_promedio: { 
                type: DataTypes.DECIMAL(3, 2),
                defaultValue: 0.00
            },
            disponibilidad: { 
                type: DataTypes.BOOLEAN, 
                defaultValue: true 
            }
        }, {
            sequelize,
            modelName: "Tecnico",
            tableName: "usuario",  // 👈 MISMA TABLA que Usuario
            timestamps: false
        });

        return Tecnico;
    }
}

module.exports = Tecnico;
