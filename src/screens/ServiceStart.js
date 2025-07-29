import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "../components/CustomText";
import globalStyles from "../styles/globalStyles";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import AvailabilityHeader from "../components/AvailabilityHeader";
import { color } from "../styles/theme";
import helpcall from "../../assets/icons/Customer Care.png";
import { useNavigation } from "@react-navigation/native";

export default function ServiceStart() {
  const navigation = useNavigation();
  const [images, setImages] = useState([]);
  const [reason, setReason] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerCompleted, setTimerCompleted] = useState(false);
  const MAX_TIME = 10;

  useEffect(() => {
    let interval = null;

    if (timerStarted && !timerCompleted) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timerStarted, timerCompleted]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType,
      allowsMultipleSelection: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      const selected = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...selected].slice(0, 6));
    }
  };

  const removeImage = (index) => {
    const filtered = images.filter((_, i) => i !== index);
    setImages(filtered);
  };

  return (
    <ScrollView style={globalStyles.bgcontainer}>
      <View style={globalStyles.container}>
        <AvailabilityHeader />

        {/* Booking Info */}
        <CustomText style={[globalStyles.f20Bold, globalStyles.primary]}>
          Booking ID:{" "}
          <CustomText style={globalStyles.black}>TG234518</CustomText>
        </CustomText>

        <CustomText style={[globalStyles.f14Bold, globalStyles.mt4]}>
          Want to upload before service images?
        </CustomText>
        <CustomText
          style={[
            globalStyles.f10Light,
            globalStyles.neutral500,
            globalStyles.mt1,
          ]}
        >
          My dear buddy, upload maximum 4-5 images
        </CustomText>

        <TouchableOpacity
          style={[globalStyles.inputBox, globalStyles.mt3]}
          onPress={pickImage}
        >
          <CustomText style={[globalStyles.f16Light, globalStyles.neutral500]}>
            Choose Files
          </CustomText>
        </TouchableOpacity>

        {images.length > 0 && (
          <View
            style={[
              globalStyles.flexrow,
              globalStyles.justifysb,
              globalStyles.mt3,
              { flexWrap: "wrap" },
            ]}
          >
            {images.map((uri, index) => (
              <View
                key={index}
                style={{
                  width: "32%",
                  marginBottom: 10,
                  position: "relative",
                }}
              >
                <Image
                  source={{ uri }}
                  style={{ width: 100, height: 100, borderRadius: 10 }}
                />
                <TouchableOpacity
                  onPress={() => removeImage(index)}
                  style={{
                    position: "absolute",
                    top: 5,
                    right: 18,
                    backgroundColor: "#000",
                    borderRadius: 10,
                    padding: 2,
                    zIndex: 1,
                  }}
                >
                  <Ionicons name="close" color="#fff" size={15} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {timerStarted && (
          <View>
            <View style={{ alignItems: "center", marginTop: 30 }}>
              <AnimatedCircularProgress
                size={240}
                width={5}
                fill={Math.min((elapsedTime / MAX_TIME) * 100, 100)}
                tintColor={elapsedTime > MAX_TIME ? "red" : color.primary}
                backgroundColor="#eaeaea"
                rotation={0}
                lineCap="round"
              >
                {() => (
                  <>
                    <CustomText
                      style={[globalStyles.f12Medium, { color: color.black }]}
                    >
                      Service Timing
                    </CustomText>
                    <CustomText
                      style={[globalStyles.f28ExtraBold, { marginTop: 5 }]}
                    >
                      {formatTime(elapsedTime)}
                    </CustomText>
                  </>
                )}
              </AnimatedCircularProgress>

              {timerCompleted && (
                <CustomText
                  style={[
                    globalStyles.mt4,
                    globalStyles.f16Bold,
                    { color: "green" },
                  ]}
                >
                  Total Time Taken: {formatTime(elapsedTime)}
                </CustomText>
              )}
            </View>

            <View>
              <CustomText style={[globalStyles.f16Bold, globalStyles.black]}>
                Service Details
              </CustomText>
              <View style={[globalStyles.mt2, globalStyles.ph4]}>
                <CustomText style={globalStyles.f18Medium}>
                  • Leather Fabric Seat Polishing
                </CustomText>
                <CustomText style={globalStyles.f18Medium}>
                  • AC Vent Sanitization
                </CustomText>
                <CustomText style={globalStyles.f18Medium}>
                  • Mat Washing & Vacuuming
                </CustomText>
              </View>
            </View>
            <TouchableOpacity
              // onPress={() => setTimerCompleted(true)}
              onPress={() => {
                setTimerCompleted(true);
                setTimeTaken(elapsedTime);
                navigation.navigate("ServiceEnd", {
                  estimatedTime: MAX_TIME,
                  actualTime: elapsedTime,
                });
              }}
              style={globalStyles.blackButton}
            >
              <CustomText
                style={[globalStyles.f12Bold, globalStyles.textWhite]}
              >
                Completed
              </CustomText>
            </TouchableOpacity>
          </View>
        )}

        {!timerStarted && (
          <View>
            <View
              style={[
                globalStyles.flexrow,
                globalStyles.justifysb,
                globalStyles.mt4,
                globalStyles.bgprimary,
                globalStyles.p4,
                globalStyles.borderRadiuslarge,
              ]}
            >
              <View style={globalStyles.alineSelfcenter}>
                <CustomText
                  style={[globalStyles.f12Medium, globalStyles.textWhite]}
                >
                  Estimated Time
                </CustomText>
                <CustomText
                  style={[globalStyles.f32Bold, globalStyles.textWhite]}
                >
                  1 hr 30 min
                </CustomText>
              </View>
              <TouchableOpacity
                style={styles.pricecard}
                onPress={() => {
                  setTimerStarted(true);
                  setElapsedTime(0);
                  setTimerCompleted(false);
                }}
              >
                <CustomText style={[globalStyles.f16Bold, globalStyles.black]}>
                  Lets Start
                </CustomText>
              </TouchableOpacity>
            </View>
            <CustomText
              style={[
                globalStyles.f28Medium,
                globalStyles.neutral500,
                globalStyles.mt2,
              ]}
            >
              Hey{" "}
              <CustomText style={[globalStyles.f28Bold, globalStyles.primary]}>
                Buddy
              </CustomText>
            </CustomText>
            <CustomText
              style={[
                globalStyles.f12Regular,
                globalStyles.neutral500,
                globalStyles.mt2,
              ]}
            >
              If the estimation time exceeded. Please feel free to mention the
              reason
            </CustomText>

            <TextInput
              style={[globalStyles.textArea, globalStyles.mt3]}
              placeholder="eg. Sick leave..., Going to village"
              value={reason}
              onChangeText={setReason}
              maxLength={100}
              multiline
            />
            <View
              style={[
                globalStyles.flexrow,
                globalStyles.justifycenter,
                globalStyles.mt4,
              ]}
            >
              <TouchableOpacity
                style={[
                  globalStyles.flex1,
                  {
                    backgroundColor: color.fullredLight,
                    padding: 16,
                    borderRadius: 10,
                    marginRight: 8,
                  },
                ]}
              >
                <CustomText
                  style={[globalStyles.textWhite, globalStyles.textac]}
                >
                  Cancel service
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  globalStyles.flex1,
                  {
                    backgroundColor: "#000",
                    padding: 16,
                    borderRadius: 10,
                    marginLeft: 8,
                  },
                ]}
              >
                <View
                  style={[
                    globalStyles.flexrow,
                    globalStyles.justifycenter,
                    globalStyles.alineItemscenter,
                  ]}
                >
                  <Image source={helpcall} />
                  <CustomText style={globalStyles.textWhite}>
                    Call help line
                  </CustomText>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pricecard: {
    backgroundColor: color.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
});
