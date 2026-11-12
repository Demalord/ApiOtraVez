// src/tema.js — colores y estilos compartidos de la app
import { StyleSheet, Platform } from 'react-native';

export const colores = {
  fondo: '#F3F6FB',
  tarjeta: '#FFFFFF',
  primario: '#F28C28', // naranja Agumon
  primarioOscuro: '#D9731A',
  azul: '#1E3A8A',
  texto: '#1F2937',
  textoSuave: '#6B7280',
  borde: '#E5E7EB',
  exito: '#16A34A',
  error: '#DC2626',
};

const sombra = Platform.select({
  web: { boxShadow: '0 8px 24px rgba(30, 58, 138, 0.10)' },
  default: {
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
});

export const estilos = StyleSheet.create({
  pantalla: {
    flexGrow: 1,
    backgroundColor: colores.fondo,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tarjeta: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colores.tarjeta,
    borderRadius: 20,
    padding: 28,
    ...sombra,
  },
  logo: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF1E3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  titulo: {
    fontSize: 26,
    fontWeight: '800',
    color: colores.azul,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 14,
    color: colores.textoSuave,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: colores.texto,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colores.texto,
    marginBottom: 14,
  },
  boton: {
    backgroundColor: colores.primario,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  botonTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  enlace: {
    marginTop: 18,
    alignItems: 'center',
  },
  enlaceTexto: {
    color: colores.textoSuave,
    fontSize: 14,
  },
  enlaceResaltado: {
    color: colores.azul,
    fontWeight: '700',
  },
  sombra,
});
