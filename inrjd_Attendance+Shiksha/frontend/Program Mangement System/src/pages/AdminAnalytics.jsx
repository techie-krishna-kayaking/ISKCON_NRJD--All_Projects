import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

// ════════════════════════════════════════════════════════════════
// DESIGN SYSTEM
// ════════════════════════════════════════════════════════════════
const C = {
  gold:"#c8903c",goldL:"#f5c842",cream:"#fdf8f0",
  dark:"#2d1200",mid:"#5c3a14",muted:"#8b6840",light:"#a08060",
  green:"#16a34a",greenL:"#4ade80",
  amber:"#d97706",amberL:"#fbbf24",
  red:"#dc2626",  redL:"#f87171",
  blue:"#0284c7", blueL:"#38bdf8",
  purple:"#7c3aed",purpleL:"#a78bfa",
  teal:"#0891b2", tealL:"#22d3ee",
  pink:"#db2777", indigo:"#4f46e5",
};
const PALETTE=["#c8903c","#0284c7","#16a34a","#7c3aed","#dc2626","#0891b2","#d97706","#db2777","#059669","#4f46e5","#f97316","#84cc16"];
const NAV_SECTIONS=["Overview","Leader View","Programs","Owners","Devotees","Operations","Insights","Search"];
function pctCls(p){return p>=80?"g":p>=40?"y":"r";}
function pctColor(p){return p>=80?C.green:p>=40?C.amber:C.red;}
function fmtDate(d){if(!d)return "Never";return new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});}
function fmtShort(d){if(!d)return "—";return new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short"});}
function ini(n){return(n||"?").split(" ").map(x=>x[0]).join("").toUpperCase().slice(0,2);}

// ── Tooltip hook ──────────────────────────────────────────────────
function useTooltip(){
  const [tip,setTip]=useState({visible:false,x:0,y:0,content:null});
  const show=(e,c)=>setTip({visible:true,x:e.clientX+12,y:e.clientY-28,content:c});
  const move=(e,c)=>setTip(p=>({...p,x:e.clientX+12,y:e.clientY-28,content:c||p.content}));
  const hide=()=>setTip(p=>({...p,visible:false}));
  return{tip,show,move,hide};
}
function Tooltip({tip}){
  if(!tip.visible||!tip.content)return null;
  return(
    <div style={{position:"fixed",left:tip.x,top:tip.y,zIndex:9999,pointerEvents:"none",
      background:"rgba(15,5,0,0.94)",backdropFilter:"blur(8px)",
      border:"1px solid rgba(200,140,40,0.3)",borderRadius:12,
      padding:"10px 13px",minWidth:150,maxWidth:240,
      boxShadow:"0 10px 40px rgba(0,0,0,0.4)",fontFamily:"'DM Sans',sans-serif"}}>
      {tip.content}
    </div>
  );
}

// ── SVG charts ────────────────────────────────────────────────────
function DonutChart({slices=[],size=110,label="",onSliceClick}){
  const [hov,setHov]=useState(-1);
  const {tip,show,move,hide}=useTooltip();
  const valid=slices.filter(s=>(s.value||0)>0);
  const total=valid.reduce((s,d)=>s+(d.value||0),0);
  if(!total)return(<div style={{width:size,height:size,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:3}}><div style={{fontSize:"1.4rem",opacity:0.2}}>○</div><span style={{fontSize:"0.66rem",color:C.muted}}>No data</span></div>);
  const cx=size/2,cy=size/2,r=(size-10)/2,ir=r*0.56;
  if(valid.length===1){
    return(<><svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{cursor:"pointer"}}
      onClick={()=>onSliceClick&&onSliceClick(valid[0])}>
      <circle cx={cx} cy={cy} r={r} fill={valid[0].color||PALETTE[0]} opacity={0.85}/>
      <circle cx={cx} cy={cy} r={ir} fill="#fff"/>
      <text x={cx} y={cy-5} textAnchor="middle" style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:size*0.14,fill:C.dark}}>{total}</text>
      <text x={cx} y={cy+10} textAnchor="middle" style={{fontSize:size*0.08,fill:C.muted}}>{label}</text>
    </svg><Tooltip tip={tip}/></>);
  }
  let angle=-90;
  const arcs=valid.map((s,i)=>{
    const sw=Math.max(0.5,Math.min(359.5,(s.value/total)*360));
    const a1=(angle*Math.PI)/180,a2=((angle+sw)*Math.PI)/180;
    const x1=cx+r*Math.cos(a1),y1=cy+r*Math.sin(a1);
    const x2=cx+r*Math.cos(a2),y2=cy+r*Math.sin(a2);
    const ix1=cx+ir*Math.cos(a2),iy1=cy+ir*Math.sin(a2);
    const ix2=cx+ir*Math.cos(a1),iy2=cy+ir*Math.sin(a1);
    const lg=sw>180?1:0;
    const d=`M ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${ir} ${ir} 0 ${lg} 0 ${ix2} ${iy2} Z`;
    angle+=(s.value/total)*360;
    return{d,color:s.color||PALETTE[i%PALETTE.length],label:s.label,value:s.value,extra:s.extra,p:Math.round((s.value/total)*100),i};
  });
  return(<>
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{overflow:"visible",cursor:"pointer"}}>
      {arcs.map((a,i)=>(
        <path key={i} d={a.d} fill={a.color} stroke="#fff" strokeWidth={hov===i?3:1.5}
          transform={hov===i?`translate(${Math.cos((angle/2)*Math.PI/180)*3} ${Math.sin((angle/2)*Math.PI/180)*3})`:""}
          opacity={hov!==-1&&hov!==i?0.55:1}
          style={{transition:"opacity 0.18s"}}
          onMouseEnter={e=>{setHov(i);show(e,
            <div><div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:a.color,marginBottom:4,fontSize:"0.78rem"}}>{a.label}</div>
            <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Count: <strong style={{color:"#fff"}}>{a.value}</strong></div>
            <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Share: <strong style={{color:"#fff"}}>{a.p}%</strong></div>
            {a.extra&&Object.entries(a.extra).map(([k,v])=>(
              <div key={k} style={{color:"rgba(255,220,160,0.8)",fontSize:"0.68rem"}}>{k}: <strong style={{color:"#fff"}}>{v}</strong></div>
            ))}</div>
          );}}
          onMouseMove={e=>move(e)} onMouseLeave={()=>{setHov(-1);hide();}}
          onClick={()=>onSliceClick&&onSliceClick(a)}
        />
      ))}
      <text x={cx} y={cy-5}  textAnchor="middle" style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:size*0.14,fill:C.dark}}>{total}</text>
      <text x={cx} y={cy+10} textAnchor="middle" style={{fontSize:size*0.08,fill:C.muted}}>{label}</text>
    </svg>
    <Tooltip tip={tip}/>
  </>);
}

function VBar({data=[],height=80,colorFn,onBarClick,showPct=false}){
  const {tip,show,move,hide}=useTooltip();
  const [hov,setHov]=useState(-1);
  if(!data.length)return<div style={{textAlign:"center",color:C.muted,fontSize:"0.74rem",padding:"16px 0"}}>No data</div>;
  const max=Math.max(...data.map(d=>d.value||0),1);
  return(<>
    <div style={{display:"flex",alignItems:"flex-end",gap:3,height:height+28,paddingTop:12}}>
      {data.map((d,i)=>{
        const h=Math.max(3,((d.value||0)/max)*height);
        const col=colorFn?colorFn(d,i):PALETTE[i%PALETTE.length];
        return(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",cursor:onBarClick?"pointer":"default"}}
          onClick={()=>onBarClick&&onBarClick(d)}>
          <span style={{fontSize:"0.58rem",fontWeight:700,color:hov===i?C.dark:C.light,marginBottom:2}}>{d.value}{showPct?"%":""}</span>
          <div style={{width:"100%",height,display:"flex",alignItems:"flex-end"}}>
            <div style={{width:"100%",height:h,background:hov===i?col:`${col}bb`,borderRadius:"3px 3px 0 0",transition:"height 0.4s ease,opacity 0.15s"}}
              onMouseEnter={e=>{setHov(i);show(e,
                <div><div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:col,marginBottom:3,fontSize:"0.78rem"}}>{d.label}</div>
                <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Value: <strong style={{color:"#fff"}}>{d.value}{showPct?"%":""}</strong></div>
                {d.extra&&Object.entries(d.extra).map(([k,v])=>(
                  <div key={k} style={{color:"rgba(255,220,160,0.8)",fontSize:"0.68rem"}}>{k}: <strong style={{color:"#fff"}}>{v}</strong></div>
                ))}</div>
              );}}
              onMouseMove={e=>move(e)} onMouseLeave={()=>{setHov(-1);hide();}}
            />
          </div>
          <span style={{fontSize:"0.57rem",color:hov===i?C.dark:C.muted,textAlign:"center",maxWidth:34,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:3}} title={d.label}>{d.label}</span>
        </div>);
      })}
    </div>
    <Tooltip tip={tip}/>
  </>);
}

function HBar({data=[],maxProp,colorFn,onBarClick}){
  const {tip,show,move,hide}=useTooltip();
  if(!data.length)return null;
  const max=maxProp||Math.max(...data.map(d=>d.value||0),1);
  return(<>
    <div style={{display:"flex",flexDirection:"column",gap:7}}>
      {data.map((d,i)=>{
        const w=Math.round(((d.value||0)/max)*100);
        const col=colorFn?colorFn(d,i):PALETTE[i%PALETTE.length];
        return(<div key={i} style={{display:"flex",alignItems:"center",gap:8,cursor:onBarClick?"pointer":"default"}}
          onClick={()=>onBarClick&&onBarClick(d)}>
          <span style={{fontSize:"0.72rem",color:C.mid,width:92,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}} title={d.label}>{d.label||"—"}</span>
          <div style={{flex:1,height:7,background:"rgba(200,140,40,0.1)",borderRadius:4,overflow:"hidden"}}
            onMouseEnter={e=>show(e,
              <div><div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:col,marginBottom:3,fontSize:"0.76rem"}}>{d.label}</div>
              <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>{d.pctLabel||`${d.value}`}</div>
              {d.extra&&Object.entries(d.extra).map(([k,v])=>(
                <div key={k} style={{color:"rgba(255,220,160,0.8)",fontSize:"0.68rem"}}>{k}: <strong style={{color:"#fff"}}>{v}</strong></div>
              ))}</div>
            )} onMouseMove={e=>move(e)} onMouseLeave={()=>hide()}>
            <div style={{width:`${w}%`,height:"100%",background:col,borderRadius:4,transition:"width 0.5s ease"}}/>
          </div>
          <span style={{fontSize:"0.7rem",fontWeight:700,color:C.mid,width:32,textAlign:"right",flexShrink:0}}>{d.value}</span>
        </div>);
      })}
    </div>
    <Tooltip tip={tip}/>
  </>);
}

function StackedBar({data=[],height=80,legend=[],onBarClick}){
  const {tip,show,move,hide}=useTooltip();
  const [hov,setHov]=useState(-1);
  if(!data.length)return null;
  const max=Math.max(...data.map(d=>(d.values||[]).reduce((s,v)=>s+v,0)),1);
  return(<>
    <div style={{display:"flex",alignItems:"flex-end",gap:4,height:height+28,paddingTop:10}}>
      {data.map((d,i)=>{
        const total=(d.values||[]).reduce((s,v)=>s+v,0);
        return(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",cursor:onBarClick?"pointer":"default"}}
          onClick={()=>onBarClick&&onBarClick(d)}
          onMouseEnter={e=>{setHov(i);show(e,
            <div><div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:C.goldL,marginBottom:4,fontSize:"0.78rem"}}>{d.label}</div>
            {(d.values||[]).map((v,j)=>(<div key={j} style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>{legend[j]||`Val ${j+1}`}: <strong style={{color:PALETTE[j]}}>{v}</strong></div>))}
            <div style={{color:"rgba(255,220,160,0.8)",fontSize:"0.7rem",marginTop:2}}>Total: <strong style={{color:"#fff"}}>{total}</strong></div></div>
          );}}
          onMouseMove={e=>move(e)} onMouseLeave={()=>{setHov(-1);hide();}}>
          <div style={{width:"100%",height,display:"flex",flexDirection:"column",justifyContent:"flex-end",opacity:hov===i?1:0.8,transition:"opacity 0.15s"}}>
            {(d.values||[]).map((v,j)=>{
              const h=Math.max(0,(v/max)*height);
              return<div key={j} style={{width:"100%",height:h,background:PALETTE[j],borderRadius:j===0?"0 0 3px 3px":j===(d.values.length-1)?"3px 3px 0 0":"0"}}/>;
            }).reverse()}
          </div>
          <span style={{fontSize:"0.56rem",color:hov===i?C.dark:C.muted,textAlign:"center",maxWidth:36,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:3}}>{d.label}</span>
        </div>);
      })}
    </div>
    {legend.length>0&&(
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8,justifyContent:"center"}}>
        {legend.map((l,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{width:9,height:9,borderRadius:2,background:PALETTE[i],flexShrink:0}}/>
            <span style={{fontSize:"0.66rem",color:C.mid}}>{l}</span>
          </div>
        ))}
      </div>
    )}
    <Tooltip tip={tip}/>
  </>);
}

function LineChart({data=[],height=70,color=C.gold}){
  const {tip,show,move,hide}=useTooltip();
  const [hov,setHov]=useState(-1);
  if(data.length<2)return<div style={{textAlign:"center",color:C.muted,fontSize:"0.74rem",padding:"14px 0"}}>Not enough data</div>;
  const vals=data.map(d=>d.value||0);
  const max=Math.max(...vals,1);
  const w=320,h=height;
  const pts=data.map((d,i)=>[(i/(data.length-1))*w,h-((d.value||0)/max)*h]);
  const poly=pts.map(p=>p.join(",")).join(" ");
  const area=`M ${pts[0][0]} ${h} ${pts.map(p=>`L ${p[0]} ${p[1]}`).join(" ")} L ${pts[pts.length-1][0]} ${h} Z`;
  return(<>
    <svg width="100%" height={h+22} viewBox={`0 0 ${w} ${h+22}`} style={{overflow:"visible"}}>
      <defs><linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity={0.25}/><stop offset="100%" stopColor={color} stopOpacity={0.01}/>
      </linearGradient></defs>
      <path d={area} fill="url(#lg1)"/>
      {[0,25,50,75,100].map(g=><line key={g} x1={0} y1={h-(g/100)*h} x2={w} y2={h-(g/100)*h} stroke="rgba(200,140,40,0.08)" strokeWidth={1} strokeDasharray="3,3"/>)}
      <polyline points={poly} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=>(
        <rect key={i} x={p[0]-10} y={0} width={20} height={h} fill="transparent"
          onMouseEnter={e=>{setHov(i);show(e,
            <div><div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color,marginBottom:3,fontSize:"0.76rem"}}>{data[i].label}</div>
            <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Value: <strong style={{color:"#fff"}}>{data[i].value}</strong></div>
            {data[i].extra&&Object.entries(data[i].extra).map(([k,v])=>(
              <div key={k} style={{color:"rgba(255,220,160,0.8)",fontSize:"0.68rem"}}>{k}: <strong style={{color:"#fff"}}>{v}</strong></div>
            ))}</div>
          );}}
          onMouseMove={e=>move(e)} onMouseLeave={()=>{setHov(-1);hide();}}
        />
      ))}
      {pts.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r={hov===i?4.5:2.5} fill={color} stroke="#fff" strokeWidth={1.5} style={{transition:"r 0.15s",pointerEvents:"none"}}/>)}
      {data.filter((_,i)=>i%Math.max(1,Math.floor(data.length/7))===0).map((d,i,arr)=>{
        const ri=data.indexOf(d);
        return<text key={i} x={(ri/(data.length-1))*w} y={h+17} textAnchor="middle" style={{fontSize:8,fill:C.light}}>{d.label.split(" ")[0]}</text>;
      })}
    </svg>
    <Tooltip tip={tip}/>
  </>);
}

function Sparkline({data=[],width=60,height=20,color=C.gold}){
  if(!data.length)return<span style={{fontSize:"0.62rem",color:C.muted}}>—</span>;
  const max=Math.max(...data,1);
  const pts=data.map((v,i)=>`${(i/Math.max(data.length-1,1))*width},${height-(v/max)*height}`).join(" ");
  return(<svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{overflow:"visible"}}>
    <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    {data.length>0&&(()=>{const lx=width,ly=height-(data[data.length-1]/max)*height;return<circle cx={lx} cy={ly} r={2.5} fill={color}/>;})()}
  </svg>);
}

