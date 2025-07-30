import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Crown, Users, Shield, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isMegaAdmin } from "@shared/userRoles";
import type { User } from "@shared/schema";

const ROLE_INFO = {
  guest: { 
    icon: "👤", 
    label: "Guest", 
    color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    description: "Can read free stories"
  },
  registered: { 
    icon: "📖", 
    label: "Reader", 
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    description: "Can buy and read premium content"
  },
  admin: { 
    icon: "✍️", 
    label: "Writer", 
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    description: "Can create and publish stories"
  },
  "mega-admin": { 
    icon: "👑", 
    label: "Mega-Admin", 
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    description: "Full system access and user management"
  }
};

export default function UserManagement() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Only mega-admin can access this page
  if (!user || !isMegaAdmin(user)) {
    return (
      <div className="min-h-screen bg-kindle flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-kindle mb-4">Access Restricted</h1>
          <p className="text-kindle-secondary mb-6">User management is restricted to mega-admin.</p>
          <Button 
            onClick={() => setLocation("/")}
            className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90"
          >
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiRequest("PUT", `/api/users/${userId}/role`, { role });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Role Updated",
        description: "User role has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-kindle flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-rose-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kindle">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-kindle/95 backdrop-blur-sm border-b border-dark-tertiary">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="text-kindle hover:text-rose-gold"
            >
              <ArrowLeft size={18} />
            </Button>
            <div className="flex items-center space-x-2">
              <Crown className="text-purple-400" size={20} />
              <h1 className="text-lg font-bold text-kindle">User Management</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="text-blue-400" size={20} />
                <div>
                  <p className="text-sm text-text-muted">Total Users</p>
                  <p className="text-xl font-bold text-text-primary">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="text-green-400" size={20} />
                <div>
                  <p className="text-sm text-text-muted">Writers</p>
                  <p className="text-xl font-bold text-text-primary">
                    {users.filter(u => u.role === "admin" || u.role === "mega-admin").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Manage User Roles</h2>
          
          {users.map((user) => {
            const roleInfo = ROLE_INFO[user.role as keyof typeof ROLE_INFO] || ROLE_INFO.registered;
            const isCurrentUser = user.id === (user as any)?.id;
            
            return (
              <Card key={user.id} className="bg-dark-secondary border-dark-tertiary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {user.profileImageUrl ? (
                        <img 
                          src={user.profileImageUrl} 
                          alt={user.firstName || "User"} 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-dark-tertiary flex items-center justify-center">
                          <UserCheck className="text-text-muted" size={16} />
                        </div>
                      )}
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-text-primary">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}`
                              : user.email || "Anonymous User"
                            }
                          </p>
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                        <p className="text-sm text-text-muted">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={roleInfo.color}>
                            {roleInfo.icon} {roleInfo.label}
                          </Badge>
                          <span className="text-xs text-text-muted">
                            🍆 {user.eggplants || 0} eggplants
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Select
                        value={user.role || "registered"}
                        onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                        disabled={isCurrentUser || updateRoleMutation.isPending}
                      >
                        <SelectTrigger className="w-32 bg-dark-tertiary border-dark-quaternary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="registered">📖 Reader</SelectItem>
                          <SelectItem value="admin">✍️ Writer</SelectItem>
                          {isMegaAdmin(user) && (
                            <SelectItem value="mega-admin">👑 Mega-Admin</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <p className="text-xs text-text-muted mt-2 ml-13">
                    {roleInfo.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {users.length === 0 && (
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardContent className="p-8 text-center">
              <Users className="text-text-muted mx-auto mb-4" size={48} />
              <p className="text-text-muted">No users found.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}