import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

const jobSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  requirements: z.string().optional(),
  location: z.string().optional(),
  employment_type: z.string().optional(),
  salary_range: z.string().optional(),
  published: z.boolean().default(false),
  expires_at: z.string().optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

interface Job extends JobFormData {
  id: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

const JobManagement = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      published: false,
    },
  });

  const published = watch("published");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load jobs");
      console.error(error);
    } else {
      setJobs(data || []);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const onSubmit = async (data: JobFormData) => {
    try {
      const slug = generateSlug(data.title);
      
      if (editingJob) {
        // Update existing job
        const { error } = await supabase
          .from("jobs")
          .update({
            title: data.title,
            description: data.description,
            requirements: data.requirements || null,
            location: data.location || null,
            employment_type: data.employment_type || null,
            salary_range: data.salary_range || null,
            published: data.published,
            expires_at: data.expires_at || null,
            slug: slug,
          })
          .eq("id", editingJob.id);

        if (error) throw error;
        toast.success("Job updated successfully");
      } else {
        // Create new job
        const { error } = await supabase.from("jobs").insert({
          title: data.title,
          description: data.description,
          requirements: data.requirements || null,
          location: data.location || null,
          employment_type: data.employment_type || null,
          salary_range: data.salary_range || null,
          published: data.published,
          expires_at: data.expires_at || null,
          slug: slug,
        });

        if (error) throw error;
        toast.success("Job created successfully");
      }

      reset();
      setEditingJob(null);
      setShowForm(false);
      fetchJobs();
    } catch (error: any) {
      toast.error(error.message || "Failed to save job");
    }
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setValue("title", job.title);
    setValue("description", job.description);
    setValue("requirements", job.requirements || "");
    setValue("location", job.location || "");
    setValue("employment_type", job.employment_type || "");
    setValue("salary_range", job.salary_range || "");
    setValue("published", job.published);
    setValue("expires_at", job.expires_at || "");
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job posting?")) return;

    const { error } = await supabase.from("jobs").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete job");
    } else {
      toast.success("Job deleted successfully");
      fetchJobs();
    }
  };

  const handleCancel = () => {
    reset();
    setEditingJob(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Job Management</h2>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Job
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingJob ? "Edit Job" : "Create New Job"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="title">Job Title *</Label>
                <Input id="title" {...register("title")} />
                {errors.title && (
                  <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" {...register("description")} rows={5} />
                {errors.description && (
                  <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea id="requirements" {...register("requirements")} rows={4} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" {...register("location")} placeholder="e.g., Kampala, Uganda" />
                </div>

                <div>
                  <Label htmlFor="employment_type">Employment Type</Label>
                  <Select
                    onValueChange={(value) => setValue("employment_type", value)}
                    defaultValue={editingJob?.employment_type || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="salary_range">Salary Range</Label>
                  <Input id="salary_range" {...register("salary_range")} placeholder="e.g., UGX 2M - 4M" />
                </div>

                <div>
                  <Label htmlFor="expires_at">Expiry Date</Label>
                  <Input id="expires_at" type="date" {...register("expires_at")} />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={published}
                  onCheckedChange={(checked) => setValue("published", checked)}
                />
                <Label htmlFor="published">Published (visible on careers page)</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit">
                  {editingJob ? "Update Job" : "Create Job"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Job Postings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No job postings yet
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>{job.location || "-"}</TableCell>
                    <TableCell>{job.employment_type || "-"}</TableCell>
                    <TableCell>
                      {job.published ? (
                        <span className="text-green-600">Published</span>
                      ) : (
                        <span className="text-muted-foreground">Draft</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(job)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(job.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobManagement;
