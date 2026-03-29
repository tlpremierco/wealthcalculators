import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from "recharts";

/* ── Formatters ──────────────────────────────────────────────────────────── */
const fm  = (n,d=0) => isNaN(n)||!isFinite(n)?"—":(n<0?"-$":"$")+Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d});
const fp  = (n,d=1) => isNaN(n)||!isFinite(n)?"—":n.toFixed(d)+"%";
const fn  = (n,d=0) => isNaN(n)||!isFinite(n)?"—":n.toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d});
const gd  = (v,thr,inv=false)=>{
  const n=parseFloat(String(v).replace(/[^0-9.-]/g,""));
  if(isNaN(n))return "";
  return (inv?n<thr:n>=thr)?"metric-good":"metric-warn";
};

/* ── Chart theme ─────────────────────────────────────────────────────────── */
const CT = {
  gold:"#E8C97A", green:"#4ade80", red:"#f87171", blue:"#60a5fa",
  purple:"#c084fc", orange:"#fb923c", teal:"#2dd4bf",
  grid:"#1A2535", bg:"#0C1622", text:"#6A8298", axis:"#3A5268"
};
const CHART_STYLE = {background:CT.bg,border:"1px solid #1A2535",borderRadius:8,padding:"18px 4px 8px",marginTop:16};
const TIP_STYLE  = {background:"#080F18",border:"1px solid #1A2535",borderRadius:6,fontSize:11,color:"#D4C9B0"};
const fmK = (v) => v>=1000000?`$${(v/1000000).toFixed(1)}M`:v>=1000?`$${(v/1000).toFixed(0)}K`:`$${v}`;

function ChartBox({title,children,height=220}){
  return (
    <div style={CHART_STYLE}>
      <div style={{fontSize:9,letterSpacing:2.5,textTransform:"uppercase",color:CT.text,marginBottom:14,paddingLeft:14}}>{title}</div>
      <ResponsiveContainer width="100%" height={height}>{children}</ResponsiveContainer>
    </div>
  );
}

