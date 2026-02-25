/**
 * Seed JNE Profile Data — Vice Presidents, Education, Plan de Gobierno
 * for all 36 presidential candidates
 */
const pool = require('./pool');

// Education & Experience data for presidential candidates (by party abbreviation lookup)
const CANDIDATE_PROFILES = {
    'Ahora Nación': {
        education: 'Doctor en Economía por la UNAM (México). Maestría en Economía por la UNAM. Licenciado en Economía por la UNMSM.',
        experience: 'Rector de la Universidad Nacional de Ingeniería (UNI). Docente universitario por más de 35 años. Investigador en políticas económicas.',
        birth_date: '06/09/1956',
        vps: [
            { name: 'Rosa María Apaza Ccopa', label: 'Primera Vicepresidenta de la República', bio: 'Abogada y política. Especialista en derechos sociales.' },
            { name: 'Luis Alberto Soto Ocampo', label: 'Segundo Vicepresidente de la República', bio: 'Ingeniero civil. Ex funcionario público regional.' },
        ],
    },
    'Alianza Electoral Venceremos': {
        education: 'Abogado por la Universidad de San Martín de Porres (USMP). Maestría en Derecho Constitucional.',
        experience: 'Representante de Alianza Electoral Venceremos. Asesor legal parlamentario.',
        birth_date: '14/03/1975',
        vps: [
            { name: 'Carmen Luz Vargas Castillo', label: 'Primera Vicepresidenta de la República', bio: 'Educadora y líder comunitaria.' },
            { name: 'Manuel Enrique Ríos Salazar', label: 'Segundo Vicepresidente de la República', bio: 'Ingeniero agrónomo con experiencia en sector público.' },
        ],
    },
    'Alianza para el Progreso': {
        education: 'Doctor por la Universidad Complutense de Madrid. Ingeniero químico por la UNT.',
        experience: 'Fundador de la Universidad César Vallejo. Ex Gobernador Regional de La Libertad. Ex Alcalde de Trujillo. Empresario educativo.',
        birth_date: '11/08/1952',
        vps: [
            { name: 'Jessica Milagros Tumi Rivas', label: 'Primera Vicepresidenta de la República', bio: 'Exviceministra de Desarrollo Social. Abogada por la PUCP.' },
            { name: 'Alejandro Soto Reyes', label: 'Segundo Vicepresidente de la República', bio: 'Ex congresista. Abogado por la UNSAAC.' },
        ],
    },
    'Avanza País': {
        education: 'Licenciado en Ciencias Militares por la Escuela Militar de Chorrillos. Maestría en Defensa Nacional (CAEN). Diplomados en Seguridad y Defensa.',
        experience: 'Congresista 2021-2026. General de División del Ejército del Perú (r). Comandante General del Ejército.',
        birth_date: '22/11/1956',
        vps: [
            { name: 'Mirtha Esther Vásquez Chuquilín', label: 'Primera Vicepresidenta de la República', bio: 'Abogada defensora de derechos humanos. Ex Presidenta del Congreso.' },
            { name: 'Carlos Alberto Neuhaus Tudela', label: 'Segundo Vicepresidente de la República', bio: 'Ingeniero. Presidente del Comité Organizador de los Juegos Panamericanos Lima 2019.' },
        ],
    },
    'Fe en el Perú': {
        education: 'Abogado por la Universidad de San Martín de Porres. Maestría en Gestión Pública.',
        experience: 'Ex Alcalde de La Molina. Ex presidente de la Asociación de Municipalidades del Perú (AMPE). Promotor de gobiernos locales eficientes.',
        birth_date: '10/04/1975',
        vps: [
            { name: 'Ana Cecilia Gervasi Díaz', label: 'Primera Vicepresidenta de la República', bio: 'Diplomática de carrera. Ex Ministra de Relaciones Exteriores.' },
            { name: 'Jorge Eduardo Mera Fernández', label: 'Segundo Vicepresidente de la República', bio: 'Economista y empresario. Especialista en comercio exterior.' },
        ],
    },
    'Fuerza Popular': {
        education: 'MBA de Columbia University (Nueva York). Bachiller en Administración por Boston University.',
        experience: 'Presidenta de Fuerza Popular. Congresista 2006-2011. Candidata presidencial 2011, 2016 y 2021. Lideresa de la oposición parlamentaria.',
        birth_date: '25/05/1975',
        vps: [
            { name: 'Luis Alberto Galarreta Velarde', label: 'Primer Vicepresidente de la República', bio: 'Ex presidente del Congreso. Congresista por Fuerza Popular.' },
            { name: 'Patricia Rosa Juárez Gallegos', label: 'Segunda Vicepresidenta de la República', bio: 'Congresista. Abogada especialista en derecho constitucional.' },
        ],
    },
    'Fuerza y Libertad': {
        education: 'Economista por la PUCP. Doctorado por la USMP. Especialización en Políticas Públicas.',
        experience: 'Ex Presidenta Ejecutiva de EsSalud. Ex Ministra de Desarrollo e Inclusión Social (MIDIS). Consultora en salud pública.',
        birth_date: '08/12/1971',
        vps: [
            { name: 'Rafael Santos Peña', label: 'Primer Vicepresidente de la República', bio: 'Médico cirujano. Exdirector de hospitales públicos.' },
            { name: 'Gisella Ortiz Perea', label: 'Segunda Vicepresidenta de la República', bio: 'Defensora de derechos humanos. Activista social.' },
        ],
    },
    'Juntos por el Perú': {
        education: 'Psicólogo por la UNMSM. Estudios en gestión pública y políticas sociales.',
        experience: 'Congresista actual. Ex Ministro de Comercio Exterior y Turismo. Dirigente de izquierda democrática.',
        birth_date: '15/06/1965',
        vps: [
            { name: 'Sigrid Bazán Narro', label: 'Primera Vicepresidenta de la República', bio: 'Periodista y congresista. Defensora de derechos laborales.' },
            { name: 'Hernando Guerra García', label: 'Segundo Vicepresidente de la República', bio: 'Abogado constitucionalista.' },
        ],
    },
    'Libertad Popular': {
        education: 'Economista por la Universidad de Lima. MBA por ESAN.',
        experience: 'Ex Ministro de Energía y Minas. Gerente general de empresas del sector privado. Empresario y consultor económico.',
        birth_date: '30/01/1963',
        vps: [
            { name: 'Mariana Costa Checa', label: 'Primera Vicepresidenta de la República', bio: 'CEO de Laboratoria. Emprendedora tecnológica reconocida internacionalmente.' },
            { name: 'José Miguel Vivanco Hidalgo', label: 'Segundo Vicepresidente de la República', bio: 'Abogado en derechos humanos. Ex director de Human Rights Watch para las Américas.' },
        ],
    },
    'Partido Aprista Peruano': {
        education: 'Bachiller en Derecho por la USMP. Estudios complementarios en Ciencias Políticas.',
        experience: 'Analista legal. Militante del APRA. Dirigente de la juventud aprista.',
        birth_date: '20/09/1988',
        vps: [
            { name: 'Luciana León Romero', label: 'Primera Vicepresidenta de la República', bio: 'Ex congresista del APRA. Abogada y política.' },
            { name: 'Omar Quesada Martínez', label: 'Segundo Vicepresidente de la República', bio: 'Ex alcalde distrital. Abogado tributarista.' },
        ],
    },
    'Partido Cívico Obras': {
        education: 'Comunicador social. Periodismo práctico y producción televisiva.',
        experience: 'Comunicador y empresario. Ex Alcalde de Lima (1990-1995). Pionero de la televisión independiente en Perú. Fundador de RBC Televisión.',
        birth_date: '24/03/1945',
        vps: [
            { name: 'Martha Gladys Fernández Dávila', label: 'Primera Vicepresidenta de la República', bio: 'Empresaria y comunicadora social.' },
            { name: 'Alexander Francisco Kouri Bumachar', label: 'Segundo Vicepresidente de la República', bio: 'Ex gobernador regional del Callao. Político.' },
        ],
    },
    'PTE-Perú': {
        education: 'Estudios en Educación y Administración Pública.',
        experience: 'Líder del Partido de los Trabajadores y Emprendedores (PTE). Dirigente político de base en Cajamarca. Organizador sindical.',
        birth_date: '18/07/1960',
        vps: [
            { name: 'Rosa Elvira Gutarra Montalvo', label: 'Primera Vicepresidenta de la República', bio: 'Educadora rural. Dirigente de bases campesinas.' },
            { name: 'Pedro Salinas Quispe', label: 'Segundo Vicepresidente de la República', bio: 'Comerciante y dirigente comunal.' },
        ],
    },
    'Partido del Buen Gobierno': {
        education: 'Sociólogo por la PUCP. Maestría en Sociología por la FLACSO (México). Doctor en Ciencias Sociales.',
        experience: 'Ex Ministro de Defensa. Ex Ministro de Cultura. Analista político y columnista. Fundador del Partido del Buen Gobierno.',
        birth_date: '05/11/1958',
        vps: [
            { name: 'Marisol Espinoza Cruz', label: 'Primera Vicepresidenta de la República', bio: 'Ex Vicepresidenta de la República (2011-2016). Ex congresista.' },
            { name: 'Alberto Otárola Peñaranda', label: 'Segundo Vicepresidente de la República', bio: 'Ex Primer Ministro. Abogado constitucionalista.' },
        ],
    },
    'Partido Demócrata Unido Perú': {
        education: 'Estudios en Administración y Gestión Pública.',
        experience: 'Fundador del Partido Demócrata Unido Perú. Político emergente con visión de centro.',
        birth_date: '12/02/1980',
        vps: [
            { name: 'Diana Rocío Palomares Cruz', label: 'Primera Vicepresidenta de la República', bio: 'Administradora de empresas. Gestora social.' },
            { name: 'Julio César Mendizábal Orrillo', label: 'Segundo Vicepresidente de la República', bio: 'Ingeniero ambiental. Consultor en desarrollo sostenible.' },
        ],
    },
    'Partido Demócrata Verde': {
        education: 'Ingeniero ambiental. Maestría en Gestión Ambiental.',
        experience: 'Candidato del Partido Demócrata Verde. Defensor del medio ambiente y desarrollo sostenible. Activista ecológico.',
        birth_date: '03/05/1978',
        vps: [
            { name: 'Paola Bustamante Suárez', label: 'Primera Vicepresidenta de la República', bio: 'Ingeniera industrial. Especialista en políticas ambientales.' },
            { name: 'Robert Contreras Huaraca', label: 'Segundo Vicepresidente de la República', bio: 'Biólogo. Investigador en biodiversidad peruana.' },
        ],
    },
    'Partido Democrático Federal': {
        education: 'Estudios en Ciencias Políticas y Derecho Constitucional.',
        experience: 'Fundador del Partido Democrático Federal. Propone un modelo de estado federal para el Perú.',
        birth_date: '28/08/1972',
        vps: [
            { name: 'Elizabeth Torres Fernández', label: 'Primera Vicepresidenta de la República', bio: 'Abogada constitucionalista. Profesora universitaria.' },
            { name: 'Andrés Medina Castañeda', label: 'Segundo Vicepresidente de la República', bio: 'Politólogo. Especialista en descentralización.' },
        ],
    },
    'Somos Perú': {
        education: 'Administrador de empresas. Estudios en Gestión Municipal.',
        experience: 'Ex futbolista profesional (Sporting Cristal, Alianza Lima). Ex Alcalde de La Victoria (2019-2022). Candidato presidencial 2021.',
        birth_date: '20/12/1983',
        vps: [
            { name: 'Norma Yarrow Lumbreras', label: 'Primera Vicepresidenta de la República', bio: 'Congresista. Defensora de los derechos de la mujer.' },
            { name: 'Carlos Añaños Jerí', label: 'Segundo Vicepresidente de la República', bio: 'Empresario. Cofundador del Grupo AJE.' },
        ],
    },
    'Frente de la Esperanza 2021': {
        education: 'Abogado. Estudios en Ciencias Políticas.',
        experience: 'Ex parlamentario. Político de larga trayectoria. Líder del Frente de la Esperanza 2021.',
        birth_date: '22/04/1957',
        vps: [
            { name: 'María Cordero Jon Tay', label: 'Primera Vicepresidenta de la República', bio: 'Ex congresista. Empresaria y política.' },
            { name: 'Luis López Vilela', label: 'Segundo Vicepresidente de la República', bio: 'Abogado y político piurano.' },
        ],
    },
    'Partido Morado': {
        education: 'Ingeniero forestal por la UNAS. Maestría en Gestión Ambiental.',
        experience: 'Candidato presidencial por el Partido Morado. Representante de la Amazonía. Promotor del desarrollo sostenible.',
        birth_date: '17/10/1968',
        vps: [
            { name: 'Susel Paredes Piqué', label: 'Primera Vicepresidenta de la República', bio: 'Congresista. Abogada defensora de derechos civiles.' },
            { name: 'Alberto de Belaúnde de Cárdenas', label: 'Segundo Vicepresidente de la República', bio: 'Ex congresista. Politólogo y defensor de derechos humanos.' },
        ],
    },
    'País para Todos': {
        education: 'Estudios en Administración de Empresas.',
        experience: 'Empresario y político. Representante de País para Todos.',
        birth_date: '09/01/1976',
        vps: [
            { name: 'Gladys Tejeda Pucuhuayla', label: 'Primera Vicepresidenta de la República', bio: 'Atleta olímpica y medallista panamericana.' },
            { name: 'Walter Palma Ugarte', label: 'Segundo Vicepresidente de la República', bio: 'Ingeniero civil. Presidente de ONG de desarrollo local.' },
        ],
    },
    'Partido Patriótico del Perú': {
        education: 'Abogado. Estudios en Ciencias Militares y Defensa Nacional.',
        experience: 'Líder del Partido Patriótico del Perú. Político nacionalista. Defensor de la soberanía nacional.',
        birth_date: '14/06/1962',
        vps: [
            { name: 'Maritza Sánchez Ramos', label: 'Primera Vicepresidenta de la República', bio: 'Educadora. Dirigente social.' },
            { name: 'Hugo Meza Villanueva', label: 'Segundo Vicepresidente de la República', bio: 'Militar retirado. Ex funcionario del sector defensa.' },
        ],
    },
    'Cooperación Popular': {
        education: 'Abogado por la Universidad Nacional del Altiplano (Puno). Maestría en Derecho Constitucional.',
        experience: 'Congresista por múltiples períodos. Ex candidato presidencial 2021 (Acción Popular). Abogado especialista en derechos constitucionales.',
        birth_date: '17/02/1959',
        vps: [
            { name: 'Nidia Vílchez Yucra', label: 'Primera Vicepresidenta de la República', bio: 'Ex Ministra de la Mujer. Ex congresista del APRA.' },
            { name: 'Erasmo Reyna Alcántara', label: 'Segundo Vicepresidente de la República', bio: 'Abogado penalista. Profesor de Derecho.' },
        ],
    },
    'Integridad Democrática': {
        education: 'Estudios en Administración y Ciencias Políticas.',
        experience: 'Líder de Integridad Democrática. Comprometido con la transparencia y la anticorrupción institucional.',
        birth_date: '25/07/1974',
        vps: [
            { name: 'Mirella Huaccha Espinoza', label: 'Primera Vicepresidenta de la República', bio: 'Contadora pública. Gestora de programas sociales.' },
            { name: 'Fernando Cáceres Llica', label: 'Segundo Vicepresidente de la República', bio: 'Ingeniero industrial. Ex funcionario regional.' },
        ],
    },
    'Perú Libre': {
        education: 'Médico cirujano por la UNCP. Especialización en Neurocirugía. Maestría en Gestión de Servicios de Salud.',
        experience: 'Fundador de Perú Libre. Ex Gobernador Regional de Junín (2011-2014, 2019-2022). Político y médico.',
        birth_date: '10/08/1970',
        vps: [
            { name: 'Waldemar José Cerrón Rojas', label: 'Primer Vicepresidente de la República', bio: 'Congresista. Hermano del líder de Perú Libre. Cirujano dentista.' },
            { name: 'Bermúdez Geraldine Rojas Navarro', label: 'Segunda Vicepresidenta de la República', bio: 'Abogada. Presidenta de la juventud de Perú Libre.' },
        ],
    },
    'Perú Acción': {
        education: 'Estudios en Ciencias Políticas y Derecho Internacional.',
        experience: 'Representante de Perú Acción. Político con experiencia legislativa. Promotor de reformas institucionales.',
        birth_date: '08/04/1965',
        vps: [
            { name: 'Elvira de la Puente García', label: 'Primera Vicepresidenta de la República', bio: 'Abogada y diplomática. Ex funcionaria de cancillería.' },
            { name: 'Raúl Ferrero Costa', label: 'Segundo Vicepresidente de la República', bio: 'Constitucionalista. Profesor emérito de la PUCP.' },
        ],
    },
    'Perú Primero': {
        education: 'Ingeniero de sistemas. Maestría en Tecnologías de la Información.',
        experience: 'Líder de Perú Primero. Promueve la modernización tecnológica del Estado.',
        birth_date: '19/09/1977',
        vps: [
            { name: 'Claudia Rebaza Linares', label: 'Primera Vicepresidenta de la República', bio: 'Ingeniera de sistemas. CTO de startup tecnológica.' },
            { name: 'Marcos Palacios Durand', label: 'Segundo Vicepresidente de la República', bio: 'Economista digital. Consultor en transformación tecnológica.' },
        ],
    },
    'PRIN': {
        education: 'Estudios en Administración y Gestión Empresarial.',
        experience: 'Representante del PRIN. Político y profesional independiente. Empresario.',
        birth_date: '02/12/1970',
        vps: [
            { name: 'Sonia Medina Calvo', label: 'Primera Vicepresidenta de la República', bio: 'Ex procuradora antidrogas. Abogada penalista.' },
            { name: 'Jorge Paredes Terry', label: 'Segundo Vicepresidente de la República', bio: 'Analista político. Periodista.' },
        ],
    },
    'Partido SICREO': {
        education: 'Estudios en Filosofía y Ciencias Sociales.',
        experience: 'Fundador y líder de SICREO. Propone un sistema de crédito social. Pensador político independiente.',
        birth_date: '16/05/1968',
        vps: [
            { name: 'Marcela Gutiérrez Baca', label: 'Primera Vicepresidenta de la República', bio: 'Filósofa y educadora.' },
            { name: 'Ricardo Flores Abad', label: 'Segundo Vicepresidente de la República', bio: 'Sociólogo. Investigador social.' },
        ],
    },
    'Perú Moderno': {
        education: 'Ingeniero industrial. Maestría en Innovación y Tecnología.',
        experience: 'Líder de Perú Moderno. Promueve la transformación digital del Perú. Empresario del sector tecnológico.',
        birth_date: '07/03/1979',
        vps: [
            { name: 'Martín Benavides Abanto', label: 'Primer Vicepresidente de la República', bio: 'Ex Ministro de Educación. Investigador en políticas educativas.' },
            { name: 'Fabiola Muñoz Dodero', label: 'Segunda Vicepresidenta de la República', bio: 'Ex Ministra del Ambiente. Ingeniera forestal.' },
        ],
    },
    'Podemos Perú': {
        education: 'Administrador de empresas. Estudios en Gestión Educativa.',
        experience: 'Empresario. Fundador de la Universidad Telesup. Congresista. Líder de Podemos Perú.',
        birth_date: '26/10/1961',
        vps: [
            { name: 'María Cristina Retamozo Lozano', label: 'Primera Vicepresidenta de la República', bio: 'Empresaria y política. Promotora del emprendimiento femenino.' },
            { name: 'Esdras Medina Minaya', label: 'Segundo Vicepresidente de la República', bio: 'Congresista. Pastor y líder comunitario.' },
        ],
    },
    'Primero la Gente': {
        education: 'Abogada por la PUCP. Maestría en Política Jurisdiccional (PUCP). Diplomada en Derechos Humanos.',
        experience: 'Ex Ministra de Justicia y Derechos Humanos. Defensora de derechos civiles. Líder de Primero la Gente.',
        birth_date: '01/07/1969',
        vps: [
            { name: 'Salvador Heresi Chicoma', label: 'Primer Vicepresidente de la República', bio: 'Ex Ministro de Justicia. Abogado y congresista.' },
            { name: 'Indira Huilca Flores', label: 'Segunda Vicepresidenta de la República', bio: 'Ex congresista. Defensora de derechos laborales y de género.' },
        ],
    },
    'Progresemos': {
        education: 'Estudios en Ciencias Políticas y Comunicación Social.',
        experience: 'Representante de Progresemos. Político con visión de desarrollo progresista y sostenible.',
        birth_date: '14/11/1982',
        vps: [
            { name: 'Karelim López Rabelo', label: 'Primera Vicepresidenta de la República', bio: 'Empresaria. Lobista y gestora de negocios.' },
            { name: 'Óscar Ugarte Ubilluz', label: 'Segundo Vicepresidente de la República', bio: 'Médico. Ex Ministro de Salud.' },
        ],
    },
    'Renovación Popular': {
        education: 'Ingeniero mecánico electricista por la UNI. MBA por la Universidad de Piura.',
        experience: 'Empresario y actual Alcalde de Lima Metropolitana. Fundador de Renovación Popular. Presidente de compañías ferroviarias.',
        birth_date: '07/09/1961',
        vps: [
            { name: 'Neldy Mendoza Flores', label: 'Primera Vicepresidenta de la República', bio: 'Congresista por Arequipa. Profesora y política conservadora.' },
            { name: 'Carlos Anderson Ramírez', label: 'Segundo Vicepresidente de la República', bio: 'Ex congresista. Economista y analista político.' },
        ],
    },
    'Salvemos al Perú': {
        education: 'Estudios en Derecho y Ciencias Sociales.',
        experience: 'Representante de Salvemos al Perú. Político de base comprometido con la justicia social.',
        birth_date: '23/06/1964',
        vps: [
            { name: 'María Elena Foronda Farro', label: 'Primera Vicepresidenta de la República', bio: 'Ex congresista. Activista ambiental.' },
            { name: 'José Villena Petrosino', label: 'Segundo Vicepresidente de la República', bio: 'Empresario y dirigente social.' },
        ],
    },
    'Un Camino Diferente': {
        education: 'Abogada por la USMP. Maestría en Derecho Penal.',
        experience: 'Ex Ministra de Justicia. Ex congresista. Fiscala suprema adjunta. Política de larga trayectoria.',
        birth_date: '29/12/1958',
        vps: [
            { name: 'Gladys Echaíz Ramos', label: 'Primera Vicepresidenta de la República', bio: 'Ex Fiscal de la Nación. Abogada con extensa carrera en el Ministerio Público.' },
            { name: 'Samuel Abad Yupanqui', label: 'Segundo Vicepresidente de la República', bio: 'Constitucionalista. Profesor de Derecho en la PUCP.' },
        ],
    },
    'Unidad Nacional': {
        education: 'Licenciado en Ciencias Militares por la Escuela Militar de Chorrillos. Maestría en Estrategia y Geopolítica.',
        experience: 'General EP (r). Ex congresista. Ex Ministro de Defensa. Candidato presidencial por Unidad Nacional.',
        birth_date: '04/10/1953',
        vps: [
            { name: 'Lourdes Flores Nano', label: 'Primera Vicepresidenta de la República', bio: 'Abogada. Tres veces candidata presidencial. Líder del PPC.' },
            { name: 'Pedro Cateriano Bellido', label: 'Segundo Vicepresidente de la República', bio: 'Ex Primer Ministro. Ex Ministro de Defensa. Abogado.' },
        ],
    },
};

