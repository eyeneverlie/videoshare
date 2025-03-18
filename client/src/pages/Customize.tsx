import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SketchPicker } from "react-color";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, useRouter } from "wouter";

interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoText: string;
  logoUrl: string | null;
  borderRadius: number;
  enableAds: boolean;
  darkMode: boolean;
}

export default function Customize() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [previewMode, setPreviewMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState<"primary" | "secondary" | "accent">("primary");
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  
  const [settings, setSettings] = useState<ThemeSettings>({
    primaryColor: "#3b82f6", // Blue
    secondaryColor: "#f59e0b", // Amber
    accentColor: "#10b981", // Emerald
    logoText: "VideoShare",
    logoUrl: null,
    borderRadius: 6,
    enableAds: false,
    darkMode: false,
  });

  // Redirect if not admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate("/");
      toast({
        title: "Access Denied",
        description: "Only administrators can access the customization page.",
        variant: "destructive",
      });
    }
  }, [user, navigate, toast]);

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const handleColorChange = (color: any) => {
    setSettings({
      ...settings,
      [selectedColor + "Color"]: color.hex,
    });
  };

  const openColorPicker = (colorType: "primary" | "secondary" | "accent") => {
    setSelectedColor(colorType);
    setColorPickerOpen(true);
  };

  const applySettings = async () => {
    try {
      // In a real application, you would send these settings to your backend
      // await apiRequest('POST', '/api/settings', settings);
      
      // For now, just simulate an API call
      setTimeout(() => {
        toast({
          title: "Settings Saved",
          description: "Your customization settings have been applied.",
        });
      }, 1000);
      
      // Apply CSS variables
      applyCustomCSS();
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetSettings = () => {
    setSettings({
      primaryColor: "#3b82f6",
      secondaryColor: "#f59e0b",
      accentColor: "#10b981",
      logoText: "VideoShare",
      logoUrl: null,
      borderRadius: 6,
      enableAds: false,
      darkMode: false,
    });
    
    // Reset CSS variables
    applyCustomCSS();
  };

  const applyCustomCSS = () => {
    const root = document.documentElement;
    root.style.setProperty('--primary', settings.primaryColor);
    root.style.setProperty('--secondary', settings.secondaryColor);
    root.style.setProperty('--accent', settings.accentColor);
    root.style.setProperty('--rounded-box', `${settings.borderRadius}px`);
    
    if (settings.darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  const togglePreview = () => {
    setPreviewMode(!previewMode);
    if (!previewMode) {
      // Entering preview mode, apply settings
      applyCustomCSS();
    } else {
      // Exiting preview mode, reset to current saved settings
      // In a real app, you'd fetch the current saved settings
      resetSettings();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Customize Your Platform</h1>
        <div className="flex items-center gap-4">
          <Button 
            variant={previewMode ? "default" : "outline"} 
            onClick={togglePreview}
          >
            {previewMode ? "Exit Preview" : "Live Preview"}
          </Button>
          {previewMode && (
            <Button onClick={applySettings}>
              Save Changes
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side - Settings Controls */}
        <div className="md:col-span-2">
          <Tabs defaultValue="branding">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="advertising">Advertising</TabsTrigger>
            </TabsList>
            
            {/* Branding Tab */}
            <TabsContent value="branding" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Logo & Text</CardTitle>
                  <CardDescription>
                    Configure your platform's logo and branding text
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="logoText">Platform Name</Label>
                    <Input 
                      id="logoText"
                      value={settings.logoText}
                      onChange={(e) => setSettings({...settings, logoText: e.target.value})}
                      placeholder="Enter your platform name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Logo Upload</Label>
                    <div className="border border-dashed rounded-md p-6 text-center">
                      <p className="text-sm text-gray-500 mb-2">Drag and drop or click to upload</p>
                      <Button variant="outline" size="sm">
                        Select File
                      </Button>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          // Handle file upload in a real implementation
                          toast({
                            title: "File Upload",
                            description: "Logo upload would be processed here in a real implementation",
                          });
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Brand Colors</CardTitle>
                  <CardDescription>
                    Set your platform's color scheme
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="mb-2 block">Primary Color</Label>
                      <div 
                        className="h-10 rounded-md cursor-pointer flex items-center justify-center"
                        style={{ backgroundColor: settings.primaryColor }}
                        onClick={() => openColorPicker("primary")}
                      >
                        <span className="text-white text-xs font-mono">
                          {settings.primaryColor}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="mb-2 block">Secondary Color</Label>
                      <div 
                        className="h-10 rounded-md cursor-pointer flex items-center justify-center"
                        style={{ backgroundColor: settings.secondaryColor }}
                        onClick={() => openColorPicker("secondary")}
                      >
                        <span className="text-white text-xs font-mono">
                          {settings.secondaryColor}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="mb-2 block">Accent Color</Label>
                      <div 
                        className="h-10 rounded-md cursor-pointer flex items-center justify-center"
                        style={{ backgroundColor: settings.accentColor }}
                        onClick={() => openColorPicker("accent")}
                      >
                        <span className="text-white text-xs font-mono">
                          {settings.accentColor}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {colorPickerOpen && (
                    <div className="relative">
                      <div className="absolute z-10">
                        <div 
                          className="fixed inset-0" 
                          onClick={() => setColorPickerOpen(false)}
                        ></div>
                        <SketchPicker 
                          color={settings[`${selectedColor}Color`]}
                          onChange={handleColorChange}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Visual Style</CardTitle>
                  <CardDescription>
                    Customize the visual appearance of your platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="borderRadius">Border Radius</Label>
                      <span className="text-sm text-gray-500">{settings.borderRadius}px</span>
                    </div>
                    <Slider
                      id="borderRadius"
                      min={0}
                      max={20}
                      step={1}
                      value={[settings.borderRadius]}
                      onValueChange={(value) => setSettings({...settings, borderRadius: value[0]})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="darkMode">Dark Mode</Label>
                      <p className="text-sm text-gray-500">
                        Switch between light and dark theme
                      </p>
                    </div>
                    <Switch
                      id="darkMode"
                      checked={settings.darkMode}
                      onCheckedChange={(checked) => setSettings({...settings, darkMode: checked})}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Advertising Tab */}
            <TabsContent value="advertising" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Advertising Settings</CardTitle>
                  <CardDescription>
                    Configure advertising and monetization options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enableAds">Enable Advertisements</Label>
                      <p className="text-sm text-gray-500">
                        Display ads on your platform
                      </p>
                    </div>
                    <Switch
                      id="enableAds"
                      checked={settings.enableAds}
                      onCheckedChange={(checked) => setSettings({...settings, enableAds: checked})}
                    />
                  </div>
                  
                  {settings.enableAds && (
                    <div className="space-y-2 border-t pt-4 mt-4">
                      <Label htmlFor="adCode">Ad Code</Label>
                      <textarea
                        id="adCode"
                        className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Paste your ad provider code here..."
                      ></textarea>
                      <p className="text-xs text-gray-500">
                        Paste ad code from your advertising provider (e.g., Google AdSense)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 flex justify-end gap-4">
            <Button variant="outline" onClick={resetSettings}>
              Reset to Default
            </Button>
            <Button onClick={applySettings}>
              Save Changes
            </Button>
          </div>
        </div>
        
        {/* Right Side - Live Preview */}
        <div className="md:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                See how your changes will look
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden">
              <div className="border rounded-md overflow-hidden" style={{ height: "500px" }}>
                <div className="w-full p-3 flex items-center justify-between" 
                     style={{ backgroundColor: settings.primaryColor, color: "white" }}>
                  <div className="font-bold text-lg">{settings.logoText}</div>
                  <div className="flex space-x-2">
                    <div className="w-6 h-6 rounded-full bg-white/30"></div>
                    <div className="w-6 h-6 rounded-full bg-white/30"></div>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="w-full h-32 mb-4 rounded-md bg-gray-200" 
                       style={{ borderRadius: `${settings.borderRadius}px` }}></div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                    <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                  </div>
                  
                  <div className="flex space-x-2 mb-4">
                    <div className="px-3 py-1 rounded-md text-white text-xs" 
                         style={{ backgroundColor: settings.primaryColor, borderRadius: `${settings.borderRadius}px` }}>
                      Button 1
                    </div>
                    <div className="px-3 py-1 rounded-md text-white text-xs" 
                         style={{ backgroundColor: settings.secondaryColor, borderRadius: `${settings.borderRadius}px` }}>
                      Button 2
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 mb-4">
                    <div className="w-16 h-16 rounded-md bg-gray-200" 
                         style={{ borderRadius: `${settings.borderRadius}px` }}></div>
                    <div className="w-16 h-16 rounded-md bg-gray-200" 
                         style={{ borderRadius: `${settings.borderRadius}px` }}></div>
                    <div className="w-16 h-16 rounded-md bg-gray-200" 
                         style={{ borderRadius: `${settings.borderRadius}px` }}></div>
                  </div>
                  
                  {settings.enableAds && (
                    <div className="w-full p-2 border border-dashed border-gray-300 text-center text-sm text-gray-500 rounded-md mt-4">
                      Advertisement Area
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-4">
              <span className="text-sm text-gray-500">
                {previewMode ? "Live Preview Mode" : "Preview Only"}
              </span>
              <Button variant="outline" size="sm" onClick={togglePreview}>
                {previewMode ? "Exit Preview" : "Apply Preview"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}