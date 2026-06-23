"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Heart, Share2, TrendingUp, Shield, Users, Eye } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useState } from "react";

export default function NadaPage() {
  const [posts, setPosts] = useState([
    { id: "1", handle: "BluePenguin42", avatarSeed: "bp42", content: "Just finished my final year project presentation! The stress was worth it. Shoutout to my supervisor Dr. Johnson for the guidance.", likes: 45, comments: 12, time: "2 hours ago", verified: true },
    { id: "2", handle: "NightOwl_99", avatarSeed: "no99", content: "Is anyone else struggling with CSC 401 algorithms? Looking for a study group. DM if interested!", likes: 23, comments: 8, time: "4 hours ago", verified: true },
    { id: "3", handle: "CampusVibes", avatarSeed: "cv01", content: "The new cafeteria menu is actually fire this semester. Try the jollof rice!", likes: 89, comments: 34, time: "6 hours ago", verified: true },
  ]);

  const [newPost, setNewPost] = useState("");

  const handlePost = () => {
    if (!newPost.trim()) return;
    setPosts([{ id: Date.now().toString(), handle: "You", avatarSeed: "you", content: newPost, likes: 0, comments: 0, time: "Just now", verified: true }, ...posts]);
    setNewPost("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">NADA</h1>
          <p className="text-muted-foreground mt-1">Anonymous Student Social Network</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="gap-1">
            <Shield className="h-3 w-3" /> Verified
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Eye className="h-3 w-3" /> Anonymous
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Rep</p>
                <p className="text-2xl font-bold">1,240</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Posts</p>
                <p className="text-2xl font-bold">42</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Community</p>
                <p className="text-2xl font-bold">8.9K</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Post</CardTitle>
          <CardDescription>Share your thoughts anonymously</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's on your mind? (Only verified students can see this)"
            className="w-full min-h-[100px] rounded-lg border border-input bg-transparent px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 resize-y"
          />
          <div className="flex justify-end mt-3">
            <Button variant="gradient" onClick={handlePost} disabled={!newPost.trim()}>Post</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs">
                    {getInitials(post.handle)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">@{post.handle}</span>
                    {post.verified && (
                      <Badge variant="success" className="text-xs h-5">
                        <Shield className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{post.time}</span>
                  </div>
                  <p className="text-sm mt-2 leading-relaxed">{post.content}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-red-500 transition-colors">
                      <Heart className="h-4 w-4" />
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.comments}</span>
                    </button>
                    <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <Share2 className="h-4 w-4" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
