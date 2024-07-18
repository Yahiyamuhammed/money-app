import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
  RefreshControl
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { 
  getTransactions, 
  addTransaction, 
  updateTotals, 
  getTotals, 
  getOrCreateNameId,
  getPersonIdByName
} from '../database/db';
import ProfileIcon from '../components/ProfileIcon'; // Import ProfileIcon


const AddTransactionForm = ({ db, onTransactionAdded, toggleForm }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionType, setTransactionType] = useState('borrowed');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const nameInputRef = useRef();
  const amountInputRef = useRef();

  const handleAddTransaction = async () => {
    if (amount && description) {
      const personName = description.trim();
      const nameId = await getOrCreateNameId(db, personName);

      const newTransaction = {
        amount: parseFloat(amount),
        description: personName,
        type: transactionType,
        date: date.toISOString(),
        name_id: nameId
      };

      await addTransaction(db, newTransaction);
      onTransactionAdded();
      setAmount('');
      setDescription('');
      setDate(new Date());
      toggleForm();
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <View style={styles.addTransactionContainer}>
      <View style={{ flexDirection: 'row' }}>
        <Text style={styles.sectionHeader}>Add Transaction</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={toggleForm}
        >
          <MaterialCommunityIcons name="close-circle" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <TextInput
        ref={nameInputRef}
        style={styles.input}
        placeholder="Name"
        value={description}
        onChangeText={setDescription}
        returnKeyType="next"
        onSubmitEditing={() => amountInputRef.current.focus()}
        blurOnSubmit={false}
      />
      <TextInput
        ref={amountInputRef}
        style={styles.input}
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        returnKeyType="done"
      />
      <TouchableOpacity 
        style={styles.dateInput}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateText}>
          {date.toLocaleDateString()}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={onDateChange}
        />
      )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.typeButton, transactionType === 'borrowed' && styles.typeButtonActive]}
          onPress={() => setTransactionType('borrowed')}
        >
          <Text style={styles.buttonText}>Borrow</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, transactionType === 'lent' && styles.typeButtonActive]}
          onPress={() => setTransactionType('lent')}
        >
          <Text style={styles.buttonText}>Lend</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.submitButton} onPress={handleAddTransaction}>
        <Text style={styles.submitButtonText}>Add Transaction</Text>
      </TouchableOpacity>
    </View>
  );
};

const HomeScreen = ({ navigation, db }) => {
  const [totalBorrowed, setTotalBorrowed] = useState(0);
  const [totalLent, setTotalLent] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const loadedTransactions = await getTransactions(db);
    setTransactions(loadedTransactions);

    let borrowed = 0;
    let lent = 0;
    loadedTransactions.forEach(transaction => {
      if (transaction.type === 'borrowed') {
        borrowed += parseFloat(transaction.amount);
      } else {
        lent += parseFloat(transaction.amount);
      }
    });

    setTotalBorrowed(borrowed);
    setTotalLent(lent);
    await updateTotals(borrowed, lent);
  };

  useEffect(() => {
    loadData();
  }, [db]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const netBalance = totalLent - totalBorrowed;

  const toggleForm = () => {
    setShowForm(!showForm);
  };

  const handleTransactionAdded = async () => {
    await loadData();
  };

  const handlePersonPress = async (personName) => {
    const nameId = await getPersonIdByName(db, personName);
    if (nameId) {
      navigation.navigate('History', {
        screen: 'PersonHistory',
        params: { nameId, personName },
        initial: false,
      });
    }
  };

  const renderHeader = () => (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Dashboard</Text>
        <ProfileIcon  />
      </View>
      <View style={styles.summaryContainer}>
      
        <View style={styles.card}>
          <Text style={styles.summaryText}>Total Borrowed</Text>
          <Text style={styles.amount}>${totalBorrowed.toFixed(2)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.summaryText}>Total Lent</Text>
          <Text style={styles.amount}>${totalLent.toFixed(2)}</Text>
        </View>
        <View style={[styles.card, netBalance >= 0 ? styles.cardPositive : styles.cardNegative]}>
          <Text style={styles.summaryText}>Net Balance</Text>
          <Text style={styles.amount}>${netBalance.toFixed(2)}</Text>
          <Text style={styles.netBalanceText}>
            {netBalance >= 0 ? 'You are owed' : 'You owe'} ${Math.abs(netBalance).toFixed(2)}
          </Text>
        </View>
      </View>

      {showForm && (
        <AddTransactionForm
          db={db}
          onTransactionAdded={handleTransactionAdded}
          toggleForm={toggleForm}
        />
      )}

      {!showForm && (
        <TouchableOpacity style={styles.addTransactionButton} onPress={toggleForm}>
          <Text style={styles.addTransactionButtonText}>Add Transaction</Text>
        </TouchableOpacity>
      )}

      <View style={styles.recentTransactionsContainer}>
        <Text style={styles.sectionHeader}>Recent Transactions</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <FlatList
          ListHeaderComponent={renderHeader}
          data={transactions.slice(0, 5)}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handlePersonPress(item.description)}>
              <View style={styles.transactionItem}>
                <Text style={styles.transactionText}>{item.description}</Text>
                <Text style={styles.transactionAmount}>
                  {item.type === 'borrowed' ? '-' : '+'}${parseFloat(item.amount).toFixed(2)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 16,
    backgroundColor: '#f5f5f5',
    zIndex:2
  },
  listContainer: {
    paddingBottom: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  summaryContainer: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  cardPositive: {
    borderLeftColor: 'green',
    borderLeftWidth: 5,
  },
  cardNegative: {
    borderLeftColor: 'red',
    borderLeftWidth: 5,
  },
  summaryText: {
    fontSize: 16,
    color: '#555',
  },
  amount: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 5,
  },
  netBalanceText: {
    fontSize: 16,
    color: '#555',
    marginTop: 5,
  },
  recentTransactionsContainer: {
    // marginBottom: 0,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    // marginBottom: 10,
  },
  transactionItem: {
    backgroundColor: 'white',
    padding: 15,
    marginLeft:15,
    marginRight:15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionText: {
    fontSize: 16,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addTransactionButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  addTransactionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addTransactionContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    position: 'absolute',
    right: 0,
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  dateInput: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 16,
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
    marginRight: 5,
    backgroundColor: '#ddd',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#007bff',
  },
  buttonText: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
});

export default HomeScreen;