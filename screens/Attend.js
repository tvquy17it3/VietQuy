import React, { Component } from "react";
import { Text, View, StyleSheet,  SafeAreaView, ScrollView } from 'react-native';

export default function Attend() {
  return (
    <SafeAreaView style={styles.wrapAll}>
        <ScrollView>
            <View>
                <Text>Attend</Text>
                <Text>Attend</Text>
                <Text>Attend</Text>
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
