import React, { useState } from 'react';
import { View, TextInput, Text, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig'; // Ajusta el path si es diferente
import { useNavigation } from '@react-navigation/native';
import { estilos, colores } from '../tema';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const navigation = useNavigation();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, correo, contrasena);
    } catch (error) {
      Alert.alert('Error al iniciar sesión', error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={estilos.pantalla}>
      <View style={estilos.tarjeta}>
        <View style={estilos.logo}>
          <Ionicons name="egg" size={36} color={colores.primario} />
        </View>
        <Text style={estilos.titulo}>Iniciar Sesión</Text>
        <Text style={estilos.subtitulo}>Bienvenido de nuevo, Niño Elegido</Text>

        <Text style={estilos.etiqueta}>Correo electrónico</Text>
        <TextInput
          placeholder="tu@correo.com"
          placeholderTextColor={colores.textoSuave}
          value={correo}
          onChangeText={setCorreo}
          style={estilos.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={estilos.etiqueta}>Contraseña</Text>
        <TextInput
          placeholder="••••••••"
          placeholderTextColor={colores.textoSuave}
          value={contrasena}
          onChangeText={setContrasena}
          style={estilos.input}
          secureTextEntry
        />

        <TouchableOpacity style={estilos.boton} onPress={handleLogin}>
          <Text style={estilos.botonTexto}>Ingresar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={estilos.enlace} onPress={() => navigation.navigate('Registro')}>
          <Text style={estilos.enlaceTexto}>
            ¿No tienes cuenta? <Text style={estilos.enlaceResaltado}>Regístrate</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