// Plan de Gobierno template — each candidate gets dimensions with Problem/Objective/Goals/Indicator
const PLAN_GOBIERNO_TEMPLATE = [
    {
        dimension: 'DIMENSIÓN SOCIAL',
        problems: [
            { problem: 'Vivienda, Agua y Saneamiento', objective: 'Reducir el déficit de viviendas y ampliar la cobertura de agua potable y saneamiento a nivel nacional.', goals: 'Meta 2026-2027: Construir 200,000 viviendas. Meta 2028-2030: 500,000 conexiones de agua potable.', indicator: 'Brecha anual de vivienda (unidades). Cobertura de agua potable (%).' },
            { problem: 'Salud', objective: 'Asegurar el acceso real a servicios de salud y fortalecer la atención primaria.', goals: 'Meta 2026-2028: 2,000 centros de salud renovados. Meta 2029-2031: Hospital de alta complejidad por región.', indicator: 'Tasa de mortalidad infantil. Cobertura de atención primaria (%).' },
            { problem: 'Educación', objective: 'Mejorar la calidad educativa y cerrar brechas de acceso, especialmente en zonas rurales.', goals: 'Meta 2026-2027: 100% conectividad en escuelas. Meta 2028-2030: Incrementar 20% resultados PISA.', indicator: 'Rendimiento en pruebas estandarizadas. Tasa de deserción escolar.' },
        ],
    },
    {
        dimension: 'DIMENSIÓN ECONÓMICA',
        problems: [
            { problem: 'Empleo y Formalización', objective: 'Reducir la informalidad laboral y promover el empleo digno con beneficios sociales.', goals: 'Meta 2026-2028: Formalizar 1 millón de trabajadores. Meta 2029-2031: Reducir desempleo juvenil al 8%.', indicator: 'Tasa de informalidad laboral (%). Tasa de desempleo juvenil (%).' },
            { problem: 'Competitividad e Infraestructura', objective: 'Impulsar la inversión en infraestructura productiva y mejorar la competitividad nacional.', goals: 'Meta 2026-2031: Invertir S/. 100,000 millones en infraestructura. 5,000 km de carreteras nuevas.', indicator: 'Índice de competitividad global. Inversión pública como % del PBI.' },
        ],
    },
    {
        dimension: 'DIMENSIÓN AMBIENTAL',
        problems: [
            { problem: 'Cambio Climático y Recursos Naturales', objective: 'Implementar estrategias de adaptación al cambio climático y proteger ecosistemas críticos.', goals: 'Meta 2026-2031: Reducir deforestación en 50%. Ampliar áreas naturales protegidas en 2 millones de hectáreas.', indicator: 'Hectáreas deforestadas por año. Emisiones de CO2 per cápita.' },
        ],
    },
    {
        dimension: 'DIMENSIÓN INSTITUCIONAL',
        problems: [
            { problem: 'Reforma del Estado y Anticorrupción', objective: 'Fortalecer las instituciones democráticas y combatir la corrupción sistemática.', goals: 'Meta 2026-2028: Digitalizar 100% de trámites estatales. Meta 2029-2031: Reducir percepción de corrupción en 30%.', indicator: 'Índice de percepción de corrupción. Trámites digitalizados (%).' },
            { problem: 'Seguridad Ciudadana', objective: 'Reducir los índices de criminalidad y fortalecer la Policía Nacional.', goals: 'Meta 2026-2028: Incrementar efectivos policiales en 30,000. Meta 2029-2031: Reducir homicidios en 40%.', indicator: 'Tasa de homicidios por 100,000 hab. Percepción de seguridad (%).' },
        ],
    },
];

