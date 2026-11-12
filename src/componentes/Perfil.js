// src/componentes/Perfil.js
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Alert, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../firebase/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { estilos, colores } from '../tema';

export default function Perfil() {
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cargando, setCargando] = useState(true);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const traerDatos = async () => {
      const docRef = doc(db, 'usuarios', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNombre(data.nombre || '');
        setFecha(data.fecha || '');
        setTelefono(data.telefono || '');
      } else {
        Alert.alert('Usuario no encontrado');
      }
      setCargando(false);
    };
    traerDatos();
  }, [uid]);

  const actualizarDatos = async () => {
    try {
      const docRef = doc(db, 'usuarios', uid);
      await updateDoc(docRef, {
        nombre,
        fecha,
        telefono,
      });
      Alert.alert('Datos actualizados');
    } catch (error) {
      console.error(error);
      Alert.alert('Error al actualizar');
    }
  };

  if (cargando) {
    return (
      <View style={[estilos.pantalla, { flex: 1 }]}>
        <ActivityIndicator size="large" color={colores.primario} />
        <Text style={{ marginTop: 12, color: colores.textoSuave }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={estilos.pantalla}>
      <View style={estilos.tarjeta}>
        <View style={estilos.logo}>
          <Ionicons name="person" size={34} color={colores.primario} />
        </View>
        <Text style={estilos.titulo}>Perfil del Usuario</Text>
        <Text style={estilos.subtitulo}>{auth.currentUser?.email}</Text>

        <Text style={estilos.etiqueta}>Nombre</Text>
        <TextInput
          style={estilos.input}
          placeholder="Nombre"
          placeholderTextColor={colores.textoSuave}
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={estilos.etiqueta}>Fecha de nacimiento</Text>
        <TextInput
          style={estilos.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colores.textoSuave}
          value={fecha}
          onChangeText={setFecha}
        />

        <Text style={estilos.etiqueta}>Teléfono</Text>
        <TextInput
          style={estilos.input}
          placeholder="Teléfono"
          placeholderTextColor={colores.textoSuave}
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
        />

        <TouchableOpacity style={estilos.boton} onPress={actualizarDatos}>
          <Text style={estilos.botonTexto}>Guardar cambios</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
