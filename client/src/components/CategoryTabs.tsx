import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Category, DEFAULT_CATEGORIES } from "@shared/schema";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function CategoryTabs() {
  const [location, navigate] = useLocation();
  const [activeCategory, setActiveCategory] = useState("All");

  // Get the current category from URL
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const category = params.get("category");
    if (category) {
      setActiveCategory(category);
    } else {
      setActiveCategory("All");
    }
  }, [location]);

  // Fetch categories from API
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    initialData: DEFAULT_CATEGORIES.map((name, index) => ({ id: index + 1, name })),
  });

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    
    // Preserve any existing search parameter
    const params = new URLSearchParams(location.split("?")[1]);
    const searchQuery = params.get("search");
    
    let newUrl = "/?category=" + encodeURIComponent(category);
    if (searchQuery) {
      newUrl += "&search=" + encodeURIComponent(searchQuery);
    }
    
    navigate(newUrl);
  };

  return (
    <div className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex py-3 space-x-8">
            {categories?.map((category) => (
              <button
                key={category.id}
                className={`${
                  activeCategory === category.name
                    ? "text-brand-blue border-b-2 border-brand-blue"
                    : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent"
                } px-1 py-2 text-sm font-medium whitespace-nowrap`}
                onClick={() => handleCategoryClick(category.name)}
              >
                {category.name}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
