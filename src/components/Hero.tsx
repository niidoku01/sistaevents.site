import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/scover.jpeg";

const HeroContent = () => {
  const navigate = useNavigate();
  const [eventDate, setEventDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [dateStatus, setDateStatus] = useState<"" | "available">("");

  const formatDate = (isoDate: string) => {
    const [year, month, day] = isoDate.split("-").map(Number);
    const localDate = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(localDate);
  };

  const scrollToContact = () => {
    const element = document.getElementById("contact");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const goToGallery = () => {
    navigate("/our-collection");
  };

  const goToBookingWithDate = () => {
    if (!eventDate) {
      setDateError("Choose your event date to check availability.");
      setDateStatus("");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    if (eventDate < today) {
      setDateError("Select today or a future date.");
      setDateStatus("");
      return;
    }

    setDateError("");
    setDateStatus("available");
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/50" />
      </div>
    

      <div className="relative z-10 container mx-auto px-4 lg:px-6 text-center pt-14 sm:pt-16">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4 sm:mb-6 animate-fade-in leading-tight">
           WE PLAN EVENTS  
          <br />
          <span className="text-[11px] sm:text-xs md:text-sm lg:text-base bg-gradient-accent bg-clip-text text-transparent mt-2 sm:mt-4 block max-w-3xl mx-auto text-center text-balance">
          • Weddings • Funerals • Parties • Graduation • Corporate Events  
          </span>
        </h1>
        
        <div className="inline-flex flex-nowrap gap-3 sm:gap-4 items-center justify-center animate-fade-in w-full overflow-x-auto pb-1" style={{ animationDelay: "0.4s" }}>
          <Button variant="hero" size="default" onClick={scrollToContact} className="w-auto whitespace-nowrap flex-none">
            Book Us Now
          </Button>
          <Button variant="outline" size="default" className="w-auto whitespace-nowrap flex-none border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" onClick={goToGallery}>
            View Our Collection
          </Button>
        </div>
        <div className="mt-16 lg:mt-20 max-w-md mx-auto bg-green-100/10 backdrop-blur-sm border border-green-100/20 rounded-lg p-3 sm:p-4 md:p-3 animate-fade-in" style={{ animationDelay: "0.9s" }}>
          <p className="text-primary-foreground/85 text-xs sm:text-sm md:text-base mb-2 md:mb-3">Date Availability Checker</p>
          <div className="inline-flex flex-nowrap gap-2 items-center justify-center w-full overflow-x-auto pb-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="bg-white/90 border-sky-100/40 text-foreground h-9 text-sm w-[170px] flex-none justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-accent" />
                  {eventDate ? formatDate(eventDate) : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  mode="single"
                  className="p-2"
                  classNames={{
                    month: "space-y-2",
                    caption_label: "text-xs font-medium",
                    nav_button: "h-6 w-6 bg-transparent p-0 opacity-60 hover:opacity-100",
                    head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.7rem]",
                    cell:
                      "h-8 w-8 text-center text-xs p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
                  }}
                  selected={eventDate ? new Date(eventDate) : undefined}
                  onSelect={(date) => {
                    setEventDate(date ? date.toISOString().split("T")[0] : "");
                    setDateError("");
                    setDateStatus("");
                  }}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
            <Button variant="secondary" className="h-9 px-3 text-sm whitespace-nowrap bg-sky-100/80 hover:bg-sky-100 text-slate-900 w-auto flex-none" onClick={goToBookingWithDate}>
              Check Date
            </Button>
          </div>
          {dateError ? <p className="text-[11px] mt-2 text-red-500 font-medium">{dateError}</p> : null}
          {!dateError && dateStatus === "available" ? (
            <p className="text-[11px] mt-2 text-green-500 font-medium">This date is available. book now to secure it !</p>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export const Hero = () => {
  return <HeroContent />;
};
