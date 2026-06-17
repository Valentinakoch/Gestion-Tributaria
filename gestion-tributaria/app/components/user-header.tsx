"use client";

import { UserButton } from "@clerk/nextjs";

interface Props {
  userName: string;
  userRole: string;
}

export default function UserHeader({ userName, userRole }: Props) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-sm font-semibold text-slate-800">{userName}</p>
        <p className="text-xs text-slate-400 capitalize">{userRole}</p>
      </div>
      <UserButton />
    </div>
  );
}
