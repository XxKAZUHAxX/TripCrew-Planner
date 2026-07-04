import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface LatLng {
    lat: number;
    lng: number;
}

// A self-contained SVG pin so we don't rely on Leaflet's default PNG assets
// (which break under the bundler without extra image-import wiring).
const pinIcon = L.divIcon({
    className: 'border-0 bg-transparent',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#ef4444" stroke="#fff" stroke-width="1.5"><path d="M12 21s-6-5.686-6-10a6 6 0 1 1 12 0c0 4.314-6 10-6 10z"/><circle cx="12" cy="11" r="2.5" fill="#fff" stroke="none"/></svg>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
});

// Default view (roughly the center of the Philippines) when no pin is set yet.
const DEFAULT_CENTER: [number, number] = [12.8797, 121.774];

interface DestinationMapProps {
    location: LatLng | null;
    /** When true, clicking the map drops/moves the pin via onPick. */
    editable?: boolean;
    onPick?: (loc: LatLng) => void;
}

function ClickHandler({ onPick }: { onPick: (loc: LatLng) => void }) {
    useMapEvents({
        click(e) {
            onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });
    return null;
}

export default function DestinationMap({ location, editable = false, onPick }: DestinationMapProps) {
    const center: [number, number] = location ? [location.lat, location.lng] : DEFAULT_CENTER;
    const zoom = location ? 11 : 5;

    return (
        <div className="overflow-hidden rounded-md border">
            <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="h-56 w-full">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {editable && onPick && <ClickHandler onPick={onPick} />}
                {location && <Marker position={[location.lat, location.lng]} icon={pinIcon} />}
            </MapContainer>
            {editable && (
                <p className="bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                    {location ? 'Click the map to move the pin.' : 'Click the map to drop a pin.'}
                </p>
            )}
        </div>
    );
}
