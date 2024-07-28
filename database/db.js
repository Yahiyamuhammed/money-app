import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import bcrypt from 'bcryptjs';
import * as Crypto from 'expo-crypto';

import { auth ,db} from '../auth/firebase';
import { db as firestoreDb } from '../auth/firebase'; // Ensure this import is correct
import { createUserWithEmailAndPassword , signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc,getDoc,collection,updateDoc   ,getDocs, query, where, orderBy, limit,Timestamp ,serverTimestamp ,deleteDoc   } from 'firebase/firestore';
import NetInfo from "@react-native-community/netinfo";

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
      email TEXT,
      phoneNumber TEXT,
      isLoggedIn INTEGER DEFAULT 0
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
        synced INTEGER DEFAULT 0,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS deleted_transactions (
        id TEXT PRIMARY KEY,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
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
    await db.execAsync('DROP TABLE user');
    console.log('Users table dropped successfully');
  } catch (error) {
    console.error('Error dropping users table:', error);
  }
};

// export const getOrCreateNameId = async (db, name) => {
//   try {
//     let result = await db.getFirstAsync('SELECT id FROM names WHERE name = ?', [name]);
//     if (result) {
//       console.log("has id", result.id);
//       return result.id;
//     } else {
//       console.log("entered random");
//       const newId = generateRandomId();
//       console.log("generated random", newId);
//       await db.runAsync('INSERT INTO names (id, name) VALUES (?, ?)', [newId, name]);
//       console.log("no id", newId);
//       return newId;
//     }
//   } catch (error) {
//     console.error("Error getting or creating name ID:", error);
//     throw error;
//   }
// };