// ════════════════════════════════════════════════════════════════
// CSS
// ════════════════════════════════════════════════════════════════
const css=`
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;}
.aa-root{min-height:100%;background:#f0e8dd;font-family:'DM Sans',sans-serif;display:flex;flex-direction:column;}

/* ── Banner ── */
.aa-banner{background:linear-gradient(135deg,#080200 0%,#1e0900 18%,#4a1c00 45%,#7a3200 72%,#a84800 100%);padding:28px 0 0;position:relative;overflow:hidden;flex-shrink:0;}
.aa-banner::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 75% 40%,rgba(200,120,0,0.16) 0%,transparent 50%),radial-gradient(ellipse at 15% 80%,rgba(80,20,0,0.22) 0%,transparent 45%);pointer-events:none;}
.aa-bi{max-width:1380px;margin:0 auto;padding:0 24px;position:relative;z-index:1;}
.aa-br{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:20px;}
.aa-ey{font-family:'Cinzel',serif;font-size:0.6rem;font-weight:700;color:rgba(200,150,60,0.85);letter-spacing:0.24em;text-transform:uppercase;margin-bottom:6px;display:flex;align-items:center;gap:8px;}
.aa-ey::before,.aa-ey::after{content:'';width:22px;height:1px;background:rgba(200,150,60,0.4);}
.aa-tt{font-family:'Cinzel',serif;font-size:clamp(1.3rem,2.5vw,1.9rem);font-weight:700;color:#fff;margin:0 0 5px;line-height:1.2;}
.aa-tt em{color:#f5c842;font-style:normal;}
.aa-sb{color:rgba(255,210,140,0.6);font-size:0.84rem;margin:0;}
.aa-strip{display:grid;grid-template-columns:repeat(6,1fr);border-top:1px solid rgba(255,255,255,0.08);margin:0 -24px;}
.aa-si{padding:13px 16px;border-right:1px solid rgba(255,255,255,0.07);position:relative;}
.aa-si:last-child{border-right:none;}
.aa-si::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}
.si0::before{background:linear-gradient(90deg,#f5c842,transparent);}
.si1::before{background:linear-gradient(90deg,#4ade80,transparent);}
.si2::before{background:linear-gradient(90deg,#a78bfa,transparent);}
.si3::before{background:linear-gradient(90deg,#38bdf8,transparent);}
.si4::before{background:linear-gradient(90deg,#fb923c,transparent);}
.si5::before{background:linear-gradient(90deg,#f87171,transparent);}
.aa-sv{font-family:'Cinzel',serif;font-size:1.3rem;font-weight:700;color:#fff;line-height:1;margin-bottom:2px;}
.aa-sl{font-size:0.58rem;font-weight:600;color:rgba(255,210,150,0.5);text-transform:uppercase;letter-spacing:0.1em;}

/* ── Internal nav ── */
.aa-nav{background:#fff;border-bottom:1px solid rgba(200,140,40,0.15);position:sticky;top:0;z-index:100;box-shadow:0 2px 12px rgba(61,23,0,0.07);}
.aa-nav-inner{max-width:1380px;margin:0 auto;padding:0 24px;display:flex;gap:0;overflow-x:auto;}
.aa-nav-inner::-webkit-scrollbar{display:none;}
.aa-nav-btn{padding:12px 18px;border:none;background:none;font-family:'DM Sans',sans-serif;font-size:0.82rem;font-weight:600;color:#8b6840;cursor:pointer;white-space:nowrap;border-bottom:2.5px solid transparent;transition:all 0.15s;position:relative;}
.aa-nav-btn:hover{color:#3d1800;background:rgba(200,140,40,0.05);}
.aa-nav-btn.active{color:#7a3200;border-bottom-color:#c8903c;}
.aa-nav-badge{position:absolute;top:8px;right:10px;min-width:16px;height:16px;border-radius:8px;background:#dc2626;color:#fff;font-size:0.52rem;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 3px;}

/* ── Filter bar ── */
.aa-fb{background:#fff8f0;border-bottom:1px solid rgba(200,140,40,0.12);padding:10px 24px;}
.aa-fb-in{max-width:1380px;margin:0 auto;display:flex;flex-wrap:wrap;gap:6px;align-items:center;}
.aa-sel{padding:6px 10px;border:1.5px solid rgba(200,140,40,0.2);border-radius:8px;background:#fff;color:#2d1200;font-family:'DM Sans',sans-serif;font-size:0.76rem;outline:none;cursor:pointer;transition:border-color 0.15s;}
.aa-sel:focus,.aa-sel.act{border-color:#c8903c;}
.aa-sel.act{background:rgba(200,140,40,0.08);font-weight:600;}
.aa-date-in{padding:6px 10px;border:1.5px solid rgba(200,140,40,0.2);border-radius:8px;background:#fff;color:#2d1200;font-family:'DM Sans',sans-serif;font-size:0.76rem;outline:none;}
.aa-date-in:focus{border-color:#c8903c;}
.aa-clear-btn{padding:6px 12px;border:1.5px solid rgba(220,38,38,0.22);border-radius:8px;background:rgba(220,38,38,0.05);color:#b91c1c;font-family:'DM Sans',sans-serif;font-size:0.76rem;font-weight:600;cursor:pointer;transition:all 0.15s;}
.aa-clear-btn:hover{background:rgba(220,38,38,0.1);}
.aa-filter-chip{display:flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;background:rgba(200,140,40,0.12);color:#7a4a00;font-size:0.68rem;font-weight:700;border:1px solid rgba(200,140,40,0.2);}
.aa-chip-x{cursor:pointer;opacity:0.6;font-size:0.8rem;line-height:1;}
.aa-chip-x:hover{opacity:1;}

/* ── Body ── */
.aa-body{max-width:1380px;margin:0 auto;padding:20px 24px 60px;flex:1;}

/* ── Section header ── */
.aa-sec{display:flex;align-items:center;justify-content:space-between;margin:24px 0 14px;}
.aa-sec-t{font-family:'Cinzel',serif;font-size:0.64rem;font-weight:700;color:#7a4a10;letter-spacing:0.2em;text-transform:uppercase;display:flex;align-items:center;gap:9px;}
.aa-sec-t::before{content:'';width:14px;height:2px;background:linear-gradient(90deg,#c8903c,rgba(200,140,40,0.2));border-radius:1px;}

/* ── Card ── */
.aa-card{background:#fff;border:1px solid rgba(200,140,40,0.13);border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(61,23,0,0.05);}
.aa-ch{padding:11px 16px;border-bottom:1px solid rgba(200,140,40,0.1);background:linear-gradient(to right,rgba(200,140,40,0.06),transparent);display:flex;align-items:center;justify-content:space-between;}
.aa-ct{font-family:'Cinzel',serif;font-size:0.63rem;font-weight:700;color:#5c3a14;letter-spacing:0.12em;text-transform:uppercase;}
.aa-cb{padding:14px 16px;}

/* ── KPI metrics ── */
.aa-m-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px;}
.aa-m-grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:14px;}
.aa-metric{background:#fff;border:1px solid rgba(200,140,40,0.13);border-radius:12px;padding:13px 14px;position:relative;overflow:hidden;box-shadow:0 1px 6px rgba(61,23,0,0.04);transition:all 0.18s;cursor:default;}
.aa-metric:hover{transform:translateY(-2px);box-shadow:0 5px 16px rgba(61,23,0,0.1);}
.aa-metric::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;}
.mk0::before{background:linear-gradient(90deg,#c8903c,#f5c842);}
.mk1::before{background:linear-gradient(90deg,#16a34a,#4ade80);}
.mk2::before{background:linear-gradient(90deg,#7c3aed,#a78bfa);}
.mk3::before{background:linear-gradient(90deg,#0284c7,#38bdf8);}
.mk4::before{background:linear-gradient(90deg,#6b7280,#9ca3af);}
.mk5::before{background:linear-gradient(90deg,#dc2626,#f87171);}
.mk6::before{background:linear-gradient(90deg,#d97706,#fbbf24);}
.mk7::before{background:linear-gradient(90deg,#0891b2,#22d3ee);}
.mk8::before{background:linear-gradient(90deg,#f5c842,#c8903c);}
.mk9::before{background:linear-gradient(90deg,#dc2626,#d97706);}
.mk10::before{background:linear-gradient(90deg,#059669,#34d399);}
.mk11::before{background:linear-gradient(90deg,#db2777,#f9a8d4);}
.mk12::before{background:linear-gradient(90deg,#4f46e5,#818cf8);}
.mk13::before{background:linear-gradient(90deg,#0891b2,#4ade80);}
.aa-m-ico{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;margin-bottom:6px;}
.aa-m-val{font-family:'Cinzel',serif;font-size:1.4rem;font-weight:700;color:#2d1200;line-height:1;margin-bottom:2px;}
.aa-m-lbl{font-size:0.61rem;font-weight:600;color:#8b6840;text-transform:uppercase;letter-spacing:0.06em;}
.aa-m-sub{font-size:0.61rem;color:#a08060;margin-top:2px;}

/* ── Grids ── */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px;}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px;}
.g21{display:grid;grid-template-columns:2fr 1fr;gap:14px;margin-bottom:14px;}
.g12{display:grid;grid-template-columns:1fr 2fr;gap:14px;margin-bottom:14px;}
.gf{margin-bottom:14px;}

/* ── Tables ── */
.aa-tbl{width:100%;border-collapse:collapse;}
.aa-th{padding:8px 11px;text-align:left;font-family:'Cinzel',serif;font-size:0.56rem;font-weight:700;color:#7a4a10;letter-spacing:0.14em;text-transform:uppercase;border-bottom:1.5px solid rgba(200,140,40,0.15);background:rgba(200,140,40,0.04);white-space:nowrap;cursor:pointer;}
.aa-th:hover{background:rgba(200,140,40,0.08);}
.aa-tr{border-bottom:1px solid rgba(200,140,40,0.07);transition:background 0.12s;}
.aa-tr:last-child{border-bottom:none;}
.aa-tr:hover{background:rgba(200,140,40,0.04);}
.aa-td{padding:9px 11px;font-size:0.78rem;color:#3d1800;vertical-align:middle;}
.aa-kp{font-family:'Cinzel',serif;font-size:0.7rem;font-weight:700;background:rgba(200,140,40,0.1);border:1px solid rgba(200,140,40,0.22);color:#7a3200;padding:2px 8px;border-radius:20px;white-space:nowrap;}
.aa-av{width:26px;height:26px;border-radius:7px;background:linear-gradient(135deg,#c47a00,#7a3a00);display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;font-size:0.58rem;font-weight:700;color:#fff;flex-shrink:0;}
.aa-pct{font-size:0.67rem;font-weight:700;padding:2px 7px;border-radius:20px;}
.aa-pg{background:rgba(22,163,74,0.1);color:#15803d;}
.aa-py{background:rgba(251,191,36,0.1);color:#92400e;}
.aa-pr{background:rgba(220,38,38,0.08);color:#991b1b;}
.aa-badge{font-size:0.64rem;font-weight:700;padding:2px 8px;border-radius:20px;}
.aa-badge-act{background:rgba(22,163,74,0.1);color:#15803d;border:1px solid rgba(22,163,74,0.2);}
.aa-badge-ina{background:rgba(100,100,100,0.09);color:#6b7280;border:1px solid rgba(100,100,100,0.15);}
.aa-badge-over{background:rgba(220,38,38,0.1);color:#b91c1c;border:1px solid rgba(220,38,38,0.2);}
.aa-badge-watch{background:rgba(251,191,36,0.1);color:#92400e;border:1px solid rgba(251,191,36,0.2);}
.aa-badge-ok{background:rgba(22,163,74,0.1);color:#15803d;border:1px solid rgba(22,163,74,0.2);}
.aa-badge-commit{background:rgba(79,70,229,0.1);color:#3730a3;}
.aa-badge-manj{background:rgba(219,39,119,0.1);color:#9d174d;}
.aa-badge-other{background:rgba(8,145,178,0.1);color:#0e7490;}

/* ── Legend ── */
.aa-leg{display:flex;flex-direction:column;gap:5px;}
.aa-li{display:flex;align-items:center;gap:7px;cursor:pointer;padding:3px 6px;border-radius:6px;transition:background 0.12s;}
.aa-li:hover{background:rgba(200,140,40,0.07);}
.aa-ld{width:9px;height:9px;border-radius:50%;flex-shrink:0;}
.aa-ll{font-size:0.7rem;color:#3d1800;flex:1;font-weight:500;}
.aa-lv{font-size:0.7rem;font-weight:700;color:#2d1200;}
.aa-lp{font-size:0.64rem;color:#a08060;width:26px;text-align:right;}

/* ── Insights ── */
.aa-insight-panel{background:linear-gradient(135deg,#0d0500,#2a1000,#3d1800);border-radius:14px;padding:18px 20px;margin-bottom:14px;}
.aa-ip-title{font-family:'Cinzel',serif;font-size:0.66rem;font-weight:700;color:rgba(200,150,60,0.9);letter-spacing:0.14em;text-transform:uppercase;margin-bottom:12px;display:flex;align-items:center;gap:8px;}
.aa-ii{display:flex;align-items:flex-start;gap:9px;padding:9px 12px;border-radius:9px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.07);margin-bottom:6px;}
.aa-ii:last-child{margin-bottom:0;}
.aa-ii-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:4px;}
.aa-ii-text{font-size:0.78rem;color:rgba(255,220,160,0.87);line-height:1.55;}

/* ── Today programs ── */
.aa-today-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;}
.aa-tpc{border-radius:13px;overflow:hidden;border:1px solid;transition:all 0.18s;cursor:pointer;}
.aa-tpc:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(61,23,0,0.12);}
.aa-tpc.marked{border-color:rgba(22,163,74,0.25);}
.aa-tpc.unmarked{border-color:rgba(220,38,38,0.25);}
.aa-tpc-strip{height:3px;}
.aa-tpc-strip.marked{background:linear-gradient(90deg,#16a34a,#4ade80);}
.aa-tpc-strip.unmarked{background:linear-gradient(90deg,#dc2626,#f87171);}
.aa-tpc-inner{padding:13px 15px;background:#fff;}
.aa-tpc-key{font-family:'Cinzel',serif;font-size:0.86rem;font-weight:700;color:#2d1200;margin-bottom:5px;display:flex;align-items:center;justify-content:space-between;}
.aa-tpc-owner{font-size:0.72rem;color:#8b6840;margin-bottom:8px;}
.aa-tpc-info{display:flex;flex-wrap:wrap;gap:6px;}
.aa-tpc-tag{font-size:0.64rem;font-weight:600;padding:2px 7px;border-radius:20px;background:rgba(200,140,40,0.1);color:#7a4a00;}

/* ── Risk alerts ── */
.aa-alert-item{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(200,140,40,0.07);}
.aa-alert-item:last-child{border-bottom:none;}
.aa-alert-pulse{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.aap-red{background:#dc2626;animation:aaPulse 2s ease-in-out infinite;}
.aap-amber{background:#d97706;}
@keyframes aaPulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(220,38,38,0.4)}50%{opacity:0.5;box-shadow:0 0 0 4px rgba(220,38,38,0)}}

/* ── Category card ── */
.aa-cat-card{border-radius:14px;padding:16px 18px;transition:all 0.18s;}
.aa-cat-commit{background:linear-gradient(135deg,rgba(79,70,229,0.08),rgba(79,70,229,0.03));border:1.5px solid rgba(79,70,229,0.2);}
.aa-cat-manj{background:linear-gradient(135deg,rgba(219,39,119,0.08),rgba(219,39,119,0.03));border:1.5px solid rgba(219,39,119,0.2);}
.aa-cat-other{background:linear-gradient(135deg,rgba(8,145,178,0.08),rgba(8,145,178,0.03));border:1.5px solid rgba(8,145,178,0.2);}

/* ── Search ── */
.aa-search{padding:8px 12px;border:1.5px solid rgba(200,140,40,0.2);border-radius:9px;background:#fdf8f0;color:#2d1200;font-family:'DM Sans',sans-serif;font-size:0.8rem;outline:none;width:200px;transition:border-color 0.15s;}
.aa-search:focus{border-color:#c8903c;}

/* ── Paginator ── */
.aa-pag{display:flex;align-items:center;gap:6px;justify-content:flex-end;margin-top:12px;}
.aa-pag-btn{padding:4px 10px;border:1.5px solid rgba(200,140,40,0.2);border-radius:7px;background:#fff;color:#5c3a14;font-size:0.76rem;font-weight:600;cursor:pointer;transition:all 0.15s;}
.aa-pag-btn:hover:not(:disabled){background:rgba(200,140,40,0.1);}
.aa-pag-btn:disabled{opacity:0.35;cursor:not-allowed;}
.aa-pag-btn.cur{background:rgba(200,140,40,0.15);border-color:#c8903c;color:#3d1800;}
.aa-pag-info{font-size:0.72rem;color:#a08060;}

/* ── Skel ── */
.aa-sk{background:linear-gradient(90deg,rgba(200,140,40,0.07) 25%,rgba(200,140,40,0.14) 50%,rgba(200,140,40,0.07) 75%);background-size:200% 100%;animation:aaSk 1.4s infinite;border-radius:8px;}
@keyframes aaSk{0%{background-position:200% 0}100%{background-position:-200% 0}}
.aa-sp{width:11px;height:11px;border-radius:50%;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;animation:aaSpin 0.7s linear infinite;flex-shrink:0;}
@keyframes aaSpin{to{transform:rotate(360deg)}}

/* ══════════════════════════════════════════════
   RESPONSIVE MEDIA QUERIES — full coverage
═══════════════════════════════════════════════ */

/* ── 1300px: sidebar starts to compress ── */
@media(max-width:1300px){
  .aa-sidebar{width:56px;}
  .aa-sidebar-label{display:none;}
  .aa-body{margin-left:56px;}
  .aa-strip{grid-template-columns:repeat(3,1fr);}
  .aa-m-grid{grid-template-columns:repeat(3,1fr);}
}

/* ── 1100px: 2-col grids, nav pills wrap ── */
@media(max-width:1100px){
  .aa-strip{grid-template-columns:repeat(2,1fr);}
  .aa-m-grid{grid-template-columns:repeat(2,1fr);}
  .aa-m-grid-2{grid-template-columns:1fr 1fr;}
  .g3{grid-template-columns:1fr 1fr;}
  .g4{grid-template-columns:repeat(2,1fr);}
  .aa-bi{padding:0 14px;}
  .aa-nav-pills{gap:4px;}
  .aa-np{padding:5px 10px;font-size:0.68rem;}
}

/* ── 860px: single column, full-width cards ── */
@media(max-width:860px){
  .aa-sidebar{display:none;}
  .aa-body{margin-left:0;padding:14px 14px 80px;}
  .g2,.g21,.g12,.g3,.g4{grid-template-columns:1fr !important;}
  .aa-strip{grid-template-columns:repeat(2,1fr);}
  .aa-m-grid{grid-template-columns:repeat(2,1fr);}
  .aa-bi{flex-direction:column;align-items:stretch;padding:0 14px;gap:10px;}
  .aa-filters{flex-direction:column;gap:8px;}
  .aa-sel{min-width:100%;width:100%;}
  .aa-dev-card > div[style*="grid-template-columns"]{grid-template-columns:1fr !important;}
  .aa-leader-filters{flex-wrap:wrap;gap:6px;}
  .aa-lf-sel{flex:1 1 120px;}
  .aa-search-box{flex-direction:column;}
  .aa-search-go{width:100%;}
  .aa-np{padding:5px 9px;font-size:0.66rem;}
}

/* ── 600px: mobile ── */
@media(max-width:600px){
  .aa-strip{grid-template-columns:1fr 1fr;}
  .aa-m-grid{grid-template-columns:1fr 1fr;}
  .aa-body{padding:10px 10px 72px;}
  .aa-fb{padding:8px 10px;gap:6px;}
  .aa-np{padding:4px 8px;font-size:0.64rem;}
  .aa-tbl{font-size:0.7rem;}
  .aa-th,.aa-td{padding:7px 8px;}
  .aa-card{border-radius:12px;}
  .aa-ch{padding:10px 14px;}
  .aa-cb{padding:12px 14px;}
  .aa-sec{padding:14px 0 6px;font-size:0.72rem;}
  .aa-metric{padding:12px;}
  .aa-m-val{font-size:1.1rem !important;}
  .aa-search-big{font-size:0.82rem;padding:9px 12px;}
  .aa-dev-name{font-size:0.9rem;}
  .aa-top-bar{flex-wrap:wrap;gap:6px;}
}

/* ── Leader Stacked Bar (big chart) ── */
.aa-leader-card{background:#fff;border:1px solid rgba(200,140,40,0.13);border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(61,23,0,0.08);margin-bottom:18px;}
.aa-leader-header{background:linear-gradient(135deg,#0d0500 0%,#2a1000 40%,#4a2000 100%);padding:18px 22px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
.aa-leader-title{font-family:'Cinzel',serif;font-size:0.8rem;font-weight:700;color:#fff;letter-spacing:0.1em;}
.aa-leader-filters{display:flex;gap:7px;flex-wrap:wrap;}
.aa-lf-sel{padding:5px 10px;border:1.5px solid rgba(245,200,66,0.3);border-radius:7px;background:rgba(255,255,255,0.08);color:rgba(255,220,150,0.9);font-family:'DM Sans',sans-serif;font-size:0.74rem;outline:none;cursor:pointer;}
.aa-lf-sel:focus{border-color:rgba(245,200,66,0.6);}

/* ── Combo chart legend ── */
.aa-combo-legend{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;padding:8px 12px;background:rgba(200,140,40,0.04);border-radius:9px;}
.aa-cl-item{display:flex;align-items:center;gap:5px;font-size:0.68rem;color:#5c3a14;}
.aa-cl-line{width:20px;height:2px;border-radius:1px;}
.aa-cl-dot{width:8px;height:8px;border-radius:50%;}

/* ── Filterable table card ── */
.aa-ftable-filter{display:flex;gap:7px;flex-wrap:wrap;padding:10px 14px;background:rgba(200,140,40,0.04);border-bottom:1px solid rgba(200,140,40,0.1);}
.aa-ftable-sel{padding:5px 10px;border:1.5px solid rgba(200,140,40,0.2);border-radius:7px;background:#fff;color:#2d1200;font-family:'DM Sans',sans-serif;font-size:0.76rem;outline:none;cursor:pointer;}
.aa-ftable-sel:focus,.aa-ftable-sel.act{border-color:#c8903c;}
.aa-ftable-sel.act{background:rgba(200,140,40,0.08);font-weight:600;}

/* ── Rank badge ── */
.aa-rank{width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;font-size:0.58rem;font-weight:700;color:#fff;flex-shrink:0;}
.aa-rank-1{background:linear-gradient(135deg,#f59e0b,#d97706);}
.aa-rank-2{background:linear-gradient(135deg,#94a3b8,#64748b);}
.aa-rank-3{background:linear-gradient(135deg,#cd7c3a,#92400e);}
.aa-rank-n{background:linear-gradient(135deg,#5c3a14,#3d1800);}

/* ── Devotee heat row ── */
.aa-dev-row{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(200,140,40,0.07);}
.aa-dev-row:last-child{border-bottom:none;}
.aa-dev-att-bar{flex:1;height:6px;background:rgba(200,140,40,0.1);border-radius:3px;overflow:hidden;min-width:40px;}
.aa-dev-att-fill{height:100%;border-radius:3px;}

/* ── Program insight chip ── */
.aa-prog-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:0.65rem;font-weight:700;border:1px solid;}

/* ── Trend pill ── */
.aa-trend-up{color:#15803d;font-size:0.7rem;font-weight:700;}
.aa-trend-dn{color:#b91c1c;font-size:0.7rem;font-weight:700;}
.aa-trend-st{color:#8b6840;font-size:0.7rem;}

/* ── Devotee Search ── */
.aa-search-box{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;}
.aa-search-big{flex:1;min-width:200px;padding:11px 16px;border:2px solid rgba(200,140,40,0.25);border-radius:12px;background:#fff;color:#2d1200;font-family:'DM Sans',sans-serif;font-size:0.9rem;outline:none;transition:border-color 0.15s;}
.aa-search-big:focus{border-color:#c8903c;box-shadow:0 0 0 3px rgba(200,140,40,0.1);}
.aa-search-go{padding:11px 22px;border-radius:12px;border:none;background:linear-gradient(135deg,#7a3200,#c8903c);color:#fff;font-family:'DM Sans',sans-serif;font-size:0.86rem;font-weight:700;cursor:pointer;transition:all 0.15s;}
.aa-search-go:hover{opacity:0.88;transform:translateY(-1px);}
.aa-search-go:disabled{opacity:0.5;cursor:not-allowed;transform:none;}

.aa-dev-card{background:#fff;border:1px solid rgba(200,140,40,0.15);border-radius:16px;overflow:hidden;margin-bottom:16px;box-shadow:0 3px 14px rgba(61,23,0,0.07);}
.aa-dev-card-hd{padding:16px 20px;border-bottom:1px solid rgba(200,140,40,0.1);background:linear-gradient(135deg,rgba(200,140,40,0.08),transparent);display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;}
.aa-dev-name{font-family:'Cinzel',serif;font-size:1rem;font-weight:700;color:#2d1200;}
.aa-dev-prog{font-size:0.72rem;color:#8b6840;margin-top:2px;}

.aa-status-active   {background:rgba(22,163,74,0.12);color:#15803d;border:1px solid rgba(22,163,74,0.25);}
.aa-status-moderate {background:rgba(217,119,6,0.12);color:#92400e;border:1px solid rgba(217,119,6,0.25);}
.aa-status-irregular{background:rgba(220,38,38,0.1); color:#b91c1c; border:1px solid rgba(220,38,38,0.2);}

.aa-session-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(200,140,40,0.06);font-size:0.74rem;}
.aa-session-row:last-child{border-bottom:none;}
.aa-session-dot-p{width:8px;height:8px;border-radius:50%;background:#16a34a;flex-shrink:0;}
.aa-session-dot-a{width:8px;height:8px;border-radius:50%;background:#dc2626;flex-shrink:0;}

/* ── System Overview Chord-style big chart ── */
.aa-sys-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px;}
.aa-sys-cell{background:#fff;border:1px solid rgba(200,140,40,0.13);border-radius:12px;padding:12px;text-align:center;transition:all 0.18s;cursor:default;}
.aa-sys-cell:hover{transform:translateY(-3px);box-shadow:0 6px 18px rgba(61,23,0,0.1);}
.aa-sys-cell-val{font-family:'Cinzel',serif;font-size:1.1rem;font-weight:700;color:#2d1200;margin-bottom:3px;}
.aa-sys-cell-lbl{font-size:0.58rem;font-weight:700;color:#8b6840;text-transform:uppercase;letter-spacing:0.08em;}
`;

