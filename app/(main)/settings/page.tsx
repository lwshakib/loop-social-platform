'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Trash2, 
  Smartphone, 
  Globe, 
  LogOut,
  ChevronRight,
  UserCheck,
  Edit2,
  Camera,
  Check,
  X,
  Github,
  Chrome,
  Loader2
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { useSocialStore } from '@/context';
import axios from 'axios';

export default function SettingsPage() {
  const router = useRouter();
  const currentUser = useSocialStore((state) => state.user);
  const setUser = useSocialStore((state) => state.setUser);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Initialize edit states
  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name || '');
      setEditUsername(currentUser.username || '');
    }
  }, [currentUser]);

  // Fetch sessions
  useEffect(() => {
    async function fetchSessions() {
      try {
        setIsLoadingSessions(true);
        // @ts-ignore
        const res = await authClient.listSessions();
        if (res?.data) {
          setSessions(res.data);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setIsLoadingSessions(false);
      }
    }
    fetchSessions();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Invalid file type', { description: 'Please upload an image file' });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setIsEditing(true);
    }
  };

  const handleUpdateProfile = async () => {
    if (!currentUser) return;

    // Capture original state for rollback
    const originalUser = { ...currentUser };
    
    // Prepare optimistic state with updated info and preview image
    const optimisticUser = {
      ...currentUser,
      name: editName,
      username: editUsername,
      image: avatarPreview || currentUser.image
    };

    try {
      setIsUpdating(true);
      
      // OPTIMISTIC UPDATE: Update UI immediately
      setUser(optimisticUser);
      setIsEditing(false);

      let finalImageUrl = currentUser.image;

      // 1. Upload new avatar if selected
      if (avatarFile) {
        const { data: response } = await axios.get('/api/cloudinary/signature', {
          params: { folder: 'loop-social-platform' },
        });
        const signature = response.data;
        const formData = new FormData();
        formData.append('file', avatarFile);
        formData.append('api_key', signature.apiKey);
        formData.append('timestamp', signature.timestamp.toString());
        formData.append('folder', signature.folder);
        formData.append('signature', signature.signature);

        const { data: uploadResponse } = await axios.post(
          `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
          formData
        );
        finalImageUrl = uploadResponse.secure_url || uploadResponse.url;
      }

      // 2. Update profile via API
      const res = await fetch(`/api/users/${originalUser.username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          username: editUsername,
          image: finalImageUrl
        }),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success('Profile updated successfully');
        setAvatarFile(null);
        setAvatarPreview(null);
        
        // Final sync with server data
        if (result.data) {
          setUser(result.data);
        }
        
        router.refresh();
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // ROLLBACK on error: Restore old data and reopen edit mode
      setUser(originalUser);
      setIsEditing(true);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      // @ts-ignore
      const res = await authClient.deleteUser();
      if (res?.error) {
        toast.error(res.error.message || 'Failed to delete account');
      } else {
        toast.success('Account deleted successfully');
        router.push('/sign-in');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsDeletingAccount(false);
    }
  }

  const handleRevokeSession = async (tokenId: string) => {
    try {
      // @ts-ignore
      await authClient.revokeSession({ token: tokenId });
      setSessions((prev) => prev.filter((s) => s.id !== tokenId));
      toast.success('Session revoked');
    } catch (error) {
      console.error('Error revoking session:', error);
      toast.error('Failed to revoke session');
    }
  }

  if (!currentUser) return null;

  return (
    <div className="flex-1 min-h-screen bg-background p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-8 pb-20">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Account settings</h1>
        <p className="text-muted-foreground">Manage your account details and security settings.</p>
      </div>

      {/* Account Details */}
      <Card className="border-none shadow-none bg-accent/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <User className="h-5 w-5" /> Account details
            </CardTitle>
            <CardDescription>Your basic information and profile status.</CardDescription>
          </div>
          {!isEditing ? (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setIsEditing(false);
                  setEditName(currentUser.name || '');
                  setEditUsername(currentUser.username || '');
                  setAvatarPreview(null);
                  setAvatarFile(null);
                }}
                disabled={isUpdating}
              >
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleUpdateProfile}
                disabled={isUpdating}
                className="gap-2"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                <AvatarImage src={avatarPreview || currentUser.image || ''} />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-2xl">
                  {(currentUser.name?.[0] || currentUser.username?.[0] || 'U').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="h-6 w-6 text-white" />
                </button>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleAvatarChange} 
              />
            </div>
            
            <div className="flex-1 space-y-4">
              {!isEditing ? (
                <div>
                  <p className="font-bold text-xl">{currentUser.name || currentUser.username}</p>
                  <p className="text-sm text-muted-foreground">@{currentUser.username}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Full name</label>
                    <Input 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                      placeholder="Your name"
                      className="h-9 bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Username</label>
                    <Input 
                      value={editUsername} 
                      onChange={(e) => setEditUsername(e.target.value)} 
                      placeholder="Username"
                      className="h-9 bg-background"
                    />
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                {currentUser.emailVerified && (
                  <Badge variant="secondary" className="gap-1 px-1.5 py-0 font-medium">
                    <UserCheck className="h-3 w-3" />
                    Verified email
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-background flex items-center justify-center border">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Email address</p>
                <p className="text-sm font-medium">{currentUser.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-background flex items-center justify-center border">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Member since</p>
                <p className="text-sm font-medium">
                  {new Date(currentUser.createdAt).toLocaleDateString(undefined, {
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card className="border-none shadow-none bg-accent/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5" /> Connected accounts
          </CardTitle>
          <CardDescription>Social accounts linked to your Loop profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Google */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-accent/50 flex items-center justify-center">
                <Chrome className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Google</p>
                <p className="text-xs text-muted-foreground">Connect with Google account</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] text-green-500 border-green-200 bg-green-50">
                Connected
              </Badge>
            </div>
          </div>

          {/* GitHub */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background opacity-70">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-accent/50 flex items-center justify-center">
                <Github className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">GitHub</p>
                <p className="text-xs text-muted-foreground">Connect with GitHub account</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              Coming soon
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card className="border-none shadow-none bg-accent/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" /> Active sessions
          </CardTitle>
          <CardDescription>Devices where you are currently signed in.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoadingSessions ? (
              <div className="animate-pulse space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded-xl" />
                ))}
              </div>
            ) : sessions.length > 0 ? (
              sessions.map((session) => (
                <div 
                  key={session.id} 
                  className="flex items-center justify-between p-4 rounded-xl border border-border bg-background"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                      {session.userAgent?.toLowerCase().includes('mobile') ? (
                        <Smartphone className="h-5 w-5" />
                      ) : (
                        <Globe className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {session.device || 'Unknown browser'} {session.current && <Badge className="ml-2 text-[10px] h-4 py-0 bg-primary/10 text-primary border-primary/20">Active now</Badge>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.ipAddress || 'Private IP'} · {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {!session.current && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-red-500 hover:text-red-500 hover:bg-red-50"
                      onClick={() => handleRevokeSession(session.id)}
                    >
                      Sign out
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No other active sessions detected.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/20 shadow-none bg-red-500/5">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-red-600 flex items-center gap-2">
            <Trash2 className="h-5 w-5" /> Danger zone
          </CardTitle>
          <CardDescription>Permanently delete your Loop account and data.</CardDescription>
        </CardHeader>
        <CardFooter className="pt-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-100 hover:text-red-600 w-full sm:w-auto">
                Delete account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account
                  and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteAccount}
                  className="bg-red-600 text-white hover:bg-red-700 font-medium gap-2"
                  disabled={isDeletingAccount}
                >
                  {isDeletingAccount ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Permanently delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  )
}
