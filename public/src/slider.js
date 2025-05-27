document.addEventListener("DOMContentLoaded", function () {
  const sliderLink = document.getElementById("slider-link");
  const slides = document.querySelectorAll(".slide");
  
  if (!slides.length || !sliderLink) {
    console.warn("Slider or link element not found!");
    return;
  }
  
  let index = 0;
  
  function changeSlide() {
    // Remove active class from the current slide
    slides[index].classList.remove("active");
    
    // Update index to next slide (with wrap around)
    index = (index + 1) % slides.length;
    
    // Add active class to the new slide
    slides[index].classList.add("active");
    
    // Update slider link:
    const newLink = slides[index].getAttribute("data-link");
    sliderLink.href = newLink;
  }
  
  setInterval(changeSlide, 3000);
});