import { useUser, useClerk } from "@clerk/react";
import { useTheme } from "@/components/theme-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";

export default function Settings() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and app preferences.</p>
      </div>

      <div className="grid gap-6">
        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your personal account information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20 border border-border">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {user?.firstName?.[0] || ""}{user?.lastName?.[0] || ""}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="text-xl font-medium">{user?.fullName || "Anonymous User"}</h3>
                <p className="text-muted-foreground">{user?.emailAddresses[0]?.emailAddress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how LinkScope looks on your device.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={theme}
              onValueChange={(val) => setTheme(val as "light" | "dark" | "system")}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="light" id="light" className="peer sr-only" />
                <Label
                  htmlFor="light"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
                >
                  <Sun className="mb-3 h-6 w-6" />
                  <span className="font-medium">Light</span>
                </Label>
              </div>
              
              <div>
                <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                <Label
                  htmlFor="dark"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
                >
                  <Moon className="mb-3 h-6 w-6" />
                  <span className="font-medium">Dark</span>
                </Label>
              </div>

              <div>
                <RadioGroupItem value="system" id="system" className="peer sr-only" />
                <Label
                  htmlFor="system"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
                >
                  <Monitor className="mb-3 h-6 w-6" />
                  <span className="font-medium">System</span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60 border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Actions that cannot be undone.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}