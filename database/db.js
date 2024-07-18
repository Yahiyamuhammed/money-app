import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DB_NAME = 'mymoney.db';

// Function to generate a random ID
const generateRandomId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export const initDB = async () => {
  try {
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(`

    

      
      CREATE TABLE IF NOT EXISTS names (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        amount REAL,
        description TEXT,
        type TEXT,
        date TEXT,
        name_id TEXT,
        FOREIGN KEY (name_id) REFERENCES names (id)
      );
    `);
    console.log("Database initialized successfully");
    return db;
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};
export const getOrCreateNameId = async (db, name) => {
  try {
    let result = await db.getFirstAsync('SELECT id FROM names WHERE name = ?', [name]);
    if (result) {
      console.log("has id", result.id);
      return result.id;
    } else {
      console.log("entered random");
      const newId = generateRandomId();
      console.log("generated random", newId);
      await db.runAsync('INSERT INTO names (id, name) VALUES (?, ?)', [newId, name]);
      console.log("no id", newId);
      return newId;
    }
  } catch (error) {
    console.error("Error getting or creating name ID:", error);
    throw error;
  }
};

export const getTransactions = async (db) => {
  try {
    const transactions = await db.getAllAsync(`
      SELECT t.*, n.name as description
      FROM transactions t
      JOIN names n ON t.name_id = n.id
      ORDER BY t.date DESC
    `);
    return transactions;
  } catch (error) {
    console.error("Error getting transactions:", error);
    throw error;
  }
};

export const addTransaction = async (db, transaction) => {
  try {
    const transactionId = generateRandomId();
    await db.runAsync(
      'INSERT INTO transactions (id, amount, description, type, date, name_id) VALUES (?, ?, ?, ?, ?, ?)',
      [
        transactionId,
        parseFloat(transaction.amount),
        transaction.description,
        transaction.type,
        transaction.date,
        transaction.name_id
      ]
    );
    return transactionId;
  } catch (error) {
    console.error("Error adding transaction:", error);
    throw error;
  }
};
export const getPersonTransactions = async (db, nameId) => {
  try {
    const transactions = await db.getAllAsync(`
      SELECT t.*, n.name as description
      FROM transactions t
      JOIN names n ON t.name_id = n.id
      WHERE t.name_id = ?
      ORDER BY t.date DESC
    `, [nameId]);
    return transactions;
  } catch (error) {
    console.error('Error getting person transactions:', error);
    throw error;
  }
};

export const getPersonIdByName = async (db, personName) => {
  try {
    const result = await db.getFirstAsync('SELECT id FROM names WHERE name = ?', [personName]);
    return result ? result.id : null;
  } catch (error) {
    console.error('Error getting person ID:', error);
    throw error;
  }
};

// Keep the existing updateTotals and getTotals functions as they are


export const updateTotals = async (totalBorrowed, totalLent) => {
  try {
    await AsyncStorage.setItem('totalBorrowed', totalBorrowed.toString());
    await AsyncStorage.setItem('totalLent', totalLent.toString());
  } catch (error) {
    console.error('Error saving totals:', error);
  }
};

export const getTotals = async () => {
  try {
    const totalBorrowed = await AsyncStorage.getItem('totalBorrowed');
    const totalLent = await AsyncStorage.getItem('totalLent');
    return {
      totalBorrowed: totalBorrowed ? parseFloat(totalBorrowed) : 0,
      totalLent: totalLent ? parseFloat(totalLent) : 0,
    };
  } catch (error) {
    console.error('Error getting totals:', error);
    return { totalBorrowed: 0, totalLent: 0 };
  }
};

// Add these functions to your db.js file

export const updateTransaction = async (db, transaction) => {
  try {
    await db.runAsync(
      'UPDATE transactions SET amount = ?, description = ?, type = ?, date = ? WHERE id = ?',
      [transaction.amount, transaction.description, transaction.type, transaction.date, transaction.id]
    );
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw error;
  }
};

export const deleteTransaction = async (db, transactionId) => {
  try {
    await db.runAsync('DELETE FROM transactions WHERE id = ?', [transactionId]);
  } catch (error) {
    console.error("Error deleting transaction:", error);
    throw error;
  }
};