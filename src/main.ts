import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./index.css";
import { effect, signal } from "@preact/signals";
import { execQuery } from "./db/browser";

// L.Icon.Default.imagePath = "img/icon/";

const options: PositionOptions = {
	enableHighAccuracy: true,
	// maximumAge: 30000,
	timeout: 27000,
};

const gpsSignal = signal<GeolocationCoordinates | null>(null);

const map = L.map("app", {
	// center bengaluru
	center: [12.9542802, 77.4661305],
	zoom: 12,
	zoomControl: true,
});

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
	crossOrigin: true,
	maxZoom: 19,
	attribution:
		'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

L.control
	.scale({
		imperial: false,
		maxWidth: 300,
	})
	.addTo(map);

let myMarker: L.Marker | null = null;

effect(() => {
	if (gpsSignal.value === null) {
		return;
	}

	const { latitude, longitude } = gpsSignal.value;

	if (myMarker === null) {
		myMarker = L.marker([
			gpsSignal.value.latitude,
			gpsSignal.value.longitude,
		]).addTo(map);
	}

	myMarker.setLatLng({
		lat: latitude,
		lng: longitude,
	});

	execQuery({
		type: "closest-route",
		lat: latitude,
		long: longitude,
	}).then(console.log);
});

navigator.geolocation.getCurrentPosition(
	({ coords }) => {
		if (myMarker === null) {
			myMarker = L.marker([coords.latitude, coords.longitude]).addTo(map);
		}
		map.zoomIn(5).flyTo({
			lat: coords.latitude,
			lng: coords.longitude,
		});
	},
	(error) => {
		console.log("ERROR", error);
	},
	options,
);

navigator.geolocation.watchPosition(
	({ coords }) => {
		gpsSignal.value = coords;
	},
	(error) => {
		console.log("ERROR", error);
	},
	options,
);
