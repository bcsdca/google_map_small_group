function updateDistanceTime(GROUP_NAME) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(GROUP_NAME);
  let data = sheet.getDataRange().getValues();
  const stored = PropertiesService.getScriptProperties().getProperty(GROUP_NAME);
  const originalData = stored ? JSON.parse(stored) : [];
  let updatedOriginalData = [...originalData];

  const locations = [];
  
  const ui = SpreadsheetApp.getUi();
  const hostRows = data
    .map((row, index) => row[0] === true ? index : -1)
    .filter(index => index !== -1);

  if (hostRows.length === 0) {
    Logger.log("No host found. Exiting.");
    ui.alert("❗❗❗ Aborting, NO host was selected.\n\nPlease make sure only one checkbox is checked in column A.");
    //SpreadsheetApp.getActive().toast("❗ No host selected. Please select one host (checkbox = TRUE) in column A.");
    return;
  }

  if (hostRows.length > 1) {
    Logger.log("More than one host found. Aborting.");
    ui.alert("❗❗❗ Aborting, Multiple hosts selected.\n\nPlease make sure only one checkbox is checked in column A.");
    //SpreadsheetApp.getActive().toast("❗ Multiple hosts selected. Please uncheck extras.");
    return;
  }

  const hostRow = hostRows[0];
  
  let hostLat = null, hostLng = null;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const initials = row[1];
    let address = row[2];
    let lat = row[3];
    let lng = row[4];

    if (!initials || !address) {
      Logger.log(`Skipping row ${i + 1} because initials or address is missing.`);
      continue;
    }

    // Generate fake address only if IsObfuscated is true and lat/lng is missing
    if (!lat || !lng) {
      if (IsObfuscated) {
        const realAddress = address;
        const geoResult = geocodeAddress(realAddress);
        if (geoResult) {
          const [realLat, realLng] = geoResult;
          const [fakeLat, fakeLng] = randomNearbyCoordinates(realLat, realLng, SEARCH_RADIUS);
          const fakeAddress = reverseGeocode(fakeLat, fakeLng);

          address = fakeAddress;
          lat = fakeLat;
          lng = fakeLng;

          Logger.log(`Real Address ${realAddress} is converted to fake address ${fakeAddress}, on row ${i + 1}`);

          // Save to sheet
          sheet.getRange(i + 1, 3).setValue(fakeAddress);
          sheet.getRange(i + 1, 4).setValue(lat);
          sheet.getRange(i + 1, 5).setValue(lng);

          // Save original data only if this initials is not already stored
          const alreadyStored = originalData.some(entry => entry.name === initials);
          if (!alreadyStored) {
            updatedOriginalData.push({ name: initials, address: realAddress });
            Utilities.sleep(1000); // To avoid rate limiting
          }

        }
      } else {
        // Skip fake generation: use the real address and try geocode only if lat/lng is missing
        const geoResult = geocodeAddress(address);
        if (geoResult) {
          const [realLat, realLng] = geoResult;
          lat = realLat;
          lng = realLng;

          sheet.getRange(i + 1, 4).setValue(lat);
          sheet.getRange(i + 1, 5).setValue(lng);
        }
      }
    }


    if (i === hostRow) {
      hostLat = lat;
      hostLng = lng;
      Logger.log(`Finding the Host ${row[1]} on row ${i + 1}`);
    }

    locations.push({ name: initials, address, lat, lng });
  }

  // Save original data only if new entries were added
  if (updatedOriginalData.length > originalData.length) {
    PropertiesService.getScriptProperties().setProperty(GROUP_NAME, JSON.stringify(updatedOriginalData));
  }

  // Clear distance and time columns before recalculation
  clearDistanceAndDuration(sheet, data);

  // Re-read data after updating fake addresses
  data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const initials = data[i][1];
    let address = data[i][2];
    const lat = data[i][3];
    const lng = data[i][4];

    if (!initials || !address) {
      Logger.log(`Skipping row ${i + 1} because initials or address is missing.`);
      continue;
    }

    if (lat && lng) {
      let distance = 0;
      let duration = 0;

      if (i !== hostRow) {
        const result = calculateDistanceFromHost(lat, lng, hostLat, hostLng);
        distance = result.distance;
        duration = result.duration;
        Logger.log(`Setting navigating distance ${distance} miles and time ${duration} minutes from host, for member ${data[i][1]}, on row ${i + 1}`);
        Utilities.sleep(1000);  // prevent API throttling
      }

      sheet.getRange(i + 1, 6).setValue(distance); // Distance column (miles)
      sheet.getRange(i + 1, 7).setValue(duration); // Duration column (minutes)
    } else {
      sheet.getRange(i + 1, 6).setValue("N/A");
      sheet.getRange(i + 1, 7).setValue("N/A");
      Logger.log(`Missing either lat = ${lat}, or lng = ${lng}, for member ${data[i][1]}, on row ${i + 1}`);
    }
  }
}

