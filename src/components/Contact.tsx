import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, MapPin } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import bookingSuccessSound from "@/sound/u_3bsnvt0dsu-successed-295058.mp3";
import {
  sanitizeInput,
  sanitizeProse,
  autocorrectPhone,
  isValidName,
  isValidEmail,
  isValidPhone,
  NAME_MESSAGE,
  EMAIL_MESSAGE,
  PHONE_MESSAGE,
} from "@/lib/inputValidation";

const BRANDED_SUCCESS_SOUND_URL = bookingSuccessSound;

// Custom WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

export const Contact = () => {
  const { toast } = useToast();
  const createBooking = useMutation(api.bookings.createBooking);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const fallbackAudioContextRef = useRef<AudioContext | null>(null);
  const isAudioPrimedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDatePreFilled, setIsDatePreFilled] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    eventDate: "",
    message: "",
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean; phone?: boolean }>({});
  const hasRequiredFields = Boolean(formData.name.trim() && formData.email.trim() && formData.message.trim());
  const wordCount = formData.message.trim() ? formData.message.trim().split(/\s+/).filter(Boolean).length : 0;

  const nameInvalid = touched.name && !isValidName(sanitizeInput(formData.name, "name"));
  const emailInvalid = touched.email && !isValidEmail(sanitizeInput(formData.email, "email"));
  const phoneInvalid = touched.phone && !isValidPhone(autocorrectPhone(formData.phone));

  const getMissingFieldMessage = () => {
    if (!formData.name.trim()) return "Please enter your name.";
    if (!formData.email.trim()) return "Please enter your email address.";
    if (!formData.message.trim()) return "Please tell us about your event.";
    return "";
  };

  const formatDate = (isoDate: string) => {
    const [year, month, day] = isoDate.split("-").map(Number);
    const localDate = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(localDate);
  };

  const playFallbackSuccessChime = () => {
    // Generate a short success chime if branded audio is unavailable.
    try {
      const AudioContextConstructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) {
        return;
      }

      const audioContext = fallbackAudioContextRef.current ?? new AudioContextConstructor();
      fallbackAudioContextRef.current = audioContext;

      if (audioContext.state === "suspended") {
        void audioContext.resume();
      }

      const createTone = (frequency: number, start: number, duration: number, gainValue: number) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(frequency, start);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.035);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start(start);
        oscillator.stop(start + duration);
      };

      const now = audioContext.currentTime;
      createTone(659, now, 0.12, 0.03);
      createTone(988, now + 0.13, 0.14, 0.03);
      createTone(1318, now + 0.28, 0.2, 0.028);
    } catch {
      // No-op: if audio is blocked/unavailable, booking still succeeds.
    }
  };

  const primeSuccessSound = async () => {
    if (isAudioPrimedRef.current) return;

    try {
      const audio = new Audio(BRANDED_SUCCESS_SOUND_URL);
      audio.preload = "auto";
      audio.volume = 0;
      audio.muted = true;

      await audio.play();
      audio.pause();
      audio.currentTime = 0;

      audio.muted = false;
      audio.volume = 0.9;
      successAudioRef.current = audio;
      isAudioPrimedRef.current = true;
      return;
    } catch {
      // Fall through to priming fallback chime.
    }

    try {
      const AudioContextConstructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) return;

      const audioContext = fallbackAudioContextRef.current ?? new AudioContextConstructor();
      fallbackAudioContextRef.current = audioContext;

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      isAudioPrimedRef.current = true;
    } catch {
      // No-op.
    }
  };

  const playSuccessSound = async () => {
    try {
      const audio = successAudioRef.current ?? new Audio(BRANDED_SUCCESS_SOUND_URL);
      audio.preload = "auto";
      audio.volume = 0.9;
      audio.currentTime = 0;
      await audio.play();
    } catch {
      playFallbackSuccessChime();
    }
  };

  // Pre-fill form from sessionStorage (for package quotes and hero date checker)
  useEffect(() => {
    const loadPackageData = () => {
      const data = sessionStorage.getItem('selectedPackage');
      if (!data) return;

      const formatMessage = (value: string): string => {
        if (value.startsWith("{")) {
          try {
            const pkg = JSON.parse(value) as {
              name?: string;
              price?: string;
              description?: string;
              features?: string[];
            };
            const featureList = (pkg.features ?? [])
              .map((f) => `  • ${f}`)
              .join("\n");
            return [
              `Interested in the ${pkg.name} package (${pkg.price}).`,
              pkg.description,
              "Package includes:",
              featureList,
            ]
              .filter((line): line is string => Boolean(line))
              .join("\n");
          } catch {
            return "";
          }
        }
        return `Interested in the ${value} package.`;
      };

      const message = formatMessage(data);
      if (message) {
        setFormData((prev) => ({ ...prev, message }));
      }
      sessionStorage.removeItem('selectedPackage');
    };

    const loadPrefilledDate = () => {
      const date = sessionStorage.getItem('prefilledEventDate');
      if (date) {
        setFormData(prev => ({ ...prev, eventDate: date }));
        setIsDatePreFilled(true);
        // Remove highlight after 3 seconds
        setTimeout(() => setIsDatePreFilled(false), 3000);
        sessionStorage.removeItem('prefilledEventDate');
      }
    };

    loadPackageData();
    loadPrefilledDate();
    window.addEventListener('packageSelected', loadPackageData);
    return () => window.removeEventListener('packageSelected', loadPackageData);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationMessage = getMissingFieldMessage();
    if (validationMessage) {
      toast({
        title: "Missing information",
        description: validationMessage,
        variant: "destructive",
      });
      return;
    }

    const name = sanitizeInput(formData.name, "name");
    const email = sanitizeInput(formData.email, "email");
    const phone = autocorrectPhone(formData.phone);

    // Silence-safe gate: only generic alerts, never the validation rules.
    const invalid: string[] = [];
    if (!isValidName(name)) invalid.push("Name");
    if (!isValidEmail(email)) invalid.push("Email");
    if (!isValidPhone(phone)) invalid.push("Phone");

    if (invalid.length > 0) {
      setTouched({
        name: !isValidName(name),
        email: !isValidEmail(email),
        phone: !isValidPhone(phone),
      });
      setFormData((prev) => ({ ...prev, name, email, phone }));
      toast({
        title: "Please review a few details",
        description: `${invalid.join(", ")} ${invalid.length > 1 ? "need" : "needs"} your attention before we can send your request.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await createBooking({
        name,
        email,
        phone,
        eventDate: formData.eventDate,
        message: sanitizeProse(formData.message),
      });
      
      // Play success sound only after successful booking
      await primeSuccessSound();
      playSuccessSound();
      
      // Display prominent green success message
      setSuccessMessage("✓ Booking Received! We'll get back to you within 24 hours.");
      
      // Clear form
      setFormData({
        name: "",
        email: "",
        phone: "",
        eventDate: "",
        message: "",
      });
      setTouched({});
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit booking",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="contact" className="section-mobile-padding bg-muted/50 scroll-mt-16 sm:scroll-mt-20 lg:scroll-mt-24">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Booking
          </h2>
          <p className="hidden sm:block text-lg text-muted-foreground max-w-2xl mx-auto">
            Let's discuss how we can make your event extraordinary
          </p>
          <p className="sm:hidden text-sm text-muted-foreground max-w-2xl mx-auto">
            Tell us what you need and we’ll help you plan it.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-5 sm:gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <Card className="border-border">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" noValidate>
                  {successMessage && (
                    <div className="p-4 sm:p-5 bg-green-500/15 border border-green-500/40 rounded-lg animate-fade-in">
                      <p className="text-sm sm:text-base font-semibold text-green-400 text-center">{successMessage}</p>
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                        Your Name 
                      </label>
                      <Input
                        id="name"
                        aria-required="true"
                        aria-invalid={nameInvalid || undefined}
                        autoComplete="name"
                        value={formData.name}
                        onChange={(e) => {
                          setTouched((prev) => ({ ...prev, name: false }));
                          setFormData({ ...formData, name: sanitizeInput(e.target.value, "name") });
                        }}
                        placeholder="Mr/Ms."
                        className={nameInvalid ? "border-red-500/60 ring-red-500/20" : ""}
                      />
                      {nameInvalid && (
                        <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{NAME_MESSAGE}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                        Email Address 
                      </label>
                      <Input
                        id="email"
                        type="email"
                        aria-required="true"
                        aria-invalid={emailInvalid || undefined}
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) => {
                          setTouched((prev) => ({ ...prev, email: false }));
                          setFormData({ ...formData, email: sanitizeInput(e.target.value, "email") });
                        }}
                        placeholder="you@example.com"
                        className={emailInvalid ? "border-red-500/60 ring-red-500/20" : ""}
                      />
                      {emailInvalid && (
                        <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{EMAIL_MESSAGE}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                        Phone Number
                      </label>
                      <Input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        aria-invalid={phoneInvalid || undefined}
                        value={formData.phone}
                        onChange={(e) => {
                          setTouched((prev) => ({ ...prev, phone: false }));
                          setFormData({ ...formData, phone: sanitizeInput(e.target.value, "phone") });
                        }}
                        placeholder="(0) 123456789"
                        className={phoneInvalid ? "border-red-500/60 ring-red-500/20" : ""}
                      />
                      {phoneInvalid && (
                        <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{PHONE_MESSAGE}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="eventDate" className="block text-sm font-medium text-foreground mb-2">
                        Event Date
                      </label>
                      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            id="eventDate"
                            type="button"
                            variant="outline"
                            className={`w-full justify-start text-left font-normal transition-all duration-300 ${
                              !formData.eventDate 
                                ? "text-muted-foreground" 
                                : ""
                            } ${
                              isDatePreFilled
                                ? "ring-2 ring-accent ring-offset-2 bg-accent/5 border-accent"
                                : ""
                            }`}
                            onClick={() => setCalendarOpen((open) => !open)}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-accent" />
                            {formData.eventDate ? formatDate(formData.eventDate) : "Pick a date"}
                            {isDatePreFilled && <span className="ml-auto text-[10px] text-accent font-semibold">✓ From availability check</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.eventDate ? new Date(formData.eventDate) : undefined}
                            onSelect={(date) => {
                              setFormData({ ...formData, eventDate: date ? date.toISOString().split("T")[0] : "" });
                              setCalendarOpen(false);
                              setIsDatePreFilled(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      Tell us about your event
                    </label>
                    <div className="relative">
                      <Textarea
                        id="message"
                        aria-required="true"
                        maxLength={1000}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: sanitizeProse(e.target.value) })}
                        placeholder="Describe your event needs, logistics, guest count, venue, etc."
                        className="min-h-[150px] pb-8 pr-16"
                      />
                      <span
                        className={`pointer-events-none absolute right-3 bottom-2.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                          wordCount > 160
                            ? "text-red-600"
                            : "text-slate-500"
                        }`}
                      >
                        {wordCount}/1000
                      </span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="secondary"
                    size="lg"
                    className="w-full active:scale-[0.98] transition-transform"
                    disabled={isLoading || !hasRequiredFields}
                    aria-disabled={isLoading || !hasRequiredFields}
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Sending...
                      </span>
                    ) : "Send Booking"}
                  </Button>
                  {!hasRequiredFields && !isLoading && (
                    <p className="text-xs text-red-600 dark:text-red-400 text-center">
                      {getMissingFieldMessage() || "Please fill in your name, email, and message to continue."}
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 sm:gap-4 lg:gap-6">
            <Card className="border-border group hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-3.5 sm:p-6">
                <div className="flex items-center gap-3 sm:items-start sm:gap-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center flex-shrink-0 group-hover:from-green-500/30 group-hover:to-green-500/10 transition-colors duration-300">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-base font-semibold text-foreground mb-0.5 sm:mb-1">Call Us</h3>
                    <p className="text-sm sm:text-base text-muted-foreground truncate">(+233) 555-182969</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border group hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-3.5 sm:p-6">
                <div className="flex items-center gap-3 sm:items-start sm:gap-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-red-600/15 to-red-600/5 flex items-center justify-center flex-shrink-0 group-hover:from-red-600/25 group-hover:to-red-600/10 transition-colors duration-300">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5" fill="white" stroke="#dc2626" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-base font-semibold text-foreground mb-0.5 sm:mb-1">Email Us</h3>
                    <p className="text-sm sm:text-base text-muted-foreground truncate">info@sistaevents.com</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border group hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-3.5 sm:p-6">
                <div className="flex items-center gap-3 sm:items-start sm:gap-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center flex-shrink-0">
                    <WhatsAppIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-base font-semibold text-foreground mb-0.5 sm:mb-1">WhatsApp</h3>
                    <p className="text-sm sm:text-base text-muted-foreground truncate">(+233) 279-689522</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border group hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-3.5 sm:p-6">
                <div className="flex items-center gap-3 sm:items-start sm:gap-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-red-600/15 to-red-600/5 flex items-center justify-center flex-shrink-0 group-hover:from-red-600/25 group-hover:to-red-600/10 transition-colors duration-300">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-base font-semibold text-foreground mb-0.5 sm:mb-1">Locate Us</h3>
                    <p className="text-sm sm:text-base text-muted-foreground truncate">Amanfro, Kingstown, Kasoa</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
