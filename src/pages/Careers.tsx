import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, DollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  location: string | null;
  employment_type: string | null;
  salary_range: string | null;
  created_at: string;
  expires_at: string | null;
}

const Careers = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching jobs:", error);
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 lg:py-20 bg-gradient-hero">
          <div className="section-container">
            <h1 className="text-4xl lg:text-5xl font-bold text-center text-primary mb-4">
              Careers at NAWAP
            </h1>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto">
              Join our team and help transform transportation and financing in Uganda.
            </p>
          </div>
        </section>

        {/* Jobs Section */}
        <section className="py-12 lg:py-20">
          <div className="section-container">
            {loading ? (
              <div className="text-center">Loading opportunities...</div>
            ) : jobs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No open positions at the moment. Check back soon for new opportunities!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {jobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-2xl mb-2">{job.title}</CardTitle>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            {job.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {job.location}
                              </div>
                            )}
                            {job.employment_type && (
                              <div className="flex items-center gap-1">
                                <Briefcase className="w-4 h-4" />
                                <Badge variant="secondary">{job.employment_type}</Badge>
                              </div>
                            )}
                            {job.salary_range && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {job.salary_range}
                              </div>
                            )}
                          </div>
                        </div>
                        {job.expires_at && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            Expires: {format(new Date(job.expires_at), "MMM dd, yyyy")}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {job.description}
                        </p>
                      </div>
                      {job.requirements && (
                        <div>
                          <h3 className="font-semibold mb-2">Requirements</h3>
                          <p className="text-muted-foreground whitespace-pre-wrap">
                            {job.requirements}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Careers;
