import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ProfileWindow from './SlidingProfile'; // Import ProfileWindow

const ProfileIcon = () => {
  const [isProfileVisible, setIsProfileVisible] = useState(false);

  const handlePress = () => {
    console.log('Profile icon clicked');
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
      zIndex: 1000, // Remove zIndex (not needed with modal)
    }}>
      <TouchableOpacity onPress={handlePress} style={{ marginRight: 15 ,padding:10}}>
        <Icon name="person-circle-outline" size={34} color="black"  style={{ margin:10}} />
      </TouchableOpacity>
      <ProfileWindow isVisible={isProfileVisible} onClose={handleClose} /> 
    </View>
  );
};

export default ProfileIcon;
