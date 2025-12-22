export default async function handler(req, res) {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: "Invalid lat/lng" });
    }

    const key = process.env.SOLAR_API_KEY;
    if (!key) {
      return res.status(500).json({ error: "Missing SOLAR_API_KEY" });
    }

    const url =
      "https://solar.googleapis.com/v1/buildingInsights:findClosest" +
      `?location.latitude=${lat}&location.longitude=${lng}` +
      `&key=${key}`;

    const r = await fetch(url);
    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json(data);
    }

    const segs = data?.solarPotential?.roofSegmentStats || [];
    let best = null;
    for (const s of segs) {
      if (!best || (s.stats?.areaMeters2 ?? 0) > (best.stats?.areaMeters2 ?? 0)) {
        best = s;
      }
    }

    res.json({
      recommended: {
        azimuthDegFromNorth:
          best?.stats?.azimuthDegrees ??
          best?.azimuthDegrees ??
          null,
        tiltDeg:
          best?.stats?.pitchDegrees ??
          best?.pitchDegrees ??
          null
      }
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
