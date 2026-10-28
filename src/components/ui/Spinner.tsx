import { LoaderCircle } from "lucide-react";
export function Spinner({label="Loading"}:{label?:string}){return <span role="status" aria-label={label} style={{display:"inline-flex",alignItems:"center",gap:8,color:"#c4b5fd"}}><LoaderCircle size={18} className="spin-icon"/>{label}<style jsx>{`.spin-icon{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style></span>}
