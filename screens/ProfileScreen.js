import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView,Alert,Image,TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';


import { MaterialIcons } from '@expo/vector-icons';

import LoginScreen from './loginscreen';
import { initDB, getLoginData ,signOutUser,updateUserProfile} from '../database/db'; // Adjust the import path as needed
import EditProfileModal from './editProfileWindow'; 
const defaultProfilePicture = require('../profile/dp.jpg');


const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [isLoginVisible, setIsLoginVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);


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


  const handleUpdateProfile = async (updatedData) => {
    try {
      await updateUserProfile(user.id, updatedData);
      setUser({ ...user, ...updatedData });
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
    setIsEditModalVisible(false);
  };
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {user ? (
          <>
            <LinearGradient
              colors={['#6DD5FA', '#FFFFFF']}
              style={styles.header}
            >
              <Image source={{ uri: user.profilePicture || defaultProfilePicture }} style={styles.profileImage} />
              <Text style={styles.name}>{user.name}</Text>
            </LinearGradient>
            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditModalVisible(true)}>
                <MaterialIcons name="edit" size={24} color="#fff" />
              </TouchableOpacity>

            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <MaterialIcons name="email" size={24} color="#666" style={styles.icon} />
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{user.email}</Text>
              </View>

              <View style={styles.infoItem}>
                <MaterialIcons name="phone" size={24} color="#666" style={styles.icon} />
                <Text style={styles.label}>Phone Number</Text>
                <Text style={styles.value}>{user.phoneNumber}</Text>
              </View>
            </View>

            <Text style={styles.backupMessage}>Your data is backed up.</Text>
          </>
        ) : (
          <>
            <LinearGradient
              colors={['#6DD5FA', '#FFFFFF']}
              style={styles.header}
            >
              <Image source={defaultProfilePicture} style={styles.profileImage} />
              <Text style={styles.name}>Welcome</Text>
            </LinearGradient>

            <Text style={styles.backupMessage}>
              Your data is not backed up. Kindly login to backup your data.
            </Text>
          </>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        {user ? (
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LinearGradient
              colors={['#FF416C', '#FF4B2B']}
              style={styles.signOutButtonGradient}
            >
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.loginButton} onPress={() => setIsLoginVisible(true)}>
            <LinearGradient
              colors={['#FF416C', '#FF4B2B']}
              style={styles.loginButtonGradient}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {isLoginVisible && <LoginScreen isVisible={isLoginVisible} onClose={handleLoginClose} />}
      {isEditModalVisible && (
        <EditProfileModal
          isVisible={isEditModalVisible}
          onClose={() => setIsEditModalVisible(false)}
          onUpdate={handleUpdateProfile}
          userData={user}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    marginTop: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 10,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  infoContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  icon: {
    marginRight: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#777',
    flex: 1,
  },
  value: {
    fontSize: 18,
    color: '#333',
    flex: 2,
  },
  backupMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#f5f5f5',
    position: 'absolute',
    bottom: 0,
  },
  signOutButton: {
    width: '100%',
    alignItems: 'center',
  },
  signOutButtonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginButton: {
    width: '100%',
    alignItems: 'center',
  },
  loginButtonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  editButton: {
    position: 'absolute',
    top: 50,
    right: 30,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
});
export default ProfileScreen;
