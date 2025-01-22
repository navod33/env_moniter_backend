module.exports = (sequelize, DataTypes) => {
    const PhoneNumber = sequelize.define('PhoneNumber', {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    }, {
      tableName: 'phone_number'
    });
  
    return PhoneNumber;
  };
  