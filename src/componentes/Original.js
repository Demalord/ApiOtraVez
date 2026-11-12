// src/componentes/Original.js — Memoria Digimon
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  ScrollView, Animated, useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { estilos, colores } from '../tema';

const PARES = 6;          // 6 parejas = 12 cartas
const MAX_FALLOS = 10;    // si fallas 10 veces, pierdes
const TOTAL_DIGIMON = 1488;
const COLUMNAS = 4;

// Mezcla un arreglo (algoritmo Fisher-Yates)
const mezclar = (arr) => {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
};

// Trae un Digimon por id (con imagen)
const obtenerDigimon = async (id) => {
  const res = await fetch(`https://digi-api.com/api/v1/digimon/${id}`);
  const data = await res.json();
  if (!data.images?.length) throw new Error('Sin imagen');
  return { id: data.id, nombre: data.name, imagen: data.images[0].href };
};

// Arma el tablero: PARES Digimon distintos, cada uno duplicado y mezclado
const crearTablero = async () => {
  // Elige PARES ids distintos y los pide todos a la vez (en paralelo)
  const ids = new Set();
  while (ids.size < PARES) ids.add(Math.floor(Math.random() * TOTAL_DIGIMON) + 1);
  const resultados = await Promise.allSettled([...ids].map(obtenerDigimon));
  const digimons = resultados.filter((r) => r.status === 'fulfilled').map((r) => r.value);

  // Si alguno falló, se completa con otros
  while (digimons.length < PARES) {
    const id = Math.floor(Math.random() * TOTAL_DIGIMON) + 1;
    if (digimons.some((d) => d.id === id)) continue;
    try {
      digimons.push(await obtenerDigimon(id));
    } catch (err) {
      console.error('Error al obtener el Digimon:', err);
    }
  }

  // Pre-carga las imágenes para que al voltear aparezcan de inmediato
  // (máximo 3 s de espera para no quedarse "Barajando cartas..." si la red está lenta)
  await Promise.race([
    Image.prefetch(digimons.map((d) => d.imagen)).catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ]);

  const cartas = digimons.flatMap((d) => [
    { clave: `${d.id}-a`, ...d },
    { clave: `${d.id}-b`, ...d },
  ]);
  return mezclar(cartas);
};

