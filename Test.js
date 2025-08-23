 <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <CustomText style={[globalStyles.f16Bold, globalStyles.mb2]}>
                OTP Error
              </CustomText>
              <CustomText style={globalStyles.f12Regular}>
                {modalMessage}
              </CustomText>

              <TouchableOpacity
                style={[globalStyles.blackButton, { marginTop: 20 }]}
                onPress={() => setModalVisible(false)}
              >
                <CustomText
                  style={[globalStyles.textWhite, globalStyles.f14Bold]}
                >
                  OK
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>