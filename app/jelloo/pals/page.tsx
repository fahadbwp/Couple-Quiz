import type { Metadata } from "next";
import PowerGame from "./PowerGame";

export const metadata:Metadata={title:"Jelloo — Meet your pals",robots:{index:false,follow:false}};
export default function PalsPage() {return <PowerGame/>;}
