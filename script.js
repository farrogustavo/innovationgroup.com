const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const navLinks = document.querySelector("[data-nav-links]");

const syncHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 20);
};

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

const reveals = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

reveals.forEach((item) => observer.observe(item));

const bookingForm = document.querySelector("[data-booking-form]");
const timeSelect = document.querySelector("[data-time-select]");
const bookingStatus = document.querySelector("[data-booking-status]");

const companyCalendarEmail = "info@innovationgroupproject.co";
const businessLocation = "Innovation Group Projects LLC, Smyrna, TN 37167";
const availableTimes = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00"
];

const blockedWeeklySlots = {
  2: ["10:00"],
  4: ["14:00"]
};

const blockedDateSlots = new Set([
  "2026-05-18T09:00",
  "2026-05-20T13:00"
]);

const formatTimeLabel = (time) => {
  const [hour, minute] = time.split(":").map(Number);
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
};

const parseLocalDate = (dateValue, timeValue = "00:00") => {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
};

const toGoogleDate = (date) => {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    pad(date.getMinutes()),
    "00"
  ].join("");
};

const setBookingStatus = (message, type = "") => {
  bookingStatus.className = `booking-status${type ? ` is-${type}` : ""}`;
  bookingStatus.textContent = message;
};

const setCalendarSuccess = (calendarUrl) => {
  bookingStatus.className = "booking-status is-success";
  bookingStatus.textContent = "This appointment is available. ";
  const link = document.createElement("a");
  link.href = calendarUrl;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "Open Google Calendar to save the reservation.";
  bookingStatus.append(link);
};

const getAvailabilityIssue = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) {
    return "Please select both a date and a time.";
  }

  const selectedDate = parseLocalDate(dateValue, timeValue);
  const now = new Date();
  const weekday = selectedDate.getDay();
  const slotKey = `${dateValue}T${timeValue}`;

  if (selectedDate < now) {
    return "We are sorry, that date or time is no longer available. Please enter a new date.";
  }

  if (weekday === 0 || weekday === 6) {
    return "We are sorry, weekend appointments are not available. Please enter a new weekday date.";
  }

  if (blockedDateSlots.has(slotKey) || blockedWeeklySlots[weekday]?.includes(timeValue)) {
    return "We are sorry, that day and time are not available. Please enter a new date or choose another time.";
  }

  return "";
};

