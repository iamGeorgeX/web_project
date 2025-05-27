document.addEventListener('DOMContentLoaded', function () {
  const seats = document.querySelectorAll('.seat');
  const popup = document.getElementById('selected-seats-popup');
  const selectedSeatsList = document.getElementById('selected-seats-list');
  const buyBtn = document.getElementById('buy-selected-btn');
  let selectedSeats = []; // each item: { row, col, zone }

  
function updatePopup() {
  // Map your zone names to colors (adjust as needed)


  selectedSeatsList.innerHTML = '';
  if (selectedSeats.length > 0) {
    popup.style.display = 'block';
    selectedSeats.forEach(seatInfo => {
      const li = document.createElement('li');
      li.textContent = `Row ${seatInfo.row} - Seat ${seatInfo.col} (${seatInfo.zone})`;
      li.style.padding = '5px 10px';
      li.style.margin = '5px';
      li.style.borderRadius = '4px';
      li.style.backgroundColor = zoneColors[seatInfo.zone] || '#333'; // Use zone color
      li.style.color = '#fff';
      selectedSeatsList.appendChild(li);
    });
  } else {
    popup.style.display = 'none';
  }
}



  function deselectSeat(targetRow, targetCol) {
    seats.forEach(seat => {
      const r = parseInt(seat.getAttribute('data-row'));
      const c = parseInt(seat.getAttribute('data-index'));
      if (r === targetRow && c === targetCol) {
        seat.classList.remove('selected');
      }
    });
    selectedSeats = selectedSeats.filter(s => !(s.row === targetRow && s.col === targetCol));

  }

  seats.forEach(seat => {
    seat.addEventListener('click', function () {
      if (seat.classList.contains('sold')) return; // Skip sold seats

      const zone = seat.getAttribute('data-zone');
      const col = parseInt(seat.getAttribute('data-index'));
      const row = parseInt(seat.getAttribute('data-row'));

      // Toggle selection for only the clicked seat.
      const exists = selectedSeats.find(s => s.row === row && s.col === col);
      if (exists) {
        deselectSeat(row, col);
      } else {
        seat.classList.add('selected');
        selectedSeats.push({ row: row, col: col, zone: zone });
      }
      updatePopup();
    });
  });

  // When the Buy Selected button is clicked, redirect to /payment with the seats and eventId.
  buyBtn.addEventListener('click', function () {
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }
    // Get the eventId from the data attribute on the event-page container.
    const eventId = document.querySelector('.event-page').dataset.eventid;
    // Format selected seats as a string "row-seat,row-seat,..."
    const seatsParam = selectedSeats.map(seat => `${seat.row}-${seat.col}`).join(',');
    window.location.href = `/payment?seats=${encodeURIComponent(seatsParam)}&eventId=${encodeURIComponent(eventId)}`;
  });
});