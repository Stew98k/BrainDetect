import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserCircle2, X } from "lucide-react";

/* ====== Tipi e validazione del JSON (schema unificato) ====== */
type RectB   = { shape: "rect"; x: number; y: number; w: number; h: number };
type CircleB = { shape: "circle"; cx: number; cy: number; r: number };
type Bounding = RectB | CircleB;

type InferenceResult = {
  status: "ok" | "error";
  class: "ill" | "healthy";
  explanation: string;
  bounding?: Bounding | null;
};

type RouterState = {
  axialUrl?: string | null;        // immagine ASSIALE passata da Review
  result?: InferenceResult | null; // JSON validato/grezzo
  patientDataName?: string | null;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function validateBounding(b?: Bounding | null): Bounding | null {
  if (!b) return null;
  if (b.shape === "rect") {
    let x = clamp01(b.x), y = clamp01(b.y);
    let w = Math.max(0, b.w), h = Math.max(0, b.h);
    if (x + w > 1) w = 1 - x;
    if (y + h > 1) h = 1 - y;
    return w > 0 && h > 0 ? { shape: "rect", x, y, w, h } : null;
  }
  if (b.shape === "circle") {
    let cx = clamp01(b.cx), cy = clamp01(b.cy);
    let r = Math.max(0, b.r);
    r = Math.min(r, cx, cy, 1 - cx, 1 - cy);
    return r > 0 ? { shape: "circle", cx, cy, r } : null;
  }
  return null;
}

function validateResult(r: any): InferenceResult | null {
  if (!r || r.status !== "ok") return null;     // se NON ok, niente overlay/spiegazione
  return {
    status: "ok",
    class: r.class === "ill" || r.class === "healthy" ? r.class : "healthy",
    explanation: r.explanation ?? "",
    bounding: validateBounding(r.bounding ?? null),
  };
}

/* ========================= Pagina Correction ========================= */
export default function Correction() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { axialUrl, result: rawResult } = (state || {}) as RouterState;

  // senza immagine assiale torno alla review
  useEffect(() => {
    if (!axialUrl) navigate("/review", { replace: true });
  }, [axialUrl, navigate]);

  // pulizia dell'Object URL quando esco da questa pagina
  useEffect(() => {
    return () => {
      if (axialUrl) URL.revokeObjectURL(axialUrl);
    };
  }, [axialUrl]);

  const result = useMemo(() => validateResult(rawResult), [rawResult]);
  const bounding = result?.bounding ?? null;

  // UI state
  const [confidence, setConfidence] = useState<number | null>(null); // 1..5
  const [diagnosis, setDiagnosis] = useState<"healthy" | "ill" | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // reset totale e ritorno alla Home
  const hardResetToHome = () => {
    if (axialUrl) URL.revokeObjectURL(axialUrl);
    navigate("/", { replace: true });
    // ricarico l'app per pulire QUALSIASI stato rimasto in memoria
    setTimeout(() => window.location.reload(), 0);
  };

  const handleCancel = () => {
    hardResetToHome();
  };

  const handleDone = () => {
    // qui potresti inviare al backend; poi mostri conferma
    // payload d'esempio:
    // const payload = { diagnosis, confidence, result };
    setShowSuccess(true);
    setTimeout(() => {
      hardResetToHome();
    }, 2000);
  };

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
        <h1 className="text-[22px] font-bold">
          Seleziona l’area del cervello che potrebbe contenere il tumore{" "}
          <span className="text-black/60 text-[14px]">
            (se non si è d’accordo con il sistema)
          </span>
        </h1>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">
          {/* IMMAGINE ASSIALE + overlay (dal JSON, se status ok) */}
          <div className="rounded-xl border border-neutral-300 bg-black/5 p-3">
            <div className="relative w-[300px] h-[360px] bg-black/80 rounded-lg overflow-hidden">
              {axialUrl ? (
                <>
                  <img
                    src={axialUrl}
                    alt="Vista ASSIALE"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
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
                  Immagine non disponibile
                </div>
              )}
            </div>
          </div>

          {/* Colonna destra: rating + spiegazione */}
          <div className="w-full">
            <h2 className="text-xl font-extrabold text-center mb-1">
              Quanto sei sicuro della correzione apportata?
            </h2>

            <div className="flex items-center justify-center gap-4 mt-2">
              <span className="text-sm text-black/70">Non sicuro</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setConfidence(n)}
                  aria-label={`Confidenza ${n}`}
                  className={[
                    "w-6 h-6 rounded-full border border-black/70",
                    confidence === n ? "bg-black" : "bg-white",
                  ].join(" ")}
                />
              ))}
              <span className="text-sm text-black/70">Molto sicuro</span>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                disabled={!result} // spiega solo se status ok
                className={[
                  "rounded-xl border border-neutral-400 shadow px-5 py-2 text-sm font-semibold",
                  result
                    ? "bg-neutral-200 hover:bg-neutral-100"
                    : "bg-neutral-100 text-gray-400 cursor-not-allowed",
                ].join(" ")}
              >
                Visualizza spiegazione
              </button>
            </div>
          </div>
        </div>

        <hr className="my-8 border-neutral-300" />

        {/* Sezione diagnosi */}
        <div className="text-center">
          <h3 className="text-lg font-bold mb-6">
            A seguito di revisione il paziente risulta essere
          </h3>

          <div className="flex items-center justify-center gap-16">
            <label className="flex flex-col items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="diagnosis"
                className="hidden"
                checked={diagnosis === "healthy"}
                onChange={() => setDiagnosis("healthy")}
              />
              <span
                className={[
                  "w-10 h-10 rounded-md border grid place-items-center text-sm",
                  diagnosis === "healthy"
                    ? "bg-neutral-200 border-black"
                    : "bg-white border-black/60",
                ].join(" ")}
              >
                ✓
              </span>
              <span className="text-sm">Sano</span>
            </label>

            <label className="flex flex-col items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="diagnosis"
                className="hidden"
                checked={diagnosis === "ill"}
                onChange={() => setDiagnosis("ill")}
              />
              <span
                className={[
                  "w-10 h-10 rounded-md border grid place-items-center text-sm",
                  diagnosis === "ill"
                    ? "bg-neutral-200 border-black"
                    : "bg-white border-black/60",
                ].join(" ")}
              >
                ✓
              </span>
              <span className="text-sm">Malato</span>
            </label>
          </div>

          <div className="mt-10 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-xl border border-neutral-400 shadow px-6 py-3 text-base font-extrabold tracking-wide bg-neutral-100 text-red-600 hover:bg-neutral-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDone}
              disabled={!diagnosis || !confidence}
              className={[
                "rounded-xl border border-neutral-400 shadow px-6 py-3 text-base font-extrabold tracking-wide",
                diagnosis && confidence
                  ? "bg-neutral-300 hover:bg-neutral-200"
                  : "bg-neutral-100 text-gray-400 cursor-not-allowed",
              ].join(" ")}
            >
              Done
            </button>
          </div>
        </div>
      </main>

      {/* MODALE: spiegazione dal JSON */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
          <div className="bg-white w-[min(560px,92vw)] rounded-2xl shadow-lg border border-neutral-300 p-5 relative">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 p-1 rounded-md hover:bg-neutral-100"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-lg font-bold mb-2">Spiegazione del sistema</h4>
            <p className="text-[15px] leading-relaxed text-black/90 whitespace-pre-wrap">
              {result?.explanation || "Nessuna spiegazione disponibile."}
            </p>
            <div className="mt-5 text-right">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-neutral-400 shadow px-4 py-2 text-sm font-semibold bg-neutral-200 hover:bg-neutral-100"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY SUCCESSO */}
      {showSuccess && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-300 px-8 py-6">
            <p className="text-lg font-bold text-center">
              ✅ Revisione inviata con successo
            </p>
            <p className="text-sm text-black/70 text-center mt-1">
              Verrai reindirizzato alla pagina iniziale…
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
