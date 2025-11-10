import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";

const Blog = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .order("published_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <section className="py-12 lg:py-20 bg-gradient-hero">
        <div className="section-container">
          <h1 className="text-4xl lg:text-5xl font-bold text-center text-primary mb-4">
            Boda Boda Financing News
          </h1>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto">
            Stay updated with the latest news on boda boda financing, loans, and investment opportunities in Uganda.
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="section-container">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-0">
                    <Skeleton className="w-full h-48" />
                    <div className="p-6 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Card key={post.id} className="shadow-card hover:shadow-elegant transition-all hover:-translate-y-1">
                  <CardContent className="p-0">
                    <img 
                      src={post.featured_image || "https://placehold.co/600x400/1B2B5C/FFFFFF?text=Blog+Post"} 
                      alt={post.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="p-6 space-y-3">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(post.published_at || post.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      <h3 className="font-semibold text-xl text-primary line-clamp-2">{post.title}</h3>
                      <p className="text-muted-foreground line-clamp-3">{post.excerpt}</p>
                      <Link to={`/blog/${post.slug}`}>
                        <Badge className="bg-primary hover:bg-primary-light cursor-pointer">
                          Read More
                        </Badge>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No blog posts available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
