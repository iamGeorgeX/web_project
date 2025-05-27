document.addEventListener("DOMContentLoaded", () => {
  // Get the dropdown elements by their IDs.
  const citySelect = document.getElementById('city');
  const spaceSelect = document.getElementById('event-space');
  
  if (!citySelect || !spaceSelect) {
    console.error("City or space dropdown not found.");
    return;
  }
  
  // Reset all space options.
  function resetSpaceOptions() {
    Array.from(spaceSelect.options).forEach(option => {
      if (option.dataset.city) {
        option.style.display = '';
      }
    });
  }
  
  // Filter the space dropdown based on the selected city.
  function filterSpacesByCity(selectedCity) {
    resetSpaceOptions();
    Array.from(spaceSelect.options).forEach(option => {
      // Skip the placeholder (no data-city).
      if (!option.dataset.city) return;
      if (option.dataset.city !== selectedCity) {
        option.style.display = 'none';
      }
    });
    // Auto-select if exactly one visible space remains.
    const visibleOptions = Array.from(spaceSelect.options)
      .filter(opt => opt.style.display !== 'none' && opt.value);
    if (visibleOptions.length === 1) {
      spaceSelect.value = visibleOptions[0].value;
    } else {
      spaceSelect.value = '';
    }
  }
  
  // When the city changes, filter the space list.
  citySelect.addEventListener('change', () => {
    const selectedCity = citySelect.value;
    console.log("City selected:", selectedCity);
    if (selectedCity) {
      filterSpacesByCity(selectedCity);
    } else {
      resetSpaceOptions();
      spaceSelect.value = '';
    }
  });
  
  // When the space changes, update the city.
  spaceSelect.addEventListener('change', () => {
    const selectedOption = spaceSelect.options[spaceSelect.selectedIndex];
    if (selectedOption && selectedOption.dataset.city) {
      const cityFromSpace = selectedOption.dataset.city;
      console.log("Space selected:", selectedOption.value, "belongs to city", cityFromSpace);
      if (citySelect.value !== cityFromSpace) {
        citySelect.value = cityFromSpace;
        filterSpacesByCity(cityFromSpace);
      }
    }
  });
});

