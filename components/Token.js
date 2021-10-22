import AsyncStorage from '@react-native-async-storage/async-storage';

const TokenA = async () => {
  const result =  await AsyncStorage.getItem('TOKEN_ACCESS');
  console.log("rs"+result);
  return result;
}

export default TokenA;
