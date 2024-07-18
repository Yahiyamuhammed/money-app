import React from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';
import Modal from 'react-native-modal';

const { width, height } = Dimensions.get('window');

const ProfileWindow = ({ isVisible, onClose }) => {
  const windowWidth = width * 0.8; // Adjust as needed
  const windowHeight = height * 0.4; // Adjust as needed

  const slideAnim = React.useRef(new Animated.Value(0)).current; // Initial value at center

  React.useEffect(() => {
    if (isVisible) {
      Animated.timing(slideAnim, {
        toValue: 1, // Slide to full size
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0, // Slide back to center
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  return (
    <Modal
      isVisible={isVisible}
      backdropOpacity={0.5} // Adjust backdrop opacity if needed
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
              {/* Your profile window content here */}
              <Text style={styles.title}>Profile</Text>
              <View style={styles.menuItem}>
                <Text>Menu Item 1</Text>
              </View>
              <View style={styles.menuItem}>
                <Text>Menu Item 2</Text>
              </View>
              <View style={styles.menuItem}>
                <Text>Menu Item 3</Text>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
  menuItem: {
    padding: 10,
    // borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default ProfileWindow;
