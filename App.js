import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { ActivityIndicator, View, Text } from 'react-native';
import { initDB,signOutUser ,syncTransactions} from './database/db';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from "@react-native-community/netinfo";



import { auth } from './auth/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import HomeScreen from './screens/HomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import PersonHistoryScreen from './screens/PersonHistoryScreen';
import ProfileScreen from './screens/ProfileScreen'; // Import the ProfileScreen

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HistoryStack = ({ db }) => (
  <Stack.Navigator
  screenOptions={{
    headerStyle: {
      backgroundColor: '#1A3636', // Replace with your desired color
    },
    headerTintColor: '#fff', // Replace with your desired color
    headerTitleStyle: {
      color: '#fff', // Replace with your desired color
    },
  }}>
    <Stack.Screen name="HistoryList" options={{ headerShown: false }}>
      {(props) => <HistoryScreen {...props} db={db} />}
    </Stack.Screen>
    <Stack.Screen name="PersonHistory" options={({ route }) => ({ title: route.params.personName })}>
      {(props) => <PersonHistoryScreen {...props} db={db} navigation={props.navigation} />}
    </Stack.Screen>
  </Stack.Navigator>
);

const TabNavigator = ({ db }) => (
  <Tab.Navigator
    initialRouteName="Home"
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === 'Home') {
          iconName = 'home-outline';
        } else if (route.name === 'History') {
          iconName = 'time-outline';
        } else if (route.name === 'Profile') {
          iconName = 'person-outline';
        }
        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: 'black',
      tabBarInactiveTintColor: '#677D6A',
      tabBarStyle: [{ display: 'flex' }, null],
      tabBarStyle: { // Style the entire tab bar
        backgroundColor: '#E2DFD0', // Set your desired background color here
        // Additional styles for padding, border, etc. (optional)
      },
    })}
  >
    <Tab.Screen name="Home" options={{ headerShown: false }}>
      {(props) => <HomeScreen {...props} db={db} />}
    </Tab.Screen>
    <Tab.Screen name="History" options={{ headerShown: false }}>
      {(props) => <HistoryStack {...props} db={db} />}
    </Tab.Screen>
    <Tab.Screen name="Profile" options={{ headerShown: false }}>
      {(props) => <ProfileScreen {...props} db={db} />}
    </Tab.Screen>
  </Tab.Navigator>
);

export default function App() {
  const [db, setDb] = useState(null);
  const [error, setError] = useState(null);
  const [user,setUser]=useState();

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        const database = await initDB();
        setDb(database);

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            console.log("User is signed in:", user.uid);
            setUser(user);
            await AsyncStorage.setItem('isUserLoggedIn', 'true');
            await syncTransactions(database);
          } else {
            console.log("User is signed out");
            setUser(null);
            await AsyncStorage.setItem('isUserLoggedIn', 'false');
          }
        });

        // Attempt to reauthenticate if needed
        const isUserLoggedIn = await AsyncStorage.getItem('isUserLoggedIn');
        if (isUserLoggedIn === 'true' && !auth.currentUser) {
          await reauthenticate();
        }

         // Set up network state listener
         const unsubscribeNetInfo = NetInfo.addEventListener(state => {
          if (state.isConnected) {
            console.log('Internet connection available, syncing...');
            syncTransactions(database);
          } else {
            console.log('Internet connection lost');
          }
        });

        // Cleanup subscription on unmount
       return () => {
          unsubscribe();
          unsubscribeNetInfo();
        };

      } catch (error) {
        console.error('Failed to initialize database:', error);
        setError(error.message);
      }
    };
    setupDatabase();
  }, []);

  const reauthenticate = async () => {
    const email = await AsyncStorage.getItem('userEmail');
    const password = await AsyncStorage.getItem('userPassword');
    if (email && password) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("Reauthentication successful");
      } catch (error) {
        console.error("Failed to reauthenticate:", error);
        // Clear stored credentials on failed reauthentication
        await AsyncStorage.removeItem('userEmail');
        await AsyncStorage.removeItem('userPassword');
      }
    }
  };



  useEffect(() => {
    if (!db) return;

    const syncInterval = setInterval(async () => {
      
        try {
          const netInfo = await NetInfo.fetch();
          if (netInfo.isConnected) {
            await syncTransactions(db);
          } else {
            console.log('Periodic sync skipped: No internet connection');
          }
        } catch (error) {
          console.error('Error during periodic sync:', error);
        }
      
    }, 2 * 60 * 1000); // Sync every 5 minutes when the app is active

    return () => clearInterval(syncInterval);
  }, [db]);


  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error initializing database: {error}</Text>
      </View>
    );
  }

  if (!db) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer >
      <TabNavigator db={db} />
    </NavigationContainer>
  );
}
