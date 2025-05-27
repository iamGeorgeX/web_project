document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".details_menu dt");
    const sections = document.querySelectorAll(".placeholder_information > div");

    tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => {
            // Remove the active class from all tabs and sections
            tabs.forEach((t) => t.classList.remove("active"));
            sections.forEach((section) => section.classList.remove("active"));

            // Add the active class to the clicked tab and corresponding section
            tab.classList.add("active");
            sections[index].classList.add("active");
        });
    });
});