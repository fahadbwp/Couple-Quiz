import type {ReactNode} from "react";
import styles from "./premium.module.css";
export function CrownedPal({active,children}:{active:boolean;children:ReactNode}){
 if(!active)return <>{children}</>;
 return <div className={styles.crowned}>{children}<svg className={styles.crown} viewBox="0 0 64 38" role="img" aria-label="Royal Pal Crown"><path d="M7 30 3 7 21 18 32 2 43 18 61 7 57 30Z" fill="#ffda62" stroke="#744413" strokeWidth="3"/><path d="M8 30H56V36H8Z" fill="#ffbf3d" stroke="#744413" strokeWidth="2"/><circle cx="32" cy="24" r="4" fill="#9858bf"/></svg></div>;
}
export function LegendaryCelebration({active,animate,preview=false}:{active:boolean;animate:boolean;preview?:boolean}){
 if(!active)return null;
 return <div className={styles.celebration} data-animate={animate} role="status"><span aria-hidden="true">✦ ✧ ★ ✧ ✦</span><strong>Legendary little victory!</strong><small>{preview?"Preview only — equip after earning it.":"Your legendary celebration is equipped."}</small></div>;
}
