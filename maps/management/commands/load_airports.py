import csv
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from maps.models import Airport

class Command(BaseCommand):
    help = "Load airports from OurAirports CSV"

    def add_arguments(self, parser):
        parser.add_argument(
            "csv_file",
            type=str,
            help="Path to airports.csv (from OurAirports)"
        )

    def handle(self, *args, **options):
        csv_file = options["csv_file"]

        with open(csv_file, newline='', encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0

            for row in reader:
                if not row.get("iata_code"):
                    continue  # skip small/private airports

                try:
                    lat = float(row["latitude_deg"])
                    lon = float(row["longitude_deg"])
                except (TypeError, ValueError):
                    continue

                Airport.objects.update_or_create(
                    iata_code=row["iata_code"].strip(),
                    defaults={
                        "name": row["name"].strip(),
                        "city": row["municipality"].strip() if row["municipality"] else "",
                        "country": row["iso_country"].strip(),
                        "geom": Point(lon, lat, srid=4326),
                        "altitude_ft": int(row["elevation_ft"]) if row["elevation_ft"] else None,
                    },
                )
                count += 1

        self.stdout.write(self.style.SUCCESS(f"✅ Loaded {count} airports"))