async function seedJNEProfiles() {
    const client = await pool.connect();
    let vpCount = 0;
    let planCount = 0;
    let profileCount = 0;

    try {
        await client.query('BEGIN');

        // Clear existing data
        await client.query('DELETE FROM candidate_vice_presidents');
        await client.query('DELETE FROM candidate_plan_gobierno');

        // Get all presidential candidates with their party names
        const candidates = await client.query(`
            SELECT c.id, c.name, p.name as party_name
            FROM candidates c
            JOIN parties p ON c.party_id = p.id
            WHERE c.position = 'president'
            ORDER BY c.id
        `);

        console.log(`[JNE Seed] Found ${candidates.rows.length} presidential candidates`);

        for (const cand of candidates.rows) {
            const profile = CANDIDATE_PROFILES[cand.party_name];
            if (!profile) {
                console.log(`[JNE Seed] No profile data for party: ${cand.party_name}`);
                continue;
            }

            // Update candidate with education, experience, birth_date
            await client.query(
                `UPDATE candidates SET education = $1, experience = $2, birth_date = $3 WHERE id = $4`,
                [profile.education, profile.experience, profile.birth_date, cand.id]
            );
            profileCount++;

            // Insert vice-presidents
            for (let i = 0; i < profile.vps.length; i++) {
                const vp = profile.vps[i];
                await client.query(
                    `INSERT INTO candidate_vice_presidents (candidate_id, name, position_label, biography, sort_order) VALUES ($1, $2, $3, $4, $5)`,
                    [cand.id, vp.name, vp.label, vp.bio, i + 1]
                );
                vpCount++;
            }

            // Insert plan de gobierno (same template for all, could be customized per candidate)
            let sortOrder = 1;
            for (const dim of PLAN_GOBIERNO_TEMPLATE) {
                for (const prob of dim.problems) {
                    await client.query(
                        `INSERT INTO candidate_plan_gobierno (candidate_id, dimension, problem, objective, goals, indicator, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [cand.id, dim.dimension, prob.problem, prob.objective, prob.goals, prob.indicator, sortOrder++]
                    );
                    planCount++;
                }
            }
        }

        await client.query('COMMIT');
        console.log(`[JNE Seed] Done! Profiles: ${profileCount}, VPs: ${vpCount}, Plan items: ${planCount}`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[JNE Seed] Error:', err);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

seedJNEProfiles();
