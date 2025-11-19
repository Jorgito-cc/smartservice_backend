module.exports = (sequelize, DataTypes) => {
  const TecnicoUbicacion = sequelize.define("TecnicoUbicacion", {
    id_ubicacion: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    id_tecnico: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    lat: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false
    },
    lon: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false
    },
    direccion_texto: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: "tecnico_ubicacion",
    timestamps: false
  });

  TecnicoUbicacion.associate = (models) => {
    TecnicoUbicacion.belongsTo(models.Tecnico, {
      foreignKey: "id_tecnico"
    });
  };

  return TecnicoUbicacion;
};
