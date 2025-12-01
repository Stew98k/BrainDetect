import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"; //useLocation: prendere i dati passati da Home
import { UserCircle2 } from "lucide-react";
import importedResult from "../data/mock-result.json"; // import del JSON locale

type ViewKey = "ASSIALE" | "CORONALE" | "SAGITTALE";
//Qui definiamo esattamente come e' fatto il JSON e le sue parti. Tipi TypeScript (struttura del JSON)
//Può essere rettangolo o cerchio

type RectB   = { shape: "rect"; x: number; y: number; w: number; h: number };
type CircleB = { shape: "circle"; cx: number; cy: number; r: number };
type Bounding = RectB | CircleB;

//Poi il JSON completo:
type InferenceResult = {
  status: "ok" | "error";
  class: "ill" | "healthy";
  explanation: string;
  bounding?: Bounding | null;
};
//Per evitare che il bounding esca dall immagine.
//Serve perche' le coordinate devono stare tra 0 e 1 (coordinate normalizzate).
//Se arrivano valori tipo 1.2 o -0.3, li blocchiamo.
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

//Questa funzione: validateBounding
//controlla che il bounding esista
//controlla che sia rect o circle
//corregge eventuali fuori-bordo

function validateBounding(b?: Bounding | null): Bounding | null {
  if (!b) return null;
  if (b.shape === "rect") {
    let x = clamp01(b.x);
    let y = clamp01(b.y);
    let w = Math.max(0, b.w);
    let h = Math.max(0, b.h);
    if (x + w > 1) w = 1 - x;
    if (y + h > 1) h = 1 - y;
    return w > 0 && h > 0 ? { shape: "rect", x, y, w, h } : null;
  }
  if (b.shape === "circle") {
    let cx = clamp01(b.cx);
    let cy = clamp01(b.cy);
    let r = Math.max(0, b.r);
    r = Math.min(r, cx, cy, 1 - cx, 1 - cy);
    return r > 0 ? { shape: "circle", cx, cy, r } : null;
  }
  return null;
}

//validateResult
/*Qui facciamo una regola importante:
se status !== "ok" ritorna null
quindi non mostriamo niente
se class !== "ill" niente cerchietto
error  non renderizza nulla
healthy non renderizza overlay
ill renderizza overlay*/

function validateResult(r: any): InferenceResult | null {
  if (r?.status !== "ok") return null;
  return {
    status: "ok",
    class: r?.class === "ill" || r?.class === "healthy" ? r.class : "healthy",
    explanation: r?.explanation ?? "",
    bounding: validateBounding(r?.bounding ?? null),
  };
}

//Prende le immagini dal router state
export default function Review() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { axialUrl, coronalUrl, sagittalUrl, patientDataName } =
    (state || {}) as {
      axialUrl?: string | null;
      coronalUrl?: string | null;
      sagittalUrl?: string | null;
      patientDataName?: string | null;
    };

  useEffect(() => {
    if (!axialUrl && !coronalUrl && !sagittalUrl) navigate("/");
  }, [axialUrl, coronalUrl, sagittalUrl, navigate]);


  const views = useMemo(
    () => ({
      ASSIALE: axialUrl || undefined,
      CORONALE: coronalUrl || undefined,
      SAGITTALE: sagittalUrl || undefined,
    }),
    [axialUrl, coronalUrl, sagittalUrl]
  );

/*Sceglie la vista grande
Avevamo deciso che:
quindi la vista grande e' sempre la prima disponibile, di solito ASSIALE*/
  const firstAvailable = (Object.keys(views) as ViewKey[]).find((k) => views[k]);
  const selected: ViewKey = firstAvailable || "ASSIALE";   // miniature non cliccabili
  const mainUrl = views[selected];

//Carica e valida il JSON
  const [result] = useState<InferenceResult | null>(() => validateResult(importedResult));
