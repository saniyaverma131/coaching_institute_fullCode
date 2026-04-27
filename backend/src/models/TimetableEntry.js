import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TimetableEntry = sequelize.define('TimetableEntry', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  batch_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  day_of_week: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
  start_time: { type: DataTypes.TIME, allowNull: false },
  end_time: { type: DataTypes.TIME, allowNull: false },
  subject: { type: DataTypes.STRING(120), allowNull: false },
  room: { type: DataTypes.STRING(80), allowNull: true },
});

export default TimetableEntry;
