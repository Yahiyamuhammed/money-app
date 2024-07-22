import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import bcrypt from 'bcryptjs';
import * as Crypto from 'expo-crypto';

import { auth, db } from '../auth/firebase';
import { createUserWithEmailAndPassword , signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc,getDoc  } from 'firebase/firestore';

const DB_NAME = 'mymoney.db';

// Function to generate a random ID
const generateRandomId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export const initDB = async () => {
  try {
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(`

     CREATE TABLE IF NOT EXISTS user (
          id TEXT PRIMARY KEY,
          name TEXT,
          email TEXT UNIQUE,
          phoneNumber TEXT
        );
     
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
       CREATE TABLE IF NOT EXISTS offline_transactions (
        id TEXT PRIMARY KEY,
        amount REAL,
        description TEXT,
        type TEXT,
        date TEXT,
        name_id TEXT,
         name TEXT,
        synced INTEGER DEFAULT 0
      );
    `);
    console.log("Database initialized successfully",db);
    return db;
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};
export const dropTableUsers = async (db) => {
  try {
    await db.execAsync('DROP TABLE offline_transactions');
    console.log('Users table dropped successfully');
  } catch (error) {
    console.error('Error dropping users table:', error);
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

// export const getTransactions = async (db) => {
//   try {
//     const transactions = await db.getAllAsync(`
//       SELECT t.*, n.name as description
//       FROM transactions t
//       JOIN names n ON t.name_id = n.id
//       ORDER BY t.date DESC
//     `);
//     return transactions;
//   } catch (error) {
//     console.error("Error getting transactions:", error);
//     throw error;
//   }
// };
export const getTransactions = async (db) => {
  try {
    const transactions = await db.getAllAsync(`
      SELECT * FROM offline_transactions
      ORDER BY date DESC
    `);
    return transactions;
  } catch (error) {
    console.error("Error getting transactions:", error);
    throw error;
  }
};

// export const addTransaction = async (db, transaction) => {
//   try {
//     const transactionId = generateRandomId();
//     await db.runAsync(
//       'INSERT INTO transactions (id, amount, description, type, date, name_id) VALUES (?, ?, ?, ?, ?, ?)',
//       [
//         transactionId,
//         parseFloat(transaction.amount),
//         transaction.description,
//         transaction.type,
//         transaction.date,
//         transaction.name_id
//       ]
//     );
//     return transactionId;
//   } catch (error) {
//     console.error("Error adding transaction:", error);
//     throw error;
//   }
// };

export const addTransaction = async (db, transaction) => {
  try {
    const transactionId = generateRandomId();
    await db.runAsync(
      'INSERT INTO offline_transactions (id, amount, description, type, date, name_id, name, synced) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
      [
        transactionId,
        parseFloat(transaction.amount),
        transaction.description,
        transaction.type,
        transaction.date,
        transaction.name_id,
        transaction.name
      ]
    );
    console.log("transaction added");
    
    return transactionId;
  } catch (error) {
    console.error("Error adding transaction:", error);
    throw error;
  }
};


// export const getPersonTransactions = async (db, nameId) => {
//   try {
//     const transactions = await db.getAllAsync(`
//       SELECT t.*, n.name as description
//       FROM transactions t
//       JOIN names n ON t.name_id = n.id
//       WHERE t.name_id = ?
//       ORDER BY t.date DESC
//     `, [nameId]);
//     return transactions;
//   } catch (error) {
//     console.error('Error getting person transactions:', error);
//     throw error;
//   }
// };

export const getPersonTransactions = async (db, nameId) => {
  try {
    console.log("entered get person id",nameId);
    
    const transactions = await db.getAllAsync(`
      SELECT *
      FROM offline_transactions
      WHERE name_id = ?
      ORDER BY date DESC
    `, [nameId]);
    return transactions;
  } catch (error) {
    console.error('Error getting person transactions:', error);
    throw error;
  }
};

// export const getPersonIdByName = async (db, personName) => {
//   try {
//     const result = await db.getFirstAsync('SELECT id FROM names WHERE name = ?', [personName]);
//     return result ? result.id : null;
//   } catch (error) {
//     console.error('Error getting person ID:', error);
//     throw error;
//   }
// };

export const getPersonIdByName = async (db, personName) => {
  try {
    const result = await db.getFirstAsync(`
      SELECT DISTINCT name_id
      FROM offline_transactions
      WHERE name = ?
      LIMIT 1
    `, [personName]);
    return result ? result.name_id : null;
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


// firestore functions
// Function to login with email and password
export const loginWithEmailAndPassword = async (db, email, password) => {
  try {
    const user = await findUserByEmail(db, email);
    if (user && await comparePassword(password, user.password)) {
      return user;
    } else {
      return null; // Login failed
    }
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const createUser = async (email, password, name, phoneNumber) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await setDoc(doc(db, 'users', user.uid), {
      name,
      email,
      phoneNumber
    });
    console.log('User registered and data saved in Firestore:', user);
    return user;  // Return the user object
  } catch (error) {
    console.error('Error registering user and saving data:', error);
    throw error;  // Throw the error so it can be caught in handleAuth
  }
};


export const loginUser = async (email, password) => {
  try {
    // Sign in user with email and password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch additional user details from Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      return {
        uid: user.uid,
        email: user.email,
        name: userData.name,
        phoneNumber: userData.phoneNumber
      };
    } else {
      console.log('No such document!');
      return {
        uid: user.uid,
        email: user.email
      };
    }
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
};

// db.js

export const storeLoginData = async (user) => {
  try {
    console.log("storing locally");
    
    const db = await initDB();
    const { uid, name, email, phoneNumber } = user;
    await db.runAsync(
      `INSERT OR REPLACE INTO user (id, name, email, phoneNumber) VALUES (?, ?, ?, ?);`,
      [uid, name, email, phoneNumber]
    );
    console.log("User login data stored successfully", db);
  } catch (error) {
    console.error("Error storing user login data:", error);
    throw error;
  }
};

export const getLoginData = async () => {
  try {
    const db = await initDB();
    const result = await db.getFirstAsync(
      `SELECT * FROM user ;`
    );
    
    if (result) {
      console.log("Retrieved user data:", result);
      return result;
    } else {
      console.log("No user data found");
      return null;
    }
  } catch (error) {
    console.error("Error getting user login data:", error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    const db = await initDB();
    
    // Delete all data from the user table
    await db.runAsync('DELETE FROM user;');
    
    console.log("User data deleted successfully");
    
    // You might also want to sign out the user from Firebase
    await auth.signOut();
    
    console.log("User signed out successfully");
  } catch (error) {
    console.error("Error signing out user:", error);
    throw error;
  }
};