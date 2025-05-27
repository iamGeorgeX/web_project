document.addEventListener("DOMContentLoaded", function () {
    let themeBtn = document.querySelector('#theme-btn');

    // Load theme from localStorage
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('active');
        themeBtn.classList.add('fa-sun'); // Switch icon to sun
    }

    themeBtn.onclick = () => {
        themeBtn.classList.toggle('fa-sun');
        if (themeBtn.classList.contains('fa-sun')) {
            document.body.classList.add('active');
            localStorage.setItem('theme', 'dark'); // Save theme as dark
        } else {
            document.body.classList.remove('active');
            localStorage.setItem('theme', 'light'); // Save theme as light
        }
    };
});