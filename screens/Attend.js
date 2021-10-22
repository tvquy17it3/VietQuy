import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, SafeAreaView, Alert, View, FlatList, Dimensions } from 'react-native';
import * as API from '../components/api';
import Detector from '../components/Detector';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NOTICE from '../components/notices';
import OrientationLoadingOverlay from 'react-native-orientation-loading-overlay';
import Moment from 'moment';

const api_key = 'YOUR FACE DETECTION API KEY';

const Item = ({ check_in, check_out, hours, status, shifts }) => (
  <View style={styles.item}>
    <View style={styles.wrap_item}>
      <Text style={styles.title}>Check In: {Moment(check_in).format('H:mma')}</Text>
      {status ?
        <View>
          <Text style={styles.title}>Check Out: {Moment(check_out).format('H:mma')}</Text>
          <Text style={styles.title}>Ca {shifts}, Thời gian làm: {hours} tiếng</Text>
        </View> : <Text style={styles.title}>Chưa Check Out</Text>
      }
    </View>
  </View>
);

export default function Attend({ navigation })  {
  const [timesheets, setTimesheets] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [isData, setData] = useState(false);

  const loadData = async () => {
    try {
        setLoading(true);
        const timesheetsList = [];
        const accessToken = await AsyncStorage.getItem('TOKEN_ACCESS');
        const response = await fetch(API.TIMESHEET_TODAY, {
            headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            },
        });
        const json = await response.json();
        if(json.status_code == 200 && json.data.length > 0){
          setTimesheets(json.data);
          setData(true);
        }else{
          setTimesheets([]);
        }
    } catch (error) {
        setTimesheets([]);
        Alert.alert(NOTICE.HAS_ERROR);
        console.log(error)
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // console.log(timesheets);
  }, [])

  const renderItem = ({ item }) => (
    <Item
      check_in={item.check_in }
      check_out={item.check_out}
      hours={item.hour}
      status= {item.status}
      shifts = {item.shifts.name}
    />
  );

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
      <Text style={styles.today}>Hôm nay</Text>
      {isData ?
        <SafeAreaView style={styles.timesheet}>
            <FlatList
              data={timesheets}
              renderItem={renderItem}
              keyExtractor={item => item.id}
            />
        </SafeAreaView>
        : <View style={styles.timesheet}>
            <Text style={styles.no_data}>Không có dữ liệu hôm nay</Text>
          </View>
      }
      <Detector navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  item: {
    backgroundColor: 'white',
    padding: 0,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',

    shadowColor: '#2951ae',
    shadowOpacity: 0.26,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 30,
    elevation: 10,
  },
  title: {
    fontSize: 16,
    color: '#0A7FD9',
  },
  timesheet:{
    // height: (Dimensions.get('window').height * 0.2),
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  today:{
    fontSize: 25,
    marginTop: 10,
    marginBottom:20,
  },
  wrap_item:{
    margin: 15,
  },
  no_data: {
    fontSize:20,
    margin: 10,
    color: "red",
  }
});
