import React, { Component } from "react";
import { Text, View, StyleSheet,  SafeAreaView, ScrollView } from 'react-native';

// StatusBar.setHidden(true);StatusBar,

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.wrapAll}>
        <ScrollView>
            <View>
                <Text>QR Travel</Text>
            </View>
        </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
    wrapAll: {
        backgroundColor: "#FFF"
    },
});
