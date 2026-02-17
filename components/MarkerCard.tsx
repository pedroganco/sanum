import type { Marker } from "@/lib/types";
import { FLAG_EMOJI, FLAG_COLOR } from "@/lib/types";

interface MarkerCardProps {
  marker: Marker;
  onClick: () => void;
}

export function MarkerCard({ marker, onClick }: MarkerCardProps) {
  // Calcular posição na barra de referência (0-100%)
  const getBarPosition = () => {
    if (marker.refMin === null && marker.refMax === null) return 50;
    if (marker.refMin === null) return Math.min((marker.value / marker.refMax!) * 100, 100);
    if (marker.refMax === null) return Math.max(((marker.value - marker.refMin) / marker.refMin) * 100, 0);

    const range = marker.refMax - marker.refMin;
    const position = ((marker.value - marker.refMin) / range) * 100;
    return Math.max(0, Math.min(100, position));
  };

  const position = getBarPosition();

  return (
    <button
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow text-left w-full"
    >
      <div className="flex items-start gap-3">
        {/* Semáforo */}
        <div className="text-3xl mt-0.5 flex-shrink-0">
          {FLAG_EMOJI[marker.flag]}
        </div>

        <div className="flex-1 min-w-0">
          {/* Nome */}
          <h3 className="font-semibold text-gray-900 mb-1 truncate">
            {marker.name}
          </h3>

          {/* Valor */}
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {marker.value} <span className="text-base font-normal text-gray-500">{marker.unit}</span>
          </div>

          {/* Barra de referência */}
          {(marker.refMin !== null || marker.refMax !== null) && (
            <div className="mb-2">
              <div className="h-2 bg-gray-100 rounded-full relative overflow-hidden">
                {/* Zona verde (referência) */}
                {marker.refMin !== null && marker.refMax !== null && (
                  <div className="absolute inset-y-0 bg-green-100" style={{ left: 0, right: 0 }} />
                )}

                {/* Posição do valor */}
                <div
                  className={`absolute top-0 bottom-0 w-1 ${
                    marker.flag === "normal" ? "bg-green-500" :
                    marker.flag === "low" || marker.flag === "high" ? "bg-yellow-500" :
                    "bg-red-500"
                  }`}
                  style={{ left: `${position}%`, transform: "translateX(-50%)" }}
                />
              </div>
            </div>
          )}

          {/* Referência texto */}
          <div className="text-xs text-gray-500">
            {marker.refText ? `Ref: ${marker.refText}` : "Sem referência"}
          </div>
        </div>
      </div>
    </button>
  );
}
