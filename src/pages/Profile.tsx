import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, User, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <Card className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Profile</h1>
              <p className="text-muted-foreground">Manage your account settings</p>
            </div>
            <Button variant="destructive" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Name</label>
              <p className="text-muted-foreground">{user?.name || "User"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <p className="text-muted-foreground">{user?.email || "user@example.com"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">User ID</label>
              <p className="text-muted-foreground text-xs">{user?.id || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Plan</label>
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground capitalize">{user?.plan || "free"} Plan</p>
                <Button asChild variant="link" size="sm" className="h-auto p-0">
                  <Link to="/pricing">Change Plan</Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