/* ── Shared UI ───────────────────────────────────────────────────────────── */
function F({label,k,v,u,pre,suf,hint,step=1}){
  const [focused,setFocused]=useState(false);
  const display=focused?(v===0?"":String(v)):(v===0?"":Number(v).toLocaleString("en-US"));
  return(
    <div className="f">
      <label className="fl">{label}</label>
      <div className="fw">
        {pre&&<span className="fa">{pre}</span>}
        <input type="text" value={display}
          onFocus={()=>setFocused(true)}
          onBlur={()=>setFocused(false)}
          onChange={e=>{const n=parseFloat(e.target.value.replace(/,/g,""));u(k,isNaN(n)?0:n);}}
          className="fi" style={{paddingLeft:pre?30:10,paddingRight:suf?36:10}}/>
        {suf&&<span className="fa fa-r">{suf}</span>}
      </div>
      {hint&&<div className="fh">{hint}</div>}
    </div>
  );
}
const G2=({children})=><div className="g2">{children}</div>;
const G3=({children})=><div className="g3">{children}</div>;
const Div=({label})=><div className="divider"><span>{label}</span></div>;
function Metric({label,value,sub,cls="",col}){
  return(
    <div className={`metric ${cls}`}>
      <div className="metric-val" style={col?{color:col}:{}}>{value}</div>
      <div className="metric-label">{label}</div>
      {sub&&<div className="metric-sub">{sub}</div>}
    </div>
  );
}
const MRow=({items})=><div className="metric-row">{items.map((m,i)=><Metric key={i} {...m}/>)}</div>;
function VBanner({verdict,color,detail}){
  const bg={green:"#0a2010",yellow:"#1a1400",red:"#1a0a0a",blue:"#0a1020"};
  const bc={green:"#22c55e33",yellow:"#f59e0b33",red:"#ef444433",blue:"#60a5fa33"};
  const tc={green:"#4ade80",yellow:"#fbbf24",red:"#f87171",blue:"#93c5fd"};
  return(
    <div style={{background:bg[color],border:`1px solid ${bc[color]}`,borderLeft:`4px solid ${tc[color]}`,borderRadius:8,padding:"14px 18px",marginTop:12}}>
      <div style={{fontWeight:700,color:tc[color],fontSize:14,marginBottom:4}}>{verdict}</div>
      <div style={{fontSize:12,color:tc[color],opacity:.75,lineHeight:1.6}}>{detail}</div>
    </div>
  );
}
function RBlock({title,children}){
  return(
    <div className="results-block">
      {title&&<div className="rb-title">{title}</div>}
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   1. DEAL ANALYZER
══════════════════════════════════════════════════════════════════════════ */
function DealAnalyzer(){
  const [v,s]=useState({price:350000,down:20,rate:7,term:30,rent:2400,vacancy:7,tax:4200,ins:1800,mgmt:8,maint:2400,hoa:0,other:0,closing:3,appreciation:3,holdYears:5});
  const u=(k,val)=>s(p=>({...p,[k]:parseFloat(val)||0}));
  const r=useMemo(()=>{
    const loan=v.price*(1-v.down/100),mr=v.rate/100/12,n=v.term*12;
    const pi=mr>0?loan*(mr*Math.pow(1+mr,n))/(Math.pow(1+mr,n)-1):loan/n;
    const allIn=v.price*v.down/100+v.price*v.closing/100;
    const grossRent=v.rent*12,vacLoss=grossRent*v.vacancy/100,egi=grossRent-vacLoss;
    const mgmtF=egi*v.mgmt/100,opex=v.tax+v.ins+mgmtF+v.maint+v.hoa*12+v.other;
    const noi=egi-opex,debt=pi*12,cf=noi-debt,moCF=cf/12;
    const capRate=(noi/v.price)*100,coc=allIn>0?(cf/allIn)*100:0;
    const grm=v.price/grossRent,dscr=debt>0?noi/debt:0;
    const fv=v.price*Math.pow(1+v.appreciation/100,v.holdYears);
    const remLoan=mr>0?loan*Math.pow(1+mr,v.holdYears*12)-pi*(Math.pow(1+mr,v.holdYears*12)-1)/mr:loan-pi*v.holdYears*12;
    const equity=fv-remLoan,totCF=cf*v.holdYears;
    const totalRet=fv*0.94-remLoan+totCF-allIn;
    const annRet=allIn>0?(Math.pow(1+totalRet/allIn,1/v.holdYears)-1)*100:0;
    // chart data: annual cash flow breakdown
    const cfChart=[
      {name:"Gross Rent",value:grossRent,fill:CT.green},
      {name:"Vacancy",value:-vacLoss,fill:CT.red},
      {name:"Op Expenses",value:-opex,fill:CT.orange},
      {name:"Debt Service",value:-debt,fill:CT.purple},
      {name:"Net Cash Flow",value:cf,fill:cf>=0?CT.gold:CT.red},
    ];
    // hold projection by year
    const holdChart=Array.from({length:v.holdYears},(_, i)=>{
      const y=i+1;
      const fvy=v.price*Math.pow(1+v.appreciation/100,y);
      const remLy=mr>0?loan*Math.pow(1+mr,y*12)-pi*(Math.pow(1+mr,y*12)-1)/mr:loan-pi*y*12;
      return {year:`Yr ${y}`,value:fvy,equity:fvy-remLy,debt:remLy};
    });
    return {pi,allIn,grossRent,vacLoss,egi,opex,noi,debt,cf,moCF,capRate,coc,grm,dscr,fv,equity,totCF,totalRet,annRet,cfChart,holdChart};
  },[v]);
  const grade=r.capRate>=7&&r.coc>=8&&r.moCF>=200?{g:"green",t:"Strong Deal ✅"}:r.capRate>=5&&r.moCF>=0?{g:"yellow",t:"Marginal Deal ⚠️"}:{g:"red",t:"Doesn't Pencil 🚫"};
  return(
    <div className="calc-body">
      <G2>
        <div>
          <Div label="Purchase"/><F label="Purchase Price" k="price" v={v.price} u={u} pre="$"/>
          <F label="Down Payment" k="down" v={v.down} u={u} suf="%" step={0.5}/>
          <F label="Interest Rate" k="rate" v={v.rate} u={u} suf="%" step={0.125}/>
          <F label="Loan Term" k="term" v={v.term} u={u} suf="yrs"/>
          <F label="Closing Costs" k="closing" v={v.closing} u={u} suf="%"/>
          <Div label="Income"/>
          <F label="Monthly Gross Rent" k="rent" v={v.rent} u={u} pre="$"/>
          <F label="Vacancy Rate" k="vacancy" v={v.vacancy} u={u} suf="%"/>
        </div>
        <div>
          <Div label="Annual Expenses"/>
          <F label="Property Tax" k="tax" v={v.tax} u={u} pre="$"/>
          <F label="Insurance" k="ins" v={v.ins} u={u} pre="$"/>
          <F label="Management" k="mgmt" v={v.mgmt} u={u} suf="%" hint="% of EGI"/>
          <F label="Maintenance/CapEx" k="maint" v={v.maint} u={u} pre="$"/>
          <F label="HOA (annual)" k="hoa" v={v.hoa} u={u} pre="$"/>
          <Div label="Hold Period"/>
          <F label="Annual Appreciation" k="appreciation" v={v.appreciation} u={u} suf="%" step={0.5}/>
          <F label="Hold Years" k="holdYears" v={v.holdYears} u={u} suf="yrs"/>
        </div>
      </G2>
      <RBlock title="Deal Metrics">
        <MRow items={[
          {label:"Cap Rate",value:fp(r.capRate),sub:"Target ≥6%",cls:gd(r.capRate,6)},
          {label:"Cash-on-Cash",value:fp(r.coc),sub:"Target ≥8%",cls:gd(r.coc,8)},
          {label:"Monthly Cash Flow",value:fm(r.moCF),sub:"Target ≥$200",cls:gd(r.moCF,200)},
          {label:"DSCR",value:fn(r.dscr,2),sub:"Target ≥1.25",cls:gd(r.dscr,1.25)},
          {label:"GRM",value:fn(r.grm,1)+"×",sub:"Target ≤15",cls:gd(r.grm,15,true)},
          {label:"Annualized Return",value:fp(r.annRet),sub:`${v.holdYears}-yr hold`,cls:gd(r.annRet,10)},
        ]}/>
      </RBlock>

      <ChartBox title="Annual Cash Flow Breakdown">
        <BarChart data={r.cfChart} margin={{left:10,right:10}}>
          <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} vertical={false}/>
          <XAxis dataKey="name" tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={fmK} tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <Tooltip formatter={(v)=>fm(v)} contentStyle={TIP_STYLE} cursor={{fill:"rgba(255,255,255,.03)"}}/>
          <Bar dataKey="value" radius={[4,4,0,0]}>
            {r.cfChart.map((e,i)=><Cell key={i} fill={e.fill}/>)}
          </Bar>
          <ReferenceLine y={0} stroke={CT.grid}/>
        </BarChart>
      </ChartBox>

      <ChartBox title={`${v.holdYears}-Year Hold: Value & Equity Growth`} height={200}>
        <AreaChart data={r.holdChart} margin={{left:10,right:10}}>
          <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} vertical={false}/>
          <XAxis dataKey="year" tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={fmK} tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <Tooltip formatter={(v)=>fm(v)} contentStyle={TIP_STYLE}/>
          <Legend wrapperStyle={{fontSize:10,color:CT.text}}/>
          <Area type="monotone" dataKey="value" stackId="a" stroke={CT.blue} fill={CT.blue+"22"} name="Property Value"/>
          <Area type="monotone" dataKey="equity" stackId="b" stroke={CT.gold} fill={CT.gold+"22"} name="Your Equity"/>
        </AreaChart>
      </ChartBox>
      <VBanner verdict={grade.t} color={grade.g} detail={`Monthly P&I: ${fm(r.pi)} · All-in: ${fm(r.allIn)} · NOI: ${fm(r.noi)}/yr · ${v.holdYears}-yr return: ${fp(r.annRet)}`}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   2. BRRRR
══════════════════════════════════════════════════════════════════════════ */
function BRRRR(){
  const [v,s]=useState({purchasePrice:180000,rehabCost:45000,arv:280000,refiLtv:75,refiRate:7,refiTerm:30,rent:2000,vacancy:7,opex:35,holdingCost:1200,closingBuy:3,closingRefi:2});
  const u=(k,val)=>s(p=>({...p,[k]:parseFloat(val)||0}));
  const r=useMemo(()=>{
    const allIn=v.purchasePrice+v.rehabCost+v.purchasePrice*v.closingBuy/100+v.holdingCost;
    const refiLoan=v.arv*v.refiLtv/100,cashOut=refiLoan-v.purchasePrice-v.purchasePrice*v.closingBuy/100-v.holdingCost;
    const leftIn=allIn-refiLoan;
    const mr=v.refiRate/100/12,n=v.refiTerm*12;
    const pi=mr>0?refiLoan*(mr*Math.pow(1+mr,n))/(Math.pow(1+mr,n)-1):refiLoan/n;
    const egi=v.rent*12*(1-v.vacancy/100),noi=egi*(1-v.opex/100);
    const cf=(noi-pi*12)/12,capRate=(noi/v.arv)*100;
    const coc=leftIn>0?(cf*12/leftIn)*100:999;
    const equity=v.arv-refiLoan;
    const chartData=[
      {name:"Purchase",value:v.purchasePrice},
      {name:"Rehab",value:v.rehabCost},
      {name:"Closing/Hold",value:v.purchasePrice*v.closingBuy/100+v.holdingCost},
      {name:"Refi Loan",value:-refiLoan},
      {name:"Capital Left In",value:leftIn},
    ];
    const capitalChart=[
      {name:"All-In Cost",amount:allIn,fill:CT.orange},
      {name:"Refi Loan",amount:refiLoan,fill:CT.blue},
      {name:"Cash Out",amount:Math.max(0,cashOut),fill:CT.green},
      {name:"Left In Deal",amount:Math.max(0,leftIn),fill:leftIn<=5000?CT.gold:CT.red},
      {name:"Equity",amount:equity,fill:CT.teal},
    ];
    return {allIn,refiLoan,cashOut,leftIn,pi,noi,cf,capRate,coc,equity,capitalChart};
  },[v]);
  const flag=r.leftIn<=5000?{g:"green",t:"Full Recycle — Almost all capital returned 🎯"}:r.leftIn<=r.allIn*.25?{g:"yellow",t:"Partial Recycle — Good but not a full BRRRR"}:{g:"red",t:"Capital Heavy — Renegotiate purchase or rehab budget"};
  return(
    <div className="calc-body">
      <G2>
        <div>
          <Div label="Acquisition & Rehab"/>
          <F label="Purchase Price" k="purchasePrice" v={v.purchasePrice} u={u} pre="$"/>
          <F label="Rehab Budget" k="rehabCost" v={v.rehabCost} u={u} pre="$"/>
          <F label="After Repair Value (ARV)" k="arv" v={v.arv} u={u} pre="$"/>
          <F label="Holding Costs During Rehab" k="holdingCost" v={v.holdingCost} u={u} pre="$"/>
          <F label="Buy Closing Costs" k="closingBuy" v={v.closingBuy} u={u} suf="%"/>
        </div>
        <div>
          <Div label="Refinance"/>
          <F label="Refi LTV" k="refiLtv" v={v.refiLtv} u={u} suf="%" hint="70–75% of ARV"/>
          <F label="Refi Rate" k="refiRate" v={v.refiRate} u={u} suf="%" step={0.125}/>
          <F label="Refi Term" k="refiTerm" v={v.refiTerm} u={u} suf="yrs"/>
          <Div label="Rental"/>
          <F label="Monthly Rent" k="rent" v={v.rent} u={u} pre="$"/>
          <F label="Vacancy" k="vacancy" v={v.vacancy} u={u} suf="%"/>
          <F label="Operating Expenses" k="opex" v={v.opex} u={u} suf="%" hint="% of EGI"/>
        </div>
      </G2>
      <RBlock title="BRRRR Scorecard">
        <MRow items={[
          {label:"All-In Cost",value:fm(r.allIn)},
          {label:"Refi Loan",value:fm(r.refiLoan)},
          {label:"Cash Out",value:fm(r.cashOut),cls:r.cashOut>0?"metric-good":"metric-warn"},
          {label:"Capital Left In",value:fm(r.leftIn),cls:r.leftIn<=5000?"metric-good":r.leftIn<=r.allIn*.25?"":"metric-warn"},
          {label:"Monthly Cash Flow",value:fm(r.cf),cls:r.cf>=200?"metric-good":r.cf>=0?"":"metric-warn"},
          {label:"Cap Rate",value:fp(r.capRate),cls:gd(r.capRate,6)},
          {label:"Equity at Refi",value:fm(r.equity)},
          {label:"Cash-on-Cash",value:r.coc===999?"∞ %":fp(r.coc),cls:"metric-good"},
        ]}/>
      </RBlock>
      <ChartBox title="Capital Flow Analysis">
        <BarChart data={r.capitalChart} margin={{left:10,right:10}}>
          <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} vertical={false}/>
          <XAxis dataKey="name" tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={fmK} tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <Tooltip formatter={v=>fm(v)} contentStyle={TIP_STYLE} cursor={{fill:"rgba(255,255,255,.03)"}}/>
          <Bar dataKey="amount" radius={[4,4,0,0]}>
            {r.capitalChart.map((e,i)=><Cell key={i} fill={e.fill}/>)}
          </Bar>
        </BarChart>
      </ChartBox>
      <VBanner verdict={flag.t} color={flag.g} detail={`Capital recycled: ${fm(r.cashOut)} · Left in: ${fm(r.leftIn)} · Monthly CF: ${fm(r.cf)} · Cap Rate: ${fp(r.capRate)}`}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   3. FIX & FLIP
══════════════════════════════════════════════════════════════════════════ */
function FixFlip(){
  const [v,s]=useState({purchasePrice:150000,rehabCost:55000,arv:280000,holdMonths:6,interestRate:12,loanLtc:85,closingBuy:2,closingSell:6,tax:25});
  const u=(k,val)=>s(p=>({...p,[k]:parseFloat(val)||0}));
  const r=useMemo(()=>{
    const ltcLoan=(v.purchasePrice+v.rehabCost)*v.loanLtc/100;
    const cashNeeded=(v.purchasePrice+v.rehabCost)-ltcLoan+v.purchasePrice*v.closingBuy/100;
    const interest=ltcLoan*v.interestRate/100/12*v.holdMonths;
    const sellCost=v.arv*v.closingSell/100;
    const buyCost=v.purchasePrice*v.closingBuy/100;
    const totalCost=v.purchasePrice+v.rehabCost+interest+buyCost+sellCost;
    const grossProfit=v.arv-totalCost;
    const taxAmt=grossProfit>0?grossProfit*v.tax/100:0;
    const netProfit=grossProfit-taxAmt;
    const roi=cashNeeded>0?(netProfit/cashNeeded)*100:0;
    const annRoi=v.holdMonths>0?(roi/v.holdMonths)*12:0;
    const mao=v.arv*.70-v.rehabCost;
    const arvPct=(v.purchasePrice+v.rehabCost)/v.arv*100;
    const costChart=[
      {name:"Purchase",value:v.purchasePrice,fill:CT.blue},
      {name:"Rehab",value:v.rehabCost,fill:CT.orange},
      {name:"Interest",value:interest,fill:CT.purple},
      {name:"Buy Closing",value:buyCost,fill:CT.teal},
      {name:"Sell Costs",value:sellCost,fill:CT.red},
      {name:"Net Profit",value:netProfit,fill:netProfit>0?CT.green:CT.red},
    ];
    return {ltcLoan,cashNeeded,interest,sellCost,buyCost,totalCost,grossProfit,taxAmt,netProfit,roi,annRoi,mao,arvPct,costChart};
  },[v]);
  const verd=r.netProfit>=30000&&r.arvPct<=70?{g:"green",t:"Strong Flip ✅"}:r.netProfit>=15000?{g:"yellow",t:"Marginal — tighten costs or renegotiate"}:{g:"red",t:"Doesn't pencil — pass or renegotiate"};
  return(
    <div className="calc-body">
      <G2>
        <div>
          <Div label="Deal"/>
          <F label="Purchase Price" k="purchasePrice" v={v.purchasePrice} u={u} pre="$"/>
          <F label="Rehab Budget" k="rehabCost" v={v.rehabCost} u={u} pre="$"/>
          <F label="After Repair Value (ARV)" k="arv" v={v.arv} u={u} pre="$"/>
          <F label="Hold Period" k="holdMonths" v={v.holdMonths} u={u} suf="months"/>
          <F label="Buy Closing Costs" k="closingBuy" v={v.closingBuy} u={u} suf="%"/>
          <F label="Sell Closing Costs" k="closingSell" v={v.closingSell} u={u} suf="%"/>
        </div>
        <div>
          <Div label="Financing & Tax"/>
          <F label="Hard Money LTC" k="loanLtc" v={v.loanLtc} u={u} suf="%" hint="% of total cost financed"/>
          <F label="Interest Rate" k="interestRate" v={v.interestRate} u={u} suf="%" hint="Hard money: 10–14%"/>
          <F label="Short-Term Cap Gains Tax" k="tax" v={v.tax} u={u} suf="%"/>
        </div>
      </G2>
      <RBlock title="Flip Analysis">
        <MRow items={[
          {label:"70% MAO",value:fm(r.mao),sub:"Max you should pay",cls:v.purchasePrice<=r.mao?"metric-good":"metric-warn"},
          {label:"All-In vs ARV",value:fp(r.arvPct),sub:"Target ≤70%",cls:r.arvPct<=70?"metric-good":"metric-warn"},
          {label:"Cash Needed",value:fm(r.cashNeeded)},
          {label:"Gross Profit",value:fm(r.grossProfit),cls:r.grossProfit>0?"metric-good":"metric-warn"},
          {label:"Tax Estimate",value:fm(r.taxAmt)},
          {label:"Net Profit",value:fm(r.netProfit),cls:r.netProfit>=30000?"metric-good":r.netProfit>=0?"":"metric-warn"},
          {label:"ROI on Cash",value:fp(r.roi),cls:gd(r.roi,20)},
          {label:"Annualized ROI",value:fp(r.annRoi),cls:gd(r.annRoi,30)},
        ]}/>
      </RBlock>
      <ChartBox title="Cost Stack vs ARV">
        <BarChart data={r.costChart} margin={{left:10,right:10}}>
          <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} vertical={false}/>
          <XAxis dataKey="name" tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={fmK} tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <Tooltip formatter={v=>fm(v)} contentStyle={TIP_STYLE} cursor={{fill:"rgba(255,255,255,.03)"}}/>
          <ReferenceLine y={v.arv} stroke={CT.gold} strokeDasharray="4 4" label={{value:"ARV",fill:CT.gold,fontSize:10}}/>
          <Bar dataKey="value" radius={[4,4,0,0]}>
            {r.costChart.map((e,i)=><Cell key={i} fill={e.fill}/>)}
          </Bar>
        </BarChart>
      </ChartBox>
      <VBanner verdict={verd.t} color={verd.g} detail={`Net profit: ${fm(r.netProfit)} · Cash deployed: ${fm(r.cashNeeded)} · 70% MAO: ${fm(r.mao)} · Annualized ROI: ${fp(r.annRoi)}`}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   4. MORTGAGE AMORTIZATION
══════════════════════════════════════════════════════════════════════════ */
function MortgageAmort(){
  const [v,s]=useState({price:400000,down:20,rate:7,term:30,extra:0});
  const u=(k,val)=>s(p=>({...p,[k]:parseFloat(val)||0}));
  const r=useMemo(()=>{
    const loan=v.price*(1-v.down/100),mr=v.rate/100/12,n=v.term*12;
    const pi=mr>0?loan*(mr*Math.pow(1+mr,n))/(Math.pow(1+mr,n)-1):loan/n;
    const totalPmt=pi+v.extra;
    let bal=loan,moE=0,totIntE=0;
    while(bal>0&&moE<n*2){const int=bal*mr;totIntE+=int;bal=Math.max(0,bal+int-totalPmt);moE++;}
    const totInt=pi*n-loan,saved=totInt-totIntE;
    // yearly amort chart (every 5 years)
    const amortChart=[];
    for(let y=1;y<=v.term;y+=v.term<=15?1:v.term<=20?2:5){
      const nb=mr>0?loan*Math.pow(1+mr,y*12)-pi*(Math.pow(1+mr,y*12)-1)/mr:Math.max(0,loan-pi*y*12);
      const paid=pi*y*12-loan;
      amortChart.push({year:`Yr ${y}`,balance:Math.max(0,nb),interest:Math.max(0,paid),equity:Math.max(0,loan-nb)});
    }
    return {loan,pi,totalPmt,totInt,totIntE,saved,moE,amortChart,n};
  },[v]);
  return(
    <div className="calc-body">
      <G3>
        <F label="Home Price" k="price" v={v.price} u={u} pre="$"/>
        <F label="Down Payment" k="down" v={v.down} u={u} suf="%"/>
        <F label="Interest Rate" k="rate" v={v.rate} u={u} suf="%" step={0.125}/>
        <F label="Loan Term" k="term" v={v.term} u={u} suf="yrs"/>
        <F label="Extra Monthly Payment" k="extra" v={v.extra} u={u} pre="$" hint="Accelerates payoff"/>
      </G3>
      <RBlock title="Loan Summary">
        <MRow items={[
          {label:"Loan Amount",value:fm(r.loan)},
          {label:"Monthly P&I",value:fm(r.pi)},
          {label:"With Extra Payment",value:fm(r.totalPmt)},
          {label:"Total Interest (standard)",value:fm(r.totInt)},
          {label:"Total Interest (w/ extra)",value:fm(r.totIntE)},
          {label:"Interest Saved",value:fm(r.saved),cls:"metric-good"},
          {label:"Payoff w/ Extra",value:`${Math.ceil(r.moE/12)} yrs`,cls:r.moE<r.n?"metric-good":""},
        ]}/>
      </RBlock>
      <ChartBox title="Loan Balance — Principal vs Interest Over Time" height={240}>
        <AreaChart data={r.amortChart} margin={{left:10,right:10}}>
          <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} vertical={false}/>
          <XAxis dataKey="year" tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={fmK} tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <Tooltip formatter={v=>fm(v)} contentStyle={TIP_STYLE}/>
          <Legend wrapperStyle={{fontSize:10,color:CT.text}}/>
          <Area type="monotone" dataKey="balance" stroke={CT.red} fill={CT.red+"22"} name="Remaining Balance"/>
          <Area type="monotone" dataKey="equity" stroke={CT.green} fill={CT.green+"22"} name="Equity Built"/>
        </AreaChart>
      </ChartBox>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   5. RENT VS BUY
══════════════════════════════════════════════════════════════════════════ */
function RentVsBuy(){
  const [v,s]=useState({rent:2500,price:400000,down:20,rate:7,term:30,appreciation:3.5,rentIncrease:3,years:10,tax:4000,ins:1500,maint:4000,invest:8});
  const u=(k,val)=>s(p=>({...p,[k]:parseFloat(val)||0}));
  const r=useMemo(()=>{
    const loan=v.price*(1-v.down/100),mr=v.rate/100/12,n=v.term*12;
    const pi=mr>0?loan*(mr*Math.pow(1+mr,n))/(Math.pow(1+mr,n)-1):loan/n;
    const downAmt=v.price*v.down/100,closingBuy=v.price*.03;
    // year-by-year comparison
    const chart=[];
    let cumBuy=downAmt+closingBuy,cumRent=0;
    const downInvested=downAmt;
    for(let y=1;y<=v.years;y++){
      cumBuy+=pi*12+v.tax+v.ins+v.maint;
      const fvBuy=v.price*Math.pow(1+v.appreciation/100,y);
      const remLoan=mr>0?loan*Math.pow(1+mr,y*12)-pi*(Math.pow(1+mr,y*12)-1)/mr:loan-pi*y*12;
      const netBuy=cumBuy-(fvBuy*0.94-Math.max(0,remLoan));
      cumRent+=v.rent*Math.pow(1+v.rentIncrease/100,y-1)*12;
      const downGrown=downInvested*Math.pow(1+v.invest/100,y);
      const netRent=cumRent+(downInvested-downGrown);
      chart.push({year:`Y${y}`,buy:Math.round(netBuy),rent:Math.round(netRent)});
    }
    const last=chart[chart.length-1]||{buy:0,rent:0};
    const buyWins=last.buy<last.rent;
    return {pi,downAmt,buyWins,chart,lastBuy:last.buy,lastRent:last.rent};
  },[v]);
  return(
    <div className="calc-body">
      <G2>
        <div>
          <Div label="Renting"/>
          <F label="Monthly Rent Today" k="rent" v={v.rent} u={u} pre="$"/>
          <F label="Annual Rent Increase" k="rentIncrease" v={v.rentIncrease} u={u} suf="%"/>
          <F label="Investment Return if Renting" k="invest" v={v.invest} u={u} suf="%" hint="Return on down payment invested"/>
        </div>
        <div>
          <Div label="Buying"/>
          <F label="Purchase Price" k="price" v={v.price} u={u} pre="$"/>
          <F label="Down Payment" k="down" v={v.down} u={u} suf="%"/>
          <F label="Interest Rate" k="rate" v={v.rate} u={u} suf="%" step={0.125}/>
          <F label="Annual Property Tax" k="tax" v={v.tax} u={u} pre="$"/>
          <F label="Annual Insurance" k="ins" v={v.ins} u={u} pre="$"/>
          <F label="Annual Maintenance" k="maint" v={v.maint} u={u} pre="$" hint="1% of value/yr"/>
          <F label="Home Appreciation" k="appreciation" v={v.appreciation} u={u} suf="%" step={0.5}/>
          <F label="Years to Compare" k="years" v={v.years} u={u} suf="yrs"/>
        </div>
      </G2>
      <RBlock title={`${v.years}-Year Net Cost (lower = better)`}>
        <MRow items={[
          {label:"Monthly P&I",value:fm(r.pi)},
          {label:"Down Payment",value:fm(r.downAmt)},
          {label:`Net Cost: Buy`,value:fm(r.lastBuy)},
          {label:`Net Cost: Rent`,value:fm(r.lastRent)},
          {label:r.buyWins?"Buy Saves":"Rent Saves",value:fm(Math.abs(r.lastBuy-r.lastRent)),cls:r.buyWins?"metric-good":""},
        ]}/>
      </RBlock>
      <ChartBox title="Cumulative Net Cost Over Time — Lower Line Wins" height={240}>
        <LineChart data={r.chart} margin={{left:10,right:10}}>
          <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} vertical={false}/>
          <XAxis dataKey="year" tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={fmK} tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <Tooltip formatter={v=>fm(v)} contentStyle={TIP_STYLE}/>
          <Legend wrapperStyle={{fontSize:10,color:CT.text}}/>
          <Line type="monotone" dataKey="buy" stroke={CT.gold} strokeWidth={2} dot={false} name="Buy (net)"/>
          <Line type="monotone" dataKey="rent" stroke={CT.blue} strokeWidth={2} dot={false} name="Rent (net)"/>
        </LineChart>
      </ChartBox>
      <VBanner verdict={r.buyWins?`Buying wins over ${v.years} years ✅`:`Renting wins over ${v.years} years`} color={r.buyWins?"green":"yellow"}
        detail={`Net cost to buy: ${fm(r.lastBuy)} · Net cost to rent: ${fm(r.lastRent)} · Including all costs, taxes, maintenance, and opportunity cost`}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   6. JOB COST & BID
══════════════════════════════════════════════════════════════════════════ */
function JobCostBid(){
  const [rows,setRows]=useState([
    {desc:"Framing Labor",labor:8000,material:0,sub:0},{desc:"Electrical",labor:0,material:0,sub:12000},
    {desc:"Plumbing",labor:0,material:0,sub:8500},{desc:"Drywall",labor:4000,material:3500,sub:0},
    {desc:"Flooring",labor:2500,material:6000,sub:0},{desc:"Paint",labor:3000,material:1200,sub:0},
  ]);
  const [v,s]=useState({overhead:15,margin:22,contingency:5,permitFees:1500});
  const u=(k,val)=>s(p=>({...p,[k]:parseFloat(val)||0}));
  const upd=(i,k,val)=>setRows(p=>p.map((r,x)=>x===i?{...r,[k]:parseFloat(val)||0}:r));
  const r=useMemo(()=>{
    const tL=rows.reduce((s,r)=>s+r.labor,0),tM=rows.reduce((s,r)=>s+r.material,0),tS=rows.reduce((s,r)=>s+r.sub,0);
    const direct=tL+tM+tS+v.permitFees,cont=direct*v.contingency/100;
    const withCont=direct+cont,ovhd=withCont*v.overhead/100,sub=withCont+ovhd;
    const mrgn=sub*v.margin/100,bid=sub+mrgn,actualMargin=(mrgn/bid)*100;
    const pieData=[
      {name:"Labor",value:tL,fill:CT.blue},{name:"Materials",value:tM,fill:CT.orange},
      {name:"Subcontractors",value:tS,fill:CT.purple},{name:"Overhead",value:ovhd,fill:CT.teal},
      {name:"Profit",value:mrgn,fill:CT.green},{name:"Permit/Other",value:v.permitFees+cont,fill:CT.gold},
    ].filter(d=>d.value>0);
    return {tL,tM,tS,direct,cont,ovhd,sub,mrgn,bid,actualMargin,pieData};
  },[rows,v]);
  return(
    <div className="calc-body">
      <div className="table-wrap">
        <table className="cost-table">
          <thead><tr><th>Description</th><th>Labor</th><th>Materials</th><th>Subcontractor</th><th>Total</th><th></th></tr></thead>
          <tbody>{rows.map((row,i)=>(
            <tr key={i}>
              <td><input value={row.desc} onChange={e=>upd(i,"desc",e.target.value)} className="td-input" placeholder="Description"/></td>
              <td><input type="number" value={row.labor} onChange={e=>upd(i,"labor",e.target.value)} className="td-input td-num"/></td>
              <td><input type="number" value={row.material} onChange={e=>upd(i,"material",e.target.value)} className="td-input td-num"/></td>
              <td><input type="number" value={row.sub} onChange={e=>upd(i,"sub",e.target.value)} className="td-input td-num"/></td>
              <td className="td-total">{fm(row.labor+row.material+row.sub)}</td>
              <td><button onClick={()=>setRows(p=>p.filter((_,x)=>x!==i))} className="remove-btn">✕</button></td>
            </tr>
          ))}</tbody>
        </table>
        <button onClick={()=>setRows(p=>[...p,{desc:"",labor:0,material:0,sub:0}])} className="add-btn">+ Add Line Item</button>
      </div>
      <G2 style={{marginTop:20}}>
        <div>
          <Div label="Settings"/>
          <F label="Permit Fees" k="permitFees" v={v.permitFees} u={u} pre="$"/>
          <F label="Contingency" k="contingency" v={v.contingency} u={u} suf="%"/>
          <F label="Overhead (G&A)" k="overhead" v={v.overhead} u={u} suf="%"/>
          <F label="Profit Margin" k="margin" v={v.margin} u={u} suf="%" hint="Target 18–25% for GC work"/>
        </div>
        <RBlock title="Bid Summary">
          <MRow items={[
            {label:"Direct Costs",value:fm(r.direct)},
            {label:"Contingency",value:fm(r.cont)},
            {label:"Overhead",value:fm(r.ovhd)},
            {label:"Profit",value:fm(r.mrgn),cls:"metric-good"},
            {label:"BID PRICE",value:fm(r.bid),cls:"metric-good"},
            {label:"True Margin",value:fp(r.actualMargin),cls:gd(r.actualMargin,18)},
          ]}/>
        </RBlock>
      </G2>
      <ChartBox title="Cost Breakdown">
        <PieChart>
          <Pie data={r.pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={{stroke:CT.grid}}>
            {r.pieData.map((e,i)=><Cell key={i} fill={e.fill}/>)}
          </Pie>
          <Tooltip formatter={v=>fm(v)} contentStyle={TIP_STYLE}/>
        </PieChart>
      </ChartBox>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   7. MARKUP VS MARGIN
══════════════════════════════════════════════════════════════════════════ */
function MarkupMargin(){
  const [mode,setMode]=useState("markup");
  const [v,s]=useState({cost:50000,markup:25,margin:20,targetBid:75000});
  const u=(k,val)=>s(p=>({...p,[k]:parseFloat(val)||0}));
  const r=useMemo(()=>{
    const fmup=v.cost*(1+v.markup/100),mupMargin=((fmup-v.cost)/fmup)*100;
    const fmrg=v.margin<100?v.cost/(1-v.margin/100):0,mrgMarkup=v.cost>0?((fmrg-v.cost)/v.cost)*100:0;
    const revMargin=v.targetBid>0?((v.targetBid-v.cost)/v.targetBid)*100:0,revMarkup=v.cost>0?((v.targetBid-v.cost)/v.cost)*100:0;
    const compare=Array.from({length:9},(_,i)=>{
      const pct=(i+1)*5,price=v.cost*(1+pct/100),margin=((price-v.cost)/price)*100;
      return {markup:`${pct}%`,markupAmt:price-v.cost,marginAmt:v.cost/(1-pct/100)-v.cost,note:margin.toFixed(1)+"%"};
    });
    return {fmup,mupMargin,fmrg,mrgMarkup,revMargin,revMarkup,compare};
  },[v]);
  return(
    <div className="calc-body">
      <div className="mode-tabs">
        {[["markup","Markup → Price"],["margin","Margin → Price"],["reverse","Price → Margin"]].map(([m,l])=>(
          <button key={m} onClick={()=>setMode(m)} className={`mode-tab ${mode===m?"mode-active":""}`}>{l}</button>
        ))}
      </div>
      {mode==="markup"&&<><G2><F label="Job Cost" k="cost" v={v.cost} u={u} pre="$"/><F label="Markup %" k="markup" v={v.markup} u={u} suf="%"/></G2>
        <RBlock><MRow items={[{label:"Bid Price",value:fm(r.fmup),cls:"metric-good"},{label:"Gross Profit",value:fm(r.fmup-v.cost)},{label:"True Margin",value:fp(r.mupMargin),cls:gd(r.mupMargin,18)}]}/></RBlock></>}
      {mode==="margin"&&<><G2><F label="Job Cost" k="cost" v={v.cost} u={u} pre="$"/><F label="Target Margin %" k="margin" v={v.margin} u={u} suf="%"/></G2>
        <RBlock><MRow items={[{label:"Bid Price",value:fm(r.fmrg),cls:"metric-good"},{label:"Gross Profit",value:fm(r.fmrg-v.cost)},{label:"Equiv. Markup",value:fp(r.mrgMarkup)}]}/></RBlock></>}
      {mode==="reverse"&&<><G2><F label="Job Cost" k="cost" v={v.cost} u={u} pre="$"/><F label="Quoted Price" k="targetBid" v={v.targetBid} u={u} pre="$"/></G2>
        <RBlock><MRow items={[{label:"Margin",value:fp(r.revMargin),cls:gd(r.revMargin,18)},{label:"Markup",value:fp(r.revMarkup)},{label:"Gross Profit",value:fm(v.targetBid-v.cost),cls:v.targetBid>v.cost?"metric-good":"metric-warn"}]}/></RBlock></>}
      <ChartBox title="Markup % vs True Margin % — They Are Not Equal">
        <ComposedChart data={r.compare} margin={{left:10,right:10}}>
          <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} vertical={false}/>
          <XAxis dataKey="markup" tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={v=>`$${(v/1000).toFixed(0)}K`} tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <Tooltip formatter={v=>fm(v)} contentStyle={TIP_STYLE}/>
          <Legend wrapperStyle={{fontSize:10,color:CT.text}}/>
          <Bar dataKey="markupAmt" fill={CT.orange} name="Profit via Markup" radius={[3,3,0,0]}/>
          <Bar dataKey="marginAmt" fill={CT.green} name="Profit via Same % Margin" radius={[3,3,0,0]}/>
        </ComposedChart>
      </ChartBox>
      <VBanner verdict={`A ${fp(v.markup)} markup = only ${fp(r.mupMargin,1)} margin`} color="yellow" detail="Margin = profit ÷ price. Markup = profit ÷ cost. At 25% markup your true margin is only 20%. Quote in margin to protect profitability."/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   8. BURDENED LABOR RATE
══════════════════════════════════════════════════════════════════════════ */
function LaborRate(){
  const [v,s]=useState({baseWage:28,fica:7.65,workers:4.5,unemployment:2.5,health:250,tools:5,overhead:15,markup:20,hoursWeek:40,weeksYear:50});
  const u=(k,val)=>s(p=>({...p,[k]:parseFloat(val)||0}));
  const r=useMemo(()=>{
    const burden=v.baseWage*(1+(v.fica+v.workers+v.unemployment)/100)+v.health/v.hoursWeek+v.tools;
    const withOvhd=burden*(1+v.overhead/100);
    const billable=withOvhd/(1-v.markup/100);
    const annual=burden*v.hoursWeek*v.weeksYear;
    const layers=[
      {name:"Base Wage",rate:v.baseWage,fill:CT.blue},
      {name:"+ Payroll Taxes",rate:v.baseWage*(v.fica+v.workers+v.unemployment)/100,fill:CT.orange},
      {name:"+ Benefits",rate:v.health/v.hoursWeek,fill:CT.purple},
      {name:"+ Tools/PPE",rate:v.tools,fill:CT.teal},
      {name:"+ Overhead",rate:burden*v.overhead/100,fill:CT.red},
      {name:"+ Profit",rate:withOvhd*v.markup/(100-v.markup),fill:CT.green},
    ];
    return {burden,withOvhd,billable,annual,layers};
  },[v]);
  return(
    <div className="calc-body">
      <G2>
        <div>
          <Div label="Compensation"/>
          <F label="Base Wage" k="baseWage" v={v.baseWage} u={u} pre="$" suf="/hr"/>
          <F label="FICA / Payroll Tax" k="fica" v={v.fica} u={u} suf="%" hint="Employer share: 7.65%"/>
          <F label="Workers' Comp" k="workers" v={v.workers} u={u} suf="%" hint="Construction: 3–8%"/>
          <F label="Unemployment" k="unemployment" v={v.unemployment} u={u} suf="%"/>
          <F label="Health Benefits" k="health" v={v.health} u={u} pre="$" suf="/mo"/>
          <F label="Tools / PPE" k="tools" v={v.tools} u={u} pre="$" suf="/hr"/>
        </div>
        <div>
          <Div label="Business"/>
          <F label="Overhead Rate" k="overhead" v={v.overhead} u={u} suf="%"/>
          <F label="Profit Markup" k="markup" v={v.markup} u={u} suf="%"/>
          <F label="Hours/Week" k="hoursWeek" v={v.hoursWeek} u={u} suf="hrs"/>
          <F label="Productive Weeks/Year" k="weeksYear" v={v.weeksYear} u={u} suf="wks"/>
          <RBlock title="Rate Buildup">
            <MRow items={[
              {label:"Base Wage",value:fm(v.baseWage)+"/hr"},
              {label:"Burdened Cost",value:fm(r.burden)+"/hr",cls:""},
              {label:"With Overhead",value:fm(r.withOvhd)+"/hr"},
              {label:"Billable Rate",value:fm(r.billable)+"/hr",cls:"metric-good"},
              {label:"Annual Employee Cost",value:fm(r.annual)},
            ]}/>
          </RBlock>
        </div>
      </G2>
      <ChartBox title="Rate Buildup — Each Layer of Cost">
        <BarChart data={r.layers} layout="vertical" margin={{left:80,right:30}}>
          <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} horizontal={false}/>
          <XAxis type="number" tickFormatter={v=>`$${v.toFixed(0)}/hr`} tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis type="category" dataKey="name" tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false} width={80}/>
          <Tooltip formatter={v=>`$${v.toFixed(2)}/hr`} contentStyle={TIP_STYLE}/>
          <Bar dataKey="rate" radius={[0,4,4,0]}>
            {r.layers.map((e,i)=><Cell key={i} fill={e.fill}/>)}
          </Bar>
          <ReferenceLine x={r.billable} stroke={CT.gold} strokeDasharray="4 4"/>
        </BarChart>
      </ChartBox>
      <VBanner verdict={`Charge at least ${fm(r.billable)}/hr to hit your margin target`} color="blue" detail={`Base wage: $${v.baseWage}/hr · Burdened: ${fm(r.burden)}/hr · That's ${fp((r.burden-v.baseWage)/v.baseWage*100)} more than base — never quote base wage to clients.`}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   9. EQUIPMENT ROI
══════════════════════════════════════════════════════════════════════════ */
function EquipmentROI(){
  const [v,s]=useState({purchasePrice:85000,lifeYears:7,salvage:15000,maintenance:3500,insurance:2000,financeRate:6,financeTerm:5,rentalDay:650,billableDay:850,daysPerYear:120});
  const u=(k,val)=>s(p=>({...p,[k]:parseFloat(val)||0}));
  const r=useMemo(()=>{
    const loan=v.purchasePrice,mr=v.financeRate/100/12,n=v.financeTerm*12;
    const pi=mr>0?loan*(mr*Math.pow(1+mr,n))/(Math.pow(1+mr,n)-1):loan/n;
    const annOwn=pi*12+v.maintenance+v.insurance;
    const annRevenue=v.daysPerYear*v.billableDay;
    const annRental=v.daysPerYear*v.rentalDay;
    const ownProfit=annRevenue-annOwn;
    const rentProfit=annRevenue-annRental;
    const advantage=ownProfit-rentProfit;
    const payback=advantage>0?v.purchasePrice/advantage:999;
    const roi=advantage>0?(advantage/v.purchasePrice)*100:0;
    // cumulative chart
    const cumChart=Array.from({length:Math.min(v.lifeYears,10)},(_,i)=>{
      const y=i+1;
      return {year:`Yr ${y}`,own:Math.round(ownProfit*y-v.purchasePrice*(1-i/v.lifeYears)),rent:Math.round(rentProfit*y)};
    });
    return {pi,annOwn,annRevenue,annRental,ownProfit,rentProfit,advantage,payback,roi,cumChart};
  },[v]);
  return(
    <div className="calc-body">
      <G2>
        <div>
          <Div label="Purchase"/>
          <F label="Purchase Price" k="purchasePrice" v={v.purchasePrice} u={u} pre="$"/>
          <F label="Useful Life" k="lifeYears" v={v.lifeYears} u={u} suf="yrs"/>
          <F label="Salvage Value" k="salvage" v={v.salvage} u={u} pre="$"/>
          <F label="Annual Maintenance" k="maintenance" v={v.maintenance} u={u} pre="$"/>
          <F label="Annual Insurance" k="insurance" v={v.insurance} u={u} pre="$"/>
          <F label="Finance Rate" k="financeRate" v={v.financeRate} u={u} suf="%"/>
          <F label="Finance Term" k="financeTerm" v={v.financeTerm} u={u} suf="yrs"/>
        </div>
        <div>
          <Div label="Usage"/>
          <F label="Daily Rental Rate" k="rentalDay" v={v.rentalDay} u={u} pre="$" suf="/day"/>
          <F label="Daily Bill Rate to Client" k="billableDay" v={v.billableDay} u={u} pre="$" suf="/day"/>
          <F label="Billable Days per Year" k="daysPerYear" v={v.daysPerYear} u={u} suf="days"/>
          <RBlock title="Annual Comparison">
            <MRow items={[
              {label:"Annual Revenue",value:fm(r.annRevenue)},
              {label:"Annual Own Cost",value:fm(r.annOwn)},
              {label:"Own Profit",value:fm(r.ownProfit),cls:r.ownProfit>0?"metric-good":"metric-warn"},
              {label:"Rent Cost",value:fm(r.annRental)},
              {label:"Rent Profit",value:fm(r.rentProfit),cls:r.rentProfit>0?"metric-good":"metric-warn"},
              {label:"Advantage",value:fm(Math.abs(r.advantage)),cls:r.advantage>0?"metric-good":"metric-warn"},
              {label:"Payback Period",value:`${fn(r.payback,1)} yrs`},
              {label:"ROI on Equipment",value:fp(r.roi),cls:gd(r.roi,15)},
            ]}/>
          </RBlock>
        </div>
      </G2>
      <ChartBox title="Cumulative Profit: Own vs Rent Over Equipment Life" height={220}>
        <LineChart data={r.cumChart} margin={{left:10,right:10}}>
          <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} vertical={false}/>
          <XAxis dataKey="year" tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={fmK} tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <Tooltip formatter={v=>fm(v)} contentStyle={TIP_STYLE}/>
          <Legend wrapperStyle={{fontSize:10,color:CT.text}}/>
          <ReferenceLine y={0} stroke={CT.grid}/>
          <Line type="monotone" dataKey="own" stroke={CT.gold} strokeWidth={2} dot={false} name="Own Equipment"/>
          <Line type="monotone" dataKey="rent" stroke={CT.blue} strokeWidth={2} dot={false} name="Rent Equipment"/>
        </LineChart>
      </ChartBox>
      <VBanner verdict={r.advantage>0?`Owning wins by ${fm(r.advantage)}/yr ✅`:`Renting wins by ${fm(Math.abs(r.advantage))}/yr`}
        color={r.advantage>0?"green":"yellow"} detail={`Payback: ${fn(r.payback,1)} years · ROI: ${fp(r.roi)} · At ${r.annRevenue>0?Math.ceil(r.annOwn/v.billableDay):0} billable days/yr you break even`}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   10. PROJECT BREAK-EVEN
══════════════════════════════════════════════════════════════════════════ */
function ProjectBreakEven(){
  const [v,s]=useState({fixedCosts:25000,variablePct:45,revenue:80000,targetProfit:20000});
  const u=(k,val)=>s(p=>({...p,[k]:parseFloat(val)||0}));
  const r=useMemo(()=>{
    const contrib=1-v.variablePct/100;
    const beRev=contrib>0?v.fixedCosts/contrib:0;
    const targetRev=contrib>0?(v.fixedCosts+v.targetProfit)/contrib:0;
    const profit=v.revenue-v.fixedCosts-v.revenue*v.variablePct/100;
    const margin=v.revenue>0?(profit/v.revenue)*100:0;
    const safety=v.revenue>0?((v.revenue-beRev)/v.revenue)*100:0;
    const pts=Array.from({length:11},(_,i)=>{
      const rev=beRev*i/5;
      return {rev:Math.round(rev),fixed:Math.round(v.fixedCosts),total:Math.round(v.fixedCosts+rev*v.variablePct/100),revenue:Math.round(rev)};
    });
    return {contrib,beRev,targetRev,profit,margin,safety,pts};
  },[v]);
  return(
    <div className="calc-body">
      <G2>
        <F label="Fixed Costs (Overhead, Salaries)" k="fixedCosts" v={v.fixedCosts} u={u} pre="$"/>
        <F label="Variable Cost %" k="variablePct" v={v.variablePct} u={u} suf="%" hint="Labor + materials as % of revenue"/>
        <F label="Actual Project Revenue" k="revenue" v={v.revenue} u={u} pre="$"/>
        <F label="Target Profit" k="targetProfit" v={v.targetProfit} u={u} pre="$"/>
      </G2>
      <RBlock><MRow items={[
        {label:"Contribution Margin",value:fp(r.contrib*100)},
        {label:"Break-Even Revenue",value:fm(r.beRev)},
        {label:"Revenue for Target Profit",value:fm(r.targetRev)},
        {label:"Actual Profit",value:fm(r.profit),cls:r.profit>=0?"metric-good":"metric-warn"},
        {label:"Profit Margin",value:fp(r.margin),cls:gd(r.margin,18)},
        {label:"Margin of Safety",value:fp(r.safety),cls:r.safety>20?"metric-good":r.safety>0?"":"metric-warn"},
      ]}/></RBlock>
      <ChartBox title="Break-Even Chart — Where Revenue Crosses Total Cost" height={230}>
        <LineChart data={r.pts} margin={{left:10,right:10}}>
          <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} vertical={false}/>
          <XAxis dataKey="rev" tickFormatter={fmK} tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={fmK} tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <Tooltip formatter={v=>fm(v)} contentStyle={TIP_STYLE}/>
          <Legend wrapperStyle={{fontSize:10,color:CT.text}}/>
          <Line type="monotone" dataKey="revenue" stroke={CT.green} strokeWidth={2} dot={false} name="Revenue"/>
          <Line type="monotone" dataKey="total" stroke={CT.red} strokeWidth={2} dot={false} name="Total Cost"/>
          <Line type="monotone" dataKey="fixed" stroke={CT.text} strokeDasharray="4 4" strokeWidth={1} dot={false} name="Fixed Cost"/>
          <ReferenceLine x={Math.round(r.beRev)} stroke={CT.gold} strokeDasharray="4 4" label={{value:"B.E.",fill:CT.gold,fontSize:10}}/>
        </LineChart>
      </ChartBox>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   NEW CONSTRUCTION COST CALCULATOR
   Full phase-by-phase breakdown — Florida/SW market rates pre-loaded
══════════════════════════════════════════════════════════════════════════ */
const CON_PHASES=[
  {phase:"Site Work",     col:"#60a5fa", items:[
    {desc:"Land Clearing & Grubbing",   labor:4500,  mat:800},
    {desc:"Grading & Drainage",         labor:6000,  mat:1500},
    {desc:"Driveway & Parking",         labor:3500,  mat:6000},
    {desc:"Utilities (water/sewer/elec to meter)",labor:8000, mat:12000},
    {desc:"Landscaping & Irrigation",   labor:5000,  mat:9000},
  ]},
  {phase:"Foundation",   col:"#a78bfa", items:[
    {desc:"Survey & Layout",            labor:1500,  mat:800},
    {desc:"Stem Wall / Footings",       labor:12000, mat:8000},
    {desc:"Slab (monolithic)",          labor:9000,  mat:14000},
    {desc:"Termite Treatment",          labor:500,   mat:1200},
  ]},
  {phase:"Framing",      col:"#fb923c", items:[
    {desc:"Floor System (if raised)",   labor:0,     mat:0},
    {desc:"Exterior Wall Framing",      labor:18000, mat:22000},
    {desc:"Interior Wall Framing",      labor:8000,  mat:7000},
    {desc:"Roof Framing / Trusses",     labor:12000, mat:18000},
    {desc:"Sheathing & Wrap",           labor:5000,  mat:8000},
  ]},
  {phase:"Roofing",      col:"#2dd4bf", items:[
    {desc:"Roof Decking",               labor:3000,  mat:5000},
    {desc:"Underlayment",               labor:1500,  mat:2500},
    {desc:"Shingle / Metal / Tile",     labor:9000,  mat:16000},
    {desc:"Gutters & Fascia",           labor:2500,  mat:3500},
  ]},
  {phase:"Exterior",     col:"#f87171", items:[
    {desc:"Windows",                    labor:5000,  mat:18000},
    {desc:"Exterior Doors",             labor:2500,  mat:7000},
    {desc:"Stucco / Siding",            labor:12000, mat:8000},
    {desc:"Garage Door",                labor:500,   mat:3500},
    {desc:"Exterior Paint",             labor:6000,  mat:4000},
  ]},
  {phase:"Rough MEP",    col:"#fbbf24", items:[
    {desc:"Rough Plumbing",             labor:12000, mat:8000},
    {desc:"Rough Electrical",           labor:10000, mat:9000},
    {desc:"HVAC (equipment + duct)",    labor:8000,  mat:18000},
    {desc:"Insulation (walls + attic)", labor:4000,  mat:7000},
  ]},
  {phase:"Drywall",      col:"#4ade80", items:[
    {desc:"Drywall Hang",               labor:9000,  mat:8000},
    {desc:"Tape, Mud & Sand",           labor:7000,  mat:2000},
    {desc:"Texture",                    labor:3000,  mat:800},
  ]},
  {phase:"Interior Finish",col:"#c084fc",items:[
    {desc:"Interior Paint",             labor:8000,  mat:5000},
    {desc:"Flooring (tile + LVP)",      labor:9000,  mat:14000},
    {desc:"Cabinets",                   labor:3000,  mat:18000},
    {desc:"Countertops",                labor:1500,  mat:9000},
    {desc:"Interior Doors & Hardware",  labor:3500,  mat:6000},
    {desc:"Trim & Baseboard",           labor:4000,  mat:3000},
  ]},
  {phase:"Finish MEP",   col:"#38bdf8", items:[
    {desc:"Finish Plumbing (fixtures)", labor:5000,  mat:8000},
    {desc:"Finish Electrical (fixtures+panel)",labor:5000,mat:7000},
    {desc:"HVAC Trim-Out",              labor:1500,  mat:2000},
  ]},
  {phase:"Specialty",    col:"#e879f9", items:[
    {desc:"Pool / Spa",                 labor:12000, mat:38000},
    {desc:"Outdoor Kitchen",            labor:3000,  mat:8000},
    {desc:"Fireplace",                  labor:1500,  mat:4000},
    {desc:"Smart Home / Security",      labor:2000,  mat:5000},
  ]},
];

function NewConstructionCalc(){
  const [sqft,setSqft]=useState(2800);
  const [arv,setArv]=useState(650000);
  const [landCost,setLandCost]=useState(120000);
  const [softCosts,setSoftCosts]=useState({arch:12000,eng:6000,survey:3500,permits:18000,impact:8000,finance:15000,misc:5000});
  const [overhead,setOverhead]=useState(14);
  const [margin,setMargin]=useState(22);
  const [contingency,setContingency]=useState(8);
  const [phases,setPhases]=useState(()=>CON_PHASES.map(ph=>({...ph,items:ph.items.map(it=>({...it}))})));
  const [openPhases,setOpenPhases]=useState({"Site Work":true,"Foundation":true});
  const [activeView,setActiveView]=useState("summary");

  const updateItem=(pi,ii,field,val)=>setPhases(p=>p.map((ph,px)=>px!==pi?ph:{...ph,items:ph.items.map((it,ix)=>ix!==ii?it:{...it,[field]:parseFloat(val)||0})}));
  const togglePhase=name=>setOpenPhases(p=>({...p,[name]:!p[name]}));
  const usc=(k,v)=>setSoftCosts(p=>({...p,[k]:parseFloat(v)||0}));

  const r=useMemo(()=>{
    const phaseData=phases.map(ph=>{
      const tl=ph.items.reduce((s,it)=>s+it.labor,0);
      const tm=ph.items.reduce((s,it)=>s+it.mat,0);
      return {...ph,totalLabor:tl,totalMat:tm,total:tl+tm};
    });
    const directCost=phaseData.reduce((s,ph)=>s+ph.total,0);
    const softTotal=Object.values(softCosts).reduce((s,x)=>s+x,0);
    const contAmt=(directCost+softTotal)*contingency/100;
    const subTotal=directCost+softTotal+contAmt;
    const ovhdAmt=subTotal*overhead/100;
    const beforeMargin=subTotal+ovhdAmt;
    const marginAmt=beforeMargin*margin/100;
    const hardCost=beforeMargin+marginAmt;
    const totalAllIn=hardCost+landCost;
    const costPerSf=sqft>0?hardCost/sqft:0;
    const totalPerSf=sqft>0?totalAllIn/sqft:0;
    const arvSpread=arv-totalAllIn;
    const profitOnCost=totalAllIn>0?(arvSpread/totalAllIn)*100:0;

    const pieData=phaseData.filter(ph=>ph.total>0).map(ph=>({name:ph.phase,value:ph.total,fill:ph.col}));
    const barData=phaseData.map(ph=>({name:ph.phase,labor:ph.totalLabor,material:ph.totalMat,total:ph.total}));

    return {phaseData,directCost,softTotal,contAmt,subTotal,ovhdAmt,marginAmt,hardCost,totalAllIn,costPerSf,totalPerSf,arvSpread,profitOnCost,pieData,barData};
  },[phases,softCosts,overhead,margin,contingency,sqft,landCost,arv]);

  return(
    <div className="calc-body">
      {/* Top params */}
      <div className="g3" style={{marginBottom:4}}>
        <div className="f">
          <label className="fl">Square Footage</label>
          <div className="fw"><input type="number" value={sqft} onChange={e=>setSqft(parseFloat(e.target.value)||0)} className="fi" style={{paddingRight:32}}/><span className="fa far">SF</span></div>
        </div>
        <div className="f">
          <label className="fl">Land / Lot Cost</label>
          <div className="fw"><span className="fa">$</span><input type="number" value={landCost} onChange={e=>setLandCost(parseFloat(e.target.value)||0)} className="fi" style={{paddingLeft:28}}/></div>
        </div>
        <div className="f">
          <label className="fl">Target ARV / Sale Price</label>
          <div className="fw"><span className="fa">$</span><input type="number" value={arv} onChange={e=>setArv(parseFloat(e.target.value)||0)} className="fi" style={{paddingLeft:28}}/></div>
        </div>
        <div className="f">
          <label className="fl">Architect Plans</label>
          <div className="fw"><span className="fa">$</span><input type="number" value={softCosts.arch} onChange={e=>usc("arch",e.target.value)} className="fi" style={{paddingLeft:28}}/></div>
        </div>
        <div className="f">
          <label className="fl">Engineer Plans</label>
          <div className="fw"><span className="fa">$</span><input type="number" value={softCosts.eng} onChange={e=>usc("eng",e.target.value)} className="fi" style={{paddingLeft:28}}/></div>
        </div>
        <div className="f">
          <label className="fl">City Building Permit</label>
          <div className="fw"><span className="fa">$</span><input type="number" value={softCosts.permits} onChange={e=>usc("permits",e.target.value)} className="fi" style={{paddingLeft:28}}/></div>
        </div>
        <div className="f">
          <label className="fl">Contingency</label>
          <div className="fw"><input type="number" value={contingency} onChange={e=>setContingency(parseFloat(e.target.value)||0)} className="fi" step={0.5} style={{paddingRight:28}}/><span className="fa far">%</span></div>
        </div>
        <div className="f">
          <label className="fl">Overhead (G&A)</label>
          <div className="fw"><input type="number" value={overhead} onChange={e=>setOverhead(parseFloat(e.target.value)||0)} className="fi" step={0.5} style={{paddingRight:28}}/><span className="fa far">%</span></div>
        </div>
        <div className="f">
          <label className="fl">Profit Margin</label>
          <div className="fw"><input type="number" value={margin} onChange={e=>setMargin(parseFloat(e.target.value)||0)} className="fi" step={0.5} style={{paddingRight:28}}/><span className="fa far">%</span></div>
        </div>
      </div>

      {/* Summary metrics — always visible */}
      <div className="results-block">
        <div className="rb-title">Project Summary</div>
        <div className="metric-row">
          {[
            {label:"Total Hard Cost",value:fm(r.hardCost)},
            {label:"Land + Hard Cost",value:fm(r.totalAllIn),cls:"metric-good"},
            {label:"Cost per SF",value:fm(r.costPerSf,0)+"/SF"},
            {label:"All-In per SF",value:fm(r.totalPerSf,0)+"/SF"},
            {label:"ARV Spread",value:fm(r.arvSpread),cls:r.arvSpread>0?"metric-good":"metric-warn"},
            {label:"Profit on Cost",value:fp(r.profitOnCost),cls:gd(r.profitOnCost,15)},
          ].map((m,i)=><Metric key={i} {...m}/>)}
        </div>
      </div>

      {/* View toggle */}
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {[["summary","📊 Phase Summary"],["detail","🔧 Line Items"],["soft","📄 Soft Costs"],["charts","📈 Charts"]].map(([id,label])=>(
          <button key={id} onClick={()=>setActiveView(id)} style={{padding:"7px 14px",borderRadius:6,border:`1px solid ${activeView===id?CT.gold:"#1A2535"}`,background:activeView===id?CT.gold+"22":"#0A1420",color:activeView===id?CT.gold:"#4A6278",fontFamily:"'Barlow',sans-serif",fontSize:11,fontWeight:700,cursor:"pointer",transition:"all .15s"}}>
            {label}
          </button>
        ))}
      </div>

      {/* PHASE SUMMARY */}
      {activeView==="summary"&&(
        <div>
          <div className="table-wrap">
            <table className="cost-table">
              <thead><tr><th>Phase</th><th>Labor</th><th>Materials</th><th>Phase Total</th><th>$/SF</th><th>% of Direct</th></tr></thead>
              <tbody>
                {r.phaseData.map((ph,i)=>(
                  <tr key={i}>
                    <td><span style={{display:"inline-block",width:10,height:10,borderRadius:2,background:ph.col,marginRight:8,verticalAlign:"middle"}}/>
                      <span style={{color:"#C8C0A8",fontWeight:600}}>{ph.phase}</span></td>
                    <td className="td-total" style={{fontSize:12,color:"#6A8298"}}>{fm(ph.totalLabor)}</td>
                    <td className="td-total" style={{fontSize:12,color:"#6A8298"}}>{fm(ph.totalMat)}</td>
                    <td className="td-total">{fm(ph.total)}</td>
                    <td style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"#6A8298",padding:"4px 8px"}}>{sqft>0?fm(ph.total/sqft,0)+"/SF":"—"}</td>
                    <td style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"#6A8298",padding:"4px 8px"}}>{r.directCost>0?fp(ph.total/r.directCost*100):"—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td style={{padding:"8px",fontWeight:700,fontSize:11,color:"#E8C97A",letterSpacing:1,textTransform:"uppercase"}}>TOTAL DIRECT</td>
                  <td className="td-total">{fm(r.phaseData.reduce((s,p)=>s+p.totalLabor,0))}</td>
                  <td className="td-total">{fm(r.phaseData.reduce((s,p)=>s+p.totalMat,0))}</td>
                  <td className="td-total" style={{fontSize:14}}>{fm(r.directCost)}</td>
                  <td className="td-total" style={{fontSize:12}}>{fm(r.directCost/sqft,0)+"/SF"}</td>
                  <td/>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="table-wrap" style={{marginTop:12}}>
            <table className="cost-table">
              <tbody>
                {[
                  ["Direct Construction Costs",fm(r.directCost)],
                  ["Soft Costs",fm(r.softTotal)],
                  [`Contingency (${contingency}%)`,fm(r.contAmt)],
                  [`Overhead / G&A (${overhead}%)`,fm(r.ovhdAmt)],
                  [`Profit Margin (${margin}%)`,fm(r.marginAmt)],
                  ["HARD COST TOTAL",fm(r.hardCost)],
                  ["+ Land",fm(landCost)],
                  ["ALL-IN TOTAL",fm(r.totalAllIn)],
                ].map(([label,val],i)=>(
                  <tr key={i} style={{background:i>=5?"#0C1E14":undefined}}>
                    <td style={{padding:"7px 10px",fontSize:12,color:i>=5?"#E8C97A":"#6A8298",fontWeight:i>=5?700:400}}>{label}</td>
                    <td className="td-total" style={{color:i>=5?"#E8C97A":"#C8C0A8"}}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LINE ITEMS */}
      {activeView==="detail"&&(
        <div>
          {phases.map((ph,pi)=>(
            <div key={pi} style={{background:"#0A1420",border:"1px solid #161F2B",borderRadius:7,marginBottom:8,overflow:"hidden"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",background:"#0C1828"}} onClick={()=>togglePhase(ph.phase)}>
                <span style={{width:10,height:10,borderRadius:2,background:ph.col,flexShrink:0,display:"inline-block"}}/>
                <span style={{fontWeight:700,color:"#C8C0A8",fontSize:13,flex:1}}>{ph.phase}</span>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:CT.gold}}>{fm(r.phaseData[pi]?.total||0)}</span>
                <span style={{color:"#3A5268",fontSize:11}}>{openPhases[ph.phase]?"▲":"▼"}</span>
              </div>
              {openPhases[ph.phase]&&(
                <table className="cost-table" style={{margin:0}}>
                  <thead><tr><th style={{paddingLeft:14}}>Description</th><th>Labor</th><th>Materials</th><th>Total</th></tr></thead>
                  <tbody>
                    {ph.items.map((it,ii)=>(
                      <tr key={ii}>
                        <td style={{paddingLeft:14}}>
                          <input value={it.desc} onChange={e=>updateItem(pi,ii,"desc",e.target.value)} className="td-input" style={{width:"100%"}}/>
                        </td>
                        <td><input type="number" value={it.labor} onChange={e=>updateItem(pi,ii,"labor",e.target.value)} className="td-input td-num" style={{width:100}}/></td>
                        <td><input type="number" value={it.mat}   onChange={e=>updateItem(pi,ii,"mat",e.target.value)}   className="td-input td-num" style={{width:100}}/></td>
                        <td className="td-total">{fm(it.labor+it.mat)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}

      {/* SOFT COSTS */}
      {activeView==="soft"&&(
        <div>
          <div style={{background:"#0A1420",border:"1px solid #161F2B",borderRadius:7,padding:"16px"}}>
            <div style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",color:CT.text,marginBottom:14}}>Additional Soft Costs & Fees</div>
            <div style={{fontSize:10,color:"#3A5268",marginBottom:12}}>Architect Plans, Engineer Plans, and City Permit are in the top fields above.</div>
            <div className="g2">
              <F label="Survey & Site Plan" k="survey" v={softCosts.survey} u={usc} pre="$"/>
              <F label="Impact Fees" k="impact" v={softCosts.impact} u={usc} pre="$"/>
              <F label="Construction Financing" k="finance" v={softCosts.finance} u={usc} pre="$"/>
              <F label="Miscellaneous" k="misc" v={softCosts.misc} u={usc} pre="$"/>
            </div>
          </div>
          <div className="results-block" style={{marginTop:12}}>
            <MRow items={[{label:"Total Soft Costs",value:fm(r.softTotal)},{label:"Soft Cost / SF",value:fm(r.softTotal/sqft,0)+"/SF"},{label:"% of Hard Cost",value:fp(r.softTotal/r.hardCost*100)}]}/>
          </div>
        </div>
      )}

      {/* CHARTS */}
      {activeView==="charts"&&(
        <>
          <ChartBox title="Cost by Phase — Pie Breakdown" height={240}>
            <PieChart>
              <Pie data={r.pieData} cx="50%" cy="50%" outerRadius={95} innerRadius={40} dataKey="value"
                label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={{stroke:CT.grid}} fontSize={9}>
                {r.pieData.map((e,i)=><Cell key={i} fill={e.fill}/>)}
              </Pie>
              <Tooltip formatter={v=>fm(v)} contentStyle={TIP_STYLE}/>
            </PieChart>
          </ChartBox>
          <ChartBox title="Labor vs Materials by Phase" height={260}>
            <BarChart data={r.barData} layout="vertical" margin={{left:90,right:30}}>
              <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} horizontal={false}/>
              <XAxis type="number" tickFormatter={fmK} tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="name" tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false} width={90}/>
              <Tooltip formatter={v=>fm(v)} contentStyle={TIP_STYLE}/>
              <Legend wrapperStyle={{fontSize:10,color:CT.text}}/>
              <Bar dataKey="labor"    fill={CT.blue}   name="Labor"     radius={[0,3,3,0]}/>
              <Bar dataKey="material" fill={CT.orange} name="Materials" radius={[0,3,3,0]}/>
            </BarChart>
          </ChartBox>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SERVICE CALL CALCULATOR
   Michelle's model: 10% overhead off gross + taxes off NET → split after-tax net
══════════════════════════════════════════════════════════════════════════ */
function ServiceCallCalc(){
  const [v,s]=useState({
    invoice:850,
    materials:180,
    overheadPct:10,
    taxRate:30,
    subContractor:0,
    techSharePct:10,
  });
  const u=(k,val)=>s(p=>({...p,[k]:parseFloat(val)||0}));

  const [crew,setCrew]=useState([
    {label:"Lead Tech",      hrs:2, rate:85,  flat:false},
    {label:"Tech 2",         hrs:0, rate:65,  flat:false},
    {label:"Helper",         hrs:0, rate:45,  flat:false},
  ]);
  const uc=(i,f,val)=>setCrew(p=>p.map((c,x)=>x===i?{...c,[f]:f==="label"?val:parseFloat(val)||0}:c));

  const r=useMemo(()=>{
    const techLabor  = crew.reduce((s,c)=>s+(c.flat?c.rate:c.hrs*c.rate), 0);
    const totalHours = crew.filter(c=>!c.flat).reduce((s,c)=>s+c.hrs, 0);
    const directCost = v.materials+techLabor+v.subContractor;
    const grossProfit= v.invoice-directCost;
    const grossMargin= v.invoice>0?(grossProfit/v.invoice)*100:0;
    const overhead   = v.invoice*v.overheadPct/100;
    const preTaxNet  = grossProfit-overhead;
    const taxes      = preTaxNet>0?preTaxNet*v.taxRate/100:0;
    const netProfit  = preTaxNet-taxes;
    const netMargin  = v.invoice>0?(netProfit/v.invoice)*100:0;
    const techShare  = Math.max(0,netProfit*v.techSharePct/100);
    const companyKeep= netProfit-techShare;
    const companyMargin=v.invoice>0?(companyKeep/v.invoice)*100:0;

    const waterfall=[
      {name:"Invoice",     value:v.invoice,       fill:"#4ade80"},
      {name:"Materials",   value:-v.materials,    fill:"#f87171"},
      {name:"Tech Labor",  value:-techLabor,       fill:"#f97316"},
      {name:"Sub Contractor",value:-v.subContractor, fill:"#a78bfa"},
      {name:"Gross Profit",value:grossProfit,      fill:grossProfit>=0?"#2dd4bf":"#ef4444"},
      {name:"Overhead 10%",value:-overhead,        fill:"#6b7280"},
      {name:"Taxes",        value:-taxes,           fill:"#a78bfa"},
      {name:"Net Profit",  value:netProfit,        fill:netProfit>=0?CT.gold:"#ef4444"},
    ];
    const pie=[
      {name:"Materials + Labor", value:v.materials+techLabor,   fill:"#fb923c"},
      {name:"Sub Contractor",     value:v.subContractor,         fill:"#a78bfa"},
      {name:"Overhead (10%)",    value:overhead,                fill:"#fef08a"},
      {name:"Taxes",             value:taxes,                   fill:"#f87171"},
      {name:"Tech Bonus",        value:techShare,               fill:"#60a5fa"},
      {name:"Company Keep",     value:Math.max(0,companyKeep), fill:"#4ade80"},
    ].filter(d=>d.value>0);

    return {techLabor,overhead,preTaxNet,taxes,directCost,grossProfit,grossMargin,netProfit,netMargin,techShare,companyKeep,companyMargin,waterfall,pie};
  },[v,crew]);

  return(
    <div className="calc-body">
      <div className="g2" style={{alignItems:"stretch"}}>
        <div>
          {/* Revenue — orange bold bigger */}
          <div style={{display:"flex",alignItems:"center",gap:10,margin:"16px 0 10px",fontSize:13,fontWeight:700,color:"#fb923c",letterSpacing:1,textTransform:"uppercase"}}>
            <div style={{flex:1,height:1,background:"#1A2535"}}/>
            Revenue
            <div style={{flex:1,height:1,background:"#1A2535"}}/>
          </div>
          <F label="Invoice / Job Total" k="invoice" v={v.invoice} u={u} pre="$" hint="What the customer pays"/>
          <F label="Materials / Parts" k="materials" v={v.materials} u={u} pre="$"/>
          <Div label="Labor Crew Breakdown"/>
          <div style={{background:"#0A1420",border:"1px solid #161F2B",borderRadius:7,padding:"10px 12px",marginBottom:11}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 64px 80px 72px",gap:6,marginBottom:6}}>
              <div className="fl" style={{marginBottom:0}}>Role</div>
              <div className="fl" style={{marginBottom:0}}>Hour</div>
              <div className="fl" style={{marginBottom:0}}>$/Hour</div>
              <div className="fl" style={{marginBottom:0}}>Total</div>
            </div>
            {crew.map((c,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 64px 80px 72px",gap:6,marginBottom:5,alignItems:"center"}}>
                <input value={c.label} onChange={e=>uc(i,"label",e.target.value)} className="td-input" placeholder={`Person ${i+1}`} style={{fontSize:12}}/>
                {c.flat ? (
                  <>
                    <div/>
                    <div/>
                    <input type="number" value={c.rate} onChange={e=>uc(i,"rate",e.target.value)} className="td-input td-num" placeholder="$0" style={{fontSize:12,color:c.rate>0?CT.gold:"#3A5268"}}/>
                  </>
                ) : (
                  <>
                    <input type="number" value={c.hrs}  onChange={e=>uc(i,"hrs",e.target.value)}  className="td-input td-num" style={{fontSize:12}}/>
                    <input type="number" value={c.rate} onChange={e=>uc(i,"rate",e.target.value)} className="td-input td-num" style={{fontSize:12}}/>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:c.hrs*c.rate>0?CT.gold:"#3A5268",paddingLeft:6,fontWeight:600}}>{fm(c.hrs*c.rate)}</div>
                  </>
                )}
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr 64px 80px 72px",gap:6,borderTop:"1px solid #1A2535",paddingTop:7,marginTop:3}}>
              <div style={{fontSize:10,fontWeight:700,color:"#6A8298",letterSpacing:1,textTransform:"uppercase",paddingTop:3}}>Total Labor</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"#6A8298",paddingTop:3}}>{fn(crew.filter(c=>!c.flat).reduce((s,c)=>s+c.hrs,0),1)} hours</div>
              <div/>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:CT.gold,fontWeight:700,paddingLeft:6}}>{fm(crew.reduce((s,c)=>s+(c.flat?c.rate:c.hrs*c.rate),0))}</div>
            </div>
          </div>
          <button onClick={()=>setCrew(p=>[...p,{label:"",hrs:0,rate:0,flat:false}])} className="add-btn" style={{marginBottom:8}}>+ Add Role</button>

          {/* Sub Contractor — own line below labor */}
          <div style={{background:"#0A1420",border:"1px solid #161F2B",borderRadius:7,padding:"9px 12px",marginBottom:11}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 72px",gap:10,alignItems:"center"}}>
              <div style={{fontSize:12,fontWeight:600,color:"#a78bfa"}}>Sub Contractor</div>
              <div className="fw" style={{marginBottom:0}}>
                <span className="fa">$</span>
                <input type="number" value={v.subContractor} onChange={e=>u("subContractor",e.target.value)} className="fi" style={{paddingLeft:28,fontSize:12,color:"#a78bfa"}}/>
              </div>
            </div>
          </div>
          <F label="Overhead % — Insurance, Gas, Admin, Workers Comp, etc." k="overheadPct" v={v.overheadPct} u={u} suf="%" step={0.5} hint={`= ${fm(r.overhead)} on this call`}/>
          <F label="Tax Rate on Net Profit" k="taxRate" v={v.taxRate} u={u} suf="%" step={0.5} hint={`30% of pre-tax net = ${fm(r.preTaxNet>0?r.preTaxNet*v.taxRate/100:0)} est.`}/>

          {/* Tech Profit Share */}
          <div style={{background:"#0A1420",border:"1px solid #161F2B",borderRadius:7,padding:"12px 14px",marginTop:4}}>
            <div style={{fontSize:9,fontWeight:700,color:CT.gold,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Tech Profit Share</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,alignItems:"end"}}>
              <div className="f" style={{marginBottom:0}}>
                <label className="fl">% of NET Profit</label>
                <div className="fw"><input type="number" value={v.techSharePct} onChange={e=>u("techSharePct",e.target.value)} className="fi" step={1} style={{paddingRight:28}}/><span className="fa fa-r">%</span></div>
              </div>
              <div style={{textAlign:"center"}}>
                <div className="fl" style={{marginBottom:6}}>= % of Gross</div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:14,fontWeight:700,color:"#60a5fa",background:"#060E18",border:"1px solid #1A2535",borderRadius:5,padding:"8px 10px",textAlign:"center"}}>
                  {r.grossProfit>0?fp(r.netProfit*v.techSharePct/100/r.grossProfit*100,1):"—"}
                </div>
              </div>
              <div style={{textAlign:"center"}}>
                <div className="fl" style={{marginBottom:6}}>Tech Gets</div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:16,fontWeight:700,color:"#4ade80",background:"#060E18",border:"1px solid #1A2535",borderRadius:5,padding:"8px 10px",textAlign:"center"}}>
                  {fm(Math.max(0,r.netProfit*v.techSharePct/100))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — full height P&L box */}
        <div style={{background:"#08121C",border:"1px solid #151E28",borderRadius:10,padding:"20px 18px",display:"flex",flexDirection:"column",gap:12}}>

          {/* Header — same style as Revenue divider */}
          <div style={{display:"flex",alignItems:"center",gap:10,paddingBottom:12,borderBottom:"1px solid #1A2535"}}>
            <div style={{flex:1,height:1,background:"#1A2535"}}/>
            <div style={{fontSize:13,fontWeight:700,color:"#4ade80",letterSpacing:1,textTransform:"uppercase"}}>Profit & Loss Sheet</div>
            <div style={{flex:1,height:1,background:"#1A2535"}}/>
          </div>

          {/* P&L lines — label matches value color */}
          <div style={{display:"flex",flexDirection:"column",gap:10,flex:1}}>
            {[
              {label:"Invoice",            value:fm(v.invoice),     col:"#C8C0A8"},
              {label:"− Materials + Labor", value:fm(v.materials+r.techLabor), col:"#fb923c"},
              {label:"− Sub Contractor",    value:fm(v.subContractor),         col:"#a78bfa"},
              {label:"= Gross Profit",     value:fm(r.grossProfit), col:r.grossProfit>0?"#4ade80":"#f87171", border:true},
              {label:"− Overhead (10%)",   value:fm(r.overhead),    col:"#fef08a"},
              {label:"− Taxes",            value:fm(r.taxes),       col:"#f87171"},
              {label:"= Net Profit",       value:fm(r.netProfit),   col:r.netProfit>0?"#4ade80":"#f87171", border2:true},
              {label:"− Tech Bonus",       value:fm(r.techShare),   col:"#60a5fa"},
              {label:"= Company Keep",     value:fm(r.companyKeep), col:r.companyKeep>0?"#4ade80":"#f87171"},
            ].map((row,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:(row.border||row.border2)?10:0,borderTop:(row.border||row.border2)?"1px solid #1A2535":"none"}}>
                <span style={{fontFamily:"'Barlow',sans-serif",fontSize:13,fontWeight:600,color:row.col}}>{row.label}</span>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,fontWeight:700,color:row.col}}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Net Profit — big bold centered at bottom */}
          <div style={{borderTop:"2px solid #1A2535",paddingTop:14,textAlign:"center",marginTop:"auto"}}>
            <div style={{fontSize:9,letterSpacing:3,textTransform:"uppercase",color:CT.text,marginBottom:6}}>Company Keep</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:28,fontWeight:700,color:r.companyKeep>=0?"#4ade80":"#f87171",lineHeight:1}}>
              {fm(r.companyKeep)}
            </div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:26,fontWeight:700,color:r.companyMargin>=20?"#4ade80":r.companyMargin>=10?"#fbbf24":"#f87171",marginTop:6,lineHeight:1}}>
              {fp(r.companyMargin)}
            </div>
            <div style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",color:CT.text,marginTop:5}}>Company Net Margin</div>
            <div style={{fontSize:11,marginTop:8,color:r.companyMargin>=20?"#4ade80":r.companyMargin>=10?"#fbbf24":"#f87171",fontWeight:600}}>
              {r.companyMargin>=20?"✅ Healthy":r.companyMargin>=10?"⚠️ Thin — watch costs":"❌ Too low — review pricing"}
            </div>
          </div>

          {/* Where Every Dollar Goes — inside right column */}
          <div style={{borderTop:"1px solid #1A2535",paddingTop:12}}>
            <div style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",color:CT.text,marginBottom:4,textAlign:"center"}}>Where Every Dollar Goes</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={r.pie} cx="50%" cy="50%" outerRadius={80} innerRadius={32} dataKey="value"
                  label={({name,value,percent})=>`${name.split(' ')[0]} ${fm(value)} (${(percent*100).toFixed(0)}%)`}
                  labelLine={{stroke:CT.grid}} fontSize={8}>
                  {r.pie.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                </Pie>
                <Tooltip formatter={(value,name)=>[`${fm(value)}  (${fp(value/v.invoice*100,0)})`, name]} contentStyle={{...TIP_STYLE,minWidth:200}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   REMODEL CALCULATOR
   Line items (labor + materials) → P&L sheet like service call
══════════════════════════════════════════════════════════════════════════ */
function RemodCalc(){
  const [contract,setContract]=useState(28000);
  const [subs,setSubs]=useState([{note:"",total:0}]);
  const [overheadPct,setOverheadPct]=useState(10);
  const [taxRate,setTaxRate]=useState(30);
  const [permitFees,setPermitFees]=useState(0);
  const [equipRental,setEquipRental]=useState(0);
  const [items,setItems]=useState([
    {desc:"Demo & Disposal",        labor:1200,  mat:400},
    {desc:"Framing & Carpentry",    labor:3500,  mat:2800},
    {desc:"Rough Plumbing",         labor:2200,  mat:1800},
    {desc:"Rough Electrical",       labor:1800,  mat:1400},
    {desc:"Drywall",                labor:2400,  mat:1600},
    {desc:"Flooring",               labor:2000,  mat:4500},
    {desc:"Paint",                  labor:2200,  mat:900},
    {desc:"Cabinets & Countertops", labor:1500,  mat:6000},
    {desc:"Tile Work",              labor:1800,  mat:2200},
    {desc:"Fixtures & Finish",      labor:1200,  mat:2800},
  ]);
  const us=(i,f,val)=>setSubs(p=>p.map((s,x)=>x===i?{...s,[f]:f==="note"?val:parseFloat(val)||0}:s));
  const addSub=()=>setSubs(p=>[...p,{note:"",total:0}]);
  const remSub=i=>setSubs(p=>p.filter((_,x)=>x!==i));
  const ui=(i,f,val)=>setItems(p=>p.map((it,x)=>x===i?{...it,[f]:f==="desc"?val:parseFloat(val)||0}:it));

  const r=useMemo(()=>{
    const totalLabor=items.reduce((s,it)=>s+it.labor,0);
    const totalMat  =items.reduce((s,it)=>s+it.mat,0);
    const subTotal=subs.reduce((s,x)=>s+x.total,0);
    const directCost=totalLabor+totalMat+subTotal+permitFees+equipRental;
    const grossProfit=contract-directCost;
    const grossMargin=contract>0?(grossProfit/contract)*100:0;
    const overhead  =contract*overheadPct/100;
    const preTaxNet =grossProfit-overhead;
    const taxes     =preTaxNet>0?preTaxNet*taxRate/100:0;
    const netProfit =preTaxNet-taxes;
    const netMargin =contract>0?(netProfit/contract)*100:0;
    const companyMargin=netProfit>0?(netProfit/contract)*100:0;
    const pie=[
      {name:"Labor",     value:totalLabor,              fill:"#fb923c"},
      {name:"Materials", value:totalMat,                fill:"#60a5fa"},
      {name:"Sub",       value:subTotal,                fill:"#a78bfa"},
      {name:"Overhead",  value:overhead,                fill:"#fef08a"},
      {name:"Taxes",     value:taxes,                   fill:"#f87171"},
      {name:"Permit Fees", value:permitFees,              fill:"#38bdf8"},
      {name:"Equip Rental",value:equipRental,             fill:"#2dd4bf"},
      {name:"Co. Keep",    value:Math.max(0,netProfit),    fill:"#4ade80"},
    ].filter(d=>d.value>0);
    return {totalLabor,totalMat,subTotal,directCost,grossProfit,grossMargin,overhead,preTaxNet,taxes,netProfit,netMargin,companyMargin,pie};
  },[items,subs,contract,overheadPct,taxRate,permitFees,equipRental]);

  const nc=r.netMargin>=20?"#4ade80":r.netMargin>=10?"#fbbf24":"#f87171";

  return(
    <div className="calc-body">
      <div className="g2" style={{alignItems:"stretch"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,margin:"16px 0 10px",fontSize:13,fontWeight:700,color:"#fb923c",letterSpacing:1,textTransform:"uppercase"}}>
            <div style={{flex:1,height:1,background:"#1A2535"}}/>Revenue<div style={{flex:1,height:1,background:"#1A2535"}}/>
          </div>
          <div className="f">
            <label className="fl">Contract / Job Price</label>
            <div className="fw"><span className="fa">$</span><input type="number" value={contract} onChange={e=>setContract(parseFloat(e.target.value)||0)} className="fi" style={{paddingLeft:28}}/></div>
          </div>

          <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:CT.text,margin:"14px 0 6px"}}>Line Items</div>
          <div style={{background:"#0A1420",border:"1px solid #161F2B",borderRadius:7,padding:"10px 12px",marginBottom:8}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 88px 88px 76px 26px",gap:6,marginBottom:6}}>
              <div className="fl" style={{marginBottom:0}}>Description</div>
              <div className="fl" style={{marginBottom:0}}>Labor $</div>
              <div className="fl" style={{marginBottom:0}}>Materials $</div>
              <div className="fl" style={{marginBottom:0}}>Total</div>
              <div/>
            </div>
            {items.map((it,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 88px 88px 76px 26px",gap:6,marginBottom:5,alignItems:"center"}}>
                <input value={it.desc} onChange={e=>ui(i,"desc",e.target.value)} className="td-input" placeholder="Description"/>
                <input type="number" value={it.labor} onChange={e=>ui(i,"labor",e.target.value)} className="td-input td-num"/>
                <input type="number" value={it.mat}   onChange={e=>ui(i,"mat",e.target.value)}   className="td-input td-num"/>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:(it.labor+it.mat)>0?CT.gold:"#3A5268",fontWeight:600,paddingLeft:4}}>{fm(it.labor+it.mat)}</div>
                <button onClick={()=>setItems(p=>p.filter((_,x)=>x!==i))} className="remove-btn">✕</button>
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr 88px 88px 76px 26px",gap:6,borderTop:"1px solid #1A2535",paddingTop:7,marginTop:3}}>
              <div style={{fontSize:10,fontWeight:700,color:"#6A8298",letterSpacing:1,textTransform:"uppercase",paddingTop:2}}>Totals</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"#fb923c",fontWeight:700,paddingLeft:4}}>{fm(r.totalLabor)}</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"#60a5fa",fontWeight:700,paddingLeft:4}}>{fm(r.totalMat)}</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:CT.gold,fontWeight:700,paddingLeft:4}}>{fm(r.totalLabor+r.totalMat)}</div>
              <div/>
            </div>
          </div>
          <button onClick={()=>setItems(p=>[...p,{desc:"",labor:0,mat:0}])} className="add-btn" style={{marginBottom:10}}>+ Add Line</button>

          {/* Multi-sub table */}
          <div style={{background:"#0A1420",border:"1px solid #161F2B",borderRadius:7,padding:"10px 12px",marginBottom:11}}>
            <div style={{fontSize:9,fontWeight:700,color:"#a78bfa",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Sub Contractors</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 100px 26px",gap:6,marginBottom:6}}>
              <div className="fl" style={{marginBottom:0}}>What it's for</div>
              <div className="fl" style={{marginBottom:0}}>Amount $</div>
              <div/>
            </div>
            {subs.map((s,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 100px 26px",gap:6,marginBottom:5,alignItems:"center"}}>
                <input value={s.note} onChange={e=>us(i,"note",e.target.value)} className="td-input" placeholder="e.g. Electrical sub"/>
                <div className="fw" style={{marginBottom:0}}><span className="fa">$</span><input type="number" value={s.total} onChange={e=>us(i,"total",e.target.value)} className="fi" style={{paddingLeft:28,fontSize:12,color:"#a78bfa"}}/></div>
                <button onClick={()=>remSub(i)} className="remove-btn">✕</button>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"1px solid #1A2535",paddingTop:7,marginTop:3}}>
              <button onClick={addSub} className="add-btn" style={{margin:0}}>+ Add Sub</button>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:"#a78bfa",fontWeight:700}}>{fm(subs.reduce((s,x)=>s+x.total,0))}</div>
            </div>
          </div>

          <div className="f"><label className="fl">Overhead % — Insurance, Gas, Admin, Workers Comp</label>
            <div className="fw"><input type="number" value={overheadPct} onChange={e=>setOverheadPct(parseFloat(e.target.value)||0)} className="fi" step={0.5} style={{paddingRight:28}}/><span className="fa fa-r">%</span></div>
            <div className="fh">{`= ${fm(contract*overheadPct/100)} on this job`}</div>
          </div>
          <div className="f"><label className="fl">Tax Rate on Net Profit</label>
            <div className="fw"><input type="number" value={taxRate} onChange={e=>setTaxRate(parseFloat(e.target.value)||0)} className="fi" step={1} style={{paddingRight:28}}/><span className="fa fa-r">%</span></div>
          </div>

          <div className="g2" style={{marginTop:4}}>
            <div className="f">
              <label className="fl">Permit Fees</label>
              <div className="fw"><span className="fa">$</span><input type="number" value={permitFees} onChange={e=>setPermitFees(parseFloat(e.target.value)||0)} className="fi" style={{paddingLeft:28}}/></div>
            </div>
            <div className="f">
              <label className="fl">Equipment Rental</label>
              <div className="fw"><span className="fa">$</span><input type="number" value={equipRental} onChange={e=>setEquipRental(parseFloat(e.target.value)||0)} className="fi" style={{paddingLeft:28}}/></div>
            </div>
          </div>
        </div>

        {/* RIGHT — P&L */}
        <div style={{background:"#08121C",border:"1px solid #151E28",borderRadius:10,padding:"20px 18px",display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10,paddingBottom:12,borderBottom:"1px solid #1A2535"}}>
            <div style={{flex:1,height:1,background:"#1A2535"}}/>
            <div style={{fontSize:13,fontWeight:700,color:"#4ade80",letterSpacing:1,textTransform:"uppercase"}}>Profit & Loss Sheet</div>
            <div style={{flex:1,height:1,background:"#1A2535"}}/>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:10,flex:1}}>
            {[
              {label:"Contract Price",   value:fm(contract),        col:"#C8C0A8"},
              {label:"− Labor",          value:fm(r.totalLabor),    col:"#fb923c"},
              {label:"− Materials",      value:fm(r.totalMat),      col:"#60a5fa"},
              {label:"− Sub Contractor", value:fm(r.subTotal||0),   col:"#a78bfa"},
              {label:"− Permit Fees",      value:fm(permitFees),      col:"#38bdf8"},
              {label:"− Equipment Rental", value:fm(equipRental),      col:"#2dd4bf"},
              {label:"= Gross Profit",   value:fm(r.grossProfit),   col:r.grossProfit>0?"#4ade80":"#f87171", border:true},
              {label:"− Overhead",       value:fm(r.overhead),      col:"#fef08a"},
              {label:"− Taxes",          value:fm(r.taxes),         col:"#f87171"},
              {label:"= Net Profit",     value:fm(r.netProfit),     col:r.netProfit>0?"#4ade80":"#f87171"},
            ].map((row,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:row.border?10:0,borderTop:row.border?"1px solid #1A2535":"none"}}>
                <span style={{fontFamily:"'Barlow',sans-serif",fontSize:13,fontWeight:600,color:row.col}}>{row.label}</span>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,fontWeight:700,color:row.col}}>{row.value}</span>
              </div>
            ))}
          </div>

          <div style={{borderTop:"2px solid #1A2535",paddingTop:14,textAlign:"center",marginTop:"auto"}}>
            <div style={{fontSize:9,letterSpacing:3,textTransform:"uppercase",color:CT.text,marginBottom:6}}>Net Profit</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:28,fontWeight:700,color:r.netProfit>=0?"#4ade80":"#f87171",lineHeight:1}}>{fm(r.netProfit)}</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:26,fontWeight:700,color:nc,marginTop:6,lineHeight:1}}>{fp(r.netMargin)}</div>
            <div style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",color:CT.text,marginTop:5}}>Net Profit Margin</div>
            <div style={{fontSize:11,marginTop:8,color:nc,fontWeight:600}}>
              {r.netMargin>=20?"✅ Healthy":r.netMargin>=10?"⚠️ Thin — watch costs":"❌ Too low — review pricing"}
            </div>
          </div>

          <div style={{borderTop:"1px solid #1A2535",paddingTop:12}}>
            <div style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",color:CT.text,marginBottom:4,textAlign:"center"}}>Where Every Dollar Goes</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={r.pie} cx="50%" cy="50%" outerRadius={80} innerRadius={32} dataKey="value"
                  label={({name,value,percent})=>`${name} ${fm(value)} (${(percent*100).toFixed(0)}%)`}
                  labelLine={{stroke:CT.grid}} fontSize={8}>
                  {r.pie.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                </Pie>
                <Tooltip formatter={(value,name)=>[`${fm(value)} (${fp(value/contract*100,0)})`,name]} contentStyle={{...TIP_STYLE,minWidth:180}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   11. PORTFOLIO CASH FLOW
══════════════════════════════════════════════════════════════════════════ */
function PortfolioCF(){
  const [props,setProps]=useState([
    {name:"Naples Rental",rent:3200,mortgage:1850,tax:450,ins:200,mgmt:250,maint:250,vacancy:160},
    {name:"Property 2",rent:2400,mortgage:1400,tax:320,ins:150,mgmt:200,maint:200,vacancy:120},
  ]);
  const up=(i,k,val)=>setProps(p=>p.map((r,x)=>x===i?{...r,[k]:parseFloat(val)||0}:r));
  const totals=useMemo(()=>{
    const rows=props.map(p=>{const inc=p.rent-p.vacancy,exp=p.mortgage+p.tax+p.ins+p.mgmt+p.maint,cf=inc-exp;return{...p,cf};});
    const t=rows.reduce((s,p)=>({rent:s.rent+p.rent,exp:s.exp+(p.mortgage+p.tax+p.ins+p.mgmt+p.maint),cf:s.cf+p.cf}),{rent:0,exp:0,cf:0});
    const chart=rows.map(p=>({name:p.name,income:p.rent-p.vacancy,expenses:p.mortgage+p.tax+p.ins+p.mgmt+p.maint,cashflow:p.cf}));
    return {...t,chart};
  },[props]);
  return(
    <div className="calc-body">
      {props.map((p,i)=>{
        const cf=p.rent-p.vacancy-(p.mortgage+p.tax+p.ins+p.mgmt+p.maint);
        return(
          <div key={i} className="prop-card">
            <div className="prop-header">
              <input value={p.name} onChange={e=>up(i,"name",e.target.value)} className="prop-name-input"/>
              <div className="prop-cf" style={{color:cf>=0?CT.green:CT.red}}>{fm(cf)}/mo</div>
              <button onClick={()=>setProps(p=>p.filter((_,x)=>x!==i))} className="remove-btn">✕</button>
            </div>
            <div className="prop-grid">
              <F label="Gross Rent" k="rent" v={p.rent} u={(k,v)=>up(i,k,v)} pre="$" suf="/mo"/>
              <F label="Vacancy" k="vacancy" v={p.vacancy} u={(k,v)=>up(i,k,v)} pre="$" suf="/mo"/>
              <F label="Mortgage P&I" k="mortgage" v={p.mortgage} u={(k,v)=>up(i,k,v)} pre="$" suf="/mo"/>
              <F label="Property Tax" k="tax" v={p.tax} u={(k,v)=>up(i,k,v)} pre="$" suf="/mo"/>
              <F label="Insurance" k="ins" v={p.ins} u={(k,v)=>up(i,k,v)} pre="$" suf="/mo"/>
              <F label="Management" k="mgmt" v={p.mgmt} u={(k,v)=>up(i,k,v)} pre="$" suf="/mo"/>
              <F label="Maintenance" k="maint" v={p.maint} u={(k,v)=>up(i,k,v)} pre="$" suf="/mo"/>
            </div>
          </div>
        );
      })}
      <button onClick={()=>setProps(p=>[...p,{name:`Property ${p.length+1}`,rent:2000,mortgage:1200,tax:300,ins:150,mgmt:160,maint:150,vacancy:100}])} className="add-btn" style={{marginBottom:16}}>+ Add Property</button>
      <RBlock title="Portfolio Summary">
        <MRow items={[
          {label:"Properties",value:props.length},
          {label:"Total Gross Rent",value:fm(totals.rent)+"/mo"},
          {label:"Total Expenses",value:fm(totals.exp)+"/mo"},
          {label:"Portfolio Cash Flow",value:fm(totals.cf)+"/mo",cls:totals.cf>=0?"metric-good":"metric-warn"},
          {label:"Annual Cash Flow",value:fm(totals.cf*12),cls:totals.cf>=0?"metric-good":"metric-warn"},
        ]}/>
      </RBlock>
      <ChartBox title="Income vs Expenses vs Cash Flow per Property" height={220}>
        <BarChart data={totals.chart} margin={{left:10,right:10}}>
          <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} vertical={false}/>
          <XAxis dataKey="name" tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={fmK} tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <Tooltip formatter={v=>fm(v)} contentStyle={TIP_STYLE}/>
          <Legend wrapperStyle={{fontSize:10,color:CT.text}}/>
          <Bar dataKey="income" fill={CT.blue} name="Eff. Income" radius={[3,3,0,0]}/>
          <Bar dataKey="expenses" fill={CT.red} name="Expenses" radius={[3,3,0,0]}/>
          <Bar dataKey="cashflow" fill={CT.gold} name="Cash Flow" radius={[3,3,0,0]}/>
        </BarChart>
      </ChartBox>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   12. PERSONAL CASH FLOW
══════════════════════════════════════════════════════════════════════════ */
function PersonalCF(){
  const [inc,si]=useState({salary:8000,rental:2400,business:3000,dividends:500,other:0});
  const [exp,se]=useState({housing:2200,food:800,transport:600,utilities:300,insurance:400,entertainment:400,clothing:200,personal:200,savings:800,investing:800,taxes:2000});
  const ui=(k,v)=>si(p=>({...p,[k]:parseFloat(v)||0}));
  const ue=(k,v)=>se(p=>({...p,[k]:parseFloat(v)||0}));
  const tI=Object.values(inc).reduce((s,x)=>s+x,0);
  const tE=Object.values(exp).reduce((s,x)=>s+x,0);
  const net=tI-tE;
  const savingsRate=tI>0?((exp.savings+exp.investing)/tI)*100:0;
  const pieData=[
    {name:"Housing",value:exp.housing,fill:CT.blue},{name:"Food",value:exp.food,fill:CT.orange},
    {name:"Transport",value:exp.transport,fill:CT.purple},{name:"Utilities",value:exp.utilities,fill:CT.teal},
    {name:"Insurance",value:exp.insurance,fill:CT.red},{name:"Entertainment",value:exp.entertainment,fill:CT.gold},
    {name:"Saving/Invest",value:exp.savings+exp.investing,fill:CT.green},{name:"Taxes",value:exp.taxes,fill:"#6b7280"},
    {name:"Other",value:exp.clothing+exp.personal,fill:"#9ca3af"},
  ].filter(d=>d.value>0);
  return(
    <div className="calc-body">
      <G2>
        <div>
          <Div label="Monthly Income"/>
          <F label="Take-Home Salary" k="salary" v={inc.salary} u={ui} pre="$"/>
          <F label="Rental Income (net)" k="rental" v={inc.rental} u={ui} pre="$"/>
          <F label="Business Distributions" k="business" v={inc.business} u={ui} pre="$"/>
          <F label="Dividends / Interest" k="dividends" v={inc.dividends} u={ui} pre="$"/>
          <F label="Other" k="other" v={inc.other} u={ui} pre="$"/>
          <div className="subtotal-row"><span>Total Income</span><span>{fm(tI)}</span></div>
        </div>
        <div>
          <Div label="Monthly Expenses"/>
          <F label="Housing" k="housing" v={exp.housing} u={ue} pre="$"/>
          <F label="Food & Groceries" k="food" v={exp.food} u={ue} pre="$"/>
          <F label="Transportation" k="transport" v={exp.transport} u={ue} pre="$"/>
          <F label="Utilities" k="utilities" v={exp.utilities} u={ue} pre="$"/>
          <F label="Insurance" k="insurance" v={exp.insurance} u={ue} pre="$"/>
          <F label="Entertainment" k="entertainment" v={exp.entertainment} u={ue} pre="$"/>
          <F label="Clothing" k="clothing" v={exp.clothing} u={ue} pre="$"/>
          <F label="Personal" k="personal" v={exp.personal} u={ue} pre="$"/>
          <F label="Savings" k="savings" v={exp.savings} u={ue} pre="$"/>
          <F label="Investing" k="investing" v={exp.investing} u={ue} pre="$"/>
          <F label="Taxes" k="taxes" v={exp.taxes} u={ue} pre="$"/>
          <div className="subtotal-row"><span>Total Expenses</span><span>{fm(tE)}</span></div>
        </div>
      </G2>
      <RBlock><MRow items={[
        {label:"Net Cash Flow",value:fm(net)+"/mo",cls:net>=0?"metric-good":"metric-warn"},
        {label:"Annual Surplus",value:fm(net*12),cls:net>=0?"metric-good":"metric-warn"},
        {label:"Savings Rate",value:fp(savingsRate),cls:gd(savingsRate,20)},
      ]}/></RBlock>
      <ChartBox title="Expense Breakdown">
        <PieChart>
          <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} innerRadius={40} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={{stroke:CT.grid}}>
            {pieData.map((e,i)=><Cell key={i} fill={e.fill}/>)}
          </Pie>
          <Tooltip formatter={v=>fm(v)+"/mo"} contentStyle={TIP_STYLE}/>
        </PieChart>
      </ChartBox>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   13. BUSINESS CASH FLOW
══════════════════════════════════════════════════════════════════════════ */
function BusinessCF(){
  const [v,s]=useState({revenue:350000,cogs:45,overhead:80000,ownerSalary:10000,loanPmts:5000,equipPmts:3500,taxRate:25,reserveMonths:6});
  const u=(k,val)=>s(p=>({...p,[k]:parseFloat(val)||0}));
  const r=useMemo(()=>{
    const cogsAmt=v.revenue*v.cogs/100,gross=v.revenue-cogsAmt;
    const grossMargin=(gross/v.revenue)*100,ebitda=gross-v.overhead;
    const ebitdaMargin=(ebitda/v.revenue)*100;
    const annOwner=v.ownerSalary*12,annLoan=v.loanPmts*12,annEquip=v.equipPmts*12;
    const preTax=ebitda-annOwner-annLoan-annEquip;
    const taxAmt=preTax>0?preTax*v.taxRate/100:0;
    const net=preTax-taxAmt,fcf=net+annOwner;
    const reserve=(v.overhead+annOwner)/12*v.reserveMonths;
    const waterfall=[
      {name:"Revenue",value:v.revenue,fill:CT.green},
      {name:"COGS",value:-cogsAmt,fill:CT.red},
      {name:"Gross Profit",value:gross,fill:CT.blue},
      {name:"Overhead",value:-v.overhead,fill:CT.orange},
      {name:"EBITDA",value:ebitda,fill:CT.teal},
      {name:"Owner Draw",value:-annOwner,fill:CT.purple},
      {name:"Debt Pmts",value:-(annLoan+annEquip),fill:CT.red},
      {name:"Taxes",value:-taxAmt,fill:"#6b7280"},
      {name:"Net Income",value:net,fill:net>0?CT.gold:CT.red},
    ];
    return {cogsAmt,gross,grossMargin,ebitda,ebitdaMargin,preTax,taxAmt,net,fcf,reserve,waterfall};
  },[v]);
  return(
    <div className="calc-body">
      <G2>
        <div>
          <Div label="Revenue & Direct Costs"/>
          <F label="Annual Revenue" k="revenue" v={v.revenue} u={u} pre="$"/>
          <F label="COGS %" k="cogs" v={v.cogs} u={u} suf="%" hint="Direct labor + materials as % of revenue"/>
          <F label="Annual Overhead (G&A)" k="overhead" v={v.overhead} u={u} pre="$"/>
        </div>
        <div>
          <Div label="Cash Outflows"/>
          <F label="Owner Salary/Draw" k="ownerSalary" v={v.ownerSalary} u={u} pre="$" suf="/mo"/>
          <F label="Loan Payments" k="loanPmts" v={v.loanPmts} u={u} pre="$" suf="/mo"/>
          <F label="Equipment Payments" k="equipPmts" v={v.equipPmts} u={u} pre="$" suf="/mo"/>
          <F label="Tax Rate" k="taxRate" v={v.taxRate} u={u} suf="%"/>
          <F label="Cash Reserve Target" k="reserveMonths" v={v.reserveMonths} u={u} suf="months"/>
        </div>
      </G2>
      <RBlock title="P&L Summary">
        <MRow items={[
          {label:"Gross Profit",value:fm(r.gross),sub:fp(r.grossMargin)+" margin",cls:gd(r.grossMargin,40)},
          {label:"EBITDA",value:fm(r.ebitda),sub:fp(r.ebitdaMargin)+" margin",cls:gd(r.ebitdaMargin,15)},
          {label:"Net Income",value:fm(r.net),cls:r.net>0?"metric-good":"metric-warn"},
          {label:"Free Cash Flow",value:fm(r.fcf),cls:r.fcf>0?"metric-good":"metric-warn"},
          {label:"Cash Reserve Needed",value:fm(r.reserve)},
        ]}/>
      </RBlock>
      <ChartBox title="Revenue Waterfall to Net Income">
        <BarChart data={r.waterfall} margin={{left:10,right:10}}>
          <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} vertical={false}/>
          <XAxis dataKey="name" tick={{fill:CT.text,fontSize:9}} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={fmK} tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <Tooltip formatter={v=>fm(v)} contentStyle={TIP_STYLE}/>
          <ReferenceLine y={0} stroke={CT.grid}/>
          <Bar dataKey="value" radius={[4,4,0,0]}>
            {r.waterfall.map((e,i)=><Cell key={i} fill={e.fill}/>)}
          </Bar>
        </BarChart>
      </ChartBox>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   14. WEALTH PROJECTOR
══════════════════════════════════════════════════════════════════════════ */
function CompoundWealth(){
  const [v,s]=useState({current:150000,monthly:3000,rate:9,years:25,inflation:3});
  const u=(k,val)=>s(p=>({...p,[k]:parseFloat(val)||0}));
  const r=useMemo(()=>{
    const mr=v.rate/100/12,n=v.years*12;
    const fv=v.current*Math.pow(1+mr,n)+(mr>0?v.monthly*((Math.pow(1+mr,n)-1)/mr):v.monthly*n);
    const contrib=v.current+v.monthly*n;
    const realMr=(v.rate-v.inflation)/100/12;
    const fvReal=v.current*Math.pow(1+realMr,n)+(realMr>0?v.monthly*((Math.pow(1+realMr,n)-1)/realMr):v.monthly*n);
    const chart=Array.from({length:v.years+1},(_,y)=>{
      if(y===0)return{year:"Now",portfolio:v.current,contributed:v.current,interest:0};
      const ny=y*12,fvy=v.current*Math.pow(1+mr,ny)+(mr>0?v.monthly*((Math.pow(1+mr,ny)-1)/mr):v.monthly*ny);
      const conty=v.current+v.monthly*ny;
      return{year:`Y${y}`,portfolio:Math.round(fvy),contributed:Math.round(conty),interest:Math.round(fvy-conty)};
    }).filter((_,i)=>i===0||i%Math.max(1,Math.floor(v.years/10))===0||i===v.years);
    const totalCagr = v.years>0 ? (Math.pow(fv/contrib,1/v.years)-1)*100 : 0;
    const totalReturn = contrib>0 ? (fv-contrib)/contrib*100 : 0;
    return {fv,contrib,interest:fv-contrib,fvReal,mult:fv/contrib,chart,totalCagr,totalReturn};
  },[v]);
  return(
    <div className="calc-body">
      <G3>
        <F label="Current Portfolio Value" k="current" v={v.current} u={u} pre="$"/>
        <F label="Monthly Contribution" k="monthly" v={v.monthly} u={u} pre="$"/>
        <F label="Annual Return Rate" k="rate" v={v.rate} u={u} suf="%" step={0.5}/>
        <F label="Years to Grow" k="years" v={v.years} u={u} suf="yrs"/>
        <F label="Inflation Rate" k="inflation" v={v.inflation} u={u} suf="%"/>
      </G3>
      <RBlock><MRow items={[
        {label:"Portfolio CAGR",value:fp(v.rate),sub:"Annual growth rate input",cls:"metric-good"},
        {label:"Effective CAGR on Capital",value:fp(r.totalCagr),sub:"On all $ you put in",cls:"metric-good"},
        {label:"Total Return",value:fp(r.totalReturn,0),sub:"(FV - contributed) / contributed",cls:"metric-good"},
        {label:"Final Value (nominal)",value:fm(r.fv),cls:"metric-good"},
        {label:"Final Value (real $)",value:fm(r.fvReal),sub:"Inflation-adjusted"},
        {label:"You Contributed",value:fm(r.contrib)},
        {label:"Interest Earned",value:fm(r.interest),cls:"metric-good"},
        {label:"Money Multiplied",value:`${fn(r.mult,1)}×`,cls:"metric-good"},
      ]}/></RBlock>
      <ChartBox title="Portfolio Growth — Contributions vs Compound Interest" height={260}>
        <AreaChart data={r.chart} margin={{left:10,right:10}}>
          <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} vertical={false}/>
          <XAxis dataKey="year" tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={fmK} tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <Tooltip formatter={v=>fm(v)} contentStyle={TIP_STYLE}/>
          <Legend wrapperStyle={{fontSize:10,color:CT.text}}/>
          <Area type="monotone" dataKey="contributed" stackId="1" stroke={CT.blue} fill={CT.blue+"33"} name="Contributed"/>
          <Area type="monotone" dataKey="interest" stackId="1" stroke={CT.gold} fill={CT.gold+"33"} name="Interest Earned"/>
        </AreaChart>
      </ChartBox>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   15. DEBT DESTROYER
══════════════════════════════════════════════════════════════════════════ */
function DebtDestroyer(){
  const [debts,setD]=useState([
    {name:"Credit Card A",balance:12000,rate:22.99,min:250},
    {name:"Credit Card B",balance:8500,rate:19.99,min:180},
    {name:"Auto Loan",balance:28000,rate:7.5,min:520},
    {name:"Personal Loan",balance:5000,rate:14,min:150},
  ]);
  const [extra,setE]=useState(300);
  const upd=(i,k,v)=>setD(p=>p.map((d,x)=>x===i?{...d,[k]:parseFloat(v)||0}:d));
  const r=useMemo(()=>{
    const tBal=debts.reduce((s,d)=>s+d.balance,0);
    const tMin=debts.reduce((s,d)=>s+d.min,0);
    const simulate=(pmt)=>{
      let rem=[...debts.map(d=>({...d}))].sort((a,b)=>b.rate-a.rate);
      let mo=0,tI=0,chart=[];
      while(rem.some(d=>d.balance>0)&&mo<600){
        let avail=pmt;
        rem.forEach(d=>{if(d.balance>0){const int=d.balance*d.rate/100/12;tI+=int;d.balance+=int;}});
        rem.filter(d=>d.balance>0).forEach(d=>{const p=Math.min(d.min,d.balance);d.balance=Math.max(0,d.balance-p);avail-=p;});
        const f=rem.find(d=>d.balance>0);
        if(f&&avail>0)f.balance=Math.max(0,f.balance-avail);
        mo++;
        if(mo%3===0||mo<=3){
          const tot=rem.reduce((s,d)=>s+d.balance,0);
          chart.push({mo,balance:Math.round(tot),interest:Math.round(tI)});
        }
      }
      return {mo,tI,chart};
    };
    const base=simulate(tMin),avl=simulate(tMin+extra);
    const saved=base.tI-avl.tI;
    // merge charts
    const maxLen=Math.max(base.chart.length,avl.chart.length);
    const merged=Array.from({length:maxLen},(_,i)=>({
      mo:base.chart[i]?.mo||avl.chart[i]?.mo,
      minBal:base.chart[i]?.balance??0,
      avlBal:avl.chart[i]?.balance??0,
    }));
    return {tBal,tMin,base,avl,saved,merged};
  },[debts,extra]);
  return(
    <div className="calc-body">
      <div className="table-wrap">
        <table className="cost-table">
          <thead><tr><th>Debt Name</th><th>Balance</th><th>APR %</th><th>Min Payment</th><th></th></tr></thead>
          <tbody>{debts.map((d,i)=>(
            <tr key={i}>
              <td><input value={d.name} onChange={e=>upd(i,"name",e.target.value)} className="td-input"/></td>
              <td><input type="number" value={d.balance} onChange={e=>upd(i,"balance",e.target.value)} className="td-input td-num"/></td>
              <td><input type="number" value={d.rate} onChange={e=>upd(i,"rate",e.target.value)} className="td-input td-num" step="0.1"/></td>
              <td><input type="number" value={d.min} onChange={e=>upd(i,"min",e.target.value)} className="td-input td-num"/></td>
              <td><button onClick={()=>setD(p=>p.filter((_,x)=>x!==i))} className="remove-btn">✕</button></td>
            </tr>
          ))}</tbody>
        </table>
        <button onClick={()=>setD(p=>[...p,{name:"New Debt",balance:5000,rate:15,min:100}])} className="add-btn">+ Add Debt</button>
      </div>
      <div className="f" style={{marginTop:16,maxWidth:280}}>
        <label className="fl">Extra Monthly Payment (above minimums)</label>
        <div className="fw"><span className="fa">$</span>
          <input type="number" value={extra} onChange={e=>setE(parseFloat(e.target.value)||0)} className="fi" style={{paddingLeft:30}}/></div>
      </div>
      <RBlock title="Avalanche Results">
        <MRow items={[
          {label:"Total Debt",value:fm(r.tBal)},
          {label:"Total Monthly Payment",value:fm(r.tMin+extra)},
          {label:"Payoff (minimums only)",value:`${Math.ceil(r.base.mo/12)} yrs`},
          {label:"Payoff (avalanche)",value:`${Math.ceil(r.avl.mo/12)} yrs`,cls:"metric-good"},
          {label:"Interest (minimums)",value:fm(r.base.tI)},
          {label:"Interest (avalanche)",value:fm(r.avl.tI)},
          {label:"Total Saved",value:fm(r.saved),cls:"metric-good"},
        ]}/>
      </RBlock>
      <ChartBox title="Debt Elimination: Minimums Only vs Avalanche Method" height={240}>
        <LineChart data={r.merged} margin={{left:10,right:10}}>
          <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} vertical={false}/>
          <XAxis dataKey="mo" tickFormatter={v=>`Mo ${v}`} tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={fmK} tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
          <Tooltip formatter={v=>fm(v)} labelFormatter={v=>`Month ${v}`} contentStyle={TIP_STYLE}/>
          <Legend wrapperStyle={{fontSize:10,color:CT.text}}/>
          <Line type="monotone" dataKey="minBal" stroke={CT.red} strokeWidth={2} dot={false} name="Minimums Only"/>
          <Line type="monotone" dataKey="avlBal" stroke={CT.green} strokeWidth={2} dot={false} name="Avalanche Method"/>
        </LineChart>
      </ChartBox>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   16. NET WORTH
══════════════════════════════════════════════════════════════════════════ */
function NetWorth(){
  const [a,sa]=useState({cash:80000,hysa:30000,invest:220000,retirement:180000,bitcoin:120000,re:850000,business:200000,vehicles:45000,other:25000});
  const [d,sd]=useState({mortgage:480000,heloc:0,auto:22000,bizLoan:45000,credit:8000,student:0,other:0});
  const ua=(k,v)=>sa(p=>({...p,[k]:parseFloat(v)||0}));
  const ud=(k,v)=>sd(p=>({...p,[k]:parseFloat(v)||0}));
  const ta=Object.values(a).reduce((s,x)=>s+x,0);
  const td=Object.values(d).reduce((s,x)=>s+x,0);
  const nw=ta-td;
  const assetChart=[
    {name:"Cash",value:a.cash+a.hysa,fill:CT.green},
    {name:"Investments",value:a.invest+a.retirement,fill:CT.blue},
    {name:"Bitcoin",value:a.bitcoin,fill:CT.orange},
    {name:"Real Estate",value:a.re,fill:CT.gold},
    {name:"Business",value:a.business,fill:CT.teal},
    {name:"Other",value:a.vehicles+a.other,fill:CT.purple},
  ].filter(d=>d.value>0);
  const debtChart=[
    {name:"Mortgage",value:d.mortgage,fill:CT.red},
    {name:"HELOC",value:d.heloc,fill:"#f97316"},
    {name:"Auto",value:d.auto,fill:CT.orange},
    {name:"Biz Loan",value:d.bizLoan,fill:CT.purple},
    {name:"Credit Cards",value:d.credit,fill:"#ef4444"},
    {name:"Other",value:d.student+d.other,fill:"#6b7280"},
  ].filter(d=>d.value>0);
  return(
    <div className="calc-body">
      <G2>
        <div>
          <Div label="Assets"/>
          <F label="Cash (Checking)" k="cash" v={a.cash} u={ua} pre="$"/>
          <F label="High-Yield Savings (HYSA)" k="hysa" v={a.hysa} u={ua} pre="$"/>
          <F label="Brokerage / Index Funds" k="invest" v={a.invest} u={ua} pre="$"/>
          <F label="Retirement (401k / IRA)" k="retirement" v={a.retirement} u={ua} pre="$"/>
          <F label="Bitcoin / Crypto" k="bitcoin" v={a.bitcoin} u={ua} pre="$"/>
          <F label="Real Estate (market value)" k="re" v={a.re} u={ua} pre="$"/>
          <F label="Business Value" k="business" v={a.business} u={ua} pre="$"/>
          <F label="Vehicles" k="vehicles" v={a.vehicles} u={ua} pre="$"/>
          <F label="Other Assets" k="other" v={a.other} u={ua} pre="$"/>
        </div>
        <div>
          <Div label="Liabilities"/>
          <F label="Mortgage Balance" k="mortgage" v={d.mortgage} u={ud} pre="$"/>
          <F label="HELOC Balance" k="heloc" v={d.heloc} u={ud} pre="$"/>
          <F label="Auto Loans" k="auto" v={d.auto} u={ud} pre="$"/>
          <F label="Business Loans / EIDL" k="bizLoan" v={d.bizLoan} u={ud} pre="$"/>
          <F label="Credit Cards" k="credit" v={d.credit} u={ud} pre="$"/>
          <F label="Student Loans" k="student" v={d.student} u={ud} pre="$"/>
          <F label="Other Debts" k="other" v={d.other} u={ud} pre="$"/>
        </div>
      </G2>
      <RBlock><MRow items={[
        {label:"Total Assets",value:fm(ta)},
        {label:"Total Liabilities",value:fm(td)},
        {label:"Net Worth",value:fm(nw),cls:nw>0?"metric-good":"metric-warn"},
        {label:"Liquid",value:fm(a.cash+a.hysa),sub:"Cash + HYSA"},
        {label:"Invested",value:fm(a.invest+a.retirement+a.bitcoin),sub:"Markets + BTC"},
        {label:"Hard Assets",value:fm(a.re+a.business),sub:"RE + Business"},
        {label:"Debt-to-Asset",value:fp(td/ta*100),sub:"Target <40%",cls:td/ta<.4?"metric-good":"metric-warn"},
      ]}/></RBlock>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <ChartBox title="Assets Breakdown">
          <PieChart>
            <Pie data={assetChart} cx="50%" cy="50%" outerRadius={75} innerRadius={30} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={{stroke:CT.grid}} fontSize={9}>
              {assetChart.map((e,i)=><Cell key={i} fill={e.fill}/>)}
            </Pie>
            <Tooltip formatter={v=>fm(v)} contentStyle={TIP_STYLE}/>
          </PieChart>
        </ChartBox>
        <ChartBox title="Liabilities Breakdown">
          <PieChart>
            <Pie data={debtChart} cx="50%" cy="50%" outerRadius={75} innerRadius={30} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={{stroke:CT.grid}} fontSize={9}>
              {debtChart.map((e,i)=><Cell key={i} fill={e.fill}/>)}
            </Pie>
            <Tooltip formatter={v=>fm(v)} contentStyle={TIP_STYLE}/>
          </PieChart>
        </ChartBox>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   NAV + CSS
══════════════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════════════
   RETIREMENT MODEL — Multi-Asset CAGR Scenario Calculator
══════════════════════════════════════════════════════════════════════════ */
const SC_PRESETS={
  bear:{label:"🐻 Bear",sc:5,bt:8,re:2,bz:2,col:"#f87171"},
  base:{label:"📊 Base",sc:8,bt:25,re:3.5,bz:5,col:"#E8C97A"},
  bull:{label:"🚀 Bull",sc:12,bt:60,re:6,bz:10,col:"#4ade80"},
};
const TCOLS=["#60a5fa","#4ade80","#c084fc","#fb923c","#2dd4bf","#f87171","#fbbf24","#a78bfa","#34d399","#f472b6","#38bdf8","#e879f9"];

function RetirementModel(){
  const [age,setAge]=useState(42);
  const [exp,setExp]=useState(10000);
  const [wr,setWr]=useState(4);
  const [preset,setPreset]=useState("base");

  // Per-ticker stock holdings
  const [tickers,setTickers]=useState([
    {sym:"VTI",   shares:120,  price:265,  cagr:9,  monthly:500},
    {sym:"TSLA",  shares:85,   price:175,  cagr:15, monthly:200},
    {sym:"MSTR",  shares:40,   price:380,  cagr:30, monthly:100},
    {sym:"VOO",   shares:60,   price:520,  cagr:9,  monthly:300},
    {sym:"NVDA",  shares:25,   price:870,  cagr:20, monthly:0},
  ]);
  const updTicker=(i,f,v)=>setTickers(p=>p.map((t,x)=>x===i?{...t,[f]:f==="sym"?v:parseFloat(v)||0}:t));
  const addTicker=()=>setTickers(p=>[...p,{sym:"",shares:0,price:0,cagr:8,monthly:0}]);
  const remTicker=(i)=>setTickers(p=>p.filter((_,x)=>x!==i));

  // Other assets (non-stock)
  const [other,setOther]=useState({
    cash:{label:"Cash & HYSA", val:80000,  contrib:0,    cagr:4.5, cf:0,    col:"#4ade80"},
    re:  {label:"Real Estate", val:370000, contrib:0,    cagr:3.5, cf:2400, col:"#E8C97A"},
    btc: {label:"Bitcoin",     val:300000, contrib:1000, cagr:25,  cf:0,    col:"#fb923c"},
    biz: {label:"Business",    val:200000, contrib:0,    cagr:5,   cf:4000, col:"#2dd4bf"},
  });
  const uo=(k,f,v)=>setOther(p=>({...p,[k]:{...p[k],[f]:parseFloat(v)||0}}));
  const [chartTab,setChartTab]=useState("growth");

  const run=useMemo(()=>{
    // Stock totals from ticker table
    const stockVal    = tickers.reduce((s,t)=>s+t.shares*t.price,0);
    const stockContrib= tickers.reduce((s,t)=>s+t.monthly,0)*12;
    // Weighted average CAGR across tickers (value-weighted)
    const stockCagrCustom = stockVal>0
      ? tickers.reduce((s,t)=>s+(t.shares*t.price/stockVal)*(t.cagr/100),0)
      : 0.08;

    const annExp=exp*12, target=annExp/(wr/100);
    const totalNow=stockVal+Object.values(other).reduce((s,a)=>s+a.val,0);
    const passiveMo=other.re.cf+other.biz.cf;

    const project=(stockCagr, overrides={})=>{
      const cagrs={
        cash: other.cash.cagr/100,
        stocks: stockCagr,
        re:  (overrides.re ??other.re.cagr)/100,
        btc: (overrides.bt ??other.btc.cagr)/100,
        biz: (overrides.bz ??other.biz.cagr)/100,
      };
      let v={cash:other.cash.val, stocks:stockVal, re:other.re.val, btc:other.btc.val, biz:other.biz.val};
      const contribs={cash:other.cash.contrib*12, stocks:stockContrib, re:0, btc:other.btc.contrib*12, biz:0};
      let retireAge=null;
      const rows=[];
      for(let y=0;y<=40;y++){
        const tot=Object.values(v).reduce((s,x)=>s+x,0);
        if(!retireAge&&tot>=target) retireAge=age+y;
        rows.push({y,a:age+y,cash:Math.round(v.cash),stocks:Math.round(v.stocks),re:Math.round(v.re),btc:Math.round(v.btc),biz:Math.round(v.biz),tot:Math.round(tot)});
        Object.keys(v).forEach(k=>{ v[k]=(v[k]+(contribs[k]||0))*(1+cagrs[k]); });
      }
      return {rows,retireAge};
    };

    // Always compute all 4 projections
    const custom=project(stockCagrCustom);                             // user's own CAGRs
    const bear  =project(SC_PRESETS.bear.sc/100, SC_PRESETS.bear);
    const base  =project(SC_PRESETS.base.sc/100, SC_PRESETS.base);
    const bull  =project(SC_PRESETS.bull.sc/100, SC_PRESETS.bull);

    // Active projection = whichever scenario button is selected
    const active = preset==="bear"?bear : preset==="bull"?bull : base;

    // Area chart and milestones follow the ACTIVE scenario
    const areaData=active.rows.filter(r=>r.y%2===0||r.y===1).map(r=>({age:`${r.a}`,cash:r.cash,stocks:r.stocks,re:r.re,btc:r.btc,biz:r.biz}));
    const scenData=custom.rows.map(r=>({age:`${r.a}`,bear:bear.rows[r.y]?.tot,base:base.rows[r.y]?.tot,bull:bull.rows[r.y]?.tot,custom:r.tot}));
    const milestones=[50,55,60,65,70].filter(a=>a>age).map(a=>{
      const row=active.rows.find(r=>r.a===a)||active.rows[active.rows.length-1];
      return {age:a,tot:row?.tot||0,mo:(row?.tot||0)*wr/100/12};
    });

    // Retirement year calculation
    const NOW_YEAR=new Date().getFullYear();
    const retireYr=(ra)=>ra?NOW_YEAR+(ra-age):null;

    // Ticker pie data
    const tickerPie=tickers.filter(t=>t.shares*t.price>0).map((t,i)=>({
      name:t.sym||`Pos ${i+1}`, value:Math.round(t.shares*t.price), fill:TCOLS[i%TCOLS.length]
    }));

    // ── RETIREMENT PHASE SIMULATION ─────────────────────────────────────
    // Year-by-year: open → appreciation → expenses → close → net change
    const sc=preset==="bear"?SC_PRESETS.bear:preset==="bull"?SC_PRESETS.bull:SC_PRESETS.base;
    const retireCagr=totalNow>0?(
      stockVal*(sc.sc/100)+
      other.cash.val*(other.cash.cagr/100)+
      other.re.val*(sc.re/100)+
      other.btc.val*(sc.bt/100)+
      other.biz.val*(sc.bz/100)
    )/totalNow:0.07;
    const INFL=0.03;
    const retireData=[];
    let rbal=target;
    let depletedAtYear=null;
    for(let y=0;y<=40;y++){
      if(depletedAtYear!==null){
        retireData.push({y,yr:`Yr ${y}`,open:0,close:0,appreciation:0,expenses:Math.round(annExp*Math.pow(1+INFL,y)),net:0,depleted:true});
        continue;
      }
      const open=rbal;
      const appreciation=open*retireCagr;
      const expenses=annExp*Math.pow(1+INFL,y);
      const close=Math.max(0,open+appreciation-expenses);
      const net=close-open;
      if(close<=0&&depletedAtYear===null) depletedAtYear=y;
      retireData.push({y,yr:`Yr ${y}`,open:Math.round(open),close:Math.round(close),appreciation:Math.round(appreciation),expenses:Math.round(expenses),net:Math.round(net),depleted:close<=0});
      rbal=close;
    }
    const depletedYear=depletedAtYear!==null?(NOW_YEAR+(yearsLeft||0)+depletedAtYear):null;
    const breakEvenCagr=((annExp/target)+INFL)*100;

    return {target,totalNow,passiveMo,stockVal,stockContrib,stockCagrCustom,active,custom,bear,base,bull,areaData,scenData,milestones,tickerPie,retireYr,NOW_YEAR,retireData,depletedYear,depletedAtYear,breakEvenCagr,annExp,retireCagr};
  },[tickers,other,exp,wr,age,preset]);

  const yearsLeft=run.active.retireAge?run.active.retireAge-age:null;
  const retireYear=run.active.retireAge?run.NOW_YEAR+(run.active.retireAge-age):null;
  const pct=Math.min(100,run.totalNow/run.target*100);
  const activeSC=SC_PRESETS[preset];

  return(
    <div className="calc-body">

      {/* Scenario selector */}
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {Object.entries(SC_PRESETS).map(([k,s])=>(
          <button key={k} onClick={()=>setPreset(k)} style={{flex:1,padding:"10px 0",borderRadius:7,border:`2px solid ${preset===k?s.col:"#1A2535"}`,background:preset===k?s.col+"22":"#0A1420",color:preset===k?s.col:"#4A6278",fontFamily:"'Barlow',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .2s"}}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Parameters + verdict card */}
      <div className="g2">
        <div>
          <div className="divider"><span>Retirement Parameters</span></div>
          <div className="g2">
            <div className="f">
              <label className="fl">Current Age</label>
              <div className="fw"><input type="number" value={age} onChange={e=>setAge(parseFloat(e.target.value)||0)} className="fi" style={{paddingRight:32}}/><span className="fa fa-r">yrs</span></div>
            </div>
            <div className="f">
              <label className="fl">Withdrawal Rate</label>
              <div className="fw"><input type="number" value={wr} onChange={e=>setWr(parseFloat(e.target.value)||4)} className="fi" step={0.25} style={{paddingRight:28}}/><span className="fa fa-r">%</span></div>
              <div className="fh">4% = 25× · 3% = 33× conservative</div>
            </div>
          </div>
          <div className="f">
            <label className="fl">Monthly Expenses in Retirement</label>
            <div className="fw"><span className="fa">$</span><input type="number" value={exp} onChange={e=>setExp(parseFloat(e.target.value)||0)} className="fi" style={{paddingLeft:28}}/></div>
          </div>
        </div>

        {/* Verdict card — compact, centered, half height */}
        <div style={{background:"#060E18",border:`2px solid ${yearsLeft!==null&&yearsLeft<=0?"#4ade80":activeSC.col}`,borderRadius:10,padding:"14px 16px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",gap:4,alignSelf:"start"}}>
          <div style={{fontSize:8,letterSpacing:2.5,textTransform:"uppercase",color:"#3A5268"}}>{activeSC.label} Scenario</div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:24,fontWeight:700,color:yearsLeft!==null&&yearsLeft<=0?"#4ade80":activeSC.col,lineHeight:1.2}}>
            {yearsLeft===null?"Beyond 40yr":yearsLeft<=0?"Retire Now 🎉":`Age ${run.active.retireAge}`}
          </div>
          {yearsLeft!==null&&yearsLeft>0&&(
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:18,fontWeight:600,color:activeSC.col,opacity:.85}}>
              Year {retireYear}
            </div>
          )}
          {yearsLeft!==null&&yearsLeft>0&&(
            <div style={{fontSize:10,color:"#4A6278",marginBottom:4}}>{yearsLeft} years away</div>
          )}
          <div style={{width:"100%",borderTop:"1px solid #1A2535",paddingTop:8,display:"flex",flexDirection:"column",gap:2}}>
            {[["🐻","Bear",run.bear.retireAge,"#f87171"],["📊","Base",run.base.retireAge,"#E8C97A"],["🚀","Bull",run.bull.retireAge,"#4ade80"],["✏️","Custom",run.custom.retireAge,"#c084fc"]].map(([ic,name,ra,col])=>(
              <div key={ic} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,color:col,display:"flex",justifyContent:"space-between"}}>
                <span>{ic} {name}</span>
                <span>{ra?`${ra} · ${run.NOW_YEAR+(ra-age)}`:"50+"}</span>
              </div>
            ))}
          </div>
          <div style={{width:"100%",marginTop:4}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:8.5,color:"#3A5268",marginBottom:3}}>
              <span>Funded</span><span style={{color:activeSC.col}}>{fn(pct,0)}%</span>
            </div>
            <div style={{background:"#1A2535",borderRadius:3,height:4,overflow:"hidden"}}>
              <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${activeSC.col},#4ade80)`,transition:"width .5s"}}/>
            </div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8.5,color:"#3A5268",marginTop:2}}>{fmK(run.totalNow)} / {fmK(run.target)}</div>
          </div>
        </div>
      </div>

      {/* ── STOCK HOLDINGS TABLE ── */}
      <div className="divider"><span>📈 Stock Portfolio — Per Ticker</span></div>
      <div className="table-wrap" style={{marginBottom:8}}>
        <table className="cost-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Shares Owned</th>
              <th>Price / Share ($)</th>
              <th>Market Value</th>
              <th>Expected CAGR %</th>
              <th>Monthly Add ($)</th>
              <th>% of Stock Portfolio</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tickers.map((t,i)=>{
              const val=t.shares*t.price;
              const pctOfStocks=run.stockVal>0?(val/run.stockVal*100):0;
              return(
                <tr key={i}>
                  <td>
                    <input value={t.sym} onChange={e=>updTicker(i,"sym",e.target.value)}
                      className="td-input" placeholder="TSLA" style={{textTransform:"uppercase",fontWeight:700,color:TCOLS[i%TCOLS.length],width:72}}/>
                  </td>
                  <td><input type="number" value={t.shares} onChange={e=>updTicker(i,"shares",e.target.value)} className="td-input td-num" style={{width:90}}/></td>
                  <td><input type="number" value={t.price}  onChange={e=>updTicker(i,"price",e.target.value)}  className="td-input td-num" style={{width:90}}/></td>
                  <td className="td-total">{fm(val)}</td>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <input type="number" value={t.cagr} onChange={e=>updTicker(i,"cagr",e.target.value)} className="td-input td-num" step={0.5} style={{width:72}}/>
                      <span style={{fontSize:11,color:"#3A5268"}}>%</span>
                    </div>
                  </td>
                  <td><input type="number" value={t.monthly} onChange={e=>updTicker(i,"monthly",e.target.value)} className="td-input td-num" style={{width:80}}/></td>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{flex:1,height:5,background:"#1A2535",borderRadius:3,overflow:"hidden",minWidth:50}}>
                        <div style={{width:`${pctOfStocks}%`,height:"100%",background:TCOLS[i%TCOLS.length]}}/>
                      </div>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:TCOLS[i%TCOLS.length],minWidth:34}}>{fn(pctOfStocks,1)}%</span>
                    </div>
                  </td>
                  <td><button onClick={()=>remTicker(i)} className="remove-btn">✕</button></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{padding:"8px 8px",fontSize:10,color:"#3A5268",fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Total Stock Portfolio</td>
              <td className="td-total" style={{fontSize:14}}>{fm(run.stockVal)}</td>
              <td className="td-total" style={{fontSize:12,color:"#6A8298"}}>{fp(run.stockCagrCustom*100)} wtd avg</td>
              <td className="td-total" style={{fontSize:12,color:"#4ade80"}}>{fm(run.stockContrib/12)}/mo</td>
              <td colSpan={2}/>
            </tr>
          </tfoot>
        </table>
      </div>
      <button onClick={addTicker} className="add-btn" style={{marginBottom:16}}>+ Add Ticker / Position</button>

      {/* Stock allocation pie chart */}
      {run.tickerPie.length>0&&(
        <ChartBox title="Stock Allocation by Ticker" height={200}>
          <PieChart>
            <Pie data={run.tickerPie} cx="50%" cy="50%" outerRadius={80} innerRadius={35} dataKey="value"
              label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={{stroke:CT.grid}} fontSize={10}>
              {run.tickerPie.map((e,i)=><Cell key={i} fill={e.fill}/>)}
            </Pie>
            <Tooltip formatter={v=>fm(v)} contentStyle={TIP_STYLE}/>
          </PieChart>
        </ChartBox>
      )}

      {/* ── OTHER ASSETS ── */}
      <div className="divider"><span>Other Assets</span></div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
        {Object.entries(other).map(([k,a])=>(
          <div key={k} style={{background:"#0A1420",border:"1px solid #161F2B",borderRadius:7,padding:"12px 14px"}}>
            <div style={{fontSize:9,fontWeight:700,color:a.col,letterSpacing:1.8,textTransform:"uppercase",marginBottom:10}}>{a.label}</div>
            <div className="g3">
              <div className="f" style={{marginBottom:0}}>
                <label className="fl">Current Value</label>
                <div className="fw"><span className="fa">$</span><input type="number" value={a.val} onChange={e=>uo(k,"val",e.target.value)} className="fi" style={{paddingLeft:28}}/></div>
              </div>
              <div className="f" style={{marginBottom:0}}>
                <label className="fl">{(k==="re"||k==="biz")?"Monthly Cash Flow":"Monthly Add"}</label>
                <div className="fw"><span className="fa">$</span><input type="number" value={k==="re"||k==="biz"?a.cf:a.contrib} onChange={e=>uo(k,k==="re"||k==="biz"?"cf":"contrib",e.target.value)} className="fi" style={{paddingLeft:28}}/></div>
              </div>
              <div className="f" style={{marginBottom:0}}>
                <label className="fl">Annual CAGR %</label>
                <div className="fw"><input type="number" value={a.cagr} onChange={e=>uo(k,"cagr",e.target.value)} className="fi" step={0.5} style={{paddingRight:28}}/><span className="fa fa-r">%</span></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary metrics */}
      <div className="results-block">
        <div className="rb-title">Retirement Analysis</div>
        <div className="metric-row">
          {[
            {label:"Total Portfolio",value:fmK(run.totalNow)},
            {label:"Stock Holdings",value:fmK(run.stockVal),sub:`${fn(run.stockCagrCustom*100,1)}% wtd CAGR`},
            {label:"Retirement Target",value:fmK(run.target),sub:`${wr}% on ${fm(exp)}/mo`,cls:"metric-good"},
            {label:"Gap Remaining",value:fmK(Math.max(0,run.target-run.totalNow)),cls:run.totalNow>=run.target?"metric-good":"metric-warn"},
            {label:"Passive CF Now",value:fm(run.passiveMo)+"/mo",sub:"RE + Business"},
            {label:"Safe Withdraw at Target",value:fm(run.target*wr/100/12)+"/mo",cls:"metric-good"},
          ].map((m,i)=><Metric key={i} {...m}/>)}
        </div>
      </div>

      {/* Milestones */}
      <div className="results-block">
        <div className="rb-title">Portfolio Milestones</div>
        <div className="metric-row">
          {run.milestones.map((m,i)=>(
            <Metric key={i} label={`Age ${m.age}`} value={fmK(m.tot)} sub={`${fm(m.mo)}/mo withdraw`} cls={m.tot>=run.target?"metric-good":""}/>
          ))}
        </div>
      </div>

      {/* ── SINGLE RETIREMENT CHART with 4 view options ── */}
      <div style={{background:"#08121C",border:"1px solid #151E28",borderRadius:8,marginTop:4}}>

        {/* View selector */}
        <div style={{display:"flex",borderBottom:"1px solid #151E28"}}>
          {[
            {id:"total",    label:"Total Portfolio"},
            {id:"openclose",label:"Begin vs Close"},
            {id:"appexp",   label:"Appreciation vs Expenses"},
            {id:"net",      label:"Net Change"},
          ].map(t=>(
            <button key={t.id} onClick={()=>setChartTab(t.id)} style={{
              flex:1,padding:"10px 8px",background:"none",border:"none",
              borderBottom:`3px solid ${chartTab===t.id?CT.gold:"transparent"}`,
              fontFamily:"'Barlow',sans-serif",fontSize:10.5,fontWeight:700,
              color:chartTab===t.id?CT.gold:"#3A5268",
              cursor:"pointer",transition:"all .15s",letterSpacing:.3,
            }}>{t.label}</button>
          ))}
        </div>

        {/* Depletion status — always visible */}
        <div style={{padding:"10px 16px 0",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:700,
            color:run.depletedAtYear===null?"#4ade80":"#f87171"}}>
            {run.depletedAtYear===null
              ?"✅ Never depletes — portfolio survives 40 years"
              :`❌ Depletes Yr ${run.depletedAtYear} · Calendar year ${run.depletedYear}`}
          </div>
          <div style={{fontSize:10,color:"#3A5268",marginLeft:"auto"}}>
            {SC_PRESETS[preset].label} · Blended CAGR: {fp(run.retireCagr*100)} · Break-even: {fp(run.breakEvenCagr)}
          </div>
        </div>

        <div style={{padding:"8px 4px 12px"}}>

          {/* VIEW 1 — Total Portfolio balance over retirement */}
          {chartTab==="total"&&(
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={run.retireData} margin={{left:10,right:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} vertical={false}/>
                <XAxis dataKey="yr" tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={fmK} tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip formatter={v=>fm(v)} labelFormatter={l=>`${l} into retirement`} contentStyle={TIP_STYLE}/>
                <ReferenceLine y={0} stroke="#ef4444" strokeWidth={1} strokeDasharray="4 4" label={{value:"Depleted",fill:"#ef4444",fontSize:9,position:"insideBottomLeft"}}/>
                <Line type="monotone" dataKey="close" stroke={CT.gold} strokeWidth={2.5} dot={false} name="Portfolio Balance"/>
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* VIEW 2 — Beginning vs Closing each year */}
          {chartTab==="openclose"&&(
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={run.retireData.filter((_,i)=>i%2===0)} margin={{left:10,right:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} vertical={false}/>
                <XAxis dataKey="yr" tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={fmK} tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip formatter={v=>fm(v)} labelFormatter={l=>`${l} into retirement`} contentStyle={TIP_STYLE}/>
                <Legend wrapperStyle={{fontSize:10,color:CT.text}}/>
                <ReferenceLine y={0} stroke={CT.grid}/>
                <Bar dataKey="open"  fill="#60a5fa" name="Beginning Balance" radius={[3,3,0,0]}/>
                <Bar dataKey="close" fill={CT.gold}  name="Closing Balance"   radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* VIEW 3 — Appreciation vs Expenses each year */}
          {chartTab==="appexp"&&(
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={run.retireData.filter((_,i)=>i%2===0)} margin={{left:10,right:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} vertical={false}/>
                <XAxis dataKey="yr" tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={fmK} tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip formatter={v=>fm(v)} labelFormatter={l=>`${l} into retirement`} contentStyle={TIP_STYLE}/>
                <Legend wrapperStyle={{fontSize:10,color:CT.text}}/>
                <ReferenceLine y={0} stroke={CT.grid}/>
                <Bar dataKey="appreciation" fill="#4ade80" name="Portfolio Growth"  radius={[3,3,0,0]}/>
                <Bar dataKey="expenses"     fill="#f87171" name="Withdrawals/Expenses" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* VIEW 4 — Net Change (Close - Open) each year */}
          {chartTab==="net"&&(
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={run.retireData.filter((_,i)=>i%2===0)} margin={{left:10,right:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} vertical={false}/>
                <XAxis dataKey="yr" tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={fmK} tick={{fill:CT.text,fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip formatter={v=>fm(v)} labelFormatter={l=>`${l} into retirement`} contentStyle={TIP_STYLE}/>
                <ReferenceLine y={0} stroke="#6A8298" strokeWidth={1.5}/>
                <Bar dataKey="net" name="Net Change (Close − Open)" radius={[3,3,0,0]}>
                  {run.retireData.filter((_,i)=>i%2===0).map((d,i)=>(
                    <Cell key={i} fill={d.net>=0?"#4ade80":"#f87171"}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

        </div>
      </div>

    </div>
  );
}

const TABS=[
  {id:"con",label:"Construction",icon:"🏗️",calcs:[
    {id:"service",label:"Service Call & C.O.",icon:"🔧",comp:ServiceCallCalc},
    {id:"remod",label:"Remodel",icon:"🔨",comp:RemodCalc},
    {id:"newcon",label:"New Construction",icon:"🏠",comp:NewConstructionCalc},
    {id:"bid",label:"Job Cost & Bid",icon:"📋",comp:JobCostBid},
    {id:"markup",label:"Markup vs Margin",icon:"💹",comp:MarkupMargin},
    {id:"labor",label:"Burdened Labor Rate",icon:"👷",comp:LaborRate},
  ]},
  {id:"fin",label:"Finance",icon:"💎",calcs:[
    {id:"compound",label:"Wealth Projector",icon:"📈",comp:CompoundWealth},
    {id:"debt",label:"Debt Destroyer",icon:"💥",comp:DebtDestroyer},
    {id:"nw",label:"Net Worth",icon:"💰",comp:NetWorth},
  ]},
  {id:"retire",label:"Retirement",icon:"🌅",calcs:[
    {id:"retire",label:"Retirement Model",icon:"🌅",comp:RetirementModel},
  ]},
  {id:"cf",label:"Cash Flow",icon:"💵",calcs:[
    {id:"portfolio",label:"Portfolio Cash Flow",icon:"🏘️",comp:PortfolioCF},
    {id:"personal",label:"Personal Cash Flow",icon:"💳",comp:PersonalCF},
    {id:"business",label:"Business Cash Flow",icon:"📈",comp:BusinessCF},
  ]},
  {id:"re",label:"Real Estate",icon:"🏠",calcs:[
    {id:"deal",label:"Deal Analyzer",icon:"📊",comp:DealAnalyzer},
    {id:"brrrr",label:"BRRRR",icon:"♻️",comp:BRRRR},
    {id:"flip",label:"Fix & Flip / ARV",icon:"🔨",comp:FixFlip},
    {id:"mort",label:"Mortgage & Amort",icon:"📅",comp:MortgageAmort},
    {id:"rvb",label:"Rent vs Buy",icon:"⚖️",comp:RentVsBuy},
  ]},
];
const META={
  deal:{title:"Full Deal Analyzer",desc:"Complete rental acquisition — NOI, cap rate, cash-on-cash, DSCR, hold projection, annualized return"},
  brrrr:{title:"BRRRR Calculator",desc:"Buy · Rehab · Rent · Refinance · Repeat — capital recycled, left in deal, cash flow post-refi"},
  flip:{title:"Fix & Flip / ARV",desc:"70% rule, after repair value, true profit, ROI, annualized return, and tax impact"},
  mort:{title:"Mortgage & Amortization",desc:"Monthly payment, total interest, and what extra payments actually save — with amortization curve"},
  rvb:{title:"Rent vs. Buy True Cost",desc:"Apples-to-apples comparison over any time horizon including all opportunity costs"},
  newcon:{title:"New Construction Calculator",desc:"Full phase-by-phase cost breakdown — site work through finish — with soft costs, overhead, margin, and ARV profit analysis"},
  service:{title:"Service Call Calculator",desc:"Service company P&L per call — find gross profit, net profit, and split with the tech at the end"},
  bid:{title:"Job Cost & Bid Builder",desc:"Line-item cost buildup with overhead + margin → final bid price and cost mix"},
  markup:{title:"Markup vs. Margin",desc:"The most critical distinction in construction — they are NOT the same number"},
  labor:{title:"Burdened Labor Rate",desc:"True cost of an employee with all taxes and insurance — and what to charge clients"},
  equip:{title:"Equipment Buy vs. Rent ROI",desc:"Data-driven buy vs. rent decision with payback period and cumulative profit curve"},
  breakeven:{title:"Project Break-Even",desc:"Minimum revenue to cover fixed costs — and margin of safety on any project"},
  portfolio:{title:"Portfolio Cash Flow",desc:"Multi-property dashboard — income, expenses, and cash flow for every rental at a glance"},
  personal:{title:"Personal Monthly Cash Flow",desc:"Total income vs. expenses with savings rate and expense breakdown chart"},
  business:{title:"Business Cash Flow",desc:"Revenue through EBITDA to net income — with full waterfall chart"},
  retire:{title:"Retirement Model",desc:"Multi-asset portfolio projection — set CAGR% per asset class, see exactly when you can retire under Bear / Base / Bull scenarios"},
  compound:{title:"Wealth Projector",desc:"Compound growth with inflation-adjusted value and contribution vs. interest visual"},
  debt:{title:"Debt Destroyer (Avalanche)",desc:"Multi-debt payoff simulation — avalanche vs. minimums with interest savings"},
  nw:{title:"Net Worth Snapshot",desc:"Complete asset/liability snapshot with liquid/invested/hard asset breakdown and pie charts"},
};

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=IBM+Plex+Mono:wght@400;600&family=Barlow:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#0F1923;}
.app{font-family:'Barlow',sans-serif;background:#0F1923;min-height:100vh;color:#D4C9B0;}
.hdr{background:#080F18;border-bottom:1px solid #1E2D3D;padding:16px 32px;display:flex;align-items:center;justify-content:space-between;}
.hdr-logo{font-family:'Libre Baskerville',serif;font-size:20px;font-weight:700;color:#E8C97A;}
.hdr-tag{font-size:10px;color:#3A5268;letter-spacing:2px;text-transform:uppercase;margin-top:2px;}
.hdr-right{font-family:'IBM Plex Mono',monospace;font-size:10px;color:#2A3E52;}
.top-nav{background:#080F18;border-bottom:1px solid #1A2535;display:flex;padding:0 32px;}
.top-tab{padding:13px 22px;background:none;border:none;font-family:'Barlow',sans-serif;font-size:11px;font-weight:600;color:#4A6278;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;border-bottom:2px solid transparent;transition:all .2s;white-space:nowrap;display:flex;align-items:center;gap:7px;}
.top-tab:hover{color:#E8C97A;}
.top-tab.tt-active{color:#E8C97A;border-bottom-color:#E8C97A;}
.layout{display:flex;min-height:calc(100vh - 100px);}
.sidebar{width:200px;background:#080F18;border-right:1px solid #1A2535;padding:16px 0;flex-shrink:0;}
.sc{width:100%;display:flex;align-items:center;gap:9px;padding:10px 18px;background:none;border:none;font-family:'Barlow',sans-serif;font-size:12.5px;font-weight:500;color:#4A6278;cursor:pointer;transition:all .15s;text-align:left;border-left:3px solid transparent;}
.sc:hover{color:#C8A84B;background:rgba(232,201,122,.04);}
.sc.sc-active{color:#E8C97A;background:rgba(232,201,122,.07);border-left-color:#E8C97A;}
.si{font-size:13px;flex-shrink:0;}
.main{flex:1;overflow-y:auto;padding:26px 32px 60px;}
.calc-title{font-family:'Libre Baskerville',serif;font-size:22px;color:#E8C97A;margin-bottom:3px;}
.calc-desc{font-size:12px;color:#3A5268;margin-bottom:24px;}
.calc-body{}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-bottom:18px;}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:18px;}
.f{margin-bottom:11px;}
.fl{font-size:9.5px;font-weight:600;color:#5A7898;letter-spacing:1.2px;text-transform:uppercase;display:block;margin-bottom:4px;}
.fw{position:relative;}
.fa{position:absolute;left:9px;top:50%;transform:translateY(-50%);font-size:11px;color:#3A5268;pointer-events:none;font-family:'IBM Plex Mono',monospace;}
.fa-r{left:auto;right:9px;}
.fi{width:100%;padding:8px 10px;border:1px solid #1A2535;border-radius:5px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:#C8C0A8;background:#0A1420;outline:none;transition:border .15s;}
.fi:focus{border-color:#E8C97A;background:#0D1A2A;}
.fh{font-size:9px;color:#2A4050;margin-top:3px;}
.divider{display:flex;align-items:center;gap:8px;margin:16px 0 10px;font-size:8.5px;letter-spacing:2.5px;text-transform:uppercase;color:#2A3E52;}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:#121E2A;}
.metric-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:6px;}
.metric{background:#0A1420;border:1px solid #161F2B;border-radius:5px;padding:10px 12px;flex:1;min-width:100px;}
.metric-val{font-family:'IBM Plex Mono',monospace;font-size:16px;font-weight:600;color:#B8B0A0;margin-bottom:2px;white-space:nowrap;}
.metric-label{font-size:8.5px;color:#3A5268;letter-spacing:1.2px;text-transform:uppercase;}
.metric-sub{font-size:8.5px;color:#2A3E52;margin-top:1px;}
.metric-good .metric-val{color:#4ade80;}
.metric-warn .metric-val{color:#f59e0b;}
.metric-red  .metric-val{color:#ef4444;}
.results-block{background:#08121C;border:1px solid #151E28;border-radius:7px;padding:16px;margin-bottom:14px;}
.rb-title{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#3A5268;margin-bottom:12px;font-weight:600;}
.table-wrap{overflow-x:auto;margin-bottom:6px;}
.cost-table{width:100%;border-collapse:collapse;font-size:12px;}
.cost-table th{font-size:8.5px;letter-spacing:1.2px;text-transform:uppercase;color:#3A5268;padding:7px 8px;border-bottom:1px solid #151E28;text-align:left;font-weight:600;}
.cost-table tr:not(:last-child) td{border-bottom:1px solid #0E1A24;}
.cost-table td{padding:4px 5px;vertical-align:middle;}
.td-input{background:#0A1420;border:1px solid #1A2535;border-radius:4px;color:#C8C0A8;font-family:'IBM Plex Mono',monospace;font-size:12px;padding:5px 7px;width:100%;outline:none;}
.td-input:focus{border-color:#E8C97A;}
.td-num{text-align:right;max-width:90px;}
.td-total{font-family:'IBM Plex Mono',monospace;font-size:12px;color:#E8C97A;white-space:nowrap;padding:4px 8px;}
.add-btn{background:rgba(232,201,122,.05);border:1px dashed #1E2D3D;border-radius:5px;color:#4A6278;font-family:'Barlow',sans-serif;font-size:11px;font-weight:600;padding:7px 14px;cursor:pointer;margin-top:7px;transition:all .2s;}
.add-btn:hover{border-color:#E8C97A;color:#E8C97A;}
.remove-btn{background:none;border:none;color:#2A3E52;cursor:pointer;font-size:13px;padding:3px 7px;transition:color .15s;}
.remove-btn:hover{color:#ef4444;}
.mode-tabs{display:flex;gap:6px;margin-bottom:18px;}
.mode-tab{padding:7px 16px;border-radius:50px;border:1px solid #1A2535;background:#0A1420;font-family:'Barlow',sans-serif;font-size:11px;font-weight:600;color:#4A6278;cursor:pointer;transition:all .2s;}
.mode-tab:hover{border-color:#E8C97A;color:#E8C97A;}
.mode-active{background:#E8C97A;border-color:#E8C97A;color:#080F18;}
.prop-card{background:#0A1420;border:1px solid #161F2B;border-radius:7px;padding:16px;margin-bottom:12px;}
.prop-header{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
.prop-name-input{flex:1;background:none;border:none;border-bottom:1px solid #1A2535;color:#E8C97A;font-family:'Libre Baskerville',serif;font-size:14px;padding:3px 0;outline:none;}
.prop-cf{font-family:'IBM Plex Mono',monospace;font-size:16px;font-weight:600;margin-left:auto;white-space:nowrap;}
.prop-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
.subtotal-row{display:flex;justify-content:space-between;padding:9px 0;border-top:1px solid #1A2535;margin-top:3px;font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;color:#E8C97A;}
@media(max-width:900px){
  .layout{flex-direction:column;}
  .sidebar{width:100%;display:flex;overflow-x:auto;-webkit-overflow-scrolling:touch;border-right:none;border-bottom:1px solid #1A2535;padding:4px 8px;gap:2px;flex-shrink:0;}
  .sidebar::-webkit-scrollbar{display:none;}
  .sc{width:auto;flex-shrink:0;border-left:none;border-bottom:2px solid transparent;padding:8px 12px;font-size:12px;}
  .sc.sc-active{border-left:none;border-bottom-color:#E8C97A;}
  .main{padding:14px 14px 80px;}
  .g2,.g3{grid-template-columns:1fr;}
  .prop-grid{grid-template-columns:1fr 1fr;}
  .top-nav{padding:0;overflow-x:auto;-webkit-overflow-scrolling:touch;}
  .top-nav::-webkit-scrollbar{display:none;}
  .top-tab{padding:11px 14px;font-size:10px;letter-spacing:.8px;}
  .hdr{padding:12px 16px;}
  .hdr-right{display:none;}
  .calc-title{font-size:18px;}
  .metric{min-width:calc(50% - 4px);}
  .metric-val{font-size:14px;}
  .results-block{padding:12px;}
}
@media(max-width:600px){
  .hdr-logo{font-size:16px;}
  .hdr-tag{display:none;}
  .g2,.g3{grid-template-columns:1fr;gap:14px;}
  .metric{min-width:calc(50% - 4px);}
  .top-tab{padding:10px 12px;font-size:9.5px;}
  .main{padding:12px 10px 80px;}
  .fi{font-size:16px;}
  .calc-title{font-size:16px;}
  .calc-desc{font-size:11px;margin-bottom:14px;}
  .table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;}
  .cost-table{min-width:420px;}
  .metric-row{gap:6px;}
  .results-block{padding:10px;}
  .add-btn{width:100%;text-align:center;padding:10px;}
}
@media(max-width:390px){
  .metric{min-width:calc(50% - 3px);}
  .metric-val{font-size:13px;}
  .top-tab{padding:9px 10px;font-size:9px;}
  .hdr-logo{font-size:14px;}
}
`;

export default function App(){
  const [auth,setAuth]=useState(()=>localStorage.getItem("tl_auth")==="1");
  const [pw,setPw]=useState("");
  const [err,setErr]=useState(false);

  if(!auth) return(
    <>
      <style>{CSS}</style>
      <div style={{minHeight:"100vh",background:"#0F1923",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{background:"#080F18",border:"1px solid #1A2535",borderRadius:14,padding:"40px 36px",width:"100%",maxWidth:380,textAlign:"center"}}>
          <div style={{fontFamily:"'Libre Baskerville',serif",fontSize:22,fontWeight:700,color:"#E8C97A",marginBottom:6}}>TL Premier</div>
          <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#3A5268",marginBottom:32}}>Wealth Calculator Suite</div>
          <div style={{fontSize:11,color:"#3A5268",marginBottom:12,letterSpacing:1,textTransform:"uppercase"}}>Family Access</div>
          <input
            type="password"
            value={pw}
            onChange={e=>{setPw(e.target.value);setErr(false);}}
            onKeyDown={e=>{if(e.key==="Enter"){if(pw==="TLFAMILY"){localStorage.setItem("tl_auth","1");setAuth(true);}else setErr(true);}}}
            placeholder="Enter password"
            style={{width:"100%",padding:"12px 16px",border:`1px solid ${err?"#f87171":"#1A2535"}`,borderRadius:7,background:"#0A1420",color:"#C8C0A8",fontFamily:"'IBM Plex Mono',monospace",fontSize:15,outline:"none",marginBottom:10,textAlign:"center",letterSpacing:3}}
            autoFocus
          />
          {err&&<div style={{color:"#f87171",fontSize:11,marginBottom:10}}>Incorrect password</div>}
          <button
            onClick={()=>{if(pw==="TLFAMILY"){localStorage.setItem("tl_auth","1");setAuth(true);}else setErr(true);}}
            style={{width:"100%",padding:"12px",background:"#E8C97A",border:"none",borderRadius:7,fontFamily:"'Barlow',sans-serif",fontSize:13,fontWeight:700,color:"#080F18",cursor:"pointer",letterSpacing:1}}>
            Enter
          </button>
          <div style={{fontSize:9,color:"#1A2535",marginTop:20}}>TL Premier Construction Services © 2026</div>
        </div>
      </div>
    </>
  );

  const [tab,setTab]=useState("con");
  const [calc,setCalc]=useState("deal");
  const ct=TABS.find(t=>t.id===tab)||TABS[0];
  const cc=ct.calcs.find(c=>c.id===calc)||ct.calcs[0];
  const meta=META[cc.id]||{};
  const Comp=cc.comp;
  const switchTab=(id)=>{setTab(id);const t=TABS.find(t=>t.id===id);if(t)setCalc(t.calcs[0].id);};
  return(
    <>
      <style>{CSS}</style>
      <div className="app">
        <header className="hdr">
          <div>
            <div className="hdr-logo">TL Premier · Wealth Suite</div>
            <div className="hdr-tag">Construction & Real Estate Family</div>
          </div>
          <div className="hdr-right">Built for decisions</div>
        </header>
        <nav className="top-nav">
          {TABS.map(t=><button key={t.id} onClick={()=>switchTab(t.id)} className={`top-tab ${tab===t.id?"tt-active":""}`}>{t.icon} {t.label}</button>)}
        </nav>
        <div className="layout">
          {ct.calcs.length>1&&(
            <aside className="sidebar">
              {ct.calcs.map(c=><button key={c.id} onClick={()=>setCalc(c.id)} className={`sc ${calc===c.id?"sc-active":""}`}><span className="si">{c.icon}</span><span>{c.label}</span></button>)}
            </aside>
          )}
          <main className="main">
            <div className="calc-title">{meta.title||cc.label}</div>
            <div className="calc-desc">{meta.desc}</div>
            <Comp key={cc.id}/>
          </main>
        </div>
      </div>
    </>
  );
}
