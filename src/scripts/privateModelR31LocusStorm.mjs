// Locus municipal stormwater sewer (xp_sadevesiviemäri, Laji 98550002) and its
// flow-direction marks (xp_virt.viiva sadevesi, Laji 9990013) from the original
// 24.9.2026 Locus Cloud Shape export (Drive 1QkN0jdBeDWeaYHKekBE2H7YrHD0R2ubF,
// ZIP sha256 368798aedff0a61795e6272cb35e7daeb0c48382f649f2b7ac7fc3a59cb90254,
// export_shape_line records below). EPSG:3879 -> YLIS-G1 local X/Y with the
// similarity fitted on the 22 fibre records already bound to G1 (rotation
// 21.73 deg, scale 1.0000005, max residual 0.5 mm). 2D only: no Z, no house or
// plot connection in the source. Nearest line to the plot polygon (Locus area
// 16512001, 1262.7 m2): 42.0 m. Network: records 34/36/37 (D300, 1970, owner
// code 101) meet at one exact node ~52 m west of the house; 48 (D315, 2016,
// owner 0) ends 0.29 m from line 34 without a shared source vertex (topology
// not proven); 35 is a separate NE segment.
// XML identities (Locus XML 1u9uS4NoPDWuJPALQd8SIx4veUEmIqJZj, ClassId 98550002,
// 11 source segments; mapping read by ChatGPT 23.11.2026, every ID confirmed
// present in the XML by Drive full-text search; XML geometry not re-read here:
// the 20 MB file is over the connector download limit). XML Z is not used.
export const R31_LOCUS_STORM_SOURCE = Object.freeze({
  driveId: '1QkN0jdBeDWeaYHKekBE2H7YrHD0R2ubF',
  zipSha256: '368798aedff0a61795e6272cb35e7daeb0c48382f649f2b7ac7fc3a59cb90254',
  laji: 98550002, flowLaji: 9990013, zState: 'UNRESOLVED', plotConnection: 'NONE_IN_SOURCE',
  nearestPlotDistanceM: 42.0, nearestBuildingFootprintDistanceM: 52.29,
  xmlDriveId: '1u9uS4NoPDWuJPALQd8SIx4veUEmIqJZj', xmlCounterpart: 'IDS_PRESENT_GEOMETRY_NOT_RECHECKED',
});
export const R31_LOCUS_STORM_LINES = Object.freeze([{"record":34,"name":"STORM_SHAPE_LINE_034","diameterMm":300,"buildYear":1970,"materialCode":4,"ownerCode":101,"flowCode":0,"lengthM":35.647,"parcelDistM":45.63,"points":[[-108.772,-35.328],[-78.378,-17.481],[-67.413,-11.031],[-60.599,-6.499],[-52.292,-2.209]],"xmlIds":[272527,272528,272529,272530],"topology":"SHARED_NODE_34_36_37"},{"record":35,"name":"STORM_SHAPE_LINE_035","diameterMm":0,"buildYear":0,"materialCode":0,"ownerCode":101,"flowCode":2,"lengthM":20.397,"parcelDistM":62.9,"points":[[51.739,79.238],[57.539,77.025],[61.149,81.907]],"xmlIds":[272255,272254],"topology":"SEPARATE_NE_SEGMENT"},{"record":36,"name":"STORM_SHAPE_LINE_036","diameterMm":300,"buildYear":1970,"materialCode":4,"ownerCode":101,"flowCode":0,"lengthM":35.201,"parcelDistM":45.63,"points":[[-63.036,33.503],[-54.59,6.303],[-52.292,-2.209]],"xmlIds":[272519,272520],"topology":"SHARED_NODE_34_36_37"},{"record":37,"name":"STORM_SHAPE_LINE_037","diameterMm":300,"buildYear":1970,"materialCode":4,"ownerCode":101,"flowCode":2,"lengthM":43.67,"parcelDistM":42.0,"points":[[-30.758,-81.056],[-39.216,-49.354],[-52.292,-2.209]],"xmlIds":[272522,272521],"topology":"SHARED_NODE_34_36_37"},{"record":48,"name":"STORM_SHAPE_LINE_048","diameterMm":315,"buildYear":2016,"materialCode":2,"ownerCode":0,"flowCode":2,"lengthM":6.14,"parcelDistM":60.83,"points":[[-67.54,-10.766],[-71.318,-5.926]],"xmlIds":[9755780],"topology":"ENDS_0.29M_FROM_34_NO_SHARED_VERTEX"}]);
export const R31_LOCUS_STORM_FLOW_MARKS = Object.freeze([{"record":206,"name":"STORM_FLOW_MARK_206","points":[[-33.592,-70.432],[-33.157,-68.316]]},{"record":207,"name":"STORM_FLOW_MARK_207","points":[[-45.754,-25.782],[-45.339,-23.662]]},{"record":208,"name":"STORM_FLOW_MARK_208","points":[[-59.808,23.106],[-59.458,25.238]]},{"record":211,"name":"STORM_FLOW_MARK_211","points":[[-72.896,-14.256],[-75.051,-14.403]]},{"record":212,"name":"STORM_FLOW_MARK_212","points":[[-93.699,-26.477],[-95.854,-26.623]]}]);
