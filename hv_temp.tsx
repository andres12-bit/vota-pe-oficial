'use client';

import { useState, useEffect } from 'react';
import { Candidate, getCandidate } from '@/lib/api';
import { getCandidatePhoto, getPhotoFallback, getAvatarUrl } from '@/lib/avatars';
import Link from 'next/link';
import { use } from 'react';
import NavHeader from '@/components/NavHeader';
import SiteFooter from '@/components/SiteFooter';

// Collapsible section like JNE
function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={{ marginBottom: 16 }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#4B5563', color: '#fff', padding: '10px 16px', border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase',
                    borderRadius: open ? '6px 6px 0 0' : 6,
                }}
            >
                <span>{title}</span>
                <span style={{ fontSize: 18, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
            </button>
            {open && (
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 6px 6px', padding: '12px 16px' }}>
                    {children}
                </div>
            )}
        </div>
    );
}

function EmptyRow() {
    return <tr><td colSpan={10} style={{ textAlign: 'center', color: '#9ca3af', padding: 14, fontStyle: 'italic', fontSize: 13 }}>No registra información</td></tr>;
}

const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 13 };
const thStyle: React.CSSProperties = { background: '#f3f4f6', padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', borderBottom: '2px solid #e5e7eb', color: '#374151' };
const tdStyle: React.CSSProperties = { padding: '8px 10px', borderBottom: '1px solid #f3f4f6', color: '#1f2937' };

export default function HojaDeVidaPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await getCandidate(parseInt(id));
                setCandidate(data);
            } catch (e) { console.error(e); }
            setLoading(false);
        }
        load();
    }, [id]);

    if (loading) return (
        <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div className="w-14 h-14 rounded-full border-2 border-t-transparent animate-spin mx-auto" style={{ borderColor: 'var(--vp-red)', borderTopColor: 'transparent' }} />
                <p className="mt-4 text-sm font-semibold" style={{ color: 'var(--vp-text-dim)' }}>Cargando Hoja de Vida...</p>
            </div>
        </div>
    );

    if (!candidate) return (
        <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
                <div style={{ color: 'var(--vp-text-dim)', fontSize: 14 }}>Candidato no encontrado</div>
                <Link href="/" style={{ color: '#bc1d19', marginTop: 12, display: 'inline-block' }}>← Volver</Link>
            </div>
        </div>
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hv = (candidate as any).hoja_de_vida || {};
    const edu = hv.education || {};
    const finances = hv.finances || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sex = (candidate as any).sex === '1' ? 'Masculino' : (candidate as any).sex === '2' ? 'Femenino' : '—';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cargo = (candidate as any).cargo || candidate.position;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const partyJneName = (candidate as any).party_jne_name || candidate.party_name;

    const photoUrl = candidate.photo ? getCandidatePhoto(candidate.photo, candidate.name) : getCandidatePhoto(null, candidate.name);

    return (
        <div style={{ minHeight: '100vh', background: 'transparent' }}>
            <NavHeader />

            {/* Back navigation */}
            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '12px 20px' }}>
                <Link href={`/candidate/${id}`} style={{ color: '#bc1d19', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
                    ← Volver al perfil del candidato
                </Link>
            </div>

            {/* Main content */}
            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px 40px' }}>

                {/* Candidate Header Card */}
                <div style={{ background: '#fff', borderRadius: 8, padding: 24, marginBottom: 20, border: '1px solid #e5e7eb', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    {/* Photo */}
                    <div style={{ width: 140, height: 175, borderRadius: 6, overflow: 'hidden', border: '2px solid #e5e7eb', flexShrink: 0 }}>
                        <img
                            src={photoUrl}
                            alt={candidate.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { const fb = getPhotoFallback((e.target as HTMLImageElement).src); if (fb && !(e.target as HTMLImageElement).dataset.retried) { (e.target as HTMLImageElement).dataset.retried = '1'; (e.target as HTMLImageElement).src = fb; } else { (e.target as HTMLImageElement).src = getAvatarUrl(candidate.name, 140, candidate.party_color); } }}
                        />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 300 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            {candidate.party_logo && (
                                <img src={candidate.party_logo} alt="" style={{ width: 30, height: 30, borderRadius: 4 }}
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            )}
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: 0, textTransform: 'uppercase' }}>
                                {candidate.name}
                            </h1>
                        </div>
                        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12, fontWeight: 500 }}>
                            {partyJneName}
                        </div>

                        {/* Data grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: 13 }}>
                            <div>
                                <span style={{ color: '#9ca3af', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Cargo al que postula:</span>
                                <div style={{ color: '#111', fontWeight: 600, marginTop: 2 }}>{(cargo || '').toUpperCase()}</div>
                            </div>
                            <div>
                                <span style={{ color: '#9ca3af', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Sexo:</span>
                                <div style={{ color: '#111', fontWeight: 500, marginTop: 2 }}>{sex}</div>
                            </div>
                            <div>
                                <span style={{ color: '#9ca3af', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>DNI:</span>
                                <div style={{ color: '#111', fontWeight: 500, marginTop: 2 }}>{candidate.dni || '—'}</div>
                            </div>
                            <div>
                                <span style={{ color: '#9ca3af', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Región:</span>
                                <div style={{ color: '#111', fontWeight: 500, marginTop: 2 }}>{candidate.region}</div>
                            </div>
                            <div>
                                <span style={{ color: '#9ca3af', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Estado:</span>
                                <div style={{
                                    color: (candidate as any).jne_status === 'INSCRITO' ? '#16a34a' : '#dc2626',
                                    fontWeight: 600, marginTop: 2
                                }}>{(candidate as any).jne_status || 'INSCRITO'}</div>
                            </div>
                            <div>
                                <span style={{ color: '#9ca3af', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Organización Política:</span>
                                <div style={{ color: '#111', fontWeight: 500, marginTop: 2 }}>{candidate.party_name}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* JNE Data Source Notice */}
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>ℹ️</span>
                    <div style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.5 }}>
                        <strong>Fuente de datos:</strong> Toda la información de esta hoja de vida proviene del portal{' '}
                        <a href="https://votoinformado.jne.gob.pe" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', fontWeight: 600 }}>Voto Informado del Jurado Nacional de Elecciones (JNE)</a>.
                        Es de acceso público y se presenta con fines informativos y educativos. PulsoElectoral.pe no modifica, valida ni garantiza la veracidad de esta información.
                    </div>
                </div>

                {/* EDUCACIÓN BÁSICA */}
                <Section title="Educación Básica">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, fontSize: 13 }}>
                        <div style={{ textAlign: 'center', padding: 10, background: '#f9fafb', borderRadius: 6 }}>
                            <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>PRIMARIA</div>
                            <div style={{ fontWeight: 600, color: '#16a34a' }}>Sí</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: 10, background: '#f9fafb', borderRadius: 6 }}>
                            <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>SECUNDARIA</div>
                            <div style={{ fontWeight: 600, color: '#16a34a' }}>Sí</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: 10, background: '#f9fafb', borderRadius: 6 }}>
                            <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>¿CUENTA CON EDUCACIÓN BÁSICA?</div>
                            <div style={{ fontWeight: 600, color: '#16a34a' }}>Sí</div>
                        </div>
                    </div>
                </Section>

                {/* ESTUDIOS TÉCNICOS */}
                <Section title="Estudios Técnicos">
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Centro de Estudios</th>
                                <th style={thStyle}>Especialidad</th>
                                <th style={thStyle}>Concluido</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(edu.technical && edu.technical.length > 0 && edu.technical.some((t: any) => t.institution || t.specialty)) ? (
                                edu.technical.filter((t: any) => t.institution || t.specialty).map((t: any, i: number) => (
                                    <tr key={i}>
                                        <td style={tdStyle}>{t.institution || '—'}</td>
                                        <td style={tdStyle}>{t.specialty || '—'}</td>
                                        <td style={tdStyle}>{t.completed ? 'Sí' : 'No'}</td>
                                    </tr>
                                ))
                            ) : <EmptyRow />}
                        </tbody>
                    </table>
                </Section>

                {/* ESTUDIOS UNIVERSITARIOS */}
                <Section title="Estudios Universitarios">
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Universidad</th>
                                <th style={thStyle}>Grado</th>
                                <th style={thStyle}>Concluido</th>
                                <th style={thStyle}>Año</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(edu.university && edu.university.length > 0 && edu.university.some((u: any) => u.institution || u.degree)) ? (
                                edu.university.filter((u: any) => u.institution || u.degree).map((u: any, i: number) => (
                                    <tr key={i}>
                                        <td style={tdStyle}>{u.institution || '—'}</td>
                                        <td style={tdStyle}>{u.degree || u.specialty || '—'}</td>
                                        <td style={tdStyle}>{u.completed ? 'Sí' : 'No'}</td>
                                        <td style={tdStyle}>{u.year || '—'}</td>
                                    </tr>
                                ))
                            ) : <EmptyRow />}
                        </tbody>
                    </table>
                </Section>

                {/* POSTGRADO */}
                <Section title="Estudios de Postgrado">
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Centro de Estudios</th>
                                <th style={thStyle}>Especialidad</th>
                                <th style={thStyle}>Grado</th>
                                <th style={thStyle}>Concluido</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(edu.postgraduate && edu.postgraduate.length > 0 && edu.postgraduate.some((p: any) => p.institution || p.specialty)) ? (
                                edu.postgraduate.filter((p: any) => p.institution || p.specialty).map((p: any, i: number) => (
                                    <tr key={i}>
                                        <td style={tdStyle}>{p.institution || '—'}</td>
                                        <td style={tdStyle}>{p.specialty || '—'}</td>
                                        <td style={tdStyle}>{p.degree || '—'}</td>
                                        <td style={tdStyle}>{p.completed ? 'Sí' : 'No'}</td>
                                    </tr>
                                ))
                            ) : <EmptyRow />}
                        </tbody>
                    </table>
                </Section>

                {/* EXPERIENCIA LABORAL */}
                <Section title="Experiencia Laboral">
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Ocupación / Cargo</th>
                                <th style={thStyle}>Centro de Trabajo</th>
                                <th style={thStyle}>Periodo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(hv.work_experience && hv.work_experience.length > 0) ? (
                                hv.work_experience.map((w: any, i: number) => (
                                    <tr key={i}>
                                        <td style={tdStyle}>{w.position || '—'}</td>
                                        <td style={tdStyle}>{w.employer || '—'}</td>
                                        <td style={tdStyle}>{w.period || (w.start_year ? `${w.start_year} - ${w.end_year || 'Actualidad'}` : '—')}</td>
                                    </tr>
                                ))
                            ) : <EmptyRow />}
                        </tbody>
                    </table>
                </Section>

                {/* CARGOS PARTIDARIOS */}
                <Section title="Cargos Partidarios o de Elección Popular">
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Organización Política</th>
                                <th style={thStyle}>Cargo</th>
                                <th style={thStyle}>Año Inicio</th>
                                <th style={thStyle}>Año Fin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(hv.political_history && hv.political_history.length > 0 && hv.political_history.some((p: any) => p.organization || p.position)) ? (
                                hv.political_history.filter((p: any) => p.organization || p.position).map((p: any, i: number) => (
                                    <tr key={i}>
                                        <td style={tdStyle}>{p.organization || '—'}</td>
                                        <td style={tdStyle}>{p.position || '—'}</td>
                                        <td style={tdStyle}>{p.start_year || '—'}</td>
                                        <td style={tdStyle}>{p.end_year || '—'}</td>
                                    </tr>
                                ))
                            ) : <EmptyRow />}
                        </tbody>
                    </table>
                </Section>

                {/* RENUNCIAS */}
                <Section title="Renuncias a Organizaciones Políticas" defaultOpen={false}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Organización Política</th>
                                <th style={thStyle}>Año</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(hv.resignations && hv.resignations.length > 0 && hv.resignations.some((r: any) => r.organization)) ? (
                                hv.resignations.filter((r: any) => r.organization).map((r: any, i: number) => (
                                    <tr key={i}>
                                        <td style={tdStyle}>{r.organization || '—'}</td>
                                        <td style={tdStyle}>{r.year || '—'}</td>
                                    </tr>
                                ))
                            ) : <EmptyRow />}
                        </tbody>
                    </table>
                </Section>

                {/* SENTENCIAS */}
                <Section title="Relación de Sentencias">
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Tipo de Sentencia</th>
                                <th style={thStyle}>Nro Expediente</th>
                                <th style={thStyle}>Órgano Judicial</th>
                                <th style={thStyle}>Fallo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(hv.sentences && hv.sentences.length > 0) ? (
                                hv.sentences.map((s: any, i: number) => (
                                    <tr key={i}>
                                        <td style={tdStyle}>{s.type || '—'}</td>
                                        <td style={tdStyle}>{s.case_number || '—'}</td>
                                        <td style={tdStyle}>{s.court || '—'}</td>
                                        <td style={tdStyle}>{s.verdict || '—'}</td>
                                    </tr>
                                ))
                            ) : <EmptyRow />}
                        </tbody>
                    </table>
                </Section>

                {/* INGRESOS */}
                <Section title="Ingresos de Bienes y Rentas">
                    {(() => {
                        const pubIncome = (finances.public_income || 0) + (finances.individual_public || 0) + (finances.other_public || 0);
                        const privIncome = (finances.private_income || 0) + (finances.individual_private || 0) + (finances.other_private || 0);
                        const totalIncome = finances.total_income || (pubIncome + privIncome);
                        const otherIncome = totalIncome - pubIncome - privIncome;
                        return (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                                    <div style={{ background: '#f9fafb', padding: 14, borderRadius: 6, textAlign: 'center' }}>
                                        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Remuneración Bruta (Público)</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: '#1f2937' }}>S/ {pubIncome.toLocaleString()}</div>
                                    </div>
                                    <div style={{ background: '#f9fafb', padding: 14, borderRadius: 6, textAlign: 'center' }}>
                                        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Remuneración Bruta (Privado)</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: '#1f2937' }}>S/ {privIncome.toLocaleString()}</div>
                                    </div>
                                    <div style={{ background: '#f9fafb', padding: 14, borderRadius: 6, textAlign: 'center' }}>
                                        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Otros Ingresos</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: '#1f2937' }}>S/ {(otherIncome > 0 ? otherIncome : 0).toLocaleString()}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', padding: '10px 16px', background: '#fef2f2', borderRadius: 6 }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: '#bc1d19' }}>
                                        Total Ingresos: S/ {totalIncome.toLocaleString()}
                                    </span>
                                </div>
                            </>
                        );
                    })()}
                </Section>

                {/* BIENES */}
                <Section title="Bienes Muebles e Inmuebles" defaultOpen={false}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Tipo de Bien</th>
                                <th style={thStyle}>Descripción</th>
                                <th style={thStyle}>Valor (S/)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Properties */}
                            {(finances.properties && finances.properties.length > 0) ? (
                                finances.properties.map((p: any, i: number) => (
                                    <tr key={`p-${i}`}>
                                        <td style={tdStyle}>{p.type || 'Inmueble'}</td>
                                        <td style={tdStyle}>{p.location || '—'}</td>
                                        <td style={tdStyle}>{(p.value || 0).toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : null}
                            {/* Vehicles */}
                            {(finances.vehicles && finances.vehicles.length > 0) ? (
                                finances.vehicles.map((v: any, i: number) => (
                                    <tr key={`v-${i}`}>
                                        <td style={tdStyle}>Vehículo</td>
                                        <td style={tdStyle}>{v.description || v.plate || '—'}</td>
                                        <td style={tdStyle}>{(v.value || 0).toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : null}
                            {(!finances.properties?.length && !finances.vehicles?.length) && <EmptyRow />}
                        </tbody>
                    </table>
                </Section>

                {/* INFORMACIÓN ADICIONAL */}
                <Section title="Información Adicional" defaultOpen={false}>
                    <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                        {hv.additional_info || 'No registra información adicional.'}
                    </div>
                </Section>

                {/* Plan de Gobierno link */}
                {candidate.plan_gobierno && candidate.plan_gobierno.length > 0 && (
                    <div style={{ background: '#fff', borderRadius: 8, padding: 20, marginTop: 20, border: '1px solid #e5e7eb', textAlign: 'center' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 10 }}>📋 Plan de Gobierno</div>
                        <Link href={`/candidate/${id}`} style={{
                            display: 'inline-block', background: '#bc1d19', color: '#fff', padding: '10px 24px',
                            borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: 13
                        }}>
                            Ver Resumen de Plan de Gobierno →
                        </Link>
                        {candidate.plan_pdf_url && (
                            <a href={candidate.plan_pdf_url} target="_blank" rel="noopener noreferrer" style={{
                                display: 'inline-block', marginLeft: 10, background: '#16a34a', color: '#fff', padding: '10px 24px',
                                borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: 13
                            }}>
                                📄 Descargar PDF
                            </a>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: 30, color: '#9ca3af', fontSize: 12 }}>
                    Fuente: Jurado Nacional de Elecciones — Voto Informado | PulsoElectoral.pe
                </div>
            </div>

            <SiteFooter />
        </div>
    );
}
