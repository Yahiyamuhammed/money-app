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
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { 
  getTransactions, 
  addTransaction, 
  updateTotals, 
  getTotals, 
  getOrCreateNameId,
  getPersonIdByName,
  dropTableUsers,
  mergeFirestoreTransactions,
  syncTransactions
} from '../database/db';
import {  Snackbar } from 'react-native-paper';


// import ProfileIcon from '../components/ProfileIcon'; // Import ProfileIcon


const AddTransactionForm = ({ db, onTransactionAdded, toggleForm }) => {
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');

  const [description, setDescription] = useState('');
  const [transactionType, setTransactionType] = useState('borrowed');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);


  const nameInputRef = useRef();
  const descriptionRef = useRef();
  const amountInputRef = useRef();

  const handleAddTransaction = async () => {
    if (amount && description) {
      setLoading(true);

      const personName = description.trim();
      const nameId = await getOrCreateNameId(db, name);
      console.log("enering add transatcction",nameId);
      

      const newTransaction = {
        amount: parseFloat(amount),
        name:name,
        description: description,
        type: transactionType,
        date: date.toISOString(),
        name_id: nameId
      };
      console.log("vslues",newTransaction);
      

      await addTransaction(db, newTransaction);
      onTransactionAdded();
      setAmount('');
      setDescription('');
      setDate(new Date());
      setName('');
      setLoading(false);
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
        value={name}
        onChangeText={setName}
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
      <TextInput
          ref={descriptionRef}
          style={styles.input}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          returnKeyType="next"
          onSubmitEditing={() => amountInputRef.current.focus()}
          blurOnSubmit={false}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.typeButton, transactionType === 'borrowed' && styles.typeButtonActive]}
          onPress={() => setTransactionType('borrowed')}
        >
          <Text style={[styles.buttonText, transactionType !== 'borrowed' && styles.unselectedButtonText]}>Borrow</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, transactionType === 'lent' && styles.typeButtonActive]}
          onPress={() => setTransactionType('lent')}
        >
          <Text style={[styles.buttonText, transactionType !== 'lent' && styles.unselectedButtonText]}>Lend</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.submitButton} onPress={handleAddTransaction} disabled={loading}>
      {loading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.submitButtonText}>Add Transaction</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const HomeScreen = ({ navigation, db }) => {
  console.log("enetered home screen");
  
  // dropTableUsers()
  
  // console.log("user :",user.email);
  

  
  const [totalBorrowed, setTotalBorrowed] = useState(0);
  const [totalLent, setTotalLent] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [description, setDescription] = useState('');
  const [visible, setVisible] = React.useState(false);
  const onDismissSnackBar = () => setVisible(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');




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
    
    
    // const homemerge = async () => {
    //       // const db = await initDB();
    //       console.log("merging home");
          
    //       mergeFirestoreTransactions(db)

    //     }
    //     homemerge()

    // const syncInterval = setInterval(async () => {
      
    //     // const db = await initDB();
    //     await syncTransactions(db);
      
    // },.05 * 60 * 1000); // Sync every 5 minutes
  
    // return () => clearInterval(syncInterval);
  }, [db]);
  // useEffect(() => {
  //   const initAndDropTable = async () => {
  //     // const db = await initDB();
  //     await dropTableUsers(db); // Call dropTableUsers only after db is initialized
  //     loadData();
  //   };
  
  //   initAndDropTable();
  // }, [])
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
    setVisible(true);

    setSnackbarMessage("transaction added");
    await loadData();
  };

  const handlePersonPress = async (personName) => {
    const nameId = await getPersonIdByName(db, personName);
    console.log("person presseds ansd id : ",nameId , personName);
    
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
          style={    {backgroundColor: '#1A3636'      }    }
          ListHeaderComponent={renderHeader}
          data={transactions.slice(0, 5)}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handlePersonPress(item.name)}>
              <View style={styles.transactionItem}>
                <Text style={styles.transactionText}>{item.name}</Text>
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
      <Snackbar
          visible={visible}
          onDismiss={onDismissSnackBar}
          duration={Snackbar.DURATION_SHORT}
          style={{ backgroundColor: '#D6BD98' }} // Optional: Custom styles
        >
          {snackbarMessage}
        </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 16,
    backgroundColor: '#1A3636',
    zIndex:2
  },
  listContainer: {
    paddingBottom: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color:'#ffffff'
    
  },
  summaryContainer: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#677D6A',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#9DB2BF',
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
    color: '#fff',
  },
  amount: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 5,
    color:'#fff'
  },
  netBalanceText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
  },
  recentTransactionsContainer: {
    backgroundColor: '#1A3636',

    // marginBottom: 0,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color:'#fff'
    // marginBottom: 10,
    
  },
  transactionItem: {
    backgroundColor: '#677D6A',
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
    color:'#fff'
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color:'#fff'
  },
  addTransactionButton: {
    backgroundColor: '#40534C',
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
    backgroundColor: '#677D6A',
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
    backgroundColor:'#677D6A'
  },
  typeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginRight: 5,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#D6BD98',
  },
  buttonText: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#40534C',
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
    backgroundColor:'#1A3636',
  },
  unselectedButtonText:{
    color:'black'
  }
});

export default HomeScreen;