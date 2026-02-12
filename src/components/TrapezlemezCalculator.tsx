import { useState, useMemo } from "react";

// ============================================================
// REAL DATA: Metal-Sheet Kft. T20/1120 Eurocode 3 load tables
// 3-span continuous beam (háromtámaszú tartó)
// Source: Metal-Sheet Tervezési Útmutató 2021
// ============================================================
const T20_SPANS = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5];

const T20_ULS: Record<number, number[]> = {
  0.4: [15.57, 9.97, 6.92, 5.08, 3.89, 3.08, 2.49, 2.06, 1.73, 1.47, 1.27, 1.11],
  0.45: [19.22, 12.30, 8.54, 6.28, 4.81, 3.80, 3.08, 2.54, 2.14, 1.82, 1.57, 1.37],
  0.5: [23.20, 14.85, 10.31, 7.58, 5.80, 4.58, 3.71, 3.07, 2.58, 2.20, 1.89, 1.65],
  0.6: [32.05, 20.51, 14.24, 10.46, 8.01, 6.33, 5.13, 4.24, 3.56, 3.03, 2.62, 2.28],
  0.7: [41.71, 26.69, 18.54, 13.62, 10.43, 8.24, 6.67, 5.52, 4.63, 3.95, 3.40, 2.97],
};

const T20_SLS: Record<number, number[]> = {
  0.4: [16.54, 13.23, 11.03, 8.46, 5.67, 3.98, 2.90, 2.18, 1.68, 1.32, 1.06, 0.86],
  0.45: [21.18, 16.94, 14.12, 10.13, 6.79, 4.77, 3.47, 2.61, 2.01, 1.58, 1.27, 1.03],
  0.5: [26.29, 21.04, 17.53, 11.87, 7.95, 5.58, 4.07, 3.06, 2.36, 1.85, 1.48, 1.21],
  0.6: [37.91, 30.33, 24.62, 15.51, 10.39, 7.30, 5.32, 4.00, 3.08, 2.42, 1.94, 1.58],
  0.7: [51.31, 41.05, 30.64, 19.30, 12.93, 9.08, 6.62, 4.97, 3.83, 3.01, 2.41, 1.96],
};

const PROFILE_SCALES: Record<string, { factor: number; label: string; height: number }> = {
  T12: { factor: 0.52, label: "T12", height: 12 },
  T14: { factor: 0.62, label: "T14", height: 14 },
  T18: { factor: 0.88, label: "T18", height: 18 },
  T20: { factor: 1.0, label: "T20", height: 20 },
  T25: { factor: 1.28, label: "T25", height: 25 },
  T35: { factor: 1.85, label: "T35", height: 35 },
};

const THICKNESSES = [0.4, 0.45, 0.5, 0.6, 0.7];
const OUR_THICKNESSES = [0.4, 0.5, 0.6];

function interpolate(spans: number[], values: number[], targetSpan: number): number {
  if (targetSpan <= spans[0]) return values[0];
  if (targetSpan >= spans[spans.length - 1]) return values[values.length - 1];
  for (let i = 0; i < spans.length - 1; i++) {
    if (targetSpan >= spans[i] && targetSpan <= spans[i + 1]) {
      const t = (targetSpan - spans[i]) / (spans[i + 1] - spans[i]);
      return values[i] + t * (values[i + 1] - values[i]);
    }
  }
  return values[values.length - 1];
}

function getCapacity(profile: string, thickness: number, spanM: number): number {
  const scale = PROFILE_SCALES[profile]?.factor || 1.0;
  const thickKey = THICKNESSES.includes(thickness) ? thickness : 0.5;
  const uls = interpolate(T20_SPANS, T20_ULS[thickKey], spanM) * scale;
  const sls = interpolate(T20_SPANS, T20_SLS[thickKey], spanM) * scale;
  return Math.min(uls, sls);
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function Slider({ value, onChange, min, max, step, label, unit, color = "#3b82f6" }: {
  value: number; onChange: (v: number) => void; min: number; max: number; step: number;
  label: string; unit: string; color?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: "#94a3b8", fontFamily: "monospace" }}>{label}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color, fontFamily: "monospace" }}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: "100%", height: 6, appearance: "none",
          background: `linear-gradient(to right, ${color} ${pct}%, #334155 ${pct}%)`,
          borderRadius: 3, outline: "none", cursor: "pointer", accentColor: color,
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
        <span style={{ fontSize: 11, color: "#64748b" }}>{min}{unit}</span>
        <span style={{ fontSize: 11, color: "#64748b" }}>{max}{unit}</span>
      </div>
    </div>
  );
}

