"use client";

import type { KeyboardEvent } from "react";
import { provinces } from "@/lib/categories";

type ProvinceMapProps = {
  province: string;
  onProvince: (province: string) => void;
};

const provinceShapes: Record<string, { path: string; label: [number, number]; shortLabel?: string }> = {
  Guanacaste: {
    path: "M49 52 113 39 169 47 179 86 160 118 128 132 111 158 75 165 46 145 37 108Z",
    label: [99, 103],
  },
  Alajuela: {
    path: "M169 47 220 49 246 72 239 103 218 125 193 141 160 118 179 86Z",
    label: [199, 88],
  },
  Heredia: {
    path: "M220 49 254 58 270 81 260 108 239 119 218 125 239 103 246 72Z",
    label: [247, 79],
  },
  Limón: {
    path: "M254 58 298 71 326 100 320 131 299 164 281 199 254 190 239 159 239 119 260 108 270 81Z",
    label: [286, 124],
  },
  Puntarenas: {
    path: "M46 145 75 165 111 158 128 132 160 118 193 141 195 172 178 195 163 224 148 251 130 276 115 310 102 351 85 369 72 348 75 320 59 298 62 274 43 252 47 225 29 203 35 177Z",
    label: [99, 224],
  },
  "San José": {
    path: "M160 118 193 141 218 125 239 119 239 159 254 190 228 209 200 199 178 195 195 172 193 141Z",
    label: [208, 166],
    shortLabel: "San José",
  },
  Cartago: {
    path: "M228 209 254 190 281 199 275 227 258 246 235 247 216 230 200 199Z",
    label: [252, 220],
  },
};

function handleKeyDown(event: KeyboardEvent<SVGGElement>, province: string, current: string, onProvince: (province: string) => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onProvince(current === province ? "" : province);
  }
}

export function ProvinceMap({ province, onProvince }: ProvinceMapProps) {
  return (
    <div className="relative mx-auto w-full max-w-[330px]">
      <svg
        viewBox="0 0 350 390"
        role="group"
        aria-label="Mapa interactivo de las provincias de Costa Rica"
        className="h-auto w-full overflow-visible drop-shadow-[0_18px_24px_rgba(241,102,154,0.14)]"
      >
        <defs>
          <linearGradient id="province-map-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff7fa" />
            <stop offset="100%" stopColor="#ffe6ee" />
          </linearGradient>
        </defs>
        <path
          d="M47 37 116 24 177 32 220 34 260 45 307 59 337 94 331 133 308 168 290 204 284 234 263 254 241 257 220 239 200 213 187 202 172 231 157 258 139 283 124 317 111 358 88 381 64 355 66 323 48 300 52 275 34 252 38 223 20 201 28 173 39 142 30 108Z"
          fill="url(#province-map-bg)"
          stroke="#fbc5d6"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {provinces.map((item) => {
          const shape = provinceShapes[item];
          const selected = province === item;
          return (
            <g
              key={item}
              role="button"
              tabIndex={0}
              aria-label={`Filtrar comercios por ${item}`}
              aria-pressed={selected}
              onClick={() => onProvince(selected ? "" : item)}
              onKeyDown={(event) => handleKeyDown(event, item, province, onProvince)}
              className="cursor-pointer outline-none"
            >
              <path
                d={shape.path}
                fill={selected ? "#e9548d" : "#f78fb0"}
                stroke="white"
                strokeWidth={selected ? 3 : 2}
                strokeLinejoin="round"
                className="transition-colors duration-200 hover:fill-[#ed6e9e] focus-visible:stroke-[#8f79f5] focus-visible:stroke-[4]"
              />
              <text
                x={shape.label[0]}
                y={shape.label[1]}
                textAnchor="middle"
                dominantBaseline="middle"
                className="pointer-events-none select-none fill-white text-[9px] font-bold drop-shadow-sm sm:text-[10px]"
              >
                {shape.shortLabel ?? item}
              </text>
            </g>
          );
        })}
        <path
          d="M49 52 37 108 46 145 35 177 29 203 47 225 43 252 62 274 59 298 75 320 72 348 85 369 102 351 115 310 130 276 148 251 163 224 178 195 200 199 216 230 235 247 258 246 275 227 281 199 299 164 320 131 326 100 298 71 254 58 220 49 169 47 113 39Z"
          fill="none"
          stroke="#ec7da3"
          strokeOpacity="0.55"
          strokeWidth="1.5"
          strokeLinejoin="round"
          pointerEvents="none"
        />
      </svg>
      <div aria-hidden="true" className="pointer-events-none absolute -right-1 top-8 h-16 w-16 rounded-full bg-blush-200/50 blur-2xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-1 left-4 h-14 w-20 rounded-full bg-lilac-200/40 blur-2xl" />
    </div>
  );
}
