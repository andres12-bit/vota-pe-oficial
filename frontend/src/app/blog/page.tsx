'use client';

import { useState } from 'react';
import Link from 'next/link';
import NavHeader from '@/components/NavHeader';
import SiteFooter from '@/components/SiteFooter';

interface Article {
    id: string;
    title: string;
    date: string;
    tag: string;
    tagColor: string;
    summary: string;
    content: string;
    source: string;
    icon: string;
    readTime: string;
    image?: string;
}

const ARTICLES: Article[] = [
    {
        id: 'congresistas-reeleccion-2026',
        title: '68 congresistas buscan reelección: ¿qué hicieron en el periodo 2021-2026?',
        date: '19 Marzo 2026',
        tag: 'Investigación',
        tagColor: '#c62828',
        icon: '🏛️',
        readTime: '8 min',
        summary: 'De los 130 congresistas del periodo 2021-2026, 68 se han inscrito como candidatos a diputados para las elecciones 2026. ¿Cuántos proyectos presentaron? ¿Cuál fue su asistencia al pleno?',
        content: 'El periodo congresal 2021-2026 ha sido uno de los más turbulentos de la historia peruana. De los 130 congresistas que iniciaron funciones en julio 2021, 68 buscan la reelección en las elecciones generales 2026, ahora como candidatos a diputados bajo la nueva estructura bicameral.\n\nNuestro análisis exclusivo de datos legislativos revela que el promedio de proyectos de ley presentados por estos 68 congresistas es de 30, con una dispersión notable: mientras algunos superan los 80 proyectos, otros apenas llegan a 5. La asistencia promedio al pleno se ubica en 79%, con congresistas que superan el 95% y otros que no alcanzan el 50%.\n\nUno de los datos más reveladores es el fenómeno del transfuguismo: más de un tercio de los congresistas que buscan reelección cambió de bancada al menos una vez durante el periodo. Este cambio frecuente refleja la fragilidad del sistema de partidos y la desconexión entre la promesa electoral y el ejercicio del cargo.\n\nEn PulsoElectoral.pe hemos lanzado el módulo Memoria Electoral, donde puedes consultar el desempeño legislativo de cada congresista que busca reelección: proyectos presentados, asistencia al pleno, comisiones donde participó, cambios de bancada y datos destacados de su gestión.',
        source: 'Fuente: Congreso de la República — Registro de Asistencia y Producción Legislativa',
    },
    {
        id: 'transfuguismo-congreso-2021-2026',
        title: 'Tránsfugas en el Congreso: el fenómeno del cambio de bancada',
        date: '19 Marzo 2026',
        tag: 'Análisis',
        tagColor: '#e65100',
        icon: '🔄',
        readTime: '7 min',
        summary: 'En el periodo 2021-2026, más de 40 congresistas cambiaron de bancada al menos una vez. ¿Qué partidos perdieron más miembros y cuáles los recibieron?',
        content: 'El transfuguismo parlamentario — el acto de abandonar la bancada por la que un congresista fue elegido — fue un fenómeno endémico en el Congreso 2021-2026. Más de 40 congresistas cambiaron de bancada al menos una vez, algunos hasta dos o tres veces.\n\nLas bancadas más afectadas fueron Perú Libre (que perdió la mayoría de sus miembros en los primeros meses), Acción Popular y Alianza para el Progreso. Por el contrario, bancadas como Bloque Magisterial Popular y algunos grupos independientes crecieron significativamente mediante la recepción de tránsfugas.\n\nEl transfuguismo tiene consecuencias reales para la democracia: debilita la representación (el elector votó por un candidato de una bancada específica), dificulta la gobernabilidad (las correlaciones de fuerza cambian constantemente) y erosiona la confianza ciudadana en el sistema de partidos.\n\nEn PulsoElectoral.pe identificamos a cada congresista que cambió de bancada. En su perfil individual puedes ver su bancada original y su bancada actual, lo que te permite evaluar su coherencia política al momento de decidir tu voto.',
        source: 'Fuente: PUCP — Escuela de Gobierno y Políticas Públicas',
    },
    {
        id: 'memoria-electoral-modulo-lanzamiento',
        title: 'Nuevo módulo: Memoria Electoral — conoce qué hizo tu congresista',
        date: '19 Marzo 2026',
        tag: 'Plataforma',
        tagColor: '#2e7d32',
        icon: '⚡',
        readTime: '4 min',
        summary: 'PulsoElectoral.pe lanza el módulo Memoria Electoral, donde puedes consultar el desempeño legislativo de los 68 congresistas que buscan reelección.',
        content: 'Hoy lanzamos oficialmente el módulo Memoria Electoral en PulsoElectoral.pe, una herramienta diseñada para que los electores puedan evaluar el desempeño legislativo de los congresistas que buscan reelección en las elecciones 2026.\n\nEl módulo incluye datos curados sobre los 68 congresistas del periodo 2021-2026 que se han inscrito como candidatos. Para cada uno puedes consultar: número de proyectos de ley presentados, porcentaje de asistencia al pleno, comisiones parlamentarias donde participó, si cambió de bancada durante el periodo, y un dato destacado de su gestión.\n\nEstos datos fueron recopilados de fuentes oficiales del Congreso de la República y organizaciones de monitoreo legislativo como Transparencia y el proyecto de Datos Abiertos del Congreso. La información está diseñada para complementar los datos de hoja de vida del JNE y nuestro sistema de scoring.\n\nPuedes acceder al módulo desde el menú principal como Memoria Electoral, o directamente en la URL pulsoelectoral.pe/?tab=memoria.',
        source: 'Fuente: PulsoElectoral.pe — Equipo de Desarrollo',
    },
    {
        id: 'bicameralidad-2026',
        title: 'La nueva bicameralidad: ¿qué cambia para el elector?',
        date: 'Marzo 2026',
        tag: 'Educativo',
        tagColor: '#1565c0',
        icon: '🏛️',
        readTime: '7 min',
        summary: 'Con la restitución del Senado aprobada por votación congresal (Ley 31988), los peruanos elegirán por primera vez en décadas tanto senadores como diputados.',
        content: 'Con la restitución del Senado aprobada por votación congresal (Ley 31988), los peruanos elegirán por primera vez en décadas tanto senadores como diputados. El Senado tendrá 60 escaños con distrito nacional único, mientras que los 130 diputados se elegirán por distrito electoral múltiple regional.\n\nEste cambio histórico busca mejorar la calidad legislativa mediante una cámara de revisión que filtre las leyes aprobadas por la Cámara de Diputados. El Senado no podrá originar leyes de presupuesto y tendrá funciones especiales como la ratificación de embajadores y magistrados.\n\nPara el elector, esto significa que ahora tendrá 3 cédulas de votación: una para presidente, una para senadores (lista nacional) y otra para diputados (lista regional). Es fundamental informarse sobre los candidatos en las tres instancias, ya que cada cargo cumple funciones distintas en la estructura del Estado.',
        source: 'Fuente: Ley 31988 — Reforma Constitucional de Bicameralidad',
    },
    {
        id: 'como-evaluar-plan-gobierno',
        title: '¿Cómo evaluar un plan de gobierno?',
        date: 'Marzo 2026',
        tag: 'Educativo',
        tagColor: '#1565c0',
        icon: '📋',
        readTime: '6 min',
        summary: 'Todos los partidos están obligados a presentar un plan de gobierno al JNE. Aprende a leerlo y evaluarlo con criterios objetivos.',
        content: 'Todos los partidos políticos están obligados a presentar un plan de gobierno ante el Jurado Nacional de Elecciones (JNE) como parte de su inscripción electoral. Este documento es público y accesible a través del portal Voto Informado.\n\nUn buen plan de gobierno debe contener: un diagnóstico claro de los problemas del país, objetivos específicos con metas medibles, indicadores de seguimiento, plazos de ejecución y fuentes de financiamiento identificadas. Los planes que solo contienen generalidades o promesas sin sustento técnico deben ser analizados con cautela.\n\nPulsoElectoral.pe evalúa los planes de gobierno de todas las organizaciones políticas en cinco dimensiones: cobertura sectorial, especificidad de propuestas, metas cuantificables, indicadores de seguimiento y coherencia interna. Esta evaluación es algorítmica y transparente, basada exclusivamente en el contenido del documento oficial presentado al JNE.',
        source: 'Fuente: JNE — Portal Voto Informado',
    },
    {
        id: 'hoja-de-vida-candidatos',
        title: '¿Qué es la hoja de vida de un candidato y por qué importa?',
        date: 'Marzo 2026',
        tag: 'Educativo',
        tagColor: '#1565c0',
        icon: '📄',
        readTime: '5 min',
        summary: 'La hoja de vida es la declaración jurada que todo candidato presenta al JNE. Contiene su formación, experiencia y situación legal.',
        content: 'La hoja de vida es un documento de declaración jurada que todo candidato debe presentar al Jurado Nacional de Elecciones como requisito obligatorio para su inscripción. Este documento contiene información verificable sobre la formación académica, experiencia laboral, trayectoria política, situación judicial y declaración de bienes e ingresos del candidato.\n\nEs fundamental revisar la hoja de vida porque permite al elector evaluar la preparación y transparencia de cada candidato. Un candidato que declara estudios, experiencia relevante y un historial limpio demuestra compromiso con la transparencia. Por el contrario, omisiones o inconsistencias deben ser motivo de análisis.\n\nEn PulsoElectoral.pe procesamos las hojas de vida de todos los candidatos inscritos, transformando la información oficial del JNE en un formato visual y comparativo. Nuestra calificación considera educación (25%), experiencia laboral (20%), trayectoria política (15%), situación financiera (10%) y antecedentes judiciales (25%).',
        source: 'Fuente: JNE — Resolución N° 0084-2024-JNE',
    },
    {
        id: 'perfil-candidatos-senado',
        title: 'El perfil de los candidatos al nuevo Senado',
        date: 'Febrero 2026',
        tag: 'Perfiles',
        tagColor: '#7c3aed',
        icon: '🏛️',
        readTime: '6 min',
        summary: 'Más de 700 candidatos postulan al Senado. Analizamos las tendencias generales en formación, edad y distribución regional.',
        content: 'Las elecciones 2026 marcan el regreso del Senado al Perú, con más de 700 candidatos compitiendo por 60 escaños en distrito nacional único. Al analizar las hojas de vida presentadas al JNE, encontramos patrones interesantes sobre quiénes aspiran a representarnos.\n\nEn formación académica, un porcentaje significativo de candidatos cuenta con estudios universitarios completos, y una proporción menor ha cursado postgrados. Sin embargo, también hay candidatos sin educación superior declarada. La diversidad de perfiles es amplia: abogados, ingenieros, empresarios, médicos, profesores y dirigentes sociales.\n\nEn cuanto a experiencia, se observa una mezcla entre candidatos con trayectoria política previa (ex congresistas, ex alcaldes, ex gobernadores) y nuevos actores sin experiencia en cargos públicos. El desafío para el elector es evaluar qué combinación de formación, experiencia e integridad resulta más conveniente para la función senatorial.',
        source: 'Fuente: Hojas de Vida del JNE — Voto Informado',
    },
    {
        id: 'voto-electronico-2026',
        title: '¿Habrá voto electrónico en las elecciones 2026?',
        date: 'Marzo 2026',
        tag: 'Educativo',
        tagColor: '#1565c0',
        icon: '🗳️',
        readTime: '4 min',
        summary: 'La ONPE ha implementado el voto electrónico presencial en diversos distritos del país para agilizar el proceso electoral.',
        content: 'La Oficina Nacional de Procesos Electorales (ONPE) ha venido ampliando progresivamente la implementación del voto electrónico presencial en el Perú. Este sistema busca agilizar el conteo de votos y reducir los errores humanos en las actas de escrutinio.\n\nEl sistema de voto electrónico peruano utiliza una tablet con pantalla táctil donde el elector selecciona su candidato y confirma su voto. El sistema imprime un comprobante de votación que se deposita en un ánfora física como respaldo, garantizando la auditabilidad del proceso.\n\nLa ONPE ha realizado simulacros a nivel nacional para familiarizar a los electores con el nuevo sistema. Si tu mesa de votación utiliza voto electrónico, recibirás instrucciones detalladas por parte de los miembros de mesa. El proceso es intuitivo y seguro, diseñado para que cualquier ciudadano pueda utilizarlo sin dificultad.',
        source: 'Fuente: ONPE — Oficina Nacional de Procesos Electorales',
    },
    {
        id: 'como-votar-informado',
        title: 'Guía para votar informado en las elecciones 2026',
        date: 'Marzo 2026',
        tag: 'Educativo',
        tagColor: '#1565c0',
        icon: '✅',
        readTime: '5 min',
        summary: 'Consejos prácticos para que tu voto refleje una decisión informada basada en datos y propuestas concretas.',
        content: 'Votar informado es un derecho y una responsabilidad cívica. En un escenario electoral con múltiples candidatos y propuestas, es fundamental contar con herramientas que permitan comparar y evaluar objetivamente a quienes aspiran a representarnos.\n\nRecomendaciones para un voto informado: 1) Revisa la hoja de vida del candidato en el portal Voto Informado del JNE. 2) Lee el plan de gobierno de su partido — todos están disponibles en formato PDF en la web del JNE. 3) Verifica si el candidato tiene sentencias judiciales o procesos pendientes. 4) Compara las propuestas entre diferentes candidatos en temas que te importan.\n\nPulsoElectoral.pe nace con el objetivo de democratizar la información electoral. Procesamos datos oficiales del JNE para que cualquier ciudadano pueda evaluar a los candidatos de forma rápida, visual y comparativa. Nuestras calificaciones son algorítmicas, transparentes y no reflejan preferencia política alguna.',
        source: 'Fuente: PulsoElectoral.pe — Metodología de Evaluación',
    },
    {
        id: 'paridad-genero-elecciones',
        title: 'Paridad de género en las elecciones 2026',
        date: 'Febrero 2026',
        tag: 'Perfiles',
        tagColor: '#7c3aed',
        icon: '⚖️',
        readTime: '5 min',
        summary: 'Las elecciones 2026 son las primeras bajo la ley de paridad y alternancia. ¿Cómo se refleja esto en las listas electorales?',
        content: 'La Ley de Paridad y Alternancia (Ley 31030) establece que las listas de candidatos deben incluir 50% de mujeres y 50% de hombres, con alternancia obligatoria en el orden de la lista. Las elecciones 2026 son las primeras donde esta normativa se aplica plenamente a nivel nacional.\n\nAl analizar las listas inscritas ante el JNE, se observa que los partidos han cumplido con la cuota en la composición de sus listas. Sin embargo, la paridad cuantitativa no siempre refleja paridad real: la ubicación en la lista, el respaldo institucional del partido y los recursos de campaña asignados son factores que influyen en las posibilidades reales de elección.\n\nPulsoElectoral.pe permite filtrar y comparar candidatos por género en todas las posiciones (senadores, diputados, parlamento andino), facilitando el análisis de la representación femenina en cada organización política.',
        source: 'Fuente: JNE — Ley 31030 de Paridad y Alternancia',
    },
    {
        id: 'parlamento-andino-2026',
        title: '¿Qué es el Parlamento Andino y por qué votamos por él?',
        date: 'Febrero 2026',
        tag: 'Educativo',
        tagColor: '#1565c0',
        icon: '🌎',
        readTime: '4 min',
        summary: 'Muchos electores desconocen qué es el Parlamento Andino. Aquí te explicamos su función y por qué aparece en tu cédula de votación.',
        content: 'El Parlamento Andino es el órgano deliberante y de control de la Comunidad Andina de Naciones (CAN), integrada por Bolivia, Colombia, Ecuador y Perú. Sus representantes son elegidos por voto popular directo en cada país miembro.\n\nEl Perú elige 5 representantes titulares y 5 suplentes ante el Parlamento Andino. Sus funciones incluyen: promover la integración latinoamericana, armonizar legislaciones entre países miembros, y representar los intereses de los ciudadanos andinos en temas comerciales, ambientales, culturales y de derechos humanos.\n\nAunque el Parlamento Andino no tiene poder legislativo vinculante (sus decisiones son recomendaciones), es un espacio de diplomacia parlamentaria que busca fortalecer la cooperación regional. En PulsoElectoral.pe también evaluamos a los candidatos al Parlamento Andino con los mismos criterios de transparencia que aplicamos a senadores y diputados.',
        source: 'Fuente: Parlamento Andino — parlamento andino.org',
    },
];

