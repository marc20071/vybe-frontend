"use client";
import { useEffect,useRef } from "react";
export function useInfiniteScroll(onLoad:()=>void,enabled=true){const ref=useRef<HTMLDivElement|null>(null);useEffect(()=>{const node=ref.current;if(!node||!enabled)return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))onLoad()},{rootMargin:"400px"});observer.observe(node);return()=>observer.disconnect()},[onLoad,enabled]);return ref}
