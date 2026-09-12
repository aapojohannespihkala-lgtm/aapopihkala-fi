export type HslVehiclePosition = {
  routeId: string;
  directionId: number | null;
  startDate: string;
  startTime: string;
  latitude: number;
  longitude: number;
  bearing: number | null;
  speedMetersPerSecond: number | null;
  timestamp: number | null;
  stopId: string;
  currentStopSequence: number | null;
  currentStatus: 'INCOMING_AT' | 'STOPPED_AT' | 'IN_TRANSIT_TO';
  vehicleId: string;
};

type Reader = {
  bytes: Uint8Array;
  offset: number;
};

type TripDescriptor = {
  routeId: string;
  directionId: number | null;
  startDate: string;
  startTime: string;
};

type Position = {
  latitude: number;
  longitude: number;
  bearing: number | null;
  speedMetersPerSecond: number | null;
};

const decoder = new TextDecoder();

const ensureRemaining = (reader: Reader, count: number) => {
  if (count < 0 || reader.offset + count > reader.bytes.length) {
    throw new Error('Invalid GTFS-RT payload');
  }
};

const readVarint = (reader: Reader) => {
  let result = 0;
  let multiplier = 1;

  for (let index = 0; index < 10; index += 1) {
    ensureRemaining(reader, 1);
    const byte = reader.bytes[reader.offset];
    reader.offset += 1;
    result += (byte & 0x7f) * multiplier;

    if ((byte & 0x80) === 0) return result;
    multiplier *= 128;
  }

  throw new Error('Invalid GTFS-RT varint');
};

const readLengthDelimited = (reader: Reader) => {
  const length = readVarint(reader);
  ensureRemaining(reader, length);
  const value = reader.bytes.subarray(reader.offset, reader.offset + length);
  reader.offset += length;
  return value;
};

const readString = (reader: Reader) => decoder.decode(readLengthDelimited(reader));

const readFloat32 = (reader: Reader) => {
  ensureRemaining(reader, 4);
  const view = new DataView(
    reader.bytes.buffer,
    reader.bytes.byteOffset + reader.offset,
    4
  );
  const value = view.getFloat32(0, true);
  reader.offset += 4;
  return value;
};

const skipField = (reader: Reader, wireType: number) => {
  if (wireType === 0) {
    readVarint(reader);
    return;
  }

  if (wireType === 1) {
    ensureRemaining(reader, 8);
    reader.offset += 8;
    return;
  }

  if (wireType === 2) {
    const length = readVarint(reader);
    ensureRemaining(reader, length);
    reader.offset += length;
    return;
  }

  if (wireType === 5) {
    ensureRemaining(reader, 4);
    reader.offset += 4;
    return;
  }

  throw new Error('Unsupported GTFS-RT wire type');
};

const parseTripDescriptor = (bytes: Uint8Array): TripDescriptor | null => {
  const reader: Reader = { bytes, offset: 0 };
  let routeId = '';
  let directionId: number | null = null;
  let startDate = '';
  let startTime = '';

  while (reader.offset < reader.bytes.length) {
    const key = readVarint(reader);
    const field = Math.floor(key / 8);
    const wireType = key & 7;

    if (field === 2 && wireType === 2) {
      startTime = readString(reader);
    } else if (field === 3 && wireType === 2) {
      startDate = readString(reader);
    } else if (field === 5 && wireType === 2) {
      routeId = readString(reader);
    } else if (field === 6 && wireType === 0) {
      directionId = readVarint(reader);
    } else {
      skipField(reader, wireType);
    }
  }

  if (!routeId || !startDate || !startTime) return null;
  return { routeId, directionId, startDate, startTime };
};