// ── Icons ──────────────────────────────────────────────────────────────
const I=(p)=><svg width={p.s||14} height={p.s||14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={p.w||2} style={{flexShrink:0}}><path strokeLinecap="round" strokeLinejoin="round" d={p.d}/></svg>;
const IProg  =()=><I d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>;
const IUsers =()=><I d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>;
const IChart =()=><I d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>;
const IWarn  =()=><I d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>;
const ICheck =()=><I d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>;
const ISpark =()=><I d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>;
const ITrend =()=><I d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/>;
const IClock =()=><I d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>;
const ISort  =()=><I d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" s={12}/>;
const IGrid  =()=><I d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>;

// ════════════════════════════════════════════════════════════════
// #1: ATTENDANCE SUBMISSION HEATMAP (GitHub-style, system-wide)
// ════════════════════════════════════════════════════════════════
function AttendanceHeatmap({ monthlyTrend=[] }) {
  const { tip, show, move, hide } = useTooltip();
  const [hov, setHov] = useState(null);

  if (!monthlyTrend.length) return (
    <div style={{textAlign:"center",color:C.muted,fontSize:"0.76rem",padding:"20px 0"}}>No submission data yet.</div>
  );

  const max = Math.max(...monthlyTrend.map(m=>m.present||0), 1);
  const cellColor = (pct, present) => {
    if (!present) return "rgba(200,140,40,0.08)";
    if (pct>=80) return present>=50?"#15803d":"#4ade80";
    if (pct>=60) return present>=30?"#0284c7":"#60a5fa";
    if (pct>=40) return present>=20?"#d97706":"#fbbf24";
    return present>=10?"#dc2626":"#f87171";
  };

  // Build week-month grid from monthlyTrend
  return (
    <>
      <div style={{display:"flex",gap:6,alignItems:"flex-end",flexWrap:"wrap"}}>
        {monthlyTrend.map((m,i)=>{
          const h = Math.max(14, (m.present/max)*80);
          const col = cellColor(m.pct, m.present);
          return(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer"}}
              onMouseEnter={e=>{setHov(i);show(e,
                <div>
                  <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:col,marginBottom:4,fontSize:"0.78rem"}}>{m.label}</div>
                  <div style={{color:"#4ade80",fontSize:"0.72rem"}}>Present: <strong style={{color:"#fff"}}>{m.present}</strong></div>
                  <div style={{color:"#f87171",fontSize:"0.72rem"}}>Absent: <strong style={{color:"#fff"}}>{m.absent}</strong></div>
                  <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Att%: <strong style={{color:"#fff"}}>{m.pct}%</strong></div>
                  {m.sessions&&<div style={{color:"rgba(255,220,160,0.8)",fontSize:"0.7rem"}}>Sessions: <strong style={{color:"#fff"}}>{m.sessions}</strong></div>}
                </div>
              );}}
              onMouseMove={e=>move(e)} onMouseLeave={()=>{setHov(null);hide();}}
            >
              <span style={{fontSize:"0.6rem",fontWeight:700,color:hov===i?C.dark:C.muted}}>{m.pct}%</span>
              <div style={{
                width:28, height:h,
                background:col,
                borderRadius:4,
                opacity:hov!==null&&hov!==i?0.5:1,
                transition:"all 0.18s",
                transform:hov===i?"scaleY(1.05)":"none",
                outline:hov===i?`2px solid ${col}`:"none",
                outlineOffset:2,
              }}/>
              <span style={{fontSize:"0.56rem",color:C.muted,textAlign:"center",width:30,lineHeight:"1.2"}}>{m.label.split(" ")[0]}</span>
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",gap:12,marginTop:10,flexWrap:"wrap"}}>
        {[{c:"rgba(200,140,40,0.08)",l:"No data"},{c:"#f87171",l:"<40%"},{c:"#fbbf24",l:"40–59%"},{c:"#60a5fa",l:"60–79%"},{c:"#4ade80",l:"≥80%"}].map((x,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:11,height:11,borderRadius:3,background:x.c}}/>
            <span style={{fontSize:"0.62rem",color:C.muted}}>{x.l}</span>
          </div>
        ))}
      </div>
      <Tooltip tip={tip}/>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// #2: OWNER ACTIVITY TIMELINE — last N months sparkline per owner
// ════════════════════════════════════════════════════════════════
function OwnerActivityTimeline({ ownerStats=[], monthlyTrend=[] }) {
  const { tip, show, move, hide } = useTooltip();
  if (!ownerStats.length) return null;

  const sorted = [...ownerStats].sort((a,b)=>b.programCount-a.programCount).slice(0,10);
  const monthLabels = monthlyTrend.slice(-6).map(m=>m.label.split(" ")[0]);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0 8px",borderBottom:"1.5px solid rgba(200,140,40,0.15)",marginBottom:6}}>
        <span style={{width:160,fontSize:"0.6rem",fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em"}}>Owner</span>
        <span style={{flex:1,fontSize:"0.6rem",fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em"}}>6-Month Activity</span>
        <span style={{width:50,fontSize:"0.6rem",fontWeight:700,color:C.muted,textAlign:"right"}}>Score</span>
        <span style={{width:40,fontSize:"0.6rem",fontWeight:700,color:C.muted,textAlign:"right"}}>Att%</span>
      </div>
      {sorted.map((o,i)=>{
        // Simulate monthly activity from consistency score (real data would need per-owner monthly)
        const score = Math.round(o.consistencyScore);
        const statusColor = score>=70?C.green:score>=40?C.amber:C.red;
        const actDot = o.daysSinceActivity;
        const dotCol = actDot===null||actDot>14?C.red:actDot>7?C.amber:C.green;

        return(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid rgba(200,140,40,0.07)"}}
            onMouseEnter={e=>show(e,
              <div>
                <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:statusColor,marginBottom:4,fontSize:"0.78rem"}}>{o.ownerName}</div>
                <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Programs: <strong style={{color:"#fff"}}>{o.programCount}</strong></div>
                <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Devotees: <strong style={{color:"#fff"}}>{o.devoteeCount}</strong></div>
                <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Last active: <strong style={{color:dotCol}}>{actDot===null?"Never":`${actDot}d ago`}</strong></div>
                <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Overdue progs: <strong style={{color:o.overdueCount>0?C.redL:C.greenL}}>{o.overdueCount}</strong></div>
              </div>
            )}
            onMouseMove={e=>move(e)} onMouseLeave={()=>hide()}
          >
            <div style={{width:160,display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
              <div className="aa-av" style={{flexShrink:0}}>{ini(o.ownerName)}</div>
              <div style={{overflow:"hidden"}}>
                <div style={{fontSize:"0.74rem",fontWeight:600,color:"#2d1200",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.ownerName.split(" ")[0]}</div>
                <div style={{fontSize:"0.6rem",color:dotCol,fontWeight:600}}>{actDot===null?"Never active":actDot===0?"Active today":`${actDot}d ago`}</div>
              </div>
            </div>
            <div style={{flex:1,display:"flex",gap:3,alignItems:"center"}}>
              {[...Array(6)].map((_,mi)=>{
                // Visual activity simulation based on consistency
                const active = score>=(100-(mi*18)) || (mi<2 && o.attThisWeek>0);
                const intensity = active?Math.min(1,(score/100)*(1-mi*0.1)):0;
                return(
                  <div key={mi} style={{
                    flex:1,height:18,borderRadius:4,
                    background:active?`rgba(${statusColor==="#16a34a"?"22,163,74":statusColor==="#d97706"?"217,119,6":"220,38,38"},${0.2+intensity*0.6})`:"rgba(200,140,40,0.08)",
                    position:"relative",overflow:"hidden",
                  }}>
                    {mi===0&&o.attThisWeek>0&&(
                      <div style={{position:"absolute",inset:0,background:`${statusColor}40`,animation:"aaSk 2s infinite"}}/>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{width:50,textAlign:"right",flexShrink:0}}>
              <span style={{fontSize:"0.72rem",fontWeight:700,color:statusColor}}>{score}%</span>
            </div>
            <div style={{width:40,textAlign:"right",flexShrink:0}}>
              <span className={`aa-pct aa-p${pctCls(o.avgAttendance)}`} style={{fontSize:"0.62rem"}}>{o.avgAttendance}%</span>
            </div>
          </div>
        );
      })}
      <Tooltip tip={tip}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// #5: LANGUAGE × AREA MATRIX HEATMAP
// Rows=areas, Cols=languages, Cell=program count
// ════════════════════════════════════════════════════════════════
function LanguageAreaMatrix({ programTable=[] }) {
  const { tip, show, move, hide } = useTooltip();
  const [hov, setHov] = useState(null);

  const areas = [...new Set(programTable.map(p=>p.area).filter(Boolean))].sort().slice(0,8);
  const langs = [...new Set(programTable.map(p=>p.language).filter(Boolean))].sort().slice(0,8);

  if (!areas.length||!langs.length) return(
    <div style={{textAlign:"center",color:C.muted,fontSize:"0.76rem",padding:"20px 0"}}>No data.</div>
  );

  const matrix = {};
  areas.forEach(a=>{ langs.forEach(l=>{ matrix[`${a}|${l}`]=0; }); });
  programTable.forEach(p=>{ if(p.area&&p.language) matrix[`${p.area}|${p.language}`]=(matrix[`${p.area}|${p.language}`]||0)+1; });
  const maxVal = Math.max(...Object.values(matrix),1);

  const cellColor=(v)=>{
    if(!v) return "rgba(200,140,40,0.06)";
    const i=v/maxVal;
    if(i>0.75) return "#7c3aed";
    if(i>0.5)  return "#0284c7";
    if(i>0.25) return "#0891b2";
    return "#38bdf8";
  };

  const LANG_SHORT=l=>l.length>6?l.slice(0,5)+"…":l;

  return(
    <div style={{overflowX:"auto"}}>
      <table style={{borderCollapse:"separate",borderSpacing:3,minWidth:300}}>
        <thead>
          <tr>
            <th style={{padding:"4px 8px",textAlign:"left",fontSize:"0.6rem",color:C.muted,fontWeight:700,minWidth:80}}></th>
            {langs.map(l=>(
              <th key={l} style={{padding:"4px 6px",textAlign:"center",fontSize:"0.62rem",color:C.mid,fontWeight:700,minWidth:44,maxWidth:60}} title={l}>{LANG_SHORT(l)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {areas.map(a=>(
            <tr key={a}>
              <td style={{padding:"3px 8px",fontSize:"0.66rem",fontWeight:600,color:"#3d1800",whiteSpace:"nowrap",maxWidth:90,overflow:"hidden",textOverflow:"ellipsis"}} title={a}>{a}</td>
              {langs.map(l=>{
                const v=matrix[`${a}|${l}`]||0;
                const k=`${a}|${l}`;
                return(
                  <td key={l} style={{padding:0}}>
                    <div style={{
                      width:40,height:28,borderRadius:5,
                      background:cellColor(v),
                      display:"flex",alignItems:"center",justifyContent:"center",
                      cursor:v?"pointer":"default",
                      opacity:hov&&hov!==k?0.55:1,
                      transition:"all 0.15s",
                      transform:hov===k?"scale(1.1)":"none",
                      boxShadow:hov===k?`0 2px 8px ${cellColor(v)}80`:"none",
                    }}
                      onMouseEnter={e=>{setHov(k);show(e,
                        <div>
                          <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:cellColor(v)||C.goldL,marginBottom:3,fontSize:"0.76rem"}}>{a}</div>
                          <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Language: <strong style={{color:"#fff"}}>{l}</strong></div>
                          <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Programs: <strong style={{color:"#fff"}}>{v}</strong></div>
                        </div>
                      );}}
                      onMouseMove={e=>move(e)}
                      onMouseLeave={()=>{setHov(null);hide();}}
                    >
                      {v>0&&<span style={{fontSize:"0.64rem",fontWeight:700,color:"#fff"}}>{v}</span>}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:10}}>
        <span style={{fontSize:"0.62rem",color:C.muted}}>Low</span>
        {["#38bdf8","#0891b2","#0284c7","#7c3aed"].map((c,i)=><div key={i} style={{width:18,height:8,borderRadius:2,background:c}}/>)}
        <span style={{fontSize:"0.62rem",color:C.muted}}>High</span>
      </div>
      <Tooltip tip={tip}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// #6: ATTENDANCE DECAY ANALYSIS
// First 3 months avg vs last 3 months avg — shows declining programs
// ════════════════════════════════════════════════════════════════
function AttendanceDecayChart({ programTable=[] }) {
  const { tip, show, move, hide } = useTooltip();
  const [hov, setHov] = useState(-1);
  const [sortBy, setSortBy] = useState("decline");

  // Use avgPct vs daysSince as proxy for decay — programs with low pct + long gap
  const data = programTable
    .filter(p=>p.avgPct>0&&p.actFlag==="active")
    .map(p=>{
      // Estimate trend from daysSince relative to threshold
      const thresh=["Daily","Weekly"].includes(p.frequency)?7:["Monthly"].includes(p.frequency)?30:14;
      const overduePct=p.daysSince!==null?Math.min(100,Math.round((p.daysSince/thresh)*100)):100;
      const healthScore=Math.max(0,p.avgPct-(overduePct*0.3));
      return {...p, overduePct, healthScore, delta:healthScore-p.avgPct};
    })
    .sort((a,b)=>sortBy==="decline"?a.healthScore-b.healthScore:b.healthScore-a.healthScore)
    .slice(0,12);

  if(!data.length) return<div style={{textAlign:"center",color:C.muted,fontSize:"0.76rem",padding:"16px 0"}}>No data.</div>;

  const maxH=Math.max(...data.map(d=>d.avgPct),1);
  return(
    <>
      <div style={{display:"flex",gap:6,marginBottom:10}}>
        {[{v:"decline",l:"Most At Risk"},{v:"healthy",l:"Most Healthy"}].map(s=>(
          <button key={s.v} style={{padding:"4px 11px",borderRadius:7,border:"1.5px solid",borderColor:sortBy===s.v?"#c8903c":"rgba(200,140,40,0.2)",background:sortBy===s.v?"rgba(200,140,40,0.12)":"rgba(200,140,40,0.04)",color:sortBy===s.v?"#3d1800":"#8b6840",fontSize:"0.72rem",fontWeight:sortBy===s.v?700:500,cursor:"pointer"}}
            onClick={()=>setSortBy(s.v)}>{s.l}</button>
        ))}
      </div>
      <div style={{display:"flex",alignItems:"flex-end",gap:3,height:100,paddingTop:8}}>
        {data.map((p,i)=>{
          const h1=Math.max(4,(p.avgPct/maxH)*90);
          const h2=Math.max(4,(p.healthScore/maxH)*90);
          const isH=hov===i;
          return(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:0,cursor:"pointer"}}
              onMouseEnter={e=>{setHov(i);show(e,
                <div>
                  <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:pctColor(p.healthScore),marginBottom:4,fontSize:"0.78rem"}}>{p.programKey}</div>
                  <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Avg Att%: <strong style={{color:"#fff"}}>{p.avgPct}%</strong></div>
                  <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Health Score: <strong style={{color:pctColor(p.healthScore)}}>{Math.round(p.healthScore)}%</strong></div>
                  <div style={{color:"rgba(255,220,160,0.8)",fontSize:"0.7rem"}}>Owner: <strong style={{color:"#fff"}}>{p.ownerName}</strong></div>
                  <div style={{color:"rgba(255,220,160,0.8)",fontSize:"0.7rem"}}>Last: <strong style={{color:"#fff"}}>{p.daysSince!==null?`${p.daysSince}d ago`:"Never"}</strong></div>
                </div>
              );}}
              onMouseMove={e=>move(e)} onMouseLeave={()=>{setHov(-1);hide();}}
            >
              <div style={{width:"100%",height:90,display:"flex",alignItems:"flex-end",gap:1}}>
                <div style={{flex:1,height:h1,background:`${C.blue}88`,borderRadius:"2px 2px 0 0",opacity:isH?1:0.7}}/>
                <div style={{flex:1,height:h2,background:pctColor(p.healthScore),borderRadius:"2px 2px 0 0",opacity:isH?1:0.85}}/>
              </div>
              <span style={{fontSize:"0.54rem",color:isH?C.dark:C.muted,textAlign:"center",maxWidth:30,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:3}}>{p.programKey}</span>
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",gap:12,marginTop:8}}>
        {[{c:C.blue+"88",l:"Recorded Avg%"},{c:C.gold,l:"Health Score"}].map(x=>(
          <div key={x.l} style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:9,height:9,borderRadius:2,background:x.c}}/>
            <span style={{fontSize:"0.64rem",color:C.muted}}>{x.l}</span>
          </div>
        ))}
      </div>
      <Tooltip tip={tip}/>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// #7: DEVOTEE GROWTH CHART — programs growing vs stagnant
// ════════════════════════════════════════════════════════════════
function DevoteeGrowthChart({ programTable=[], ownerStats=[] }) {
  const { tip, show, move, hide } = useTooltip();

  // Classify programs by devotee count vs avg
  const totalDevotees = programTable.reduce((s,p)=>s+p.devoteeCount,0);
  const avgDevotees = programTable.length?Math.round(totalDevotees/programTable.length):0;

  const classified = programTable.filter(p=>p.actFlag==="active").map(p=>({
    ...p,
    growthClass: p.devoteeCount>avgDevotees*1.5?"growing":p.devoteeCount<avgDevotees*0.5?"shrinking":"stable",
  }));
  const growing  = classified.filter(p=>p.growthClass==="growing").length;
  const stable   = classified.filter(p=>p.growthClass==="stable").length;
  const shrinking= classified.filter(p=>p.growthClass==="shrinking").length;

  // Owner devotee count bar
  const ownerData = [...ownerStats].sort((a,b)=>b.devoteeCount-a.devoteeCount).slice(0,8);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* 3 classification cards */}
      <div style={{display:"flex",gap:10}}>
        {[{l:"Growing",v:growing,c:C.green,sub:`>${Math.round(avgDevotees*1.5)} devotees`,bg:"rgba(22,163,74,0.08)"},
          {l:"Stable",v:stable,c:C.blue,sub:`${Math.round(avgDevotees*0.5)}–${Math.round(avgDevotees*1.5)}`,bg:"rgba(2,132,199,0.08)"},
          {l:"Small",v:shrinking,c:C.amber,sub:`<${Math.round(avgDevotees*0.5)} devotees`,bg:"rgba(217,119,6,0.08)"},
        ].map(x=>(
          <div key={x.l} style={{flex:1,padding:"10px 12px",borderRadius:10,background:x.bg,border:`1px solid ${x.c}25`,textAlign:"center"}}>
            <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:"1.4rem",color:x.c}}>{x.v}</div>
            <div style={{fontSize:"0.64rem",fontWeight:700,color:"#5c3a14",textTransform:"uppercase",letterSpacing:"0.08em"}}>{x.l}</div>
            <div style={{fontSize:"0.6rem",color:C.muted,marginTop:2}}>{x.sub}</div>
          </div>
        ))}
      </div>
      {/* Owner devotee bar */}
      <VBar
        data={ownerData.map(o=>({label:o.ownerName.split(" ")[0],value:o.devoteeCount,extra:{"Avg Att":o.avgAttendance+"%","Programs":o.programCount}}))}
        height={65} colorFn={(_,i)=>PROG_COLOR_POOL[(i+5)%PROG_COLOR_POOL.length]}
      />
      <div style={{fontSize:"0.66rem",color:C.muted,textAlign:"center"}}>System avg devotees/program: <strong style={{color:C.dark}}>{avgDevotees}</strong></div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// #8: OWNER COMMITMENT SCORE — composite ranking
// ════════════════════════════════════════════════════════════════
function OwnerCommitmentScore({ ownerStats=[] }) {
  const { tip, show, move, hide } = useTooltip();
  const [hov, setHov] = useState(-1);

  const ranked = [...ownerStats].map(o=>{
    // Composite: consistency(40%) + attendance(30%) + programs(20%) + devotees(10%)
    const maxProgs = Math.max(...ownerStats.map(x=>x.programCount),1);
    const maxDevs  = Math.max(...ownerStats.map(x=>x.devoteeCount),1);
    const score = Math.round(
      (o.consistencyScore * 0.4) +
      (o.avgAttendance * 0.3) +
      ((o.programCount/maxProgs)*100 * 0.2) +
      ((o.devoteeCount/maxDevs)*100 * 0.1)
    );
    return {...o, compositeScore:score};
  }).sort((a,b)=>b.compositeScore-a.compositeScore);

  if (!ranked.length) return null;
  const max = ranked[0].compositeScore||1;

  return(
    <>
      {ranked.slice(0,10).map((o,i)=>{
        const isH=hov===i;
        const scoreColor=o.compositeScore>=70?C.green:o.compositeScore>=45?C.amber:C.red;
        const w=Math.round((o.compositeScore/max)*100);
        return(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid rgba(200,140,40,0.07)",cursor:"pointer"}}
            onMouseEnter={e=>{setHov(i);show(e,
              <div>
                <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:scoreColor,marginBottom:4,fontSize:"0.78rem"}}>{o.ownerName}</div>
                <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Composite: <strong style={{color:scoreColor}}>{o.compositeScore}%</strong></div>
                <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.7rem"}}>Consistency: <strong style={{color:"#fff"}}>{Math.round(o.consistencyScore)}%</strong></div>
                <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.7rem"}}>Avg Att: <strong style={{color:"#fff"}}>{o.avgAttendance}%</strong></div>
                <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.7rem"}}>Programs: <strong style={{color:"#fff"}}>{o.programCount}</strong></div>
                <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.7rem"}}>Devotees: <strong style={{color:"#fff"}}>{o.devoteeCount}</strong></div>
              </div>
            );}}
            onMouseMove={e=>move(e)} onMouseLeave={()=>{setHov(-1);hide();}}
          >
            <div className={`aa-rank ${i===0?"aa-rank-1":i===1?"aa-rank-2":i===2?"aa-rank-3":"aa-rank-n"}`}>{i+1}</div>
            <div className="aa-av">{ini(o.ownerName)}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:"0.76rem",fontWeight:600,color:"#2d1200",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.ownerName}</div>
              <div style={{display:"flex",gap:6,marginTop:3}}>
                {[{l:"C",v:Math.round(o.consistencyScore),col:C.blue},{l:"A",v:o.avgAttendance,col:C.green},{l:"P",v:o.programCount,col:C.gold}].map(x=>(
                  <span key={x.l} style={{fontSize:"0.6rem",padding:"1px 5px",borderRadius:10,background:`${x.col}18`,color:x.col,fontWeight:700}}>{x.l}:{x.v}{x.l!=="P"?"%":""}</span>
                ))}
              </div>
            </div>
            <div style={{width:90,display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
              <div style={{flex:1,height:6,background:"rgba(200,140,40,0.1)",borderRadius:3,overflow:"hidden"}}>
                <div style={{width:`${w}%`,height:"100%",background:`linear-gradient(90deg,${scoreColor},${scoreColor}99)`,borderRadius:3,transition:"width 0.5s ease"}}/>
              </div>
              <span style={{fontSize:"0.72rem",fontWeight:700,color:scoreColor,width:28,textAlign:"right"}}>{o.compositeScore}</span>
            </div>
          </div>
        );
      })}
      <Tooltip tip={tip}/>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// #12: AREA GROWTH MAP — programs per area with growth indicator
// ════════════════════════════════════════════════════════════════
function AreaGrowthMap({ byArea=[], programTable=[] }) {
  const { tip, show, move, hide } = useTooltip();
  const [hov, setHov] = useState(-1);
  if (!byArea.length) return null;

  const enriched = byArea.map(a=>{
    const progs=programTable.filter(p=>p.area===a.label);
    const active=progs.filter(p=>p.actFlag==="active").length;
    const inactive=progs.filter(p=>p.actFlag==="inactive").length;
    const totalDevs=progs.reduce((s,p)=>s+p.devoteeCount,0);
    const recentProgs=progs.filter(p=>p.daysSince!==null&&p.daysSince<=30).length;
    return {...a,active,inactive,totalDevs,recentProgs};
  }).sort((a,b)=>b.count-a.count);

  const maxCount=Math.max(...enriched.map(a=>a.count),1);

  return(
    <>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {enriched.map((a,i)=>{
          const isH=hov===i;
          const activeRatio=a.count>0?Math.round((a.active/a.count)*100):0;
          const barColor=pctColor(a.avgPct);
          return(
            <div key={i} style={{cursor:"pointer"}}
              onMouseEnter={e=>{setHov(i);show(e,
                <div>
                  <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:barColor,marginBottom:4,fontSize:"0.78rem"}}>{a.label}</div>
                  <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Total Programs: <strong style={{color:"#fff"}}>{a.count}</strong></div>
                  <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Active: <strong style={{color:C.greenL}}>{a.active}</strong></div>
                  <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Devotees: <strong style={{color:"#fff"}}>{a.totalDevs}</strong></div>
                  <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Avg Att%: <strong style={{color:barColor}}>{a.avgPct}%</strong></div>
                  <div style={{color:"rgba(255,220,160,0.8)",fontSize:"0.7rem"}}>Active this month: <strong style={{color:"#fff"}}>{a.recentProgs}</strong></div>
                </div>
              );}}
              onMouseMove={e=>move(e)} onMouseLeave={()=>{setHov(-1);hide();}}
            >
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{width:90,fontSize:"0.72rem",fontWeight:600,color:"#3d1800",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flexShrink:0}} title={a.label}>{a.label}</span>
                <div style={{flex:1,height:isH?12:9,background:"rgba(200,140,40,0.1)",borderRadius:5,overflow:"hidden",transition:"height 0.18s",position:"relative"}}>
                  {/* Active programs bar */}
                  <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${(a.active/maxCount)*100}%`,background:barColor,borderRadius:5,opacity:0.85}}/>
                  {/* Inactive overlay */}
                  <div style={{position:"absolute",left:`${(a.active/maxCount)*100}%`,top:0,bottom:0,width:`${(a.inactive/maxCount)*100}%`,background:"rgba(107,114,128,0.4)",borderRadius:"0 5px 5px 0"}}/>
                </div>
                <div style={{width:60,display:"flex",gap:4,alignItems:"center",flexShrink:0,justifyContent:"flex-end"}}>
                  <span style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:"0.78rem",color:"#2d1200"}}>{a.count}</span>
                  <span className={`aa-pct aa-p${pctCls(a.avgPct)}`} style={{fontSize:"0.6rem"}}>{a.avgPct}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",gap:12,marginTop:10}}>
        {[{c:C.green,l:"Active progs"},{c:"rgba(107,114,128,0.4)",l:"Inactive"},{c:C.amber,l:"40–79% att"},{c:C.red,l:"<40% att"}].map(x=>(
          <div key={x.l} style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:9,height:9,borderRadius:2,background:x.c}}/>
            <span style={{fontSize:"0.62rem",color:C.muted}}>{x.l}</span>
          </div>
        ))}
      </div>
      <Tooltip tip={tip}/>
    </>
  );
}

// ── Program category constants ─────────────────────────────────────────
const CAT_COLORS = { commitment:C.indigo, manjari:C.pink, others:C.teal };
const CAT_LABELS = { commitment:"Commitment", manjari:"Manjari", others:"Others" };

// Dynamic program type color registry — auto-assigns premium colors to any type
const _progColorCache = {};
const PROG_COLOR_POOL = [
  "#7c3aed","#0891b2","#d97706","#db2777","#16a34a","#dc2626",
  "#0284c7","#059669","#f97316","#6366f1","#84cc16","#14b8a6",
  "#e11d48","#9333ea","#0e7490","#92400e","#1d4ed8","#047857",
  "#7e22ce","#b45309","#0369a1","#065f46","#be185d","#4338ca",
];
let _progColorIdx = 0;
function progColor(type, _idx) {
  if (!type) return PROG_COLOR_POOL[0];
  const key = type.toLowerCase().replace(/\s+/g,"");
  if (!_progColorCache[key]) {
    _progColorCache[key] = PROG_COLOR_POOL[_progColorIdx % PROG_COLOR_POOL.length];
    _progColorIdx++;
  }
  return _progColorCache[key];
}

// ════════════════════════════════════════════════════════════════
// COMPONENT: LEADER STACKED BAR — big premium chart
// ════════════════════════════════════════════════════════════════
function LeaderStackedBar({ ownerStats=[], filterOptions={} }) {
  const { tip, show, move, hide } = useTooltip();
  const [hov, setHov] = useState(-1);
  const [lFilters, setLFilters] = useState({ ownerId:"", programType:"" });
  const lUpd = (k,v) => setLFilters(p=>({...p,[k]:v}));

  const owners = ownerStats.filter(o =>
    (!lFilters.ownerId || o.ownerId.toString()===lFilters.ownerId)
  );

  // All unique prog types across all owners (not just visible - for consistent legend)
  const allTypes = [...new Set(ownerStats.flatMap(o => (o.progTypes||[]).map(t=>t.type)))];
  const filteredTypes = lFilters.programType ? allTypes.filter(t=>t===lFilters.programType) : allTypes;

  if (!owners.length) return (
    <div style={{textAlign:"center",padding:"40px 0",color:"rgba(255,220,150,0.5)",fontFamily:"'Cinzel',serif",fontSize:"0.8rem"}}>No data available</div>
  );

  const barMinW = 50, barMaxW = 70, barGap = 10;
  const padL=36, padR=14, padT=12, padB=40;
  const chartH=150;
  const totalBarW = owners.length*(barMaxW+barGap);
  const svgW = Math.max(500, padL+totalBarW+padR);

  const max = Math.max(...owners.map(o=>{
    const types = o.progTypes||[];
    return types.filter(t=>filteredTypes.includes(t.type)).reduce((s,t)=>s+t.count,0);
  }),1);

  return (
    <>
      {/* Local filters */}
      <div className="aa-leader-filters">
        <select className="aa-lf-sel" value={lFilters.ownerId} onChange={e=>lUpd("ownerId",e.target.value)}>
          <option value="">All Owners</option>
          {(filterOptions.owners||[]).map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <select className="aa-lf-sel" value={lFilters.programType} onChange={e=>lUpd("programType",e.target.value)}>
          <option value="">All Types</option>
          {allTypes.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        {(lFilters.ownerId||lFilters.programType) && (
          <button style={{padding:"5px 10px",borderRadius:7,border:"1.5px solid rgba(245,200,66,0.3)",background:"rgba(220,38,38,0.15)",color:"#f87171",fontSize:"0.72rem",cursor:"pointer"}}
            onClick={()=>setLFilters({ownerId:"",programType:""})}>✕ Clear</button>
        )}
      </div>
      {/* Color legend */}
      <div style={{display:"flex",flexWrap:"wrap",gap:8,padding:"8px 22px",background:"rgba(255,255,255,0.03)",borderTop:"1px solid rgba(255,255,255,0.07)"}}>
        {filteredTypes.map((t,i)=>(
          <div key={t} style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:9,height:9,borderRadius:2,background:progColor(t),flexShrink:0}}/>
            <span style={{fontSize:"0.64rem",color:"rgba(255,220,150,0.75)",fontWeight:500}}>{t}</span>
          </div>
        ))}
      </div>
      {/* SVG Chart */}
      <div style={{padding:"16px 20px 8px",overflowX:"auto"}}>
        <svg width={svgW} height={chartH+padB} viewBox={`0 0 ${svgW} ${chartH+padB}`} style={{overflow:"visible",display:"block"}}>
          {/* Y grid */}
          {[0,25,50,75,100].map(g=>(
            <g key={g}>
              <line x1={padL} y1={chartH-(g/100)*chartH} x2={svgW-padR} y2={chartH-(g/100)*chartH} stroke="rgba(255,255,255,0.08)" strokeWidth={1} strokeDasharray="4,3"/>
              <text x={padL-5} y={chartH-(g/100)*chartH+3} textAnchor="end" style={{fontSize:8,fill:"rgba(255,220,150,0.45)"}}>{g}%</text>
            </g>
          ))}
          {/* Bars */}
          {owners.map((o,oi) => {
            const bx = padL + oi*(barMaxW+barGap);
            const bw = barMaxW;
            const types = (o.progTypes||[]).filter(t=>filteredTypes.includes(t.type));
            const total = types.reduce((s,t)=>s+t.count,0);
            let stackY = chartH;
            const isH = hov===oi;
            return (
              <g key={oi} style={{cursor:"pointer"}}
                onMouseEnter={e=>{setHov(oi);show(e,
                  <div>
                    <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:C.goldL,marginBottom:5,fontSize:"0.8rem"}}>{o.ownerName}</div>
                    <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem",marginBottom:4}}>Total: <strong style={{color:"#fff"}}>{total} programs</strong></div>
                    {types.map((t,i)=>(
                      <div key={i} style={{fontSize:"0.7rem",display:"flex",alignItems:"center",gap:5,marginBottom:1}}>
                        <span style={{width:7,height:7,borderRadius:2,background:progColor(t.type),flexShrink:0}}/>
                        <span style={{color:"rgba(255,220,160,0.85)"}}>{t.type}: <strong style={{color:"#fff"}}>{t.count}</strong></span>
                      </div>
                    ))}
                    <div style={{color:"rgba(255,220,160,0.7)",fontSize:"0.68rem",marginTop:4}}>Avg Att: <strong style={{color:C.goldL}}>{o.avgAttendance}%</strong></div>
                  </div>
                );}}
                onMouseMove={e=>move(e)}
                onMouseLeave={()=>{setHov(-1);hide();}}
              >
                {types.length===0?(
                  <rect x={bx} y={chartH-3} width={bw} height={3} fill="rgba(255,255,255,0.1)" rx={2}/>
                ):(
                  types.map((t,ti)=>{
                    const th=Math.max(2,(t.count/max)*chartH);
                    stackY-=th;
                    return(
                      <rect key={ti}
                        x={isH?bx-1:bx} y={stackY} width={isH?bw+2:bw} height={th}
                        fill={progColor(t.type)}
                        opacity={isH?1:0.78}
                        rx={ti===types.length-1?3:0}
                        style={{transition:"opacity 0.18s,width 0.1s"}}
                      />
                    );
                  })
                )}
                {total>0&&<text x={bx+bw/2} y={stackY-5} textAnchor="middle" style={{fontSize:9,fill:isH?"#fff":"rgba(255,220,150,0.7)",fontWeight:700}}>{total}</text>}
                {/* X-axis label */}
                <text x={bx+bw/2} y={chartH+15} textAnchor="middle" style={{fontSize:9,fill:"rgba(255,220,150,0.7)"}}>{o.ownerName.split(" ")[0]}</text>
                <text x={bx+bw/2} y={chartH+25} textAnchor="middle" style={{fontSize:7.5,fill:"rgba(255,220,150,0.4)"}}>({o.avgAttendance}%)</text>
              </g>
            );
          })}
        </svg>
      </div>
      <Tooltip tip={tip}/>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// COMPONENT: AREA × ATTENDANCE COMBO CHART (professional)
// Proportional bars + dual-axis line overlay
// ════════════════════════════════════════════════════════════════
function AreaComboChart({ byArea=[], byType=[], byLanguage=[] }) {
  const { tip, show, move, hide } = useTooltip();
  const [hov, setHov] = useState(-1);
  const [mode, setMode] = useState("count");

  const data = byArea.slice(0,10);
  if (!data.length) return <div style={{textAlign:"center",color:C.muted,fontSize:"0.76rem",padding:"20px 0"}}>No area data.</div>;

  const maxCount  = Math.max(...data.map(a=>a.count),1);
  const maxPct    = 100;
  const padL=38, padR=14, padT=14, padB=32, chartH=110;
  // Fully responsive: use 100% width viewBox
  const vbW = 360;
  const iw  = vbW - padL - padR;
  const ih  = chartH - padT;
  const slot = iw / data.length;
  const bw   = Math.max(10, Math.min(36, slot - 8));

  return (
    <>
      <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
        {[{v:"count",l:"Count + Att% Line"},{v:"pct",l:"Att% Only"},{v:"both",l:"Dual View"}].map(m=>(
          <button key={m.v} style={{padding:"4px 10px",borderRadius:7,border:"1.5px solid",borderColor:mode===m.v?"#c8903c":"rgba(200,140,40,0.2)",background:mode===m.v?"rgba(200,140,40,0.12)":"rgba(200,140,40,0.04)",color:mode===m.v?"#3d1800":"#8b6840",fontSize:"0.71rem",fontWeight:mode===m.v?700:500,cursor:"pointer"}}
            onClick={()=>setMode(m.v)}>{m.l}</button>
        ))}
      </div>
      <svg width="100%" height={chartH+padB} viewBox={`0 0 ${vbW} ${chartH+padB}`} style={{overflow:"visible",display:"block"}}>
        {/* Y-axis grid (left: count) */}
        {[0,25,50,75,100].map(g=>(
          <g key={g}>
            <line x1={padL} y1={padT+(1-g/100)*ih} x2={padL+iw} y2={padT+(1-g/100)*ih}
              stroke="rgba(200,140,40,0.09)" strokeWidth={1} strokeDasharray="3,3"/>
            <text x={padL-5} y={padT+(1-g/100)*ih+3} textAnchor="end"
              style={{fontSize:7,fill:C.light,fontFamily:"'DM Sans',sans-serif"}}>
              {mode==="pct"?`${g}%`:Math.round((g/100)*maxCount)}
            </text>
          </g>
        ))}

        {/* Bars */}
        {data.map((a,i)=>{
          const barH = mode==="pct"
            ? Math.max(3,(a.avgPct/maxPct)*ih)
            : Math.max(3,(a.count/maxCount)*ih);
          const bx  = padL + i*slot + (slot-bw)/2;
          const by  = padT + ih - barH;
          const col = PALETTE[i%PALETTE.length];
          const isH = hov===i;
          return(
            <g key={i} style={{cursor:"pointer"}}
              onMouseEnter={e=>{setHov(i);show(e,
                <div>
                  <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:col,marginBottom:3,fontSize:"0.78rem"}}>{a.label}</div>
                  <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Programs: <strong style={{color:"#fff"}}>{a.count}</strong></div>
                  <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Avg Att%: <strong style={{color:C.goldL}}>{a.avgPct}%</strong></div>
                </div>
              );}}
              onMouseMove={e=>move(e)}
              onMouseLeave={()=>{setHov(-1);hide();}}
            >
              <rect x={bx} y={by} width={bw} height={barH}
                fill={col} opacity={isH?1:0.68}
                rx={3} ry={3}
                style={{transition:"opacity 0.15s"}}
              />
              {isH&&<rect x={bx} y={by} width={bw} height={barH}
                fill={col} opacity={0.25} rx={3} ry={3}
                style={{filter:"blur(4px)"}}
              />}
              {/* Value label */}
              <text x={bx+bw/2} y={by-3} textAnchor="middle"
                style={{fontSize:7.5,fill:isH?col:C.muted,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>
                {mode==="pct"?`${a.avgPct}%`:a.count}
              </text>
              {/* X label */}
              <text x={bx+bw/2} y={padT+ih+14} textAnchor="middle"
                style={{fontSize:8,fill:isH?C.dark:C.light,fontFamily:"'DM Sans',sans-serif"}} title={a.label}>
                {a.label.length>7?a.label.slice(0,6)+"…":a.label}
              </text>
            </g>
          );
        })}

        {/* Att% overlay line (always shown) */}
        {mode!=="pct"&&(()=>{
          const pts = data.map((a,i)=>{
            const cx = padL + i*slot + slot/2;
            const cy = padT + (1-a.avgPct/maxPct)*ih;
            return {cx,cy,a};
          });
          const poly = pts.map(p=>`${p.cx},${p.cy}`).join(" ");
          const areaD = `M ${pts[0].cx} ${padT+ih} ${pts.map(p=>`L ${p.cx} ${p.cy}`).join(" ")} L ${pts[pts.length-1].cx} ${padT+ih} Z`;
          return(
            <g>
              <path d={areaD} fill={C.goldL} fillOpacity={0.07}/>
              <polyline points={poly} fill="none" stroke={C.goldL} strokeWidth={2.5}
                strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray={mode==="both"?"5,3":"none"}/>
              {pts.map((p,i)=>(
                <circle key={i} cx={p.cx} cy={p.cy} r={hov===i?5:3}
                  fill={C.goldL} stroke="#fff" strokeWidth={1.5}
                  style={{cursor:"crosshair",transition:"r 0.15s",pointerEvents:"none"}}
                />
              ))}
            </g>
          );
        })()}
      </svg>
      <div className="aa-combo-legend">
        <div className="aa-cl-item">
          <div style={{width:20,height:3,borderRadius:1,background:C.goldL}}/>
          <span>Avg Att% (line)</span>
        </div>
        <div className="aa-cl-item">
          <div style={{width:9,height:9,borderRadius:2,background:PALETTE[0],opacity:0.7}}/>
          <span>Program count (bar, color=area)</span>
        </div>
      </div>
      <Tooltip tip={tip}/>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// GITHUB-STYLE DAILY ATTENDANCE HEATMAP
// ════════════════════════════════════════════════════════════════
function DailyAttendanceHeatmap({ dailySubmissions=[] }) {
  const { tip, show, move, hide } = useTooltip();
  const [sel, setSel] = useState(null);

  const today = new Date(); today.setHours(0,0,0,0);
  const dataMap = {};
  dailySubmissions.forEach(d => { dataMap[d.date]=d.count; });

  const days = [];
  for (let i=89; i>=0; i--) {
    const d=new Date(today); d.setDate(d.getDate()-i);
    const key=d.toISOString().split("T")[0];
    days.push({ date:key, d, count:dataMap[key]||0 });
  }

  const maxCount = Math.max(...days.map(d=>d.count),1);
  const todayStr = today.toISOString().split("T")[0];
  const cellColor = c => {
    if (!c) return "rgba(200,140,40,0.08)";
    const i=c/maxCount;
    if (i>0.75) return "#7c3aed";
    if (i>0.5)  return "#0891b2";
    if (i>0.25) return "#16a34a";
    return "#84cc16";
  };

  const firstDow=days[0].d.getDay();
  const weeks=[]; let week=Array(firstDow).fill(null);
  days.forEach(day=>{
    week.push(day);
    if(week.length===7){weeks.push(week);week=[];}
  });
  if(week.length>0){while(week.length<7)week.push(null);weeks.push(week);}

  const DLABELS=["S","M","T","W","T","F","S"];
  const totalActive=days.filter(d=>d.count>0).length;
  const totalRecords=days.reduce((s,d)=>s+d.count,0);
  const peak=days.reduce((p,d)=>d.count>p.count?d:p,{count:0,date:""});

  return (
    <div className="aa-card gf">
      <div className="aa-ch">
        <span className="aa-ct">Daily Attendance Activity — Last 90 Days</span>
        <div style={{display:"flex",gap:10}}>
          <span style={{fontSize:"0.64rem",color:C.muted}}>{totalActive} active days</span>
          <span style={{fontSize:"0.64rem",color:C.muted}}>{totalRecords} total records</span>
          {peak.count>0&&<span style={{fontSize:"0.64rem",color:C.gold}}>Peak: {peak.count} on {peak.date}</span>}
        </div>
      </div>
      <div className="aa-cb">
        <div style={{display:"flex",gap:4,alignItems:"flex-start",overflowX:"auto",paddingBottom:4}}>
          <div style={{display:"flex",flexDirection:"column",gap:3,paddingTop:18,flexShrink:0}}>
            {DLABELS.map((l,i)=><div key={i} style={{width:11,height:11,fontSize:8,color:C.muted,textAlign:"center",lineHeight:"11px"}}>{l}</div>)}
          </div>
          {weeks.map((week,wi)=>{
            const first=week.find(d=>d!==null);
            const mo=first&&first.d.getDate()<=7?first.d.toLocaleDateString("en-IN",{month:"short"}):"";
            return(
              <div key={wi} style={{display:"flex",flexDirection:"column",gap:3,flexShrink:0}}>
                <div style={{height:14,fontSize:8,color:C.muted,textAlign:"center",lineHeight:"14px"}}>{mo}</div>
                {week.map((day,di)=>{
                  if(!day) return <div key={di} style={{width:11,height:11}}/>;
                  const isT=day.date===todayStr, isS=sel===day.date;
                  const col=cellColor(day.count);
                  return(
                    <div key={di} style={{
                        width:11,height:11,borderRadius:2,background:col,
                        cursor:day.count>0?"pointer":"default",
                        outline:isT?`2px solid ${C.gold}`:isS?"2px solid #fff":"none",
                        outlineOffset:1,transform:isS?"scale(1.3)":"scale(1)",transition:"transform 0.1s",
                      }}
                      onMouseEnter={e=>{if(day.count>0)show(e,
                        <div>
                          <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:col,marginBottom:4,fontSize:"0.76rem"}}>{day.d.toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}</div>
                          <div style={{color:"#4ade80",fontSize:"0.72rem"}}>Records: <strong style={{color:"#fff"}}>{day.count}</strong></div>
                          <div style={{color:"rgba(255,220,160,0.8)",fontSize:"0.68rem",marginTop:2}}>{Math.round((day.count/maxCount)*100)}% of peak</div>
                        </div>
                      );}}
                      onMouseMove={e=>move(e)} onMouseLeave={()=>hide()}
                      onClick={()=>setSel(p=>p===day.date?null:day.date)}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:10,flexWrap:"wrap"}}>
          <span style={{fontSize:"0.62rem",color:C.muted}}>Less</span>
          {["rgba(200,140,40,0.08)","#84cc16","#16a34a","#0891b2","#7c3aed"].map((c,i)=><div key={i} style={{width:11,height:11,borderRadius:2,background:c}}/>)}
          <span style={{fontSize:"0.62rem",color:C.muted}}>More</span>
          <span style={{fontSize:"0.62rem",color:C.muted,marginLeft:8}}>Gold ring = today</span>
        </div>
      </div>
      <Tooltip tip={tip}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// AREA × TYPE/LANGUAGE ADVANCED CHART
// X: Areas | Bars: Language stacked | Lines: Type dotted
// ════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════
// COMPONENT: AREA-WISE PROGRAM DISTRIBUTION — Language + Type + Record Count
// Reference image: teal bars=language, blue solid line=type, pink dashed=record count
// X-axis: area names (angled so they never crop)
// ════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════
// COMPONENT: AREA × TYPE / LANGUAGE / RECORD COUNT — RECHARTS STYLE
// Full-width proper chart matching reference image.
// Teal bars = language count, Blue line = type count, Pink dashed = record count
// ════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════
// COMPONENT: SINGLE BAR CHART (standalone, proper hover state)
// ════════════════════════════════════════════════════════════════
function SingleBarChart({ data=[], label="", colorFn, showPct=false }) {
  const { tip, show, move, hide } = useTooltip();
  const [hov, setHov] = useState(-1);

  if (!data.length) return <div style={{textAlign:"center",color:C.muted,fontSize:"0.76rem",padding:"16px 0"}}>No data</div>;

  const max   = Math.max(...data.map(d=>d.value), 1);
  // Responsive: wider bars when fewer items, narrower when more
  const n     = data.length;
  const padL=36, padR=8, padT=14, padB=38, chartH=110;
  const vbW   = 280;
  const iw    = vbW - padL - padR;
  const ih    = chartH - padT;
  const slot  = iw / n;
  // Bar width: fills ~65% of slot, min 14px max 44px — looks right at 2 or 12 bars
  const bw    = Math.max(14, Math.min(44, slot * 0.65));

  return (
    <>
      <svg width="100%" height={chartH+padB} viewBox={`0 0 ${vbW} ${chartH+padB}`}
        style={{display:"block",overflow:"visible"}}>
        {/* Y grid */}
        {[0,25,50,75,100].map(g=>(
          <g key={g}>
            <line x1={padL} y1={padT+(1-g/100)*ih} x2={padL+iw} y2={padT+(1-g/100)*ih}
              stroke="rgba(200,140,40,0.09)" strokeWidth={1} strokeDasharray="3,3"/>
            <text x={padL-4} y={padT+(1-g/100)*ih+3} textAnchor="end"
              style={{fontSize:7,fill:C.light}}>{showPct?`${g}%`:Math.round((g/100)*max)}</text>
          </g>
        ))}
        {/* Bars */}
        {data.map((d,i)=>{
          const bh  = Math.max(3,(d.value/max)*ih);
          const bx  = padL + i*slot + (slot-bw)/2;
          const by  = padT + ih - bh;
          const col = colorFn(d,i);
          const isH = hov===i;
          return (
            <g key={i} style={{cursor:"pointer"}}
              onMouseEnter={e=>{setHov(i);show(e,
                <div>
                  <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:col,marginBottom:4,fontSize:"0.8rem"}}>{d.fullLabel||d.label}</div>
                  <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>{label}: <strong style={{color:"#fff"}}>{d.value}{showPct?"%":""}</strong></div>
                  {d.extra&&Object.entries(d.extra).map(([k,v])=>(
                    <div key={k} style={{color:"rgba(255,220,160,0.8)",fontSize:"0.68rem"}}>{k}: {v}</div>
                  ))}
                </div>
              );}}
              onMouseMove={e=>move(e)}
              onMouseLeave={()=>{setHov(-1);hide();}}
            >
              <rect x={isH?bx-1:bx} y={by} width={isH?bw+2:bw} height={bh}
                fill={col} opacity={isH?1:0.75} rx={3}
                style={{transition:"opacity 0.15s"}}
              />
              {/* Value label above bar on hover */}
              {isH&&<text x={bx+bw/2} y={by-4} textAnchor="middle"
                style={{fontSize:8.5,fill:col,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>{d.value}</text>}
              {/* X-axis label — angled for readability */}
              <text
                x={bx+bw/2} y={padT+ih+14}
                textAnchor="end"
                transform={`rotate(-38,${bx+bw/2},${padT+ih+14})`}
                style={{fontSize:n<=4?9:8,fill:isH?C.dark:C.muted,fontFamily:"'DM Sans',sans-serif"}}
                title={d.fullLabel||d.label}
              >
                {n<=4 ? (d.fullLabel||d.label) : d.label.length>9 ? d.label.slice(0,8)+"…" : d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <Tooltip tip={tip}/>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// COMPONENT: THREE SIMPLE BAR CHARTS ROW
// 1. Days vs Program Count
// 2. Area vs Program Count
// 3. Area vs Devotee Count
// ════════════════════════════════════════════════════════════════
function ThreeBarCharts({ programTable=[], byArea=[], byDay=[] }) {
  const DAY_COLORS={Monday:"#3b82f6",Tuesday:"#10b981",Wednesday:"#8b5cf6",
    Thursday:"#f59e0b",Friday:"#14b8a6",Saturday:"#ec4899",Sunday:"#ef4444"};
  const DAYS_ORD=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

  const dayData = DAYS_ORD.map(d=>({
    label:   d.slice(0,3),
    fullLabel: d,
    value:   programTable.filter(p=>(p.day||"").toLowerCase()===d.toLowerCase()).length,
    extra:   {"Full day":d},
  }));

  const areaProgData = (byArea||[]).slice(0,9).map(a=>({
    label:   a.label.length>9?a.label.slice(0,8)+"…":a.label,
    fullLabel: a.label,
    value:   a.count,
    extra:   {"Avg Att%":a.avgPct+"%"},
  }));

  const areaDevData = (byArea||[]).slice(0,9).map(a=>({
    label:   a.label.length>9?a.label.slice(0,8)+"…":a.label,
    fullLabel: a.label,
    value:   programTable.filter(p=>p.area===a.label).reduce((s,p)=>s+(p.devoteeCount||0),0),
    extra:   {"Programs":a.count,"Avg Att%":a.avgPct+"%"},
  }));

  return(
    <div className="g3">
      <div className="aa-card">
        <div className="aa-ch"><span className="aa-ct">Day-wise Program Count</span></div>
        <div className="aa-cb">
          <SingleBarChart
            data={dayData}
            label="Programs"
            colorFn={d=>DAY_COLORS[DAYS_ORD.find(dd=>dd.slice(0,3)===d.label)||"Monday"]||C.gold}
          />
        </div>
      </div>
      <div className="aa-card">
        <div className="aa-ch"><span className="aa-ct">Area vs Program Count</span></div>
        <div className="aa-cb">
          <SingleBarChart
            data={areaProgData}
            label="Programs"
            colorFn={(_,i)=>PALETTE[i%PALETTE.length]}
          />
        </div>
      </div>
      <div className="aa-card">
        <div className="aa-ch"><span className="aa-ct">Area vs Devotee Count</span></div>
        <div className="aa-cb">
          <SingleBarChart
            data={areaDevData}
            label="Devotees"
            colorFn={(_,i)=>PALETTE[(i+4)%PALETTE.length]}
          />
        </div>
      </div>
    </div>
  );
}

function DayWiseTable({ programTable=[], filterOptions={} }) {
  const [dayF,  setDayF]  = useState("");
  const [ownF,  setOwnF]  = useState("");

  const filtered = programTable.filter(p =>
    (!dayF  || (p.day||"").toLowerCase()===dayF.toLowerCase()) &&
    (!ownF  || p.ownerName?.toLowerCase().includes(ownF.toLowerCase()))
  );

  // Group by day
  const DAYS_ORDER = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const byDay = {};
  DAYS_ORDER.forEach(d=>{byDay[d]=[];});
  filtered.forEach(p=>{
    const d=(p.day||"").trim();
    if(byDay[d]) byDay[d].push(p);
    else byDay["Other"]=(byDay["Other"]||[]).concat(p);
  });

  const DAY_COLORS_MAP = {Monday:"#3b82f6",Tuesday:"#10b981",Wednesday:"#8b5cf6",Thursday:"#f59e0b",Friday:"#14b8a6",Saturday:"#ec4899",Sunday:"#ef4444"};

  return (
    <>
      <div className="aa-ftable-filter">
        <select className={`aa-ftable-sel${dayF?" act":""}`} value={dayF} onChange={e=>setDayF(e.target.value)}>
          <option value="">All Days</option>
          {DAYS_ORDER.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
        <select className={`aa-ftable-sel${ownF?" act":""}`} value={ownF} onChange={e=>setOwnF(e.target.value)}>
          <option value="">All Owners</option>
          {(filterOptions.owners||[]).map(o=><option key={o.id} value={o.name}>{o.name}</option>)}
        </select>
        {(dayF||ownF)&&<button style={{padding:"4px 10px",borderRadius:7,border:"1px solid rgba(220,38,38,0.2)",background:"rgba(220,38,38,0.05)",color:"#b91c1c",fontSize:"0.72rem",cursor:"pointer"}} onClick={()=>{setDayF("");setOwnF("");}}>✕</button>}
        <span style={{marginLeft:"auto",fontSize:"0.68rem",color:C.muted}}>{filtered.length} programs</span>
      </div>
      <div style={{overflowX:"auto",maxHeight:400,overflowY:"auto"}}>
        <table className="aa-tbl" style={{minWidth:500}}>
          <thead><tr>
            {["Day","Count","Top Owner","Avg Att%","Types"].map(c=><th key={c} className="aa-th" style={{cursor:"default"}}>{c}</th>)}
          </tr></thead>
          <tbody>
            {DAYS_ORDER.filter(d=>dayF?d===dayF:byDay[d]?.length>0).map(day=>{
              const progs=byDay[day]||[];
              if(!progs.length) return null;
              const topOwner=Object.entries(progs.reduce((m,p)=>{m[p.ownerName]=(m[p.ownerName]||0)+1;return m},{})).sort((a,b)=>b[1]-a[1])[0];
              const avgPct=Math.round(progs.filter(p=>p.avgPct>0).reduce((s,p)=>s+p.avgPct,0)/Math.max(progs.filter(p=>p.avgPct>0).length,1));
              const types=[...new Set(progs.map(p=>p.programType).filter(Boolean))].slice(0,3);
              return(
                <tr key={day} className="aa-tr">
                  <td className="aa-td">
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <span style={{width:9,height:9,borderRadius:"50%",background:DAY_COLORS_MAP[day]||C.gold,flexShrink:0}}/>
                      <span style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:"#2d1200"}}>{day}</span>
                    </div>
                  </td>
                  <td className="aa-td" style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:"1rem",color:DAY_COLORS_MAP[day]||C.gold}}>{progs.length}</td>
                  <td className="aa-td" style={{fontSize:"0.76rem"}}>{topOwner?topOwner[0]:"—"}<span style={{fontSize:"0.64rem",color:C.muted}}>{topOwner?` (${topOwner[1]})`:""}</span></td>
                  <td className="aa-td"><span className={`aa-pct aa-p${pctCls(avgPct)}`}>{avgPct}%</span></td>
                  <td className="aa-td" style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                    {types.map(t=><span key={t} style={{fontSize:"0.62rem",padding:"1px 6px",borderRadius:20,background:`${progColor(t)}18`,color:progColor(t),border:`1px solid ${progColor(t)}40`}}>{t}</span>)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// COMPONENT: OWNER-WISE PROGRAM TABLE with filter
// ════════════════════════════════════════════════════════════════
function OwnerWiseTable({ ownerStats=[], filterOptions={} }) {
  const [ownF, setOwnF] = useState("");
  const sorted=[...ownerStats].sort((a,b)=>b.programCount-a.programCount);
  const filtered=sorted.filter(o=>!ownF||o.ownerId.toString()===ownF);

  return(
    <>
      <div className="aa-ftable-filter">
        <select className={`aa-ftable-sel${ownF?" act":""}`} value={ownF} onChange={e=>setOwnF(e.target.value)}>
          <option value="">All Owners</option>
          {(filterOptions.owners||[]).map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        {ownF&&<button style={{padding:"4px 10px",borderRadius:7,border:"1px solid rgba(220,38,38,0.2)",background:"rgba(220,38,38,0.05)",color:"#b91c1c",fontSize:"0.72rem",cursor:"pointer"}} onClick={()=>setOwnF("")}>✕</button>}
        <span style={{marginLeft:"auto",fontSize:"0.68rem",color:C.muted}}>{filtered.length} owners</span>
      </div>
      <div style={{overflowX:"auto"}}>
        <table className="aa-tbl" style={{minWidth:560}}>
          <thead><tr>
            {["#","Owner","Total Progs","Active","Devotees","Commitment","Manjari","Others","Avg Att%"].map(c=><th key={c} className="aa-th" style={{cursor:"default"}}>{c}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map((o,i)=>(
              <tr key={String(o.ownerId)} className="aa-tr">
                <td className="aa-td">
                  <div className={`aa-rank ${i===0?"aa-rank-1":i===1?"aa-rank-2":i===2?"aa-rank-3":"aa-rank-n"}`}>{i+1}</div>
                </td>
                <td className="aa-td">
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <div className="aa-av">{ini(o.ownerName)}</div>
                    <span style={{fontWeight:600,fontSize:"0.78rem",color:"#2d1200"}}>{o.ownerName}</span>
                  </div>
                </td>
                <td className="aa-td" style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:"1rem",color:C.gold}}>{o.programCount}</td>
                <td className="aa-td" style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:C.green}}>{o.activeCount}</td>
                <td className="aa-td" style={{fontFamily:"'Cinzel',serif",fontWeight:700}}>{o.devoteeCount}</td>
                <td className="aa-td"><span className="aa-badge aa-badge-commit">{o.commitment}</span></td>
                <td className="aa-td"><span className="aa-badge aa-badge-manj">{o.manjari}</span></td>
                <td className="aa-td"><span className="aa-badge aa-badge-other">{o.others}</span></td>
                <td className="aa-td"><span className={`aa-pct aa-p${pctCls(o.avgAttendance)}`}>{o.avgAttendance}%</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// COMPONENT: PROGRAM TYPE TABLE with filter
// ════════════════════════════════════════════════════════════════
function ProgramTypeTable({ programTable=[], filterOptions={} }) {
  const [typeF, setTypeF] = useState("");
  const filtered = programTable.filter(p=>!typeF||p.programType===typeF);

  // Aggregate by type
  const typeMap={};
  filtered.forEach(p=>{
    const t=p.programType||"Unknown";
    if(!typeMap[t]) typeMap[t]={type:t,count:0,active:0,devotees:0,pctSum:0,pctCount:0};
    typeMap[t].count++;
    if(p.actFlag==="active") typeMap[t].active++;
    typeMap[t].devotees+=p.devoteeCount||0;
    if(p.avgPct>0){typeMap[t].pctSum+=p.avgPct;typeMap[t].pctCount++;}
  });

  const typeRows=Object.values(typeMap).sort((a,b)=>b.count-a.count);

  return(
    <>
      <div className="aa-ftable-filter">
        <select className={`aa-ftable-sel${typeF?" act":""}`} value={typeF} onChange={e=>setTypeF(e.target.value)}>
          <option value="">All Program Types</option>
          {(filterOptions.programTypes||[]).map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        {typeF&&<button style={{padding:"4px 10px",borderRadius:7,border:"1px solid rgba(220,38,38,0.2)",background:"rgba(220,38,38,0.05)",color:"#b91c1c",fontSize:"0.72rem",cursor:"pointer"}} onClick={()=>setTypeF("")}>✕</button>}
        <span style={{marginLeft:"auto",fontSize:"0.68rem",color:C.muted}}>
          {typeF?`${filtered.length} programs`:typeRows.length+" types"}</span>
      </div>
      <div style={{overflowX:"auto",maxHeight:320,overflowY:"auto"}}>
        <table className="aa-tbl">
          <thead><tr>
            {["Type","Programs","Active","Devotees","Avg Att%","Category","Health Bar"].map(c=><th key={c} className="aa-th" style={{cursor:"default"}}>{c}</th>)}
          </tr></thead>
          <tbody>
            {typeRows.map((t,i)=>{
              const avg=t.pctCount?Math.round(t.pctSum/t.pctCount):0;
              const cat=["bhaktivriksha","bv","japa","study"].some(k=>t.type.toLowerCase().includes(k))?"commitment":
                        ["manjari","gita","tulasi"].some(k=>t.type.toLowerCase().includes(k))?"manjari":"others";
              return(
                <tr key={t.type} className="aa-tr">
                  <td className="aa-td">
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{width:9,height:9,borderRadius:2,background:progColor(t.type,i),flexShrink:0}}/>
                      <span style={{fontWeight:600,fontSize:"0.78rem",color:"#2d1200"}}>{t.type}</span>
                    </div>
                  </td>
                  <td className="aa-td" style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:progColor(t.type,i)}}>{t.count}</td>
                  <td className="aa-td" style={{color:C.green,fontWeight:600}}>{t.active}</td>
                  <td className="aa-td" style={{fontFamily:"'Cinzel',serif",fontWeight:700}}>{t.devotees}</td>
                  <td className="aa-td"><span className={`aa-pct aa-p${pctCls(avg)}`}>{avg}%</span></td>
                  <td className="aa-td"><span className={`aa-badge aa-badge-${cat}`}>{CAT_LABELS[cat]}</span></td>
                  <td className="aa-td" style={{minWidth:90}}>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <div style={{flex:1,height:5,background:"rgba(200,140,40,0.1)",borderRadius:3,overflow:"hidden"}}>
                        <div style={{width:`${avg}%`,height:"100%",background:pctColor(avg),borderRadius:3}}/>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// COMPONENT: DEVOTEE DEEP ANALYTICS
// ════════════════════════════════════════════════════════════════
function DevoteeDeepAnalytics({ topDevotees=[], bottomDevotees=[], ownerStats=[] }) {
  const { tip, show, move, hide } = useTooltip();
  const [tab, setTab] = useState("top");

  const list = tab==="top" ? topDevotees : bottomDevotees;
  const max = Math.max(...list.map(d=>d.percentage),1);

  return(
    <>
      {/* Tab selector */}
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        {[{v:"top",l:"Most Regular"},{ v:"bottom",l:"Irregular (<60%)"},].map(t=>(
          <button key={t.v} style={{padding:"5px 14px",borderRadius:8,border:"1.5px solid",borderColor:tab===t.v?"#c8903c":"rgba(200,140,40,0.2)",background:tab===t.v?"rgba(200,140,40,0.12)":"#fff",color:tab===t.v?"#3d1800":"#8b6840",fontSize:"0.76rem",fontWeight:tab===t.v?700:500,cursor:"pointer",transition:"all 0.15s"}}
            onClick={()=>setTab(t.v)}>{t.l}</button>
        ))}
      </div>
      {/* Attendance bar chart per devotee */}
      {list.slice(0,12).map((d,i)=>{
        const w=Math.round((d.percentage/max)*100);
        const color=pctColor(d.percentage);
        return(
          <div key={i} className="aa-dev-row"
            onMouseEnter={e=>show(e,
              <div>
                <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color,marginBottom:3,fontSize:"0.78rem"}}>{d.devoteeName}</div>
                <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Program: <strong style={{color:"#fff"}}>{d.programKey}</strong></div>
                <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Attended: <strong style={{color:"#fff"}}>{d.attended}/{d.totalSessions}</strong></div>
                <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Rate: <strong style={{color}}>{d.percentage}%</strong></div>
              </div>
            )}
            onMouseMove={e=>move(e)} onMouseLeave={()=>hide()}
          >
            <div style={{width:18,height:18,borderRadius:5,background:`linear-gradient(135deg,${C.gold},#7a3a00)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.52rem",fontWeight:700,color:"#fff",flexShrink:0}}>{i+1}</div>
            <span style={{width:130,flexShrink:0,fontSize:"0.74rem",fontWeight:500,color:"#2d1200",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.devoteeName}</span>
            <span style={{width:68,flexShrink:0,fontSize:"0.62rem",color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.programKey}</span>
            <div className="aa-dev-att-bar">
              <div className="aa-dev-att-fill" style={{width:`${w}%`,background:`linear-gradient(90deg,${color},${color}99)`}}/>
            </div>
            <span style={{fontSize:"0.64rem",color:C.muted,width:36,textAlign:"right",flexShrink:0}}>{d.attended}/{d.totalSessions}</span>
            <span className={`aa-pct aa-p${pctCls(d.percentage)}`} style={{flexShrink:0}}>{d.percentage}%</span>
          </div>
        );
      })}
      {!list.length&&<div style={{textAlign:"center",padding:"16px 0",color:C.muted,fontSize:"0.76rem"}}>No data.</div>}
      <Tooltip tip={tip}/>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// COMPONENT: PROGRAM-LEVEL LINE CHARTS
// ════════════════════════════════════════════════════════════════
function ProgramInsightCharts({ byArea=[], byType=[], byLanguage=[], monthlyTrend=[] }) {
  const { tip, show, move, hide } = useTooltip();
  const [mode, setMode] = useState("area_att");

  const modes = [
    {v:"area_att",  l:"Area vs Att%"},
    {v:"type_att",  l:"Type vs Att%"},
    {v:"lang_att",  l:"Language vs Att%"},
    {v:"monthly",   l:"Monthly Trend"},
  ];

  let chartData = [];
  if (mode==="area_att")  chartData = byArea.slice(0,10).map(a=>({label:a.label,value:a.avgPct,count:a.count,color:PALETTE[byArea.indexOf(a)%PALETTE.length]}));
  if (mode==="type_att")  chartData = byType.slice(0,10).map(t=>({label:t.label,value:t.avgPct,count:t.count,color:progColor(t.label,byType.indexOf(t))}));
  if (mode==="lang_att")  chartData = byLanguage.map(l=>({label:l.label,value:l.avgPct,count:l.count,color:PALETTE[(byLanguage.indexOf(l)+2)%PALETTE.length]}));
  if (mode==="monthly")   chartData = monthlyTrend.map(m=>({label:m.label,value:m.pct,count:m.present,color:C.gold}));

  return(
    <>
      <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
        {modes.map(m=>(
          <button key={m.v} style={{padding:"4px 11px",borderRadius:7,border:"1.5px solid",borderColor:mode===m.v?"#c8903c":"rgba(200,140,40,0.2)",background:mode===m.v?"rgba(200,140,40,0.12)":"rgba(200,140,40,0.04)",color:mode===m.v?"#3d1800":"#8b6840",fontSize:"0.72rem",fontWeight:mode===m.v?700:500,cursor:"pointer",transition:"all 0.15s"}}
            onClick={()=>setMode(m.v)}>{m.l}</button>
        ))}
      </div>
      {chartData.length>=2
        ? <LineChart data={chartData.map(d=>({label:d.label,value:d.value,extra:{"Count":d.count}}))} height={80} color={C.gold}/>
        : <div style={{textAlign:"center",color:C.muted,fontSize:"0.76rem",padding:"16px 0"}}>Not enough data.</div>
      }
    </>
  );
}

// ── Table component ────────────────────────────────────────────────────
function ProgramTable({ data=[], loading=false, onFilter }) {
  const [search,   setSearch]   = useState("");
  const [sortKey,  setSortKey]  = useState("programKey");
  const [sortDir,  setSortDir]  = useState(1);
  const [page,     setPage]     = useState(1);
  const PER_PAGE = 12;

  const sortable = (key) => () => {
    if (sortKey===key) setSortDir(d=>-d);
    else { setSortKey(key); setSortDir(1); }
    setPage(1);
  };

  const filtered = data
    .filter(p => !search || p.programKey?.toLowerCase().includes(search.toLowerCase())
      || p.ownerName?.toLowerCase().includes(search.toLowerCase())
      || p.area?.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => {
      const av=a[sortKey]||"", bv=b[sortKey]||"";
      if (typeof av==="number") return (av-bv)*sortDir;
      return av.toString().localeCompare(bv.toString())*sortDir;
    });

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const shown = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const reguBadge = (r) => {
    if (r==="Overdue")  return <span className="aa-badge aa-badge-over">{r}</span>;
    if (r==="Watch")    return <span className="aa-badge aa-badge-watch">{r}</span>;
    if (r==="No Data")  return <span className="aa-badge aa-badge-ina">{r}</span>;
    return <span className="aa-badge aa-badge-ok">{r}</span>;
  };

  return (
    <>
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
        <input className="aa-search" placeholder="Search program, owner, area…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
        <span style={{fontSize:"0.72rem",color:C.muted,marginLeft:"auto"}}>{filtered.length} programs</span>
      </div>
      <div style={{overflowX:"auto"}}>
        <table className="aa-tbl" style={{minWidth:820}}>
          <thead><tr>
            {[
              ["programKey","Program"],["ownerName","Owner"],["area","Area"],
              ["language","Language"],["frequency","Freq"],["programType","Type"],
              ["devoteeCount","Devotees"],["avgPct","Avg%"],["lastAttDate","Last Session"],
              ["actFlag","Status"],["regularity","Regularity"],
            ].map(([k,l])=>(
              <th key={k} className="aa-th" onClick={sortable(k)}>
                <div style={{display:"flex",alignItems:"center",gap:4}}>{l}<ISort/></div>
              </th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? [...Array(6)].map((_,i)=>(
              <tr key={i} className="aa-tr">
                {[...Array(11)].map((__,j)=><td key={j} className="aa-td"><div className="aa-sk" style={{height:12}}/></td>)}
              </tr>
            )) : shown.map(p=>(
              <tr key={String(p.programId)} className="aa-tr">
                <td className="aa-td"><span className="aa-kp">{p.programKey}</span></td>
                <td className="aa-td" style={{fontSize:"0.75rem"}}>{p.ownerName}</td>
                <td className="aa-td" style={{fontSize:"0.72rem",color:C.muted}}>{p.area}</td>
                <td className="aa-td" style={{fontSize:"0.72rem",color:C.muted}}>{p.language}</td>
                <td className="aa-td" style={{fontSize:"0.72rem",color:C.muted}}>{p.frequency}</td>
                <td className="aa-td"><span style={{fontSize:"0.68rem"}}>{p.programType}</span></td>
                <td className="aa-td" style={{fontFamily:"'Cinzel',serif",fontWeight:700,textAlign:"center"}}>{p.devoteeCount}</td>
                <td className="aa-td">
                  <span className={`aa-pct aa-p${pctCls(p.avgPct)}`}>{p.avgPct}%</span>
                </td>
                <td className="aa-td" style={{fontSize:"0.7rem",color:C.muted}}>{fmtShort(p.lastAttDate)}</td>
                <td className="aa-td">
                  <span className={`aa-badge aa-badge-${p.actFlag==="active"?"act":"ina"}`}>
                    {p.actFlag==="active"?"Active":"Inactive"}
                  </span>
                </td>
                <td className="aa-td">{reguBadge(p.regularity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="aa-pag">
        <span className="aa-pag-info">Page {page} of {pages}</span>
        <button className="aa-pag-btn" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>‹ Prev</button>
        {[...Array(Math.min(5,pages))].map((_,i)=>{
          const pg=page<=3?i+1:page-2+i;
          if(pg<1||pg>pages)return null;
          return<button key={pg} className={`aa-pag-btn${pg===page?" cur":""}`} onClick={()=>setPage(pg)}>{pg}</button>;
        })}
        <button className="aa-pag-btn" disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>Next ›</button>
      </div>
    </>
  );
}

// ── Owner table ────────────────────────────────────────────────────────
function OwnerTable({ data=[] }) {
  const sorted=[...data].sort((a,b)=>b.avgAttendance-a.avgAttendance);
  return(
    <div style={{overflowX:"auto"}}>
      <table className="aa-tbl" style={{minWidth:760}}>
        <thead><tr>
          {["Owner","Programs","Active","Devotees","Avg Att%","Overdue","Last Activity","Consistency","Category Mix"].map(c=>(
            <th key={c} className="aa-th" style={{cursor:"default"}}>{c}</th>
          ))}
        </tr></thead>
        <tbody>
          {sorted.map(o=>(
            <tr key={String(o.ownerId)} className="aa-tr">
              <td className="aa-td">
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div className="aa-av">{ini(o.ownerName)}</div>
                  <div>
                    <div style={{fontWeight:600,fontSize:"0.8rem",color:"#2d1200"}}>{o.ownerName}</div>
                    <div style={{fontSize:"0.66rem",color:C.muted}}>{o.ownerEmail}</div>
                  </div>
                </div>
              </td>
              <td className="aa-td" style={{fontFamily:"'Cinzel',serif",fontWeight:700,textAlign:"center"}}>{o.programCount}</td>
              <td className="aa-td" style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:C.green,textAlign:"center"}}>{o.activeCount}</td>
              <td className="aa-td" style={{fontFamily:"'Cinzel',serif",fontWeight:700,textAlign:"center"}}>{o.devoteeCount}</td>
              <td className="aa-td"><span className={`aa-pct aa-p${pctCls(o.avgAttendance)}`}>{o.avgAttendance}%</span></td>
              <td className="aa-td" style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:o.overdueCount>0?C.red:C.green,textAlign:"center"}}>{o.overdueCount}</td>
              <td className="aa-td" style={{fontSize:"0.7rem",color:C.muted}}>{fmtShort(o.lastActivity)}</td>
              <td className="aa-td">
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{flex:1,height:5,background:"rgba(200,140,40,0.1)",borderRadius:3,overflow:"hidden",minWidth:50}}>
                    <div style={{width:`${Math.max(0,Math.min(100,Math.round(o.consistencyScore)))}%`,height:"100%",background:pctColor(o.consistencyScore),borderRadius:3}}/>
                  </div>
                  <span style={{fontSize:"0.68rem",fontWeight:700,color:pctColor(o.consistencyScore)}}>{Math.round(o.consistencyScore)}%</span>
                </div>
              </td>
              <td className="aa-td">
                <div style={{display:"flex",gap:3}}>
                  {o.commitment>0&&<span className="aa-badge aa-badge-commit">{o.commitment}C</span>}
                  {o.manjari>0&&<span className="aa-badge aa-badge-manj">{o.manjari}M</span>}
                  {o.others>0&&<span className="aa-badge aa-badge-other">{o.others}O</span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// COMPONENT: FULL PIE CHART — larger, labeled slices, premium hover
// ════════════════════════════════════════════════════════════════
function PieChart({ slices=[], size=160, title="" }) {
  const { tip, show, move, hide } = useTooltip();
  const [hov, setHov] = useState(-1);

  const valid = slices.filter(s=>(s.value||0)>0);
  const total = valid.reduce((s,d)=>s+(d.value||0),0);

  if (!total) return (
    <div style={{width:size,height:size,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:4}}>
      <span style={{fontSize:"1.6rem",opacity:0.2}}>○</span>
      <span style={{fontSize:"0.66rem",color:C.muted}}>No data</span>
    </div>
  );

  const cx=size/2, cy=size/2, r=(size-8)/2;
  let angle=-90;

  // Single slice — full circle
  if (valid.length===1) {
    const col=valid[0].color||PALETTE[0];
    return(
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill={col} opacity={0.85}/>
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:size*0.14,fill:"#fff"}}>{total}</text>
      </svg>
    );
  }

  const arcs = valid.map((s,i)=>{
    const sw = Math.max(0.5,Math.min(359.5,(s.value/total)*360));
    const a1=(angle*Math.PI)/180, a2=((angle+sw)*Math.PI)/180;
    const x1=cx+r*Math.cos(a1), y1=cy+r*Math.sin(a1);
    const x2=cx+r*Math.cos(a2), y2=cy+r*Math.sin(a2);
    const lg=sw>180?1:0;
    const d=`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${x2} ${y2} Z`;
    // Label position (midpoint of arc)
    const mid=((angle+sw/2)*Math.PI)/180;
    const lx=cx+(r*0.65)*Math.cos(mid);
    const ly=cy+(r*0.65)*Math.sin(mid);
    const pct=Math.round((s.value/total)*100);
    angle+=sw;
    return{d,color:s.color||PALETTE[i%PALETTE.length],label:s.label,value:s.value,pct,lx,ly,extra:s.extra,i};
  });

  return(
    <>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{overflow:"visible",cursor:"pointer"}}>
        {arcs.map((a,i)=>(
          <g key={i}>
            <path d={a.d}
              fill={a.color}
              stroke="#fff"
              strokeWidth={hov===i?3:1.5}
              transform={hov===i?`translate(${Math.cos(((angle/2))*Math.PI/180)*4} ${Math.sin(((angle/2))*Math.PI/180)*4})`:""}
              opacity={hov!==-1&&hov!==i?0.55:1}
              style={{transition:"opacity 0.18s,transform 0.15s"}}
              onMouseEnter={e=>{setHov(i);show(e,
                <div>
                  <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:a.color,marginBottom:4,fontSize:"0.8rem"}}>{a.label}</div>
                  <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Count: <strong style={{color:"#fff"}}>{a.value}</strong></div>
                  <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Share: <strong style={{color:"#fff"}}>{a.pct}%</strong></div>
                  {a.extra&&Object.entries(a.extra).map(([k,v])=>(
                    <div key={k} style={{color:"rgba(255,220,160,0.8)",fontSize:"0.68rem"}}>{k}: <strong style={{color:"#fff"}}>{v}</strong></div>
                  ))}
                </div>
              );}}
              onMouseMove={e=>move(e)}
              onMouseLeave={()=>{setHov(-1);hide();}}
            />
            {/* Percentage label inside slice (only if >=8%) */}
            {a.pct>=8&&(
              <text x={a.lx} y={a.ly} textAnchor="middle" dominantBaseline="middle"
                style={{fontSize:size*0.07,fontWeight:700,fill:"#fff",pointerEvents:"none",textShadow:"0 1px 3px rgba(0,0,0,0.6)"}}>
                {a.pct}%
              </text>
            )}
          </g>
        ))}
      </svg>
      <Tooltip tip={tip}/>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// COMPONENT: SYSTEM OVERVIEW CHART
// Radial/bubble style: Areas, Owners, Languages, SubAreas all in one
// ════════════════════════════════════════════════════════════════
function SystemOverviewChart({ byArea=[], byLanguage=[], byOwner=[], byFrequency=[] }) {
  const { tip, show, move, hide } = useTooltip();
  const [activeView, setActiveView] = useState("area");

  const views = [
    {v:"area",    l:"By Area",     data:byArea.slice(0,10),    key:"label", valKey:"count", colorOff:0},
    {v:"language",l:"By Language", data:byLanguage.slice(0,10),key:"label", valKey:"count", colorOff:2},
    {v:"owner",   l:"By Owner",    data:byOwner.slice(0,10),   key:"label", valKey:"count", colorOff:5},
    {v:"freq",    l:"By Frequency",data:byFrequency.slice(0,8),key:"label", valKey:"count", colorOff:1},
  ];

  const active = views.find(v=>v.v===activeView)||views[0];
  const data = active.data;
  const max = Math.max(...data.map(d=>d[active.valKey]||0),1);

  // Draw as horizontal bubble bars
  return(
    <>
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        {views.map(v=>(
          <button key={v.v} style={{padding:"5px 13px",borderRadius:8,border:"1.5px solid",borderColor:activeView===v.v?"#c8903c":"rgba(200,140,40,0.2)",background:activeView===v.v?"rgba(200,140,40,0.12)":"rgba(200,140,40,0.04)",color:activeView===v.v?"#3d1800":"#8b6840",fontSize:"0.74rem",fontWeight:activeView===v.v?700:500,cursor:"pointer",transition:"all 0.15s"}}
            onClick={()=>setActiveView(v.v)}>{v.l}</button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {data.map((d,i)=>{
          const val=d[active.valKey]||0;
          const pct=Math.round((val/max)*100);
          const col=PALETTE[(i+active.colorOff)%PALETTE.length];
          const avgP=d.avgPct;
          return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}
              onMouseEnter={e=>show(e,
                <div>
                  <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:col,marginBottom:4,fontSize:"0.8rem"}}>{d[active.key]}</div>
                  <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Programs: <strong style={{color:"#fff"}}>{val}</strong></div>
                  {avgP!==undefined&&<div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Avg Att%: <strong style={{color:pctColor(avgP)}}>{avgP}%</strong></div>}
                </div>
              )}
              onMouseMove={e=>move(e)} onMouseLeave={()=>hide()}
            >
              <span style={{width:100,fontSize:"0.72rem",fontWeight:600,color:"#3d1800",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flexShrink:0}} title={d[active.key]}>{d[active.key]||"—"}</span>
              <div style={{flex:1,height:14,background:"rgba(200,140,40,0.08)",borderRadius:7,overflow:"hidden",position:"relative"}}>
                <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${col},${col}bb)`,borderRadius:7,transition:"width 0.5s ease"}}/>
                {/* Attendance% overlay line */}
                {avgP!==undefined&&(
                  <div style={{position:"absolute",left:`${avgP}%`,top:0,bottom:0,width:2,background:pctColor(avgP),opacity:0.8,borderRadius:1}}
                    title={`Avg Att: ${avgP}%`}/>
                )}
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
                <span style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:"0.9rem",color:col,width:28,textAlign:"right"}}>{val}</span>
                {avgP!==undefined&&<span className={`aa-pct aa-p${pctCls(avgP)}`} style={{fontSize:"0.6rem"}}>{avgP}%</span>}
              </div>
            </div>
          );
        })}
      </div>
      <Tooltip tip={tip}/>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// COMPONENT: DEVOTEE SEARCH PAGE
// ════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════
// COMPONENT: DEVOTEE SEARCH with AUTOCOMPLETE
// ════════════════════════════════════════════════════════════════
function DevoteeSearch() {
  const { tip, show, move, hide } = useTooltip();
  const [query,       setQuery]       = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSug,     setShowSug]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [searching,   setSearching]   = useState(false);
  const [results,     setResults]     = useState(null);
  const [searched,    setSearched]    = useState("");
  const debRef = useRef(null);
  const inputRef = useRef(null);

  // Debounced autocomplete
  const fetchSuggestions = (val) => {
    if (debRef.current) clearTimeout(debRef.current);
    if (val.trim().length < 2) { setSuggestions([]); setShowSug(false); return; }
    debRef.current = setTimeout(async () => {
      try {
        const r = await api.get("/analytics/admin/devotee/suggest", { params:{ q:val.trim() } });
        setSuggestions(r.data.suggestions||[]);
        setShowSug(true);
      } catch { setSuggestions([]); }
    }, 300);
  };

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    fetchSuggestions(val);
  };

  const pickSuggestion = (name) => {
    setQuery(name);
    setSuggestions([]);
    setShowSug(false);
    doSearch(name);
  };

  const doSearch = async (nameOverride) => {
    const name = (nameOverride||query).trim();
    if (!name || name.length<2) return;
    setSearching(true); setSearched(name); setResults(null); setShowSug(false);
    try {
      const r = await api.get("/analytics/admin/devotee", { params:{ name } });
      setResults(r.data.results||[]);
    } catch { toast.error("Search failed."); }
    finally { setSearching(false); }
  };

  const statusCls = s => s==="Active"?"aa-status-active":s==="Moderate"?"aa-status-moderate":"aa-status-irregular";

  return (
    <>
      {/* Search input with autocomplete */}
      <div className="aa-card gf">
        <div className="aa-ch"><span className="aa-ct">🔍 Search Devotee by Name</span></div>
        <div className="aa-cb">
          <div style={{position:"relative",marginBottom:12}}>
            <div className="aa-search-box">
              <div style={{position:"relative",flex:1}}>
                <input ref={inputRef}
                  className="aa-search-big"
                  placeholder="Type devotee name… (min 2 chars, autocomplete enabled)"
                  value={query}
                  onChange={handleInput}
                  onKeyDown={e=>{
                    if(e.key==="Enter"){doSearch();setShowSug(false);}
                    if(e.key==="Escape") setShowSug(false);
                  }}
                  onFocus={()=>suggestions.length>0&&setShowSug(true)}
                  onBlur={()=>setTimeout(()=>setShowSug(false),160)}
                  autoComplete="off"
                  style={{width:"100%"}}
                />
                {/* Autocomplete dropdown */}
                {showSug && suggestions.length>0 && (
                  <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:200,background:"#fff",border:"1.5px solid rgba(200,140,40,0.25)",borderRadius:"0 0 12px 12px",boxShadow:"0 8px 24px rgba(61,23,0,0.14)",overflow:"hidden",marginTop:2}}>
                    {suggestions.map((s,i)=>(
                      <div key={i} style={{padding:"9px 16px",cursor:"pointer",fontSize:"0.84rem",color:"#2d1200",fontWeight:500,borderBottom:"1px solid rgba(200,140,40,0.07)",transition:"background 0.12s",display:"flex",alignItems:"center",gap:8}}
                        onMouseDown={()=>pickSuggestion(s)}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(200,140,40,0.07)"}
                        onMouseLeave={e=>e.currentTarget.style.background=""}
                      >
                        <span style={{fontSize:"0.8rem",opacity:0.5}}>👤</span>
                        {s.split(new RegExp(`(${query.trim()})`, "gi")).map((part,pi)=>
                          part.toLowerCase()===query.trim().toLowerCase()
                            ? <mark key={pi} style={{background:"rgba(200,140,40,0.2)",color:"#3d1800",borderRadius:3,padding:"0 2px",fontWeight:700}}>{part}</mark>
                            : <span key={pi}>{part}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button className="aa-search-go" onClick={()=>doSearch()} disabled={searching||query.trim().length<2}>
                {searching?<><span className="aa-sp" style={{marginRight:6}}/>Searching…</>:"Search →"}
              </button>
            </div>
          </div>
          <div style={{fontSize:"0.72rem",color:C.muted}}>
            Start typing to see autocomplete suggestions · Press Enter or click Search
          </div>
        </div>
      </div>

      {/* Results */}
      {results!==null && (
        results.length===0
          ? <div style={{textAlign:"center",padding:"32px",color:C.muted,fontFamily:"'Cinzel',serif",fontSize:"0.84rem",background:"#fff",borderRadius:14,border:"1px solid rgba(200,140,40,0.13)"}}>
              No devotee found for "<strong style={{color:C.dark}}>{searched}</strong>"
            </div>
          : results.map((r,ri)=>(
            <div key={ri} className="aa-dev-card">
              <div className="aa-dev-card-hd">
                <div>
                  <div className="aa-dev-name">{r.devoteeName}</div>
                  <div className="aa-dev-prog">{r.programKey} · {r.area} · {r.ownerName}</div>
                  <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                    {r.programType&&<span style={{fontSize:"0.65rem",padding:"2px 8px",borderRadius:20,background:`${progColor(r.programType)}18`,color:progColor(r.programType),border:`1px solid ${progColor(r.programType)}40`}}>{r.programType}</span>}
                    {r.frequency&&<span style={{fontSize:"0.65rem",padding:"2px 8px",borderRadius:20,background:"rgba(200,140,40,0.1)",color:"#7a4a00"}}>{r.frequency}</span>}
                    {r.language&&<span style={{fontSize:"0.65rem",padding:"2px 8px",borderRadius:20,background:"rgba(5,150,105,0.1)",color:"#065f46"}}>{r.language}</span>}
                    {r.actFlag==="inactive"&&<span style={{fontSize:"0.65rem",padding:"2px 8px",borderRadius:20,background:"rgba(107,114,128,0.1)",color:"#6b7280"}}>Program Inactive</span>}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
                  <span className={`aa-badge ${statusCls(r.status)}`} style={{fontSize:"0.72rem",padding:"4px 12px"}}>{r.status}</span>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:"2rem",fontWeight:700,color:pctColor(r.pct),lineHeight:1}}>{r.pct}%</div>
                    <div style={{fontSize:"0.64rem",color:C.muted}}>attendance rate</div>
                  </div>
                  {r.streak>0&&<div style={{fontSize:"0.68rem",fontWeight:700,color:C.green}}>🔥 {r.streak} session streak</div>}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
                <div style={{padding:"14px 20px",borderRight:"1px solid rgba(200,140,40,0.1)"}}>
                  <div style={{display:"flex",gap:16,marginBottom:14}}>
                    {[{l:"Attended",v:r.attended,c:C.green},{l:"Total Sessions",v:r.total,c:C.blue},{l:"Absent",v:r.total-r.attended,c:C.red}].map(s=>(
                      <div key={s.l} style={{textAlign:"center"}}>
                        <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:"1.2rem",color:s.c}}>{s.v}</div>
                        <div style={{fontSize:"0.6rem",color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:"0.66rem",color:C.muted}}>Attendance Rate</span>
                      <span style={{fontSize:"0.7rem",fontWeight:700,color:pctColor(r.pct)}}>{r.pct}%</span>
                    </div>
                    <div style={{height:8,background:"rgba(200,140,40,0.1)",borderRadius:4,overflow:"hidden"}}>
                      <div style={{width:`${r.pct}%`,height:"100%",background:`linear-gradient(90deg,${pctColor(r.pct)},${pctColor(r.pct)}99)`,borderRadius:4,transition:"width 0.6s ease"}}/>
                    </div>
                  </div>
                  {r.monthlyBreakdown?.length>0&&(
                    <>
                      <div style={{fontSize:"0.64rem",fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Monthly Pattern</div>
                      <div style={{display:"flex",gap:5,alignItems:"flex-end",height:56}}>
                        {r.monthlyBreakdown.map((m,mi)=>{
                          const maxP=Math.max(...r.monthlyBreakdown.map(x=>x.present+x.absent),1);
                          const h=Math.max(4,((m.present+m.absent)/maxP)*52);
                          const col=pctColor(m.pct);
                          return(
                            <div key={mi} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer"}}
                              onMouseEnter={e=>show(e,<div>
                                <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:col,marginBottom:3,fontSize:"0.76rem"}}>{m.label}</div>
                                <div style={{color:"#4ade80",fontSize:"0.72rem"}}>Present: <strong style={{color:"#fff"}}>{m.present}</strong></div>
                                <div style={{color:"#f87171",fontSize:"0.72rem"}}>Absent: <strong style={{color:"#fff"}}>{m.absent}</strong></div>
                                <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Rate: <strong style={{color:col}}>{m.pct}%</strong></div>
                              </div>)}
                              onMouseMove={e=>move(e)} onMouseLeave={()=>hide()}
                            >
                              <div style={{width:"100%",height:h,background:col,borderRadius:"3px 3px 0 0",opacity:0.8}}/>
                              <span style={{fontSize:"0.54rem",color:C.muted}}>{m.label.split(" ")[0]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
                <div style={{padding:"14px 20px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                    <DonutChart slices={[{label:"Present",value:r.attended,color:C.green},{label:"Absent",value:r.total-r.attended,color:C.red}]} size={80} label="Sessions"/>
                    <div>
                      <div style={{fontSize:"0.68rem",fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Breakdown</div>
                      {[{l:"Present",v:r.attended,c:C.green},{l:"Absent",v:r.total-r.attended,c:C.red}].map(x=>(
                        <div key={x.l} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                          <span style={{width:8,height:8,borderRadius:"50%",background:x.c}}/>
                          <span style={{fontSize:"0.72rem",color:"#3d1800"}}>{x.l}: <strong>{x.v}</strong></span>
                          <span style={{fontSize:"0.66rem",color:C.muted}}>({r.total?Math.round((x.v/r.total)*100):0}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{fontSize:"0.64rem",fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:7}}>Last 10 Sessions</div>
                  {(r.recentSessions||[]).map((s,si)=>(
                    <div key={si} className="aa-session-row">
                      <span className={s.status==="present"?"aa-session-dot-p":"aa-session-dot-a"}/>
                      <span style={{color:s.status==="present"?C.green:C.red,fontWeight:600,width:52,flexShrink:0}}>{s.status==="present"?"Present":"Absent"}</span>
                      <span style={{flex:1,color:C.muted,fontSize:"0.72rem"}}>{s.date?new Date(s.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"2-digit"}):"—"}</span>
                      {s.host&&<span style={{fontSize:"0.66rem",color:C.light,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:80}}>{s.host}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
      )}
      <Tooltip tip={tip}/>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// #1: ATTENDANCE MOMENTUM TRACKER
// Shows ↑↓→ trend for each program based on recent weeks
// ════════════════════════════════════════════════════════════════
function AttendanceMomentumTracker({ programTable=[] }) {
  const { tip, show, move, hide } = useTooltip();
  const [sortDir, setSortDir] = useState("decline"); // decline | rising | all

  const withMomentum = programTable
    .filter(p=>p.actFlag==="active"&&p.avgPct>0)
    .map(p=>{
      // Proxy: use avgPct vs daysSince to estimate momentum
      const thresh = {Daily:7,Weekly:14,Monthly:30}[p.frequency]||14;
      const overdue = p.daysSince!==null ? Math.min(p.daysSince/thresh, 2) : 1.5;
      // Health score relative to att%
      const healthScore = Math.max(0, p.avgPct - overdue*15);
      const delta = healthScore - p.avgPct;
      const momentum = delta > -5 ? "rising" : delta > -15 ? "stable" : "decline";
      return {...p, healthScore:Math.round(healthScore), delta:Math.round(delta), momentum};
    })
    .filter(p=>sortDir==="all"?true:p.momentum===sortDir||
      (sortDir==="rising"&&p.momentum==="stable"))
    .sort((a,b)=> sortDir==="decline"?a.healthScore-b.healthScore:b.healthScore-a.healthScore)
    .slice(0,12);

  const mIcon = m => m==="rising"?"↑":m==="decline"?"↓":"→";
  const mColor = m => m==="rising"?C.green:m==="decline"?C.red:C.amber;

  return(
    <div className="aa-card gf">
      <div className="aa-ch">
        <span className="aa-ct">📈 Attendance Momentum Tracker</span>
        <div style={{display:"flex",gap:6}}>
          {[{v:"decline",l:"⚠ Declining"},{v:"rising",l:"↑ Rising"},{v:"all",l:"All"}].map(s=>(
            <button key={s.v} style={{padding:"3px 10px",borderRadius:7,border:"1.5px solid",borderColor:sortDir===s.v?"#c8903c":"rgba(200,140,40,0.2)",background:sortDir===s.v?"rgba(200,140,40,0.12)":"transparent",color:sortDir===s.v?"#3d1800":"#8b6840",fontSize:"0.68rem",fontWeight:sortDir===s.v?700:500,cursor:"pointer"}}
              onClick={()=>setSortDir(s.v)}>{s.l}</button>
          ))}
        </div>
      </div>
      <div className="aa-cb">
        {!withMomentum.length&&<div style={{textAlign:"center",color:C.muted,fontSize:"0.76rem",padding:"16px 0"}}>No data matching this filter.</div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
          {withMomentum.map((p,i)=>(
            <div key={i} style={{padding:"12px 14px",borderRadius:12,border:`1.5px solid ${mColor(p.momentum)}30`,background:`${mColor(p.momentum)}06`,cursor:"default",transition:"all 0.15s"}}
              onMouseEnter={e=>show(e,<div>
                <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:mColor(p.momentum),marginBottom:4,fontSize:"0.8rem"}}>{p.programKey}</div>
                <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Avg Att%: <strong style={{color:"#fff"}}>{p.avgPct}%</strong></div>
                <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Health Score: <strong style={{color:mColor(p.momentum)}}>{p.healthScore}%</strong></div>
                <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Owner: <strong style={{color:"#fff"}}>{p.ownerName}</strong></div>
                <div style={{color:"rgba(255,220,160,0.8)",fontSize:"0.7rem"}}>Last session: {p.daysSince!==null?`${p.daysSince}d ago`:"Never"}</div>
              </div>)}
              onMouseMove={e=>move(e)} onMouseLeave={()=>hide()}
            >
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <span style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:"0.78rem",color:"#2d1200"}}>{p.programKey}</span>
                <span style={{fontSize:"1.2rem",fontWeight:900,color:mColor(p.momentum),lineHeight:1}}>{mIcon(p.momentum)}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <div style={{flex:1,height:5,background:"rgba(200,140,40,0.1)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:`${p.avgPct}%`,height:"100%",background:pctColor(p.avgPct),borderRadius:3}}/>
                </div>
                <span style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:"0.82rem",color:pctColor(p.avgPct)}}>{p.avgPct}%</span>
              </div>
              <div style={{fontSize:"0.64rem",color:mColor(p.momentum),fontWeight:600}}>
                {p.momentum==="rising"?"Performing well":p.momentum==="decline"?`⚠ ${p.daysSince!==null?`${p.daysSince}d since last session`:"No attendance yet"}`:"Stable"}
              </div>
              <div style={{fontSize:"0.62rem",color:C.muted,marginTop:2}}>{p.ownerName} · {p.area||"—"}</div>
            </div>
          ))}
        </div>
      </div>
      <Tooltip tip={tip}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// #2: DEVOTEE RETENTION FUNNEL
// Shows how many devotees are still active at different time thresholds
// ════════════════════════════════════════════════════════════════
function DevoteeRetentionFunnel({ topDevotees=[], bottomDevotees=[] }) {
  const { tip, show, move, hide } = useTooltip();

  const all = [...topDevotees,...bottomDevotees];
  if (!all.length) return null;

  const total = all.length;
  const buckets = [
    {label:"Enrolled",  min:0,  pct:100, color:"#7c3aed"},
    {label:"≥60%",      min:60, pct:Math.round((all.filter(d=>d.percentage>=60).length/total)*100), color:"#0284c7"},
    {label:"≥70%",      min:70, pct:Math.round((all.filter(d=>d.percentage>=70).length/total)*100), color:"#16a34a"},
    {label:"≥80%",      min:80, pct:Math.round((all.filter(d=>d.percentage>=80).length/total)*100), color:"#4ade80"},
  ];

  const maxW = 320;
  return(
    <div className="aa-card gf">
      <div className="aa-ch"><span className="aa-ct">🔻 Devotee Retention Funnel</span></div>
      <div className="aa-cb">
        <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"center"}}>
          {buckets.map((b,i)=>{
            const w = Math.round((b.pct/100)*maxW);
            const count = i===0?total:all.filter(d=>d.percentage>=b.min).length;
            return(
              <div key={i} style={{width:"100%",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}
                onMouseEnter={e=>show(e,<div>
                  <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:b.color,marginBottom:3,fontSize:"0.78rem"}}>{b.label}</div>
                  <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Devotees: <strong style={{color:"#fff"}}>{count}</strong></div>
                  <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Retention: <strong style={{color:b.color}}>{b.pct}%</strong></div>
                </div>)}
                onMouseMove={e=>move(e)} onMouseLeave={()=>hide()}
              >
                <div style={{width:w,height:36,background:`linear-gradient(90deg,${b.color},${b.color}99)`,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",transition:"width 0.5s ease"}}>
                  <span style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:"#fff",fontSize:"0.82rem"}}>{count} devotees</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:"0.68rem",fontWeight:700,color:"#5c3a14"}}>{b.label}</span>
                  <span style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:b.color}}>{b.pct}%</span>
                  {i>0&&<span style={{fontSize:"0.62rem",color:C.muted}}>({buckets[i-1].pct-b.pct}% dropped)</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Tooltip tip={tip}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// #5: AREA COMPETITION MAP
// Within each area: which owner has most programs + highest att%
// ════════════════════════════════════════════════════════════════
function AreaCompetitionMap({ programTable=[], filterOptions={} }) {
  const { tip, show, move, hide } = useTooltip();
  const [selArea, setSelArea] = useState("");

  const areas = [...new Set(programTable.map(p=>p.area).filter(Boolean))].sort();
  const filtered = programTable.filter(p=>!selArea||p.area===selArea);

  // Group by area → by owner
  const areaOwnerMap = {};
  filtered.forEach(p=>{
    if(!p.area) return;
    if(!areaOwnerMap[p.area]) areaOwnerMap[p.area]={};
    if(!areaOwnerMap[p.area][p.ownerName]) areaOwnerMap[p.area][p.ownerName]={count:0,pctSum:0,pctN:0};
    areaOwnerMap[p.area][p.ownerName].count++;
    if(p.avgPct>0){areaOwnerMap[p.area][p.ownerName].pctSum+=p.avgPct;areaOwnerMap[p.area][p.ownerName].pctN++;}
  });

  const areaList = selArea?[selArea]:areas.slice(0,6);

  return(
    <div className="aa-card gf">
      <div className="aa-ch">
        <span className="aa-ct">🗺 Area Competition Map</span>
        <select style={{padding:"4px 9px",borderRadius:7,border:"1.5px solid rgba(200,140,40,0.2)",background:"#fff",color:"#2d1200",fontSize:"0.74rem",outline:"none"}}
          value={selArea} onChange={e=>setSelArea(e.target.value)}>
          <option value="">All Areas</option>
          {areas.map(a=><option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div className="aa-cb">
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
          {areaList.filter(a=>areaOwnerMap[a]).map(area=>{
            const owners=Object.entries(areaOwnerMap[area]||{})
              .map(([name,d])=>({name,count:d.count,avgPct:d.pctN>0?Math.round(d.pctSum/d.pctN):0}))
              .sort((a,b)=>b.count-a.count);
            const maxC=owners[0]?.count||1;
            return(
              <div key={area} style={{padding:"12px 14px",borderRadius:12,border:"1px solid rgba(200,140,40,0.15)",background:"rgba(200,140,40,0.03)"}}>
                <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:"0.8rem",color:"#2d1200",marginBottom:10,paddingBottom:6,borderBottom:"1px solid rgba(200,140,40,0.1)"}}>{area}</div>
                {owners.slice(0,4).map((o,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}
                    onMouseEnter={e=>show(e,<div>
                      <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:PALETTE[i%PALETTE.length],marginBottom:3,fontSize:"0.78rem"}}>{o.name}</div>
                      <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Programs: <strong style={{color:"#fff"}}>{o.count}</strong></div>
                      <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Avg Att%: <strong style={{color:pctColor(o.avgPct)}}>{o.avgPct}%</strong></div>
                    </div>)}
                    onMouseMove={e=>move(e)} onMouseLeave={()=>hide()}
                  >
                    {i===0&&<span style={{fontSize:"0.7rem"}}>🥇</span>}
                    {i===1&&<span style={{fontSize:"0.7rem"}}>🥈</span>}
                    {i===2&&<span style={{fontSize:"0.7rem"}}>🥉</span>}
                    {i>2&&<span style={{width:16}}/>}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:"0.7rem",fontWeight:600,color:"#2d1200",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.name.split(" ")[0]}</div>
                      <div style={{height:4,background:"rgba(200,140,40,0.1)",borderRadius:2,overflow:"hidden",marginTop:2}}>
                        <div style={{width:`${Math.round((o.count/maxC)*100)}%`,height:"100%",background:PALETTE[i%PALETTE.length],borderRadius:2}}/>
                      </div>
                    </div>
                    <span style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:"0.76rem",color:PALETTE[i%PALETTE.length],flexShrink:0}}>{o.count}</span>
                    <span className={`aa-pct aa-p${pctCls(o.avgPct)}`} style={{fontSize:"0.6rem",flexShrink:0}}>{o.avgPct}%</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <Tooltip tip={tip}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// #8: SESSION VOLUME vs ATTENDANCE QUALITY SCATTER
// X: sessions held, Y: avg attendance%, bubble size: devotees
// ════════════════════════════════════════════════════════════════
function SessionScatterPlot({ programTable=[] }) {
  const { tip, show, move, hide } = useTooltip();
  const [hov, setHov] = useState(-1);

  const data = programTable.filter(p=>p.actFlag==="active"&&p.avgPct>0).slice(0,40);
  if (data.length < 3) return null;

  const maxDevs   = Math.max(...data.map(p=>p.devoteeCount),1);
  const maxDaySince= Math.max(...data.map(p=>p.daysSince||0),1);
  const padL=40,padR=16,padT=14,padB=36,h=140,vbW=340;
  const iw=vbW-padL-padR, ih=h-padT;

  const px = (p) => padL + ((p.daysSince!==null?(maxDaySince-p.daysSince):maxDaySince)/maxDaySince)*iw;
  const py = (p) => padT + (1-(p.avgPct/100))*ih;
  const pr = (p) => Math.max(4, (p.devoteeCount/maxDevs)*16);

  return(
    <div className="aa-card gf">
      <div className="aa-ch">
        <span className="aa-ct">⚡ Recency vs Attendance Quality Scatter</span>
        <span style={{fontSize:"0.62rem",color:C.muted}}>X=Recent activity · Y=Avg att% · Size=Devotees</span>
      </div>
      <div className="aa-cb">
        <svg width="100%" height={h+padB} viewBox={`0 0 ${vbW} ${h+padB}`} style={{overflow:"visible",display:"block"}}>
          {/* Quadrant shading */}
          <rect x={padL} y={padT} width={iw/2} height={ih/2} fill="rgba(220,38,38,0.04)"/>
          <rect x={padL+iw/2} y={padT} width={iw/2} height={ih/2} fill="rgba(22,163,74,0.04)"/>
          <rect x={padL} y={padT+ih/2} width={iw/2} height={ih/2} fill="rgba(220,38,38,0.06)"/>
          <rect x={padL+iw/2} y={padT+ih/2} width={iw/2} height={ih/2} fill="rgba(217,119,6,0.05)"/>
          {/* Quadrant labels */}
          {[
            {x:padL+4,        y:padT+10,    l:"Old + High",  c:"rgba(22,163,74,0.5)"},
            {x:padL+iw/2+4,   y:padT+10,    l:"Recent + High",c:"rgba(22,163,74,0.8)"},
            {x:padL+4,        y:padT+ih-6,  l:"Old + Low",   c:"rgba(220,38,38,0.5)"},
            {x:padL+iw/2+4,   y:padT+ih-6,  l:"At Risk",    c:"rgba(220,38,38,0.8)"},
          ].map((q,i)=>(
            <text key={i} x={q.x} y={q.y} style={{fontSize:7.5,fill:q.c,fontWeight:600}}>{q.l}</text>
          ))}
          {/* Grid */}
          {[0,25,50,75,100].map(g=>(
            <g key={g}>
              <line x1={padL} y1={padT+(1-g/100)*ih} x2={padL+iw} y2={padT+(1-g/100)*ih} stroke="rgba(200,140,40,0.08)" strokeWidth={1} strokeDasharray="3,3"/>
              <text x={padL-4} y={padT+(1-g/100)*ih+3} textAnchor="end" style={{fontSize:7,fill:C.light}}>{g}%</text>
            </g>
          ))}
          {/* Axes */}
          <line x1={padL} y1={padT} x2={padL} y2={padT+ih} stroke="rgba(200,140,40,0.2)" strokeWidth={1}/>
          <line x1={padL} y1={padT+ih} x2={padL+iw} y2={padT+ih} stroke="rgba(200,140,40,0.2)" strokeWidth={1}/>
          <text x={padL+iw/2} y={padT+ih+26} textAnchor="middle" style={{fontSize:8,fill:C.muted}}>← Older   Recent →</text>
          {/* Bubbles */}
          {data.map((p,i)=>{
            const x=px(p), y=py(p), r=pr(p);
            const col=pctColor(p.avgPct);
            return(
              <circle key={i} cx={x} cy={y} r={hov===i?r+3:r}
                fill={col} fillOpacity={hov===i?0.9:0.6}
                stroke={col} strokeWidth={hov===i?2.5:1.5}
                strokeOpacity={0.8}
                style={{cursor:"pointer",transition:"r 0.12s,fill-opacity 0.12s"}}
                onMouseEnter={e=>{setHov(i);show(e,<div>
                  <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:col,marginBottom:4,fontSize:"0.78rem"}}>{p.programKey}</div>
                  <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Avg Att%: <strong style={{color:"#fff"}}>{p.avgPct}%</strong></div>
                  <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Devotees: <strong style={{color:"#fff"}}>{p.devoteeCount}</strong></div>
                  <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Last session: <strong style={{color:"#fff"}}>{p.daysSince!==null?`${p.daysSince}d ago`:"Never"}</strong></div>
                  <div style={{color:"rgba(255,220,160,0.8)",fontSize:"0.7rem"}}>Owner: {p.ownerName}</div>
                </div>);}}
                onMouseMove={e=>move(e)} onMouseLeave={()=>{setHov(-1);hide();}}
              />
            );
          })}
        </svg>
        <div style={{display:"flex",gap:14,marginTop:6,flexWrap:"wrap"}}>
          {[{c:C.green,l:"≥80% att"},{c:C.amber,l:"40–79%"},{c:C.red,l:"<40%"}].map(x=>(
            <div key={x.l} style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:x.c,opacity:0.7}}/>
              <span style={{fontSize:"0.64rem",color:C.muted}}>{x.l}</span>
            </div>
          ))}
          <span style={{fontSize:"0.64rem",color:C.muted}}>Bubble size = devotee count</span>
        </div>
      </div>
      <Tooltip tip={tip}/>
    </div>
  );
}


function GrowthDeclineOwners({ ownerStats=[] }) {
  const { tip, show, move, hide } = useTooltip();
  const sorted=[...ownerStats].sort((a,b)=>b.devoteeCount-a.devoteeCount);
  const top5   = sorted.slice(0,5);
  const bottom5= [...ownerStats].sort((a,b)=>a.avgAttendance-b.avgAttendance).slice(0,5);

  return(
    <div className="g2">
      {/* Top 5 growing */}
      <div className="aa-card">
        <div className="aa-ch" style={{background:"linear-gradient(to right,rgba(22,163,74,0.1),transparent)"}}>
          <span className="aa-ct" style={{color:"#15803d"}}>🏆 Top 5 — Most Devotees</span>
          <span style={{fontSize:"0.62rem",color:C.muted}}>by devotee count</span>
        </div>
        <div className="aa-cb" style={{padding:"10px 16px"}}>
          {top5.map((o,i)=>{
            const maxD=top5[0]?.devoteeCount||1;
            const w=Math.round((o.devoteeCount/maxD)*100);
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 0",borderBottom:"1px solid rgba(200,140,40,0.07)"}}
                onMouseEnter={e=>show(e,<div>
                  <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:C.green,marginBottom:3,fontSize:"0.78rem"}}>{o.ownerName}</div>
                  <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Devotees: <strong style={{color:"#fff"}}>{o.devoteeCount}</strong></div>
                  <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Programs: <strong style={{color:"#fff"}}>{o.programCount}</strong></div>
                  <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Avg Att: <strong style={{color:pctColor(o.avgAttendance)}}>{o.avgAttendance}%</strong></div>
                </div>)}
                onMouseMove={e=>move(e)} onMouseLeave={()=>hide()}
              >
                <div className={`aa-rank ${i===0?"aa-rank-1":i===1?"aa-rank-2":i===2?"aa-rank-3":"aa-rank-n"}`}>{i+1}</div>
                <div className="aa-av">{ini(o.ownerName)}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:"0.76rem",fontWeight:600,color:"#2d1200",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.ownerName}</div>
                  <div style={{height:4,background:"rgba(22,163,74,0.12)",borderRadius:2,overflow:"hidden",marginTop:4}}>
                    <div style={{width:`${w}%`,height:"100%",background:C.green,borderRadius:2}}/>
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:"1rem",color:C.green}}>{o.devoteeCount}</div>
                  <div style={{fontSize:"0.62rem",color:C.muted}}>devotees</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom 5 declining */}
      <div className="aa-card">
        <div className="aa-ch" style={{background:"linear-gradient(to right,rgba(220,38,38,0.08),transparent)"}}>
          <span className="aa-ct" style={{color:"#b91c1c"}}>⚠ Needs Support — Declining Att%</span>
          <span style={{fontSize:"0.62rem",color:C.muted}}>lowest avg attendance</span>
        </div>
        <div className="aa-cb" style={{padding:"10px 16px"}}>
          {bottom5.map((o,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 0",borderBottom:"1px solid rgba(200,140,40,0.07)"}}
              onMouseEnter={e=>show(e,<div>
                <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:C.red,marginBottom:3,fontSize:"0.78rem"}}>{o.ownerName}</div>
                <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Avg Att: <strong style={{color:pctColor(o.avgAttendance)}}>{o.avgAttendance}%</strong></div>
                <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Overdue: <strong style={{color:"#fff"}}>{o.overdueCount}</strong></div>
                <div style={{color:"rgba(255,220,160,0.9)",fontSize:"0.72rem"}}>Programs: <strong style={{color:"#fff"}}>{o.programCount}</strong></div>
              </div>)}
              onMouseMove={e=>move(e)} onMouseLeave={()=>hide()}
            >
              <div style={{width:20,height:20,borderRadius:5,background:"rgba(220,38,38,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.72rem",fontWeight:700,color:C.red,flexShrink:0}}>{i+1}</div>
              <div className="aa-av">{ini(o.ownerName)}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:"0.76rem",fontWeight:600,color:"#2d1200",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.ownerName}</div>
                <div style={{height:4,background:"rgba(220,38,38,0.1)",borderRadius:2,overflow:"hidden",marginTop:4}}>
                  <div style={{width:`${o.avgAttendance}%`,height:"100%",background:pctColor(o.avgAttendance),borderRadius:2}}/>
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <span className={`aa-pct aa-p${pctCls(o.avgAttendance)}`}>{o.avgAttendance}%</span>
                {o.overdueCount>0&&<div style={{fontSize:"0.62rem",color:C.red,marginTop:1}}>{o.overdueCount} overdue</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export default function AdminAnalytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("Overview");
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    ownerId:"", programType:"", frequency:"", area:"", subArea:"",
    language:"", day:"", status:"", startDate:"", endDate:"",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([,v])=>v));
      const r = await api.get("/analytics/admin", { params });
      setData(r.data);
    } catch { toast.error("Failed to load admin analytics."); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const upd=(k,v)=>setFilters(p=>({...p,[k]:v}));
  const clearAll=()=>setFilters({ownerId:"",programType:"",frequency:"",area:"",subArea:"",language:"",day:"",status:"",startDate:"",endDate:""});
  const hasFilter=Object.values(filters).some(v=>v);
  const f=data?.filterOptions||{};
  const k=data?.kpis||{};

  const activeChips = Object.entries(filters).filter(([,v])=>v);

  const sectionRef = useRef({});
  const scrollTo = (sec) => {
    setActiveSection(sec);
    document.getElementById(`aa-sec-${sec}`)?.scrollIntoView({behavior:"smooth",block:"start"});
  };

  // Alert counts
  const alertCount = (k.progAtRisk||0)+(k.progNoAtt||0);
  const ownerAlertCount = (data?.ownerStats||[]).filter(o=>o.overdueCount>0).length;

  return (
    <>
      <style>{css}</style>
      <div className="aa-root">
        {/* ══ BANNER ══════════════════════════════════════════════ */}
        <div className="aa-banner">
          <div className="aa-bi">
            <div className="aa-br">
              <div>
                <div className="aa-ey">Admin Analytics</div>
                <h1 className="aa-tt">System Analytics — <em>Dashboard</em></h1>
                <p className="aa-sb">Enterprise-level insights across all programs, owners and devotees.</p>
              </div>
            </div>
            <div className="aa-strip">
              {[
                {c:"si0",v:loading?"—":k.totalPrograms,         l:"Total Programs"},
                {c:"si1",v:loading?"—":k.totalDevotees,          l:"Total Devotees"},
                {c:"si2",v:loading?"—":k.totalOwners,            l:"Owners"},
                {c:"si3",v:loading?"—":`${k.avgAttSystem||0}%`,  l:"System Avg Att"},
                {c:"si4",v:loading?"—":k.attWeek,                l:"Submissions/Week"},
                {c:"si5",v:loading?"—":(k.progAtRisk||0)+(k.progNoAtt||0),l:"At Risk"},
              ].map((s,i)=>(
                <div key={i} className={`aa-si ${s.c}`}>
                  <div className="aa-sv">{s.v}</div>
                  <div className="aa-sl">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ INTERNAL NAV ════════════════════════════════════════ */}
        <nav className="aa-nav">
          <div className="aa-nav-inner">
            {NAV_SECTIONS.map(sec=>(
              <button key={sec} className={`aa-nav-btn${activeSection===sec?" active":""}`}
                onClick={()=>scrollTo(sec)}>
                {sec}
                {sec==="Operations"&&alertCount>0&&<span className="aa-nav-badge">{alertCount}</span>}
                {sec==="Owners"&&ownerAlertCount>0&&<span className="aa-nav-badge">{ownerAlertCount}</span>}
              </button>
            ))}
          </div>
        </nav>

        {/* ══ FILTER BAR ══════════════════════════════════════════ */}
        <div className="aa-fb">
          <div className="aa-fb-in">
            <select className={`aa-sel${filters.ownerId?" act":""}`} value={filters.ownerId} onChange={e=>upd("ownerId",e.target.value)}>
              <option value="">All Owners</option>
              {(f.owners||[]).map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <select className={`aa-sel${filters.programType?" act":""}`} value={filters.programType} onChange={e=>upd("programType",e.target.value)}>
              <option value="">All Types</option>
              {(f.programTypes||[]).map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            <select className={`aa-sel${filters.frequency?" act":""}`} value={filters.frequency} onChange={e=>upd("frequency",e.target.value)}>
              <option value="">All Frequencies</option>
              {(f.frequencies||[]).map(fr=><option key={fr} value={fr}>{fr}</option>)}
            </select>
            <select className={`aa-sel${filters.area?" act":""}`} value={filters.area} onChange={e=>upd("area",e.target.value)}>
              <option value="">All Areas</option>
              {(f.areas||[]).map(a=><option key={a} value={a}>{a}</option>)}
            </select>
            <select className={`aa-sel${filters.subArea?" act":""}`} value={filters.subArea} onChange={e=>upd("subArea",e.target.value)}>
              <option value="">All Sub-Areas</option>
              {(f.subAreas||[]).map(a=><option key={a} value={a}>{a}</option>)}
            </select>
            <select className={`aa-sel${filters.language?" act":""}`} value={filters.language} onChange={e=>upd("language",e.target.value)}>
              <option value="">All Languages</option>
              {(f.languages||[]).map(l=><option key={l} value={l}>{l}</option>)}
            </select>
            <select className={`aa-sel${filters.day?" act":""}`} value={filters.day} onChange={e=>upd("day",e.target.value)}>
              <option value="">All Days</option>
              {(f.days||[]).map(d=><option key={d} value={d}>{d}</option>)}
            </select>
            <select className={`aa-sel${filters.status?" act":""}`} value={filters.status} onChange={e=>upd("status",e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <input type="date" className={`aa-date-in${filters.startDate?" act":""}`} value={filters.startDate} onChange={e=>upd("startDate",e.target.value)} title="From"/>
            <input type="date" className={`aa-date-in${filters.endDate?" act":""}`}   value={filters.endDate}   onChange={e=>upd("endDate",e.target.value)}   title="To"/>
            {hasFilter&&<button className="aa-clear-btn" onClick={clearAll}>✕ Clear All</button>}
          </div>
          {activeChips.length>0&&(
            <div className="aa-fb-in" style={{paddingTop:6}}>
              {activeChips.map(([k,v])=>(
                <span key={k} className="aa-filter-chip">
                  {k}: {v}
                  <span className="aa-chip-x" onClick={()=>upd(k,"")}>×</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="aa-body">

          {/* ══════════ SECTION: OVERVIEW ═══════════════════════════ */}
          <div id="aa-sec-Overview"/>
          <div className="aa-sec"><span className="aa-sec-t"><IChart/>Key Performance Indicators</span></div>

          {/* 14 KPI cards */}
          <div className="aa-m-grid">
            {[
              {cl:"mk0",bg:"rgba(200,140,40,0.1)",  ico:<IProg/>, v:k.totalPrograms||0,        l:"Total Programs",       sub:`${k.activePrograms||0} active`},
              {cl:"mk1",bg:"rgba(22,163,74,0.1)",   ico:<IUsers/>,v:k.totalDevotees||0,         l:"Total Devotees",       sub:"across all programs"},
              {cl:"mk2",bg:"rgba(124,58,237,0.1)",  ico:<IUsers/>,v:k.totalOwners||0,           l:"Active Owners",        sub:`${k.worstOwner?k.worstOwner.pct:0}% lowest`},
              {cl:"mk3",bg:"rgba(2,132,199,0.1)",   ico:<IChart/>,v:`${k.avgAttSystem||0}%`,    l:"System Avg Att",       sub:`${k.attWeek||0} submissions/wk`},
              {cl:"mk4",bg:"rgba(107,114,128,0.1)", ico:<IProg/>, v:k.inactivePrograms||0,      l:"Inactive Programs",    sub:"currently disabled"},
              {cl:"mk5",bg:"rgba(220,38,38,0.08)",  ico:<IWarn/>, v:k.progAtRisk||0,            l:"At Risk",              sub:`${k.progNoAtt||0} never marked`},
              {cl:"mk6",bg:"rgba(217,119,6,0.1)",   ico:<IClock/>,v:k.attTotal||0,              l:"Total Records",        sub:"all attendance entries"},
              {cl:"mk7",bg:"rgba(8,145,178,0.1)",   ico:<IChart/>,v:k.totalSessions||0,         l:"Total Sessions",       sub:"unique session days"},
              {cl:"mk8",bg:"rgba(5,150,105,0.12)",  ico:<ISpark/>,v:k.attWeek||0,               l:"Submissions/Week",     sub:"recent 7-day activity"},
              {cl:"mk9",bg:"rgba(79,70,229,0.1)",   ico:<IUsers/>,v:k.newDevoteesThisMonth||0,  l:"New Devotees/Month",   sub:"joined this month"},
              {cl:"mk10",bg:"rgba(245,200,66,0.12)",ico:<ISpark/>,v:k.bestOwner?.name||"—",     l:"Best Owner",           sub:`${k.bestOwner?.pct||0}% avg`,sm:true},
              {cl:"mk11",bg:"rgba(220,38,38,0.06)", ico:<IWarn/>, v:k.worstOwner?.name||"—",    l:"Needs Support",        sub:`${k.worstOwner?.pct||0}% avg`,sm:true},
              {cl:"mk12",bg:"rgba(5,150,105,0.1)",  ico:<ITrend/>,v:k.mostActive?.name||"—",    l:"Most Active Owner",    sub:`${k.mostActive?.count||0} this week`,sm:true},
              {cl:"mk13",bg:"rgba(219,39,119,0.08)",ico:<IClock/>,v:k.newProgramsThisMonth||0,  l:"New Programs/Month",   sub:"added this month"},
            ].map((m,i)=>(
              <div key={i} className={`aa-metric ${m.cl}`}>
                <div className="aa-m-ico" style={{background:m.bg}}>{m.ico}</div>
                <div className="aa-m-val" style={{fontSize:m.sm&&String(m.v).length>8?"0.85rem":String(m.v).length>5?"1rem":"1.4rem"}}>{loading?"—":m.v}</div>
                <div className="aa-m-lbl">{m.l}</div>
                <div className="aa-m-sub">{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Category breakdown */}
          <div className="aa-sec"><span className="aa-sec-t">Program Categories</span></div>
          <div className="g3" style={{marginBottom:14}}>
            {[
              {cls:"aa-cat-commit",cat:"commitment",icon:"🕉️",color:C.indigo},
              {cls:"aa-cat-manj",  cat:"manjari",   icon:"🌸",color:C.pink},
              {cls:"aa-cat-other", cat:"others",    icon:"✨",color:C.teal},
            ].map(({cls,cat,icon,color})=>{
              const cd=data?.categories?.[cat];
              return(
                <div key={cat} className={`aa-cat-card ${cls}`}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                    <span style={{fontSize:"1.4rem"}}>{icon}</span>
                    <span style={{fontFamily:"'Cinzel',serif",fontSize:"1.6rem",fontWeight:700,color}}>{loading?"—":cd?.count||0}</span>
                  </div>
                  <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.8rem",fontWeight:700,color:"#2d1200",marginBottom:4}}>{CAT_LABELS[cat]} Programs</div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{flex:1,height:5,background:"rgba(0,0,0,0.08)",borderRadius:3,overflow:"hidden"}}>
                      <div style={{width:`${cd?.avgPct||0}%`,height:"100%",background:color,borderRadius:3}}/>
                    </div>
                    <span style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:"0.82rem",color}}>{loading?"—":`${cd?.avgPct||0}%`}</span>
                  </div>
                  <div style={{fontSize:"0.64rem",color:"#8b6840",marginTop:2}}>Avg attendance</div>
                </div>
              );
            })}
          </div>

          {/* Monthly trend + Today's programs */}
          <div className="g21">
            <div className="aa-card">
              <div className="aa-ch">
                <span className="aa-ct"><ITrend/>Monthly Attendance Trend</span>
                {(data?.monthlyTrend||[]).length<3&&(data?.monthlyTrend||[]).length>0&&<span style={{fontSize:"0.62rem",color:C.amber}}>⚠ Limited history</span>}
              </div>
              <div className="aa-cb">
                {(data?.monthlyTrend||[]).length>=2
                  ?<LineChart data={data.monthlyTrend.map(m=>({label:m.label,value:m.pct,extra:{"Present":m.present,"Absent":m.absent,"Total":m.total}}))} height={80} color={C.gold}/>
                  :<div style={{textAlign:"center",color:C.muted,fontSize:"0.76rem",padding:"20px 0",lineHeight:"1.7"}}>
                    Not enough monthly data yet.<br/>
                    <span style={{fontSize:"0.66rem",opacity:0.7}}>Mark attendance across multiple months to see the trend.</span>
                  </div>
                }
              </div>
            </div>
            <div className="aa-card">
              <div className="aa-ch"><span className="aa-ct">Devotee Health System-wide</span></div>
              <div className="aa-cb" style={{display:"flex",alignItems:"center",gap:14}}>
                <DonutChart
                  slices={[
                    {label:"Active ≥80%",   value:data?.healthCounts?.active||0,   color:C.green},
                    {label:"Moderate 40–79%",value:data?.healthCounts?.moderate||0, color:C.amber},
                    {label:"Inactive <40%", value:data?.healthCounts?.inactive||0, color:C.red},
                  ]}
                  size={100} label="Devotees"
                />
                <div className="aa-leg" style={{flex:1}}>
                  {[{l:"Active",v:data?.healthCounts?.active||0,c:C.green},{l:"Moderate",v:data?.healthCounts?.moderate||0,c:C.amber},{l:"Inactive",v:data?.healthCounts?.inactive||0,c:C.red}].map((it,i)=>{
                    const tot=(data?.healthCounts?.active||0)+(data?.healthCounts?.moderate||0)+(data?.healthCounts?.inactive||0)||1;
                    return(<div key={i} className="aa-li">
                      <span className="aa-ld" style={{background:it.c}}/><span className="aa-ll">{it.l}</span>
                      <span className="aa-lv">{it.v}</span><span className="aa-lp">{Math.round((it.v/tot)*100)}%</span>
                    </div>);
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ══ TOP 5 GROWING vs DECLINING OWNERS ════════════════ */}
          {!loading && <GrowthDeclineOwners ownerStats={data?.ownerStats||[]}/>}

          {/* ══ TODAY'S PROGRAMS — all owners (dashboard section) ══ */}
          <div id="aa-sec-Overview-today"/>
          {(data?.todayPrograms||[]).length>0&&(
            <>
              <div className="aa-sec">
                <span className="aa-sec-t">Today's Programs (All Owners)</span>
                <span style={{fontSize:"0.64rem",fontWeight:700,background:"rgba(200,140,40,0.1)",color:"#7a4a00",padding:"2px 9px",borderRadius:20}}>
                  {(data.todayPrograms||[]).filter(p=>p.markedToday).length}/{(data.todayPrograms||[]).length} marked
                </span>
              </div>
              <div className="aa-today-grid gf">
                {(data.todayPrograms||[]).map(p=>{
                  const variant=p.markedToday?"marked":"unmarked";
                  return(
                    <div key={String(p.programId)} className={`aa-tpc ${variant}`}>
                      <div className={`aa-tpc-strip ${variant}`}/>
                      <div className="aa-tpc-inner">
                        <div className="aa-tpc-key">
                          <span>{p.programKey}</span>
                          <span style={{fontSize:"0.62rem",fontWeight:700,padding:"2px 8px",borderRadius:20,background:p.markedToday?"rgba(22,163,74,0.12)":"rgba(220,38,38,0.1)",color:p.markedToday?"#15803d":"#b91c1c"}}>
                            {p.markedToday?"✓ Marked":"Not Marked"}
                          </span>
                        </div>
                        <div className="aa-tpc-owner">👤 {p.ownerName}</div>
                        <div className="aa-tpc-info">
                          {p.programType&&<span className="aa-tpc-tag">{p.programType}</span>}
                          {p.time&&<span className="aa-tpc-tag">⏰ {p.time}</span>}
                          {p.area&&<span className="aa-tpc-tag">📍 {p.area}</span>}
                          {p.frequency&&<span className="aa-tpc-tag">{p.frequency}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ══════════ SECTION: LEADER VIEW ══════════════════════ */}
          <div id="aa-sec-Leader View" style={{scrollMarginTop:100}}/>
          <div className="aa-sec"><span className="aa-sec-t"><IGrid/>Leader / Owner Program Distribution</span></div>

          {/* BIG Leader Stacked Bar */}
          <div className="aa-leader-card gf">
            <div className="aa-leader-header">
              <div>
                <div className="aa-leader-title">Program Distribution by Leader (Owner)</div>
                <div style={{fontSize:"0.7rem",color:"rgba(255,210,140,0.55)",marginTop:2}}>Each bar = one owner · Stacked by program type · Hover for details · Filters apply globally</div>
              </div>
              {!loading&&<LeaderStackedBar ownerStats={data?.ownerStats||[]} filterOptions={f}/>}
            </div>
            {loading&&<div style={{padding:"40px 22px"}}><div className="aa-sk" style={{height:180,borderRadius:10}}/></div>}
          </div>

          {/* Day-wise | Owner-wise | Program-type tables */}
          <div className="g3">
            <div className="aa-card">
              <div className="aa-ch"><span className="aa-ct">Day-wise Program Count</span></div>
              {loading
                ?<div className="aa-cb"><div className="aa-sk" style={{height:120}}/></div>
                :<DayWiseTable programTable={data?.programTable||[]} filterOptions={f}/>
              }
            </div>
            <div className="aa-card">
              <div className="aa-ch"><span className="aa-ct">Owner-wise Program Count</span></div>
              {loading
                ?<div className="aa-cb"><div className="aa-sk" style={{height:120}}/></div>
                :<OwnerWiseTable ownerStats={data?.ownerStats||[]} filterOptions={f}/>
              }
            </div>
            <div className="aa-card">
              <div className="aa-ch"><span className="aa-ct">Program Type Summary</span></div>
              {loading
                ?<div className="aa-cb"><div className="aa-sk" style={{height:120}}/></div>
                :<ProgramTypeTable programTable={data?.programTable||[]} filterOptions={f}/>
              }
            </div>
          </div>

          {/* ══════════ SECTION: PROGRAMS ═══════════════════════════ */}
          <div id="aa-sec-Programs" style={{scrollMarginTop:100}}/>
          <div className="aa-sec"><span className="aa-sec-t"><IProg/>Program Distribution Analytics</span></div>

          {/* SYSTEM OVERVIEW CHART — all dimensions */}
          <div className="aa-sec"><span className="aa-sec-t">System Overview — All Dimensions</span></div>
          <div className="g2" style={{marginBottom:14}}>
            <div className="aa-card">
              <div className="aa-ch">
                <span className="aa-ct">Distribution Explorer</span>
                <span style={{fontSize:"0.62rem",color:C.muted}}>Areas · Owners · Languages · Frequency</span>
              </div>
              <div className="aa-cb">
                {loading
                  ?<div className="aa-sk" style={{height:200}}/>
                  :<SystemOverviewChart byArea={data?.byArea||[]} byLanguage={data?.byLanguage||[]} byOwner={data?.byOwner||[]} byFrequency={data?.byFrequency||[]}/>
                }
              </div>
            </div>
            {/* Large pie charts side by side */}
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div className="aa-card" style={{flex:1}}>
                <div className="aa-ch"><span className="aa-ct">Area Distribution</span></div>
                <div className="aa-cb" style={{display:"flex",alignItems:"center",gap:14}}>
                  <PieChart
                    slices={(data?.byArea||[]).slice(0,7).map((a,i)=>({label:a.label,value:a.count,color:PALETTE[i%PALETTE.length],extra:{"Avg Att%":`${a.avgPct}%`}}))}
                    size={120}
                  />
                  <div className="aa-leg" style={{flex:1,maxHeight:120,overflowY:"auto"}}>
                    {(data?.byArea||[]).slice(0,7).map((a,i)=>(
                      <div key={i} className="aa-li">
                        <span className="aa-ld" style={{background:PALETTE[i%PALETTE.length]}}/>
                        <span className="aa-ll" style={{fontSize:"0.66rem"}}>{a.label}</span>
                        <span className="aa-lv" style={{fontSize:"0.68rem"}}>{a.count}</span>
                        <span className="aa-lp">{a.avgPct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="aa-card" style={{flex:1}}>
                <div className="aa-ch"><span className="aa-ct">Language Distribution</span></div>
                <div className="aa-cb" style={{display:"flex",alignItems:"center",gap:14}}>
                  <PieChart
                    slices={(data?.byLanguage||[]).map((l,i)=>({label:l.label,value:l.count,color:PALETTE[(i+2)%PALETTE.length],extra:{"Avg Att%":`${l.avgPct}%`}}))}
                    size={120}
                  />
                  <div className="aa-leg" style={{flex:1}}>
                    {(data?.byLanguage||[]).map((l,i)=>(
                      <div key={i} className="aa-li">
                        <span className="aa-ld" style={{background:PALETTE[(i+2)%PALETTE.length]}}/>
                        <span className="aa-ll" style={{fontSize:"0.66rem"}}>{l.label}</span>
                        <span className="aa-lv" style={{fontSize:"0.68rem"}}>{l.count}</span>
                        <span className="aa-lp">{l.avgPct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 more pie charts — Type, Frequency, Day, Owner */}
          <div className="g4" style={{marginBottom:14}}>
            {[
              {title:"Program Type",   data:(data?.byType||[]).slice(0,7).map((t,i)=>({label:t.label,value:t.count,color:progColor(t.label),extra:{"Avg Att%":`${t.avgPct}%`,"Devotees":t.devoteeCount}}))},
              {title:"By Frequency",   data:(data?.byFrequency||[]).map((f,i)=>({label:f.label,value:f.count,color:PALETTE[(i+1)%PALETTE.length]}))},
              {title:"By Day",         data:(data?.byDay||[]).map((d,i)=>({label:d.day,value:d.count,color:PALETTE[(i+3)%PALETTE.length]}))},
              {title:"By Owner (Top)", data:(data?.byOwner||[]).slice(0,7).map((o,i)=>({label:o.label,value:o.count,color:PALETTE[(i+5)%PALETTE.length]}))},
            ].map(({title,data:sd})=>(
              <div key={title} className="aa-card">
                <div className="aa-ch"><span className="aa-ct">{title}</span></div>
                <div className="aa-cb" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
                  <PieChart slices={sd} size={130}/>
                  <div className="aa-leg" style={{width:"100%",maxHeight:100,overflowY:"auto"}}>
                    {sd.map((s,i)=>(
                      <div key={i} className="aa-li" style={{padding:"2px 4px"}}>
                        <span className="aa-ld" style={{background:s.color}}/>
                        <span className="aa-ll" style={{fontSize:"0.62rem"}} title={s.label}>{s.label.length>14?s.label.slice(0,13)+"…":s.label}</span>
                        <span className="aa-lv" style={{fontSize:"0.64rem"}}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Area Growth Map + Language Area Matrix */}
          <div className="g2" style={{marginBottom:14}}>
            <div className="aa-card">
              <div className="aa-ch">
                <span className="aa-ct">Area Growth Map</span>
                <span style={{fontSize:"0.62rem",color:C.muted}}>Active vs Inactive · Bar color = avg att%</span>
              </div>
              <div className="aa-cb">
                {loading
                  ?<div className="aa-sk" style={{height:120}}/>
                  :<AreaGrowthMap byArea={data?.byArea||[]} programTable={data?.programTable||[]}/>
                }
              </div>
            </div>
            <div className="aa-card">
              <div className="aa-ch">
                <span className="aa-ct">Language × Area Matrix</span>
                <span style={{fontSize:"0.62rem",color:C.muted}}>Click cell to explore · Color = density</span>
              </div>
              <div className="aa-cb">
                {loading
                  ?<div className="aa-sk" style={{height:120}}/>
                  :<LanguageAreaMatrix programTable={data?.programTable||[]}/>
                }
              </div>
            </div>
          </div>

          {/* Attendance Heatmap — system-wide */}
          <div className="aa-sec"><span className="aa-sec-t">Attendance Submission Heatmap</span></div>
          <div className="aa-card gf">
            <div className="aa-ch">
              <span className="aa-ct">Monthly Attendance Pattern — System-wide</span>
              <span style={{fontSize:"0.62rem",color:C.muted}}>Bar height = present count · Color = att%</span>
            </div>
            <div className="aa-cb">
              {loading
                ?<div className="aa-sk" style={{height:100}}/>
                :<AttendanceHeatmap monthlyTrend={data?.monthlyTrend||[]}/>
              }
            </div>
          </div>

          {/* ══ GITHUB-STYLE DAILY HEATMAP ═══════════════════════ */}
          {!loading && <DailyAttendanceHeatmap dailySubmissions={data?.dailySubmissions||[]}/>}

          {/* THREE BAR CHARTS — Day count, Area programs, Area devotees */}
          {!loading&&<ThreeBarCharts programTable={data?.programTable||[]} byArea={data?.byArea||[]} byDay={data?.byDay||[]}/>}

          {/* 6 individual donuts */}
          <div className="g3">
            {/* Area donut */}
            <div className="aa-card">
              <div className="aa-ch"><span className="aa-ct">By Area</span></div>
              <div className="aa-cb" style={{display:"flex",alignItems:"center",gap:12}}>
                <DonutChart slices={(data?.byArea||[]).map((a,i)=>({label:a.label,value:a.count,color:PALETTE[i%PALETTE.length],extra:{"Avg Att%":`${a.avgPct}%`}}))} size={90} label="Programs"
                  onSliceClick={s=>upd("area",s.label)}/>
                <div className="aa-leg" style={{flex:1,maxHeight:130,overflowY:"auto"}}>
                  {(data?.byArea||[]).map((a,i)=>(
                    <div key={i} className="aa-li" onClick={()=>upd("area",a.label)}>
                      <span className="aa-ld" style={{background:PALETTE[i%PALETTE.length]}}/><span className="aa-ll" style={{fontSize:"0.66rem"}}>{a.label}</span>
                      <span className="aa-lv" style={{fontSize:"0.68rem"}}>{a.count}</span>
                      <span className="aa-lp">{a.avgPct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Language donut */}
            <div className="aa-card">
              <div className="aa-ch"><span className="aa-ct">By Language</span></div>
              <div className="aa-cb" style={{display:"flex",alignItems:"center",gap:12}}>
                <DonutChart slices={(data?.byLanguage||[]).map((l,i)=>({label:l.label,value:l.count,color:PALETTE[(i+2)%PALETTE.length],extra:{"Avg Att%":`${l.avgPct}%`}}))} size={90} label="Programs"
                  onSliceClick={s=>upd("language",s.label)}/>
                <div className="aa-leg" style={{flex:1,maxHeight:130,overflowY:"auto"}}>
                  {(data?.byLanguage||[]).map((l,i)=>(
                    <div key={i} className="aa-li" onClick={()=>upd("language",l.label)}>
                      <span className="aa-ld" style={{background:PALETTE[(i+2)%PALETTE.length]}}/><span className="aa-ll" style={{fontSize:"0.66rem"}}>{l.label}</span>
                      <span className="aa-lv" style={{fontSize:"0.68rem"}}>{l.count}</span>
                      <span className="aa-lp">{l.avgPct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Program type donut */}
            <div className="aa-card">
              <div className="aa-ch"><span className="aa-ct">By Program Type</span></div>
              <div className="aa-cb" style={{display:"flex",alignItems:"center",gap:12}}>
                <DonutChart slices={(data?.byType||[]).map((t,i)=>({label:t.label,value:t.count,color:PALETTE[(i+4)%PALETTE.length],extra:{"Avg Att%":`${t.avgPct}%`}}))} size={90} label="Programs"
                  onSliceClick={s=>upd("programType",s.label)}/>
                <div className="aa-leg" style={{flex:1,maxHeight:130,overflowY:"auto"}}>
                  {(data?.byType||[]).map((t,i)=>(
                    <div key={i} className="aa-li" onClick={()=>upd("programType",t.label)}>
                      <span className="aa-ld" style={{background:PALETTE[(i+4)%PALETTE.length]}}/><span className="aa-ll" style={{fontSize:"0.66rem"}}>{t.label}</span>
                      <span className="aa-lv" style={{fontSize:"0.68rem"}}>{t.count}</span>
                      <span className="aa-lp">{t.avgPct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="g3">
            {/* Frequency donut */}
            <div className="aa-card">
              <div className="aa-ch"><span className="aa-ct">By Frequency</span></div>
              <div className="aa-cb" style={{display:"flex",alignItems:"center",gap:12}}>
                <DonutChart slices={(data?.byFrequency||[]).map((f,i)=>({label:f.label,value:f.count,color:PALETTE[(i+1)%PALETTE.length]}))} size={90} label="Programs"
                  onSliceClick={s=>upd("frequency",s.label)}/>
                <div className="aa-leg" style={{flex:1}}>
                  {(data?.byFrequency||[]).map((f,i)=>(
                    <div key={i} className="aa-li" onClick={()=>upd("frequency",f.label)}>
                      <span className="aa-ld" style={{background:PALETTE[(i+1)%PALETTE.length]}}/><span className="aa-ll" style={{fontSize:"0.66rem"}}>{f.label}</span>
                      <span className="aa-lv" style={{fontSize:"0.68rem"}}>{f.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Day donut */}
            <div className="aa-card">
              <div className="aa-ch"><span className="aa-ct">By Day</span></div>
              <div className="aa-cb" style={{display:"flex",alignItems:"center",gap:12}}>
                <DonutChart slices={(data?.byDay||[]).map((d,i)=>({label:d.day,value:d.count,color:PALETTE[(i+3)%PALETTE.length]}))} size={90} label="Programs"
                  onSliceClick={s=>upd("day",s.label)}/>
                <div className="aa-leg" style={{flex:1}}>
                  {(data?.byDay||[]).map((d,i)=>(
                    <div key={i} className="aa-li" onClick={()=>upd("day",d.day)}>
                      <span className="aa-ld" style={{background:PALETTE[(i+3)%PALETTE.length]}}/><span className="aa-ll" style={{fontSize:"0.66rem"}}>{d.day}</span>
                      <span className="aa-lv" style={{fontSize:"0.68rem"}}>{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Owner donut */}
            <div className="aa-card">
              <div className="aa-ch"><span className="aa-ct">By Owner</span></div>
              <div className="aa-cb" style={{display:"flex",alignItems:"center",gap:12}}>
                <DonutChart slices={(data?.byOwner||[]).slice(0,8).map((o,i)=>({label:o.label,value:o.count,color:PALETTE[(i+5)%PALETTE.length]}))} size={90} label="Programs"/>
                <div className="aa-leg" style={{flex:1,maxHeight:130,overflowY:"auto"}}>
                  {(data?.byOwner||[]).slice(0,8).map((o,i)=>(
                    <div key={i} className="aa-li">
                      <span className="aa-ld" style={{background:PALETTE[(i+5)%PALETTE.length]}}/><span className="aa-ll" style={{fontSize:"0.66rem"}}>{o.label}</span>
                      <span className="aa-lv" style={{fontSize:"0.68rem"}}>{o.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bar charts — Area+Att%, Language+Att%, Type+Att% */}
          <div className="g3">
            <div className="aa-card">
              <div className="aa-ch"><span className="aa-ct">Programs per Area</span></div>
              <div className="aa-cb">
                <VBar data={(data?.byArea||[]).slice(0,8).map((a,i)=>({label:a.label,value:a.count,extra:{"Avg Att%":`${a.avgPct}%`}}))} height={80} colorFn={(_,i)=>PALETTE[i%PALETTE.length]} onBarClick={b=>upd("area",b.label)}/>
              </div>
            </div>
            <div className="aa-card">
              <div className="aa-ch"><span className="aa-ct">Avg Att% per Area</span></div>
              <div className="aa-cb">
                <VBar data={(data?.byArea||[]).slice(0,8).map(a=>({label:a.label,value:a.avgPct,extra:{"Programs":a.count}}))} height={80} colorFn={(d)=>pctColor(d.value)} showPct onBarClick={b=>upd("area",b.label)}/>
              </div>
            </div>
            <div className="aa-card">
              <div className="aa-ch"><span className="aa-ct">Programs per Language</span></div>
              <div className="aa-cb">
                <VBar data={(data?.byLanguage||[]).map((l,i)=>({label:l.label,value:l.count,extra:{"Avg Att%":`${l.avgPct}%`}}))} height={80} colorFn={(_,i)=>PALETTE[(i+2)%PALETTE.length]} onBarClick={b=>upd("language",b.label)}/>
              </div>
            </div>
          </div>

          {/* Program master table */}
          <div className="aa-sec"><span className="aa-sec-t">Program Master Table</span></div>
          <div className="aa-card gf">
            <div className="aa-ch"><span className="aa-ct">All Programs — Full Control View</span></div>
            <div className="aa-cb">
              {loading
                ?<ProgramTable data={[]} loading={true}/>
                :<ProgramTable data={data?.programTable||[]} loading={false} onFilter={upd}/>
              }
            </div>
          </div>

          {/* Advanced Area × Att% combo chart + Program Insight Charts */}
          <div className="aa-sec"><span className="aa-sec-t">Advanced Program Analytics</span></div>
          <div className="g2">
            <div className="aa-card">
              <div className="aa-ch">
                <span className="aa-ct">Area × Attendance% Combo Chart</span>
                <span style={{fontSize:"0.62rem",color:C.muted}}>Bars=program count · Line=avg att%</span>
              </div>
              <div className="aa-cb">
                <AreaComboChart byArea={data?.byArea||[]} byType={data?.byType||[]} byLanguage={data?.byLanguage||[]}/>
              </div>
            </div>
            <div className="aa-card">
              <div className="aa-ch"><span className="aa-ct">Program Insight Line Chart</span></div>
              <div className="aa-cb">
                <ProgramInsightCharts byArea={data?.byArea||[]} byType={data?.byType||[]} byLanguage={data?.byLanguage||[]} monthlyTrend={data?.monthlyTrend||[]}/>
              </div>
            </div>
          </div>

          {/* Extra bar charts — language att%, type att%, owner programs */}
          <div className="g3">
            <div className="aa-card">
              <div className="aa-ch"><span className="aa-ct">Avg Att% by Language</span></div>
              <div className="aa-cb">
                <VBar data={(data?.byLanguage||[]).map((l,i)=>({label:l.label,value:l.avgPct,extra:{"Programs":l.count,"Devotees":l.devoteeCount||0}}))} height={80} colorFn={(d)=>pctColor(d.value)} showPct onBarClick={b=>upd("language",b.label)}/>
              </div>
            </div>
            <div className="aa-card">
              <div className="aa-ch"><span className="aa-ct">Avg Att% by Program Type</span></div>
              <div className="aa-cb">
                <VBar data={(data?.byType||[]).slice(0,8).map((t,i)=>({label:t.label,value:t.avgPct,extra:{"Programs":t.count}}))} height={80} colorFn={(d,i)=>progColor(d.label,i)} showPct onBarClick={b=>upd("programType",b.label)}/>
              </div>
            </div>
            <div className="aa-card">
              <div className="aa-ch"><span className="aa-ct">Programs per Owner</span></div>
              <div className="aa-cb">
                <VBar data={(data?.ownerStats||[]).slice(0,8).map(o=>({label:o.ownerName.split(" ")[0],value:o.programCount,extra:{"Active":o.activeCount,"Devotees":o.devoteeCount,"Avg Att":o.avgAttendance+"%"}}))} height={80} colorFn={(_,i)=>PALETTE[i%PALETTE.length]}/>
              </div>
            </div>
          </div>

          {/* ══════════ SECTION: OWNERS ═══════════════════════════ */}
          <div id="aa-sec-Owners" style={{scrollMarginTop:100}}/>
          <div className="aa-sec"><span className="aa-sec-t"><IUsers/>Owner Performance Analytics</span></div>

          {/* Stacked bar — owner program categories */}
          <div className="g21">
            <div className="aa-card">
              <div className="aa-ch"><span className="aa-ct">Owner Program Category Distribution</span></div>
              <div className="aa-cb">
                <StackedBar
                  data={(data?.ownerStats||[]).slice(0,10).map(o=>({label:o.ownerName.split(" ")[0],values:[o.commitment,o.manjari,o.others]}))}
                  height={90} legend={["Commitment","Manjari","Others"]}
                />
              </div>
            </div>
            <div className="aa-card">
              <div className="aa-ch"><span className="aa-ct">Owner Avg Attendance %</span></div>
              <div className="aa-cb">
                <VBar data={(data?.ownerStats||[]).slice(0,8).map(o=>({label:o.ownerName.split(" ")[0],value:o.avgAttendance,extra:{"Programs":o.programCount,"Devotees":o.devoteeCount,"Overdue":o.overdueCount}}))} height={90} colorFn={(d)=>pctColor(d.value)} showPct/>
              </div>
            </div>
          </div>

          {/* Owner full table */}
          <div className="aa-card gf">
            <div className="aa-ch"><span className="aa-ct">Owner Performance Table</span></div>
            <div className="aa-cb">
              {loading
                ?<div className="aa-sk" style={{height:120}}/>
                :<OwnerTable data={data?.ownerStats||[]}/>
              }
            </div>
          </div>

          {/* Owner Activity Timeline + Commitment Score */}
          <div className="g2">
            <div className="aa-card">
              <div className="aa-ch">
                <span className="aa-ct">Owner Activity Timeline</span>
                <span style={{fontSize:"0.62rem",color:C.muted}}>6-month activity · Hover for details</span>
              </div>
              <div className="aa-cb">
                {loading
                  ?<div className="aa-sk" style={{height:180}}/>
                  :<OwnerActivityTimeline ownerStats={data?.ownerStats||[]} monthlyTrend={data?.monthlyTrend||[]}/>
                }
              </div>
            </div>
            <div className="aa-card">
              <div className="aa-ch">
                <span className="aa-ct">Owner Commitment Score</span>
                <span style={{fontSize:"0.62rem",color:C.muted}}>C=Consistency · A=Attendance · P=Programs</span>
              </div>
              <div className="aa-cb">
                {loading
                  ?<div className="aa-sk" style={{height:180}}/>
                  :<OwnerCommitmentScore ownerStats={data?.ownerStats||[]}/>
                }
              </div>
            </div>
          </div>

          {/* ══════════ SECTION: DEVOTEES ══════════════════════════ */}
          <div id="aa-sec-Devotees" style={{scrollMarginTop:100}}/>
          <div className="aa-sec"><span className="aa-sec-t"><IUsers/>Devotee Analytics</span></div>

          {/* Health donut + deep analytics */}
          <div className="g21">
            <div className="aa-card">
              <div className="aa-ch"><span className="aa-ct">Devotee Attendance Deep Dive</span></div>
              <div className="aa-cb">
                <DevoteeDeepAnalytics topDevotees={data?.topDevotees||[]} bottomDevotees={data?.bottomDevotees||[]} ownerStats={data?.ownerStats||[]}/>
              </div>
            </div>
            <div>
              {/* Health donut */}
              <div className="aa-card" style={{marginBottom:14}}>
                <div className="aa-ch"><span className="aa-ct">Health Split</span></div>
                <div className="aa-cb" style={{display:"flex",alignItems:"center",gap:12}}>
                  <DonutChart
                    slices={[
                      {label:"Active ≥80%",   value:data?.healthCounts?.active||0,   color:C.green},
                      {label:"Moderate 40–79%",value:data?.healthCounts?.moderate||0, color:C.amber},
                      {label:"Inactive <40%", value:data?.healthCounts?.inactive||0, color:C.red},
                    ]}
                    size={90} label="Devotees"
                  />
                  <div className="aa-leg" style={{flex:1}}>
                    {[{l:"Active",v:data?.healthCounts?.active||0,c:C.green},{l:"Moderate",v:data?.healthCounts?.moderate||0,c:C.amber},{l:"Inactive",v:data?.healthCounts?.inactive||0,c:C.red}].map((it,i)=>{
                      const tot=(data?.healthCounts?.active||0)+(data?.healthCounts?.moderate||0)+(data?.healthCounts?.inactive||0)||1;
                      return(<div key={i} className="aa-li"><span className="aa-ld" style={{background:it.c}}/><span className="aa-ll">{it.l}</span><span className="aa-lv">{it.v}</span><span className="aa-lp">{Math.round((it.v/tot)*100)}%</span></div>);
                    })}
                  </div>
                </div>
              </div>
              {/* Devotee count per owner bar */}
              <div className="aa-card">
                <div className="aa-ch"><span className="aa-ct">Devotees per Owner</span></div>
                <div className="aa-cb">
                  <VBar data={(data?.ownerStats||[]).slice(0,8).map(o=>({label:o.ownerName.split(" ")[0],value:o.devoteeCount,extra:{"Avg Att":o.avgAttendance+"%","Programs":o.programCount}}))} height={70} colorFn={(_,i)=>PALETTE[(i+3)%PALETTE.length]}/>
                </div>
              </div>
            </div>
          </div>

          {/* Devotee count per program type + per area bar charts */}
          <div className="g3">
            <div className="aa-card">
              <div className="aa-ch"><span className="aa-ct">Devotees by Program Type</span></div>
              <div className="aa-cb">
                <VBar data={(data?.byType||[]).slice(0,8).map((t,i)=>({label:t.label,value:t.devoteeCount||0,extra:{"Programs":t.count,"Avg Att%":`${t.avgPct}%`}}))} height={80} colorFn={(d,i)=>progColor(d.label,i)} onBarClick={b=>upd("programType",b.label)}/>
              </div>
            </div>
            <div className="aa-card">
              <div className="aa-ch"><span className="aa-ct">Devotee Att% Distribution</span></div>
              <div className="aa-cb">
                {(() => {
                  const allPcts = [...(data?.topDevotees||[]),...(data?.bottomDevotees||[])];
                  const buckets = [{l:"<20%",min:0,max:20},{l:"20–40%",min:20,max:40},{l:"40–60%",min:40,max:60},{l:"60–80%",min:60,max:80},{l:">80%",min:80,max:101}];
                  const bData = buckets.map((b,i)=>({label:b.l,value:allPcts.filter(d=>d.percentage>=b.min&&d.percentage<b.max).length,color:[C.red,"#f97316",C.amber,C.teal,C.green][i]}));
                  return <VBar data={bData} height={80} colorFn={(d)=>d.color}/>;
                })()}
              </div>
            </div>
            <div className="aa-card">
              <div className="aa-ch"><span className="aa-ct">Sessions Attended (Top Devotees)</span></div>
              <div className="aa-cb">
                <VBar data={(data?.topDevotees||[]).slice(0,8).map(d=>({label:d.devoteeName.split(" ")[0],value:d.attended,extra:{"Sessions":d.totalSessions,"Rate":`${d.percentage}%`,"Program":d.programKey}}))} height={80} colorFn={(d,i)=>PALETTE[(i+4)%PALETTE.length]}/>
              </div>
            </div>
          </div>

          {/* Devotee Growth Analysis */}
          <div className="g2">
            <div className="aa-card">
              <div className="aa-ch">
                <span className="aa-ct">Devotee Growth Analysis</span>
                <span style={{fontSize:"0.62rem",color:C.muted}}>Programs classified by devotee count</span>
              </div>
              <div className="aa-cb">
                {loading
                  ?<div className="aa-sk" style={{height:140}}/>
                  :<DevoteeGrowthChart programTable={data?.programTable||[]} ownerStats={data?.ownerStats||[]}/>
                }
              </div>
            </div>
            <div className="aa-card">
              <div className="aa-ch"><span className="aa-ct">Devotee Health by Area</span></div>
              <div className="aa-cb">
                <VBar
                  data={(data?.byArea||[]).slice(0,8).map((a,i)=>({
                    label:a.label,
                    value:a.avgPct,
                    extra:{"Programs":a.count,"Avg Att%":a.avgPct+"%"}
                  }))}
                  height={80} colorFn={d=>pctColor(d.value)} showPct onBarClick={b=>upd("area",b.label)}
                />
              </div>
            </div>
          </div>

          {/* ══════════ SECTION: OPERATIONS ════════════════════════ */}
          <div id="aa-sec-Operations" style={{scrollMarginTop:100}}/>
          <div className="aa-sec">
            <span className="aa-sec-t"><IWarn/>Risk &amp; Operations</span>
            {alertCount>0&&<span style={{fontSize:"0.64rem",fontWeight:700,background:"rgba(220,38,38,0.1)",color:"#b91c1c",padding:"2px 9px",borderRadius:20}}>{alertCount} alerts</span>}
          </div>

          {/* Attendance Decay Analysis */}
          <div className="g2" style={{marginBottom:14}}>
            <div className="aa-card">
              <div className="aa-ch">
                <span className="aa-ct">Attendance Decay Analysis</span>
                <span style={{fontSize:"0.62rem",color:C.muted}}>Blue=recorded avg · Gold=health score</span>
              </div>
              <div className="aa-cb">
                {loading
                  ?<div className="aa-sk" style={{height:130}}/>
                  :<AttendanceDecayChart programTable={data?.programTable||[]}/>
                }
              </div>
            </div>
            <div className="aa-card">
              <div className="aa-ch">
                <span className="aa-ct">Programs At Risk — Summary</span>
              </div>
              <div className="aa-cb">
                {(() => {
                  const overdue=(data?.programTable||[]).filter(p=>p.regularity==="Overdue").length;
                  const watch  =(data?.programTable||[]).filter(p=>p.regularity==="Watch").length;
                  const noData =(data?.programTable||[]).filter(p=>p.regularity==="No Data").length;
                  const healthy=(data?.programTable||[]).filter(p=>p.regularity==="Healthy").length;
                  return(
                    <>
                      <VBar data={[
                        {label:"Overdue",value:overdue, color:C.red},
                        {label:"Watch",  value:watch,   color:C.amber},
                        {label:"No Data",value:noData,  color:"#6b7280"},
                        {label:"Healthy",value:healthy, color:C.green},
                      ]} height={80} colorFn={(d)=>d.color}/>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
          <div className="g3">
            {/* Programs at risk */}
            <div className="aa-card">
              <div className="aa-ch">
                <span className="aa-ct">Programs At Risk</span>
                <span style={{fontSize:"0.64rem",fontWeight:700,background:"rgba(220,38,38,0.1)",color:"#b91c1c",padding:"2px 8px",borderRadius:20}}>{k.progAtRisk||0}</span>
              </div>
              <div className="aa-cb">
                {(data?.programTable||[]).filter(p=>p.regularity==="Overdue"||p.regularity==="Watch").slice(0,6).map((p,i)=>(
                  <div key={i} className="aa-alert-item">
                    <span className={`aa-alert-pulse ${p.regularity==="Overdue"?"aap-red":"aap-amber"}`}/>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:"0.78rem",color:"#2d1200"}}>{p.programKey}</div>
                      <div style={{fontSize:"0.66rem",color:C.muted}}>{p.ownerName} · {p.area}</div>
                    </div>
                    <span className={`aa-badge aa-badge-${p.regularity==="Overdue"?"over":"watch"}`}>{p.regularity}</span>
                  </div>
                ))}
                {!(data?.programTable||[]).filter(p=>p.regularity==="Overdue"||p.regularity==="Watch").length&&(
                  <div style={{textAlign:"center",padding:"16px 0",color:C.green,fontSize:"0.76rem"}}>✅ All programs on track</div>
                )}
              </div>
            </div>
            {/* Never marked */}
            <div className="aa-card">
              <div className="aa-ch">
                <span className="aa-ct">Programs Never Marked</span>
                <span style={{fontSize:"0.64rem",fontWeight:700,background:"rgba(107,114,128,0.1)",color:"#6b7280",padding:"2px 8px",borderRadius:20}}>{k.progNoAtt||0}</span>
              </div>
              <div className="aa-cb">
                {(data?.programTable||[]).filter(p=>p.regularity==="No Data").slice(0,6).map((p,i)=>(
                  <div key={i} className="aa-alert-item">
                    <span className="aa-alert-pulse" style={{background:"#6b7280"}}/>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:"0.78rem",color:"#2d1200"}}>{p.programKey}</div>
                      <div style={{fontSize:"0.66rem",color:C.muted}}>{p.ownerName} · {p.area}</div>
                    </div>
                    <span className="aa-badge aa-badge-ina">No Data</span>
                  </div>
                ))}
                {!(data?.programTable||[]).filter(p=>p.regularity==="No Data").length&&(
                  <div style={{textAlign:"center",padding:"16px 0",color:C.green,fontSize:"0.76rem"}}>✅ All programs have data</div>
                )}
              </div>
            </div>
            {/* Owners needing attention */}
            <div className="aa-card">
              <div className="aa-ch">
                <span className="aa-ct">Owners Needing Support</span>
                {ownerAlertCount>0&&<span style={{fontSize:"0.64rem",fontWeight:700,background:"rgba(220,38,38,0.1)",color:"#b91c1c",padding:"2px 8px",borderRadius:20}}>{ownerAlertCount}</span>}
              </div>
              <div className="aa-cb">
                {(data?.ownerStats||[]).filter(o=>o.overdueCount>0).slice(0,6).map((o,i)=>(
                  <div key={i} className="aa-alert-item">
                    <span className={`aa-alert-pulse ${o.overdueCount>2?"aap-red":"aap-amber"}`}/>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:"0.78rem",color:"#2d1200"}}>{o.ownerName}</div>
                      <div style={{fontSize:"0.66rem",color:C.muted}}>{o.overdueCount} overdue · Last: {fmtShort(o.lastActivity)}</div>
                    </div>
                    <span className={`aa-pct aa-p${pctCls(o.avgAttendance)}`}>{o.avgAttendance}%</span>
                  </div>
                ))}
                {!(data?.ownerStats||[]).filter(o=>o.overdueCount>0).length&&(
                  <div style={{textAlign:"center",padding:"16px 0",color:C.green,fontSize:"0.76rem"}}>✅ All owners up to date</div>
                )}
              </div>
            </div>
          </div>

          {/* ══════════ SECTION: INSIGHTS ══════════════════════════ */}
          <div id="aa-sec-Insights" style={{scrollMarginTop:100}}/>
          <div className="aa-sec"><span className="aa-sec-t"><ISpark/>Smart Insights</span></div>
          {(data?.insights||[]).length>0?(
            <div className="aa-insight-panel gf">
              <div className="aa-ip-title"><ISpark/>Auto-Generated System Insights</div>
              {(data.insights||[]).map((ins,i)=>{
                const dotColor=ins.type==="good"?C.greenL:ins.type==="critical"?C.redL:ins.type==="warn"?C.amberL:C.blueL;
                return(
                  <div key={i} className="aa-ii">
                    <span className="aa-ii-dot" style={{background:dotColor}}/>
                    <div className="aa-ii-text">{ins.text}</div>
                  </div>
                );
              })}
            </div>
          ):(
            !loading&&<div style={{textAlign:"center",padding:"24px",color:C.muted,fontSize:"0.78rem",fontFamily:"'Cinzel',serif"}}>Mark more attendance to generate insights.</div>
          )}

          {/* ══════════ SECTION: SEARCH ════════════════════════════ */}
          {/* ══════════ SECTION: SEARCH ════════════════════════════ */}
          {/* ══════════ ADVANCED ANALYTICS ═══════════════════════ */}
          <div className="aa-sec"><span className="aa-sec-t">⚡ Advanced Program Analytics</span></div>
          <AttendanceMomentumTracker programTable={data?.programTable||[]}/>
          <div className="g2">
            <DevoteeRetentionFunnel topDevotees={data?.topDevotees||[]} bottomDevotees={data?.bottomDevotees||[]}/>
            <SessionScatterPlot programTable={data?.programTable||[]}/>
          </div>
          <AreaCompetitionMap programTable={data?.programTable||[]} filterOptions={f}/>

          {/* ══════════ SECTION: SEARCH (last) ══════════════════════ */}
          <div id="aa-sec-Search" style={{scrollMarginTop:100}}/>
          <div className="aa-sec"><span className="aa-sec-t"><IUsers/>Devotee Search &amp; Insights</span></div>
          <DevoteeSearch/>

        </div>{/* end aa-body */}
      </div>
    </>
  );
}