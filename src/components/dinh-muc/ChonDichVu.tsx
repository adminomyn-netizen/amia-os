"use client";
import { useRouter } from "next/navigation";
import { Chon, type LuaChon } from "@/components/ui/Chon";

export function ChonDichVu({ luaChon, giaTri }: { luaChon: LuaChon[]; giaTri: string }) {
  const router = useRouter();
  return <Chon trong="Chọn dịch vụ để xem định mức" ariaLabel="Dịch vụ" giaTri={giaTri} luaChon={luaChon} onDoi={(v) => router.push(v ? `/dinh-muc?dv=${v}` : "/dinh-muc")} />;
}
