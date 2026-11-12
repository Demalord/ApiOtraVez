import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { colores, estilos } from '../tema';

export default function Home() {
  const [data, setData] = useState([]);
  const { width } = useWindowDimensions();
  // Cuántas tarjetas caben por fila (160 de ancho + 12 de separación)
  const columnas = Math.max(2, Math.floor((width - 32) / 172));

  useEffect(() => {
    const obtenerDatos = async () => {
      const res = await fetch("https://digi-api.com/api/v1/digimon?pageSize=1500");
      const json = await res.json();
      setData(json.content);
    };

    obtenerDatos();
  }, []);

  // FlatList solo dibuja las tarjetas visibles en pantalla (mucho más rápido que map con 1488)
  const renderItem = ({ item: digimon }) => (
    <View style={[styles.item, estilos.sombra]}>
      <View style={styles.imagenFondo}>
        <Image
          source={{ uri: digimon.image }}
          style={styles.imagen}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={200}
          recyclingKey={String(digimon.id)}
        />
      </View>
      <Text style={styles.id}>#{String(digimon.id).padStart(4, '0')}</Text>
      <Text style={styles.nombre} numberOfLines={2}>{digimon.name}</Text>
    </View>
  );

  return (
    <FlatList
      key={columnas}
      data={data}
      numColumns={columnas}
      keyExtractor={(d) => String(d.id)}
      renderItem={renderItem}
      style={{ backgroundColor: colores.fondo }}
      contentContainerStyle={{ paddingBottom: 16 }}
      columnWrapperStyle={styles.fila}
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      windowSize={5}
      removeClippedSubviews
      ListHeaderComponent={
        <>
          <View style={styles.encabezado}>
            <Text style={styles.titulo}>Digimon</Text>
            <Text style={styles.subtitulo}>
              {data.length ? `${data.length} Digimon en la base de datos` : 'Cargando Digimon...'}
            </Text>
          </View>
          {!data.length && <ActivityIndicator size="large" color={colores.primario} style={{ marginTop: 40 }} />}
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  encabezado: {
    backgroundColor: colores.azul,
    paddingTop: 40,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  titulo: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  subtitulo: { fontSize: 14, color: '#C7D2FE', marginTop: 4, textAlign: 'center' },
  fila: {
    gap: 12,
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  item: {
    backgroundColor: colores.tarjeta,
    width: 160,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  imagenFondo: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  imagen: {
    width: '85%',
    height: '85%',
  },
  id: { fontSize: 12, fontWeight: '700', color: colores.primario },
  nombre: { fontSize: 15, fontWeight: '700', color: colores.texto, textAlign: 'center', marginTop: 2 },
});