// Una carta con animación de volteo (se encoge en X, cambia de cara y se abre)
function Carta({ carta, visible, encontrada, onPress, tamano }) {
  const escala = useRef(new Animated.Value(1)).current;
  const [mostrarFrente, setMostrarFrente] = useState(visible);

  useEffect(() => {
    if (visible === mostrarFrente) return;
    Animated.timing(escala, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setMostrarFrente(visible);
      Animated.timing(escala, { toValue: 1, duration: 120, useNativeDriver: true }).start();
    });
  }, [visible]);

  const alto = Math.round(tamano * 1.25);

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={{ margin: 4 }}>
      <Animated.View
        style={[
          styles.carta,
          { width: tamano, height: alto, transform: [{ scaleX: escala }] },
          mostrarFrente
            ? [styles.frente, encontrada && styles.frenteEncontrada]
            : styles.reverso,
        ]}
      >
        {mostrarFrente ? (
          <>
            <Image
              source={{ uri: carta.imagen }}
              style={{ width: tamano * 0.85, height: alto * 0.68 }}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
            <Text style={styles.cartaNombre} numberOfLines={1}>{carta.nombre}</Text>
          </>
        ) : (
          <Ionicons name="egg" size={tamano * 0.4} color="#FFFFFF" />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function MemoriaDigimon() {
  const [cartas, setCartas] = useState([]);
  const [volteadas, setVolteadas] = useState([]);     // índices boca arriba en este turno
  const [encontradas, setEncontradas] = useState([]); // ids de Digimon ya emparejados
  const [intentos, setIntentos] = useState(0);
  const [fallos, setFallos] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [loading, setLoading] = useState(true);

  const [userWin, setUserWin] = useState(0);
  const [userLose, setUserLose] = useState(0);
  const [uid, setUid] = useState(null);

  const { width } = useWindowDimensions();
  const anchoTablero = Math.min(width, 560) - 40 - 56; // pantalla - padding pantalla - padding tarjeta
  const tamanoCarta = Math.floor(anchoTablero / COLUMNAS) - 8;

  // Escuchar el login del usuario
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid);
    });
    return unsubscribe;
  }, []);

  // Obtener estadísticas del usuario
  useEffect(() => {
    if (!uid) return;
    const traerDatos = async () => {
      const docRef = doc(db, 'usuarios', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserWin(data.ganados || 0);
        setUserLose(data.perdidos || 0);
      } else {
        await setDoc(docRef, { ganados: 0, perdidos: 0 }); // inicializar si no existe
      }
    };
    traerDatos();
  }, [uid]);

  const guardarResultado = async (gano, totalIntentos, paresEncontrados) => {
    if (!uid) return;
    const fecha = new Date().toISOString();

    const resultado = {
      uid,
      juego: 'memoria',
      gano,
      intentos: totalIntentos,
      pares: paresEncontrados,
      fecha,
    };

    try {
      // Guardar resultado individual
      await setDoc(doc(db, 'resultados', `${uid}_${fecha}`), resultado);

      // Actualizar campos ganados/perdidos del usuario
      await updateDoc(doc(db, 'usuarios', uid), {
        ganados: gano ? userWin + 1 : userWin,
        perdidos: !gano ? userLose + 1 : userLose,
      });
    } catch (e) {
      console.error('Error al guardar resultado:', e);
    }
  };

  const nuevaPartida = async () => {
    setLoading(true);
    setVolteadas([]);
    setEncontradas([]);
    setIntentos(0);
    setFallos(0);
    setBloqueado(false);
    setGameOver(false);
    setGameWon(false);
    setCartas(await crearTablero());
    setLoading(false);
  };

  useEffect(() => {
    nuevaPartida();
  }, []);

  const handleCarta = (indice) => {
    const carta = cartas[indice];
    if (bloqueado || gameOver || gameWon) return;
    if (volteadas.includes(indice) || encontradas.includes(carta.id)) return;

    const nuevas = [...volteadas, indice];
    setVolteadas(nuevas);
    if (nuevas.length < 2) return;

    // Se voltearon 2 cartas: comparar
    const totalIntentos = intentos + 1;
    setIntentos(totalIntentos);
    const [a, b] = nuevas.map((i) => cartas[i]);

    if (a.id === b.id) {
      const nuevasEncontradas = [...encontradas, a.id];
      setEncontradas(nuevasEncontradas);
      setVolteadas([]);
      if (nuevasEncontradas.length === PARES) {
        setGameWon(true);
        setUserWin(userWin + 1);
        guardarResultado(true, totalIntentos, PARES);
      }
    } else {
      const nuevosFallos = fallos + 1;
      setFallos(nuevosFallos);
      setBloqueado(true);
      setTimeout(() => {
        setVolteadas([]);
        setBloqueado(false);
        if (nuevosFallos >= MAX_FALLOS) {
          setGameOver(true);
          setUserLose(userLose + 1);
          guardarResultado(false, totalIntentos, encontradas.length);
        }
      }, 900);
    }
  };

  return (
    <ScrollView contentContainerStyle={estilos.pantalla}>
      <View style={[estilos.tarjeta, { maxWidth: 560, alignItems: 'center' }]}>
        <Text style={estilos.titulo}>Memoria Digimon</Text>
        <Text style={[estilos.subtitulo, { marginBottom: 0 }]}>Encuentra las {PARES} parejas</Text>

        <View style={styles.statsFila}>
          <View style={[styles.stat, { backgroundColor: '#DCFCE7' }]}>
            <Text style={[styles.statNumero, { color: colores.exito }]}>{userWin}</Text>
            <Text style={styles.statTexto}>Ganados</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.statNumero, { color: colores.error }]}>{userLose}</Text>
            <Text style={styles.statTexto}>Perdidos</Text>
          </View>
        </View>

        {loading ? (
          <View style={{ marginVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colores.primario} />
            <Text style={{ marginTop: 12, color: colores.textoSuave }}>Barajando cartas...</Text>
          </View>
        ) : (
          <>
            <View style={styles.marcador}>
              <Text style={styles.marcadorTexto}>Parejas: {encontradas.length}/{PARES}</Text>
              <Text style={styles.marcadorTexto}>Intentos: {intentos}</Text>
            </View>

            <View style={styles.barra}>
              <View style={[styles.barraRelleno, { width: `${(fallos / MAX_FALLOS) * 100}%` }]} />
            </View>
            <Text style={styles.fallos}>Fallos: {fallos} / {MAX_FALLOS}</Text>

            <View style={[styles.tablero, { width: (tamanoCarta + 8) * COLUMNAS }]}>
              {cartas.map((carta, i) => (
                <Carta
                  key={carta.clave}
                  carta={carta}
                  tamano={tamanoCarta}
                  visible={gameOver || volteadas.includes(i) || encontradas.includes(carta.id)}
                  encontrada={encontradas.includes(carta.id)}
                  onPress={() => handleCarta(i)}
                />
              ))}
            </View>

            {gameOver && <Text style={styles.lost}>💀 ¡Perdiste! Se acabaron los intentos</Text>}
            {gameWon && <Text style={styles.won}>🎉 ¡Ganaste en {intentos} intentos!</Text>}

            {(gameOver || gameWon) && (
              <TouchableOpacity style={[estilos.boton, { alignSelf: 'stretch' }]} onPress={nuevaPartida}>
                <Text style={estilos.botonTexto}>Jugar otra vez</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  statsFila: { flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 12 },
  stat: { borderRadius: 12, paddingVertical: 8, paddingHorizontal: 20, alignItems: 'center' },
  statNumero: { fontSize: 22, fontWeight: '800' },
  statTexto: { fontSize: 12, color: colores.textoSuave, fontWeight: '600' },
  marcador: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', marginBottom: 8 },
  marcadorTexto: { fontSize: 14, fontWeight: '700', color: colores.azul },
  barra: { alignSelf: 'stretch', height: 8, backgroundColor: colores.borde, borderRadius: 4, overflow: 'hidden' },
  barraRelleno: { height: '100%', backgroundColor: colores.error },
  fallos: { fontSize: 13, color: colores.textoSuave, marginTop: 6, marginBottom: 12 },
  tablero: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  carta: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  reverso: { backgroundColor: colores.primario, borderWidth: 3, borderColor: '#FDBA74' },
  frente: { backgroundColor: '#FFF7ED', borderWidth: 2, borderColor: colores.borde, padding: 4 },
  frenteEncontrada: { backgroundColor: '#DCFCE7', borderColor: colores.exito },
  cartaNombre: { fontSize: 10, fontWeight: '700', color: colores.texto, marginTop: 2, paddingHorizontal: 2 },
  lost: { color: colores.error, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  won: { color: colores.exito, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
});