const CATEGORIES = ['Todos', 'Investigación', 'Análisis', 'Educativo', 'Perfiles', 'Plataforma'];

export default function BlogPage() {
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

    const filtered = selectedCategory === 'Todos'
        ? ARTICLES
        : ARTICLES.filter(a => a.tag === selectedCategory);

    return (
        <>
            <NavHeader />
            <div className="blog-page">
                {/* Hero */}
                <div className="blog-hero">
                    <div className="blog-hero-content">
                        <span className="blog-hero-badge">📰 Noticias Electorales</span>
                        <h1 className="blog-hero-title">Blog Electoral</h1>
                        <p className="blog-hero-subtitle">
                            Análisis, tendencias y noticias sobre las elecciones generales del Perú 2026.
                            Información basada en fuentes oficiales para tu decisión informada.
                        </p>
                        <div className="blog-hero-stats">
                            <div className="blog-hero-stat">
                                <span className="stat-value">{ARTICLES.length}</span>
                                <span className="stat-label">Artículos</span>
                            </div>
                            <div className="blog-hero-stat">
                                <span className="stat-value">{CATEGORIES.length - 1}</span>
                                <span className="stat-label">Categorías</span>
                            </div>
                            <div className="blog-hero-stat">
                                <span className="stat-value">Diario</span>
                                <span className="stat-label">Actualización</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category filters */}
                <div className="blog-filters-container">
                    <div className="blog-filters">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                className={`blog-filter-btn ${selectedCategory === cat ? 'blog-filter-active' : ''}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Articles grid */}
                <div className="blog-content">
                    <div className="blog-grid">
                        {filtered.map(article => (
                            <article key={article.id} className="blog-card">
                                <div className="blog-card-header">
                                    <span className="blog-card-icon">{article.icon}</span>
                                    <div className="blog-card-meta">
                                        <span className="blog-card-tag" style={{ background: article.tagColor }}>{article.tag}</span>
                                        <span className="blog-card-date">{article.date}</span>
                                    </div>
                                </div>
                                <h2 className="blog-card-title">{article.title}</h2>
                                <p className="blog-card-summary">{article.summary}</p>

                                {expandedArticle === article.id ? (
                                    <div className="blog-card-expanded">
                                        {article.content.split('\n\n').map((p, i) => (
                                            <p key={i} className="blog-card-paragraph">{p}</p>
                                        ))}
                                        <button
                                            className="blog-card-toggle"
                                            onClick={() => setExpandedArticle(null)}
                                        >
                                            Cerrar ↑
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        className="blog-card-toggle"
                                        onClick={() => setExpandedArticle(article.id)}
                                    >
                                        Leer más →
                                    </button>
                                )}

                                <div className="blog-card-footer">
                                    <span className="blog-card-source">{article.source}</span>
                                    <span className="blog-card-readtime">⏱ {article.readTime}</span>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
            <SiteFooter />
        </>
    );
}
