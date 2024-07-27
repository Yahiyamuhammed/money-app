import React, { useState, useEffect } from 'react';
// import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  RefreshControl, 
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Animated,
  ActivityIndicator
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
  getTransactions, 
  getPersonIdByName, 
  updateTransaction, 
  deleteTransaction ,
  mergeFirestoreTransactions
} from '../database/db';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
// import { getTransactions, getPersonIdByName } from '../database/db';

const HistoryScreen = ({ navigation, db }) => {
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editname, setEditName] = useState('');
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loading, setLoading] = useState(false);





  useEffect(() => {
    loadTransactions();
    
         
  }, [db]);

  useEffect(() => {
    loadTransactions();
  }, [searchQuery]);

  const loadTransactions = async () => {
    const loadedTransactions = await getTransactions(db);
    const filteredTransactions = loadedTransactions.filter(transaction => 
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setTransactions(filteredTransactions);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const handlePersonPress = async (personName) => {
    if (selectedItemId) {
      // If options are open, close them
      setSelectedItemId(null);
      setEditingTransaction(null);
    } else {
      // If no options are open, navigate to PersonHistory
      const nameId = await getPersonIdByName(db, personName);
      if (nameId) {
        console.log("person pressed in history");
        
        navigation.navigate('PersonHistory', { nameId, personName });
      }
    }
  };
  
  const handleLongPress = (transaction) => {
    if (selectedItemId === transaction.id) {
      // If the same tile is long-pressed, close the options
      setSelectedItemId(null);
    } else {
      // If a different tile is long-pressed, show its options
      setSelectedItemId(transaction.id);
    }
    setEditingTransaction(null); // Close any open edit form
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setEditAmount(transaction.amount.toString());
    setEditDescription(transaction.description);
    setEditType(transaction.type);
    setEditDate(new Date(transaction.date));
    setEditName(transaction.name)
  };

  const handleDelete = (transactionId) => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          onPress: async () => {
            await deleteTransaction(db, transactionId);
            setSelectedItemId(null);
            loadTransactions();
          }
        }
      ]
    );
  };

  const handleUpdate = async () => {
    setLoadingUpdate(true);
    const updatedTransaction = {
      ...editingTransaction,
      amount: parseFloat(editAmount),
      description: editDescription,
      type: editType,
      date: editDate.toISOString(),
      name:editname
    };

    await updateTransaction(db, updatedTransaction);
    setLoadingUpdate(false);

    setEditingTransaction(null);
    setSelectedItemId(null);
    loadTransactions();
  };


    const handleSearch = (query) => {
      setSearchQuery(query);
    };
    const clearSearch = () => {
      setSearchQuery('');
    };

  const renderTransaction = ({ item }) => (
    <TouchableOpacity 
      onPress={() => handlePersonPress(item.name)}
      onLongPress={() => handleLongPress(item)}
      delayLongPress={500}
    >
      <View>
        <Animated.View style={[
          styles.transactionItem, 
          item.type === 'borrowed' ? styles.borrowed : styles.lent,
          selectedItemId && selectedItemId !== item.id && styles.blurred
        ]}>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionText}>{item.name}</Text>
            <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString()}</Text>
          </View>
          <Text style={styles.transactionAmount}>
            {item.type === 'borrowed' ? '-' : '+'}${parseFloat(item.amount).toFixed(2)}   
          </Text>
        </Animated.View>
        {selectedItemId === item.id && (
          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.optionButton} onPress={() => handleEdit(item)}>
              <Text style={styles.optionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton} onPress={() => handleDelete(item.id)}>
              <Text style={styles.optionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        {editingTransaction && editingTransaction.id === item.id && (
          <View style={styles.editFormContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.sectionHeader}>Edit Transaction</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setEditingTransaction(null)}
              >
                <MaterialCommunityIcons name="close-circle" size={24} color="black" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={editname}
              onChangeText={setEditName}
            />
            <TextInput
              style={styles.input}
              placeholder="Amount"
              value={editAmount}
              onChangeText={setEditAmount}
              keyboardType="numeric"
            />
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateText}>{editDate.toDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={editDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setEditDate(selectedDate);
                  }
                }}
              />
            )}
            <TextInput
                // ref={descriptionRef}
                style={styles.input}
                placeholder="Description"
                value={editDescription}
                onChangeText={setEditDescription}
                returnKeyType="next"
                onSubmitEditing={() => amountInputRef.current.focus()}
                blurOnSubmit={false}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.typeButton, editType === 'borrowed' && styles.typeButtonActive]}
                onPress={() => setEditType('borrowed')}
              >
          <Text style={[styles.buttonText, editType !== 'borrowed' && styles.unselectedButtonText]}>Borrow</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, editType === 'lent' && styles.typeButtonActive]}
                onPress={() => setEditType('lent')}
              >
          <Text style={[styles.buttonText, editType !== 'lent' && styles.unselectedButtonText]}>Lend</Text>
          </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.submitButton} onPress={handleUpdate} disabled={loading}>
            {loadingUpdate ? (
                <ActivityIndicator size="small" color="#fff"  />
              ) : (
                <Text style={styles.submitButtonText}>Update Transaction</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
  

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Transaction History</Text>
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search transactions..."
          placeholderTextColor="white" // Set placeholder text color to white

          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
            <MaterialCommunityIcons name="close" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTransaction}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    flex: 1,
    padding: 16,
    paddingBottom: 0,
    backgroundColor: '#1A3636',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'left',
    color:'#fff'
  },
  transactionItem: {
    backgroundColor: '#677D6A',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderLeftWidth: 5,
    alignItems: 'center',
  },
  transactionDetails: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  borrowed: {
    borderLeftColor: 'red',
  },
  lent: {
    borderLeftColor: 'green',
  },
  transactionText: {
    fontSize: 16,
    textAlign: 'left',
    color:'#fff'
  },
  transactionDate: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  blurred: {
    opacity: 0.5,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
    backgroundColor: '#1A3636',
    borderRadius: 5,
    marginTop: -10,
    marginBottom: 10,
    zIndex: 1,
  },
  optionButton: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginLeft: 10,
    backgroundColor: '#40534C',
    borderRadius: 5,
  },
  optionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  editFormContainer: {
    backgroundColor: '#677D6A',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color:'#fff'
  },
  closeButton: {
    padding: 5,
  },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  dateText: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  typeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  typeButtonActive: {
    backgroundColor: '#D6BD98',
  },
  buttonText: {
    fontWeight: 'bold',
    color:'#fff'
  },
  submitButton: {
    backgroundColor: '#40534C',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#40534C',
    borderRadius: 5,
    marginBottom: 10,
  },
  searchBar: {
    flex: 1,
    padding: 10,
    fontSize: 16,
    color:'#fff'
  },
  clearButton: {
    padding: 10,
  },
  unselectedButtonText:{
    color:'black'
  }
});

export default HistoryScreen;