const parsePosition = (bytes: Uint8Array): Position | null => {
  const reader: Reader = { bytes, offset: 0 };
  let latitude: number | null = null;
  let longitude: number | null = null;
  let bearing: number | null = null;
  let speedMetersPerSecond: number | null = null;

  while (reader.offset < reader.bytes.length) {
    const key = readVarint(reader);
    const field = Math.floor(key / 8);
    const wireType = key & 7;

    if (field === 1 && wireType === 5) {
      latitude = readFloat32(reader);
    } else if (field === 2 && wireType === 5) {
      longitude = readFloat32(reader);
    } else if (field === 3 && wireType === 5) {
      bearing = readFloat32(reader);
    } else if (field === 5 && wireType === 5) {
      speedMetersPerSecond = readFloat32(reader);
    } else {
      skipField(reader, wireType);
    }
  }

  if (latitude === null || longitude === null) return null;
  return { latitude, longitude, bearing, speedMetersPerSecond };
};

const parseVehicleDescriptor = (bytes: Uint8Array) => {
  const reader: Reader = { bytes, offset: 0 };
  let vehicleId = '';

  while (reader.offset < reader.bytes.length) {
    const key = readVarint(reader);
    const field = Math.floor(key / 8);
    const wireType = key & 7;

    if (field === 1 && wireType === 2) {
      vehicleId = readString(reader);
    } else {
      skipField(reader, wireType);
    }
  }

  return vehicleId;
};

const currentStatusName = (value: number) => {
  if (value === 0) return 'INCOMING_AT' as const;
  if (value === 1) return 'STOPPED_AT' as const;
  return 'IN_TRANSIT_TO' as const;
};

const parseVehiclePosition = (bytes: Uint8Array): HslVehiclePosition | null => {
  const reader: Reader = { bytes, offset: 0 };
  let trip: TripDescriptor | null = null;
  let position: Position | null = null;
  let currentStopSequence: number | null = null;
  let currentStatus = 2;
  let timestamp: number | null = null;
  let stopId = '';
  let vehicleId = '';

  while (reader.offset < reader.bytes.length) {
    const key = readVarint(reader);
    const field = Math.floor(key / 8);
    const wireType = key & 7;

    if (field === 1 && wireType === 2) {
      trip = parseTripDescriptor(readLengthDelimited(reader));
    } else if (field === 2 && wireType === 2) {
      position = parsePosition(readLengthDelimited(reader));
    } else if (field === 3 && wireType === 0) {
      currentStopSequence = readVarint(reader);
    } else if (field === 4 && wireType === 0) {
      currentStatus = readVarint(reader);
    } else if (field === 5 && wireType === 0) {
      timestamp = readVarint(reader);
    } else if (field === 7 && wireType === 2) {
      stopId = readString(reader);
    } else if (field === 8 && wireType === 2) {
      vehicleId = parseVehicleDescriptor(readLengthDelimited(reader));
    } else {
      skipField(reader, wireType);
    }
  }

  if (!trip || !position) return null;

  return {
    ...trip,
    ...position,
    timestamp,
    stopId,
    currentStopSequence,
    currentStatus: currentStatusName(currentStatus),
    vehicleId,
  };
};

const parseFeedEntity = (bytes: Uint8Array) => {
  const reader: Reader = { bytes, offset: 0 };
  let vehicle: HslVehiclePosition | null = null;

  while (reader.offset < reader.bytes.length) {
    const key = readVarint(reader);
    const field = Math.floor(key / 8);
    const wireType = key & 7;

    if (field === 4 && wireType === 2) {
      vehicle = parseVehiclePosition(readLengthDelimited(reader));
    } else {
      skipField(reader, wireType);
    }
  }

  return vehicle;
};

export const parseHslVehiclePositions = (buffer: ArrayBuffer) => {
  const reader: Reader = { bytes: new Uint8Array(buffer), offset: 0 };
  const vehicles: HslVehiclePosition[] = [];

  try {
    while (reader.offset < reader.bytes.length) {
      const key = readVarint(reader);
      const field = Math.floor(key / 8);
      const wireType = key & 7;

      if (field === 2 && wireType === 2) {
        const vehicle = parseFeedEntity(readLengthDelimited(reader));
        if (vehicle) vehicles.push(vehicle);
      } else {
        skipField(reader, wireType);
      }
    }
  } catch {
    return [];
  }

  return vehicles;
};
