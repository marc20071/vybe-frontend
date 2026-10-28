import type { Metadata } from "next";
import Link from "next/link";
import { VideoPlayer } from "@/components/feed/VideoPlayer";
export const metadata:Metadata={title:"Watch video"};
export default async function VideoPage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <div className="page-wrap"><p className="eyebrow">VYBE VIDEO</p><h1 className="page-title">Stay for the moment.</h1><VideoPlayer videoId={id}/><p className="muted" style={{marginTop:18}}>Watching is open to everyone. <Link href="/login" style={{color:"#c4b5fd"}}>Sign in</Link> to join the conversation.</p></div>}