function clearDurations(sheet, data) {
  for (let i = 1; i < data.length; i++) {
    sheet.getRange(i + 1, 7).clearContent(); // Clear duration column
  }
}

// == Geocoding ==
function geocodeAddress(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${MAPS_API_KEY}`;
  const response = UrlFetchApp.fetch(url);
  const result = JSON.parse(response.getContentText());

  if (result.status === 'OK') {
    const location = result.results[0].geometry.location;
    return [location.lat, location.lng];
  }
  return null;
}

function reverseGeocode(lat, lng) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${MAPS_API_KEY}`;
  const response = UrlFetchApp.fetch(url);
  const result = JSON.parse(response.getContentText());

  if (result.status === 'OK') {
    for (let i = 0; i < result.results.length; i++) {
      const address = result.results[i].formatted_address;

      // Skip vague/system addresses
      if (
        address.includes("+") || // Plus Code
        address.includes("Unnamed Road") ||
        address.includes("near") ||
        address.match(/^\d{4}\+.+/) // e.g. "7FG9+6X" formats
      ) {
        continue;
      }

      // Return first valid address
      return address;
    }
  }

  // Fallback if no clean address found
  return `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function randomNearbyCoordinates(lat, lng, radiusInMiles) {
  const radiusInKm = radiusInMiles * 1.60934;
  const r = radiusInKm / 111.32;
  const u = Math.random();
  const v = Math.random();
  const w = r * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const dx = w * Math.cos(t);
  const dy = w * Math.sin(t);
  const newLat = lat + dy;
  const newLng = lng + dx / Math.cos(lat * (Math.PI / 180));
  return [newLat, newLng];
}

function calculateDistanceFromHost(originLat, originLng, hostLat, hostLng) {
  if (!originLat || !originLng || !hostLat || !hostLng) {
    return { distance: 0, duration: 0 };
  }

  const origin = `${originLat},${originLng}`;
  const destination = `${hostLat},${hostLng}`;
  const distanceUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${MAPS_API_KEY}&mode=driving`;

  try {
    const response = UrlFetchApp.fetch(distanceUrl);
    const result = JSON.parse(response.getContentText());

    if (
      result.status === "OK" &&
      result.rows.length > 0 &&
      result.rows[0].elements.length > 0 &&
      result.rows[0].elements[0].status === "OK"
    ) {
      const element = result.rows[0].elements[0];
      const meters = element.distance.value;
      const seconds = element.duration.value;

      const miles = meters / 1609.34;
      const minutes = seconds / 60;

      return {
        distance: parseFloat(miles.toFixed(2)),
        duration: parseFloat(minutes.toFixed(2))
      };
    }
  } catch (e) {
    Logger.log("Error calculating distance: " + e.message);
  }

  return { distance: 0, duration: 0 };
}

function clearDistanceAndDuration(sheet, data) {
  for (let i = 1; i < data.length; i++) {
    sheet.getRange(i + 1, 6).clearContent(); // Distance column
    sheet.getRange(i + 1, 7).clearContent(); // Duration column
  }
}


