import React, { useState, useEffect } from 'react';

type AgoTankSimulationProps = {
  level: number;
  logo?: string;
  maxVolume?: number;
};

const AgoTankSimulation = ({ level, logo, maxVolume: maxVolumeProp }: AgoTankSimulationProps) => {
  const [liquidLevel, setLiquidLevel] = useState(level);
  const [maxVolume, setMaxVolume] = useState(maxVolumeProp ?? 260000);

  useEffect(() => {
    if (maxVolumeProp !== undefined) setMaxVolume(maxVolumeProp);
  }, [maxVolumeProp]);

  useEffect(() => { setLiquidLevel(level); }, [level]);

  const CALIBRATION_BOTTOM = 745;
  const CALIBRATION_TOP = 130;
  const TANK_HEIGHT_PX = CALIBRATION_BOTTOM - CALIBRATION_TOP;

  const rawInterval = maxVolume / 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval)));
  const normalized = rawInterval / magnitude;
  const niceBase = normalized < 1.5 ? 1 : normalized < 3.5 ? 2 : normalized < 7.5 ? 5 : 10;
  const majorInterval = niceBase * magnitude;
  const minorInterval = majorInterval / 5;
  const totalMinorTicks = Math.floor(maxVolume / minorInterval);

  const calibrationMarks = Array.from({ length: totalMinorTicks + 1 }, (_, i) => {
    const valueL = i * minorInterval;
    if (valueL > maxVolume) return null;
    const frac = valueL / maxVolume;
    const y = CALIBRATION_BOTTOM - frac * TANK_HEIGHT_PX;
    const isMajor = Math.round(valueL % majorInterval) < 1;
    let label = '';
    if (isMajor) {
      if (valueL >= 1_000_000) label = `${(valueL / 1_000_000).toFixed(0)}M`;
      else if (valueL >= 1_000) label = `${(valueL / 1_000).toFixed(0)}K`;
      else label = `${Math.round(valueL)}`;
    }
    return { i, y, label, isMajor };
  }).filter(Boolean) as { i: number; y: number; label: string; isMajor: boolean }[];

  const currentVolume = Math.round((liquidLevel / 100) * maxVolume);

  return (
    <div className="relative z-[60] w-full h-full flex flex-col">


      {/* Info Panel */}
      <div className="bg-white/90 backdrop-blur rounded-lg p-2 md:p-3 shadow-lg border border-slate-200 mb-2 md:mb-3">
        <div className="grid grid-cols-3 gap-1 md:gap-2 text-center">
          <div>
            <p className="text-slate-600 text-[10px] md:text-xs mb-1">Total Capacity</p>
            <p className="text-sm md:text-lg font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
              {maxVolume.toLocaleString()} L
            </p>
          </div>
          <div>
            <p className="text-slate-600 text-[10px] md:text-xs mb-1">Current Volume</p>
            <p className="text-sm md:text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              {currentVolume.toLocaleString()} L
            </p>
          </div>
          <div>
            <p className="text-slate-600 text-[10px] md:text-xs mb-1">Fill Percentage</p>
            <p className="text-sm md:text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {liquidLevel.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Tank Visualization — 85% viewBox width */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <div className="w-full h-[110%]">
          <svg viewBox="0 0 1200 850" className="w-full h-full"
            style={{ filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.3))' }}>
            <defs>
              <linearGradient id="steel-ago" x1="0%" x2="100%">
                <stop offset="0%" stopColor="#8b9499"/><stop offset="15%" stopColor="#b8c5d0"/>
                <stop offset="50%" stopColor="#c8d5e0"/><stop offset="85%" stopColor="#b8c5d0"/>
                <stop offset="100%" stopColor="#8b9499"/>
              </linearGradient>
              <linearGradient id="ago-liquid" x1="0%" x2="100%">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.85"/>
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.95"/>
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.85"/>
              </linearGradient>
              <radialGradient id="depth-ago">
                <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#1e40af" stopOpacity="0"/>
              </radialGradient>
              <pattern id="wave-ago" x="0" y="0" width="120" height="25" patternUnits="userSpaceOnUse">
                <path d="M0,12 Q30,8 60,12 T120,12 V25 H0 Z" fill="rgba(219,234,254,0.2)">
                  <animateTransform attributeName="transform" type="translate" from="0 0" to="120 0" dur="4s" repeatCount="indefinite"/>
                </path>
              </pattern>
              <linearGradient id="glass-ago" x1="0%" x2="100%">
                <stop offset="0%" stopColor="rgba(203,213,225,0.3)"/>
                <stop offset="10%" stopColor="rgba(255,255,255,0.5)"/>
                <stop offset="50%" stopColor="rgba(148,163,184,0.15)"/>
                <stop offset="90%" stopColor="rgba(226,232,240,0.35)"/>
                <stop offset="100%" stopColor="rgba(100,116,139,0.45)"/>
              </linearGradient>
              <linearGradient id="blue-ago" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(59,130,246,0.8)"/>
                <stop offset="100%" stopColor="rgba(59,130,246,0)"/>
              </linearGradient>
              <linearGradient id="orange-ago" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(249,115,22,0.8)"/>
                <stop offset="100%" stopColor="rgba(249,115,22,0)"/>
              </linearGradient>
              <linearGradient id="concrete-ago" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#9ca3af"/><stop offset="50%" stopColor="#d1d5db"/>
                <stop offset="100%" stopColor="#6b7280"/>
              </linearGradient>
              <pattern id="rust-ago" width="50" height="50" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill="#92400e" opacity="0.3"/>
                <circle cx="35" cy="25" r="1.5" fill="#a16207" opacity="0.25"/>
              </pattern>
              <pattern id="concreteTexture-ago" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="2" fill="#9ca3af" opacity="0.4"/>
                <circle cx="45" cy="30" r="1.5" fill="#6b7280" opacity="0.3"/>
                <circle cx="30" cy="50" r="1" fill="#4b5563" opacity="0.5"/>
              </pattern>
              <clipPath id="clip-ago">
                <path d="M 90 130 L 90 650 Q 90 720, 122 740 L 1078 740 Q 1110 720, 1110 650 L 1110 130 Z"/>
              </clipPath>
              <clipPath id="logo-clip-ago">
                <circle cx="600" cy="390" r="83"/>
              </clipPath>
            </defs>

            {/* Concrete floor */}
            <ellipse cx="600" cy="780" rx="530" ry="20" fill="rgba(0,0,0,0.3)"/>
            <ellipse cx="600" cy="775" rx="520" ry="18" fill="#3f3f46" stroke="#27272a" strokeWidth="2"/>
            <path d="M 80 745 Q 80 755, 85 770 L 1115 770 Q 1120 755, 1120 745 Z" fill="url(#concrete-ago)" stroke="#4b5563" strokeWidth="2"/>
            <path d="M 80 745 Q 80 755, 85 770 L 1115 770 Q 1120 755, 1120 745 Z" fill="url(#concreteTexture-ago)" opacity="0.4"/>
            <ellipse cx="600" cy="755" rx="520" ry="15" fill="#71717a" stroke="#52525b" strokeWidth="1.5"/>
            <ellipse cx="600" cy="745" rx="520" ry="13" fill="url(#concrete-ago)" stroke="#6b7280" strokeWidth="2"/>
            <ellipse cx="600" cy="744" rx="520" ry="13" fill="url(#concreteTexture-ago)" opacity="0.5"/>
            {[...Array(36)].map((_,i) => <circle key={`ct-${i}`} cx={90+i*28} cy={744+(i%3)*2} r="1.5" fill="#6b7280" opacity="0.35"/>)}
            {[...Array(52)].map((_,i) => <circle key={`ct2-${i}`} cx={85+i*19} cy={750+(i%5)*4} r="1.2" fill="#52525b" opacity="0.35"/>)}
            {[...Array(8)].map((_,i) => <line key={`edge-${i}`} x1="82" y1={745+i*3} x2="1118" y2={745+i*3} stroke="#52525b" strokeWidth="0.5" opacity="0.3"/>)}

            {/* Conical bottom */}
            <path d="M 90 650 Q 90 715, 122 738 L 1078 738 Q 1110 715, 1110 650 Z" fill="url(#steel-ago)" stroke="#475569" strokeWidth="3"/>
            {[...Array(40)].map((_,i) => {
              const y = 665+i*3.5;
              const x = 600+Math.sin((i/40)*Math.PI*2)*(500-i*5);
              return <circle key={`cr-${i}`} cx={x} cy={y} r="2.5" fill="#64748b" stroke="#94a3b8" strokeWidth="0.5"/>;
            })}

            {/* Cylinder */}
            <path d="M 95 130 L 95 650 Q 95 715, 127 737 L 1073 737 Q 1105 715, 1105 650 L 1105 130 Z" fill="rgba(0,0,0,0.15)"/>
            <path d="M 90 130 L 90 650 Q 90 715, 122 738 L 1078 738 Q 1110 715, 1110 650 L 1110 130 Z" fill="url(#glass-ago)" stroke="#64748b" strokeWidth="4"/>
            <path d="M 90 130 L 90 650 Q 90 715, 122 738 L 1078 738 Q 1110 715, 1110 650 L 1110 130 Z" fill="url(#rust-ago)" opacity="0.15"/>

            {/* Seams */}
            {[221,390,548,705,862,979].map((x,i) => (
              <g key={`s-${i}`}>
                <line x1={x} y1="130" x2={x} y2="650" stroke="#94a3b8" strokeWidth="3" opacity="0.7"/>
                {[...Array(26)].map((_,j) => (
                  <g key={`r-${j}`}>
                    <circle cx={x} cy={150+j*20} r="3" fill="#64748b" stroke="#94a3b8"/>
                    <circle cx={x-1} cy={149+j*20} r="1" fill="rgba(255,255,255,0.6)"/>
                  </g>
                ))}
              </g>
            ))}

            {/* Bands */}
            {[220,340,460,580].map((y,i) => (
              <g key={`b-${i}`}>
                <rect x="90" y={y} width="1020" height="12" fill="url(#steel-ago)" opacity="0.6" stroke="#475569"/>
                {[...Array(42)].map((_,j) => <circle key={`br2-${j}`} cx={100+j*24} cy={y+6} r="2" fill="#1e293b" stroke="#334155" strokeWidth="0.5"/>)}
              </g>
            ))}

            {/* Liquid */}
            <g clipPath="url(#clip-ago)">
              <path d={`M 90 ${650-liquidLevel*5.2} L 90 650 Q 90 715, 122 738 L 1078 738 Q 1110 715, 1110 650 L 1110 ${650-liquidLevel*5.2} Z`} fill="url(#ago-liquid)"/>
              <ellipse cx="600" cy={650-liquidLevel*5.2+100} rx="470" ry={liquidLevel*2.6} fill="url(#depth-ago)"/>
              <rect x="90" y={650-liquidLevel*5.2-10} width="1020" height="50" fill="url(#wave-ago)"/>
              <ellipse cx="600" cy={650-liquidLevel*5.2+8} rx="485" ry="12" fill="rgba(219,234,254,0.3)"/>
              {[...Array(18)].map((_,i) => {
                const xPos = 155+i*52; const size = 3+(i%4);
                return (
                  <g key={`bub-${i}`}>
                    <circle cx={xPos} cy={640-liquidLevel*5} r={size} fill="rgba(219,234,254,0.6)" stroke="rgba(59,130,246,0.3)">
                      <animate attributeName="cy" from={650-liquidLevel*5.2+20} to={650-liquidLevel*5.2-150} dur={`${3+i*0.3}s`} repeatCount="indefinite"/>
                      <animate attributeName="opacity" from="0.8" to="0" dur={`${3+i*0.3}s`} repeatCount="indefinite"/>
                    </circle>
                  </g>
                );
              })}
            </g>

            {/* Lighting */}
            <rect x="90" y="130" width="104" height="520" fill="url(#blue-ago)" opacity="0.6"/>
            <rect x="1006" y="130" width="104" height="520" fill="url(#orange-ago)" opacity="0.6"/>
            <rect x="95" y="135" width="78" height="507" fill="rgba(255,255,255,0.4)" opacity="0.8"/>
            <rect x="105" y="140" width="33" height="494" fill="rgba(255,255,255,0.6)"/>

            {/* Depot Logo */}
            {logo && (
              <g>
                <circle cx="600" cy="390" r="85" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
                <image href={logo} x="517" y="307" width="166" height="166" clipPath="url(#logo-clip-ago)" preserveAspectRatio="xMidYMid meet" style={{ filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.5))' }}/>
              </g>
            )}

            {/* Calibration — 0M at y=745 (concrete floor), 16M at y=130 (tank top) */}
            {calibrationMarks.map((m) => {
              if (m.y < 130 || m.y > 745) return null;
              return (
                <g key={`c-${m.i}`}>
                  {m.isMajor ? (
                    <>
                      <line x1="1110" y1={m.y} x2="1140" y2={m.y} stroke="#ffffff" strokeWidth="3"/>
                      <line x1="90" y1={m.y} x2="60" y2={m.y} stroke="#ffffff" strokeWidth="3"/>
                      <text x="1145" y={m.y+6} fill="#ffffff" fontSize="20" fontWeight="bold">{m.label}</text>
                      <text x="55" y={m.y+6} fill="#ffffff" fontSize="20" fontWeight="bold" textAnchor="end">{m.label}</text>
                    </>
                  ) : (
                    <>
                      <line x1="1110" y1={m.y} x2="1125" y2={m.y} stroke="#e5e7eb" strokeWidth="1.5"/>
                      <line x1="90" y1={m.y} x2="75" y2={m.y} stroke="#e5e7eb" strokeWidth="1.5"/>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

    </div>
  );
};

export default AgoTankSimulation;
