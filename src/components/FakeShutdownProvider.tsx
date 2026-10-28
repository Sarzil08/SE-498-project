import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { StyleSheet, View, StatusBar, BackHandler, TouchableOpacity, Text } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

const FakeShutdownContext = createContext<any>(null);

export function FakeShutdownProvider({ children }: { children: React.ReactNode }) {
  const [isFakeShutdown, setIsFakeShutdown] = useState(false);
  const clickCount = useRef(0);
  const lastClickTime = useRef(0);
  const volumeSubscriptionRef = useRef<any>(null);

  // 🚨 ফেক শাটডাউন ট্রিগার ফাংশন
  const triggerFakeShutdown = async () => {
    setIsFakeShutdown(true);
    clickCount.current = 0;

    try {
      await NavigationBar.setVisibilityAsync('hidden');
      await NavigationBar.setBehaviorAsync('overlay-swipe');
    } catch (e) {
      console.log("Navigation bar hide failed", e);
    }
  };

  // 🔓 আনলক করার কমন ফাংশন (ভলিউম বা ৩-ট্যাপ যেকোনোটা সফল হলে এটি চলবে)
  const executeUnlock = () => {
    setIsFakeShutdown(false);
    clickCount.current = 0;
    try {
      NavigationBar.setVisibilityAsync('visible');
    } catch (e) {}
  };

  // 📱 ১. ব্যাকআপ আনলক: ৩-বার স্ক্রিন ট্যাপ মেকানিজম (Expo Go এর সেফটির জন্য)
  const handleSecretUnlockTap = () => {
    const currentTime = Date.now();
    if (currentTime - lastClickTime.current > 1500) {
      clickCount.current = 1;
    } else {
      clickCount.current += 1;
    }
    lastClickTime.current = currentTime;

    if (clickCount.current >= 3) {
      executeUnlock();
    }
  };

  // 🔒 ব্যাক বাটন লক এবং হার্ডওয়্যার ভলিউম বাটন লিসেনার মেকানিজম
  useEffect(() => {
    let backHandlerSubscription: any = null;

    if (isFakeShutdown) {
      // চোরের জন্য ব্যাক বাটন লক
      backHandlerSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
        return true;
      });

      // 🔊 ২. আসল ভলিউম বাটন মেকানিজম (ডাইনামিক সেফ লোড)
      try {
        // require ব্যবহার করায় এক্সপো গো ক্র্যাশ করবে না, চুপচাপ ক্যাটচ ব্লকে চলে যাবে
        const { VolumeManager } = require('react-native-volume-manager');
        
        if (VolumeManager && typeof VolumeManager.addVolumeListener === 'function') {
          volumeSubscriptionRef.current = VolumeManager.addVolumeListener(() => {
            const currentTime = Date.now();
            if (currentTime - lastClickTime.current > 2000) {
              clickCount.current = 1;
            } else {
              clickCount.current += 1;
            }
            lastClickTime.current = currentTime;
            console.log(`🔊 Real Volume Pressed! Count: ${clickCount.current}`);

            if (clickCount.current >= 5) {
              executeUnlock();
            }
          });
        }
      } catch (error) {
        // এক্সপো গো-তে থাকলে এখানে আসবে, কোনো এরর বা লাল স্ক্রিন দেখাবে না
        console.log("Running in Expo Go: Real volume keys bypassed safely. Use 3-tap instead.");
      }

    }

    // ক্লিনআপ লিসেনার
    return () => {
      if (backHandlerSubscription) backHandlerSubscription.remove();
      if (volumeSubscriptionRef.current && typeof volumeSubscriptionRef.current.remove === 'function') {
        try {
          volumeSubscriptionRef.current.remove();
        } catch (e) {}
        volumeSubscriptionRef.current = null;
      }
    };
  }, [isFakeShutdown]);

  return (
    <FakeShutdownContext.Provider value={{ isFakeShutdown, triggerFakeShutdown }}>
      {children}
      
      {/* 🕶️ চোরকে বোকা বানানোর ব্ল্যাক স্ক্রিন ওভারলে */}
      {isFakeShutdown && (
        <TouchableOpacity 
          activeOpacity={1} 
          style={styles.blackScreen} 
          onPress={handleSecretUnlockTap} 
        >
          <StatusBar hidden={true} />
          <View style={styles.devGuideBox}>
            <Text style={styles.devGuideText}>[Anti-Theft Active: Press Volume 5 times or Tap screen 3 times]</Text>
          </View>
        </TouchableOpacity>
      )}
    </FakeShutdownContext.Provider>
  );
}

export const useFakeShutdown = () => useContext(FakeShutdownContext);

const styles = StyleSheet.create({
  blackScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 999999,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  devGuideBox: { marginBottom: 40, opacity: 0.15 },
  devGuideText: { color: '#FFFFFF', fontSize: 11 }
});