const buildCalendarUrl = (formData) => {
  const startDate = parseLocalDate(formData.get("date"), formData.get("time"));
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  const service = formData.get("service");
  const name = formData.get("name");
  const phone = formData.get("phone");
  const email = formData.get("email");
  const note = formData.get("message") || "No project note provided.";
  const details = [
    `Client: ${name}`,
    `Phone: ${phone}`,
    `Email: ${email}`,
    `Service: ${service}`,
    "",
    `Project note: ${note}`,
    "",
    "Please confirm the appointment directly with the client."
  ].join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Consultation - Innovation Group Projects LLC - ${service}`,
    dates: `${toGoogleDate(startDate)}/${toGoogleDate(endDate)}`,
    details,
    location: businessLocation,
    add: companyCalendarEmail,
    ctz: "America/Chicago"
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

if (timeSelect) {
  availableTimes.forEach((time) => {
    const option = document.createElement("option");
    option.value = time;
    option.textContent = formatTimeLabel(time);
    timeSelect.append(option);
  });
}

if (bookingForm) {
  const dateInput = bookingForm.querySelector('input[name="date"]');
  const today = new Date();
  dateInput.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  setBookingStatus("Appointments are available Monday through Friday during business hours.");

  bookingForm.addEventListener("submit", (event) => {
    const formData = new FormData(bookingForm);
    const issue = getAvailabilityIssue(formData.get("date"), formData.get("time"));

    if (issue) {
      event.preventDefault();
      setBookingStatus(issue, "error");
      return;
    }

    // Form is valid, let it submit to FormSubmit naturally
    setBookingStatus("Sending your request...", "success");
  });
}

const mapCard = document.querySelector("[data-map-card]");
const mapFrame = document.querySelector("[data-map-frame]");

if (mapCard && mapFrame) {
  mapFrame.addEventListener("load", () => {
    mapCard.classList.add("is-loaded");
  });
}


const homeCarousel = document.querySelector("[data-home-carousel]");

if (homeCarousel) {
  const track = homeCarousel.querySelector(".home-carousel-track");
  const slides = Array.from(homeCarousel.querySelectorAll(".home-carousel-slide"));
  const prev = homeCarousel.querySelector(".home-carousel-prev");
  const next = homeCarousel.querySelector(".home-carousel-next");
  const dotsWrap = homeCarousel.querySelector(".home-carousel-dots");
  let currentSlide = 0;
  let homeTimer = null;

  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "home-carousel-dot" + (index === 0 ? " is-active" : "");
    dot.setAttribute("aria-label", "Go to project " + (index + 1));
    dot.addEventListener("click", () => {
      goHomeSlide(index);
      restartHomeCarousel();
    });
    dotsWrap.append(dot);
  });

  const syncHomeCarousel = () => {
    track.style.transform = "translateX(-" + currentSlide * 100 + "%)";
    dotsWrap.querySelectorAll(".home-carousel-dot").forEach((dot, index) => {
      dot.classList.toggle("is-active", index === currentSlide);
    });
  };

  const goHomeSlide = (index) => {
    currentSlide = (index + slides.length) % slides.length;
    syncHomeCarousel();
  };

  const startHomeCarousel = () => {
    homeTimer = setInterval(() => goHomeSlide(currentSlide + 1), 5000);
  };

  const restartHomeCarousel = () => {
    clearInterval(homeTimer);
    startHomeCarousel();
  };

  prev.addEventListener("click", () => {
    goHomeSlide(currentSlide - 1);
    restartHomeCarousel();
  });

  next.addEventListener("click", () => {
    goHomeSlide(currentSlide + 1);
    restartHomeCarousel();
  });

  homeCarousel.addEventListener("mouseenter", () => clearInterval(homeTimer));
  homeCarousel.addEventListener("mouseleave", startHomeCarousel);
  startHomeCarousel();
}


document.querySelectorAll("[data-cinematic-carousel]").forEach((carousel) => {
  const track = carousel.querySelector(".cinematic-track");
  const slides = Array.from(carousel.querySelectorAll(".cinematic-slide"));
  const prev = carousel.querySelector(".cinematic-prev");
  const next = carousel.querySelector(".cinematic-next");
  const dotsWrap = carousel.querySelector(".cinematic-dots");
  const currentLabel = carousel.querySelector("[data-current]");
  let current = 0;
  let timer = null;

  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "cinematic-dot" + (index === 0 ? " is-active" : "");
    dot.setAttribute("aria-label", "Go to slide " + (index + 1));
    dot.addEventListener("click", () => {
      goToCinematic(index);
      restartCinematic();
    });
    dotsWrap.append(dot);
  });

  const sync = () => {
    track.style.transform = "translateX(-" + current * 100 + "%)";
    dotsWrap.querySelectorAll(".cinematic-dot").forEach((dot, index) => {
      dot.classList.toggle("is-active", index === current);
    });
    if (currentLabel) currentLabel.textContent = String(current + 1).padStart(2, "0");
  };

  const goToCinematic = (index) => {
    current = (index + slides.length) % slides.length;
    sync();
  };

  const start = () => {
    timer = setInterval(() => goToCinematic(current + 1), 5200);
  };

  const restartCinematic = () => {
    clearInterval(timer);
    start();
  };

  prev.addEventListener("click", () => {
    goToCinematic(current - 1);
    restartCinematic();
  });

  next.addEventListener("click", () => {
    goToCinematic(current + 1);
    restartCinematic();
  });

  carousel.addEventListener("mouseenter", () => clearInterval(timer));
  carousel.addEventListener("mouseleave", start);
  start();
});


const heroCarousel = document.querySelector("[data-hero-carousel]");

if (heroCarousel) {
  const heroSlides = Array.from(heroCarousel.querySelectorAll(".hero-bg-slide"));
  let heroIndex = 0;

  setInterval(() => {
    heroSlides[heroIndex].classList.remove("is-active");
    heroIndex = (heroIndex + 1) % heroSlides.length;
    heroSlides[heroIndex].classList.add("is-active");
  }, 5200);
}
