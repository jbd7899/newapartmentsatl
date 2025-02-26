import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import type { Inquiry } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const AdminInquiriesPage = () => {
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch inquiries
  const { data: inquiries, isLoading, refetch } = useQuery({
    queryKey: ['/api/inquiries'],
    staleTime: 1000 * 60, // 1 minute
  });

  // Format date to readable format
  const formatDate = (dateString: Date | string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle status change
  const handleStatusChange = async (inquiryId: number, newStatus: string) => {
    try {
      await apiRequest({
        url: `/api/inquiries/${inquiryId}/status`,
        method: 'PATCH',
        body: { status: newStatus },
      });
      
      toast({
        title: "Status updated",
        description: "The inquiry status has been updated successfully.",
      });
      
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update inquiry status.",
        variant: "destructive",
      });
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge variant="destructive">New</Badge>;
      case "contacted":
        return <Badge variant="default">Contacted</Badge>;
      case "resolved":
        return <Badge variant="outline">Resolved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // View inquiry details
  const viewInquiryDetails = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Customer Inquiries</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Inquiries</CardTitle>
          <CardDescription>
            Manage and respond to customer inquiries from the website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : inquiries?.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No inquiries found.</p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inquiries?.map((inquiry: Inquiry) => (
                    <TableRow key={inquiry.id}>
                      <TableCell className="font-medium">
                        {formatDate(inquiry.createdAt)}
                      </TableCell>
                      <TableCell>{inquiry.name}</TableCell>
                      <TableCell>{inquiry.email}</TableCell>
                      <TableCell>
                        {inquiry.propertyName || "General Inquiry"}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(inquiry.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewInquiryDetails(inquiry)}
                          >
                            View
                          </Button>
                          <Select
                            defaultValue={inquiry.status}
                            onValueChange={(value) => handleStatusChange(inquiry.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Set Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
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

      {/* Inquiry Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
            <DialogDescription>
              Submitted on {selectedInquiry && formatDate(selectedInquiry.createdAt)}
            </DialogDescription>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Name</h4>
                  <p>{selectedInquiry.name}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Email</h4>
                  <p>{selectedInquiry.email}</p>
                </div>
                {selectedInquiry.phone && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Phone</h4>
                    <p>{selectedInquiry.phone}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Status</h4>
                  <p>{getStatusBadge(selectedInquiry.status)}</p>
                </div>
              </div>
              
              {selectedInquiry.propertyName && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Property</h4>
                  <p>{selectedInquiry.propertyName}</p>
                </div>
              )}
              
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Message</h4>
                <p className="whitespace-pre-wrap">{selectedInquiry.message}</p>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Select
                  defaultValue={selectedInquiry.status}
                  onValueChange={(value) => {
                    handleStatusChange(selectedInquiry.id, value);
                    setSelectedInquiry({...selectedInquiry, status: value});
                  }}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Update Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInquiriesPage;