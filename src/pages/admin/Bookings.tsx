import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Calendar as CalendarIcon, CalendarClock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { bookingAPI } from "@/lib/api";

type BookingRow = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  eventDate: string;
  message: string;
  createdAt: number;
  source: "convex" | "server";
};

const Bookings: React.FC = () => {
  const { toast } = useToast();
  const convexBookings = useQuery(api.bookings.getAllBookings);
  const blockedDates = useQuery(api.bookings.getBlockedDates) || [];
  const blockDate = useMutation(api.bookings.blockDate);
  const unblockDate = useMutation(api.bookings.unblockDate);
  const [serverBookings, setServerBookings] = useState<BookingRow[]>([]);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [eventDate, setEventDate] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadLegacyBookings = async () => {
      if (convexBookings === undefined) return;

      if (convexBookings.length > 0) {
        setServerBookings([]);
        setIsUsingFallback(false);
        return;
      }

      try {
        const response = await bookingAPI.getAllBookings();
        const legacyBookings = Array.isArray(response?.bookings)
          ? response.bookings.map((booking: Record<string, unknown>) => ({
              _id: String(booking.id ?? booking._id ?? crypto.randomUUID()),
              name: String(booking.name ?? ""),
              email: String(booking.email ?? ""),
              phone: String(booking.phone ?? ""),
              eventDate: String(booking.eventDate ?? ""),
              message: String(booking.message ?? ""),
              createdAt: Number(new Date(String(booking.createdAt ?? Date.now())).getTime()),
              source: "server" as const,
            }))
          : [];

        if (cancelled) return;

        setServerBookings(legacyBookings);
        setIsUsingFallback(legacyBookings.length > 0);
      } catch {
        if (cancelled) return;
        setServerBookings([]);
        setIsUsingFallback(false);
      }
    };

    void loadLegacyBookings();

    return () => {
      cancelled = true;
    };
  }, [convexBookings]);

  const bookings = useMemo(() => {
    const source = convexBookings ?? serverBookings;
    return [...source].sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  }, [convexBookings, serverBookings]);

  const formatIsoDate = (isoDate: string) => {
    const [year, month, day] = isoDate.split("-").map(Number);
    const localDate = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(localDate);
  };

  const formatTimestampDate = (timestamp: number) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(new Date(timestamp));

  // Determine whether an event date is upcoming (today or future) or past
  const isUpcomingEvent = (isoDate: string) => {
    try {
      const d = new Date(`${isoDate}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d >= today;
    } catch {
      return false;
    }
  };

  const getEventBadgeClasses = (isoDate: string) =>
    isUpcomingEvent(isoDate)
      ? "bg-red-50/80 border-red-200 text-red-700 font-medium whitespace-nowrap"
      : "bg-green-50/80 border-green-200 text-green-700 font-medium whitespace-nowrap";

  const makeWhatsAppUrl = (phone: string) => {
    const digits = String(phone || "").replace(/\D/g, "");
    return `https://wa.me/${digits}`;
  };

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
        description: `${formatIsoDate(eventDate)} has been marked as unavailable.`,
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

  const formatBookingRef = (index: number, createdAt: number) => {
    const year = new Date(createdAt).getFullYear();
    const seq = String(index + 1).padStart(3, "0");
    return `${year}-${seq}`;
  };

  return (
    <div className="space-y-6">
      {isUsingFallback && (
        <Card className="border-amber-200/60 bg-gradient-to-r from-amber-50/60 to-orange-50/60 shadow-sm">
          <CardContent className="p-4 text-sm text-amber-900 font-medium">
            ℹ️ Showing bookings from backend as Convex has no records yet
          </CardContent>
        </Card>
      )}

      {/* Block Dates Card */}
      <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="space-y-1">
            <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-amber-500" />
              Block Dates
            </CardTitle>
            <CardDescription>Prevent customers from booking on specific dates</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[220px,1fr,auto] gap-3">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal rounded-lg border-slate-200/60 hover:bg-slate-50 transition-colors"
                  onClick={() => setCalendarOpen((open) => !open)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-amber-500" />
                  {eventDate ? formatIsoDate(eventDate) : "Select date"}
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
              placeholder="Reason (maintenance, private event, etc.)"
              className="rounded-lg border-slate-200/60 focus:border-amber-500 focus:ring-amber-500/20"
            />
            <Button 
              onClick={handleBlockDate}
              className="rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-red-500 hover:to-red-600 text-white font-semibold transition-all duration-200 shadow-md hover:shadow-red-200 w-full md:w-auto"
            >
              Block Date
            </Button>
          </div>

          <div className="md:hidden space-y-3">
            {blockedDates.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-5 text-center">
                <p className="text-sm text-slate-500 font-medium">No blocked dates</p>
                <p className="text-xs text-slate-400 mt-1">Create one above to prevent bookings</p>
              </div>
            ) : (
              blockedDates
                .slice()
                .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
                .map((d) => (
                  <div key={d._id} className="rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-red-100/60 p-4 hover:bg-red-100 hover:shadow-md hover:shadow-red-300/60 transition-all duration-200">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <Badge variant="secondary" className="bg-red-200 text-red-900 border-red-300 font-semibold">
                        {formatIsoDate(d.eventDate)}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleUnblockDate(d._id)}
                        className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                      >
                        Unblock
                      </Button>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-red-700 font-semibold mb-1">Reason</p>
                      <p className="text-sm text-red-900">{d.reason || "—"}</p>
                    </div>
                    <p className="text-xs text-red-700 mt-3 font-medium">Blocked {formatTimestampDate(d.createdAt)}</p>
                  </div>
                ))
            )}
          </div>

          <div className="hidden md:block rounded-lg border border-slate-200/60 overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-slate-50/60 border-b border-slate-200/60">
                <TableRow className="hover:bg-slate-50/60">
                  <TableHead className="font-semibold text-slate-900">Date</TableHead>
                  <TableHead className="font-semibold text-slate-900">Reason</TableHead>
                  <TableHead className="font-semibold text-slate-900">Blocked On</TableHead>
                  <TableHead className="text-right font-semibold text-slate-900">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blockedDates.length === 0 ? (
                  <TableRow className="hover:bg-slate-50/60">
                    <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                      No blocked dates
                    </TableCell>
                  </TableRow>
                ) : (
                  blockedDates
                    .slice()
                    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
                    .map((d) => (
                      <TableRow key={d._id} className="hover:bg-red-100/80 border-b border-red-200/60">
                        <TableCell>
                          <Badge variant="secondary" className="bg-red-200 text-red-900 border-red-300 font-semibold">
                            {formatIsoDate(d.eventDate)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-red-900 font-medium">{d.reason || "—"}</TableCell>
                        <TableCell className="text-sm text-red-700">{formatTimestampDate(d.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleUnblockDate(d._id)}
                            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          >
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

      {/* Bookings Card */}
      <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="space-y-1">
            <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-amber-500" />
              Recent Bookings
            </CardTitle>
            <CardDescription>View all customer event bookings</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="md:hidden space-y-3">
            {bookings.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
                <p className="text-sm text-slate-500 font-medium">No bookings yet</p>
                <p className="text-xs text-slate-400 mt-1">New bookings will appear here</p>bvnv

              </div>
            ) : (
              bookings.map((b, idx) => (
                  <div key={b._id} className="rounded-lg border border-slate-200/60 bg-gradient-to-r from-white to-slate-50/50 p-4 hover:shadow-md transition-all duration-200 group">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{b.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Booking ID: {formatBookingRef(idx, b.createdAt)}</p>
                      </div>
                      <Badge className={getEventBadgeClasses(b.eventDate)}>
                        {formatIsoDate(b.eventDate)}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-700">
                        <span className="text-slate-500">📱</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-blue-600 hover:underline break-all text-left">
                              {b.phone}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="bottom">
                            <DropdownMenuItem
                              className="data-[highlighted]:bg-green-50 data-[highlighted]:text-green-800"
                              onSelect={() => (window.location.href = `tel:${b.phone}`)}
                            >
                              Call
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="data-[highlighted]:bg-green-700 data-[highlighted]:text-white"
                              onSelect={() => window.open(makeWhatsAppUrl(b.phone), "_blank")}>
                              WhatsApp
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {/* Details (always shown) */}
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Details</p>
                        <p className="text-slate-700 bg-slate-50/60 rounded p-2">{b.message || "—"}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-200/60">
                      Booked {formatTimestampDate(b.createdAt)}
                    </p>
                  </div>
                ))
            )}
          </div>

          <div className="hidden md:block rounded-lg border border-slate-200/60 overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-slate-50/60 border-b border-slate-200/60">
                <TableRow className="hover:bg-slate-50/60">
                  <TableHead className="font-semibold text-slate-900">Name</TableHead>
                  <TableHead className="font-semibold text-slate-900">Email</TableHead>
                  <TableHead className="font-semibold text-slate-900">Phone</TableHead>
                  <TableHead className="font-semibold text-slate-900">Event Date</TableHead>
                  <TableHead className="font-semibold text-slate-900">Details</TableHead>
                  <TableHead className="font-semibold text-slate-900">Booked On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow className="hover:bg-slate-50/60">
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                      No bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((b, idx) => (
                      <TableRow key={b._id} className="hover:bg-slate-50/60 border-b border-slate-200/40">
                        <TableCell className="font-semibold text-slate-900">
                          <div className="flex flex-col">
                            <span>{b.name}</span>
                            <span className="text-xs text-slate-500">{formatBookingRef(idx, b.createdAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <a href={`mailto:${b.email}`} className="text-blue-600 hover:underline">
                            {b.email}
                          </a>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="text-blue-600 hover:underline">
                                {b.phone}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="bottom">
                              <DropdownMenuItem
                                className="data-[highlighted]:bg-green-50 data-[highlighted]:text-green-800"
                                onSelect={() => (window.location.href = `tel:${b.phone}`)}
                              >
                                Call
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="data-[highlighted]:bg-green-700 data-[highlighted]:text-white"
                                onSelect={() => window.open(makeWhatsAppUrl(b.phone), "_blank")}>
                                WhatsApp
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>
                          <Badge className={getEventBadgeClasses(b.eventDate)}>
                            {formatIsoDate(b.eventDate)}
                          </Badge>
                        </TableCell>
                        <TableCell className="min-w-[200px] max-w-[400px] text-slate-700 whitespace-normal break-words">
                          {b.message || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                          {formatTimestampDate(b.createdAt)}
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
