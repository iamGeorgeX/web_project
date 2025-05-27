document.addEventListener('DOMContentLoaded', function () {
  // Get pricing data from the hidden price-legend element.
  const priceLegend = document.getElementById('price-legend');
  let pricesStr = (priceLegend && priceLegend.dataset.prices) ? priceLegend.dataset.prices : '{}';
  let zonePrices = {};
  try {
    zonePrices = JSON.parse(pricesStr);
  } catch (err) {
    console.error("Error parsing zone prices:", err);
  }
  console.log("zonePrices:", zonePrices);
  
  // Helper: determine zone from seat row.
  function getZone(row) {
    if (row <= 3) return "ZoneA";
    else if (row <= 6) return "ZoneB";
    else return "ZoneC";
  }
  
  // Read the hidden seats input (e.g., "1-2,1-3")
  const seatsInputEl = document.querySelector('input[name="seats"]');
  const seatsInput = seatsInputEl ? seatsInputEl.value : '';
  console.log("seatsInput:", seatsInput);
  
  const seatArr = seatsInput ? seatsInput.split(',').filter(s => s.trim() !== '') : [];
  console.log("seatArr:", seatArr);
  
  let totalCost = 0;
  // Calculate cost per seat.
  seatArr.forEach(seatStr => {
    const parts = seatStr.split('-');
    if (parts.length < 2) return;
    const row = parseInt(parts[0], 10);
    const zone = getZone(row);
    const priceForZone = zonePrices[zone] ? parseFloat(zonePrices[zone]) : 0;
    console.log("Seat:", seatStr, "-> row:", row, "zone:", zone, "price:", priceForZone);
    totalCost += priceForZone;
  });
  
  // Create or update the total cost element using the same styling as .selected-seats li
  let totalCostEl = document.getElementById('total-cost');
  if (!totalCostEl) {
    totalCostEl = document.createElement('div');
    totalCostEl.id = 'total-cost';
    // Apply the same style as defined in your CSS for .selected-seats li
    totalCostEl.style.document.addEventListener('DOMContentLoaded', function () {
  // Get pricing data from the hidden price-legend element.
  const priceLegend = document.getElementById('price-legend');
  let pricesStr = (priceLegend && priceLegend.dataset.prices) ? priceLegend.dataset.prices : '{}';
  let zonePrices = {};
  try {
    zonePrices = JSON.parse(pricesStr);
  } catch (err) {
    console.error("Error parsing zone prices:", err);
  }
  console.log("zonePrices:", zonePrices);
  
  // Helper: determine zone from seat row.
  function getZone(row) {
    if (row <= 3) return "ZoneA";
    else if (row <= 6) return "ZoneB";
    else return "ZoneC";
  }
  
  // Read the hidden seats input (e.g., "1-2,1-3")
  const seatsInputEl = document.querySelector('input[name="seats"]');
  const seatsInput = seatsInputEl ? seatsInputEl.value : '';
  console.log("seatsInput:", seatsInput);
  
  const seatArr = seatsInput ? seatsInput.split(',').filter(s => s.trim() !== '') : [];
  console.log("seatArr:", seatArr);
  
  let totalCost = 0;
  // Calculate cost per seat.
  seatArr.forEach(seatStr => {
    const parts = seatStr.split('-');
    if (parts.length < 2) return;
    const row = parseInt(parts[0], 10);
    const zone = getZone(row);
    const priceForZone = zonePrices[zone] ? parseFloat(zonePrices[zone]) : 0;
    console.log("Seat:", seatStr, "-> row:", row, "zone:", zone, "price:", priceForZone);
    totalCost += priceForZone;
  });
  
  // Create or update the total cost element using the same styling as .selected-seats li
  let totalCostEl = document.getElementById('total-cost');
  if (!totalCostEl) {
    totalCostEl = document.createElement('div');
    totalCostEl.id = 'total-cost';
    // Apply the same style as defined in your CSS for .selected-seats li
    totalCostEl.style.padding = '8px 12px';
    totalCostEl.style.marginBottom = '6px';
    totalCostEl.style.borderRadius = '4px';
    totalCostEl.style.fontSize = '1.1rem';
    // If you want a matching background color (like your list items), you can set it here:
    totalCostEl.style.backgroundColor = '#e0e0e0';
    
    // Insert the total cost element above the form.
    const container = document.querySelector('.payment-container');
    const form = container.querySelector('form');
    container.insertBefore(totalCostEl, form);
  }
  totalCostEl.textContent = 'Total Cost: $' + totalCost;
  console.log("Total cost calculated:", totalCostEl.textContent);
});;
    totalCostEl.style.marginBottom = '6px';
    totalCostEl.style.borderRadius = '4px';
    totalCostEl.style.fontSize = '1.1rem';
    // If you want a matching background color (like your list items), you can set it here:
    totalCostEl.style.backgroundColor = '#e0e0e0';
    totalCostEl.style.textAlign = 'right';
    
    // Insert the total cost element above the form.
    const container = document.querySelector('.payment-container');
    const form = container.querySelector('form');
    container.insertBefore(totalCostEl, form);
  }
  totalCostEl.textContent = 'Total Cost: $' + totalCost;
  console.log("Total cost calculated:", totalCostEl.textContent);
});