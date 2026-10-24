import {mayShowAd,type AdPlacement} from "@/lib/platform/ads";
// No provider script, ad ID or network request. Future activation needs review.
export default function FutureAdSlot({placement}:{placement:AdPlacement}){
 if(!mayShowAd(placement,{consent:false,familyApproved:false,internal:false,phase:"idle"}))return null;
 return <aside aria-label="Advertisement" style={{minHeight:90}}>Advertisement</aside>;
}
