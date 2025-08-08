import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, TextInput, Modal, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import type { LocationObject } from 'expo-location';

// Firebase imports (you'll need to install firebase)
// import { initializeApp } from 'firebase/app';
// import { getFirestore, collection, doc, setDoc, onSnapshot, query, where } from 'firebase/firestore';

// Types for our location sharing
interface UserLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  color: string;
}

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export default function LocationScreen() {
  // Current user's location
  const [location, setLocation] = useState<LocationObject | null>(null);

  // Map-related states
  const [mapRegion, setMapRegion] = useState<MapRegion | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  
  // Multi-device location sharing states
  const [groupCode, setGroupCode] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [isInGroup, setIsInGroup] = useState<boolean>(false);
  const [groupMembers, setGroupMembers] = useState<UserLocation[]>([]);
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
  
  // Location tracking
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  
  // User colors for different group members
  const userColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

  // Initialize location and permissions
  useEffect(() => {
    initializeLocation();
    return () => {
      // Cleanup location subscription when component unmounts
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const initializeLocation = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
        return;
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setLocation(currentLocation);
      
      // Set initial map region centered on user's location
      setMapRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01, // Zoom level (smaller = more zoomed in)
        longitudeDelta: 0.01,
      });

    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location. Please try again.');
    }
  };

  const startLocationTracking = async () => {
    try {
      // Start watching location changes for real-time updates
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Update when moved 10 meters
        },
        (newLocation) => {
          setLocation(newLocation);
          // Update map region to follow user
          setMapRegion({
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          
          // If in a group, update location in database
          if (isInGroup && groupCode && userName) {
            updateLocationInGroup(newLocation);
          }
        }
      );
      setIsTracking(true);
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setIsTracking(false);
  };

  // For prototype: Simple local storage simulation of group locations
  const updateLocationInGroup = (currentLocation: LocationObject) => {
    // In a real app, this would update Firebase/database
    // For now, we'll simulate with local state
    console.log(`Updating ${userName}'s location:`, {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
      timestamp: Date.now()
    });
    
    // TODO: Replace with actual Firebase/database update
    // Example Firebase code:
    // const userLocationRef = doc(db, 'groups', groupCode, 'members', userName);
    // await setDoc(userLocationRef, {
    //   latitude: currentLocation.coords.latitude,
    //   longitude: currentLocation.coords.longitude,
    //   timestamp: Date.now(),
    //   name: userName
    // });
  };

  const joinGroup = () => {
    if (!groupCode.trim() || !userName.trim()) {
      Alert.alert('Error', 'Please enter both group code and your name.');
      return;
    }
    
    setIsInGroup(true);
    setShowJoinModal(false);
    
    // Start location tracking when joining group
    if (!isTracking) {
      startLocationTracking();
    }
    
    // Simulate adding some group members for demo
    // In real app, this would listen to Firebase for other group members
    simulateGroupMembers();
    
    Alert.alert('Success', `Joined group "${groupCode}" as ${userName}!`);
  };

  // Simulate other group members for prototype demo
  const simulateGroupMembers = () => {
    if (!location) return;
    
    const demoMembers: UserLocation[] = [
      {
        id: 'demo1',
        name: 'Alice',
        latitude: location.coords.latitude + 0.001, // Slightly north
        longitude: location.coords.longitude + 0.001, // Slightly east
        timestamp: Date.now(),
        color: userColors[1]
      },
      {
        id: 'demo2',
        name: 'Bob',
        latitude: location.coords.latitude - 0.001, // Slightly south
        longitude: location.coords.longitude + 0.002, // More east
        timestamp: Date.now(),
        color: userColors[2]
      }
    ];
    
    setGroupMembers(demoMembers);
  };

  const leaveGroup = () => {
    setIsInGroup(false);
    setGroupCode('');
    setUserName('');
    setGroupMembers([]);
    stopLocationTracking();
    Alert.alert('Left Group', 'You have left the hiking group.');
  };

  const toggleMapType = () => {
    const types: ('standard' | 'satellite' | 'hybrid')[] = ['standard', 'satellite', 'hybrid'];
    const currentIndex = types.indexOf(mapType);
    const nextIndex = (currentIndex + 1) % types.length;
    setMapType(types[nextIndex]);
  };

  if (!location || !mapRegion) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Getting your location...</Text>
        <Text style={styles.subText}>Make sure location permissions are enabled</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        style={styles.map}
        region={mapRegion}
        mapType={mapType}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={isTracking}
        onRegionChangeComplete={setMapRegion}
      >
        {/* Current user marker */}
        <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          title="You are here"
          description={`${userName || 'Your location'}`}
          pinColor={userColors[0]}
        />
        
        {/* Group members markers */}
        {groupMembers.map((member) => (
          <Marker
            key={member.id}
            coordinate={{
              latitude: member.latitude,
              longitude: member.longitude,
            }}
            title={member.name}
            description={`Last updated: ${new Date(member.timestamp).toLocaleTimeString()}`}
            pinColor={member.color}
          />
        ))}
      </MapView>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        {/* Location Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.coordText}>
            📍 {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
          </Text>
          <Text style={styles.accuracyText}>
            Accuracy: ±{location.coords.accuracy?.toFixed(0)}m
          </Text>
        </View>

        {/* Group Status */}
        {isInGroup ? (
          <View style={styles.groupContainer}>
            <Text style={styles.groupText}>
              👥 Group: {groupCode} | You: {userName}
            </Text>
            <Text style={styles.membersText}>
              Members online: {groupMembers.length + 1}
            </Text>
            <TouchableOpacity style={styles.leaveButton} onPress={leaveGroup}>
              <Text style={styles.buttonText}>Leave Group</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.joinButton} 
            onPress={() => setShowJoinModal(true)}
          >
            <Text style={styles.buttonText}>Join Hiking Group</Text>
          </TouchableOpacity>
        )}

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.mapTypeButton} onPress={toggleMapType}>
            <Text style={styles.mapTypeText}>
              Map: {mapType.charAt(0).toUpperCase() + mapType.slice(1)}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.trackingButton, isTracking && styles.trackingActive]} 
            onPress={isTracking ? stopLocationTracking : startLocationTracking}
          >
            <Text style={styles.buttonText}>
              {isTracking ? '⏹ Stop Tracking' : '▶ Start Tracking'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Join Group Modal */}
      <Modal visible={showJoinModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join Hiking Group</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Enter group code (e.g., HIKE123)"
              value={groupCode}
              onChangeText={setGroupCode}
              autoCapitalize="characters"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              value={userName}
              onChangeText={setUserName}
              autoCapitalize="words"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowJoinModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.confirmButton} onPress={joinGroup}>
                <Text style={styles.buttonText}>Join Group</Text>
              </TouchableOpacity>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  map: {
    flex: 1,
  },
  controlPanel: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoContainer: {
    marginBottom: 10,
  },
  coordText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  accuracyText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  groupContainer: {
    marginVertical: 10,
  },
  groupText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  membersText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  joinButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 5,
  },
  leaveButton: {
    backgroundColor: '#f44336',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  mapControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  mapTypeButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 6,
    flex: 0.48,
    alignItems: 'center',
  },
  mapTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  trackingButton: {
    backgroundColor: '#FF9800',
    padding: 8,
    borderRadius: 6,
    flex: 0.48,
    alignItems: 'center',
  },
  trackingActive: {
    backgroundColor: '#4CAF50',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#757575',
    padding: 12,
    borderRadius: 8,
    flex: 0.45,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    flex: 0.45,
    alignItems: 'center',
  },
});