//Decide se mostrare il bounding
/*Questo garantisce:
ill cerchio
healthy niente cerchio*/
  const bounding = result && result.class === "ill" ? result.bounding ?? null : null;


  return (
    <div className="min-h-screen w-full bg-white text-black">
      {/* HEADER */}
      <header className="w-full bg-neutral-300 border-b border-neutral-400 relative">
        <div className="mx-auto max-w-6xl px-4">
          <div className="h-14 flex items-center justify-between">
            <div className="text-2xl font-black tracking-tight">BrainDetect</div>
            <div className="absolute left-1/2 -translate-x-1/2">
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span>Dr.Rossi</span>
              <div className="w-8 h-8 rounded-full bg-white/70 border border-neutral-400 grid place-items-center">
                <UserCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* BODY */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* IMMAGINE GRANDE + overlay SOLO se status ok */}
          <div className="rounded-xl border border-neutral-300 bg-black/5 p-3">
            <div className="relative w-full aspect-[3/4] bg-black/80 rounded-lg overflow-hidden">
              {mainUrl ? (
                <>
                  <img
                    src={mainUrl}
                    alt={`Vista ${selected}`}
                    className="absolute inset-0 w-full h-full object-contain"
                  />

                  {/* overlay mostrato solo se result !== null (status ok) */}
                  {bounding && bounding.shape === "rect" && (
                    <div
                      className="absolute border-4 border-yellow-400/90 bg-yellow-400/25 rounded-sm"
                      style={{
                        left: `${bounding.x * 100}%`,
                        top: `${bounding.y * 100}%`,
                        width: `${bounding.w * 100}%`,
                        height: `${bounding.h * 100}%`,
                      }}
                    />
                  )}
                  {bounding && bounding.shape === "circle" && (
                    <div
                      className="absolute border-4 border-yellow-400/90 bg-yellow-400/25 rounded-full"
                      style={{
                        left: `${(bounding.cx - bounding.r) * 100}%`,
                        top: `${(bounding.cy - bounding.r) * 100}%`,
                        width: `${2 * bounding.r * 100}%`,
                        height: `${2 * bounding.r * 100}%`,
                      }}
                    />
                  )}
                </>
              ) : (
                <div className="absolute inset-0 grid place-items-center text-white/60">
                  Nessuna immagine per {selected}
                </div>
              )}
            </div>
          </div>

          {/* COLONNA DESTRA */}
          <div>
            <h2 className="text-xl font-extrabold mb-2">Spiegazione:</h2>

            {/* Mostra la spiegazione SOLO se status ok */}
            {result ? (
              <p className="text-[15px] leading-relaxed text-black/90">
                {result.explanation}
              </p>
            ) : (
              <p className="text-[15px] leading-relaxed text-black/50">
                {/* Vuota o messaggio neutro; se vuoi “non mostrare nulla” elimina questo <p>. */}
              </p>
            )}

            {patientDataName && (
              <p className="mt-2 text-sm text-black/70">
                Dati paziente: <span className="font-medium">{patientDataName}</span>
              </p>
            )}

            <hr className="my-4 border-neutral-400" />

            {/* Miniature NON cliccabili */}
            <div className="flex gap-6">
              {(Object.keys(views) as ViewKey[]).map((k) => (
                <div
                  key={k}
                  className="rounded-lg border border-neutral-400 bg-black/80 p-2 select-none cursor-default"
                  title={`Vista ${k}`}
                >
                  <div className="w-[160px] h-[160px] relative overflow-hidden rounded-md">
                    {views[k] ? (
                      <img
                        src={views[k]}
                        alt={k}
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-white/60 pointer-events-none">
                        N/D
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-xs font-extrabold tracking-wide text-black text-center">
                    {k}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-end">
  <button
  type="button"
  className="rounded-xl bg-neutral-300 border border-neutral-400 shadow px-6 py-3 text-base font-extrabold tracking-wide hover:bg-neutral-200"
  onClick={() => {
    // prendo l’assiale se c’è; se per qualche motivo manca, non navigo
    if (!views.ASSIALE) return;
    navigate("/correction", {
      state: {
        axialUrl: views.ASSIALE,   // object URL passato via router state
        result,                    // il JSON (se status ok; altrimenti può essere null)
        patientDataName,
      },
    });
  }}
>
  Review
</button>

</div>
      </main>
    </div>
  );
}
