document.addEventListener("DOMContentLoaded", function () {
    const links = document.querySelectorAll(".additional-sections a");
    const heading = document.querySelector(".popular .heading");
    const boxContainer = document.querySelector(".popular .box-container");

    // Map link text to API endpoints
    const apiMap = {
    "Δημοφιλή": "/api/events?category=Δημοφιλη",
    "Προτεινόμενα": "/api/events?category=Προτεινόμενα",
    "Νέα": "/api/events?category=Νέα",
    "Κατηγορίες": "/api/events?category=Κατηγορίες",
    "Θέατρο": "/api/events?category=Θέατρο",
    "Μουσική": "/api/events?category=Μουσική",
    "Σινεμά": "/api/events?category=Σινεμά"
};

    links.forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();

            const text = this.textContent.trim();

            // Update the heading
            heading.innerHTML = "";
            for (const [index, char] of [...text].entries()) {
                const span = document.createElement("span");
                span.textContent = char;
                span.style.opacity = "0";
                span.style.transform = "translateY(20px)";
                span.style.transition = `opacity 0.3s ease ${index * 0.05}s, transform 0.3s ease ${index * 0.05}s`;
                span.style.margin = "0 0.2rem";
                heading.appendChild(span);
                requestAnimationFrame(() => {
                    span.style.opacity = "1";
                    span.style.transform = "translateY(0)";
                });
            }

            // Fetch and render events
            const apiUrl = apiMap[text];
            if (apiUrl) {
                fetch(apiUrl)
                    .then(res => res.json())
                    .then(events => {
                        boxContainer.innerHTML = "";
                        if (events.length === 0) {
                            boxContainer.innerHTML = "<p>Δεν βρέθηκαν εκδηλώσεις.</p>";
                        } else {
                            events.forEach(event => {
                                const boxLink = document.createElement("a");
                                boxLink.href = `/event/${event.id}`;
                                boxLink.className = "box-link";
                                boxLink.innerHTML = `
                                    <div class="box">
                                        <img src="${event.image}" alt="">
                                        <div class="content">
                                            <h2><i class="fas fa-calendar"></i> ${event.date}</h2>
                                            <span>${event.title}</span>
                                            <div class="place"><i class="fas fa-map-marker-alt"></i> ${event.place}</div>
                                        </div>
                                    </div>
                                `;
                                boxContainer.appendChild(boxLink);
                            });
                        }
                    });
            }
        });
    });
});