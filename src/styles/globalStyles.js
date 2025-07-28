// src/styles/globalStyles.js
import { StyleSheet } from "react-native";
import { color } from "./theme";
import { fonts } from "./fonts";

export default StyleSheet.create({
  // Bootstrap styles ----------- start
  flexrow: {
    flexDirection: "row",
  },
  flex: {
    display: "flex",
  },
  flex1: {
    flex: 1,
  },
  justifysb: {
    justifyContent: "space-between",
  },
  justifysa: {
    justifyContent: "space-around",
  },
  justifystart: {
    justifyContent: "flex-start",
  },
  justifyend: {
    justifyContent: "flex-end",
  },
  justifycenter: {
    justifyContent: "center",
  },

  justifysa: {
    justifyContent: "space-around",
  },

  justifyevenly: {
    justifyContent: "space-evenly",
  },

  alineItemscenter: {
    alignItems: "center",
  },
  alineItemsEnd: {
    alignItems: "flex-end",
  },
  alineSelfcenter: {
    alignSelf: "center",
  },
  alineSelfend: {
    alignSelf: "flex-end",
  },
  textac: {
    textAlign: "center",
  },
  w40: {
    width: "40%",
  },
  w50: {
    width: "50%",
  },
  w60: {
    width: "60%",
  },
  w100: {
    width: "100%",
  },
  divider: {
    height: 1.5,
    backgroundColor: color.neutral[200],
    marginVertical: 10,
  },

  //  divider: {
  //     height: 1,
  //     backgroundColor: "#ffffff80",
  //     marginVertical: 12,
  //   },

  // Bootstrap styles .............. end

  // Default styles ----------- start

  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  bgcontainer: {
    backgroundColor: "#ededed",
  },
  radius: {
    borderRadius: 8,
  },
  borderRadiuslarge: {
    borderRadius: 20,
  },
  // Default styles .............. end

  // Color styles ----------- start
  primary: {
    color: color.primary,
  },
  secondary: {
    color: color.secondary,
  },
  textWhite: {
    color: color.white,
  },
  black: {
    color: color.black,
  },
  red: {
    color: color.red,
  },
  fullred: {
    color: color.fullred,
  },
  fullredLight: {
    color: color.fullredLight,
  },
  neutral100: {
    color: color.neutral[100],
  },
  neutral200: {
    color: color.neutral[200],
  },
  neutral300: {
    color: color.neutral[300],
  },
  neutral500: {
    color: color.neutral[500],
  },
  bgneutral100: {
    backgroundColor: color.neutral[100],
  },
  bgneutral200: {
    backgroundColor: color.neutral[200],
  },
  bgneutral300: {
    backgroundColor: color.neutral[300],
  },
  bgneutral500: {
    backgroundColor: color.neutral[500],
  },
  // Color styles .............. end

  // background color ----------- start
  bgprimary: {
    backgroundColor: color.primary,
  },
  bgwhite: {
    backgroundColor: color.white,
  },
  bgBlack: {
    backgroundColor: color.black,
  },
  // background color .............. end

  // margins and paddings ----------- start
  // Margins
  m0: { margin: 0 },
  m1: { margin: 4 },
  m2: { margin: 8 },
  m3: { margin: 12 },
  m4: { margin: 16 },
  m5: { margin: 20 },
  // Top margins
  mtn50: { marginTop: -50 },
  mtn1: { marginTop: -4 },
  mt0: { marginTop: 0 },
  mt1: { marginTop: 4 },
  mt2: { marginTop: 8 },
  mt3: { marginTop: 12 },
  mt4: { marginTop: 16 },
  mt5: { marginTop: 20 },
  // Bottom margins
  mbn0: { marginBottom: -4 },
  mb0: { marginBottom: 0 },
  mb1: { marginBottom: 4 },
  mb2: { marginBottom: 8 },
  mb3: { marginBottom: 12 },
  mb4: { marginBottom: 16 },
  mb5: { marginBottom: 20 },
  mb6: { marginBottom: 24 },
  mb35: { marginBottom: 35 },
  mb40: { marginBottom: 40 },
  mb90: { marginBottom: 40 },
  // Left margins
  ml0: { marginLeft: 0 },
  ml1: { marginLeft: 4 },
  ml2: { marginLeft: 8 },
  ml3: { marginLeft: 12 },
  ml4: { marginLeft: 16 },
  ml5: { marginLeft: 20 },
  ml50: { marginLeft: 50 },
  // Right margins
  mr0: { marginRight: 0 },
  mr1: { marginRight: 4 },
  mr2: { marginRight: 8 },
  mr3: { marginRight: 12 },
  mr4: { marginRight: 16 },
  mr5: { marginRight: 20 },
  // Horizontal margins
  mh0: { marginHorizontal: 0 },
  mh1: { marginHorizontal: 4 },
  mh2: { marginHorizontal: 8 },
  mh3: { marginHorizontal: 12 },
  mh4: { marginHorizontal: 16 },
  mh5: { marginHorizontal: 20 },
  // Vertical margins
  mv0: { marginVertical: 0 },
  mv1: { marginVertical: 4 },
  mv2: { marginVertical: 8 },
  mv3: { marginVertical: 12 },
  mv4: { marginVertical: 16 },
  mv5: { marginVertical: 20 },
  mv6: { marginVertical: 24 },

  // Paddings
  p0: { padding: 0 },
  p1: { padding: 4 },
  p2: { padding: 8 },
  p3: { padding: 12 },
  p4: { padding: 16 },
  p5: { padding: 20 },
  p40: { padding: 40 },
  // Top paddings
  pt0: { paddingTop: 0 },
  pt1: { paddingTop: 4 },
  pt2: { paddingTop: 8 },
  pt3: { paddingTop: 12 },
  pt4: { paddingTop: 16 },
  pt5: { paddingTop: 20 },
  // Bottom paddings
  pb0: { paddingBottom: 0 },
  pb1: { paddingBottom: 4 },
  pb2: { paddingBottom: 8 },
  pb3: { paddingBottom: 12 },
  pb4: { paddingBottom: 16 },
  pb5: { paddingBottom: 20 },
  // Left paddings
  pl0: { paddingLeft: 0 },
  pl1: { paddingLeft: 4 },
  pl2: { paddingLeft: 8 },
  pl3: { paddingLeft: 12 },
  pl4: { paddingLeft: 16 },
  pl5: { paddingLeft: 20 },
  // Right paddings
  pr0: { paddingRight: 0 },
  pr1: { paddingRight: 4 },
  pr2: { paddingRight: 8 },
  pr3: { paddingRight: 12 },
  pr4: { paddingRight: 16 },
  pr5: { paddingRight: 20 },
  pr30: { paddingRight: 30 },
  // Horizontal paddings
  ph0: { paddingHorizontal: 0 },
  ph1: { paddingHorizontal: 4 },
  ph2: { paddingHorizontal: 8 },
  ph3: { paddingHorizontal: 12 },
  ph4: { paddingHorizontal: 16 },
  ph5: { paddingHorizontal: 20 },
  // Vertical paddings
  pv0: { paddingVertical: 0 },
  pv1: { paddingVertical: 4 },
  pv2: { paddingVertical: 8 },
  pv3: { paddingVertical: 12 },
  pv4: { paddingVertical: 16 },
  pv5: { paddingVertical: 20 },
  // margins and paddings .............. end

  // inputBox  ----------- start
  inputBox: {
    borderWidth: 1,
    borderColor: color.secondary,
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  textArea: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    padding: 12,
    textAlignVertical: "top",
    minHeight: 100,
  },
  //  inputBox .............. end

  // Login button ----------- start
  yellowbutton: {
    backgroundColor: "#F8B400",
    paddingVertical: 18,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
    marginBottom: 12,
  },
  blackButton: {
    backgroundColor: color.black,
    paddingVertical: 18,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
    marginBottom: 12,
  },
  // Login button .............. end

  // Card ----------start
  cardwidth: {
    borderRadius: 20,
    width: "90%",
    alignSelf: "flex-end",
  },
  card: {
    borderRadius: 20,
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarside: {
    width: 80,
    height: 110,
    position: "absolute",
    top: 0,
    left: -50,
    zIndex: 1,
    borderRadius: 14,
    borderWidth: 4,
    shadowColor: color.black,
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
    borderColor: color.white,
  },
  // Card ............ end

  // Modal ---------- Start

  // Modal ............ end

  // Font styles ----------- start
  f10Bold: {
    ...fonts.tinyBold,
  },
  f12Bold: {
    ...fonts.smallBold,
  },
  f14Bold: {
    ...fonts.regularBold,
  },
  f16Bold: {
    ...fonts.mediumBold,
  },
  f20Bold: {
    ...fonts.largeBold,
  },
  f24Bold: {
    ...fonts.xLargeBold,
  },
  f28Bold: {
    ...fonts.xxLargeBold,
  },
  f32Bold: {
    ...fonts.titleBold,
  },
  f36Bold: {
    ...fonts.headingBold,
  },
  f40Bold: {
    ...fonts.displayBold,
  },
  f44Bold: {
    ...fonts.heroBold,
  },
  // ExtraBold Fonts------------start
  f10ExtraBold: {
    ...fonts.tinyExtraBold,
  },
  f12ExtraBold: {
    ...fonts.smallExtraBold,
  },
  f16ExtraBold: {
    ...fonts.regularExtraBold,
  },
  f18ExtraBold: {
    ...fonts.mediumExtraBold,
  },
  f20ExtraBold: {
    ...fonts.largeExtraBold,
  },
  f24ExtraBold: {
    ...fonts.xLargeExtraBold,
  },

  f28ExtraBold: {
    ...fonts.xxLargeExtraBold,
  },
  f32ExtraBold: {
    ...fonts.titleExtraBold,
  },
  f36ExtraBold: {
    ...fonts.headingExtraBold,
  },
  f40ExtraBold: {
    ...fonts.displayExtraBold,
  },
  f44ExtraBold: {
    ...fonts.heroExtraBold,
  },
  // ExtraBold Fonts------------end

  // SemiBold Fonts------------start
  f10SemiBold: {
    ...fonts.tinySemiBold,
  },
  f12SemiBold: {
    ...fonts.smallSemiBold,
  },
  f16SemiBold: {
    ...fonts.regularSemiBold,
  },
  f18SemiBold: {
    ...fonts.mediumSemiBold,
  },
  f20SemiBold: {
    ...fonts.largeSemiBold,
  },
  f24SemiBold: {
    ...fonts.xLargeSemiBold,
  },
  f28SemiBold: {
    ...fonts.xxLargeSemiBold,
  },
  f32SemiBold: {
    ...fonts.titleSemiBold,
  },
  f36SemiBold: {
    ...fonts.headingSemiBold,
  },
  f40SemiBold: {
    ...fonts.displaySemiBold,
  },
  f44SemiBold: {
    ...fonts.heroSemiBold,
  },
  // SemiBold Fonts------------end

  //medium Fonts------------start
  f10Medium: {
    ...fonts.tinyMedium,
  },
  f12Medium: {
    ...fonts.smallMedium,
  },
  f16Medium: {
    ...fonts.regularMedium,
  },
  f18Medium: {
    ...fonts.mediumMedium,
  },
  f20Medium: {
    ...fonts.largeMedium,
  },
  f24Medium: {
    ...fonts.xLargeMedium,
  },
  f28Medium: {
    ...fonts.xxLargeMedium,
  },
  f32Medium: {
    ...fonts.titleMedium,
  },
  f36Medium: {
    ...fonts.headingMedium,
  },
  f40Medium: {
    ...fonts.displayMedium,
  },
  f44Medium: {
    ...fonts.heroMedium,
  },
  // medium Fonts------------end

  // Light Fonts------------start
  f10Light: {
    ...fonts.tinyLight,
  },
  f12Light: {
    ...fonts.smallLight,
  },
  f16Light: {
    ...fonts.regularLight,
  },
  f18Light: {
    ...fonts.mediumLight,
  },
  f20Light: {
    ...fonts.largeLight,
  },
  f24Light: {
    ...fonts.xLargeLight,
  },
  f28Light: {
    ...fonts.xxLargeLight,
  },
  f32Light: {
    ...fonts.titleLight,
  },
  f36Light: {
    ...fonts.headingLight,
  },
  f40Light: {
    ...fonts.displayLight,
  },
  f44Light: {
    ...fonts.heroLight,
  },
  // Light Fonts------------end

  // Regular Fonts------------start

  f10Regular: {
    ...fonts.tinyRegular,
  },
  f12Regular: {
    ...fonts.smallRegular,
  },
  f16Regular: {
    ...fonts.regularRegular,
  },
  f18Regular: {
    ...fonts.mediumRegular,
  },
  f20Regular: {
    ...fonts.largeRegular,
  },
  f24Regular: {
    ...fonts.xLargeRegular,
  },
  f28Regular: {
    ...fonts.xxLargeRegular,
  },
  f32Regular: {
    ...fonts.titleRegular,
  },
  f36Regular: {
    ...fonts.headingRegular,
  },
  f40Regular: {
    ...fonts.displayRegular,
  },
  f44Regular: {
    ...fonts.heroRegular,
  },

  f10ExtraLight: {
    ...fonts.tinyExtraLight,
  },
  f12ExtraLight: {
    ...fonts.smallExtraLight,
  },
  f16ExtraLight: {
    ...fonts.regularExtraLight,
  },
  f18ExtraLight: {
    ...fonts.mediumExtraLight,
  },
  f20ExtraLight: {
    ...fonts.largeExtraLight,
  },
  f24ExtraLight: {
    ...fonts.xLargeExtraLight,
  },
  f28ExtraLight: {
    ...fonts.xxLargeExtraLight,
  },
  f32ExtraLight: {
    ...fonts.titleExtraLight,
  },
  f36ExtraLight: {
    ...fonts.headingExtraLight,
  },
  f40ExtraLight: {
    ...fonts.displayExtraLight,
  },
  f44ExtraLight: {
    ...fonts.heroExtraLight,
  },
  // Font styles .............. end
});
