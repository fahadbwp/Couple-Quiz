import {pageMetadata} from "@/lib/platform/site";
import TransferView from "./TransferView";
export const metadata=pageMetadata("Transfer your Jelloo progress","Preview and safely transfer your browser progress using a local file.","/jelloo/transfer",true);
export default function Page(){return <TransferView/>;}
