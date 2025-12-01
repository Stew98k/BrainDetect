import React, { useEffect, useRef, useState } from "react";
import { Upload, UserCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ---------- Card con upload reale + anteprima immagine ---------- */
type UploadCardProps = {
  title: string;
  buttonLabel?: string;
  accept?: string;
  onFile?: (file: File | null) => void;
};

function UploadCard({
  title,
  buttonLabel = "Upload MRI",
  // immagini comuni + formati MRI
  accept = ".dcm,.nii,.nii.gz,image/*",
  onFile,
}: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handlePick = () => inputRef.current?.click();

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0] ?? null;
    setFileName(f?.name ?? "");
    onFile?.(f);

    if (f && f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  // cleanup SOLO della preview locale della card
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[280px] h-[260px] rounded-2xl bg-neutral-200/80 border border-neutral-300 shadow-sm overflow-hidden">
        {previewUrl ? (
          <img src={previewUrl} alt={`Anteprima ${title}`} className="w-full h-full object-contain p-3" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <button
              type="button"
              onClick={handlePick}
              className="flex items-center gap-2 rounded-xl bg-white border border-neutral-300 shadow px-4 py-2 text-sm hover:bg-neutral-50 active:scale-[0.99]"
              aria-label={`Carica file per ${title}`}
              title={fileName || buttonLabel}
            >
              <Upload className="w-4 h-4" />
              <span className="font-medium">{buttonLabel}</span>
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
        />

        {fileName && (
          <div className="absolute top-2 right-2">
            <button
              type="button"
              onClick={handlePick}
              className="rounded-md bg-white/90 border border-neutral-300 px-2 py-1 text-xs shadow hover:bg-white"
              title="Sostituisci file"
            >
              Cambia
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 text-2xl font-extrabold tracking-wide">{title}</div>

      {fileName && (
        <div className="mt-2 text-xs text-black/70 max-w-[280px] truncate" title={fileName}>
          {fileName}
        </div>
      )}
    </div>
  );
}

/* ---------- Upload dati paziente (bottone + nome file) ---------- */
type PatientDataUploadProps = {
  onFile?: (file: File | null) => void;
  accept?: string;
};

function PatientDataUpload({
  onFile,
  accept = ".json,.csv,.txt,.xlsx,.xml,.pdf",
}: PatientDataUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handlePick = () => inputRef.current?.click();

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0] ?? null;
    setFileName(f?.name ?? "");
    onFile?.(f);
  };

  return (
    <div>
      <p className="text-lg font-semibold mb-3">Carica i dati del paziente</p>

      <button
        type="button"
        onClick={handlePick}
        className="flex items-center gap-2 rounded-xl bg-white border border-neutral-300 shadow px-4 py-2 text-sm hover:bg-neutral-50 active:scale-[0.99]"
      >
        <Upload className="w-4 h-4" />
        <span className="font-medium">Upload data</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />

      {fileName && (
        <div className="mt-2 text-xs text-black/70 max-w-[280px] truncate" title={fileName}>
          {fileName}
        </div>
      )}
    </div>
  );
}

/* ---------- Pagina Home con stato centralizzato ---------- */
export default function Home() {
  const [axial, setAxial] = useState<File | null>(null);
  const [coronal, setCoronal] = useState<File | null>(null);
  const [sagittal, setSagittal] = useState<File | null>(null);
  const [patientData, setPatientData] = useState<File | null>(null);

  // URL per la review
  const [axialUrl, setAxialUrl] = useState<string | null>(null);
  const [coronalUrl, setCoronalUrl] = useState<string | null>(null);
  const [sagittalUrl, setSagittalUrl] = useState<string | null>(null);

  const navigate = useNavigate();

  // crea nuovi Object URL e revoca il precedente (ma NON quelli correnti)
  const handleAxial = (f: File | null) => {
    setAxial(f);
    setAxialUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return f ? URL.createObjectURL(f) : null;
    });
  };
  const handleCoronal = (f: File | null) => {
    setCoronal(f);
    setCoronalUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return f ? URL.createObjectURL(f) : null;
    });
  };
  const handleSagittal = (f: File | null) => {
    setSagittal(f);
    setSagittalUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return f ? URL.createObjectURL(f) : null;
    });
  };

  // PROCESS abilitato solo quando le tre MRI sono presenti (aggiungi patientData se vuoi)
  const allLoaded = Boolean(axial && coronal && sagittal);

  return (
    <div className="min-h-screen w-full bg-white text-black">
      {/* HEADER */}
      <header className="w-full bg-neutral-300 border-b border-neutral-400 relative">
        <div className="mx-auto max-w-6xl px-4">
          <div className="h-14 flex items-center justify-between">
            <div className="text-2xl font-black tracking-tight">BrainDetect</div>

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
      <main className="mx-auto max-w-6xl px-4 pt-5 pb-16">
        <p className="text-lg font-semibold">
          Carica le immagini ottenute tramite MRI negli slot corrispondenti
        </p>

        {/* tre card affiancate */}
        <div className="mt-3 grid grid-cols-1 gap-6 md:grid-cols-3 place-items-center">
          <UploadCard title="ASSIALE" onFile={handleAxial} />
          <UploadCard title="CORONALE" onFile={handleCoronal} />
          <UploadCard title="SAGITTALE" onFile={handleSagittal} />
        </div>

        {/* sezione dati paziente */}
        <div className="mt-10">
          <PatientDataUpload onFile={setPatientData} />
        </div>

        {/* pulsante PROCESS */}
        <div className="mt-14 flex justify-end">
          <button
            type="button"
            disabled={!allLoaded}
            className={[
              "rounded-xl border border-neutral-400 shadow px-6 py-3 text-base font-extrabold tracking-wide transition",
              allLoaded
                ? "bg-neutral-300 hover:bg-neutral-200 text-black"
                : "bg-neutral-100 text-gray-400 cursor-not-allowed",
            ].join(" ")}
            onClick={() => {
              if (!allLoaded) return;
              navigate("/review", {
                state: {
                  axialUrl,
                  coronalUrl,
                  sagittalUrl,
                  patientDataName: patientData?.name ?? null, // opzionale
                },
              });
            }}
            title={
              allLoaded
                ? "Pronto per l'elaborazione"
                : "Carica le tre MRI per abilitare PROCESS"
            }
          >
            PROCESS
          </button>
        </div>
      </main>
    </div>
  );
}
