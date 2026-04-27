import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: true },
  is_read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
});

export default Notification;
