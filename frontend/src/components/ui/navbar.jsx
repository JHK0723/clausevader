"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./button";
import { Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export default function NavBar({ user }) {
  const pathname = usePathname();

  return (
    <nav className="bg-black h-16 text-white border-b border-red-900 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-red-600">
          ClauseVader
        </Link>

        {/* Desktop Links */}
        <div className="space-x-4 hidden md:flex">
          <Link href="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
          {user ? (
            <Link href="/">
              <Button variant="ghost">Logout</Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
          )}
        </div>

        {/* Mobile Dropdown Menu */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-red-500 p-0">
                <Menu className="w-6 h-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-black text-white border-red-900">
              <Link href="/dashboard" passHref>
                <DropdownMenuItem className="cursor-pointer hover:bg-red-900">
                  Dashboard
                </DropdownMenuItem>
              </Link>
              {user ? (
                <Link href="/" passHref>
                  <DropdownMenuItem className="cursor-pointer hover:bg-red-900">
                    Logout
                  </DropdownMenuItem>
                </Link>
              ) : (
                <Link href="/login" passHref>
                  <DropdownMenuItem className="cursor-pointer hover:bg-red-900">
                    Login
                  </DropdownMenuItem>
                </Link>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
