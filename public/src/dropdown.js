function toggleDropdown() {
    const menu = document.getElementById('event-dropdown-menu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

document.addEventListener('click', function(event) {
    const dropdown = document.querySelector('.event-dropdown');
    if (!dropdown.contains(event.target)) {
        document.getElementById('event-dropdown-menu').style.display = 'none';
    }
});