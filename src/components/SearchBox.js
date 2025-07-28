import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { color } from '../styles/theme';

const SearchBox = () => {
  return (
    <View style={styles.searchBox}>
     <FontAwesome name="search" size={20} color={color.secondary} marginRight={8} />
      <TextInput
        placeholder="Search"
        style={{ flex: 1 }}
        placeholderTextColor="#777"
      />
    </View>
  );
};

export default SearchBox;

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 55,
    marginTop: 10,
  },
});
