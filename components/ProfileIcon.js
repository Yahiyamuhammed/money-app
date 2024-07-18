import React, { useState, useEffect } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ProfileWindow from './SlidingProfile'; 
import { auth } from '../auth/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const ProfileIcon = () => {
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      console.log(user);
      
    });
    return () => unsubscribe();
  }, []);

  const handlePress = () => {
    setIsProfileVisible(true);
  };

  const handleClose = () => {
    setIsProfileVisible(false);
  };

  return (
    <View style={{ 
      position: 'absolute', 
      top: -20, 
      right: 0, 
      zIndex: 1000,
    }}>
      <TouchableOpacity onPress={handlePress} style={{ marginRight: 15, padding: 10 }}>
        <Icon name="person-circle-outline" size={34} color="black" style={{ margin: 10 }} />
      </TouchableOpacity>
      <ProfileWindow isVisible={isProfileVisible} onClose={handleClose} user={user} /> 
    </View>
  );
};

export default ProfileIcon;
