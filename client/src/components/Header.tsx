import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Upload, Search, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import UploadModal from "./UploadModal";

export default function Header() {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/?search=${encodeURIComponent(searchQuery)}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Main Navigation */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <a className="text-2xl font-bold">
                  <span className="text-brand-blue">Video</span>
                  <span className="text-brand-orange">Share</span>
                </a>
              </Link>
            </div>
            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              <Link href="/">
                <a className={`${location === "/" ? "border-brand-blue text-gray-900" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Home
                </a>
              </Link>
              <Link href="/?category=All">
                <a className={`${location.includes("category=All") ? "border-brand-blue text-gray-900" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Explore
                </a>
              </Link>
              {user?.isAdmin && (
                <Link href="/admin">
                  <a className={`${location === "/admin" ? "border-brand-blue text-gray-900" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                    Admin
                  </a>
                </Link>
              )}
            </nav>
          </div>

          {/* Search Bar */}
          <div className="flex-1 flex items-center justify-center px-2 lg:ml-6 lg:justify-end">
            <form onSubmit={handleSearch} className="max-w-lg w-full lg:max-w-xs">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                  placeholder="Search videos"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>

          {/* User Navigation */}
          <div className="flex items-center">
            {/* Mobile Menu Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open mobile menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-4 mt-4">
                  <Link href="/">
                    <a className="text-lg font-medium">Home</a>
                  </Link>
                  <Link href="/?category=All">
                    <a className="text-lg font-medium">Explore</a>
                  </Link>
                  {user?.isAdmin && (
                    <Link href="/admin">
                      <a className="text-lg font-medium">Admin</a>
                    </Link>
                  )}
                  {user ? (
                    <>
                      <Button onClick={() => setIsUploadModalOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </Button>
                      <Link href="/change-password">
                        <Button variant="secondary" className="w-full mb-2">
                          Change Password
                        </Button>
                      </Link>
                      <Button variant="outline" onClick={handleLogout}>
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Link href="/login">
                      <Button>Login</Button>
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <div className="hidden md:ml-4 md:flex md:items-center md:space-x-4">
              {user ? (
                <>
                  <Button onClick={() => setIsUploadModalOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="" alt={user.username} />
                          <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <span className="font-medium">{user.username}</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {user.isAdmin && (
                        <Link href="/admin">
                          <DropdownMenuItem>
                            Admin Panel
                          </DropdownMenuItem>
                        </Link>
                      )}
                      <Link href="/change-password">
                        <DropdownMenuItem>
                          Change Password
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem onClick={handleLogout}>
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Link href="/login">
                  <Button>Login</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal isOpen={isUploadModalOpen} setIsOpen={setIsUploadModalOpen} />
    </header>
  );
}
