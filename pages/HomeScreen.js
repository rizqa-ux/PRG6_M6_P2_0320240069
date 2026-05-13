import React, { useState, useEffect, useMemo, useContext } from "react";
import {
    View, Text, StyleSheet,
    TouchableOpacity, Alert,
    Button
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
// Gunakan CameraPermissions dan komponen CameraView
import { CameraView, useCameraPermissions } from 'expo-camera';
import { AuthContext } from '../context/AuthContext';

export default function HomeScreen() {

    const navigation = useNavigation();

    // Ambil data user DAN fungsi logout dari Context
    const { userData, logout } = useContext(AuthContext);

    const [permission, requestPermission] = useCameraPermissions();

    // State untuk menyimpan data hasil scan
    const [scannedData, setScannedData] = useState(null);

    // State untuk mengontrol apakah scanner aktif atau "terkunci" (setelah berhasil scan)
    const [isScanning, setIsScanning] = useState(true);

    const [isCheckedIn, setIsCheckedIn] = useState(false);

    // GANTI DENGAN IP LAPTOP MASING-MASING
    const BASE_URL = "http://10.1.12.213:8080/api/presensi";
    //const BASE_URL = "http://localhost:5137/api/Presensi";

    // =============================================
    // LANGKAH 2: Menangani Hak Akses Kamera
    // =============================================

    // 1. Jika status permission masih loading
    if (!permission) {
        return <View style={styles.container}><Text style={styles.infoText}>Memuat perizinan kamera...</Text></View>;
    }

    // 2. Jika user belum memberikan izin atau menolak
    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.infoText}>
                    Aplikasi butuh akses kamera untuk memindai QR Code Presensi Dosen!
                </Text>
                <TouchableOpacity style={styles.buttonRequest} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Aktifkan Kamera</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // =============================================
    // LANGKAH 3: Fungsi Handler Saat QR Terdeteksi
    // =============================================

    // 3. Fungsi saat QR Code terdeteksi kamera
    const handleBarCodeScanned = ({ type, data }) => {
        // Jika sedang terkunci, abaikan scan agar tidak looping
        if (!isScanning) return;

        // Kunci scanner
        setIsScanning(false);

        try {
            // Ubah teks JSON dari QR Code menjadi Objek JavaScript
            const qrData = JSON.parse(data);
            setScannedData(qrData);

            Alert.alert(
                "QR Code Terdeteksi",
                `Mata Kuliah: ${qrData.kodeMk}\nPertemuan: ${qrData.pertemuanKe}\nRuangan: ${qrData.ruangan}\n\nLanjutkan Presensi (Check-In)?`,
                [
                    {
                        text: "Batal",
                        onPress: () => {
                            // Reset jika batal
                            setIsScanning(true);
                            setScannedData(null);
                        },
                        style: "cancel"
                    },
                    {
                        text: "Ya, Check In",
                        // Lemparkan objek hasil parse ke fungsi submit
                        onPress: () => handleSubmitPresensi(qrData)
                    },
                ]
            );
        } catch (error) {
            // Handle jika QR Code yang di-scan bukan format JSON (misal salah scan QR Link biasa)
            Alert.alert("QR Tidak Valid", "Pastikan Anda memindai QR Code Presensi Dosen.");
            setIsScanning(true);
        }
    };

    // =============================================
    // LANGKAH 4: Integrasi API
    // =============================================

    // 4. Fungsi kirim data ke API .NET Core / Spring Boot
    const handleSubmitPresensi = async (qrData) => {
        // Payload dinamis mengambil nilai dari objek qrData
        const payload = {
            kodeMk: qrData.kodeMk,
            nimMhs: userData.nim_mhs,  // Simulasi NIM User yang login
            pertemuanKe: qrData.pertemuanKe,
            date: new Date().toISOString().split('T')[0],
            jamPresensi: new Date().toLocaleTimeString('en-GB'),
            status: "Present",
            ruangan: qrData.ruangan
        };

        try {
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                setIsCheckedIn(true);
                Alert.alert("Berhasil!", "Presensi sukses dicatat ke Database.", [
                    { text: "Lihat Riwayat", onPress: () => navigation.navigate('HistoryTab') }
                ]);
            } else {
                Alert.alert("Gagal", result.message || "Terjadi kesalahan di server.");
            }
        } catch (error) {
            Alert.alert("Error Jaringan", "Pastikan IP Laptop benar dan API berjalan.");
            console.error(error);
        } finally {
            // Reset state agar siap untuk presensi selanjutnya
            setIsScanning(true);
            setScannedData(null);
        }
    };

    // =============================================
    // LANGKAH 5: Render Antarmuka Scanner dengan Overlay
    // =============================================

    // 5. Render UI
    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject} // Kamera penuh layar
                facing="back" // Gunakan kamera belakang
                // KUNCI UTAMA: Aktifkan pendeteksi QR Code
                onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
                barCodeScannerSettings={{
                    barCodeTypes: ["qr"], // Batasi HANYA memindai QR Code agar lebih cepat
                }}
            >
                {/* Desain Overlay Kotak Pemandu di tengah layar */}
                <View style={styles.overlay}>
                    <View style={styles.unfocusedContainer}></View>
                    <View style={styles.focusedContainer}>
                        <View style={styles.borderCornerTopLeft} />
                        <View style={styles.borderCornerTopRight} />
                        <View style={styles.borderCornerBottomLeft} />
                        <View style={styles.borderCornerBottomRight} />
                    </View>
                    <View style={styles.unfocusedContainer}>
                        <Text style={styles.scanText}>Arahkan Kamera ke QR Code Dosen</Text>

                        {/* Tombol darurat jika scanner terkunci */}
                        {!isScanning && (
                            <Button title="Scan Lagi" onPress={() => setIsScanning(true)} color="#ffc107" />
                        )}
                    </View>
                </View>
            </CameraView>
        </View>
    );
}

// =============================================
// LANGKAH 6: Styling (Membuat Overlay Kotak)
// =============================================

// 6. Styling kotak overlay scanner
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    infoText: {
        color: 'white',
        textAlign: 'center',
        margin: 30,
        fontSize: 16,
    },
    buttonRequest: {
        backgroundColor: '#0056b3',
        padding: 15,
        borderRadius: 10,
        alignSelf: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },

    // Styling Overlay Scanner
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)', // Latar gelap transparan
    },
    unfocusedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    focusedContainer: {
        width: 250, // Ukuran kotak pemandu
        height: 250,
        alignSelf: 'center',
        backgroundColor: 'transparent',
        position: 'relative',
    },
    scanText: {
        color: 'white',
        fontSize: 16,
        marginTop: 20,
        fontWeight: 'bold',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 10,
        borderRadius: 5,
    },

    // Membuat Sudut Kotak Biru
    borderCornerTopLeft: {
        position: 'absolute', top: 0, left: 0, width: 40, height: 40,
        borderTopWidth: 5, borderLeftWidth: 5, borderColor: '#007bff',
    },
    borderCornerTopRight: {
        position: 'absolute', top: 0, right: 0, width: 40, height: 40,
        borderTopWidth: 5, borderRightWidth: 5, borderColor: '#007bff',
    },
    borderCornerBottomLeft: {
        position: 'absolute', bottom: 0, left: 0, width: 40, height: 40,
        borderBottomWidth: 5, borderLeftWidth: 5, borderColor: '#007bff',
    },
    borderCornerBottomRight: {
        position: 'absolute', bottom: 0, right: 0, width: 40, height: 40,
        borderBottomWidth: 5, borderRightWidth: 5, borderColor: '#007bff',
    },
});