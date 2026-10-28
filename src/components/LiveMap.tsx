import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Circle, Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import {
  ChevronDown,
  ChevronUp,
  Crosshair,
  LocateFixed,
  Navigation2,
  Plus,
  Search,
  X,
} from 'lucide-react-native';

interface FleetVehicle {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface NearbyMechanic {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface RouteStep {
  id: string;
  instruction: string;
  maneuver: string;
  distanceMeters?: number;
}

interface LatLng {
  latitude: number;
  longitude: number;
}

interface LiveMapProps {
  userRole: 'customer' | 'driver' | 'fleet_owner' | 'mechanic';
  targetLocation?: LatLng | null;
  fleetVehiclesArray?: FleetVehicle[];
  nearbyMechanics?: NearbyMechanic[];
  currentLocation?: LatLng;
  height?: number;
  fullBleed?: boolean;
}

const DEFAULT_REGION = {
  latitude: 23.8103,
  longitude: 90.4125,
  latitudeDelta: 0.015,
  longitudeDelta: 0.012,
};

const GOOGLE_MAPS_API_KEY =
  Constants.expoConfig?.android?.config?.googleMaps?.apiKey || '';

function decodePolyline(encoded: string): LatLng[] {
  const coordinates: LatLng[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    latitude += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    longitude += deltaLng;

    coordinates.push({
      latitude: latitude / 1e5,
      longitude: longitude / 1e5,
    });
  }

  return coordinates;
}

function cleanHtmlText(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function formatDistance(meters?: number): string {
  if (!meters && meters !== 0) return '';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)} km`;
}

function formatDuration(duration?: string): string {
  if (!duration) return '';
  const seconds = Number(String(duration).replace('s', ''));
  if (!Number.isFinite(seconds)) return '';
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours} hr ${remaining} min` : `${hours} hr`;
}

export default function LiveMap({
  userRole,
  targetLocation,
  fleetVehiclesArray,
  nearbyMechanics,
  currentLocation: propCurrentLocation,
  height = 300,
  fullBleed = false,
}: LiveMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const searchInputRef = useRef<TextInput | null>(null);

  const [internalCurrentLocation, setInternalCurrentLocation] = useState<LatLng | null>(
    propCurrentLocation || null
  );
  const [mapRegion, setMapRegion] = useState({
    latitude: propCurrentLocation?.latitude || DEFAULT_REGION.latitude,
    longitude: propCurrentLocation?.longitude || DEFAULT_REGION.longitude,
    latitudeDelta: DEFAULT_REGION.latitudeDelta,
    longitudeDelta: DEFAULT_REGION.longitudeDelta,
  });

  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [destination, setDestination] = useState<LatLng | null>(targetLocation || null);
  const [destinationLabel, setDestinationLabel] = useState(targetLocation ? 'Mechanic' : '');

  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);
  const [routeDistanceMeters, setRouteDistanceMeters] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<string>('');
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeAvailable, setRouteAvailable] = useState(false);
  const [directionsOpen, setDirectionsOpen] = useState(false);

  const currentLoc = useMemo<LatLng>(
    () =>
      internalCurrentLocation ||
      propCurrentLocation || {
        latitude: DEFAULT_REGION.latitude,
        longitude: DEFAULT_REGION.longitude,
      },
    [internalCurrentLocation, propCurrentLocation]
  );

  useEffect(() => {
    if (!propCurrentLocation) return;

    setInternalCurrentLocation(propCurrentLocation);
    setMapRegion(prev => ({
      ...prev,
      latitude: propCurrentLocation.latitude,
      longitude: propCurrentLocation.longitude,
    }));
  }, [propCurrentLocation?.latitude, propCurrentLocation?.longitude]);

  useEffect(() => {
    let mounted = true;

    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || !mounted) return;

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!mounted) return;

        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        if (!propCurrentLocation) {
          setInternalCurrentLocation(coords);
          setMapRegion(prev => ({ ...prev, ...coords }));
        }
      } catch (error) {
        console.log('Map location:', error);
      }
    };

    getLocation();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setDestination(targetLocation || null);
    setDestinationLabel(targetLocation ? 'Mechanic' : '');
  }, [targetLocation?.latitude, targetLocation?.longitude]);

  const fitRoute = (coords: LatLng[]) => {
    if (!mapRef.current || coords.length < 2) return;

    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 95, right: 55, bottom: 155, left: 55 },
      animated: true,
    });
  };

  const loadRoute = async (to: LatLng, label?: string) => {
    if (!GOOGLE_MAPS_API_KEY) {
      setRouteAvailable(false);
      setRouteCoordinates([currentLoc, to]);
      setRouteSteps([]);
      fitRoute([currentLoc, to]);
      Alert.alert(
        'Google route unavailable',
        'Enable the Google Routes API for this Maps key to show road-by-road directions.'
      );
      return;
    }

    setRouteLoading(true);
    setRouteAvailable(false);

    try {
      const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask':
            'routes.distanceMeters,routes.duration,routes.polyline,routes.legs.steps.polyline,routes.legs.steps.navigationInstruction,routes.legs.steps.localizedValues',
        },
        body: JSON.stringify({
          origin: {
            location: {
              latLng: {
                latitude: currentLoc.latitude,
                longitude: currentLoc.longitude,
              },
            },
          },
          destination: {
            location: {
              latLng: {
                latitude: to.latitude,
                longitude: to.longitude,
              },
            },
          },
          travelMode: 'DRIVE',
          polylineQuality: 'HIGH_QUALITY',
          polylineEncoding: 'ENCODED_POLYLINE',
        }),
      });

      const json = await response.json();
      if (!response.ok || !json?.routes?.length) {
        throw new Error(json?.error?.message || 'Route not found');
      }

      const route = json.routes[0];
      const decoded = route?.polyline?.encodedPolyline
        ? decodePolyline(route.polyline.encodedPolyline)
        : [];

      const steps: RouteStep[] = [];
      const legs = route?.legs || [];

      legs.forEach((leg: any, legIndex: number) => {
        (leg.steps || []).forEach((step: any, stepIndex: number) => {
          const instruction =
            step?.navigationInstruction?.instructions ||
            step?.localizedValues?.navigationInstruction?.text ||
            'Continue';

          steps.push({
            id: `${legIndex}-${stepIndex}`,
            instruction: cleanHtmlText(instruction),
            maneuver: step?.navigationInstruction?.maneuver || 'STRAIGHT',
            distanceMeters: step?.distanceMeters,
          });
        });
      });

      const finalCoords = decoded.length ? decoded : [currentLoc, to];
      setRouteCoordinates(finalCoords);
      setRouteSteps(steps);
      setRouteDistanceMeters(route?.distanceMeters ?? null);
      setRouteDuration(route?.duration || '');
      setRouteAvailable(decoded.length > 1);
      if (label) setDestinationLabel(label);
      fitRoute(finalCoords);
    } catch (error: any) {
      console.log('Google Routes error:', error);
      setRouteAvailable(false);
      setRouteCoordinates([currentLoc, to]);
      setRouteSteps([]);
      setRouteDistanceMeters(null);
      setRouteDuration('');
      fitRoute([currentLoc, to]);
      Alert.alert(
        'Route unavailable',
        'Google road directions could not be loaded right now. The map will keep the destination visible.'
      );
    } finally {
      setRouteLoading(false);
    }
  };

  useEffect(() => {
    if (!targetLocation) return;
    loadRoute(targetLocation, 'Mechanic');
    // We intentionally recalculate only when the target changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetLocation?.latitude, targetLocation?.longitude]);

  const handleSearch = async () => {
    const query = searchText.trim();
    if (!query) {
      searchInputRef.current?.focus();
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      Alert.alert(
        'Search unavailable',
        'Enable the Google Geocoding API for this Maps key to search places.'
      );
      return;
    }

    setSearching(true);

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        query
      )}&region=bd&language=en&key=${GOOGLE_MAPS_API_KEY}`;

      const response = await fetch(url);
      const json = await response.json();

      if (!response.ok || json?.status !== 'OK' || !json?.results?.length) {
        throw new Error(json?.error_message || 'Place not found');
      }

      const result = json.results[0];
      const coords = {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
      };

      setDestination(coords);
      setDestinationLabel(result.formatted_address || query);
      setDirectionsOpen(false);
      await loadRoute(coords, result.formatted_address || query);
      setSearchText('');
    } catch (error: any) {
      console.log('Google search error:', error);
      Alert.alert(
        'Place not found',
        'Search failed. Try a more specific place name or address.'
      );
    } finally {
      setSearching(false);
    }
  };

  const handleMyLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location permission', 'Allow location access to use My Location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setInternalCurrentLocation(coords);
      const nextRegion = {
        ...mapRegion,
        ...coords,
        latitudeDelta: 0.012,
        longitudeDelta: 0.01,
      };
      setMapRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 450);

      if (destination) {
        await loadRoute(destination, destinationLabel || 'Destination');
      }
    } catch (error) {
      console.log('My location:', error);
      Alert.alert('Location unavailable', 'Could not read your current GPS location.');
    }
  };

  const handleZoom = (isZoomIn: boolean) => {
    if (!mapRef.current) return;

    const next = {
      ...mapRegion,
      latitudeDelta: isZoomIn
        ? Math.max(mapRegion.latitudeDelta / 2, 0.001)
        : Math.min(mapRegion.latitudeDelta * 2, 4),
      longitudeDelta: isZoomIn
        ? Math.max(mapRegion.longitudeDelta / 2, 0.001)
        : Math.min(mapRegion.longitudeDelta * 2, 4),
    };

    setMapRegion(next);
    mapRef.current.animateToRegion(next, 350);
  };

  const handleDirections = async () => {
    if (!destination) {
      Alert.alert(
        'Choose a destination',
        'Search a place first or accept a mechanic to get directions.'
      );
      return;
    }

    if (routeCoordinates.length < 2 || !routeAvailable) {
      await loadRoute(destination, destinationLabel || 'Destination');
    }

    setDirectionsOpen(prev => !prev);
  };

  const routeDots = useMemo(() => {
    if (routeCoordinates.length < 3) return [];
    const targetDots = 28;
    const stride = Math.max(1, Math.floor(routeCoordinates.length / targetDots));
    return routeCoordinates.filter((_, index) => index % stride === 0).slice(0, 34);
  }, [routeCoordinates]);

  return (
    <View style={[styles.cardContainer, { height }, fullBleed && styles.fullBleed]}>
      <View style={[styles.mapWrapper, { minHeight: height }]}>
        <MapView
          ref={mapRef}
          style={styles.map}
          mapType="standard"
          initialRegion={mapRegion}
          onRegionChangeComplete={setMapRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
          loadingEnabled
          rotateEnabled
          pitchEnabled
        >
          <Marker
            coordinate={currentLoc}
            title="আপনার অবস্থান"
            pinColor="#1479FF"
          />

          {nearbyMechanics?.map(mechanic => (
            <Marker
              key={`mechanic-${mechanic.id}`}
              coordinate={{
                latitude: mechanic.latitude,
                longitude: mechanic.longitude,
              }}
              title={mechanic.name}
              description="Nearby mechanic"
              pinColor="#16A34A"
            />
          ))}

          {destination && (
            <Marker
              coordinate={destination}
              title={destinationLabel || 'Destination'}
              pinColor="#EA4335"
            />
          )}

          {routeCoordinates.length > 1 && (
            <>
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#2F80ED"
                strokeWidth={7}
                lineCap="round"
                lineJoin="round"
              />
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#FFFFFF"
                strokeWidth={2}
                lineDashPattern={[1, 10]}
                lineCap="round"
              />
              {routeDots.map((point, index) => (
                <Circle
                  key={`route-dot-${index}`}
                  center={point}
                  radius={3.5}
                  fillColor="#FFFFFF"
                  strokeColor="#2F80ED"
                  strokeWidth={1.5}
                />
              ))}
            </>
          )}

          {userRole === 'fleet_owner' &&
            fleetVehiclesArray?.map(vehicle => (
              <Marker
                key={`fleet-${vehicle.id}`}
                coordinate={{
                  latitude: vehicle.latitude,
                  longitude: vehicle.longitude,
                }}
                title={vehicle.name}
              >
                <Navigation2
                  size={25}
                  color="#16A34A"
                  style={{ transform: [{ rotate: '45deg' }] }}
                />
              </Marker>
            ))}
        </MapView>

        {/* Google Maps-like search bar */}
        <View style={styles.searchBarWrap}>
          <Search size={21} color="#5F6368" />
          <TextInput
            ref={searchInputRef}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={() => handleSearch()}
            placeholder="Search Google Maps"
            placeholderTextColor="#6B7280"
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="sentences"
          />
          {searchText.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchText('')}
              style={styles.searchAction}
              activeOpacity={0.8}
            >
              <X size={18} color="#6B7280" />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={handleSearch}
            style={styles.searchAction}
            activeOpacity={0.8}
            disabled={searching}
          >
            {searching ? (
              <ActivityIndicator size="small" color="#1479FF" />
            ) : (
              <Search size={20} color="#3C4043" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDirections}
            style={styles.searchDirectionsAction}
            activeOpacity={0.86}
            disabled={routeLoading}
          >
            {routeLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Navigation2 size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Map controls */}
        <View style={styles.rightControls}>
          <TouchableOpacity
            style={styles.roundMapButton}
            onPress={handleMyLocation}
            activeOpacity={0.85}
          >
            <LocateFixed size={21} color="#30343B" />
          </TouchableOpacity>

          <View style={styles.zoomGroup}>
            <TouchableOpacity
              style={styles.zoomButton}
              onPress={() => handleZoom(true)}
              activeOpacity={0.85}
            >
              <Plus size={22} color="#30343B" />
            </TouchableOpacity>
            <View style={styles.controlDivider} />
            <TouchableOpacity
              style={styles.zoomButton}
              onPress={() => handleZoom(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.minusText}>−</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Directions button */}
        <TouchableOpacity
          style={[styles.directionButton, routeLoading && styles.directionButtonLoading]}
          onPress={handleDirections}
          activeOpacity={0.88}
          disabled={routeLoading}
        >
          {routeLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Navigation2 size={20} color="#FFFFFF" />
          )}
          <Text style={styles.directionButtonText}>Directions</Text>
        </TouchableOpacity>

        {/* Route summary */}
        {destination && (routeDistanceMeters !== null || routeDuration) ? (
          <View style={styles.routeSummaryCard}>
            <View style={styles.routeSummaryTop}>
              <View style={styles.routeSummaryDot}>
                <Crosshair size={15} color="#1479FF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.routeSummaryTitle} numberOfLines={1}>
                  {destinationLabel || 'Destination'}
                </Text>
                <Text style={styles.routeSummaryMeta}>
                  {formatDistance(routeDistanceMeters ?? undefined)}
                  {routeDuration ? `  •  ${formatDuration(routeDuration)}` : ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setDirectionsOpen(prev => !prev)}
                style={styles.routeSummaryChevron}
                activeOpacity={0.8}
              >
                {directionsOpen ? (
                  <ChevronUp size={19} color="#4B5563" />
                ) : (
                  <ChevronDown size={19} color="#4B5563" />
                )}
              </TouchableOpacity>
            </View>

            {directionsOpen && routeSteps.length > 0 ? (
              <View style={styles.stepList}>
                {routeSteps.slice(0, 5).map((step, index) => (
                  <View key={step.id} style={styles.stepRow}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stepInstruction}>{step.instruction}</Text>
                      {step.distanceMeters ? (
                        <Text style={styles.stepDistance}>{formatDistance(step.distanceMeters)}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
                {routeSteps.length > 5 ? (
                  <Text style={styles.moreStepsText}>
                    +{routeSteps.length - 5} more road steps
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Fallback destination hint when the Routes API is not available */}
        {destination && !routeAvailable && !routeLoading ? (
          <View style={styles.fallbackHint}>
            <Text style={styles.fallbackHintText}>Destination selected • road route unavailable</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    height: 300,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fullBleed: {
    marginHorizontal: 0,
    marginTop: 0,
    borderRadius: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  searchBarWrap: {
    position: 'absolute',
    top: 14,
    left: 17,
    right: 17,
    minHeight: 56,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    height: 54,
    color: '#202124',
    fontSize: 16,
    paddingHorizontal: 10,
  },
  searchAction: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
  },
  searchDirectionsAction: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0B8F9B',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  rightControls: {
    position: 'absolute',
    right: 14,
    top: 90,
    alignItems: 'center',
  },
  roundMapButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  zoomGroup: {
    marginTop: 8,
    width: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  zoomButton: {
    width: 44,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  minusText: {
    color: '#30343B',
    fontSize: 30,
    lineHeight: 30,
    fontWeight: '300',
    marginTop: -3,
  },
  directionButton: {
    position: 'absolute',
    left: 15,
    bottom: 16,
    minHeight: 46,
    paddingHorizontal: 15,
    borderRadius: 23,
    backgroundColor: '#1479FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  directionButtonLoading: {
    paddingHorizontal: 18,
  },
  directionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  routeSummaryCard: {
    position: 'absolute',
    left: 15,
    right: 15,
    bottom: 72,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 7,
  },
  routeSummaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routeSummaryDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8F1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeSummaryTitle: {
    color: '#202124',
    fontSize: 12,
    fontWeight: '800',
  },
  routeSummaryMeta: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 3,
    fontWeight: '600',
  },
  routeSummaryChevron: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepList: {
    marginTop: 10,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    maxHeight: 160,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    paddingVertical: 6,
  },
  stepNumber: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: '#E8F1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    color: '#1479FF',
    fontSize: 10,
    fontWeight: '900',
  },
  stepInstruction: {
    color: '#30343B',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
  },
  stepDistance: {
    color: '#9CA3AF',
    fontSize: 8,
    marginTop: 1,
  },
  moreStepsText: {
    color: '#1479FF',
    fontSize: 9,
    fontWeight: '800',
    paddingTop: 3,
  },
  fallbackHint: {
    position: 'absolute',
    right: 15,
    bottom: 18,
    maxWidth: 190,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  fallbackHintText: {
    color: '#6B7280',
    fontSize: 8,
    fontWeight: '700',
  },
});
