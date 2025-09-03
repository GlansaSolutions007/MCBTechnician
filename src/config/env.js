// Environment configuration fallback
// This file provides default values when @env imports fail

import Constants from 'expo-constants';

// Get environment variables from app.json extra section
const extra = Constants.expoConfig?.extra || {};

export const API_BASE_URL = extra.API_BASE_URL || 'https://api.mycarsbuddy.com/api/';
export const API_BASE_URL_IMAGE = extra.API_BASE_URL_IMAGE || 'https://api.mycarsbuddy.com/';
export const RAZORPAY_KEY = extra.RAZORPAY_KEY || 'your_razorpay_key_here';
export const RAZORPAY_SECRET = extra.RAZORPAY_SECRET || 'your_razorpay_secret_here';
export const GOOGLE_MAPS_APIKEY = extra.GOOGLE_MAPS_APIKEY || 'AIzaSyAC8UIiyDI55MVKRzNTHwQ9mnCnRjDymVo';

// Fallback for development
if (__DEV__) {
  console.log('Environment variables loaded:', {
    API_BASE_URL,
    API_BASE_URL_IMAGE,
    GOOGLE_MAPS_APIKEY
  });
}
