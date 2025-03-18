import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SketchPicker } from "react-color";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
// Import removed as we're using fetch directly
import { ThemeSettings } from "@shared/schema";
import { Redirect } from "wouter";

export default function Customize() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("colors");
  const [colorPickerVisible, setColorPickerVisible] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Theme settings state
  const [settings, setSettings] = useState<ThemeSettings>({
    primaryColor: "#3b82f6", 
    secondaryColor: "#f97316",
    accentColor: "#8b5cf6",
    logoText: "VideoShare",
    logoUrl: null,
    borderRadius: 0.5,
    enableAds: false,
    darkMode: false
  });
  
  // Original settings to revert to when canceling preview
  const [originalSettings, setOriginalSettings] = useState<ThemeSettings | null>(null);
  
  // Function to fetch current theme settings
  const fetchThemeSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/theme", {
        method: "GET",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch theme settings');
      }
      
      const data = await response.json();
      setSettings(data);
      setOriginalSettings(data);
      setLoading(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load theme settings",
        variant: "destructive"
      });
      setLoading(false);
    }
  };
  
  // Save theme settings
  const saveThemeSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error('Failed to save theme settings');
      }
      
      setOriginalSettings(settings);
      setPreviewMode(false);
      
      toast({
        title: "Success",
        description: "Theme settings saved successfully"
      });
      setSaving(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save theme settings",
        variant: "destructive"
      });
      setSaving(false);
    }
  };
  
  // Preview theme settings without saving
  const previewThemeSettings = async () => {
    try {
      if (!previewMode) {
        // Store original settings when entering preview mode
        setOriginalSettings(settings);
      }
      
      const response = await fetch("/api/theme/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error('Failed to preview theme settings');
      }
      
      // Apply CSS variables to preview theme
      applyThemeSettings(settings);
      
      setPreviewMode(true);
      
      toast({
        title: "Preview Mode",
        description: "You are now previewing your theme changes. Save to apply them permanently."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to preview theme settings",
        variant: "destructive"
      });
    }
  };
  
  // Cancel preview and revert to original settings
  const cancelPreview = () => {
    if (originalSettings) {
      setSettings(originalSettings);
      applyThemeSettings(originalSettings);
      setPreviewMode(false);
      
      toast({
        title: "Preview Canceled",
        description: "Changes reverted to last saved settings"
      });
    }
  };
  
  // Apply theme settings to CSS variables
  const applyThemeSettings = (themeSettings: ThemeSettings) => {
    const root = document.documentElement;
    
    // Apply colors
    root.style.setProperty('--primary-color', themeSettings.primaryColor);
    root.style.setProperty('--secondary-color', themeSettings.secondaryColor);
    root.style.setProperty('--accent-color', themeSettings.accentColor);
    
    // Apply border radius
    root.style.setProperty('--border-radius', `${themeSettings.borderRadius}rem`);
    
    // Apply dark mode
    if (themeSettings.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };
  
  // Handle input changes
  const handleInputChange = (key: keyof ThemeSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  // Handle color change
  const handleColorChange = (color: { hex: string }, type: 'primaryColor' | 'secondaryColor' | 'accentColor') => {
    setSettings(prev => ({ ...prev, [type]: color.hex }));
  };
  
  // Load theme settings on component mount
  useEffect(() => {
    fetchThemeSettings();
  }, []);
  
  // If not an admin, redirect to home
  if (!user?.isAdmin) {
    return <Redirect to="/" />;
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-brand-blue border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading theme settings...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Customize Your Platform</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Options Panel */}
        <div className="col-span-1 lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Customization Options</CardTitle>
              <CardDescription>
                Customize the appearance of your video platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="colors">Colors</TabsTrigger>
                  <TabsTrigger value="branding">Branding</TabsTrigger>
                  <TabsTrigger value="appearance">Appearance</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                </TabsList>
                
                {/* Colors Tab */}
                <TabsContent value="colors" className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex items-center mt-2">
                        <div 
                          className="w-10 h-10 rounded-md cursor-pointer mr-3 border border-gray-300"
                          style={{ backgroundColor: settings.primaryColor }}
                          onClick={() => setColorPickerVisible(colorPickerVisible === "primary" ? null : "primary")}
                        />
                        <Input
                          id="primaryColor"
                          value={settings.primaryColor}
                          onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                          className="w-32"
                        />
                      </div>
                      {colorPickerVisible === "primary" && (
                        <div className="absolute z-10 mt-2">
                          <SketchPicker
                            color={settings.primaryColor}
                            onChange={(color) => handleColorChange(color, 'primaryColor')}
                          />
                          <div 
                            className="fixed inset-0 z-[-1]" 
                            onClick={() => setColorPickerVisible(null)}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <div className="flex items-center mt-2">
                        <div 
                          className="w-10 h-10 rounded-md cursor-pointer mr-3 border border-gray-300"
                          style={{ backgroundColor: settings.secondaryColor }}
                          onClick={() => setColorPickerVisible(colorPickerVisible === "secondary" ? null : "secondary")}
                        />
                        <Input
                          id="secondaryColor"
                          value={settings.secondaryColor}
                          onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                          className="w-32"
                        />
                      </div>
                      {colorPickerVisible === "secondary" && (
                        <div className="absolute z-10 mt-2">
                          <SketchPicker
                            color={settings.secondaryColor}
                            onChange={(color) => handleColorChange(color, 'secondaryColor')}
                          />
                          <div 
                            className="fixed inset-0 z-[-1]" 
                            onClick={() => setColorPickerVisible(null)}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="accentColor">Accent Color</Label>
                      <div className="flex items-center mt-2">
                        <div 
                          className="w-10 h-10 rounded-md cursor-pointer mr-3 border border-gray-300"
                          style={{ backgroundColor: settings.accentColor }}
                          onClick={() => setColorPickerVisible(colorPickerVisible === "accent" ? null : "accent")}
                        />
                        <Input
                          id="accentColor"
                          value={settings.accentColor}
                          onChange={(e) => handleInputChange('accentColor', e.target.value)}
                          className="w-32"
                        />
                      </div>
                      {colorPickerVisible === "accent" && (
                        <div className="absolute z-10 mt-2">
                          <SketchPicker
                            color={settings.accentColor}
                            onChange={(color) => handleColorChange(color, 'accentColor')}
                          />
                          <div 
                            className="fixed inset-0 z-[-1]" 
                            onClick={() => setColorPickerVisible(null)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                {/* Branding Tab */}
                <TabsContent value="branding" className="space-y-6">
                  <div>
                    <Label htmlFor="logoText">Logo Text</Label>
                    <Input
                      id="logoText"
                      value={settings.logoText}
                      onChange={(e) => handleInputChange('logoText', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="logoUrl">Logo URL (optional)</Label>
                    <Input
                      id="logoUrl"
                      value={settings.logoUrl || ''}
                      onChange={(e) => handleInputChange('logoUrl', e.target.value || null)}
                      placeholder="https://example.com/logo.png"
                      className="mt-2"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Leave empty to use text logo
                    </p>
                  </div>
                </TabsContent>
                
                {/* Appearance Tab */}
                <TabsContent value="appearance" className="space-y-6">
                  <div>
                    <Label htmlFor="borderRadius">Border Radius: {settings.borderRadius}rem</Label>
                    <Slider
                      id="borderRadius"
                      min={0}
                      max={2}
                      step={0.1}
                      value={[settings.borderRadius]}
                      onValueChange={(value) => handleInputChange('borderRadius', value[0])}
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="darkMode"
                      checked={settings.darkMode}
                      onCheckedChange={(checked) => handleInputChange('darkMode', checked)}
                    />
                    <Label htmlFor="darkMode">Dark Mode</Label>
                  </div>
                </TabsContent>
                
                {/* Features Tab */}
                <TabsContent value="features" className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableAds"
                      checked={settings.enableAds}
                      onCheckedChange={(checked) => handleInputChange('enableAds', checked)}
                    />
                    <Label htmlFor="enableAds">Enable Advertisements</Label>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Action Buttons */}
          <div className="flex justify-end mt-6 space-x-4">
            {previewMode ? (
              <Button variant="outline" onClick={cancelPreview}>
                Cancel Preview
              </Button>
            ) : (
              <Button variant="outline" onClick={previewThemeSettings}>
                Preview Changes
              </Button>
            )}
            <Button onClick={saveThemeSettings} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
        
        {/* Preview Panel */}
        <div className="col-span-1 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>
                {previewMode 
                  ? "Currently previewing changes. Save to apply permanently." 
                  : "See how your site will look with these settings"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border p-4 space-y-4">
                {/* Mock Header */}
                <div 
                  className="p-2 flex justify-between items-center rounded" 
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  <div className="text-white font-bold">{settings.logoText}</div>
                  <div className="flex space-x-2">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
                
                {/* Mock Content */}
                <div className="space-y-3">
                  <div 
                    className="h-24 rounded" 
                    style={{ 
                      borderRadius: `${settings.borderRadius}rem`,
                      backgroundColor: settings.darkMode ? '#333' : '#f3f4f6'
                    }}
                  ></div>
                  
                  <div className="flex space-x-2">
                    <div 
                      className="w-1/2 h-12 rounded" 
                      style={{ 
                        backgroundColor: settings.secondaryColor,
                        borderRadius: `${settings.borderRadius}rem` 
                      }}
                    ></div>
                    <div 
                      className="w-1/2 h-12 rounded" 
                      style={{ 
                        backgroundColor: settings.accentColor,
                        borderRadius: `${settings.borderRadius}rem` 
                      }}
                    ></div>
                  </div>
                  
                  <div 
                    className="h-6 w-3/4 rounded" 
                    style={{ 
                      backgroundColor: settings.darkMode ? '#555' : '#e5e7eb',
                      borderRadius: `${settings.borderRadius}rem` 
                    }}
                  ></div>
                  
                  <div 
                    className="h-6 w-1/2 rounded" 
                    style={{ 
                      backgroundColor: settings.darkMode ? '#555' : '#e5e7eb',
                      borderRadius: `${settings.borderRadius}rem` 
                    }}
                  ></div>
                </div>
                
                {/* Ad Banner Preview */}
                {settings.enableAds && (
                  <div 
                    className="bg-gray-200 p-2 text-center text-sm rounded"
                    style={{ borderRadius: `${settings.borderRadius}rem` }}
                  >
                    Advertisement Area
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}