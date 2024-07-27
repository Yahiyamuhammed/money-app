// LoginScreen.js

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/Ionicons';
import { initDB, createUser, loginWithEmailAndPassword,loginUser ,storeLoginData,syncTransactions, mergeFirestoreTransactions  } from '../database/db'; // Adjust the import path as needed
import AsyncStorage from '@react-native-async-storage/async-storage';


const LoginScreen = ({ isVisible, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const handleAuth = async () => {
    try {
      setError('');
      const db = await initDB();
  
      if (isLogin) {
        const user = await loginUser(email, password);
        if (user) {
          console.log("User logged in:", user);
          await storeLoginData({ uid: user.uid, name: user.name, email: user.email, phoneNumber: user.phoneNumber });
          await AsyncStorage.setItem('isUserLoggedIn', 'true');
          await AsyncStorage.setItem('userEmail', email);
          // Instead of storing the password, store a hashed version or a token
          await AsyncStorage.setItem('authToken', user.uid); // Using UID as a simple token
  
          await syncTransactions(db);
  
          Alert.alert('Login successful');
          onClose();
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
  
        await syncTransactions(db);
  
        Alert.alert('User registered successfully');
        onClose();
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError(error.message);
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
        <TouchableOpacity style={styles.authButton} onPress={handleAuth}>
          <Text style={styles.authButtonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
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
