import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import LoginScreen from './loginscreen';

const mockDB = {
  getUser: () => {
    // Mimic fetching user from database
    return {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phoneNumber: '+1234567890'
    };
  }
};

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [isLoginVisible, setIsLoginVisible] = useState(false);

  useEffect(() => {
    // Mimic fetching user data from the database
    const userData = mockDB.getUser();
    setUser(userData);
  }, []);

  const handleSignOut = () => {
    // Sign out logic here
    console.log('User signed out');
    setUser(null);
    setIsLoginVisible(true); // Show the login screen
  };

  const handleLoginClose = () => {
    setIsLoginVisible(false);
    // Fetch user again after login (mimic behavior)
    const userData = mockDB.getUser();
    setUser(userData);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {user ? (
        <>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{user.name}</Text>

          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user.email}</Text>

          <Text style={styles.label}>Phone Number</Text>
          <Text style={styles.value}>{user.phoneNumber}</Text>

          <View style={styles.buttonContainer}>
            <Button title="Sign Out" onPress={handleSignOut} color="#FF3B30" />
          </View>
        </>
      ) : (
        <View style={styles.buttonContainer}>
          <Button title="Login" onPress={() => setIsLoginVisible(true)} color="tomato" />
        </View>
      )}
      {isLoginVisible && <LoginScreen isVisible={isLoginVisible} onClose={handleLoginClose} />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 15,
  },
  value: {
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  buttonContainer: {
    marginTop: 30,
    alignSelf: 'center',
    width: '100%',
  },
});

export default ProfileScreen;
