import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, TextInput, Platform ,ActivityIndicator} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getPersonTransactions, updateTransaction, deleteTransaction } from '../database/db';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {  Snackbar } from 'react-native-paper';


const PersonHistoryScreen = ({ route, db }) => {
  const { nameId, personName } = route.params;
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [editname, setEditName] = useState('');

  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loading, setLoading] = useState(false);

  const [visible, setVisible] = React.useState(false);
  const onDismissSnackBar = () => setVisible(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');



  // useEffect(() => {
  //   loadPersonTransactions();
  // }, []);

  useEffect(() => {
    loadPersonTransactions();
  }, [nameId]);

  const loadPersonTransactions = async () => {
    const personTransactions = await getPersonTransactions(db, nameId);
    setTransactions(personTransactions);
    calculateTotal(personTransactions);
  };

  const calculateTotal = (personTransactions) => {
    const calculatedTotal = personTransactions.reduce((acc, transaction) => {
      return transaction.type === 'borrowed'
        ? acc - parseFloat(transaction.amount)
        : acc + parseFloat(transaction.amount);
    }, 0);
    setTotal(calculatedTotal);
  };

  const getStatusHeader = () => {
    if (total > 0) {
      return `${personName} needs to pay you ₹${Math.abs(total).toFixed(2)}`;
    } else if (total < 0) {
      return `You need to pay ${personName} ₹${Math.abs(total).toFixed(2)}`;
    } else {
      return `You're settled up with ${personName}`;
    }
    
  };

  const getHeaderStyle = () => {
    return total > 0 ? styles.lent : total < 0 ? styles.borrowed : styles.square;
  };

  const handlePress = (transaction) => {
    if (selectedItemId === transaction.id) {
      // If the same tile is pressed, close everything
      setSelectedItemId(null);
      setEditingTransaction(null);
    } else {
      // If a different tile is pressed, close any open edit form and options
      setSelectedItemId(null);
      setEditingTransaction(null);
    }
  };

  const handleLongPress = (transaction) => {
    if (selectedItemId === transaction.id) {
      setSelectedItemId(null);
    } else {
      setSelectedItemId(transaction.id);
    }
    setEditingTransaction(null);
  };

  const handleEdit = (transaction) => {
    setEditName(transaction.name);
    setEditingTransaction(transaction);
    setEditAmount(transaction.amount.toString());
    setEditDescription(transaction.description);
    setEditType(transaction.type);
    setEditDate(new Date(transaction.date));
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
            loadPersonTransactions();
            handleSnackbarMessage("Transaction daleted")

          }
        }
      ]
    );
  };

  const handleUpdate = async () => {
    setLoadingUpdate(true);

    const updatedTransaction = {
      ...editingTransaction,
      name:editname,
      amount: parseFloat(editAmount),
      description: editDescription,
      type: editType,
      date: editDate.toISOString()
    };

    await updateTransaction(db, updatedTransaction);

    setEditingTransaction(null);
    setLoadingUpdate(false);
    handleSnackbarMessage("transaction updated")


    setSelectedItemId(null);
    loadPersonTransactions();
  };
  const handleSnackbarMessage = (message) => {
    setVisible(true);

    setSnackbarMessage(message);
  };

  const renderTransaction = ({ item }) => (
    // console.log("csz",item),
    
    <TouchableOpacity 
      onPress={() => handlePress(item)}
      onLongPress={() => handleLongPress(item)}
      delayLongPress={500}
    >
      <View>
        <View
          style={[
            styles.transactionItem,
            item.type === 'borrowed' ? styles.borrowed : styles.lent,
            selectedItemId && selectedItemId !== item.id && styles.blurred
          ]}
        >
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionText}>{item.name}</Text>
            <Text style={styles.transactionDate}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
            <Text style={styles.transactionType}>
              {item.type === 'borrowed' ? 'You borrowed' : 'You lent'}
            </Text>
          </View>
          <Text style={styles.transactionAmount}>
            {item.type === 'borrowed' ? '-' : '+'}₹{parseFloat(item.amount).toFixed(2)}
          </Text>
        </View>
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
              onBlur={() => {
                // Trim trailing spaces when input loses focus
                setEditName((prevName) => prevName.trimEnd());
              }}
            />
            <TextInput
              style={styles.input}
              placeholder="Amount"
              value={editAmount}
              onChangeText={(text) => {
                // Remove leading zeros
                const cleanedText = text.replace(/^0+(?!\.|$)/, '');
            
                // Prevent submitting when the amount is just zero
                if (cleanedText === '0' || cleanedText === '') {
                  setEditAmount('');
                } else {
                  setEditAmount(cleanedText);
                }
              }}
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
            {/* <TextInput
              style={styles.input}
              placeholder="Description"
              value={editDescription}
              onChangeText={setEditDescription}
            /> */}
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
      <View style={[styles.headerContainer, getHeaderStyle()]}>
        <Text style={styles.header}>{personName}'s Transactions</Text>
        <Text style={styles.statusHeader}>{getStatusHeader()}</Text>
      </View>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTransaction}
      />
      <Snackbar
          visible={visible}
          onDismiss={onDismissSnackBar}
          duration={Snackbar.DURATION_SHORT}
          style={{ backgroundColor: '#D6BD98' }} // Optional: Custom styles
        >
          {snackbarMessage}
        </Snackbar>
    </View>
  );
};

// ... (keep the styles as they were)


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#1A3636',
  },
  headerContainer: {
    backgroundColor: '#677D6A',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 5,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'left',
    color: '#fff',
  },
  statusHeader: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'left',
    color: '#fff',
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
  square: {
    borderLeftColor: 'gray',
  },
  transactionText: {
    fontSize: 16,
    textAlign: 'left',
    color: '#fff',
  },
  transactionDate: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
  },
  transactionType: {
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
  unselectedButtonText:{
    color:'black'
  }
});

export default PersonHistoryScreen;
