"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function ProfileSidebarLogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/auth" })}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "0.9rem 0.95rem",
        borderRadius: "8px",
        color: "#e05343",
        display: "flex",
        alignItems: "center",
        gap: "0.8rem",
        cursor: "pointer",
        marginTop: "0.9rem",
        borderTop: "1px solid var(--border)",
        borderLeft: "none",
        borderRight: "none",
        borderBottom: "none",
        background: "transparent",
        fontSize: "0.95rem",
      }}
    >
      <LogOut size={16} />
      Logout
    </button>
  );
}
