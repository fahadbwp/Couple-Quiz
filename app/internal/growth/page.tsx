import {notFound} from "next/navigation";
import Growth from "./Growth";
export const dynamic="force-dynamic";
export const metadata={title:"Local growth lab",robots:{index:false,follow:false}};
export default function Page(){
 if(process.env.NODE_ENV!=="development"||process.env.PLAYNUDGE_LOCAL_INSIGHTS!=="1")notFound();
 return <Growth/>;
}
