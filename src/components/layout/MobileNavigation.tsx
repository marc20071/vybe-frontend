"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Compass, PlusSquare, MessageCircle, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
export function MobileNavigation(){const path=usePathname();const {user,requireAuth}=useAuth();const items=[{href:"/",label:"Home",icon:House},{href:"/explore",label:"Explore",icon:Compass},{href:"/upload",label:"Create",icon:PlusSquare},{href:"/messages",label:"Inbox",icon:MessageCircle},{href:user?`/profile/${user.username}`:"/login",label:"You",icon:UserRound}];return <nav className="mobile-bottom" aria-label="Mobile navigation">{items.map(it=><Link key={it.label} href={it.href} onClick={e=>{if(["/upload","/messages"].includes(it.href)&&!user){e.preventDefault();requireAuth(it.href)}}} className={`mobile-nav-item ${path===it.href?"active":""}`}><it.icon size={20}/><span>{it.label}</span></Link>)}</nav>}
