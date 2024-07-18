import React, { useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableWithoutFeedback, Image, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import { signOut } from 'firebase/auth';
import { auth } from '../auth/firebase';
import LoginScreen from '../screens/loginscreen'; // Import the new LoginScreen component

const { width, height } = Dimensions.get('window');

const ProfileWindow = ({ isVisible, onClose, user }) => {
    console.log("user :",user);
    
  const [showLoginScreen, setShowLoginScreen] = useState(false);
  const windowWidth = width * 0.8;
  const windowHeight = height * 0.5;

  const slideAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isVisible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  const handleLoginPress = () => {
    setShowLoginScreen(true);
  };

  const handleLoginClose = () => {
    setShowLoginScreen(false);
  };

  return (
    <Modal
      isVisible={isVisible}
      backdropOpacity={0.5}
      style={styles.modal}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <Animated.View 
              style={[
                styles.container,
                {
                  width: windowWidth,
                  height: windowHeight,
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [width / 2 - windowWidth / 2, 0],
                      }),
                    },
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [height / 2 - windowHeight / 2 - 50, -50],
                      }),
                    },
                    {
                      scaleX: slideAnim,
                    },
                    {
                      scaleY: slideAnim,
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.title}>Profile</Text>
              {user ? (
                <View style={styles.profileDetails}>
                  {user.photoURL && (
                    <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
                  )}
                  <Text style={styles.profileText}>Name: {user.displayName || 'N/A'}</Text>
                  <Text style={styles.profileText}>Email: {user.email}</Text>
                  <Text style={styles.profileText}>Phone Number: {user.phoneNumber}</Text>
                  <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>
                    Sign in to backup your data and view your profile information.
                  </Text>
                  <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
                    <Text style={styles.loginButtonText}>Login</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
      {showLoginScreen && <LoginScreen isVisible={showLoginScreen} onClose={handleLoginClose} />}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0, // Ensure the modal covers the entire screen
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  profileDetails: {
    margin: 10,
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  profileText: {
    fontSize: 16,
    marginBottom: 5,
    padding: 10,
  },
  logoutButton: {
    marginTop: 'auto',
    padding: 15,
    backgroundColor: 'red',
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  loginText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  loginButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProfileWindow;
