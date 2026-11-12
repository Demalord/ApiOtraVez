// src/componentes/Logout.js
import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import { colores } from '../tema';

export default function Logout() {
  useEffect(() => {
    signOut(auth);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colores.fondo }}>
      <ActivityIndicator size="large" color={colores.primario} />
      <Text style={{ marginTop: 12, color: colores.textoSuave }}>Cerrando sesión...</Text>
    </View>
  );
}
