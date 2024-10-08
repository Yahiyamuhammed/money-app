// LoginScreen.js

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,ActivityIndicator } from 'react-native';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/Ionicons';
import { initDB, createUser,loginUser ,storeLoginData,syncTransactions  } from '../database/db'; // Adjust the import path as needed
import AsyncStorage from '@react-native-async-storage/async-storage';
import {  Snackbar } from 'react-native-paper';




const LoginScreen = ({ isVisible, onClose ,onMessage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);




  
  const handleAuth = async () => {
    try {
      setError('');
      const db = await initDB();
  
      setLoading(true);

      if (isLogin) {
        const user = await loginUser(email, password);
        if (user) {
          console.log("User logged in:", user);
          await storeLoginData({ uid: user.uid, name: user.name, email: user.email, phoneNumber: user.phoneNumber });
          await AsyncStorage.setItem('isUserLoggedIn', 'true');
          await AsyncStorage.setItem('userEmail', email);
          // Instead of storing the password, store a hashed version or a token
          await AsyncStorage.setItem('authToken', user.uid); // Using UID as a simple token
  
          onMessage("login successfull")
          onClose();
          await syncTransactions(db);
          setLoading(false);

  
          // Alert.alert('Login successful');
         
        } else {
          setError('Invalid email or password');
        }
      } else {
        if (!name || !phoneNumber) {
          setError('Please fill in all fields');
          return;
        }
        const user = await createUser(email, password, name, phoneNumber);
        console.log("User registered:", user);
        await storeLoginData({ uid: user.uid, name, email, phoneNumber });
        await AsyncStorage.setItem('isUserLoggedIn', 'true');
        await AsyncStorage.setItem('userEmail', email);
        await AsyncStorage.setItem('authToken', user.uid);
  
        onMessage("lUser registered successfully")
        onClose();
        await syncTransactions(db);
        setLoading(false);

  
        // Alert.alert('User registered successfully');
       
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setLoading(false);

        // Map Firebase error codes to custom messages
        let errorMessage = 'An error occurred. Please try again.';
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email address is already in use.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'This email address is not valid.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Operation not allowed. Please contact support.';
            break;
          case 'auth/weak-password':
            errorMessage = 'The password is too weak. Please use a stronger password.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This user account has been disabled.';
            break;
          case 'auth/user-not-found':
            errorMessage = 'No user found with this email.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password. Please try again.';
            break;
          default:
            errorMessage = 'An error occurred. Please try again.';
            break;
        }

        if (error.message.includes('UNIQUE constraint failed: offline_transactions.id')) {
          console.log("calling login again");
          
          // Call handleAuth again or handle the error as needed
          handleAuth();  // This will retry the authentication process
        } else {
          setError(errorMessage);
        }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Modal isVisible={isVisible} style={styles.modal}>
      <View style={styles.container}>
        <Text style={styles.title}>{isLogin ? 'Login' : 'Sign Up'}</Text>
        {!isLogin && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="white"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholderTextColor="white"
              keyboardType="phone-pad"
            />
          </>
        )}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="white"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="white"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
            <Icon name={showPassword ? 'eye-off' : 'eye'} size={24} color="#007bff" />
          </TouchableOpacity>
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity style={styles.authButton} onPress={handleAuth} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.authButtonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
        )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.switchText}>
            {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
        
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#1A3636',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color:'#fff'
  },
  input: {
    backgroundColor: '#D6BD98',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D6BD98',
    borderRadius: 5,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    padding: 10,
  },
  eyeIcon: {
    padding: 10,
  },
  authButton: {
    backgroundColor: '#40534C',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  authButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchText: {
    marginTop: 15,
    color: '#007bff',
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default LoginScreen;
