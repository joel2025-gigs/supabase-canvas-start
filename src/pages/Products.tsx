import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/skeleton";

const Products = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("in_stock", true)
        .order("created_at", { ascending: false });
      
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
            Our Products
          </h1>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto">
            Browse our selection of high-quality motorcycles and tricycles. All vehicles come with warranty and after-sales support.
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="section-container">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-0">
                    <Skeleton className="w-full h-48" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="shadow-card hover:shadow-elegant transition-all hover:-translate-y-1">
                  <CardContent className="p-0">
                    <div className="relative">
                      <img 
                        src={product.image_urls?.[0] || "https://placehold.co/400x300/1B2B5C/FFFFFF?text=Product"} 
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      {product.featured && (
                        <Badge className="absolute top-2 right-2 bg-accent">Featured</Badge>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg text-primary line-clamp-1">{product.name}</h3>
                        {product.categories && (
                          <p className="text-sm text-muted-foreground">{product.categories.name}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Cash Price</p>
                        <p className="text-2xl font-bold text-primary">
                          UGX {product.cash_price.toLocaleString()}
                        </p>
                        {product.credit_price && (
                          <>
                            <p className="text-sm text-muted-foreground">Credit Price</p>
                            <p className="text-xl font-semibold text-accent">
                              UGX {product.credit_price.toLocaleString()}
                            </p>
                          </>
                        )}
                      </div>
                      <Link to={`/products/${product.slug}`} className="block">
                        <Button className="w-full" variant="outline">View Details</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Products;
