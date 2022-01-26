import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, Dimensions, Modal, Button, Alert, TouchableHighlight} from 'react-native';
import * as ImagePicker from "react-native-image-picker"
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions';
import * as API from '../components/api';
import * as NOTICE from '../components/notices';
import OrientationLoadingOverlay from 'react-native-orientation-loading-overlay';
import NetworkUtils from '../components/NetworkUtills'
import AsyncStorage from '@react-native-async-storage/async-storage';
import publicIP from 'react-native-public-ip';
import Geolocation from 'react-native-geolocation-service';
import RNMockLocationDetector from "react-native-mock-location-detector";
// import { PermissionsAndroid } from 'react-native';


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

export default function Detector({navigation}){
  const [fileData, setFileData] = useState(null);
	const [getResponse, setResponse] = useState(null);
  const [cameraGranted, setCameraGranted] = useState(false);
	const [gpsGranted, setGpsGranted] = useState(false);
	const [isLoading, setLoading] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [isIP, setIp] = useState("");
	const [isLocation, setLocation] = useState('');
	const [isGeolocation, setGeolocation] = useState('');

	const handleCameraPermission = async () => {
		const res = await check(PERMISSIONS.ANDROID.CAMERA);
		if (res === RESULTS.GRANTED) {
			setCameraGranted(true);
		} else if (res === RESULTS.DENIED) {
			const res2 = await request(PERMISSIONS.ANDROID.CAMERA);
			res2 === RESULTS.GRANTED ? setCameraGranted(true) : setCameraGranted(false);
		}
	};

	// ====================LOAD GEOLOCATION================================
	const loadGeolocation = async () => {
		try {
				setLoading(true);
				const response = await fetch(API.GEOLOCATION, {
						headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
						},
				});
				const json = await response.json();
				if(json.status_code == 200 && json.latitude){
					setGeolocation({latitude: json.latitude,longitude: json.longitude});
				}else{
					console.log("null");
					Alert.alert(NOTICE.NOTICE_POPUP, NOTICE.HAS_ERROR);
				}
		} catch (error) {
				Alert.alert(NOTICE.NOTICE_POPUP, NOTICE.HAS_ERROR);
				console.log(error)
		} finally {
				setLoading(false);
		}
	}

	// ====================GPS================================

	const location_gps =  async () => {
		try {
				const granted = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
				if (granted === RESULTS.GRANTED) {
					const isLocationMocked = await RNMockLocationDetector.checkMockLocationProvider();
					if (isLocationMocked) {
							Alert.alert(NOTICE.NOTICE_POPUP, NOTICE.FAKE_LOCATION);
							console.log("Fake loction");
							return;
					}else{
							setGpsGranted(true);
							Geolocation.getCurrentPosition((position) => {
									var latitude = position.coords.latitude;
									var longitude = position.coords.longitude;
									var distance = computeDistance([isGeolocation.latitude,isGeolocation.longitude],[latitude,longitude]);
									setLocation({
										"accuracy": roundToTwo(position.coords.accuracy),
										"latitude": latitude,
										"longitude": longitude,
										"distance" : Math.floor(distance),
									});
							},(error) => {
									console.log(error.code, error.message);
							},
									{ enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
							);
					}
				}else {
					// Alert.alert(NOTICE.NOTICE_POPUP, NOTICE.GPS_PERMISSION);
					const res = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
					res === RESULTS.GRANTED ? setGpsGranted(true) : setGpsGranted(false);
				}
		} catch (err) {
			console.warn(err)
		}
	}

	// ====================================================

	useEffect(() => {
		loadGeolocation();
		handleCameraPermission();
		publicIP()
		.then(ip => {
			setIp(ip);
		})
		.catch(error => {
			console.log(error);
		});

	}, []);

// ========================= OPEN CAMERA===========================
  const takePicture = async (shifts) => {
    let options = {
			quality: 1.0,
			maxWidth: 500,
			maxHeight: 500,
			cameraType: 'front',
			includeBase64: true,
			storageOptions: {
				skipBackup: true
			}
    };

    await ImagePicker.launchCamera(options, (response) => {
			if (response.error) {
				console.log('ImagePicker Error: ', response.error);
			} else if (response.didCancel == true) {
				setFileData(null);
			} else {
				setFileData(response.assets[0].uri)
				const source = {image: response.assets[0].base64}
				console.log(isIP);
				detectFaces(shifts, source);
			}
		});
	};

	const select_shifts = async (shifts) => {
		setShowModal(!showModal);
		takePicture(shifts);
	}

	const open_model = async () => {
			if(gpsGranted){
				location_gps();
				setShowModal(!showModal);
			}else{
				location_gps();
			}
	}


// ============================ DETECT FACE========================
  const detectFaces = async (shifts, source) => {
		try {
				setLoading(true);
				const response = await fetch(API.DETECT_FACE, {
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(source)
				});

				const json = await response.json();
				if(json.data == true ){
					setResponse("Ca: "+ shifts+ ", " + json.confidence+ ", ID: " + json.detected_id);
					const employeeid = await AsyncStorage.getItem('EMPLOYEE_ID');
					if(employeeid == json.detected_id){
						save_timesheets(shifts,json.confidence, "data:image/jpeg;base64,"+source.image);
					}else{
						setResponse(NOTICE.FAIL_FACE);
					}
				}else{
					setResponse(NOTICE.NOT_DETECT);
				}

				return true;
		} catch (error) {
			setResponse(error.message);
			Alert.alert(NOTICE.NOTICE_POPUP, NOTICE.HAS_ERROR);
		} finally {
			setLoading(false);
		}
  };

  const renderFileData = () => {
    if (fileData) {
      return <Image source={{ uri: fileData }} />
    }
  }

// ==========================SAVE==========================
	const save_timesheets = async (shifts, conf = 0, source) => {
		const isConnected = await NetworkUtils.isNetworkAvailable()
		console.log(isConnected);

		if(isConnected && isLocation){
				try {
						setLoading(true);
						const accessToken = await AsyncStorage.getItem('TOKEN_ACCESS');
						const response = await fetch(API.SAVE_TIMESHEET, {
								method: 'POST',
								headers: {
										Accept: 'application/json',
										'Content-Type': 'application/json',
										Authorization: `Bearer ${accessToken}`,
								},
								body: JSON.stringify({
									shift_id: shifts,
									image: source,
									confidence: conf,
									ip_address: isIP,
									latitude: isLocation.latitude,
									longitude: isLocation.longitude,
									distance: isLocation.distance,
									accuracy: isLocation.accuracy,
								})
						});
						const json = await response.json();
						if(json.status){
							Alert.alert(NOTICE.NOTICE_POPUP, json.message);
							reset();
						}else{
							Alert.alert(NOTICE.NOTICE_POPUP, json.message);
						}
				} catch (error) {
					setResponse(error.message);
					Alert.alert(NOTICE.NOTICE_POPUP, NOTICE.HAS_ERROR);
				} finally {
						setLoading(false);
				}
		}else{
			location_gps();
			Alert.alert(NOTICE.NOTICE_POPUP, NOTICE.CONNECT_INTERNET);
		}
	}

	const reset = () =>{
		navigation.reset({
			index: 1,
			routes: [{ name: 'Main' }],
		})
	}

	const renderDetectFacesButton = () =>{
    return (
			<View>
				<TouchableHighlight underlayColor={"#E8E8E8"} onPress={open_model} style={styles.button}>
					<View>
							<Text style={styles.button_text}>{NOTICE.ATTENDANCE}</Text>
					</View>
				</TouchableHighlight>
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
		{fileData ? <Image
					style={styles.photo_style}
					source={{ uri: fileData }}
					resizeMode={"contain"}>
					</Image>
			: null
		}
		<View style={styles.ImageSections}>
			<View>
				{renderFileData()}
				<Text style={{textAlign:'center', margin:10, color: "red"}}>{getResponse}</Text>
			</View>
		</View>
		{cameraGranted
			? renderDetectFacesButton()
			: <Text>{NOTICE.CAMERA_DISALLOWD}</Text>
		}
			<Modal
				style={styles.modal_pop}
				animationType={'slide'}
				transparent={false}
				visible={showModal}
				onRequestClose={() => {
					console.log('Modal has been closed.');
				}}>
				<View style={styles.close}>
					<TouchableHighlight onPress={() => {setShowModal(!showModal);}} style={styles.button_close}>
						<View>
								<Text style={styles.button_text}>X</Text>
						</View>

					</TouchableHighlight>
				</View>
				<View style={styles.modal}>
					<Text style={styles.text}>Chọn ca làm việc</Text>
					<View style={styles.shifts}>
						<View style={styles.view_shifts}>
						<TouchableHighlight underlayColor={"#E8E8E8"} onPress={() => {select_shifts(1);}} style={styles.button}>
							<View>
									<Text style={styles.button_text}>Ca sáng</Text>
							</View>
						</TouchableHighlight>
						</View>
						<View style={styles.view_shifts}>
							<TouchableHighlight underlayColor={"#E8E8E8"}onPress={() => {select_shifts(2);}} style={styles.button}>
								<View>
										<Text style={styles.button_text}>Ca chiều</Text>
								</View>
							</TouchableHighlight>
						</View>
					</View>
				</View>
			</Modal>
    </View>
  );
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		alignSelf: 'center',
		// backgroundColor: '#ccc'
	},
	button: {
		width: "95%",
		height: 40,
		borderRadius: 15,
		alignItems: "center",
		backgroundColor: "#0A7FD9",
		justifyContent: "center",
	},
	button_close:{
		width: 50,
		height: 30,
		borderRadius: 5,
		alignItems: "center",
		backgroundColor: "#ff4d4d",
		justifyContent: "center",
	},
	button_text: {
		color: "#fff",
		fontSize: 18,
		padding: 2,
		marginLeft: 15,
		marginRight: 15,
	},
	images: {
		height: (Dimensions.get('window').height * 0.02),
		borderColor: 'black',
		borderWidth: 1,
		marginHorizontal: 3,
	},
  text: {
    color: '#3f2949',
    marginTop: 10,
		fontSize: 20,
  },
	modal_pop: {
		height: 200,
	},
	photo_style:{
		position: 'relative',
		width: 600,
		height: 300,
		marginTop:30
	},
	modal: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 100,
		flexDirection: 'column',
		justifyContent: 'center',
  },
	shifts:{
		flexDirection: 'row',
		marginTop:15,
	},
	view_shifts:{
		height: 50,
		width: 150,
		margin:5,
	},
	close:{
		flexDirection: 'row',
		justifyContent: 'flex-end',
		margin:5,
	}
});
