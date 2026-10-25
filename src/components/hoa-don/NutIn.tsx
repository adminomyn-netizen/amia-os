"use client";
import { Printer } from "lucide-react";
import { NUT_CHINH } from "@/components/ui/dinh-dang";

export function NutIn() {
  return <button type="button" className={`${NUT_CHINH} flex items-center gap-2`} onClick={() => window.print()}><Printer strokeWidth={1.6} className="h-4 w-4" />In</button>;
}
