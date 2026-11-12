import React, { useState } from 'react';
import { View, TextInput, Text, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { estilos, colores } from '../tema';

export default function Registro() {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [fecha, setFecha] = useState('');
  const [telefono, setTelefono] = useState('');
  const navigation = useNavigation();

  let ganados = 0;
  let perdidos = 0;

  const handleRegistro = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, correo, contrasena);
      const user = userCredential.user;

      // 🔁 Guardar datos en Firestore con el mismo UID como ID del documento
      await setDoc(doc(db, 'usuarios', user.uid), {
        uid: user.uid,
        nombre,
        correo,
        fecha,
        telefono,
        ganados,
        perdidos
      });

      Alert.alert('Éxito', 'Usuario registrado correctamente');
      navigation.navigate('Login'); // o a Home si prefieres
    } catch (error) {
      Alert.alert('Error al registrarse', error.message);
    }
  };

  const campo = (etiqueta, props) => (
    <>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <TextInput placeholderTextColor={colores.textoSuave} style={estilos.input} {...props} />
    </>
  );

  return (
    <ScrollView contentContainerStyle={estilos.pantalla}>
      <View style={estilos.tarjeta}>
        <View style={estilos.logo}>
          <Ionicons name="person-add" size={32} color={colores.primario} />
        </View>
        <Text style={estilos.titulo}>Registro</Text>
        <Text style={estilos.subtitulo}>Crea tu cuenta y empieza a adivinar Digimon</Text>

        {campo('Nombre', { placeholder: 'Tai Kamiya', value: nombre, onChangeText: setNombre })}
        {campo('Correo', { placeholder: 'tu@correo.com', value: correo, onChangeText: setCorreo, autoCapitalize: 'none', keyboardType: 'email-address' })}
        {campo('Contraseña', { placeholder: 'Mínimo 6 caracteres', value: contrasena, onChangeText: setContrasena, secureTextEntry: true })}
        {campo('Fecha de nacimiento', { placeholder: 'YYYY-MM-DD', value: fecha, onChangeText: setFecha })}
        {campo('Teléfono', { placeholder: '300 123 4567', value: telefono, onChangeText: setTelefono, keyboardType: 'phone-pad' })}

        <TouchableOpacity style={estilos.boton} onPress={handleRegistro}>
          <Text style={estilos.botonTexto}>Registrarse</Text>
        </TouchableOpacity>

        <TouchableOpacity style={estilos.enlace} onPress={() => navigation.navigate('Login')}>
          <Text style={estilos.enlaceTexto}>
            ¿Ya tienes cuenta? <Text style={estilos.enlaceResaltado}>Inicia sesión</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
