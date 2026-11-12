import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ-:.\' '.split('');
const MAX_ATTEMPTS = 5;
const TOTAL_DIGIMON = 1488;

// Busca un Digimon aleatorio cuyo nombre se pueda escribir con el teclado (ALPHABET)
const obtenerDigimonAleatorio = async () => {
  while (true) {
    const id = Math.floor(Math.random() * TOTAL_DIGIMON) + 1;
    try {
      const response = await fetch(`https://digi-api.com/api/v1/digimon/${id}`);
      const data = await response.json();
      const nombre = data.name.toUpperCase();
      const valido = nombre.split('').every((l) => ALPHABET.includes(l));
      if (valido && data.images?.length) {
        return { nombre, id: data.id, imagen: data.images[0].href };
      }
    } catch (err) {
      console.error('Error al obtener el Digimon:', err);
    }
  }
};

export default function JuegoDigimon() {
  const [digimonName, setDigimonName] = useState('');
  const [digimonImage, setDigimonImage] = useState('');
  const [digimonId, setDigimonId] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [loading, setLoading] = useState(true);

  const [userWin, setUserWin] = useState(0);
  const [userLose, setUserLose] = useState(0);
  const [uid, setUid] = useState(null); // Agrega estado uid correctamente

  // Escuchar el login del usuario
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      }
    });
    return unsubscribe;
  }, []);

  // Obtener datos del usuario
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
        setUserWin(0);
        setUserLose(0);
      }
      setLoading(false);
    };
    traerDatos();
  }, [uid]);

  const guardarResultado = async (acierto) => {
    if (!uid) return;
    const fecha = new Date().toISOString();

    const resultado = {
      uid,
      digimon: digimonName,
      aciertos: acierto ? 1 : 0,
      errores: acierto ? 0 : 1,
      fecha,
    };

    try {
      // Guardar resultado individual
      await setDoc(doc(db, 'resultados', `${uid}_${fecha}`), resultado);

      // Actualizar campos ganados/perdidos del usuario
      const docRef = doc(db, 'usuarios', uid);
      await updateDoc(docRef, {
        ganados: acierto ? userWin + 1 : userWin,
        perdidos: !acierto ? userLose + 1 : userLose,
      });
    } catch (e) {
      console.error('Error al guardar resultado:', e);
    }
  };

  useEffect(() => {
    const getRandomDigimon = async () => {
      const digimon = await obtenerDigimonAleatorio();
      setDigimonName(digimon.nombre);
      setDigimonId(digimon.id);
      setDigimonImage(digimon.imagen);
      setLoading(false);
    };
    getRandomDigimon();
  }, []);

  const handleLetterClick = async (letter) => {
    if (guessedLetters.includes(letter) || gameOver || gameWon) return;

    const updatedGuessed = [...guessedLetters, letter];
    setGuessedLetters(updatedGuessed);

    if (!digimonName.includes(letter)) {
      const newWrongGuesses = wrongGuesses + 1;
      setWrongGuesses(newWrongGuesses);
      if (newWrongGuesses >= MAX_ATTEMPTS) {
        setGameOver(true);
        setUserLose(userLose + 1);
        await guardarResultado(false);
      }
    } else {
      const allCorrect = digimonName
        .split('')
        .every((l) => updatedGuessed.includes(l));
      if (allCorrect) {
        setGameWon(true);
        setUserWin(userWin + 1);
        await guardarResultado(true);
      }
    }
  };

  const renderWord = () =>
    digimonName.split('').map((letter, index) => (
      <Text key={index} style={styles.letter}>
        {guessedLetters.includes(letter) || gameOver || gameWon ? letter : '_'}
      </Text>
    ));

  const restartGame = async () => {
    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameOver(false);
    setGameWon(false);
    setLoading(true);
    setDigimonName('');
    setDigimonId('');
    setDigimonImage('');

    // vuelve a buscar un Digimon nuevo
    const digimon = await obtenerDigimonAleatorio();
    setDigimonName(digimon.nombre);
    setDigimonId(digimon.id);
    setDigimonImage(digimon.imagen);
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Adivina el Digimon</Text>
      <Text style={styles.stats}>Ganados: {userWin} | Perdidos: {userLose}</Text>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          <Text>{digimonId}</Text>
          <Image source={{ uri: digimonImage }} style={styles.image} />
          <View style={styles.wordContainer}>{renderWord()}</View>

          <View style={styles.keyboard}>
            {ALPHABET.map((letter) => (
              <TouchableOpacity
                key={letter}
                onPress={() => handleLetterClick(letter)}
                disabled={guessedLetters.includes(letter) || gameOver || gameWon}
                style={[
                  styles.key,
                  guessedLetters.includes(letter) && styles.keyDisabled,
                ]}
              >
                <Text>{letter === ' ' ? '␣' : letter}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.attempts}>
            Fallos: {wrongGuesses} / {MAX_ATTEMPTS}
          </Text>

          {gameOver && (
            <Text style={styles.lost}>💀 ¡Perdiste! Era: {digimonName}</Text>
          )}
          {gameWon && <Text style={styles.won}>🎉 ¡Ganaste!</Text>}

          {(gameOver || gameWon) && (
            <TouchableOpacity style={styles.button} onPress={restartGame}>
              <Text style={styles.buttonText}>Jugar otra vez</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  title: { fontSize: 24, marginBottom: 10 },
  image: { width: 150, height: 150, marginVertical: 10 },
  stats: { marginBottom: 10, fontSize: 16 },
  wordContainer: { flexDirection: 'row', marginBottom: 20, flexWrap: 'wrap' },
  letter: { fontSize: 28, marginHorizontal: 4 },
  keyboard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  key: {
    backgroundColor: '#eee',
    padding: 10,
    margin: 4,
    borderRadius: 4,
    width: 40,
    alignItems: 'center',
  },
  keyDisabled: {
    backgroundColor: '#ccc',
  },
  attempts: { fontSize: 16, marginBottom: 10 },
  lost: { color: 'red', fontSize: 18 },
  won: { color: 'green', fontSize: 18 },
  button: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#0066cc',
    borderRadius: 5,
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
});
