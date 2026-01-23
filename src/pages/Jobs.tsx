import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Briefcase, MapPin, Clock, Calendar } from "lucide-react";
import { format, isPast, formatDistanceToNow } from "date-fns";

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  application_deadline: string;
  is_active: boolean;
  created_at: string;
}

const Jobs = () => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    type: "Full-time",
    description: "",
    requirements: "",
    application_deadline: "",
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      department: "",
      location: "",
      type: "Full-time",
      description: "",
      requirements: "",
      application_deadline: "",
    });
    setEditingJob(null);
  };

  const handleOpenDialog = (job?: JobPosting) => {
    if (job) {
      setEditingJob(job);
      setFormData({
        title: job.title,
        department: job.department,
        location: job.location,
        type: job.type,
        description: job.description,
        requirements: job.requirements.join("\n"),
        application_deadline: job.application_deadline,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const jobData = {
        title: formData.title.trim(),
        department: formData.department.trim(),
        location: formData.location.trim(),
        type: formData.type,
        description: formData.description.trim(),
        requirements: formData.requirements.split("\n").filter(r => r.trim()),
        application_deadline: formData.application_deadline,
        is_active: true,
      };

      if (editingJob) {
        const { error } = await supabase
          .from("job_postings")
          .update(jobData)
          .eq("id", editingJob.id);

        if (error) throw error;
        toast.success("Job updated successfully");
      } else {
        const { error } = await supabase
          .from("job_postings")
          .insert(jobData);

        if (error) throw error;
        toast.success("Job posted successfully");
      }

      setDialogOpen(false);
      resetForm();
      fetchJobs();
    } catch (error: any) {
      console.error("Error saving job:", error);
      toast.error(error.message || "Failed to save job");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job posting?")) return;

    try {
      const { error } = await supabase
        .from("job_postings")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Job deleted successfully");
      fetchJobs();
    } catch (error: any) {
      console.error("Error deleting job:", error);
      toast.error(error.message || "Failed to delete job");
    }
  };

  const toggleActive = async (job: JobPosting) => {
    try {
      const { error } = await supabase
        .from("job_postings")
        .update({ is_active: !job.is_active })
        .eq("id", job.id);

      if (error) throw error;
      toast.success(`Job ${job.is_active ? "deactivated" : "activated"}`);
      fetchJobs();
    } catch (error) {
      console.error("Error toggling job:", error);
      toast.error("Failed to update job");
    }
  };

  const getStatusBadge = (job: JobPosting) => {
    const isExpired = isPast(new Date(job.application_deadline));
    if (isExpired) {
      return <Badge variant="secondary">Expired</Badge>;
    }
    if (!job.is_active) {
      return <Badge variant="outline">Inactive</Badge>;
    }
    return <Badge className="bg-success text-success-foreground">Active</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Job Postings</h1>
            <p className="text-muted-foreground">
              Manage career opportunities. Jobs automatically hide from the public after their deadline.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gradient-accent">
                <Plus className="w-4 h-4 mr-2" />
                Add Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingJob ? "Edit Job" : "Post New Job"}</DialogTitle>
                <DialogDescription>
                  {editingJob ? "Update the job details below." : "Fill in the job details to post a new opening."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Field Officer"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g. Operations"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Kampala"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Employment Type</Label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Application Deadline *</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.application_deadline}
                      onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Job Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the role and responsibilities..."
                    rows={4}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirements">Requirements (one per line)</Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    placeholder="Bachelor's degree&#10;2+ years experience&#10;Valid driver's license"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingJob ? "Update Job" : "Post Job"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              All Job Postings
            </CardTitle>
            <CardDescription>
              {jobs.length} total job{jobs.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Job Postings</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first job posting to attract candidates.
                </p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Job
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>{job.department}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            {job.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{job.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {format(new Date(job.application_deadline), "MMM d, yyyy")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {isPast(new Date(job.application_deadline))
                              ? "Expired"
                              : `${formatDistanceToNow(new Date(job.application_deadline))} left`}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(job)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleActive(job)}
                            >
                              {job.is_active ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(job)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(job.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Jobs;
