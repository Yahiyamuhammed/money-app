import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { ActivityIndicator, View, Text } from 'react-native';
import { initDB } from './database/db';

import HomeScreen from './screens/HomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import PersonHistoryScreen from './screens/PersonHistoryScreen';
import ProfileScreen from './screens/ProfileScreen'; // Import the ProfileScreen

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HistoryStack = ({ db }) => (
  <Stack.Navigator>
    <Stack.Screen name="HistoryList" options={{ headerShown: false }}>
      {(props) => <HistoryScreen {...props} db={db} />}
    </Stack.Screen>
    <Stack.Screen name="PersonHistory" options={({ route }) => ({ title: route.params.personName })}>
      {(props) => <PersonHistoryScreen {...props} db={db} />}
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
      tabBarActiveTintColor: 'tomato',
      tabBarInactiveTintColor: 'gray',
      tabBarStyle: [{ display: 'flex' }, null],
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

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        const database = await initDB();
        setDb(database);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setError(error.message);
      }
    };
    setupDatabase();
  }, []);

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
    <NavigationContainer>
      <TabNavigator db={db} />
    </NavigationContainer>
  );
}