export const getOrCreateNameId = async (db, name) => {
  try {
    console.log("name got :",name);
    
    let result = await db.getFirstAsync('SELECT DISTINCT name_id FROM offline_transactions WHERE name = ? LIMIT 1', [name]);
    if (result) {
      console.log("Existing name_id found:", result.name_id);
      return result.name_id;
    } else {
      console.log("Generating new name_id");
      const newId = generateRandomId();
      console.log("Generated new name_id:", newId);
      // We don't insert into a separate names table anymore
      // The new name_id will be used when inserting a new transaction
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
export const addTransaction = async (db, transaction, isDownload = false) => {
  try {
    const transactionId = transaction.id || generateRandomId();
    const timestamp = transaction.timestamp || Date.now().toString();
    const syncStatus = isDownload ? 1 : 0; // Set to 1 if it's a downloaded transaction
    
    await db.runAsync(
      'INSERT INTO offline_transactions (id, amount, description, type, date, name_id, name, synced, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        transactionId,
        parseFloat(transaction.amount),
        transaction.description,
        transaction.type,
        transaction.date,
        transaction.name_id,
        transaction.name,
        syncStatus,
        timestamp
      ]
    );
    console.log("Transaction added");
    
    // Trigger sync only if it's not a downloaded transaction
    if (!isDownload) {
      await syncTransactions(db);
    }
    
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

// export const updateTransaction = async (db, transaction) => {
//   try {
//     await db.runAsync(
//       'UPDATE transactions SET amount = ?, description = ?, type = ?, date = ? WHERE id = ?',
//       [transaction.amount, transaction.description, transaction.type, transaction.date, transaction.id]
//     );
//   } catch (error) {
//     console.error("Error updating transaction:", error);
//     throw error;
//   }
// };

// export const updateTransaction = async (db, transaction) => {
//   try {
//     await db.runAsync(
//       'UPDATE offline_transactions SET amount = ?, description = ?, type = ?, date = ?, name_id = ?, name = ?, synced = 0 WHERE id = ?',
//       [transaction.amount, transaction.description, transaction.type, transaction.date, transaction.name_id, transaction.name, transaction.id]
//     );
//   } catch (error) {
//     console.error("Error updating transaction:", error);
//     throw error;
//   }
// };
export const updateTransaction = async (db, transaction, isDownload = false) => {
  try {
    const timestamp = transaction.timestamp || Date.now().toString();
    const syncStatus = isDownload ? 1 : 0; // Set to 1 if it's a downloaded transaction
    
    await db.runAsync(
      'UPDATE offline_transactions SET amount = ?, description = ?, type = ?, date = ?, name_id = ?, name = ?, synced = ?, timestamp = ? WHERE id = ?',
      [transaction.amount, transaction.description, transaction.type, transaction.date, transaction.name_id, transaction.name, syncStatus, timestamp, transaction.id]
    );
    console.log("Transaction updated");
    
    // Trigger sync only if it's not a downloaded transaction
    if (!isDownload) {
      await syncTransactions(db);
    }
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw error;
  }
};

// export const deleteTransaction = async (db, transactionId) => {
//   try {
//     await db.runAsync('DELETE FROM transactions WHERE id = ?', [transactionId]);
//   } catch (error) {
//     console.error("Error deleting transaction:", error);
//     throw error;
//   }
// };
export const deleteTransaction = async (db, transactionId) => {
  try {
    // Delete from SQLite
    await db.runAsync('DELETE FROM offline_transactions WHERE id = ?', [transactionId]);
    console.log(`Transaction ${transactionId} deleted from local database`);

    const isUserLoggedIn = await AsyncStorage.getItem('isUserLoggedIn');
    const user = auth.currentUser;

     // Check internet connection
     const netInfo = await NetInfo.fetch();
    
    if (isUserLoggedIn === 'true' && user && netInfo.isConnected) {
      try {
        // Mark as deleted in Firestore
        const transactionRef = doc(firestoreDb, 'users', user.uid, 'transactions', transactionId);
        await setDoc(transactionRef, { 
          deleted: true, 
          timestamp: serverTimestamp(),
          localDeletionTimestamp: Date.now()
        }, { merge: true });
        console.log(`Transaction ${transactionId} marked as deleted in Firestore`);
      } catch (firestoreError) {
        console.error("Error marking transaction as deleted in Firestore:", firestoreError);
        await db.runAsync('INSERT INTO deleted_transactions (id, timestamp) VALUES (?, ?)', [transactionId, Date.now()]);
      }
    } else {
      console.log("User not logged in or authenticated, marking for future sync");
      await db.runAsync('INSERT INTO deleted_transactions (id, timestamp) VALUES (?, ?)', [transactionId, Date.now()]);
    }

    // Trigger immediate sync
    await syncTransactions(db);
  } catch (error) {
    console.error("Error in deleteTransaction:", error);
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
    return user;
  } catch (error) {
    console.error('Error registering user and saving data:', error);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

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
    console.log("Storing user data locally");
    
    const db = await initDB();
    const { uid, name, email, phoneNumber } = user;
    await db.runAsync(
      `INSERT OR REPLACE INTO user (id, name, email, phoneNumber, isLoggedIn) VALUES (?, ?, ?, ?, 1);`,
      [uid, name, email, phoneNumber]
    );
    console.log("User login data stored successfully");
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
    await auth.signOut();
    const db = await initDB();
    await db.runAsync('DELETE FROM offline_transactions;');
    // Delete all data from the user table
    await db.runAsync('DELETE FROM user;');
    await db.runAsync('UPDATE user SET isLoggedIn = 0');
    // Clear the lastSyncTimestamp
    await AsyncStorage.removeItem('lastSyncTimestamp');
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const syncTransactions = async (sqliteDb) => {
  try {

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log("No internet connection, skipping sync");
      return;
    }


    const isUserLoggedIn = await AsyncStorage.getItem('isUserLoggedIn');
    if (isUserLoggedIn !== 'true') {
      console.log("User not logged in, can't sync");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      console.log("Firebase user not found, can't sync");
      return;
    }

    // First, sync deletions
    await syncDeletedTransactions(sqliteDb, user);

    // Then, upload local changes
    await uploadLocalChanges(sqliteDb, user);

    // Finally, download changes from Firestore
    await downloadFirestoreChanges(sqliteDb, user);

    console.log("Transactions synced successfully");
  } catch (error) {
    console.error("Error syncing transactions:", error);
    throw error;
  }
};

const syncDeletedTransactions = async (sqliteDb, user) => {
  try {
    const deletedTransactions = await sqliteDb.getAllAsync('SELECT * FROM deleted_transactions');
    
    for (const transaction of deletedTransactions) {
      try {
        const transactionRef = doc(firestoreDb, 'users', user.uid, 'transactions', transaction.id);
        await setDoc(transactionRef, { 
          deleted: true, 
          timestamp: serverTimestamp(),
          localDeletionTimestamp: transaction.timestamp
        }, { merge: true });
        await sqliteDb.runAsync('DELETE FROM deleted_transactions WHERE id = ?', [transaction.id]);
        console.log(`Marked transaction ${transaction.id} as deleted in Firestore`);
      } catch (error) {
        console.error(`Failed to mark transaction ${transaction.id} as deleted in Firestore:`, error);
      }
    }
  } catch (error) {
    console.error("Error syncing deleted transactions:", error);
  }
};

const uploadLocalChanges = async (sqliteDb, user) => {
  try {
    const unsyncedTransactions = await sqliteDb.getAllAsync(`
      SELECT * FROM offline_transactions WHERE synced = 0
    `);

    console.log(`Found ${unsyncedTransactions.length} unsynced transactions to upload`);

    for (const transaction of unsyncedTransactions) {
      const transactionRef = doc(firestoreDb, 'users', user.uid, 'transactions', transaction.id);
      const transactionData = {
        amount: transaction.amount,
        description: transaction.description,
        type: transaction.type,
        date: transaction.date,
        name_id: transaction.name_id,
        name: transaction.name,
        timestamp: serverTimestamp(),
        localTimestamp: transaction.timestamp,
        deleted: false
      };

      await setDoc(transactionRef, transactionData, { merge: true });
      await sqliteDb.runAsync('UPDATE offline_transactions SET synced = 1 WHERE id = ?', [transaction.id]);
      console.log(`Uploaded and marked as synced: ${transaction.id}`);
    }

    console.log('All local changes uploaded successfully');
  } catch (error) {
    console.error('Error uploading local changes:', error);
  }
};

const downloadFirestoreChanges = async (sqliteDb, user) => {
  try {
    console.log('Starting downloadFirestoreChanges for user:', user.uid);
    
    const transactionsCollection = collection(firestoreDb, 'users', user.uid, 'transactions');
    
    const lastSyncTimestamp = await AsyncStorage.getItem('lastSyncTimestamp') || '0';
    console.log('Last sync timestamp:', lastSyncTimestamp);
    
    const newTransactionsQuery = query(
      transactionsCollection,
      where('timestamp', '>', new Date(parseInt(lastSyncTimestamp))),
      orderBy('timestamp', 'asc')
    );
    
    console.log('Executing Firestore query for new transactions...');
    const firestoreTransactions = await getDocs(newTransactionsQuery);
    
    console.log('Firestore query results:', firestoreTransactions.size);
    
    let latestTimestamp = lastSyncTimestamp;
    
    for (const doc of firestoreTransactions.docs) {
      const transaction = doc.data();
      console.log('Processing Firestore transaction:', doc.id, JSON.stringify(transaction));
      
      const timestamp = transaction.timestamp ? transaction.timestamp.toMillis() : Date.now();
      
      if (transaction.deleted) {
        // If the transaction is marked as deleted in Firestore, delete it locally
        await sqliteDb.runAsync('DELETE FROM offline_transactions WHERE id = ?', [doc.id]);
        console.log(`Deleted transaction ${doc.id} locally`);
      } else {
        const existingTransaction = await sqliteDb.getFirstAsync('SELECT * FROM offline_transactions WHERE id = ?', [doc.id]);
        
        if (!existingTransaction) {
          console.log('Adding new transaction:', doc.id);
          await addTransaction(sqliteDb, {
            ...transaction,
            id: doc.id,
            synced: 1,
            timestamp
          }, true);
        } else {
          console.log('Updating existing transaction:', doc.id);
          await updateTransaction(sqliteDb, {
            ...transaction,
            id: doc.id,
            synced: 1,
            timestamp
          }, true);
        }
      }
      
      latestTimestamp = Math.max(latestTimestamp, timestamp).toString();
    }

    // Update the last sync timestamp
    await AsyncStorage.setItem('lastSyncTimestamp', latestTimestamp);
    console.log('Updated last sync timestamp:', latestTimestamp);
  } catch (error) {
    console.error('Error in downloadFirestoreChanges:', error);
    throw error;
  }
};


export const afterLogin = async (db) => {
  await syncTransactions(db);
};
export const mergeFirestoreTransactions = async (sqliteDb) => {
  try {
    const isUserLoggedIn = await AsyncStorage.getItem('isUserLoggedIn');
    if (isUserLoggedIn !== 'true') {
      console.log("User not logged in, can't fetch from Firestore");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      console.log("Firebase user not found in mergeFirestoreTransactions, attempting to reauthenticate");
      const email = await AsyncStorage.getItem('userEmail');
      const password = await AsyncStorage.getItem('userPassword');
      if (email && password) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        console.log("Unable to reauthenticate, no stored credentials");
        return;
      }
    }

    const userDocRef = doc(firestoreDb, 'users', user.uid);
    const transactionsCollection = collection(userDocRef, 'transactions');
    
    const lastSyncTimestamp = await AsyncStorage.getItem('lastSyncTimestamp') || '0';
    
    const q = query(
      transactionsCollection,
      where('timestamp', '>', parseInt(lastSyncTimestamp)),
      orderBy('timestamp', 'asc')
    );
    
    const firestoreTransactions = await getDocs(q);
    
    for (const doc of firestoreTransactions.docs) {
      const transaction = doc.data();
      const existingTransaction = await sqliteDb.getFirstAsync('SELECT * FROM offline_transactions WHERE id = ?', [doc.id]);
      
      if (!existingTransaction) {
        // New transaction, add it
        await addTransaction(sqliteDb, {...transaction, id: doc.id, synced: 1});
      } else if (transaction.timestamp > (existingTransaction.timestamp || 0)) {
        // Existing transaction, update it if the Firestore version is newer
        await updateTransaction(sqliteDb, {...transaction, id: doc.id, synced: 1});
      }
    }

    // Update the last sync timestamp
    const latestTimestamp = firestoreTransactions.docs.reduce(
      (max, doc) => Math.max(max, doc.data().timestamp || 0),
      parseInt(lastSyncTimestamp)
    );
    await AsyncStorage.setItem('lastSyncTimestamp', latestTimestamp.toString());

    console.log("Firestore transactions merged successfully");
  } catch (error) {
    console.error("Error merging Firestore transactions:", error);
    throw error;
  }
};
export const autoSyncTransactions = async (sqliteDb) => {
  try {
    const lastAutoSyncTime = await AsyncStorage.getItem('lastAutoSyncTime') || '0';
    const currentTime = Date.now();
    const SYNC_INTERVAL = .01 * 60 * 1000; // 5 minutes in milliseconds
    
    if (currentTime - parseInt(lastAutoSyncTime) > SYNC_INTERVAL) {
      await syncTransactions(sqliteDb);
      await AsyncStorage.setItem('lastAutoSyncTime', currentTime.toString());
      console.log("Auto-sync completed");
    }
  } catch (error) {
    console.error("Error during auto-sync:", error);
  }
};

// const syncDeletedTransactions = async (sqliteDb, user) => {
//   try {
//     const deletedTransactions = await sqliteDb.getAllAsync('SELECT * FROM deleted_transactions');
    
//     for (const transaction of deletedTransactions) {
//       try {
//         const transactionRef = doc(firestoreDb, 'users', user.uid, 'transactions', transaction.id);
//         await deleteDoc(transactionRef);
//         await sqliteDb.runAsync('DELETE FROM deleted_transactions WHERE id = ?', [transaction.id]);
//         console.log(`Deleted transaction ${transaction.id} from Firestore`);
//       } catch (error) {
//         console.error(`Failed to delete transaction ${transaction.id} from Firestore:`, error);
//       }
//     }
//   } catch (error) {
//     console.error("Error syncing deleted transactions:", error);
//   }
// };
export const updateUserProfile = async (uid, data) => {
  if (!uid) {
    console.error("UID is undefined");
    return;
  }
  
  console.log("Updating profile for UID:", uid);
  console.log("Data to update:", data);

  try {
    await updateDoc(doc(db, "users", uid), data);
    console.log("Profile updated successfully");
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error; // Rethrow the error so it can be caught by the calling function
  }
};