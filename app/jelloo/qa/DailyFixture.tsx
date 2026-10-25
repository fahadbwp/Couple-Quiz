"use client";
import {useState} from "react";
import {DailySession} from "../daily/DailyGame";
export default function DailyFixture(){const [day,setDay]=useState("2026-10-25");return <><h1>Isolated Daily date fixture</h1><button onClick={()=>setDay(d=>d==="2026-10-25"?"2026-10-26":"2026-10-25")}>Advance test UTC date</button><DailySession key={day} todayUtc={day}/></>;}
