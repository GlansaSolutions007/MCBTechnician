# Google Play Store Readiness Checklist

Use this checklist before uploading to the Play Store. Items marked ✅ are already done in the project.

---

## ✅ Code & Config (Done)

### Permissions & disclosure
- **Prominent disclosure**: `PermissionsDisclosureScreen` is shown to logged-in users before they enter the app. Users must accept to continue.
- **Permission strings**: `app.json` has explicit descriptions for:
  - Location (iOS `infoPlist`): live position for customers, navigation to job site.
  - Camera / Photo (iOS + `expo-image-picker`): vehicle and service work photos for job records only.
- **Android permissions**: Declared in `app.json` (location, camera, READ_MEDIA_IMAGES, foreground service, etc.). No extra sensitive permissions without justification.

### Build & versioning
- **Android package**: `com.itglansa.mcbt` in `app.json`.
- **versionCode**: Set in `app.json` (initial 1). EAS production profile has `autoIncrement: true` so each store build gets a higher versionCode.
- **version**: `1.0.0` in `app.json` (update when you release new features).
- **Production build**: `eas build --profile production --platform android` produces an **AAB** (Android App Bundle) for Play Store.

### Security & data
- **Debug logs**: Verbose `console.log` removed from SupervisorBookings and SupervisorBookingDetails. Error logging in SupervisorBookings is wrapped in `__DEV__` so production builds don’t log sensitive data.
- **Secrets**: API keys in `app.json` extra are for build-time config. Use EAS Secrets or `.env` (not committed) for production API keys and Razorpay. Restrict Google Maps API key by package name and SHA in Google Cloud Console.

### Android manifest
- **Firebase / manifest**: Custom plugin `plugins/withAndroidManifestFix.js` resolves Firebase notification color conflict.

---

## Before You Submit (Your Actions)

### 1. Google Play Console
- [ ] Create app in Play Console (or use existing).
- [ ] Complete **Data safety** form: declare location, camera, and photo usage using the same wording as in the app (live tracking, job photos).
- [ ] Add **Privacy policy** URL if you collect user data.
- [ ] Fill **App content** (ads declaration if you use ads, target audience, etc.).

### 2. Signing & credentials
- [ ] EAS handles signing when using `eas build --profile production`. Ensure you’ve run `eas credentials` if you need to set up or manage keystore.
- [ ] For first upload, EAS can create the keystore; store the credentials safely.

### 3. Assets & store listing
- [ ] **Store listing**: Short/long description, screenshots (phone/tablet if needed), feature graphic, app icon.
- [ ] **Content rating**: Complete the questionnaire in Play Console.
- [ ] **Target audience**: Set age group if required.

### 4. Environment & API
- [ ] Set **EAS Secrets** for production (e.g. `API_BASE_URL`, Razorpay keys) if you don’t rely only on `app.json` extra.
- [ ] Ensure **google-services.json** in project root is for the correct Firebase project and is valid.

### 5. Test before submit
- [ ] Install the production AAB (or APK from EAS) and test: login, permissions disclosure, location, camera/photo, notifications.
- [ ] Test on Android 12+ and one older version if you support it.

---

## Build & Submit Commands

```bash
# Production AAB for Play Store
eas build --profile production --platform android

# After build succeeds, submit to Play (optional)
eas submit --platform android --latest
```

---

## Common Rejection Reasons (Avoided Here)

| Topic | What we did |
|-------|-------------|
| **Photo/Video permission policy** | Clear permission strings + prominent disclosure screen explaining use for job/service photos only. |
| **Sensitive data / Permissions disclosure** | PermissionsDisclosureScreen before main app; no sensitive data in logs in production. |
| **Unclear feature description** | Location and camera/photo usage described in app.json and disclosure screen. |
| **versionCode** | Set in app.json; EAS autoIncrement bumps it for each production build. |

---

## Summary

- **Code/config**: Permissions disclosure, permission strings, versionCode, and log cleanup are in place.
- **Your steps**: Data safety form, privacy policy, store listing, content rating, EAS secrets, and testing before submit.

After completing the “Before You Submit” items, you can upload the production AAB to the Play Console and submit for review.
