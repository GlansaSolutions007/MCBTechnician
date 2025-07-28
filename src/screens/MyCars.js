import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ImageBackground } from "react-native";
import carData from "../../assets/data/carBrands.json";
import { useNavigation } from "@react-navigation/native";
import SearchBox from "../components/SearchBox";
import globalStyles from "../styles/globalStyles";
import CustomText from "../components/CustomText";
import { color } from "../styles/theme";
import axios from "axios";
import Loader from "../components/Loader";

export default function MyCars() {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true)

    const getBrands = async () => {
        try {
            const brandRes = await axios.get('https://api.mycarsbuddy.com/api/VehicleBrands/GetVehicleBrands');
            const modelRes = await axios.get('https://api.mycarsbuddy.com/api/VehicleModels/GetListVehicleModel');

            const brands = brandRes.data.data;
            const models = modelRes.data.data;

            // Format and attach models to each brand
            const formattedBrands = brands.map(brand => {
                const brandModels = models
                    .filter(model => model.BrandID === brand.BrandID)
                    .map(model => {
                        const imagePath = model.VehicleImage.includes("Images/VehicleModel")
                            ? model.VehicleImage
                            : `Images/VehicleModel/${model.VehicleImage}`;
                        console.log("Model Image URL:", `https://api.mycarsbuddy.com/${imagePath.replace(/^\/+/, '')}`);

                        return {
                            id: model.ModelID,
                            name: model.ModelName,
                            image: `https://api.mycarsbuddy.com/${imagePath.replace(/^\/+/, '')}`,
                            fuelType: model.FuelTypeID
                        };

                    });

                return {
                    brand: brand.BrandName,
                    logo: `https://api.mycarsbuddy.com/Images/BrandLogo/${brand.BrandLogo.split('/').pop()}`,
                    models: brandModels
                };
            });

            setBrands(formattedBrands);
        } catch (error) {
            console.error('Failed to fetch car brands or models:', error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        getBrands();
    }, []);

    const navigation = useNavigation();

    const renderBrand = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
           
        >
            <ImageBackground
                source={{ uri: item.logo }}
                style={styles.logo}
                imageStyle={{ resizeMode: 'contain' }}
            >
            </ImageBackground>
            <CustomText style={globalStyles.f12Bold}>{item.brand} {item.brandId}</CustomText>
        </TouchableOpacity>
    );

    if (loading) return <Loader />;

    return (
        <View style={[styles.container, { padding: 10, flex: 1 }]}>
            <SearchBox />
            <View style={{ marginVertical: 10 }}>
                <CustomText style={globalStyles.f12Bold}>Add Your Car</CustomText>
                <CustomText style={{ ...globalStyles.f10Bold, color: color.secondary }}>Start From Selecting Your Manufacturer.</CustomText>
            </View>
            <FlatList
                data={brands}
                renderItem={renderBrand}
                keyExtractor={(item) => item.brand}
                numColumns={3}
                columnWrapperStyle={styles.row}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: "#fff", flex: 1 },
    row: { justifyContent: "space-between", marginBottom: 16 },
    card: {
        alignItems: "center",
        flex: 1,
        marginHorizontal: 2,
        marginVertical: 2
    },
    logo: {
        width: 80,
        height: 80,
        resizeMode: "cover",
        marginBottom: 1,
        overflow: 'hidden',
    },
});
