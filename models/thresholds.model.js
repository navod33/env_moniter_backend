module.exports = (sequelize, DataTypes) => {
    const Threshold = sequelize.define('Threshold', {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },
      temperature: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      humidity: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
    }, {
      tableName: 'threshold'
    });
  
    return Threshold;
  };
  