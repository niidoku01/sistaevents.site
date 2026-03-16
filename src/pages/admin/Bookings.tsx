import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Bookings: React.FC = () => {
  const { toast } = useToast();
  const bookings = useQuery(api.bookings.getAllBookings) || [];
  const blockedDates = useQuery(api.bookings.getBlockedDates) || [];
  const blockDate = useMutation(api.bookings.blockDate);
  const unblockDate = useMutation(api.bookings.unblockDate);
  const [eventDate, setEventDate] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [reason, setReason] = useState("");

  const handleBlockDate = async () => {
    if (!eventDate) {
      toast({
        title: "Date required",
        description: "Please select a date to block.",
        variant: "destructive",
      });
      return;
    }

    try {
      await blockDate({
        eventDate,
        reason: reason || undefined,
      });

      toast({
        title: "Date blocked",
        description: `${eventDate} has been marked as unavailable.`,
      });
      setEventDate("");
      setReason("");
    } catch (error) {
      toast({
        title: "Could not block date",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUnblockDate = async (id: (typeof blockedDates)[number]["_id"]) => {
    try {
      await unblockDate({ id });
      toast({
        title: "Date unblocked",
        description: "The date is now available again.",
      });
    } catch (error) {
      toast({
        title: "Could not unblock date",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Booked dates</CardTitle>
          <CardDescription>manual date blocking so customers cannot book them</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[220px,1fr,auto] gap-3">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${!eventDate ? "text-muted-foreground" : ""}`}
                  onClick={() => setCalendarOpen((open) => !open)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-accent" />
                  {eventDate ? new Date(eventDate).toLocaleDateString() : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={eventDate ? new Date(eventDate) : undefined}
                  onSelect={(date) => {
                    setEventDate(date ? date.toISOString().split("T")[0] : "");
                    setCalendarOpen(false);
                  }}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional reason (maintenance, private event, etc.)"
            />
            <Button className="w-full md:w-auto" onClick={handleBlockDate}>Block Date</Button>
          </div>

          <div className="md:hidden space-y-3">
            {blockedDates.length === 0 ? (
              <div className="rounded-xl border border-dashed p-5 text-center text-sm text-gray-500">
                No manually blocked dates
              </div>
            ) : (
              blockedDates
                .slice()
                .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
                .map((d) => (
                  <div key={d._id} className="rounded-xl border p-4 bg-white space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-wide text-gray-500">Date</span>
                      <Badge variant="secondary">{d.eventDate}</Badge>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Reason</p>
                      <p className="text-sm text-gray-800 break-words">{d.reason || "-"}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <p className="text-xs text-gray-500">Blocked on {new Date(d.createdAt).toLocaleDateString()}</p>
                      <Button variant="outline" size="sm" onClick={() => handleUnblockDate(d._id)}>
                        Unblock
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>

          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table className="min-w-[780px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Blocked On</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blockedDates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      No manually blocked dates
                    </TableCell>
                  </TableRow>
                ) : (
                  blockedDates
                    .slice()
                    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
                    .map((d) => (
                      <TableRow key={d._id}>
                        <TableCell>
                          <Badge variant="secondary">{d.eventDate}</Badge>
                        </TableCell>
                        <TableCell>{d.reason || "-"}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleUnblockDate(d._id)}>
                            Unblock
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle> pending Bookings</CardTitle>
          <CardDescription>View all customer bookings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="md:hidden space-y-3">
            {bookings.length === 0 ? (
              <div className="rounded-xl border border-dashed p-5 text-center text-sm text-gray-500">
                No bookings found
              </div>
            ) : (
              bookings
                .slice()
                .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
                .map((b) => (
                  <div key={b._id} className="rounded-xl border p-4 bg-white space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-gray-900 break-words">{b.name}</p>
                      <Badge variant="outline">{b.eventDate}</Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <p className="text-gray-700 break-words"><span className="text-gray-500">Email:</span> {b.email}</p>
                      <p className="text-gray-700 break-words"><span className="text-gray-500">Phone:</span> {b.phone}</p>
                      <p className="text-gray-700 break-words"><span className="text-gray-500">Message:</span> {b.message}</p>
                      <p className="text-xs text-gray-500 pt-1">Created {new Date(b.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
            )}
          </div>

          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Event Date</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      No bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings
                    .slice()
                    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
                    .map((b) => (
                      <TableRow key={b._id}>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell>{b.email}</TableCell>
                        <TableCell>{b.phone}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{b.eventDate}</Badge>
                        </TableCell>
                        <TableCell className="min-w-[260px] max-w-[420px] whitespace-normal break-words align-top">
                          {b.message}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(b.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Bookings;
