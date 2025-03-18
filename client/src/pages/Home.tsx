import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import CategoryTabs from "@/components/CategoryTabs";
import VideoGrid from "@/components/VideoGrid";
import Footer from "@/components/Footer";

export default function Home() {
  const [location] = useLocation();
  const [category, setCategory] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState<string | undefined>();

  // Extract category and search query from URL
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    setCategory(params.get('category') || undefined);
    setSearchQuery(params.get('search') || undefined);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <CategoryTabs />
      
      <main className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {searchQuery 
              ? `Search Results for "${searchQuery}"` 
              : category 
                ? `${category} Videos` 
                : "Recently Uploaded"}
          </h2>
          
          <VideoGrid category={category} searchQuery={searchQuery} />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
