import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet,  SafeAreaView, Alert, FlatList, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// StatusBar.setHidden(true);StatusBar,
import OrientationLoadingOverlay from 'react-native-orientation-loading-overlay';
import Moment from 'moment';
import * as NOTICE from '../components/notices';
import * as API from '../components/api';


const Item = ({ id, check_in, check_out, hours, status, shifts }) => (
    <View style={styles.item}>
      <View style={styles.wrap_item}>
        {/* <Text style={styles.title}>{id}</Text> */}
        <Text style={styles.day_checkin}>Ngày {Moment(check_in).format('DD/MM/YYYY')}</Text>
        <View style={{flexDirection: "row"}}>
            <Text style={styles.title}>Check In:</Text>
            <Text style={styles.data}>   {Moment(check_in).format('H:mma')}</Text>
        </View>

        {status ?
          <View>
            <View style={{flexDirection: "row"}}>
                <Text style={styles.title}>Check Out:</Text>
                <Text style={styles.data}>{Moment(check_out).format('H:mma')}</Text>
            </View>
            <Text style={styles.title}>Ca {shifts}, Thời gian làm: {hours} tiếng</Text>
          </View> : <Text style={styles.title}>Chưa Check Out</Text>
        }
      </View>
    </View>
  );

export default function HomeScreen({ navigation }) {
    const [timesheets, setTimesheets] = useState([]);
    const [isLoading, setLoading] = useState(false);
    const [isData, setData] = useState(false);
    const [isRefresh, setRefresh] = useState(false);
    const [isPage, setPage] = useState(1);

    const loadData = async (refresh=false) => {
        try {
            setLoading(true);
            if(refresh){
                // console.log("load data");
                setPage(1);
                setTimesheets([]);
            }
            const accessToken = await AsyncStorage.getItem('TOKEN_ACCESS');
            const response = await fetch(API.SHOW_TIMESHEETS+isPage, {
                headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
                },
            });
            const json = await response.json();
            if(json.status_code == 200 && json.data.data.length > 0){
                setTimesheets([...timesheets, ...json.data.data]);
                setData(true);
                setPage(isPage+1);
            }else{
              console.log("null");
            }
        } catch (error) {
            setTimesheets([]);
            Alert.alert(NOTICE.HAS_ERROR);
            console.log(error)
        } finally {
            setRefresh(false);
            setLoading(false);
        }
      }

      useEffect(() => {
        loadData();
      }, [])

    const renderItem = ({ item }) => (
        <Item
            id = {item.id}
            check_in={item.check_in }
            check_out={item.check_out}
            hours={item.hour}
            status= {item.status}
            shifts = {item.shifts.name}
        />
    );

    const handleRefresh = () => {
        loadData(true);
    }

    const handleLoadmore = () =>{
        console.log("load more");
        loadData();
    }

    const renderFooter = () =>{
        return (
            <View style={styles.footer}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={handleLoadmore}
                    style={styles.loadMoreBtn}>
                    <Text style={styles.btnText}>Xem thêm</Text>
                    {isLoading ? (
                        <ActivityIndicator
                        color="white"
                        style={{marginLeft: 8}} />
                    ) : null}
                </TouchableOpacity>
            </View>
        );
    }

  return (
    <SafeAreaView style={styles.wrapAll}>
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
            <Text style={styles.today}>Lịch sử</Text>
            {isData ?
                <SafeAreaView style={styles.timesheet}>
                    <FlatList
                        data={timesheets}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        refreshing = {isRefresh}
                        onRefresh = {handleRefresh}
                        ListFooterComponent = {renderFooter}
                    />
                </SafeAreaView>
                : <View style={styles.timesheet}>
                    <Text style={styles.no_data}>Không có dữ liệu</Text>
                </View>
            }
        </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
    wrapAll: {
        backgroundColor: "#FFF",
        height: '100%',
    },
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
        height: '100%'
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
    data: {
        fontSize: 14,
        color: '#2C3E50',
        marginLeft: 5
    },

    title: {
        fontSize: 14,
        color: '#34495E',
        fontWeight: 'bold',
    },
    day_checkin: {
        color: '#0A7FD9',
        fontFamily: 'fontFamily-bold',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 2
    },
    timesheet:{
        height: (Dimensions.get('window').height * 0.93),
        width: '100%',
        backgroundColor: '#FFFFFF',
    },
    today:{
        fontSize: 25,
        marginBottom:20,
    },
    wrap_item:{
        margin: 15,
    },
    no_data: {
        fontSize:20,
        margin: 10,
        color: "red",
    },
    full_data:{
        fontSize: 10,
        color: "red",
        textAlign: 'center',
        marginBottom: 2,
    },
    footer: {
        padding: 5,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
      },
    loadMoreBtn: {
        padding: 5,
        backgroundColor: 'blue',
        borderRadius: 4,
        marginBottom:8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
    },
});

//https://aboutreact.com/react-native-flatlist-pagination-to-load-more-data-dynamically-infinite-list/
