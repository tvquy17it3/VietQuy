import React, { useState, useEffect } from 'react';
import { Text, ActivityIndicator, StyleSheet, Image, Alert, View, TouchableOpacity } from 'react-native';
import Background from '../components/Background'
import { theme } from '../components/theme'
import Button from '../components/Buttons'
import { emailValidator } from '../components/emailValidator'
import { passwordValidator } from '../components/passwordValidator'
import TextInput from '../components/TextInput'
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Keyboard } from 'react-native'
import ReactNativeBiometrics from 'react-native-biometrics'
import * as API from '../components/api';
import * as NOTICE from '../components/notices';
import OrientationLoadingOverlay from 'react-native-orientation-loading-overlay';
import NetworkUtils from '../components/NetworkUtills'

export default function Login({ navigation }) {
	const [email, setEmail] = useState({ value: '', error: '' })
	const [password, setPassword] = useState({ value: '', error: '' })
	const [isLoading, setLoading] = useState(false);
	const [isError, setError] = useState('');
    const [isOpen, setOpen] = useState(true);
    const [isAvail, setAvail] = useState(false);

	// =================CALL API VERIFY FINGER=================
    const post_verify = async (payload, signature, accessToken) =>{
        try {
            setLoading(true);
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
                navigation.reset({
                    index: 1,
                    routes: [{ name: 'Main' }],
                })
            }else{
                Alert.alert(NOTICE.FINGER_ERROR_AUTH);
            }
        } catch (error) {
            Alert.alert(NOTICE.HAS_ERROR);
        } finally {
            setLoading(false);
        }
    }
	//===========CHECK TOKEN AND CREATE RSA=======================
	const check_exist_Token = async () => {
		try {
            const accessToken = await AsyncStorage.getItem('TOKEN_ACCESS');
            if (accessToken != null){
                ReactNativeBiometrics.biometricKeysExist()
                .then((resultObject) => {
                    const { keysExist } = resultObject
                    if (keysExist) {
                        setOpen(false);
                        setAvail(true);
                        //open finger and create RSA
                        let epochTimeSeconds = Math.round((new Date()).getTime() / 1000).toString()
                        let payload = epochTimeSeconds + 'quyviet'
                        ReactNativeBiometrics.createSignature({
                            promptMessage: NOTICE.SIGN_IN,
                            payload: payload
                        })
                        .then((resultObject) => {
                            const { success, signature } = resultObject
                            if (success) {
                                post_verify(payload, signature, accessToken);
                            }
                        }).catch(function(error) {
                            ReactNativeBiometrics.deleteKeys()
                            .then(() => {
                                setAvail(false);
                            })
                            Alert.alert(NOTICE.NOTICE_POPUP, NOTICE.FINGER_CHANGED);
                        });
                    }
                })
            }
		} catch(e) {
			setError("Error Token!")
		}
	}

    useEffect(() => {
        // navigation.reset({
        //     index: 1,
        //     routes: [{ name: 'Main' }],
        // })
        if (isOpen){
            check_exist_Token()
        }
    });

    const onLoginPressed = () => {
    const emailError = emailValidator(email.value)
    const passwordError = passwordValidator(password.value)

    if (emailError || passwordError) {
        setEmail({ ...email, error: emailError })
        setPassword({ ...password, error: passwordError })
        return
    }
    login()
  }

	const login = async () => {
		Keyboard.dismiss()
        const isConnected = await NetworkUtils.isNetworkAvailable()
        if(isConnected){
            try {
                setLoading(true);
                const response = await fetch(API.LOGIN, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email.value,
                        password: password.value,
                        device_name: DeviceInfo.getUniqueId(),
                    })
                });
                const json = await response.json();
                if(json.status_code == 200){
                    await AsyncStorage.setItem('TOKEN_ACCESS', json.access_token)
                    await AsyncStorage.setItem('EMPLOYEE_ID', json.employee_id+"")
                    navigation.reset({
                        index: 1,
                        routes: [{ name: 'Main' }],
                    })
                }else{
                    // console.log(json);
                    setLoading(false);
                    setError(json.message);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }else{
            Alert.alert(NOTICE.NOTICE_POPUP, NOTICE.CONNECT_INTERNET);
        }
	}

    function not_support(){
        Alert.alert(NOTICE.NOTICE_POPUP, NOTICE.NOT_SETUP_FINGER);
    }

    function finger(){
        return(
            <View>
                {isAvail ?
                    <TouchableOpacity onPress={check_exist_Token}>
                        <Image source={require('../assets/759477.png')} style={styles.finger} />
                    </TouchableOpacity> :
                    <TouchableOpacity onPress={not_support}>
                        <Image source={require('../assets/759477.png')} style={styles.finger} />
                    </TouchableOpacity>
                }
            </View>
        );
    }

	return (
		<Background>
            <Image source={require('../assets/face.png')} style={styles.image} />
            {isLoading ?
                <OrientationLoadingOverlay
                    visible={true}
                    color="white"
                    indicatorSize="large"
                    messageFontSize={24}
                    message="Loading..."
                /> :
                (<Text style={styles.header}>{isError}</Text>)
            }
            <TextInput
                label="Email"
                returnKeyType="next"
                value={email.value}
                onChangeText={(text) => setEmail({ value: text, error: '' })}
                error={!!email.error}
                errorText={email.error}
                autoCapitalize="none"
                autoCompleteType="email"
                textContentType="emailAddress"
                keyboardType="email-address"
            />
            <TextInput
                label="Password"
                returnKeyType="done"
                value={password.value}
                onChangeText={(text) => setPassword({ value: text, error: '' })}
                error={!!password.error}
                errorText={password.error}
                secureTextEntry
            />
            <Button mode="contained" onPress={onLoginPressed}>
                {NOTICE.BTN_LOGIN}
            </Button>
            {finger()}
		</Background>
	);
}
const styles = StyleSheet.create({
    forgotPassword: {
        width: '100%',
        alignItems: 'flex-end',
        marginBottom: 24,
    },
    row: {
        flexDirection: 'row',
        marginTop: 4,
    },
    forgot: {
        fontSize: 13,
        color: theme.colors.text,
    },
    link: {
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    image: {
        width: 110,
        height: 110,
        marginBottom: 8,
    },
    finger: {
        width: 60,
        height: 60,
        marginTop: 10,
        marginBottom: 8,
    },
    header: {
        fontSize: 21,
        color: theme.colors.primary,
        fontWeight: 'bold',
        paddingVertical: 12,
    },
});
