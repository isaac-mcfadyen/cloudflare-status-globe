import axios from 'axios';

export const fetchLocations = async () => {
	// Declare regexes.
	const validColoRegex = /\- \((.*)\)/gm;
	const iataRegex = /\((.*)\)/gm;

	// Get the locations.
	const statusResponse = await axios.get('https://www.cloudflarestatus.com/api/v2/summary.json');
	const speedResponse = await axios.get('https://speed.cloudflare.com/locations');

	// Filter the statusLocations, getting their info.
	const statusLocations = statusResponse.data.components.filter((location) =>
		location.name.match(validColoRegex)
	);

	// Map the locations.
	const mappedLocations = statusLocations.map((location) => {
		// Get the IATA.
		const iata = location.name.match(iataRegex)[0].replace(/\(|\)/g, '');

		// Find this DC in the speedResponse.
		const speedLocation = speedResponse.data.find((speedLocation) => speedLocation.iata === iata);
		console.log(speedLocation);

		return {
			iata: iata,
			status: location.status,
			...speedLocation
		};
	});

	return mappedLocations;
};
