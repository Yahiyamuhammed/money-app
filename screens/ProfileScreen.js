import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView,Alert } from 'react-native';
import LoginScreen from './loginscreen';
import { initDB, getLoginData ,signOutUser} from '../database/db'; // Adjust the import path as needed

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [isLoginVisible, setIsLoginVisible] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // console.log("trying loging");
        
        const userData = await getLoginData();
        console.log("user data: ",userData);
        
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleSignOut = () => {
    // Implement your sign-out logic here
    
    // setUser(null);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Yes", onPress: () => {
        
        signOutUser();
        setUser(null);
        console.log('User signed out');
      }}
    ]);
    // Show the login screen after sign-out if needed
    // setIsLoginVisible(true);
  };

  const handleLoginClose = async () => {
    setIsLoginVisible(false);
    // Fetch user data again after login (replace with actual login logic)
    const db = await initDB();
    const email = 'john.doe@example.com'; // Replace with actual logged-in user email or use authentication context
    const userData = await getLoginData(db, email);
    if (userData) {
      setUser(userData);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {user ? (
        <>
          <Text style={styles.label}>Nameascsdcsdc</Text>
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
    alignItems: 'center',
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
