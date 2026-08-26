import { MapInfoTile } from "@/components/about/MapInfoTile";
import { cn } from "@/lib/cn";
import {
    BusFrontIcon,
    ClockIcon,
    MapPinIcon,
    MapPinnedIcon,
    PhoneIcon,
    TrainFrontIcon,
} from "lucide-react";

const MAPS_URL =
    "https://www.google.com/maps/dir/?api=1&destination=32%2F82+Soi+Sua+Yai+Utit%2C+Chatuchak%2C+Bangkok+10900";

const EMBED_SRC =
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3873.8!2d100.5528!3d13.8234!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDQ5JzI0LjMiTiAxMDDCsDMzJzEwLjEiRQ!5e0!3m2!1sen!2sth!4v1700000000000";

export interface MapEmbedProps {
    className?: string;
}

export function MapEmbed({ className }: MapEmbedProps) {
    const iconClass = "h-5 w-5 text-primary-700";

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            <h2 className="font-display text-h3 font-semibold text-neutral-ink">
                Find us
            </h2>

            {/* Map iframe */}
            <div className="relative overflow-hidden rounded-xl border border-neutral-line">
                <iframe
                    src={EMBED_SRC}
                    width="100%"
                    height="240"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="MiTR Journey Studio location"
                    className="block"
                    allowFullScreen
                />
            </div>

            {/* Info tiles */}
            <div className="grid grid-cols-2 gap-3">
                <MapInfoTile
                    icon={<MapPinIcon strokeWidth={1.75} className={iconClass} />}
                    label="Address (TH)"
                >
                    <p className="text-primary-700">
                        32/109 ซอยเสือใหญ่อุทิศ แขวงจันทรเกษม เขตจตุจักร กรุงเทพ 10900
                    </p>
                </MapInfoTile>
                <MapInfoTile
                    icon={<MapPinIcon strokeWidth={1.75} className={iconClass} />}
                    label="Address (EN)"
                >
                    32/109 Soi Sua Yai Utit, Chankasem, Chatuchak, Bangkok 10900
                </MapInfoTile>
                <MapInfoTile
                    icon={<ClockIcon strokeWidth={1.75} className={iconClass} />}
                    label="Opening hours"
                >
                    6:00 AM – 9:00 PM daily
                </MapInfoTile>
                <MapInfoTile
                    icon={<PhoneIcon strokeWidth={1.75} className={iconClass} />}
                    label="Phone"
                >
                    <p>
                        <a
                            href="tel:0896402121"
                            className="text-primary-700 hover:underline"
                        >
                            089-640-2121
                        </a>{" "}
                        (Nus)
                    </p>
                    <p>
                        <a
                            href="tel:0956866966"
                            className="text-primary-700 hover:underline"
                        >
                            095-686-6966
                        </a>{" "}
                        (Bo)
                    </p>
                </MapInfoTile>
                <MapInfoTile
                    icon={
                        <TrainFrontIcon
                            strokeWidth={1.75}
                            className={iconClass}
                        />
                    }
                    label="MRT (nearest station)"
                >
                    <p>
                        <span className="inline-block rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white">
                            Blue Line
                        </span>{" "}
                        Lat Phrao
                    </p>
                    <p className="mt-1">
                        <span className="inline-block rounded-full bg-yellow-400 px-2 py-0.5 text-[11px] font-bold text-gray-900">
                            Yellow Line
                        </span>{" "}
                        Lat Phrao
                    </p>
                    <p className="mt-1 text-neutral-text-2">
                        ~10 min walk / grab from station
                    </p>
                </MapInfoTile>
                <MapInfoTile
                    icon={<BusFrontIcon strokeWidth={1.75} className={iconClass} />}
                    label="Bus stop"
                >
                    <p className="font-semibold">
                        คปภ. (Office of Insurance Commission)
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                        {["123", "136", "178", "179", "191", "206", "529"].map(
                            (n) => (
                                <span
                                    key={n}
                                    className="rounded-full bg-amber-100 px-2 py-0.5 font-sans text-[11px] font-semibold text-amber-800"
                                >
                                    {n}
                                </span>
                            ),
                        )}
                    </div>
                </MapInfoTile>
            </div>

            <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 font-sans text-body font-semibold text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
                <MapPinnedIcon
                    strokeWidth={1.75}
                    className="h-4 w-4"
                    aria-hidden
                />
                Open in Google Maps
            </a>
        </div>
    );
}