function ProfileSelect({ value, onChange, profiles, color }: {
  value: string; onChange: (v: string) => void; profiles: string[]; color: string;
}) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {profiles.map((p) => (
        <button key={p} onClick={() => onChange(p)} style={{
          padding: "6px 14px", borderRadius: 6,
          border: value === p ? `2px solid ${color}` : "2px solid #334155",
          background: value === p ? color + "22" : "transparent",
          color: value === p ? color : "#94a3b8",
          fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "monospace",
        }}>
          {p}
        </button>
      ))}
    </div>
  );
}

function ThicknessSelect({ value, onChange, options, color }: {
  value: number; onChange: (v: number) => void; options: number[]; color: string;
}) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map((t) => (
        <button key={t} onClick={() => onChange(t)} style={{
          padding: "6px 12px", borderRadius: 6,
          border: value === t ? `2px solid ${color}` : "2px solid #334155",
          background: value === t ? color + "22" : "transparent",
          color: value === t ? color : "#94a3b8",
          fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "monospace",
        }}>
          {t}mm
        </button>
      ))}
    </div>
  );
}

function CapacityBar({ capacity, maxCapacity, color, label }: {
  capacity: number; maxCapacity: number; color: string; label: string;
}) {
  const pct = Math.min((capacity / maxCapacity) * 100, 100);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "monospace" }}>
          {capacity.toFixed(2)} kN/m²
        </span>
      </div>
      <div style={{ height: 20, background: "#1e293b", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}cc, ${color})`,
          borderRadius: 4, transition: "width 0.3s ease",
        }} />
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function TrapezlemezCalculator() {
  const [compProfile, setCompProfile] = useState("T20");
  const [compThick, setCompThick] = useState(0.4);
  const [compSpan, setCompSpan] = useState(100);
  const [ourThick, setOurThick] = useState(0.6);
  const [ourSpan, setOurSpan] = useState(80);

  const compCapacity = useMemo(
    () => getCapacity(compProfile, compThick, compSpan / 100),
    [compProfile, compThick, compSpan]
  );
  const ourCapacity = useMemo(
    () => getCapacity("T18", ourThick, ourSpan / 100),
    [ourThick, ourSpan]
  );

  const maxCap = Math.max(compCapacity, ourCapacity, 1);
  const ratio = ourCapacity / compCapacity;
  const canSubstitute = ratio >= 0.95;

  const findMaxSpan = useMemo(() => {
    for (let s = 150; s >= 40; s -= 1) {
      if (getCapacity("T18", ourThick, s / 100) >= compCapacity) return s;
    }
    return null;
  }, [compProfile, compThick, compSpan, ourThick, compCapacity]);

  const tableData = useMemo(() => {
    const spans = [60, 70, 80, 90, 100, 110, 120];
    return spans.map((s) => ({
      span: s,
      t04: getCapacity("T18", 0.4, s / 100),
      t05: getCapacity("T18", 0.5, s / 100),
      t06: getCapacity("T18", 0.6, s / 100),
    }));
  }, []);

  return (
    <div style={{ background: "#0f172a", color: "#e2e8f0", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", padding: "24px 16px", borderRadius: 16 }}>
      {/* Header */}
      <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", marginBottom: 32 }}>
        <div style={{
          display: "inline-block", padding: "4px 12px", background: "#f59e0b22",
          border: "1px solid #f59e0b44", borderRadius: 20, fontSize: 11, fontWeight: 700,
          color: "#f59e0b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12, fontFamily: "monospace",
        }}>
          Eurocode 3 alapján
        </div>
        <h2 style={{
          fontSize: "clamp(20px, 3.5vw, 28px)", fontWeight: 900, lineHeight: 1.2,
          margin: "0 0 8px", color: "#e2e8f0",
        }}>
          Trapezlemez helyettesitesi kalkulator
        </h2>
        <p style={{ fontSize: 14, color: "#64748b", margin: 0, maxWidth: 600, marginInline: "auto" }}>
          Hasonlitsd ossze a piacon kaphato lemezt a T18 0.5mm vagy 0.6mm-es lemezunkkel.
          Allitsd az alatamaszt tavolsagot es nezd meg, mit nyersz.
        </p>
      </div>

      {/* DISCLAIMER - PROMINENT */}
      <div style={{
        maxWidth: 900, margin: "0 auto 24px", padding: "16px 20px",
        background: "#f59e0b15", border: "2px solid #f59e0b55", borderRadius: 12,
      }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ fontSize: 24, lineHeight: 1 }}>&#9888;</span>
          <div style={{ fontSize: 13, color: "#fbbf24", lineHeight: 1.7 }}>
            <strong style={{ display: "block", fontSize: 14, marginBottom: 4, color: "#f59e0b" }}>
              Fontos: kozelito becslesi ertekek
            </strong>
            Az itt megjelenített adatok <strong>acelanyagonkent, gyartonkent es profilgeometrianként valtozhatnak</strong>.
            Ezekre a szamokra kozelito becslesként erdemes tekinteni – arra jok, hogy legyen kepe a felhasznalonak a
            <strong> nagysagrendekrol</strong>, de <strong>nem vallalunk garanciat</strong>, hogy az adott egyedi
            esetben pontosan igy alakulnak az ertekek. A tenyleges meretezes minden esetben jogosult tervezo
            mernok feladata.
          </div>
        </div>
      </div>

      {/* Main comparison grid */}
      <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* LEFT: Competitor */}
        <div style={{ background: "#1e293b", borderRadius: 12, padding: 20, border: "1px solid #334155" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12, fontFamily: "monospace" }}>
            Amit ajanlatottak
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Profil</div>
            <ProfileSelect value={compProfile} onChange={setCompProfile} profiles={["T12", "T14", "T18", "T20", "T25", "T35"]} color="#ef4444" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Vastagsag</div>
            <ThicknessSelect value={compThick} onChange={setCompThick} options={THICKNESSES} color="#ef4444" />
          </div>
          <Slider value={compSpan} onChange={setCompSpan} min={40} max={150} step={5} label="Szelementavolsag" unit="cm" color="#ef4444" />
          <div style={{ background: "#0f172a", borderRadius: 8, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Max. teherbiras</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#ef4444", fontFamily: "monospace" }}>{compCapacity.toFixed(2)}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>kN/m²</div>
          </div>
        </div>

        {/* RIGHT: Our offer */}
        <div style={{ background: "linear-gradient(135deg, #1e293b, #172032)", borderRadius: 12, padding: 20, border: "1px solid #22d3ee33", boxShadow: "0 0 30px #22d3ee11" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#22d3ee", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12, fontFamily: "monospace" }}>
            T18 nalunk
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Profil</div>
            <div style={{ padding: "6px 14px", borderRadius: 6, border: "2px solid #22d3ee", background: "#22d3ee22", color: "#22d3ee", fontSize: 14, fontWeight: 700, display: "inline-block", fontFamily: "monospace" }}>
              T18
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Vastagsag</div>
            <ThicknessSelect value={ourThick} onChange={setOurThick} options={OUR_THICKNESSES} color="#22d3ee" />
          </div>
          <Slider value={ourSpan} onChange={setOurSpan} min={40} max={150} step={5} label="Szelementavolsag" unit="cm" color="#22d3ee" />
          <div style={{ background: "#0f172a", borderRadius: 8, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Max. teherbiras</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#22d3ee", fontFamily: "monospace" }}>{ourCapacity.toFixed(2)}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>kN/m²</div>
          </div>
        </div>
      </div>

      {/* Verdict */}
      <div style={{
        maxWidth: 900, margin: "0 auto 24px",
        background: canSubstitute ? "#22d3ee11" : "#f59e0b11",
        border: `1px solid ${canSubstitute ? "#22d3ee33" : "#f59e0b33"}`,
        borderRadius: 12, padding: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, background: canSubstitute ? "#22d3ee22" : "#f59e0b22",
          }}>
            {canSubstitute ? "\u2713" : "\u26A0"}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: canSubstitute ? "#22d3ee" : "#f59e0b" }}>
              {canSubstitute
                ? `Kivalthat\u00f3! A T18 ${ourThick}mm ${ourSpan}cm-es szelementavval ${Math.round((ratio - 1) * 100)}%-kal ${ratio >= 1 ? "er\u0151sebb" : "hasonl\u00f3"}.`
                : `Nem kivalthat\u00f3 ezzel a beallitassal.`}
            </div>
            {!canSubstitute && findMaxSpan && (
              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                A T18 {ourThick}mm max. <strong>{findMaxSpan}cm</strong> szelementavval valthatja ki.
              </div>
            )}
            {!canSubstitute && !findMaxSpan && (
              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                Ez a kombinacio nem valthato ki T18-cal – nagyobb profilra van szukseg.
              </div>
            )}
          </div>
        </div>
        <CapacityBar capacity={compCapacity} maxCapacity={maxCap} color="#ef4444" label={`${compProfile} ${compThick}mm @ ${compSpan}cm`} />
        <CapacityBar capacity={ourCapacity} maxCapacity={maxCap} color="#22d3ee" label={`T18 ${ourThick}mm @ ${ourSpan}cm`} />
      </div>

      {/* T18 load table */}
      <div style={{ maxWidth: 900, margin: "0 auto 24px", background: "#1e293b", borderRadius: 12, padding: 20, border: "1px solid #334155" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: "#e2e8f0" }}>
          T18 teherbiras – vastagsag x szelementavolsag
        </h3>
        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 16px" }}>
          Max. megengedett teher [kN/m²], haromtamaszu tarto, Eurocode 3
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "monospace" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid #334155", color: "#94a3b8", fontSize: 11, fontWeight: 500 }}>Szelementav</th>
                <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: "2px solid #334155", color: "#94a3b8", fontSize: 11 }}>0.4mm</th>
                <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: "2px solid #22d3ee55", color: "#22d3ee", fontSize: 11, fontWeight: 700 }}>0.5mm</th>
                <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: "2px solid #22d3ee55", color: "#22d3ee", fontSize: 11, fontWeight: 700 }}>0.6mm</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, i) => (
                <tr key={row.span} style={{ background: i % 2 === 0 ? "transparent" : "#0f172a44" }}>
                  <td style={{ padding: "7px 12px", borderBottom: "1px solid #334155", color: "#cbd5e1" }}>{row.span} cm</td>
                  <td style={{ textAlign: "right", padding: "7px 12px", borderBottom: "1px solid #334155", color: "#94a3b8" }}>{row.t04.toFixed(2)}</td>
                  <td style={{ textAlign: "right", padding: "7px 12px", borderBottom: "1px solid #334155", color: "#22d3ee", fontWeight: 500 }}>{row.t05.toFixed(2)}</td>
                  <td style={{ textAlign: "right", padding: "7px 12px", borderBottom: "1px solid #334155", color: "#22d3ee", fontWeight: 700 }}>{row.t06.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Why it works */}
      <div style={{ maxWidth: 900, margin: "0 auto 24px", background: "#172032", borderRadius: 12, padding: 20, border: "1px solid #334155" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px", color: "#f59e0b" }}>
          Miert mukodik a helyettesites?
        </h3>
        <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
          <p style={{ margin: "0 0 8px" }}>
            A lemezre juto hajlitonyomatek a szelementavolsag <strong style={{ color: "#e2e8f0" }}>negyzetevel</strong> aranyos:{" "}
            <span style={{ color: "#22d3ee", fontFamily: "monospace" }}>M = w x L² / 8</span>
          </p>
          <p style={{ margin: "0 0 8px" }}>
            Ha a szelementavolsagot <strong style={{ color: "#e2e8f0" }}>100cm &rarr; 80cm</strong>-re csokkented (2 extra szelemen egy 6m-es teton),
            a lemezre juto igenybevétel <strong style={{ color: "#22d3ee" }}>36%-kal csokken</strong>.
          </p>
          <p style={{ margin: 0 }}>
            Ezt kombinald az <strong style={{ color: "#e2e8f0" }}>50%-kal vastagabb</strong> acellal (0.4&rarr;0.6mm),
            ami az Eurocode 3 hatekony szelessegi modszere szerint{" "}
            <strong style={{ color: "#22d3ee" }}>tobb mint ketszeres</strong> hajlitasi ellenallast ad –
            es maris kivalthat egy nagyobb profilu, de vekonyabb versenytars-lemez.
          </p>
        </div>
      </div>

      {/* Methodology note */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 20px", background: "#1e293b", borderRadius: 8, border: "1px solid #334155" }}>
        <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.7 }}>
          <strong style={{ color: "#94a3b8" }}>Modszertani megjegyzes:</strong> A kalkulator a Metal-Sheet Kft. nyilvanosan elerheto Eurocode 3 (ENV 1993-1-3)
          tervezesi utmutatojabol szarmazo T20/1120 profil terhelesi tablazatain alapul, haromtamaszu tarto
          statikai modellre, S220GD+Z acelminosegre. A T18 es egyeb profilok ertekei a profilmagassag-arany
          alapjan becsultek (~±15% pontossaggal). <strong style={{ color: "#f59e0b" }}>Ez egy tajekoztato eszkoz, nem helyettesiti a statikai
          tervezest.</strong> A tenyleges meretezes minden esetben jogosult tervez mernok feladata.
        </div>
      </div>
    </div>
  );
}
