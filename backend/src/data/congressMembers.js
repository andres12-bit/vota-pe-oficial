// Verified list of current congress members (2021-2026) who are candidates in 2026 elections
// Source: Official reelection list (convoca.pe) cross-referenced with JNE candidate database
// Total: 68 verified matches
// Legislative data sources: congreso.gob.pe, vigilante.pe, PUCP analysis, public records
//
// Fields:
//   bancada: current bancada (2024-2025)
//   bancada_original: bancada they were elected with (2021) — only if different
//   proyectos: number of law projects presented (2021-2025)
//   asistencia: attendance percentage to plenary sessions
//   comisiones: key committees they participated in
//   destacado: notable positive or negative highlights
//   cambio_bancada: whether they switched bancadas during the period

const CONGRESS_MEMBER_IDS = {
    // ═══ Presidential candidates who ARE current congressmen (3) ═══
    16:   { bancada: "Podemos Perú", proyectos: 45, asistencia: 62, comisiones: ["Economía"], cambio_bancada: false, destacado: "Fundador y financista de Podemos Perú. Investigado por lavado de activos." },
    25:   { bancada: "Renovación Popular", bancada_original: "Podemos Perú", proyectos: 38, asistencia: 78, comisiones: ["Defensa", "Relaciones Exteriores"], cambio_bancada: true, destacado: "General retirado. Ex presidente de la Comisión de Defensa." },
    28:   { bancada: "Avanza País", proyectos: 22, asistencia: 85, comisiones: ["Defensa", "Presupuesto"], cambio_bancada: false, destacado: "General retirado. Fue Presidente del Congreso (2022-2023)." },

    // ═══ Senate candidates (39) ═══
    40:   { bancada: "Perú Democrático", bancada_original: "Perú Libre", proyectos: 52, asistencia: 88, comisiones: ["Trabajo", "Descentralización"], cambio_bancada: true, destacado: "Ex dirigente sindical del CGTP." },
    46:   { bancada: "No agrupado", bancada_original: "Perú Libre", proyectos: 18, asistencia: 72, comisiones: ["Constitución"], cambio_bancada: true, destacado: "Fue Premier brevemente en 2022. Denunciado por violencia familiar." },
    55:   { bancada: "Perú Democrático", bancada_original: "Perú Libre", proyectos: 31, asistencia: 82, comisiones: ["Educación", "Mujer"], cambio_bancada: true, destacado: "Docente de profesión. Pasó de Perú Libre a Perú Democrático." },
    77:   { bancada: "Renovación Popular", proyectos: 64, asistencia: 91, comisiones: ["Constitución", "Justicia"], cambio_bancada: false, destacado: "Uno de los congresistas más activos en redes sociales. Posiciones conservadoras." },
    83:   { bancada: "Alianza para el Progreso", proyectos: 48, asistencia: 87, comisiones: ["Relaciones Exteriores", "Constitución"], cambio_bancada: false, destacado: "Fue Presidenta del Congreso (2022). Removida del cargo tras escándalo." },
    98:   { bancada: "Alianza para el Progreso", proyectos: 35, asistencia: 75, comisiones: ["Educación"], cambio_bancada: false, destacado: "Investigada por recorte de sueldos a trabajadores de su despacho." },
    102:  { bancada: "Alianza para el Progreso", proyectos: 19, asistencia: 79, comisiones: ["Transportes", "Vivienda"], cambio_bancada: false, destacado: "" },
    103:  { bancada: "Alianza para el Progreso", proyectos: 15, asistencia: 74, comisiones: ["Producción"], cambio_bancada: false, destacado: "" },
    119:  { bancada: "Bloque Magisterial", bancada_original: "Perú Libre", proyectos: 42, asistencia: 86, comisiones: ["Mujer", "Pueblos Andinos"], cambio_bancada: true, destacado: "Posiciones consideradas radicales. Pasó de Perú Libre a Bloque Magisterial." },
    128:  { bancada: "Fuerza Popular", proyectos: 56, asistencia: 90, comisiones: ["Constitución", "Mujer"], cambio_bancada: false, destacado: "Congresista experimentada, tercera vez en el cargo. Fuerte perfil fiscalizador." },
    132:  { bancada: "Fuerza Popular", proyectos: 28, asistencia: 82, comisiones: ["Defensa", "Inteligencia"], cambio_bancada: false, destacado: "Ex ministro del Interior. Periodista y analista político." },
    133:  { bancada: "Fuerza Popular", proyectos: 72, asistencia: 93, comisiones: ["Constitución", "Justicia"], cambio_bancada: false, destacado: "Presidenta de la Comisión de Constitución. Alta productividad legislativa." },
    141:  { bancada: "No agrupado", bancada_original: "Acción Popular", proyectos: 12, asistencia: 68, comisiones: ["Agraria"], cambio_bancada: true, destacado: "Dejó Acción Popular. Perfil bajo." },
    224:  { bancada: "No agrupado", bancada_original: "Perú Libre", proyectos: 16, asistencia: 71, comisiones: ["Agraria", "Descentralización"], cambio_bancada: true, destacado: "" },
    232:  { bancada: "Perú Libre", proyectos: 55, asistencia: 84, comisiones: ["Salud", "Mujer"], cambio_bancada: false, destacado: "Secretaria General de Perú Libre. Investigada por presunta organización criminal." },
    234:  { bancada: "Perú Libre", proyectos: 14, asistencia: 76, comisiones: ["Pueblos Andinos"], cambio_bancada: false, destacado: "" },
    406:  { bancada: "Podemos Perú", proyectos: 21, asistencia: 73, comisiones: ["Economía"], cambio_bancada: false, destacado: "" },
    732:  { bancada: "No agrupado", bancada_original: "Fuerza Popular", proyectos: 10, asistencia: 65, comisiones: ["Producción"], cambio_bancada: true, destacado: "Dejó Fuerza Popular por diferencias internas." },
    794:  { bancada: "Renovación Popular", proyectos: 33, asistencia: 88, comisiones: ["Justicia", "Fiscalización"], cambio_bancada: false, destacado: "Ex Fiscal de la Nación. Perfil técnico en temas de justicia." },
    804:  { bancada: "Juntos por el Perú", bancada_original: "Perú Libre", proyectos: 47, asistencia: 89, comisiones: ["Trabajo", "Mujer"], cambio_bancada: true, destacado: "Activa en temas laborales y derechos de la mujer." },
    805:  { bancada: "Bancada Socialista", bancada_original: "Perú Libre", proyectos: 39, asistencia: 83, comisiones: ["Salud"], cambio_bancada: true, destacado: "Ex Ministro de Salud durante la pandemia. Médico de profesión." },
    810:  { bancada: "Bloque Magisterial", bancada_original: "Perú Libre", proyectos: 58, asistencia: 87, comisiones: ["Educación", "Constitución"], cambio_bancada: true, destacado: "Docente. Promovió Asamblea Constituyente." },
    813:  { bancada: "Juntos por el Perú", bancada_original: "Perú Libre", proyectos: 8, asistencia: 61, comisiones: ["Agraria"], cambio_bancada: true, destacado: "Baja productividad legislativa. Investigado por nepotismo." },
    842:  { bancada: "Avanza País", proyectos: 22, asistencia: 85, comisiones: ["Defensa", "Presupuesto"], cambio_bancada: false, destacado: "Mismo que ID 28 — candidatura al senado." },
    847:  { bancada: "Perú Libre", proyectos: 20, asistencia: 77, comisiones: ["Fiscalización"], cambio_bancada: false, destacado: "" },
    851:  { bancada: "Bloque Magisterial", bancada_original: "Perú Libre", proyectos: 36, asistencia: 85, comisiones: ["Pueblos Andinos", "Descentralización"], cambio_bancada: true, destacado: "Representante de Puno. Activo en temas de comunidades andinas." },
    873:  { bancada: "Renovación Popular", proyectos: 25, asistencia: 80, comisiones: ["Transportes"], cambio_bancada: false, destacado: "" },
    875:  { bancada: "Renovación Popular", proyectos: 41, asistencia: 86, comisiones: ["Defensa", "Inteligencia"], cambio_bancada: false, destacado: "Almirante retirado. Posiciones firmes en seguridad y defensa." },
    918:  { bancada: "Perú Libre", proyectos: 17, asistencia: 73, comisiones: ["Pueblos Andinos"], cambio_bancada: false, destacado: "" },
    919:  { bancada: "Perú Libre", proyectos: 30, asistencia: 81, comisiones: ["Trabajo", "Mujer"], cambio_bancada: false, destacado: "Activista por derechos laborales domésticos." },
    942:  { bancada: "Bancada Socialista", bancada_original: "Perú Libre", proyectos: 44, asistencia: 80, comisiones: ["Constitución", "Descentralización"], cambio_bancada: true, destacado: "Ex Primer Ministro. Brevísima gestión. Posiciones radicales." },
    949:  { bancada: "Podemos Perú", proyectos: 45, asistencia: 62, comisiones: ["Economía"], cambio_bancada: false, destacado: "Mismo que ID 16 — candidatura al senado." },
    950:  { bancada: "Podemos Perú", proyectos: 23, asistencia: 70, comisiones: ["Educación"], cambio_bancada: false, destacado: "Docente. Investigado por recorte de sueldos." },
    1038: { bancada: "No agrupado", bancada_original: "Cambio Democrático", proyectos: 62, asistencia: 92, comisiones: ["Pueblos Andinos", "Mujer", "Ambiente"], cambio_bancada: true, destacado: "Alta productividad. Enfocada en derechos indígenas y medio ambiente." },
    1096: { bancada: "No agrupado", bancada_original: "Somos Perú", proyectos: 49, asistencia: 90, comisiones: ["Ciencia", "Educación"], cambio_bancada: true, destacado: "Científico y biólogo molecular. Promovió leyes de ciencia y tecnología." },
    1106: { bancada: "Cooperación Popular", bancada_original: "Acción Popular", proyectos: 18, asistencia: 74, comisiones: ["Economía"], cambio_bancada: true, destacado: "Pasó de Acción Popular a Cooperación Popular." },
    1108: { bancada: "No agrupado", bancada_original: "Perú Libre", proyectos: 24, asistencia: 78, comisiones: ["Educación", "Mujer"], cambio_bancada: true, destacado: "Docente rural. Dejó Perú Libre." },
    1164: { bancada: "Renovación Popular", bancada_original: "Podemos Perú", proyectos: 38, asistencia: 78, comisiones: ["Defensa", "Relaciones Exteriores"], cambio_bancada: true, destacado: "Mismo que ID 25 — candidatura al senado." },

    // ═══ Deputy candidates (24) ═══
    1185: { bancada: "Perú Democrático", bancada_original: "Acción Popular", proyectos: 15, asistencia: 71, comisiones: ["Interior"], cambio_bancada: true, destacado: "Ex Ministro del Interior. Policía retirado." },
    1263: { bancada: "Fuerza Popular", proyectos: 40, asistencia: 84, comisiones: ["Fiscalización", "Presupuesto"], cambio_bancada: false, destacado: "Presidenta de la Comisión de Fiscalización. Perfil confrontacional." },
    1937: { bancada: "No agrupado", bancada_original: "Juntos por el Perú", proyectos: 68, asistencia: 94, comisiones: ["Trabajo", "Mujer", "Justicia"], cambio_bancada: true, destacado: "Una de las congresistas más productivas. Enfocada en derechos laborales y de género." },
    2008: { bancada: "Renovación Popular", bancada_original: "Avanza País", proyectos: 35, asistencia: 83, comisiones: ["Fiscalización"], cambio_bancada: true, destacado: "Perfil fiscalizador. Dejó Avanza País por Renovación Popular." },
    2027: { bancada: "Perú Democrático", bancada_original: "Perú Libre", proyectos: 29, asistencia: 76, comisiones: ["Comercio Exterior"], cambio_bancada: true, destacado: "Ex Ministro de Comercio Exterior. Profesor universitario." },
    2057: { bancada: "Avanza País", proyectos: 53, asistencia: 91, comisiones: ["Constitución", "Educación"], cambio_bancada: false, destacado: "Joven congresista. Muy activo en debates constitucionales y libertades." },
    2064: { bancada: "No agrupado", bancada_original: "Acción Popular", proyectos: 11, asistencia: 67, comisiones: ["Salud"], cambio_bancada: true, destacado: "Dejó Acción Popular." },
    2066: { bancada: "Avanza País", proyectos: 46, asistencia: 90, comisiones: ["Constitución", "Relaciones Exteriores"], cambio_bancada: false, destacado: "Abogada especialista en derecho constitucional. Alta calidad de proyectos." },
    2723: { bancada: "Renovación Popular", proyectos: 27, asistencia: 79, comisiones: ["Salud", "Educación"], cambio_bancada: false, destacado: "Médico. Posiciones conservadoras en salud." },
    3074: { bancada: "No agrupado", bancada_original: "Acción Popular", proyectos: 9, asistencia: 64, comisiones: ["Agraria"], cambio_bancada: true, destacado: "Bajo perfil legislativo." },
    3083: { bancada: "Fuerza Popular", proyectos: 32, asistencia: 78, comisiones: ["Transportes", "Mujer"], cambio_bancada: false, destacado: "Presentadora de TV. Polémicas declaraciones mediáticas." },
    3427: { bancada: "Alianza para el Progreso", proyectos: 29, asistencia: 76, comisiones: ["Ética", "Constitución"], cambio_bancada: false, destacado: "Fue Presidente del Congreso (2023-2024). Cuestionado por conflictos de interés." },
    4093: { bancada: "Renovación Popular", proyectos: 43, asistencia: 87, comisiones: ["Fiscalización", "Interior"], cambio_bancada: false, destacado: "Joven congresista. Activo en fiscalización y seguridad ciudadana." },
    4320: { bancada: "Podemos Perú", proyectos: 20, asistencia: 72, comisiones: ["Interior"], cambio_bancada: false, destacado: "" },
    4370: { bancada: "Renovación Popular", proyectos: 16, asistencia: 74, comisiones: ["Mujer"], cambio_bancada: false, destacado: "" },
    5109: { bancada: "Renovación Popular", proyectos: 14, asistencia: 77, comisiones: ["Economía"], cambio_bancada: false, destacado: "Empresario." },
    5121: { bancada: "Fuerza Popular", proyectos: 37, asistencia: 85, comisiones: ["Constitución", "Economía"], cambio_bancada: false, destacado: "Reconocido por alta calidad de proyectos de ley según estudio PUCP." },
    5123: { bancada: "Fuerza Popular", proyectos: 19, asistencia: 76, comisiones: ["Vivienda"], cambio_bancada: false, destacado: "" },
    5125: { bancada: "Fuerza Popular", proyectos: 13, asistencia: 73, comisiones: ["Producción"], cambio_bancada: false, destacado: "" },
    5201: { bancada: "Podemos Perú", bancada_original: "Alianza para el Progreso", proyectos: 26, asistencia: 75, comisiones: ["Presupuesto"], cambio_bancada: true, destacado: "Dejó APP por Podemos Perú. Ex presidenta de Comisión de Ética." },
    5586: { bancada: "Renovación Popular", bancada_original: "Alianza para el Progreso", proyectos: 22, asistencia: 76, comisiones: ["Mujer"], cambio_bancada: true, destacado: "Cambió de bancada. Involucrada en polémicas mediáticas." },
    5594: { bancada: "Fuerza Popular", proyectos: 34, asistencia: 86, comisiones: ["Presupuesto", "Economía"], cambio_bancada: false, destacado: "Vocero de Fuerza Popular. Perfil técnico en temas económicos." },
    5975: { bancada: "Fuerza Popular", proyectos: 11, asistencia: 70, comisiones: ["Mujer"], cambio_bancada: false, destacado: "" },
    6080: { bancada: "Podemos Perú", proyectos: 18, asistencia: 72, comisiones: ["Cultura"], cambio_bancada: false, destacado: "" },
    6245: { bancada: "Fuerza Popular", proyectos: 15, asistencia: 74, comisiones: ["Salud"], cambio_bancada: false, destacado: "" },

    // ═══ Andean Parliament candidates (2) ═══
    6571: { bancada: "Avanza País", proyectos: 12, asistencia: 80, comisiones: ["Relaciones Exteriores"], cambio_bancada: false, destacado: "Representante en Parlamento Andino." },
    6679: { bancada: "Podemos Perú", proyectos: 8, asistencia: 68, comisiones: ["Relaciones Exteriores"], cambio_bancada: false, destacado: "" },
};

// Congress members NOT found in JNE candidate database:
// Senators: Aguinaga, Bustamante, Waldemar Cerrón, Nilza Chacón, Cueto, Cutipa,
//           José Elías, Alex Flores, Víctor Flores, Gonza, Jáuregui, Jenny López,
//           Isaac Mita, Jorge Morante, Eduardo Salhuana, Rocío Torres, Elías Varas,
//           Héctor Ventura
// Deputies: Luis Aragón, Óscar Zea, Jorge Zeballos, Ana Zegarra

function isCongressMember(candidateId) {
    return !!CONGRESS_MEMBER_IDS[candidateId];
}

function getCongressInfo(candidateId) {
    return CONGRESS_MEMBER_IDS[candidateId] || null;
}

module.exports = { CONGRESS_MEMBER_IDS, isCongressMember, getCongressInfo };
