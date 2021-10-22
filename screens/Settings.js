import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, FlatList, TouchableOpacity, Dimensions, SafeAreaView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import ReactNativeBiometrics from 'react-native-biometrics'
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as API from '../components/api';
import * as NOTICE from '../components/notices';
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid } from 'react-native';
// import { set } from 'react-native-reanimated';
// npm install --legacy-peer-deps --save radium
// npx react-native run-android --variant=release
// ./gradlew bundleRelease

import RNMockLocationDetector from "react-native-mock-location-detector";

const menu = [
    { id: 1, title: 'Vị trí', icon: 'info-circle', screen: 'Home' },
    { id: 3, title: 'Lịch sử đăng nhập', icon: 'history', screen: 'history login' },
    { id: 4, title: 'Thay đổi mật khẩu', icon: 'key', screen: 'change password' },
];


function computeDistance([prevLat, prevLong], [lat, long]) {
    const prevLatInRad = toRad(prevLat);
    const prevLongInRad = toRad(prevLong);
    const latInRad = toRad(lat);
    const longInRad = toRad(long);

    return (
      6377.830272 *
      Math.acos(
        Math.sin(prevLatInRad) * Math.sin(latInRad) +
          Math.cos(prevLatInRad) * Math.cos(latInRad) * Math.cos(longInRad - prevLongInRad),
      )*1000
    );
}

function toRad(angle) {
    return (angle * Math.PI) / 180;
}

function roundToTwo(num) {
    return +(Math.round(num + "e+2")  + "e-2");
}

export default function Settings({ navigation }) {
    const [isFingerExist, setFingerExist] = useState(false);
    const [isLocation, setLocation] = useState('');

    useEffect(() => {
        // location_gps();
    },[]);

    const location_gps =  async () => {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: "Location",
                    message: "Allow camera ",
                    buttonNeutral: "Ask Me Later",
                    buttonNegative: "Cancel",
                    buttonPositive: "OK"
                }
            );

            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                const isLocationMocked = await RNMockLocationDetector.checkMockLocationProvider();
                if (isLocationMocked) {
                    Alert.alert(NOTICE.NOTICE_POPUP, NOTICE.FAKE_LOCATION);
                    return;
                }else{
                    Geolocation.getCurrentPosition((position) => {
                        var latitude = position.coords.latitude;
                        var longitude = position.coords.longitude;
                        var distance = roundToTwo(computeDistance([16.85324152798239,107.13256257264419],[latitude,longitude]));
                        Alert.alert("Location", "Lat: "+ latitude+ "\nLong: "+longitude + "\nDistance: "+ distance+"m");
                        setLocation({"accuracy": roundToTwo(position.coords.accuracy), "latitude": latitude, "longitude": longitude, "distance" : distance});
                    },(error) => {
                        console.log(error.code, error.message);
                    },
                        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
                    );
                }
            }else {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Location",
                        message: "Allow GPS",
                        buttonNeutral: "Ask Me Later",
                        buttonNegative: "Cancel",
                        buttonPositive: "OK"
                    }
                );
            }
        } catch (err) {
            console.warn(err)
        }
    }


    const navigateSetting =  async (navigation, screen) => {
        if(screen == "Home"){
            // navigation.navigate("Login")
            location_gps();
           console.log("Location",isLocation);
        }else{
            console.log("Check fake location");
        }
    }

    const Item = ({ title, icon, navi, screen }) => (
        <TouchableOpacity
            onPress={() => { navigateSetting(navi, screen) }}
            style={styles.itemList}>
            <View style={styles.iconLeft}>
                <Icon name={icon} size={22} color="#0A7FD9" />
            </View>
            <Text style={styles.title}>{title}</Text>
        </TouchableOpacity>
    );

    function deleteKeys(){
        ReactNativeBiometrics.deleteKeys()
        .then(() => {
            setFingerExist(false)
        })
    }
    const logout = async () =>{
        removeToken()
        try {
            const accessToken = await AsyncStorage.getItem('TOKEN_ACCESS');
            const response = await fetch(API.LOGOUT, {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken
              },
              body: null
            });
           const json = await response.json();
        } catch (error) {
            console.error(error);
        }
        navigation.reset({
            index: 1,
            routes: [{ name: 'Login' }],
        })
    }

    const removeToken = async () => {
        try {
          await AsyncStorage.removeItem('TOKEN_ACCESS')
        } catch(e) {
          console.log(e)
        }
        deleteKeys()
    }

    function renderUser() {
        return (
            <View style={styles.infoUser}>
                <Icon name="user-circle" size={22} color="white" />
                <Text style={styles.infoUserText}>Van Quy</Text>
            </View>
        );
    }

    const renderItem = ({ item }) => (
        <Item title={item.title} icon={item.icon} navi={navigation} screen={item.screen} />
    );

    const listSettings = () => {
        return (
            <SafeAreaView style={styles.container}>
                <FlatList
                    scrollEnabled={false}
                    data={menu}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                />
            </SafeAreaView>
        );
    }

    const setting_finger = ()=>{
        navigation.navigate("Finger")
    }

    return (
        <View>
            <View style={styles.container}>
                <View style={styles.backgroundBorder} />
                <View style={styles.contentGroup}>
                    <Text style={styles.headerTitle}>Cài đặt</Text>
                    {renderUser()}
                    <View style={styles.contentForm}>
                        {listSettings()}
                        <TouchableOpacity
                            onPress={setting_finger}
                            style={styles.itemList}>
                            <View style={styles.iconLeft}>
                                <Icon name="500px" size={22} color="#0A7FD9" />
                            </View>
                            <Text style={styles.title}>Thiết lập vân tay</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={logout}
                            style={styles.itemList}>
                            <View style={styles.iconLeft}>
                                <Icon name="sign-out" size={22} color="#0A7FD9" />
                            </View>
                            <Text style={styles.title}>Đăng xuất</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
    },
    backgroundBorder: {
        position: 'absolute',
        backgroundColor: '#0A7FD9',
        top: 0,
        left: 0,
        height: (Dimensions.get('window').height * 0.3),
        width: '100%',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    contentGroup: {
        marginHorizontal: 20,
        marginTop: 10,
    },
    headerTitle: {
        fontSize: 25,
        color: 'white',
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    infoUser: {
        flexDirection: 'row',
        color: 'white',
        alignItems: 'center',
        marginTop: 5
    },
    infoUserText: {
        fontWeight: '500',
        color: '#FFF',
        marginLeft: 10
    },
    contentForm: {
        marginTop: 20,
        borderRadius: 20,
        backgroundColor: 'white',
    },
    itemList: {
        paddingHorizontal: 10,
        paddingVertical: 15,
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#EFF1F5',
        borderBottomWidth: 1,

    },
    iconLeft: {
        borderRadius: 100,
        padding: 10,
        backgroundColor: '#F4F5F9',
        marginRight: 10
    },
    title: {
        fontSize: 16,
        fontWeight: '500'
    },
})
