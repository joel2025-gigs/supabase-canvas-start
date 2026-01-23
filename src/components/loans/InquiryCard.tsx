import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Briefcase, Edit, FileText } from "lucide-react";

interface InquiryWithDetails {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  district: string | null;
  occupation: string | null;
  product_interest: string | null;
  monthly_income: string | null;
  message: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface InquiryCardProps {
  inquiry: InquiryWithDetails;
  onEdit: (inquiry: InquiryWithDetails) => void;
  onStartApplication?: (inquiry: InquiryWithDetails) => void;
  onUpdateStatus?: (id: string, status: string) => void;
  showApplicationButton?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "new":
      return "bg-info text-info-foreground";
    case "contacted":
      return "bg-warning text-warning-foreground";
    case "qualified":
      return "bg-primary text-primary-foreground";
    case "converted":
      return "bg-success text-success-foreground";
    case "closed":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const InquiryCard = ({
  inquiry,
  onEdit,
  onStartApplication,
  onUpdateStatus,
  showApplicationButton = false,
}: InquiryCardProps) => {
  return (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{inquiry.full_name}</h3>
            <Badge className={getStatusColor(inquiry.status)}>{inquiry.status}</Badge>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              {inquiry.phone}
            </span>
            {inquiry.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {inquiry.email}
              </span>
            )}
            {inquiry.district && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {inquiry.district}
              </span>
            )}
            {inquiry.occupation && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {inquiry.occupation}
              </span>
            )}
          </div>
          {inquiry.product_interest && (
            <p className="text-sm">
              <span className="font-medium">Interest:</span> {inquiry.product_interest}
            </p>
          )}
          {inquiry.monthly_income && (
            <p className="text-sm">
              <span className="font-medium">Monthly Income:</span> {inquiry.monthly_income}
            </p>
          )}
          {inquiry.message && (
            <p className="text-sm text-muted-foreground line-clamp-2">{inquiry.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Submitted: {new Date(inquiry.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(inquiry)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          {showApplicationButton && inquiry.status === "qualified" && onStartApplication && (
            <Button size="sm" onClick={() => onStartApplication(inquiry)}>
              <FileText className="h-4 w-4 mr-1" />
              Start Application
            </Button>
          )}
          {onUpdateStatus && inquiry.status === "new" && (
            <Button size="sm" variant="secondary" onClick={() => onUpdateStatus(inquiry.id, "contacted")}>
              Mark Contacted
            </Button>
          )}
          {onUpdateStatus && inquiry.status === "contacted" && (
            <Button size="sm" variant="secondary" onClick={() => onUpdateStatus(inquiry.id, "qualified")}>
              Mark Qualified
            </Button>
          )}
          {onUpdateStatus && inquiry.status === "qualified" && !showApplicationButton && (
            <Button size="sm" onClick={() => onUpdateStatus(inquiry.id, "converted")}>
              Convert to Client
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export type { InquiryWithDetails };
