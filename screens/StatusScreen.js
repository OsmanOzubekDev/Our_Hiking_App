import React from 'react';
import { View, Text, StyleSheet, Image, Button } from 'react-native';

const StatusScreen = ({ route, navigation }) => {
  const { location, image, status } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check-In Summary</Text>

      <Text style={styles.label}>📍 Location:</Text>
      <Text style={styles.info}>
        {location
          ? `Latitude: ${location.latitude.toFixed(4)}\nLongitude: ${location.longitude.toFixed(4)}`
          : 'Location not available.'}
      </Text>

      <Text style={styles.label}>📷 Photo:</Text>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : (
        <Text style={styles.info}>No photo provided.</Text>
      )}

      <Text style={styles.label}>🔽 Status:</Text>
      <Text style={styles.info}>{status}</Text>

      <View style={{ marginTop: 30 }}>
        <Button
          title="⬅ Back to Home"
          onPress={() => navigation.navigate('Home')}
          color="#1e90ff"
        />
      </View>
    </View>
  );
};

export default StatusScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginTop: 20,
    fontWeight: '600',
  },
  info: {
    fontSize: 14,
    color: '#444',
    marginTop: 6,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    marginTop: 10,
  },
});
