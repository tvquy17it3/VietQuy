import React, { useState, useEffect } from 'react';
import {StyleSheet, Text, View, TouchableOpacity, Image, Alert,  Switch} from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics'
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NOTICE from '../components/notices';
import * as API from '../components/api';
import OrientationLoadingOverlay from 'react-native-orientation-loading-overlay';

export default function Finger({navigation}) {
  const [isFingerExist, setFingerExist] = useState(false);
  const [isSupport, setSupport] = useState(false);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    check_finger_support()
    check_exist_keys()
  });

  function check_finger_support(){
    ReactNativeBiometrics.isSensorAvailable().then((resultObject) => {
        const { available, biometryType } = resultObject
        if (available && biometryType === ReactNativeBiometrics.TouchID) {
            setSupport(true)
        } else if (available && biometryType === ReactNativeBiometrics.Biometrics) {
            setSupport(true)
        }else{
            setSupport(false)
        }
    })
  }

  function check_exist_keys() {
    ReactNativeBiometrics.biometricKeysExist()
    .then((resultObject) => {
        const { keysExist } = resultObject
        if (keysExist) {
            setFingerExist(true)
            // console.log("exit finger");
            return true;
        }
    })
    return false;
  }

  function create_authKey() {
    ReactNativeBiometrics.createKeys('Confirm fingerprint').then((resultObject) => {
        const { publicKey } = resultObject
        // console.log(publicKey)
        setFingerExist(true)
        sendPublicKeyToServer(publicKey)
    })
  }

  const sendPublicKeyToServer = async (publicKey) => {
    try {
        const accessToken = await AsyncStorage.getItem('TOKEN_ACCESS');
        const response = await fetch(API.SAVEKEY, {
            method: 'POST',
            headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({publickey: publicKey})
        });
        const json = await response.json();
        // console.log(json);
        if(json.status_code == 200){
            Alert.alert("Đã thêm đăng nhập bằng vân tay!");
        }else{
            deleteKeys()
            Alert.alert("Đã có lỗi xảy ra!");
        }
    } catch (error) {
        console.error(error);
        Alert.alert("Đã có lỗi xảy ra!");
    } finally {
        setLoading(false);
    }
  }

  // ==================================
  const verify = () => {
    let epochTimeSeconds = Math.round((new Date()).getTime() / 1000).toString()
    let payload = epochTimeSeconds + 'quyviet'

    ReactNativeBiometrics.createSignature({
        promptMessage: 'Sign in',
        payload: payload
    })
    .then((resultObject) => {
        const { success, signature } = resultObject

        if (success) {
            // console.log(payload + " signature " + signature)
            post_signature_verify(payload, signature)
        }
    })
  }

  const post_signature_verify = async (payload, signature) =>{
    try {
        setLoading(true);
        const accessToken = await AsyncStorage.getItem('TOKEN_ACCESS');
        const response = await fetch(API.VERIFY, {
            method: 'POST',
            headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({payload: payload, signature: signature})
        });
        const json = await response.json();
        if(json.status_code == 200){
            Alert.alert("Thông báo!", "Xác thực thành công!");
        }else{
            Alert.alert("Đã có lỗi xảy ra!");
        }
        console.log(json);
    } catch (error) {
        console.error(error);
        Alert.alert("Đã có lỗi xảy ra!");
    } finally {
        setLoading(false);
    }
  }
  //==================================


  function deleteKeys(){
    ReactNativeBiometrics.deleteKeys()
    .then(() => {
        setFingerExist(false)
        Alert.alert("Đã xóa vân tay!");
    })
  }

  function not_support(){
    Alert.alert(NOTICE.NOTICE_POPUP, NOTICE.NOT_SETUP_FINGER);
  }

  function finger(){
    return(
        <View>
            {isFingerExist ?
              <TouchableOpacity onPress={verify}>
                <Image source={require('../assets/759477.png')} style={styles.finger} />
              </TouchableOpacity> :
              <TouchableOpacity onPress={not_support}>
                <Image source={require('../assets/759477.png')} style={styles.finger} />
              </TouchableOpacity>
            }
        </View>
    );
  }

  const toggleSwitch = () => {
    if(isFingerExist == false ){
      setLoading(true);
      create_authKey()
    }else{
      deleteKeys()
    }
  }

  const btn_click = ()=>{
    return(
      <View>
        <Switch
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isFingerExist ? "blue" : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
          onValueChange={toggleSwitch}
          value={isFingerExist}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading ?
        <OrientationLoadingOverlay
          visible={true}
          color="white"
          indicatorSize="large"
          messageFontSize={24}
          message="Loading..."
        /> : null
		  }
      <View style={styles.container_finger}>
        <View style={styles.cont_left}>
          <Text style={styles.text_finger}>{NOTICE.SETTING_FINGER}</Text>
        </View>
        <View style={styles.cont_right}>
          {btn_click()}
        </View>
      </View>
      <Text style={styles.text_test}>{NOTICE.TEST_FINGER}</Text>
      <Text style={styles.text_center}>{finger()}</Text>
      <Text style={styles.text_click}>{NOTICE.CLICK_TEST_FINGER}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    // alignItems: 'center',
    //textAlign:'center'
    backgroundColor: 'white',
    height: '100%',
  },
  container_finger: {
    flexDirection: "row",
    width: '100%',
    borderColor: '#b3d9ff',
    borderBottomWidth: 1,
    marginTop: 20,
  },
  cont_left: {
    flex: 2,
  },
  cont_right: {
    flex: 1,
    alignItems: 'center',
  },
  text_finger:{
    color: "black",
    marginLeft: 15,
    marginTop: 3,
    height: 33,
    fontSize: 19,
  },
  text_test:{
    color: "black",
    marginLeft: 15,
    marginTop: 10,
    fontSize: 19,
  },
  finger:{
    width: 60,
    height: 60,
    marginTop: 50,
  },
  text_center:{
    textAlign:'center',
  },
  text_click:{
    textAlign:'center',
    marginTop: 10
  }
});
